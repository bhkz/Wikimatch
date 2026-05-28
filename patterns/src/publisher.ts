/**
 * Publisher — applique safety filters, génère la story via template,
 * insert dans detected_patterns + published_stories + story_evidence,
 * et marque les revision_traces.ingest_status='published_evidence'.
 *
 * Toute story arrive ici avec un TemplateOutput déjà généré par template
 * borné. La copy publique n'est jamais touchée par une IA.
 *
 * 2026-05-28 (Prompt 3B) — la publication automatique pendant le rehearsal
 * PSG — Arsenal est limitée aux observations niveau 2 (cf.
 * docs/v2/STORY_PUBLICATION_CONTRACT.md §4 + §7.1). Tous les autres patterns
 * sont bloqués par construction même si AUTO_PUBLICATION_ENABLED=true.
 */

import {
  AUTO_PUBLICATION_ENABLED,
  PATTERNS_DRY_RUN,
  REHEARSAL_AUTO_PUBLICATION_ENABLED,
  REHEARSAL_LEVEL2_METHODOLOGY_VERSION,
  TEMPLATE_VERSION,
} from "./config.js";
import {
  ALLOWED_AUTO_PROPOSITION_TYPES,
  isForbiddenPatternType,
  isForbiddenPropositionType,
  isLevel2AutoPublishable,
} from "./rehearsalLevel2.js";
import { runSafetyChecks } from "./safety.js";
import { supabase } from "./supabase.js";
import { generate, generateLevel2Observation } from "./templates.js";
import type { DetectedPattern, EvidenceRow } from "./types.js";

interface PublishResult {
  status:
    | "published"
    | "blocked_safety"
    | "template_missing"
    | "dry_run"
    | "already_published"
    | "error"
    | "publication_disabled"
    | "manual_review_required"
    | "rehearsal_disabled"
    | "level2_not_eligible"
    | "evidence_write_failed";
  storyId?: string;
  reason?: string;
}

type ExistingObservation =
  | { kind: "none" }
  | { kind: "recoverable_draft"; id: string }
  | { kind: "already_published"; id: string };

/**
 * Cherche une story déjà connue pour ce slug d'observation.
 *
 *  - Si elle est `published` ou `corrected` (et non rétractée), on considère
 *    le fait déjà publié et on retourne `already_published`.
 *  - Si elle existe en `draft` (création précédente où l'écriture des
 *    evidences avait échoué), on retourne `recoverable_draft` pour que
 *    l'appelant complète puis bascule à `published`. Ce chemin évite le
 *    faux silence décrit dans le contrat (Prompt 3B bis).
 *  - Si elle est `retracted`, on retourne `already_published` : une
 *    rétractation est intentionnelle, le worker ne doit pas la « réparer ».
 *
 * Cette fonction est non atomique. Le garde-fou final reste la contrainte
 * UNIQUE published_stories.slug en base : si deux workers passent ici
 * simultanément, un seul INSERT en draft réussira ; l'autre verra 23505
 * et sera redirigé vers la branche « reprise » (cf. handler 23505 dans
 * `publish()`).
 */
async function findExistingObservation(
  observationSlug: string,
): Promise<ExistingObservation> {
  const { data, error } = await supabase
    .from("published_stories")
    .select("id, publication_status, retracted_at")
    .eq("slug", observationSlug)
    .maybeSingle();
  if (error) {
    console.error("[publisher] dedup check failed:", error.message);
    return { kind: "none" };
  }
  if (!data?.id) return { kind: "none" };
  if (data.retracted_at) {
    return { kind: "already_published", id: data.id as string };
  }
  if (data.publication_status === "published" || data.publication_status === "corrected") {
    return { kind: "already_published", id: data.id as string };
  }
  // "draft" (ou tout autre statut non public) → reprise possible.
  return { kind: "recoverable_draft", id: data.id as string };
}

/**
 * Écriture idempotente des preuves sur une story (en draft). Avant
 * d'insérer le nouveau lot, on supprime les rows existantes pour ce
 * story_id : c'est sans risque puisque la story n'est pas publique
 * (statut draft, masqué par RLS et par les filtres API).
 */
