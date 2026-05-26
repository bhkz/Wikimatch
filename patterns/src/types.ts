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

export interface DetectedPattern {
  pattern_type: PatternType;
  proposition_ids: string[];
  trace_ids: string[];
  entity_id: string | null;
  match_id: string | null;
  article_id: string | null;
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
