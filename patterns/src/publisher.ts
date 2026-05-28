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
    | "level2_not_eligible";
  storyId?: string;
  reason?: string;
}

async function isLevel2ObservationAlreadyPublished(
  observationSlug: string,
): Promise<boolean> {
  // Dédup stricte fondée sur l'identité documentaire stable du fait (slug
  // dérivé de match_slug + proposition_type + strict_claim_key). Toute
  // redétection du même but / carton rouge — même avec proposition_ids
  // différents ou une 3e langue — renvoie ici true et n'écrit rien.
  // En cas de course concurrente (deux workers détectent simultanément),
  // la contrainte UNIQUE published_stories.slug fait office de second
  // garde-fou : l'INSERT lève 23505 et est traité comme already_published
  // plus bas (cf. handler 23505 dans publish()).
  const { data, error } = await supabase
    .from("published_stories")
    .select("id")
    .eq("slug", observationSlug)
    .is("retracted_at", null)
    .maybeSingle();
  if (error) {
    console.error("[publisher] dedup check failed:", error.message);
    return false;
  }
  return Boolean(data?.id);
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

  if (await isLevel2ObservationAlreadyPublished(level2.slug)) {
    console.log(
      `[publisher] ALREADY_PUBLISHED — observation_slug=${level2.slug} (stable identity, skip republish)`,
    );
    return { status: "already_published" };
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

  // Identité publique stable, dérivée du fait documentaire (match canonique
  // + proposition_type + strict_claim_key). Ne dépend pas de Date.now()
  // ni des proposition_ids → collision-free et idempotent.
  const slug = level2.slug;

  // 1. Insert published_stories — methodology_version marque sans ambiguïté
  //    une observation niveau 2 rehearsal (rejetée par l'API publique si
  //    absente, cf. STORY_PUBLICATION_CONTRACT.md §7.1 / Prompt 3B fix).
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
      publication_status: "published",
      published_at: new Date().toISOString(),
      methodology_version: REHEARSAL_LEVEL2_METHODOLOGY_VERSION,
      languages: tmpl.languages,
      source_count: tmpl.source_count,
      published_by_pipeline: "auto_template_v1",
    })
    .select("id")
    .single();

  if (storyError || !storyRow) {
    // Postgres unique_violation (slug already taken). La contrainte UNIQUE
    // sur published_stories.slug (cf. supabase/migrations/202605260001 :
    // `slug text unique not null`) garantit que deux workers ne peuvent pas
    // publier deux stories pour le même fait. On traite cette collision
    // comme une redétection idempotente, pas comme une erreur.
    if (storyError?.code === "23505") {
      console.log(
        `[publisher] ALREADY_PUBLISHED (unique_violation race) — observation_slug=${slug}`,
      );
      return { status: "already_published" };
    }
    console.error("[publisher] published_stories insert failed:", storyError?.message);
    return { status: "error", reason: storyError?.message };
  }

  const storyId = storyRow.id as string;

  // 2. Insert detected_patterns avec lien vers la story
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

  // 3. Insert story_evidence — un label lisible par evidence (langue, page, heure)
  //    pour que le frontend public puisse afficher la liste des sources sans
  //    requête supplémentaire (STORY_PUBLICATION_CONTRACT.md §8.1).
  const evidenceRows = pattern.evidenceRows.map((row, idx) => ({
    story_id: storyId,
    trace_id: row.trace_id,
    evidence_type: "trace" as const,
    public_label: formatEvidenceLabel(row),
    display_order: idx,
  }));
  if (evidenceRows.length) {
    const { error: evError } = await supabase.from("story_evidence").insert(evidenceRows);
    if (evError) console.error("[publisher] story_evidence insert:", evError.message);
  }

  // 4. Mark traces as published_evidence
  await supabase
    .from("revision_traces")
    .update({ ingest_status: "published_evidence", public_status: "linked_to_story" })
    .in("id", pattern.trace_ids);

  console.log(
    `[publisher] ✅ published Level 2 observation pattern=${pattern.pattern_type} prop=${pattern.proposition_type} story_id=${storyId} slug=${slug}`,
  );
  return { status: "published", storyId };
}
