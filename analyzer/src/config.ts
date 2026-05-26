import "dotenv/config";

export const ANALYZER_DRY_RUN = process.env.ANALYZER_DRY_RUN === "true";
export const ANALYZER_POLL_INTERVAL_MS = Number(
  process.env.ANALYZER_POLL_INTERVAL_MS ?? 10_000,
);
export const ANALYZER_BATCH_SIZE = Number(
  process.env.ANALYZER_BATCH_SIZE ?? 5,
);
export const AI_DAILY_EUR_CAP = Number(process.env.AI_DAILY_EUR_CAP ?? 6.5);
export const USD_TO_EUR_RATE = Number(process.env.USD_TO_EUR_RATE ?? 0.92);

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const PROMPT_VERSION = "extractor-v1";

// Tarifs USD par 1M tokens (à mettre à jour si les providers changent leurs prix).
export const OPENAI_PRICE_INPUT_PER_M = 0.15;
export const OPENAI_PRICE_OUTPUT_PER_M = 0.6;
export const GEMINI_PRICE_INPUT_PER_M = 0.075;
export const GEMINI_PRICE_OUTPUT_PER_M = 0.3;
