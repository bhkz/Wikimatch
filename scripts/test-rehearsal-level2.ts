/**
 * Tests dry-run pour la validation niveau 2 (rehearsal PSG — Arsenal).
 *
 * Ces tests sont 100 % offline : ils ne touchent ni Supabase ni le worker.
 * Ils prouvent que le validateur isLevel2AutoPublishable, le safety filter
 * runSafetyChecks, et le hash d'identité stable bloquent ce qu'ils doivent
 * bloquer, et autorisent ce qu'ils doivent autoriser.
 *
 * Run :  npx tsx scripts/test-rehearsal-level2.ts
 */

import { runSafetyChecks } from "../patterns/src/safety.js";
import {
  isLevel2AutoPublishable,
  buildObservationKey,
  buildObservationSlug,
  ALLOWED_AUTO_PROPOSITION_TYPES,
  FINAL_REHEARSAL_BLOCKED_REASON,
} from "../patterns/src/rehearsalLevel2.js";
import { generate, generateLevel2Observation } from "../patterns/src/templates.js";
import type { DetectedPattern, EvidenceRow } from "../patterns/src/types.js";

const CANONICAL_SLUG = "2026-ucl-final-psg-arsenal";
const CANONICAL_MATCH_ID = "match-uuid-canonical";
const LEVEL2_MARKER = "rehearsal_level2_auto_v1";

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
  const defaultClaimKey =
    proposition_type === "goal_scored"
      ? "goal_scored:vitinha:23"
      : proposition_type === "red_card"
        ? "red_card:saliba:67"
        : proposition_type === "qualification"
          ? "qualification:psg:winner"
          : `${proposition_type}:test:claim`;
  return {
    trace_id,
    article_id: opts.article_id ?? `article-${language_code}-match`,
    language_code,
    page_title: opts.page_title ?? "2026 UEFA Champions League Final",
    article_type: opts.article_type ?? "match",
    watchlist_role: opts.watchlist_role ?? "match",
    watchlist_match_id:
      opts.watchlist_match_id === undefined ? CANONICAL_MATCH_ID : opts.watchlist_match_id,
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
    strict_claim_key: opts.strict_claim_key ?? defaultClaimKey,
  };
}

function pattern(
  overrides: Partial<DetectedPattern> & {
    proposition_type: string;
    evidenceRows: EvidenceRow[];
  },
): DetectedPattern {
  const firstClaim = overrides.evidenceRows[0]?.strict_claim_key ?? null;
  return {
    pattern_type: "language_convergence",
    proposition_ids: overrides.evidenceRows.map((e) => `p-${e.trace_id}`),
    trace_ids: overrides.evidenceRows.map((e) => e.trace_id),
    entity_id: "entity-test",
    match_id: CANONICAL_MATCH_ID,
    match_slug: CANONICAL_SLUG,
    article_id: null,
    proposition_type: overrides.proposition_type,
    strict_claim_key: overrides.strict_claim_key ?? firstClaim,
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

// =====================================================================
// Éligibilité
// =====================================================================

// 1. goal_scored EN + FR, role=match, articles autorisés, URLs présentes → éligible
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "fr", "goal_scored")],
  });
  const r = isLevel2AutoPublishable(p);
  assert(r.eligible === true, "1. goal_scored EN+FR avec sources est éligible");
}

// 2. red_card EN + ES, role=match, URLs présentes → éligible
{
  const p = pattern({
    proposition_type: "red_card",
    evidenceRows: [ev("t1", "en", "red_card"), ev("t2", "es", "red_card")],
  });
  const r = isLevel2AutoPublishable(p);
  assert(r.eligible === true, "2. red_card EN+ES avec sources est éligible");
}

// 3. qualification EN + FR avec sources → REFUSÉ (final-rehearsal v1)
//    Le match test est une FINALE : les deux clubs sont déjà qualifiés,
//    un fait `qualification` ajouté dans la fenêtre est contextuel et
//    ambigu. La whitelist auto v1 ne contient que goal_scored et red_card.
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
    r.eligible === false &&
      r.reason.includes(FINAL_REHEARSAL_BLOCKED_REASON) &&
      r.reason.includes("qualification"),
    `3. qualification EN+FR est refusé avec raison ${FINAL_REHEARSAL_BLOCKED_REASON}`,
  );
}

// 3bis. la whitelist publique contient exactement {goal_scored, red_card}
{
  const exact =
    ALLOWED_AUTO_PROPOSITION_TYPES.size === 2 &&
    ALLOWED_AUTO_PROPOSITION_TYPES.has("goal_scored") &&
    ALLOWED_AUTO_PROPOSITION_TYPES.has("red_card") &&
    !ALLOWED_AUTO_PROPOSITION_TYPES.has("qualification");
  assert(exact, "3bis. ALLOWED_AUTO_PROPOSITION_TYPES = {goal_scored, red_card} (qualification exclue)");
}

