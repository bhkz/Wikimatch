/**
 * Analyzer entry point — Jalon B.
 *
 * Boucle :
 *  1. SELECT N traces où ingest_status='observed', avec leur private_content.
 *  2. Pour chacune, appel extract() (OpenAI → Gemini → regex).
 *  3. INSERT trace_propositions + INSERT ai_analysis_runs (si IA).
 *  4. UPDATE revision_traces.ingest_status='classified'.
 *  5. Sleep ANALYZER_POLL_INTERVAL_MS, recommence.
 *
 * Si le cap budget journalier est atteint : la boucle continue mais skip
 * les providers payants — fallback regex uniquement, ou skip entier si on
 * veut être strict (laisse les traces à 'observed' pour le lendemain).
 *
 * Le pattern matcher (Jalon C) lit ensuite trace_propositions et décide
 * ce qui se publie.
 */

import {
  ANALYZER_BATCH_SIZE,
  ANALYZER_DRY_RUN,
  ANALYZER_POLL_INTERVAL_MS,
} from "./config.js";
import { extract } from "./extractor.js";
import { regexOnly } from "./extractor-regex.js";
import { isBudgetAvailable } from "./budget.js";
import { supabase } from "./supabase.js";
import type {
  TracePropositionInsert,
  TraceToAnalyze,
} from "./types.js";

interface TraceJoinedRow {
  id: string;
  article_id: string;
  ingest_status: string;
  article: {
    page_title: string;
    language_code: string;
    article_type: string;
  } | null;
  private_content: {
    raw_added_text: string | null;
    raw_removed_text: string | null;
  } | null;
}

let shuttingDown = false;
let stats = {
  processed: 0,
  noise: 0,
  ai_calls: 0,
  regex_calls: 0,
  errors: 0,
  budget_skips: 0,
};

async function fetchBatch(): Promise<TraceToAnalyze[]> {
  const { data, error } = await supabase
    .from("revision_traces")
    .select(
      `
        id,
        article_id,
        ingest_status,
        article:wiki_articles!inner (
          page_title,
          language_code,
          article_type
        ),
        private_content:trace_private_content!inner (
          raw_added_text,
          raw_removed_text
        )
      `,
    )
    .eq("ingest_status", "observed")
    .order("observed_at", { ascending: true })
    .limit(ANALYZER_BATCH_SIZE);

  if (error) {
    console.error("[analyzer] fetchBatch error:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as TraceJoinedRow[])
    .map((row) => {
      if (!row.article) return null;
      return {
        trace_id: row.id,
        article_id: row.article_id,
        page_title: row.article.page_title,
        language_code: row.article.language_code,
        article_type: row.article.article_type,
        added_text: row.private_content?.raw_added_text ?? null,
        removed_text: row.private_content?.raw_removed_text ?? null,
      };
    })
    .filter((t): t is TraceToAnalyze => t !== null);
}

async function persistProposition(
  trace: TraceToAnalyze,
  insertRow: TracePropositionInsert,
): Promise<boolean> {
  if (ANALYZER_DRY_RUN) {
    console.log(
      `[analyzer] DRY_RUN — would insert proposition ${insertRow.proposition_type} for trace ${trace.trace_id}`,
    );
    return true;
  }

  const { error: propError } = await supabase
    .from("trace_propositions")
    .insert(insertRow);
  if (propError) {
    console.error("[analyzer] proposition insert failed:", propError.message);
    return false;
  }

  // AI run accounting (skip pour regex car coût nul)
  if (insertRow.extraction_provider !== "regex" && insertRow.extraction_provider !== "manual") {
    const { error: aiRunError } = await supabase.from("ai_analysis_runs").insert({
      task_type: "extract_proposition",
      provider: insertRow.extraction_provider,
      model_name: insertRow.extraction_model,
      prompt_version: insertRow.extraction_prompt_version,
      output_json: {
        proposition_type: insertRow.proposition_type,
        payload: insertRow.normalized_payload,
        confidence: insertRow.extraction_confidence,
      },
      estimated_cost_eur: insertRow.estimated_cost_eur,
    });
    if (aiRunError) {
      console.error("[analyzer] ai_run insert failed:", aiRunError.message);
    }
  }

  const { error: updError } = await supabase
    .from("revision_traces")
    .update({ ingest_status: "classified" })
    .eq("id", trace.trace_id);
  if (updError) {
    console.error("[analyzer] trace ingest_status update failed:", updError.message);
    return false;
  }

  return true;
}

async function processOne(trace: TraceToAnalyze, budgetOk: boolean): Promise<void> {
  // Si pas de budget IA : on tente quand même le regex (gratuit). Si même le
  // regex retourne "other" ou rien, on n'avance pas et la trace reste
  // "observed" pour le prochain cycle (potentiellement le lendemain).
  let result;
  if (!budgetOk) {
    // Cap budget atteint : on n'appelle pas d'API payante, on retombe
    // sur la classification regex (gratuite, faible confidence).
    result = regexOnly(trace);
    stats.regex_calls += 1;
  } else {
    result = await extract(trace);
    if (result.provider === "regex") stats.regex_calls += 1;
    else stats.ai_calls += 1;
  }

  if (result.proposal.proposition_type === "noise") {
    stats.noise += 1;
  }

  const insertRow: TracePropositionInsert = {
    trace_id: trace.trace_id,
    proposition_type: result.proposal.proposition_type,
    normalized_payload: result.proposal.payload,
    language_code: trace.language_code,
    extraction_provider: result.provider,
    extraction_confidence: result.proposal.confidence,
    extraction_model: result.model,
    extraction_prompt_version: result.prompt_version,
    estimated_cost_eur: result.cost_eur,
  };

  const ok = await persistProposition(trace, insertRow);
  if (ok) {
    stats.processed += 1;
  } else {
    stats.errors += 1;
  }
}

async function runOnce(): Promise<number> {
  const traces = await fetchBatch();
  if (traces.length === 0) return 0;

  const budgetOk = await isBudgetAvailable();
  if (!budgetOk) stats.budget_skips += 1;

  for (const trace of traces) {
    if (shuttingDown) break;
    try {
      await processOne(trace, budgetOk);
    } catch (err) {
      stats.errors += 1;
      console.error(`[analyzer] error processing trace ${trace.trace_id}:`, err);
    }
  }
  return traces.length;
}

function startStatsLogger(): NodeJS.Timeout {
  return setInterval(() => {
    console.log(`[stats] ${JSON.stringify(stats)}`);
  }, 60_000);
}

async function loop(): Promise<void> {
  console.log(
    `[analyzer] start (dry_run=${ANALYZER_DRY_RUN}, batch=${ANALYZER_BATCH_SIZE}, poll=${ANALYZER_POLL_INTERVAL_MS}ms)`,
  );
  const statsTimer = startStatsLogger();
  statsTimer.unref();

  process.on("SIGINT", () => { shuttingDown = true; });
  process.on("SIGTERM", () => { shuttingDown = true; });

  while (!shuttingDown) {
    const n = await runOnce();
    if (n === 0) {
      await sleep(ANALYZER_POLL_INTERVAL_MS);
    }
  }
  console.log(`[analyzer] shutdown stats=${JSON.stringify(stats)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

loop().catch((err) => {
  console.error("[analyzer] fatal:", err);
  process.exit(1);
});
