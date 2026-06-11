/**
 * Worker Atlas (spec §16) — boucle unique :
 * poll_matches (cadence rapide pendant les fenêtres de matchs, lente sinon)
 * → resolve des matchs terminés confirmés → healthcheck HTTP pour Railway.
 *
 * Déploiement : Railway (npm run worker:start). Env requis :
 * SUPABASE_URL, SUPABASE_SERVICE_KEY, FOOTBALL_DATA_TOKEN
 * (optionnels : ALERT_WEBHOOK_URL, PORT).
 */

import "dotenv/config";
import { createServer } from "node:http";
import { alert, createWorkerClient, loadConfig, loadEngineState, loadNations, logJob } from "./db";
import { pollMatches } from "./jobs/poll-matches";
import { resolveFinishedMatches } from "./jobs/resolve-matches";
import { snapshotIfDue } from "./jobs/snapshot";
import { simulateIfStale } from "./jobs/simulate";

const startedAt = new Date().toISOString();
let lastTickAt: string | null = null;
let lastTickOk = true;
let consecutiveFailures = 0;

async function tick(): Promise<{ anyLive: boolean }> {
  const supabase = createWorkerClient();
  const cfg = await loadConfig(supabase);

  if (cfg.gameOver) {
    // §21.16 : après la finale, plus AUCUNE mutation — le worker se met en veille.
    return { anyLive: false };
  }

  const nations = await loadNations(supabase);
  const poll = await pollMatches(supabase, nations, cfg.stageMapping);
  await logJob(supabase, "poll_matches", true, {
    upserted: poll.upserted,
    newlyFinished: poll.newlyFinished,
  });

  const state = await loadEngineState(supabase, nations, cfg.gameOver);
  const resolvedCount = await resolveFinishedMatches(
    supabase,
    state,
    nations,
    cfg.game,
    cfg.resolutionConfirmDelayS,
  );
  if (resolvedCount > 0) console.log(`tick: ${resolvedCount} match(s) résolu(s).`);

  await snapshotIfDue(supabase, state);
  await simulateIfStale(supabase);
  return { anyLive: poll.anyLive };
}

async function loop(): Promise<void> {
  let delayS = 120;
  for (;;) {
    try {
      const { anyLive } = await tick();
      lastTickOk = true;
      consecutiveFailures = 0;
      // Cadence : rapide si un match est en cours/imminent, lente sinon (§16.3).
      const supabase = createWorkerClient();
      const cfg = await loadConfig(supabase);
      delayS = anyLive ? cfg.pollFastS : cfg.pollSlowS;
    } catch (err) {
      lastTickOk = false;
      consecutiveFailures++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`tick KO (${consecutiveFailures}) : ${msg}`);
      if (consecutiveFailures === 3) {
        await alert(`Worker en échec ×3 : ${msg}`);
      }
      // Backoff doux, plafonné à 10 min.
      delayS = Math.min(60 * 2 ** Math.min(consecutiveFailures, 3), 600);
    }
    lastTickAt = new Date().toISOString();
    await new Promise((r) => setTimeout(r, delayS * 1000));
  }
}

// Healthcheck HTTP (Railway ping) — état du worker, lecture seule.
const port = Number(process.env.PORT ?? 8787);
createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(lastTickOk ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: lastTickOk, startedAt, lastTickAt, consecutiveFailures }));
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(port, () => console.log(`Atlas worker · healthcheck sur :${port}/health`));

loop().catch(async (err) => {
  await alert(`Worker crashé : ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
