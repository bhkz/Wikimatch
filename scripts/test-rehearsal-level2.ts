/**
 * Tests dry-run pour la validation niveau 2 (rehearsal PSG — Arsenal).
 *
 * Ces tests sont 100 % offline : ils ne touchent ni Supabase ni le worker.
 * Ils prouvent que le validateur isLevel2AutoPublishable et le safety filter
 * runSafetyChecks bloquent ce qu'ils doivent bloquer, et autorisent ce qu'ils
 * doivent autoriser.
 *
 * Run :  npx tsx scripts/test-rehearsal-level2.ts
 */

import { runSafetyChecks } from "../patterns/src/safety.js";
import {
  isLevel2AutoPublishable,
  type Level2Result,
} from "../patterns/src/rehearsalLevel2.js";
import {
  generate,
  generateLevel2Observation,
} from "../patterns/src/templates.js";
import type { DetectedPattern, EvidenceRow } from "../patterns/src/types.js";

const CANONICAL_SLUG = "2026-ucl-final-psg-arsenal";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string): void {
  if (cond) {
    passed += 1;
    console.log(`✅ ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.error(`❌ ${label}`);
  }
}

function ev(
  trace_id: string,
  language_code: string,
  proposition_type: string,
  opts: Partial<EvidenceRow> = {},
): EvidenceRow {
  return {
    trace_id,
    language_code,
    page_title: opts.page_title ?? "2026 UEFA Champions League Final",
    revision_timestamp: opts.revision_timestamp ?? "2026-05-30T20:14:00Z",
    source_diff_url:
      opts.source_diff_url === undefined
        ? `https://${language_code}.wikipedia.org/?diff=${trace_id}`
        : opts.source_diff_url,
    source_revision_url:
      opts.source_revision_url === undefined
        ? `https://${language_code}.wikipedia.org/?oldid=${trace_id}`
        : opts.source_revision_url,
    proposition_type,
  };
}

function pattern(
  overrides: Partial<DetectedPattern> & {
    proposition_type: string;
    evidenceRows: EvidenceRow[];
  },
): DetectedPattern {
  return {
    pattern_type: "language_convergence",
    proposition_ids: overrides.evidenceRows.map((e) => `p-${e.trace_id}`),
    trace_ids: overrides.evidenceRows.map((e) => e.trace_id),
    entity_id: "entity-test",
    match_id: "match-test",
    match_slug: CANONICAL_SLUG,
    article_id: null,
    templateContext: {
      language_codes: overrides.evidenceRows.map((e) => e.language_code),
      language_codes_substantive: overrides.evidenceRows.map((e) => e.language_code),
      topic_label: "Test",
      page_title: "2026 UEFA Champions League Final",
      observed_window_start: "2026-05-30T20:10:00Z",
      observed_window_end: "2026-05-30T20:20:00Z",
      proposition_summary: "but inscrit",
    },
    ...overrides,
  };
}

// 1. goal_scored EN + FR avec sources → eligible
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "fr", "goal_scored")],
  });
  const r = isLevel2AutoPublishable(p);
  assert(r.eligible === true, "1. goal_scored EN+FR avec sources est éligible");
}

// 2. goal_scored EN seul → refusé (mono-langue)
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [ev("t1", "en", "goal_scored")],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("fewer than two whitelisted languages"),
    "2. goal_scored EN seul est refusé (mono-langue)",
  );
}

// 3. substitution EN + FR → refusé
{
  const p = pattern({
    proposition_type: "substitution",
    evidenceRows: [
      ev("t1", "en", "substitution"),
      ev("t2", "fr", "substitution"),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not in the rehearsal whitelist"),
    "3. substitution multi-langue est refusé",
  );
}

// 4. under_radar → refusé
{
  const p: DetectedPattern = {
    ...pattern({
      proposition_type: "goal_scored",
      evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "fr", "goal_scored")],
    }),
    pattern_type: "under_radar",
  };
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not auto-publishable"),
    "4. under_radar est refusé même multi-langue",
  );
}

// 5. article_instability → refusé
{
  const p: DetectedPattern = {
    ...pattern({
      proposition_type: "goal_scored",
      evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "fr", "goal_scored")],
    }),
    pattern_type: "article_instability",
  };
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not auto-publishable"),
    "5. article_instability est refusé",
  );
}

// 6. language_convergence sur match_result → refusé
{
  const p = pattern({
    proposition_type: "match_result",
    evidenceRows: [
      ev("t1", "en", "match_result"),
      ev("t2", "fr", "match_result"),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not in the rehearsal whitelist"),
    "6. match_result multi-langue est refusé",
  );
}

// 7. goal_scored sur match non canonique → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "fr", "goal_scored")],
    match_slug: "another-match",
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not the canonical rehearsal match"),
    "7. goal_scored hors match canonique est refusé",
  );
}

