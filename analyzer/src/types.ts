export type PropositionType =
  | "match_result"
  | "goal_scored"
  | "red_card"
  | "yellow_card"
  | "substitution"
  | "sanction"
  | "lineup_change"
  | "transfer"
  | "qualification"
  | "performance"
  | "biographical_fact"
  | "noise"
  | "other";

export type ExtractionProvider = "openai" | "gemini" | "regex" | "manual";

export interface ProposalPayload {
  proposition_type: PropositionType;
  /**
   * Champs structurés normalisés. Le format dépend du type :
   *  - match_result : { winner?: 'home'|'away'|'draw', home_score?: int, away_score?: int }
   *  - goal_scored  : { scorer?: string, minute?: int }
   *  - red_card     : { player?: string, minute?: int, reason?: string }
   *  - sanction     : { target?: string, sanction_kind?: string, source_present?: boolean }
   *  - performance  : { description: string }
   *  - biographical_fact : { fact_kind?: string, description?: string }
   *  - noise        : {} (rien à extraire)
   * Tous les champs sont optionnels — l'extracteur ne devine pas, il rapporte
   * ce qu'il peut lire dans le diff.
   */
  payload: Record<string, unknown>;
  /**
   * Confiance d'extraction 0..1. Permet au pattern matcher de pondérer.
   */
  confidence: number;
}

export interface ExtractionResult {
  proposal: ProposalPayload;
  provider: ExtractionProvider;
  model: string;
  prompt_version: string;
  cost_eur: number;
  raw_response_excerpt?: string;
}

export interface TraceToAnalyze {
  trace_id: string;
  article_id: string;
  page_title: string;
  language_code: string;
  article_type: string;
  added_text: string | null;
  removed_text: string | null;
}

export interface TracePropositionInsert {
  trace_id: string;
  proposition_type: PropositionType;
  normalized_payload: Record<string, unknown>;
  language_code: string;
  extraction_provider: ExtractionProvider;
  extraction_confidence: number;
  extraction_model: string;
  extraction_prompt_version: string;
  estimated_cost_eur: number;
}