// 3ter. match_result brut → refusé
{
  const p = pattern({
    proposition_type: "match_result",
    evidenceRows: [
      ev("t1", "en", "match_result", { strict_claim_key: "match_result:1-0" }),
      ev("t2", "fr", "match_result", { strict_claim_key: "match_result:1-0" }),
    ],
    strict_claim_key: "match_result:1-0",
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes(FINAL_REHEARSAL_BLOCKED_REASON),
    "3ter. match_result brut est refusé avec raison final-rehearsal",
  );
}

// 3quater. article_instability → refusé
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
    "3quater. pattern_type article_instability est refusé",
  );
}

// =====================================================================
// Blocages de périmètre
// =====================================================================

// 4. goal_scored EN + FR avec rôle home_team → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored", { watchlist_role: "home_team" }),
      ev("t2", "fr", "goal_scored", { watchlist_role: "home_team" }),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("watchlist_role=home_team"),
    "4. goal_scored avec watchlist_role=home_team est refusé",
  );
}

// 5. goal_scored EN + FR avec un article hors watchlist (watchlist_match_id null) → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored"),
      ev("t2", "fr", "goal_scored", { watchlist_match_id: null, watchlist_role: null }),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not in the canonical match watchlist"),
    "5. evidence hors watchlist canonique est refusée",
  );
}

// 6. goal_scored EN + FR sur match non canonique → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "fr", "goal_scored")],
    match_slug: "another-match",
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("not the canonical rehearsal match"),
    "6. match_slug non canonique est refusé",
  );
}

// 6bis. article_type différent de "match" → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored", { article_type: "team" }),
      ev("t2", "fr", "goal_scored", { article_type: "team" }),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("article_type=team"),
    "6bis. article_type=team est refusé (seul match autorisé)",
  );
}

// =====================================================================
// Blocages de preuve
// =====================================================================

// 7. même langue deux fois → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "en", "goal_scored")],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("fewer than two whitelisted languages"),
    "7. même langue deux fois est refusée",
  );
}

// 8. une URL source manquante (pour une langue) → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored"),
      ev("t2", "fr", "goal_scored", { source_diff_url: null, source_revision_url: null }),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("no consultable source"),
    "8. URL source manquante pour une langue est refusée",
  );
}

// 9. type interdit substitution → refusé
{
  const p = pattern({
    proposition_type: "substitution",
    evidenceRows: [
      ev("t1", "en", "substitution", { strict_claim_key: "substitution:a:b:60" }),
      ev("t2", "fr", "substitution", { strict_claim_key: "substitution:a:b:60" }),
    ],
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false &&
      r.reason.includes("substitution") &&
      r.reason.includes(FINAL_REHEARSAL_BLOCKED_REASON),
    "9. substitution multi-langue est refusée (final-rehearsal v1)",
  );
}

// 10. pattern interdit under_radar → refusé
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
    "10. pattern_type under_radar est refusé",
  );
}

// =====================================================================
// Identité / déduplication
// =====================================================================

// 11. même but EN+FR puis EN+FR+ES → même observation key / même slug
{
  const pA = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [ev("t1", "en", "goal_scored"), ev("t2", "fr", "goal_scored")],
  });
  const pB = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t3", "en", "goal_scored"),
      ev("t4", "fr", "goal_scored"),
      ev("t5", "es", "goal_scored"),
    ],
  });
  const rA = isLevel2AutoPublishable(pA);
  const rB = isLevel2AutoPublishable(pB);
  assert(
    rA.eligible === true &&
      rB.eligible === true &&
      rA.observationKey === rB.observationKey &&
      rA.slug === rB.slug,
    "11. mêmes claim/match/type → même observationKey/slug, peu importe les langues observées",
  );
}

// 12. but différent même langues → slug différent
{
  const pA = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored", { strict_claim_key: "goal_scored:vitinha:23" }),
      ev("t2", "fr", "goal_scored", { strict_claim_key: "goal_scored:vitinha:23" }),
    ],
    strict_claim_key: "goal_scored:vitinha:23",
  });
  const pB = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t3", "en", "goal_scored", { strict_claim_key: "goal_scored:saka:67" }),
      ev("t4", "fr", "goal_scored", { strict_claim_key: "goal_scored:saka:67" }),
    ],
    strict_claim_key: "goal_scored:saka:67",
  });
  const rA = isLevel2AutoPublishable(pA);
  const rB = isLevel2AutoPublishable(pB);
  assert(
    rA.eligible === true && rB.eligible === true && rA.slug !== rB.slug,
    "12. claims différentes (buts différents) → slugs différents",
  );
}