async function rewriteStoryEvidence(
  storyId: string,
  rows: Array<{
    story_id: string;
    trace_id: string;
    evidence_type: "trace";
    public_label: string;
    display_order: number;
  }>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { error: deleteError } = await supabase
    .from("story_evidence")
    .delete()
    .eq("story_id", storyId);
  if (deleteError) {
    return { ok: false, reason: `evidence cleanup failed: ${deleteError.message}` };
  }
  if (!rows.length) {
    return { ok: false, reason: "no evidence rows to insert" };
  }
  const { error: insertError } = await supabase.from("story_evidence").insert(rows);
  if (insertError) {
    return { ok: false, reason: `evidence insert failed: ${insertError.message}` };
  }
  return { ok: true };
}

function formatEvidenceLabel(row: EvidenceRow): string {
  const lang = (row.language_code || "").toUpperCase();
  const title = row.page_title || "Article suivi";
  let when = "";
  try {
    const d = new Date(row.revision_timestamp);
    if (!Number.isNaN(d.getTime())) {
      when = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
    }
  } catch {
    when = "";
  }
  const head = [lang, title].filter(Boolean).join(" · ");
  return when ? `${head} · ${when}` : head;
}

/**
 * Blocage par construction. Bloque par défaut TOUT pattern qui n'est pas
 * une observation niveau 2 conforme. Le publisher préfère refuser
 * publication que prendre un risque éditorial pendant le rehearsal.
 */
function manualReviewReason(pat: DetectedPattern): string | null {
  if (isForbiddenPatternType(pat.pattern_type)) {
    return `Pattern type ${pat.pattern_type} is never auto-publishable as a public story`;
  }
  if (pat.pattern_type !== "language_convergence") {
    return `Pattern type ${pat.pattern_type} is not auto-publishable during the rehearsal`;
  }
  if (pat.match_id === null || pat.match_id === undefined) {
    return "Equivalent update is not linked to one unambiguous watched match";
  }
  if (isForbiddenPropositionType(pat.proposition_type)) {
    return `proposition_type ${pat.proposition_type ?? "null"} is explicitly blocked (qualification/substitution/yellow_card/match_result/lineup_change/transfer/biographical_fact/performance/sanction/other/noise)`;
  }
  if (!pat.proposition_type || !ALLOWED_AUTO_PROPOSITION_TYPES.has(pat.proposition_type)) {
    return `proposition_type ${pat.proposition_type ?? "null"} is not in the rehearsal whitelist (goal_scored, red_card)`;
  }
  return null;
}

