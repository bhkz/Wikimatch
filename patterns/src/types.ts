export type PatternType =
  | "article_instability"
  | "language_convergence"
  | "language_divergence"
  | "under_radar"
  | "match_recap";

/**
 * Proposition lue depuis la DB avec son contexte minimal.
 */
export interface PropositionRow {
  id: string;
  trace_id: string;
  proposition_type: string;
  normalized_payload: Record<string, unknown>;
  language_code: string;
  extraction_confidence: number | null;
  created_at: string;
  trace: {
    id: string;
    article_id: string;
    observed_at: string;
    revision_timestamp: string;
    size_delta: number | null;
    source_revision_url: string;
    source_diff_url: string | null;
    article: {
      id: string;
      entity_id: string;
      language_code: string;
      page_title: string;
      canonical_url: string;
      article_type: string;
    };
  };
}

/**
 * Evidence row carried alongside a DetectedPattern so the publisher can
 * write meaningful public_label entries (language · page · timestamp)
 * and so the Level 2 validator can check sources exist per language,
 * articles belong to the canonical match watchlist with role='match',
 * and the strict claim key matches across all evidences.
 */
export interface EvidenceRow {
  trace_id: string;
  article_id: string;
  language_code: string;
  page_title: string;
  article_type: string;
  watchlist_role: string | null;
  watchlist_match_id: string | null;
  revision_timestamp: string;
  source_diff_url: string | null;
  source_revision_url: string | null;
  proposition_type: string;
  strict_claim_key: string | null;
}

export interface DetectedPattern {
  pattern_type: PatternType;
  proposition_ids: string[];
  trace_ids: string[];
  entity_id: string | null;
  match_id: string | null;
  match_slug: string | null;
  article_id: string | null;
  proposition_type: string | null;
  // Strict claim key shared by all evidence rows in this pattern. Stable
  // identifier of the documentary fact (e.g. `goal_scored:vitinha:23`).
  // Used to build observationKey, slug, and dedupe across redetections.
  strict_claim_key: string | null;
  evidenceRows: EvidenceRow[];
  templateContext: TemplateContext;
}

/**
 * Contexte structuré passé à un template. Le template ne reçoit JAMAIS
 * de texte libre — il assemble des champs blancs depuis ces données.
 */
export interface TemplateContext {
  language_codes: string[];
  language_codes_substantive: string[];
  language_codes_absent?: string[];
  topic_label: string;
  page_title: string;
  observed_window_start: string;
  observed_window_end: string;
  proposition_summary: string;
  entity_canonical_label?: string;
  article_canonical_url?: string;
  size_delta_pattern?: string;
  // Niveau 2 rehearsal (STORY_PUBLICATION_CONTRACT.md §7.1) — type whitelisté
  // utilisé par le template "observation automatique" pour produire un titre sobre.
  level2_proposition_type?: string;
}

export interface TemplateOutput {
  title: string;
  excerpt: string;
  observation_text: string;
  interpretation_text: string;
  limitation_text: string;
  languages: string[];
  source_count: number;
  slug_seed: string;
}

export interface SafetyCheckResult {
  passed: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}
