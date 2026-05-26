import type { ExtractionResult, ProposalPayload, TraceToAnalyze } from "./types.js";
import { PROMPT_VERSION } from "./config.js";

/**
 * Variant pure-regex utilisée quand le budget IA journalier est atteint.
 * Coût 0€. Confidence basse. Sera reprise plus tard si OpenAI/Gemini sont
 * de nouveau disponibles (le pattern matcher préfèrera une proposition
 * IA récente sur la même trace si jamais on en re-déclenche une).
 */
export function regexOnly(trace: TraceToAnalyze): ExtractionResult {
  const added = (trace.added_text ?? "").toLowerCase();
  let proposal: ProposalPayload;

  if (added.length < 20) {
    proposal = { proposition_type: "noise", payload: {}, confidence: 0.4 };
  } else if (/\b(carton rouge|red card|tarjeta roja|expuls)/i.test(added)) {
    proposal = { proposition_type: "red_card", payload: {}, confidence: 0.4 };
  } else if (/\b(but\s|gol\s|goal\s|marqu(e|é))/i.test(added)) {
    proposal = { proposition_type: "goal_scored", payload: {}, confidence: 0.35 };
  } else if (/\b(\d{1,2}\s*[-–:]\s*\d{1,2})\b/.test(added)) {
    proposal = { proposition_type: "match_result", payload: {}, confidence: 0.4 };
  } else if (/\b(qualifi(e|é|ée|ed)|advance|eliminat)/i.test(added)) {
    proposal = { proposition_type: "qualification", payload: {}, confidence: 0.3 };
  } else {
    proposal = {
      proposition_type: "other",
      payload: { description: added.slice(0, 200) },
      confidence: 0.2,
    };
  }

  return {
    proposal,
    provider: "regex",
    model: "regex-v1",
    prompt_version: PROMPT_VERSION,
    cost_eur: 0,
  };
}
