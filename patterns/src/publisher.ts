/**
 * Publisher — applique safety filters, génère la story via template,
 * insert dans detected_patterns + published_stories + story_evidence,
 * et marque les revision_traces.ingest_status='published_evidence'.
 *
 * Toute story arrive ici avec un TemplateOutput déjà généré par template
 * borné. La copy publique n'est jamais touchée par une IA.
 */

import { AUTO_PUBLICATION_ENABLED, PATTERNS_DRY_RUN, TEMPLATE_VERSION } from "./config.js";
import { runSafetyChecks } from "./safety.js";
import { supabase } from "./supabase.js";
import { generate, methodologyVersion } from "./templates.js";
import type { DetectedPattern } from "./types.js";

interface PublishResult {
  status: "published" | "blocked_safety" | "template_missing" | "dry_run" | "already_published" | "error" | "publication_disabled";
  storyId?: string;
  reason?: string;
}

async function isAlreadyPublished(pattern: DetectedPattern): Promise<boolean> {
  // Considère qu'un pattern_type sur la même clef (entity_id|article_id) avec
  // au moins une proposition en commun a déjà été publié récemment.
  const { data, error } = await supabase
    .from("detected_patterns")
    .select("proposition_ids")
    .eq("pattern_type", pattern.pattern_type)
    .not("published_story_id", "is", null);
  if (error || !data) return false;
  return data.some((row) => {
    const ids: string[] = row.proposition_ids ?? [];
    return ids.some((id) => pattern.proposition_ids.includes(id));
  });
}

export async function publish(pattern: DetectedPattern): Promise<PublishResult> {
  const tmpl = generate(pattern.pattern_type, pattern.templateContext);
  if (!tmpl) return { status: "template_missing", reason: pattern.pattern_type };

  const safety = runSafetyChecks(tmpl);

  // Dry-run : expose dans les logs ce que le moteur aurait tenté de publier, sans aucune écriture en base.
  if (PATTERNS_DRY_RUN) {
    console.log(
      `[publisher] DRY_RUN — pattern=${pattern.pattern_type} ` +
        `safety=${safety.passed ? "OK" : safety.reason} ` +
        `title="${tmpl.title}"`,
    );
    return { status: "dry_run", reason: safety.passed ? undefined : safety.reason };
  }

  if (!AUTO_PUBLICATION_ENABLED) {
    console.log(
      `[publisher] PUBLICATION DISABLED — pattern detected but AUTO_PUBLICATION_ENABLED is not true`
    );
    return { status: "publication_disabled", reason: "AUTO_PUBLICATION_ENABLED is not true" };
  }

  if (await isAlreadyPublished(pattern)) {
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

  const slug = `${tmpl.slug_seed}-${Date.now().toString(36)}`;

  // 1. Insert published_stories
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
      methodology_version: methodologyVersion(),
      languages: tmpl.languages,
      source_count: tmpl.source_count,
      published_by_pipeline: "auto_template_v1",
    })
    .select("id")
    .single();

  if (storyError || !storyRow) {
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

  // 3. Insert story_evidence pour chaque trace
  const evidenceRows = pattern.trace_ids.map((tid, idx) => ({
    story_id: storyId,
    trace_id: tid,
    evidence_type: "trace" as const,
    public_label: `Trace ${idx + 1}`,
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
    `[publisher] ✅ published pattern=${pattern.pattern_type} story_id=${storyId} slug=${slug}`,
  );
  return { status: "published", storyId };
}
