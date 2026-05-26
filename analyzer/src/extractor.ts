/**
 * Extracteur de proposition normalisée — Jalon B.
 *
 * Hérite de l'esprit de l'ancien `worker/src/ai.ts` (suspendu) mais le
 * rôle change radicalement :
 *
 *  AVANT (Gemini)         APRÈS (Jalon B)
 *  -----------------      -----------------------------------
 *  Décide public_status   ❌ Jamais : c'est le pattern matcher
 *  Traduit + publie       ❌ Jamais : publication via template uniquement
 *  Touche aux excerpts    ❌ Jamais : excerpts produits au Jalon C avec safety
 *  Décide change_kind     ❌ Dérivé du proposition_type plus tard
 *
 *  EXTRAIT une PROPOSITION normalisée :
 *    { proposition_type, payload structuré, confidence }
 *  - signale "noise" si le diff n'a rien d'éditorial
 *  - confidence bas si incertitude
 *  - jamais de free-form public-facing copy
 */

import {
  GEMINI_MODEL,
  GEMINI_PRICE_INPUT_PER_M,
  GEMINI_PRICE_OUTPUT_PER_M,
  OPENAI_MODEL,
  OPENAI_PRICE_INPUT_PER_M,
  OPENAI_PRICE_OUTPUT_PER_M,
  PROMPT_VERSION,
  USD_TO_EUR_RATE,
} from "./config.js";
import type {
  ExtractionResult,
  ProposalPayload,
  PropositionType,
  TraceToAnalyze,
} from "./types.js";

const ALLOWED_PROPOSITION_TYPES: ReadonlyArray<PropositionType> = [
  "match_result",
  "goal_scored",
  "red_card",
  "yellow_card",
  "substitution",
  "sanction",
  "lineup_change",
  "transfer",
  "qualification",
  "performance",
  "biographical_fact",
  "noise",
  "other",
];

function buildPrompt(trace: TraceToAnalyze): string {
  return `Tu es l'extracteur de propositions de WikiMatch. Tu reçois une modification d'un article Wikipédia surveillé. Tu produis UN seul objet JSON décrivant la PROPOSITION FACTUELLE NORMALISÉE que contient cette modification, sans aucune interprétation éditoriale.

ARTICLE : "${trace.page_title}"
ÉDITION LINGUISTIQUE : "${trace.language_code}"
TYPE D'ARTICLE : "${trace.article_type}"

TEXTE AJOUTÉ :
${trace.added_text ? trace.added_text.slice(0, 2000) : "(aucun)"}

TEXTE RETIRÉ :
${trace.removed_text ? trace.removed_text.slice(0, 2000) : "(aucun)"}

RÈGLES STRICTES :
1. Tu N'ÉCRIS PAS de texte public. Tu ne traduis pas pour publication.
2. Tu ne décides PAS du public_status (mineur/substantiel) — c'est le rôle d'un autre composant.
3. Tu ne nommes JAMAIS un contributeur Wikipédia ni n'y fais référence.
4. Tu n'inventes JAMAIS un fait absent du diff. Si le diff est du formatage ou rien d'identifiable, retourne proposition_type="noise".
5. Tu remplis "confidence" entre 0 et 1 selon la lisibilité du fait dans le diff.

LISTE EXHAUSTIVE des proposition_type AUTORISÉS :
- "match_result"         (résultat d'une rencontre ; payload : winner ('home'|'away'|'draw'), home_score, away_score)
- "goal_scored"          (but inscrit ; payload : scorer, minute)
- "red_card"             (carton rouge ; payload : player, minute, reason)
- "yellow_card"          (carton jaune ; payload : player, minute)
- "substitution"         (changement ; payload : player_in, player_out, minute)
- "sanction"             (sanction disciplinaire ; payload : target, sanction_kind, source_present)
- "lineup_change"        (changement de composition ; payload : description)
- "transfer"             (transfert / signature ; payload : player, from_club, to_club)
- "qualification"        (qualification d'une équipe ; payload : team, stage_reached)
- "performance"          (performance sportive notable décrite ; payload : description)
- "biographical_fact"    (élément biographique stable ajouté ; payload : fact_kind, description)
- "noise"                (formatage, ortho, wikiliens, refs sans fait nouveau ; payload : {})
- "other"                (rien des catégories ci-dessus ne convient ; payload : description)

REPONSE OBLIGATOIRE — un seul objet JSON valide, sans texte autour, exactement :
{
  "proposition_type": "...",
  "payload": { ... },
  "confidence": 0.0
}`;
}