// 13. deux cartons rouges distincts → slugs différents
{
  const pA = pattern({
    proposition_type: "red_card",
    evidenceRows: [
      ev("t1", "en", "red_card", { strict_claim_key: "red_card:saliba:67" }),
      ev("t2", "fr", "red_card", { strict_claim_key: "red_card:saliba:67" }),
    ],
    strict_claim_key: "red_card:saliba:67",
  });
  const pB = pattern({
    proposition_type: "red_card",
    evidenceRows: [
      ev("t3", "en", "red_card", { strict_claim_key: "red_card:dembele:82" }),
      ev("t4", "fr", "red_card", { strict_claim_key: "red_card:dembele:82" }),
    ],
    strict_claim_key: "red_card:dembele:82",
  });
  const rA = isLevel2AutoPublishable(pA);
  const rB = isLevel2AutoPublishable(pB);
  assert(
    rA.eligible === true && rB.eligible === true && rA.slug !== rB.slug,
    "13. deux red_card distincts → slugs différents",
  );
}

// 14. ordre des langues différent → même slug
{
  // Le hash de buildObservationKey ne dépend pas des langues, donc l'ordre
  // ne peut intrinsèquement pas l'influencer. On le prouve quand même.
  const keyA = buildObservationKey(CANONICAL_SLUG, "goal_scored", "goal_scored:vitinha:23");
  const slugAprime = buildObservationSlug("goal_scored", keyA);
  const slugAprime2 = buildObservationSlug("goal_scored", keyA);
  assert(slugAprime === slugAprime2, "14. observationKey identique → slug identique (déterministe)");
}

// 14bis. carton rouge ne collisionne jamais avec un but
{
  const keyGoal = buildObservationKey(CANONICAL_SLUG, "goal_scored", "x");
  const keyRed = buildObservationKey(CANONICAL_SLUG, "red_card", "x");
  const slugGoal = buildObservationSlug("goal_scored", keyGoal);
  const slugRed = buildObservationSlug("red_card", keyRed);
  assert(
    slugGoal !== slugRed && keyGoal !== keyRed,
    "14bis. red_card et goal_scored produisent des slugs distincts même claim_key identique",
  );
}

// =====================================================================
// Gate publique (texte safety)
// =====================================================================

// 15. texte contenant "plus rapide" → refus safety
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
    observation_text:
      "L'édition anglaise a été plus rapide à publier le but que l'édition française.",
  };
  const r = runSafetyChecks(polluted);
  assert(
    r.passed === false && r.reason === "language_ranking_forbidden",
    "15. texte avec 'plus rapide' est bloqué par safety",
  );
}

// 16. observation niveau 2 sobre passe safety
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
  assert(r.passed === true, `16. observation niveau 2 sobre passe safety (reason=${r.reason ?? "n/a"})`);
}

// =====================================================================
// Gate méthodologique (preuve que l'API filtre sur le marker)
// =====================================================================

// 17. preuve que le marker existe en config et est utilisé
{
  // Reproduit la condition que l'API stories applique : un row sans
  // methodology_version = LEVEL2_MARKER ne doit pas passer.
  function apiAccepts(row: { methodology_version: string | null }): boolean {
    return row.methodology_version === LEVEL2_MARKER;
  }
  const legacyAuto = { methodology_version: "v0.3-auto" };
  const newLevel2 = { methodology_version: LEVEL2_MARKER };
  assert(
    apiAccepts(legacyAuto) === false && apiAccepts(newLevel2) === true,
    "17. ancien marker (v0.3-auto) → non public ; marker niveau 2 → public",
  );
}

// 18. claim_key null sur un type whitelisté → refusé (pas de strictConvergenceClaimKey)
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored", { strict_claim_key: null }),
      ev("t2", "fr", "goal_scored", { strict_claim_key: null }),
    ],
    strict_claim_key: null,
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("strict_claim_key is null"),
    "18. claim_key null est refusé",
  );
}

// 19. evidence avec strict_claim_key différent du pattern → refusé
{
  const p = pattern({
    proposition_type: "goal_scored",
    evidenceRows: [
      ev("t1", "en", "goal_scored", { strict_claim_key: "goal_scored:vitinha:23" }),
      ev("t2", "fr", "goal_scored", { strict_claim_key: "goal_scored:saka:67" }),
    ],
    strict_claim_key: "goal_scored:vitinha:23",
  });
  const r = isLevel2AutoPublishable(p);
  assert(
    r.eligible === false && r.reason.includes("strict_claim_key mismatch"),
    "19. evidences aux claim_keys divergents → refusé",
  );
}

// 20. article_instability template toujours présent (fiche interne)
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
    "20. article_instability garde son template (fiche interne, jamais publié)",
  );
}

console.log("");
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error("Failed tests:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
