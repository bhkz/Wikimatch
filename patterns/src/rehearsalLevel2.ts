/**
 * Niveau 2 — Observation automatique publiable (rehearsal PSG — Arsenal).
 *
 * Implémente le contrat docs/v2/STORY_PUBLICATION_CONTRACT.md §4 + §7.1 :
 * une observation automatique est publiable sans validation humaine
 * uniquement si tous les critères ci-dessous sont satisfaits. Toute fonction
 * exportée d'ici est PURE — aucun accès Supabase, aucun side effect — pour
 * pouvoir être testée hors ligne pendant le rehearsal.
 */

import { CANONICAL_REHEARSAL_MATCH_SLUG } from "./config.js";
import type { DetectedPattern, EvidenceRow } from "./types.js";

export const ALLOWED_AUTO_PROPOSITION_TYPES = new Set<string>([
  "goal_scored",
  "red_card",
  "qualification",
]);

export const ALLOWED_AUTO_LANGUAGE_CODES = new Set<string>(["en", "fr", "es"]);

const FORBIDDEN_PATTERN_TYPES = new Set<string>([
  "article_instability",
  "under_radar",
  "language_divergence",
  "match_recap",
]);

const FORBIDDEN_PROPOSITION_TYPES = new Set<string>([
  "match_result",
  "yellow_card",
  "substitution",
  "sanction",
  "lineup_change",
  "transfer",
  "biographical_fact",
  "performance",
  "other",
  "noise",
]);

export type Level2Result =
  | { eligible: true; languages: string[] }
  | { eligible: false; reason: string };

function evidenceHasConsultableSource(row: EvidenceRow): boolean {
  const diff = (row.source_diff_url ?? "").trim();
  const rev = (row.source_revision_url ?? "").trim();
  return diff.length > 0 || rev.length > 0;
}

export function isForbiddenPatternType(patternType: string): boolean {
  return FORBIDDEN_PATTERN_TYPES.has(patternType);
}

export function isForbiddenPropositionType(propType: string | null | undefined): boolean {
  if (!propType) return true;
  return FORBIDDEN_PROPOSITION_TYPES.has(propType);
}

/**
 * Décide si un pattern détecté peut être publié automatiquement comme
 * observation niveau 2 pendant le rehearsal PSG — Arsenal.
 *
 * Critères cumulatifs (cf. contrat §4 + §7.1) :
 *  1. pattern_type === "language_convergence"
 *  2. match_slug === slug canonique du rehearsal
 *  3. match_id non nul
 *  4. proposition_type ∈ {goal_scored, red_card, qualification}
 *  5. ≥2 langues distinctes parmi {en, fr, es}
 *  6. ≥2 evidence rows avec source diff/revision consultable
 *  7. toutes les evidence rows partagent ce proposition_type
 *  8. aucune evidence row hors articles du match (vérifié en amont par
 *     resolveUniqueMatchForRows — si match_id est non nul, la watchlist
 *     du match a déjà filtré les articles)
 */
export function isLevel2AutoPublishable(pattern: DetectedPattern): Level2Result {
  if (pattern.pattern_type !== "language_convergence") {
    return { eligible: false, reason: `pattern_type ${pattern.pattern_type} not auto-publishable` };
  }

  if (pattern.match_slug !== CANONICAL_REHEARSAL_MATCH_SLUG) {
    return {
      eligible: false,
      reason: `match_slug ${pattern.match_slug ?? "null"} is not the canonical rehearsal match`,
    };
  }

  if (!pattern.match_id) {
    return { eligible: false, reason: "match_id is null or ambiguous" };
  }

  const propType = pattern.proposition_type;
  if (!propType || !ALLOWED_AUTO_PROPOSITION_TYPES.has(propType)) {
    return {
      eligible: false,
      reason: `proposition_type ${propType ?? "null"} is not in the rehearsal whitelist`,
    };
  }

  if (!pattern.evidenceRows || pattern.evidenceRows.length === 0) {
    return { eligible: false, reason: "no evidence rows" };
  }

  for (const row of pattern.evidenceRows) {
    if (row.proposition_type !== propType) {
      return {
        eligible: false,
        reason: `evidence proposition_type mismatch: ${row.proposition_type} vs ${propType}`,
      };
    }
  }

  const whitelistedLanguages = pattern.evidenceRows
    .map((r) => r.language_code.toLowerCase())
    .filter((code) => ALLOWED_AUTO_LANGUAGE_CODES.has(code));
  const distinctLanguages = Array.from(new Set(whitelistedLanguages));
  if (distinctLanguages.length < 2) {
    return {
      eligible: false,
      reason: `fewer than two whitelisted languages: [${distinctLanguages.join(",")}]`,
    };
  }

  const evidenceByLanguage = new Map<string, EvidenceRow[]>();
  for (const row of pattern.evidenceRows) {
    const lang = row.language_code.toLowerCase();
    if (!ALLOWED_AUTO_LANGUAGE_CODES.has(lang)) continue;
    if (!evidenceByLanguage.has(lang)) evidenceByLanguage.set(lang, []);
    evidenceByLanguage.get(lang)!.push(row);
  }

  for (const lang of distinctLanguages) {
    const rows = evidenceByLanguage.get(lang) ?? [];
    if (!rows.some(evidenceHasConsultableSource)) {
      return {
        eligible: false,
        reason: `no consultable source (diff/revision URL) for language ${lang}`,
      };
    }
  }

  return { eligible: true, languages: distinctLanguages };
}