function sanitizeProposal(parsed: unknown): ProposalPayload | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const type = obj.proposition_type;
  const payload = obj.payload;
  const confidence = obj.confidence;
  if (typeof type !== "string") return null;
  if (!ALLOWED_PROPOSITION_TYPES.includes(type as PropositionType)) return null;
  const payloadObj =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const conf =
    typeof confidence === "number" && confidence >= 0 && confidence <= 1
      ? confidence
      : 0.5;
  return {
    proposition_type: type as PropositionType,
    payload: payloadObj,
    confidence: conf,
  };
}

async function callOpenAI(
  prompt: string,
): Promise<{ proposal: ProposalPayload; costEur: number; model: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
    if (!response.ok) {
      console.warn(`[extractor] OpenAI HTTP ${response.status}`);
      return null;
    }
    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;
    const proposal = sanitizeProposal(JSON.parse(content));
    if (!proposal) return null;
    const promptTokens = body.usage?.prompt_tokens ?? 0;
    const completionTokens = body.usage?.completion_tokens ?? 0;
    const costUsd =
      (promptTokens * OPENAI_PRICE_INPUT_PER_M) / 1_000_000 +
      (completionTokens * OPENAI_PRICE_OUTPUT_PER_M) / 1_000_000;
    const costEur = parseFloat((costUsd * USD_TO_EUR_RATE).toFixed(6));
    return { proposal, costEur, model: OPENAI_MODEL };
  } catch (err) {
    console.warn("[extractor] OpenAI error", err);
    return null;
  }
}

async function callGemini(
  prompt: string,
): Promise<{ proposal: ProposalPayload; costEur: number; model: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });
    if (!response.ok) {
      console.warn(`[extractor] Gemini HTTP ${response.status}`);
      return null;
    }
    const body = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const proposal = sanitizeProposal(JSON.parse(text));
    if (!proposal) return null;
    const promptTokens = body.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = body.usageMetadata?.candidatesTokenCount ?? 0;
    const costUsd =
      (promptTokens * GEMINI_PRICE_INPUT_PER_M) / 1_000_000 +
      (completionTokens * GEMINI_PRICE_OUTPUT_PER_M) / 1_000_000;
    const costEur = parseFloat((costUsd * USD_TO_EUR_RATE).toFixed(6));
    return { proposal, costEur, model: GEMINI_MODEL };
  } catch (err) {
    console.warn("[extractor] Gemini error", err);
    return null;
  }
}

/**
 * Cheap regex-only fallback when ni OpenAI ni Gemini ne sont disponibles.
 * Détecte 4 patterns simples sur le texte ajouté. Pas de payload riche —
 * juste une proposition_type initiale avec faible confidence.
 */
function regexFallback(trace: TraceToAnalyze): ProposalPayload {
  const added = (trace.added_text ?? "").toLowerCase();
  if (added.length < 20) {
    return { proposition_type: "noise", payload: {}, confidence: 0.4 };
  }
  if (/\b(carton rouge|red card|tarjeta roja|tarjeta\s+roja|expuls)/i.test(added)) {
    return { proposition_type: "red_card", payload: {}, confidence: 0.4 };
  }
  if (/\b(but\s|gol\s|goal\s|marqu(e|é))/i.test(added)) {
    return { proposition_type: "goal_scored", payload: {}, confidence: 0.35 };
  }
  if (/\b(\d{1,2}\s*[-–:]\s*\d{1,2})\b/.test(added)) {
    return { proposition_type: "match_result", payload: {}, confidence: 0.4 };
  }
  if (/\b(qualifi(e|é|ée|ed)|advance|eliminat)/i.test(added)) {
    return { proposition_type: "qualification", payload: {}, confidence: 0.3 };
  }
  return { proposition_type: "other", payload: { description: added.slice(0, 200) }, confidence: 0.2 };
}

export async function extract(trace: TraceToAnalyze): Promise<ExtractionResult> {
  const prompt = buildPrompt(trace);

  const openaiRes = await callOpenAI(prompt);
  if (openaiRes) {
    return {
      proposal: openaiRes.proposal,
      provider: "openai",
      model: openaiRes.model,
      prompt_version: PROMPT_VERSION,
      cost_eur: openaiRes.costEur,
    };
  }

  const geminiRes = await callGemini(prompt);
  if (geminiRes) {
    return {
      proposal: geminiRes.proposal,
      provider: "gemini",
      model: geminiRes.model,
      prompt_version: PROMPT_VERSION,
      cost_eur: geminiRes.costEur,
    };
  }

  // Final fallback : regex offline.
  return {
    proposal: regexFallback(trace),
    provider: "regex",
    model: "regex-v1",
    prompt_version: PROMPT_VERSION,
    cost_eur: 0,
  };
}
