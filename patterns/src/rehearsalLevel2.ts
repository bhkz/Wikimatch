/**
 * Niveau 2 — Observation automatique publiable (rehearsal PSG — Arsenal).
 *
 * Implémente le contrat docs/v2/STORY_PUBLICATION_CONTRACT.md §4 + §7.1 :
 * une observation automatique est publiable sans validation humaine
 * uniquement si tous les critères ci-dessous sont satisfaits. Toute fonction
 * exportée d'ici est PURE — aucun accès Supabase, aucun side effect — pour
 * pouvoir être testée hors ligne pendant le rehearsal.
 */

import { createHash } from "node:crypto";
import { CANONICAL_REHEARSAL_MATCH_SLUG } from "./config.js";
import type { DetectedPattern, EvidenceRow } from "./types.js";

export const ALLOWED_AUTO_PROPOSITION_TYPES = new Set<string>([
  "goal_scored",
  "red_card",
  "qualification",
]);

export const ALLOWED_AUTO_LANGUAGE_CODES = new Set<string>(["en", "fr", "es"]);

// Seules les pages de rôle "match" alimentent une observation niveau 2
// pendant ce rehearsal. Les pages club / joueur / compétition restent
// collectables mais ne déclenchent pas une publication automatique live.
// Cf. STORY_PUBLICATION_CONTRACT.md §7.1 + correction Prompt 3B.
export const ALLOWED_AUTO_WATCHLIST_ROLE = "match";
export const ALLOWED_AUTO_ARTICLE_TYPE = "match";

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
  | {
      eligible: true;
      languages: string[];
      observationKey: string;
      slug: string;
      strictClaimKey: string;
    }
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

function stableShortHash(input: string): string {
  // SHA-256 truncated to 10 hex chars: 40 bits of entropy is enough to make
  // an accidental collision astronomically unlikely within a single match
  // window, while keeping slugs short and readable.
  return createHash("sha256").update(input).digest("hex").slice(0, 10);
}

/**
 * Identité stable d'une observation niveau 2 : ne dépend ni de l'ordre des
 * langues, ni du nombre de redétections, ni des `proposition_ids` extraits
 * par l'IA. Repose uniquement sur le fait documentaire normalisé.
 */
export function buildObservationKey(
  matchSlug: string,
  propositionType: string,
  strictClaimKey: string,
): string {
  return `${matchSlug}:${propositionType}:${strictClaimKey}`;
}

export function buildObservationSlug(
  propositionType: string,
  observationKey: string,
): string {
  return `observation-${propositionType.replace(/_/g, "-")}-${stableShortHash(observationKey)}`;
}

/**
 * Décide si un pattern détecté peut être publié automatiquement comme
 * observation niveau 2 pendant le rehearsal PSG — Arsenal.
 *
 * Critères cumulatifs (cf. contrat §4 + §7.1 + correction Prompt 3B) :
 *  1. pattern_type === "language_convergence"
 *  2. match_slug === slug canonique du rehearsal
 *  3. match_id non nul
 *  4. proposition_type ∈ {goal_scored, red_card, qualification}
 *  5. claim key strict non null et identique sur toutes les preuves
 *  6. ≥2 langues distinctes parmi {en, fr, es}
 *  7. ≥2 evidence rows avec source diff/revision consultable
 *  8. toutes les evidence rows partagent le proposition_type du pattern
 *  9. toutes les evidence rows appartiennent au match canonique
 *     (watchlist_match_id === match_id), avec watchlist_role === "match"
 *     et article_type === "match".
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

  const strictClaimKey = pattern.strict_claim_key;
  if (!strictClaimKey) {
    return {
      eligible: false,
      reason: "strict_claim_key is null — claim cannot be normalised",
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
    if (row.strict_claim_key !== strictClaimKey) {
      return {
        eligible: false,
        reason: `evidence strict_claim_key mismatch: ${row.strict_claim_key ?? "null"} vs ${strictClaimKey}`,
      };
    }
    if (row.watchlist_match_id !== pattern.match_id) {
      return {
        eligible: false,
        reason: `evidence article ${row.article_id} is not in the canonical match watchlist`,
      };
    }
    if (row.watchlist_role !== ALLOWED_AUTO_WATCHLIST_ROLE) {
      return {
        eligible: false,
        reason: `evidence article ${row.article_id} has watchlist_role=${row.watchlist_role ?? "null"} (only role=match is eligible)`,
      };
    }
    if (row.article_type !== ALLOWED_AUTO_ARTICLE_TYPE) {
      return {
        eligible: false,
        reason: `evidence article ${row.article_id} has article_type=${row.article_type} (only article_type=match is eligible)`,
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

  distinctLanguages.sort();
  const observationKey = buildObservationKey(
    CANONICAL_REHEARSAL_MATCH_SLUG,
    propType,
    strictClaimKey,
  );
  const slug = buildObservationSlug(propType, observationKey);

  return {
    eligible: true,
    languages: distinctLanguages,
    observationKey,
    slug,
    strictClaimKey,
  };
}