export async function publish(pattern: DetectedPattern): Promise<PublishResult> {
  // 1. Évaluation niveau 2 (purement fonctionnelle, sans accès DB).
  const level2 = isLevel2AutoPublishable(pattern);

  // 2. Template approprié : niveau 2 si éligible, sinon fallback historique.
  const tmpl = level2.eligible
    ? generateLevel2Observation({
        ...pattern.templateContext,
        level2_proposition_type: pattern.proposition_type ?? undefined,
        language_codes: level2.languages,
        language_codes_substantive: level2.languages,
      })
    : generate(pattern.pattern_type, pattern.templateContext);

  if (!tmpl) return { status: "template_missing", reason: pattern.pattern_type };

  const safety = runSafetyChecks(tmpl);
  const reviewReason = manualReviewReason(pattern);

  // 3. Dry-run : journalise sans rien écrire en base.
  if (PATTERNS_DRY_RUN) {
    console.log(
      `[publisher] DRY_RUN_CANDIDATE ${JSON.stringify({
        pattern_type: pattern.pattern_type,
        proposition_type: pattern.proposition_type,
        match_slug: pattern.match_slug,
        safety_passed: safety.passed,
        safety_reason: safety.reason ?? null,
        title: tmpl.title,
        excerpt: tmpl.excerpt,
        observation_text: tmpl.observation_text,
        interpretation_text: tmpl.interpretation_text,
        limitation_text: tmpl.limitation_text,
        languages: tmpl.languages,
        source_count: tmpl.source_count,
        match_id: pattern.match_id,
        level2_eligible: level2.eligible,
        level2_reason: level2.eligible === false ? level2.reason : null,
        observation_slug: level2.eligible ? level2.slug : null,
        observation_key: level2.eligible ? level2.observationKey : null,
        methodology_version: REHEARSAL_LEVEL2_METHODOLOGY_VERSION,
        manual_review_reason: reviewReason,
        automatic_publication_eligible:
          safety.passed && reviewReason === null && level2.eligible,
      })}`,
    );
    return { status: "dry_run", reason: safety.passed ? undefined : safety.reason };
  }

  // 4. Blocage explicite signaux interdits.
  if (reviewReason) {
    console.log(
      `[publisher] MANUAL_REVIEW_REQUIRED — pattern=${pattern.pattern_type} reason=${reviewReason}`,
    );
    return { status: "manual_review_required", reason: reviewReason };
  }

  // 5. Le pattern a passé manualReviewReason : il revendique le niveau 2.
  //    Si la validation niveau 2 échoue, on refuse.
  if (level2.eligible === false) {
    console.log(
      `[publisher] LEVEL2_NOT_ELIGIBLE — pattern=${pattern.pattern_type} reason=${level2.reason}`,
    );
    return { status: "level2_not_eligible", reason: level2.reason };
  }

  // 6. Verrou global.
  if (!AUTO_PUBLICATION_ENABLED) {
    console.log(
      `[publisher] PUBLICATION DISABLED — Level 2 observation detected but AUTO_PUBLICATION_ENABLED is not true`,
    );
    return { status: "publication_disabled", reason: "AUTO_PUBLICATION_ENABLED is not true" };
  }

  // 7. Kill switch rehearsal — bloque toute publication sans interrompre le worker.
  if (!REHEARSAL_AUTO_PUBLICATION_ENABLED) {
    console.log(
      `[publisher] REHEARSAL DISABLED — Level 2 observation detected but REHEARSAL_AUTO_PUBLICATION_ENABLED is not true`,
    );
    return {
      status: "rehearsal_disabled",
      reason: "REHEARSAL_AUTO_PUBLICATION_ENABLED is not true",
    };
  }

  // Identité publique stable, dérivée du fait documentaire (match canonique
  // + proposition_type + strict_claim_key). Ne dépend pas de Date.now()
  // ni des proposition_ids → collision-free et idempotent.
  const slug = level2.slug;

  // 8. Reprise possible : si une story existe déjà en draft (écriture
  //    précédente où les evidences avaient échoué), on la récupère ; sinon
  //    on l'a « déjà publiée » / « déjà rétractée » et on sort.
  const existing = await findExistingObservation(slug);
  if (existing.kind === "already_published") {
    console.log(
      `[publisher] ALREADY_PUBLISHED — observation_slug=${slug} (stable identity, skip republish)`,
    );
    return { status: "already_published", storyId: existing.id };
  }

  if (!safety.passed) {
    const { error } = await supabase.from("detected_patterns").insert({
      pattern_type: pattern.pattern_type,
      proposition_ids: pattern.proposition_ids,
      entity_id: pattern.entity_id,
      match_id: pattern.match_id,
      article_id: pattern.article_id,
      template_version: TEMPLATE_VERSION,
      safety_checks_passed: false,
      safety_checks_payload: safety.details ?? {},
      safety_blocked_reason: safety.reason ?? "unknown",
    });
    if (error) console.error("[publisher] detected_patterns insert (blocked):", error.message);
    return { status: "blocked_safety", reason: safety.reason };
  }

  // 9. Story en DRAFT (statut non public, exclu par RLS et par les filtres
  //    API — cf. v_public_stories.publication_status in ('published',
  //    'corrected')). Aucune fenêtre publique sur une story sans preuves.
  let storyId: string;
  let recovered = false;
  if (existing.kind === "recoverable_draft") {
    storyId = existing.id;
    recovered = true;
    console.log(
      `[publisher] RECOVER_DRAFT — reusing draft story_id=${storyId} slug=${slug} (previous evidence write incomplete)`,
    );
  } else {
    const { data: storyRow, error: storyError } = await supabase
      .from("published_stories")
      .insert({
        slug,
        story_type: pattern.pattern_type,
        title: tmpl.title,
        excerpt: tmpl.excerpt,
        observation_text: tmpl.observation_text,
        interpretation_text: tmpl.interpretation_text,
        limitation_text: tmpl.limitation_text,
        entity_id: pattern.entity_id,
        match_id: pattern.match_id,
        publication_status: "draft",
        published_at: null,
        methodology_version: REHEARSAL_LEVEL2_METHODOLOGY_VERSION,
        languages: tmpl.languages,
        source_count: tmpl.source_count,
        published_by_pipeline: "auto_template_v1",
      })
      .select("id")
      .single();

    if (storyError || !storyRow) {
      // 23505 = collision UNIQUE sur le slug. Cas de course : un autre
      // worker vient de créer la même story (en draft). On la retrouve
      // et on bascule en mode reprise au lieu d'échouer.
      if (storyError?.code === "23505") {
        const recheck = await findExistingObservation(slug);
        if (recheck.kind === "already_published") {
          console.log(
            `[publisher] ALREADY_PUBLISHED (unique_violation race) — observation_slug=${slug}`,
          );
          return { status: "already_published", storyId: recheck.id };
        }
        if (recheck.kind === "recoverable_draft") {
          storyId = recheck.id;
          recovered = true;
          console.log(
            `[publisher] RECOVER_DRAFT (after 23505) — reusing draft story_id=${storyId} slug=${slug}`,
          );
        } else {
          console.error("[publisher] 23505 but row vanished, slug=", slug);
          return { status: "error", reason: "unique_violation but row not found" };
        }
      } else {
        console.error("[publisher] published_stories insert failed:", storyError?.message);
        return { status: "error", reason: storyError?.message };
      }
    } else {
      storyId = storyRow.id as string;
    }
  }

  // 10. Evidences — idempotent (DELETE puis INSERT, sans risque puisque la
  //     story est en draft, donc invisible publiquement).
  const evidenceRows = pattern.evidenceRows.map((row, idx) => ({
    story_id: storyId,
    trace_id: row.trace_id,
    evidence_type: "trace" as const,
    public_label: formatEvidenceLabel(row),
    display_order: idx,
  }));
  const evidenceWrite = await rewriteStoryEvidence(storyId, evidenceRows);
  if (evidenceWrite.ok === false) {
    console.error(
      `[publisher] EVIDENCE_WRITE_FAILED — story_id=${storyId} slug=${slug} reason=${evidenceWrite.reason} (story stays in draft, will retry on next detection)`,
    );
    return { status: "evidence_write_failed", storyId, reason: evidenceWrite.reason };
  }

  // 11. Flip vers published seulement maintenant. Si l'étape 10 échouait,
  //     la story restait en draft, invisible mais réparable.
  const { error: flipError } = await supabase
    .from("published_stories")
    .update({
      publication_status: "published",
      published_at: new Date().toISOString(),
      languages: tmpl.languages,
      source_count: tmpl.source_count,
    })
    .eq("id", storyId)
    .eq("publication_status", "draft"); // garde-fou : ne pas écraser un éventuel état futur
  if (flipError) {
    console.error(
      `[publisher] FLIP_TO_PUBLISHED failed — story_id=${storyId} slug=${slug} reason=${flipError.message} (evidences écrites ; réessaiera au prochain pattern)`,
    );
    return { status: "evidence_write_failed", storyId, reason: flipError.message };
  }

  // 12. Insert detected_patterns avec lien vers la story (après flip pour
  //     que les exports analytiques ne référencent pas de story draft).
  await supabase.from("detected_patterns").insert({
    pattern_type: pattern.pattern_type,
    proposition_ids: pattern.proposition_ids,
    entity_id: pattern.entity_id,
    match_id: pattern.match_id,
    article_id: pattern.article_id,
    template_version: TEMPLATE_VERSION,
    safety_checks_passed: true,
    safety_checks_payload: {},
    published_story_id: storyId,
  });

  // 13. Mark traces as published_evidence
  await supabase
    .from("revision_traces")
    .update({ ingest_status: "published_evidence", public_status: "linked_to_story" })
    .in("id", pattern.trace_ids);

  console.log(
    `[publisher] ✅ published Level 2 observation pattern=${pattern.pattern_type} prop=${pattern.proposition_type} story_id=${storyId} slug=${slug}${recovered ? " (recovered draft)" : ""}`,
  );
  return { status: "published", storyId };
}
