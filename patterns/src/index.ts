/**
 * Patterns service entry point — Jalon C.
 *
 * Boucle :
 *  1. detectPatterns() lit trace_propositions récentes et regroupe.
 *  2. publish(pattern) pour chacun : safety checks + template + insert.
 *  3. Sleep PATTERNS_POLL_INTERVAL_MS, recommence.
 *
 * Aucune IA appelée ici. Toute la copy publique est générée par template.
 */

import { PATTERNS_DRY_RUN, PATTERNS_POLL_INTERVAL_MS } from "./config.js";
import { detectPatterns } from "./matchers.js";
import { publish } from "./publisher.js";

let shuttingDown = false;
const dryRunLoggedPatternKeys = new Set<string>();
const stats = {
  detected: 0,
  published: 0,
  blocked_safety: 0,
  already_published: 0,
  template_missing: 0,
  dry_run: 0,
  publication_disabled: 0,
  dry_run_duplicates_skipped: 0,
  errors: 0,
  manual_review_required: 0,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(): Promise<void> {
  const patterns = await detectPatterns();
  stats.detected += patterns.length;
  if (patterns.length === 0) return;

  console.log(`[patterns] detected ${patterns.length} pattern(s) this cycle`);
  for (const pattern of patterns) {
    if (shuttingDown) break;
    try {
      if (PATTERNS_DRY_RUN) {
        const sortedIds = [...pattern.proposition_ids].sort().join(",");
        const key = `${pattern.pattern_type}:${sortedIds}`;
        if (dryRunLoggedPatternKeys.has(key)) {
          stats.dry_run_duplicates_skipped += 1;
          continue;
        }
        dryRunLoggedPatternKeys.add(key);
      }

      const r = await publish(pattern);
      switch (r.status) {
        case "published":
          stats.published += 1;
          break;
        case "blocked_safety":
          stats.blocked_safety += 1;
          console.log(`[patterns] blocked: ${pattern.pattern_type} reason=${r.reason}`);
          break;
        case "manual_review_required":
          stats.manual_review_required += 1;
          console.log(`[patterns] manual review required: ${pattern.pattern_type} reason=${r.reason}`);
          break;
        case "already_published":
          stats.already_published += 1;
          break;
        case "template_missing":
          stats.template_missing += 1;
          break;
        case "dry_run":
          stats.dry_run += 1;
          break;
        case "publication_disabled":
          stats.publication_disabled += 1;
          break;
        case "error":
          stats.errors += 1;
          break;
      }
    } catch (err) {
      stats.errors += 1;
      console.error("[patterns] publish error:", err);
    }
  }
}

function startStatsLogger(): NodeJS.Timeout {
  return setInterval(() => {
    console.log(`[stats] ${JSON.stringify(stats)}`);
  }, 60_000);
}

async function loop(): Promise<void> {
  console.log(
    `[patterns] start (dry_run=${PATTERNS_DRY_RUN}, poll=${PATTERNS_POLL_INTERVAL_MS}ms)`,
  );
  const statsTimer = startStatsLogger();
  statsTimer.unref();

  process.on("SIGINT", () => { shuttingDown = true; });
  process.on("SIGTERM", () => { shuttingDown = true; });

  while (!shuttingDown) {
    try {
      await runOnce();
    } catch (err) {
      stats.errors += 1;
      console.error("[patterns] loop error:", err);
    }
    await sleep(PATTERNS_POLL_INTERVAL_MS);
  }
  console.log(`[patterns] shutdown stats=${JSON.stringify(stats)}`);
}

loop().catch((err) => {
  console.error("[patterns] fatal:", err);
  process.exit(1);
});
