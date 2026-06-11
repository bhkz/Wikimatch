/**
 * Job simulate (spec §7, §16.2) : relance la simulation Monte-Carlo quand
 * l'état des matchs de groupes a changé (nouveau score FINISHED) ou si le
 * dernier run date de plus de 12 h. Résultats dans atlas.sim_runs (seed
 * stockée → run rejouable).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { simulateGroupStage, type SimMatch, type SimNation } from "../../../lib/sim/simulate";
import { DEFAULT_MODEL } from "../../../lib/sim/model";
import { ENGINE_VERSION } from "../../../lib/engine/types";
import { logJob } from "../db";

export async function simulateIfStale(supabase: SupabaseClient): Promise<boolean> {
  const atlas = supabase.schema("atlas");

  const [{ data: nations, error: nErr }, { data: matches, error: mErr }, { data: cfgRows, error: cErr }] =
    await Promise.all([
      atlas.from("nations").select("code, group_letter, fifa_points, status"),
      atlas
        .from("matches")
        .select("id, group_letter, home, away, status, score_home, score_away")
        .eq("stage", "GROUP")
        .order("id")
        .limit(120),
      atlas.from("game_config").select("key, value").in("key", [
        "sim_iterations", "elo_divisor", "draw_base", "draw_slope", "draw_min", "mu_goals",
      ]),
    ]);
  if (nErr) throw new Error(`nations: ${nErr.message}`);
  if (mErr) throw new Error(`matches: ${mErr.message}`);
  if (cErr) throw new Error(`game_config: ${cErr.message}`);

  // Empreinte de l'état des groupes : si rien n'a changé, pas de nouveau run.
  const fingerprint = (matches ?? [])
    .map((m) => `${m.id}:${m.status === "FINISHED" ? `${m.score_home}-${m.score_away}` : "?"}`)
    .join("|");

  const { data: state } = await atlas.from("ingest_state").select("value").eq("key", "sim_state").maybeSingle();
  const prev = (state?.value ?? {}) as { fingerprint?: string; ranAt?: string };
  const staleMs = 12 * 3600_000;
  if (prev.fingerprint === fingerprint && prev.ranAt && Date.now() - Date.parse(prev.ranAt) < staleMs) {
    return false;
  }

  const cfg = new Map((cfgRows ?? []).map((r) => [r.key as string, r.value as number]));
  const iterations = cfg.get("sim_iterations") ?? 10_000;
  const model = {
    eloDivisor: cfg.get("elo_divisor") ?? DEFAULT_MODEL.eloDivisor,
    drawBase: cfg.get("draw_base") ?? DEFAULT_MODEL.drawBase,
    drawSlope: cfg.get("draw_slope") ?? DEFAULT_MODEL.drawSlope,
    drawMin: cfg.get("draw_min") ?? DEFAULT_MODEL.drawMin,
    muGoals: cfg.get("mu_goals") ?? DEFAULT_MODEL.muGoals,
  };

  const simNations: SimNation[] = (nations ?? []).map((n) => ({
    code: n.code as string,
    group: n.group_letter as string,
    elo: n.fifa_points as number,
  }));
  const simMatches: SimMatch[] = (matches ?? [])
    .filter((m) => m.home && m.away && m.group_letter)
    .map((m) => ({
      id: m.id as number,
      group: m.group_letter as string,
      home: m.home as string,
      away: m.away as string,
      scoreHome: m.status === "FINISHED" ? (m.score_home as number | null) : null,
      scoreAway: m.status === "FINISHED" ? (m.score_away as number | null) : null,
    }));

  // Seed = empreinte de l'état → reproductible, change avec chaque résultat.
  const seed = `wc26:${fingerprint.length}:${fingerprint.slice(0, 64)}`;
  const result = simulateGroupStage(simNations, simMatches, iterations, seed, model);

  const { error: iErr } = await atlas.from("sim_runs").insert({
    seed,
    iterations,
    engine_version: ENGINE_VERSION,
    probs: result.probs,
  });
  if (iErr) throw new Error(`sim_runs insert: ${iErr.message}`);

  const { error: uErr } = await atlas
    .from("ingest_state")
    .upsert({ key: "sim_state", value: { fingerprint, ranAt: new Date().toISOString() } }, { onConflict: "key" });
  if (uErr) throw new Error(`ingest_state: ${uErr.message}`);

  await logJob(supabase, "simulate", true, { iterations, seedPrefix: seed.slice(0, 32) });
  console.log(`✓ simulation ${iterations} itérations (seed ${seed.slice(0, 24)}…).`);
  return true;
}