// 8. goal_scored sans aucune source diff/revision → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored", { source_diff_url: null, source_revision_url: null }),
      ev("t2", "fr", "goal_scored", { source_diff_url: null, source_revision_url: null }),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("no consultable source"),
    "8. goal_scored sans source consultable est refusé",
  );
}

// 9. texte contenant "plus rapide" → refus safety
{
  const tmpl = generateLevel2Observation({
    language_codes: ["en", "fr"],
    language_codes_substantive: ["en", "fr"],
    topic_label: "Test",
    page_title: "Finale",
    observed_window_start: "2026-05-30T20:10:00Z",
    observed_window_end: "2026-05-30T20:20:00Z",
    proposition_summary: "but inscrit",
    level2_proposition_type: "goal_scored",
  });
  // Override observation_text avec un terme interdit pour prouver que safety bloque.
  const polluted = {
    ...tmpl,
    observation_text:
      "L'édition anglaise a été plus rapide à publier le but que l'édition française.",
  };
  const r = runSafetyChecks(polluted);
  assert(
    r.passed === false && r.reason === "language_ranking_forbidden",
    "9. texte avec 'plus rapide' est bloqué par safety",
  );
}

// 10. observation niveau 2 sobre passe safety
{
  const tmpl = generateLevel2Observation({
    language_codes: ["en", "fr"],
    language_codes_substantive: ["en", "fr"],
    topic_label: "Test",
    page_title: "Finale",
    observed_window_start: "2026-05-30T20:10:00Z",
    observed_window_end: "2026-05-30T20:20:00Z",
    proposition_summary: "but inscrit",
    level2_proposition_type: "goal_scored",
  });
  const r = runSafetyChecks(tmpl);
  assert(
    r.passed === true,
    `10. observation niveau 2 sobre passe safety (reason=${r.reason ?? "n/a"})`,
  );
}

// 11. qualification avec team + stage_reached → eligible
{
  const p = pattern({
    proposition_type: "qualification",
    evidenceRows: [
      ev("t1", "en", "qualification"),
      ev("t2", "fr", "qualification"),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === true,
    "11. qualification EN+FR avec sources est éligible",
  );
}

// 12. red_card EN + ES → eligible
{
  const p = pattern({
    proposition_type: "red_card",
    evidenceRows: [ev("t1", "en", "red_card"), ev("t2", "es", "red_card")],
  });
  const r = isLevel2AutoPublishable(p);
  assert(r.eligible === true, "12. red_card EN+ES avec sources est éligible");
}

// 13. yellow_card multi-langue → refusé
{
  const p = pattern({
    proposition_type: "yellow_card",
    evidenceRows: [ev("t1", "en", "yellow_card"), ev("t2", "fr", "yellow_card")],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not in the rehearsal whitelist"),
    "13. yellow_card multi-langue est refusé",
  );
}

// 14. texte contenant "communauté" → refus safety
{
  const tmpl = generateLevel2Observation({
    language_codes: ["en", "fr"],
    language_codes_substantive: ["en", "fr"],
    topic_label: "Test",
    page_title: "Finale",
    observed_window_start: "2026-05-30T20:10:00Z",
    observed_window_end: "2026-05-30T20:20:00Z",
    proposition_summary: "but inscrit",
    level2_proposition_type: "goal_scored",
  });
  const polluted = {
    ...tmpl,
    interpretation_text:
      "La communauté wikipédienne anglaise a documenté le but la première.",
  };
  const r = runSafetyChecks(polluted);
  assert(
    r.passed === false && r.reason === "language_ranking_forbidden",
    "14. texte avec 'communauté' est bloqué par safety",
  );
}

// 15. detectInstability template doit toujours générer (fiche interne) mais le
//     publisher ne le passera jamais en publication. Vérifions au moins que le
//     template article_instability ne renvoie pas null (pour qu'il continue à
//     servir de fiche Desk en interne).
{
  const tmpl = generate("article_instability", {
    language_codes: ["en"],
    language_codes_substantive: ["en"],
    topic_label: "Test",
    page_title: "Article test",
    observed_window_start: "2026-05-30T20:10:00Z",
    observed_window_end: "2026-05-30T20:20:00Z",
    proposition_summary: "réécriture",
  });
  assert(
    tmpl !== null,
    "15. article_instability garde son template (fiche interne, jamais publié)",
  );
}

console.log("");
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error("Failed tests:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
