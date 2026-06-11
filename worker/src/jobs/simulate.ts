/**
 * Job simulate (spec §6, §7, §16.3) : relance la simulation Monte-Carlo quand
 * l'état des matchs de groupes change ou si le dernier run date de plus de 12 h.
 * Écrit aussi les enjeux des matchs et les conditions de qualification P1.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { groupOutlook } from "../../../lib/conditions";
import {
  closeness,
  composeDrama,
  elimFlag,
  stageWeight,
  upsetPotential,
  type DramaWeights,
  type StageWeights,
} from "../../../lib/drama";
import { ENGINE_VERSION } from "../../../lib/engine/types";
import type { Stage } from "../../../lib/providers/types";
import { DEFAULT_MODEL } from "../../../lib/sim/model";
import { simulateGroupStage, type SimMatch, type SimNation } from "../../../lib/sim/simulate";
import { logJob } from "../db";

const DEFAULT_DRAMA_WEIGHTS: DramaWeights = {
  swing: 0.35,
  close: 0.25,
  elim: 0.2,
  stage: 0.1,
  upset: 0.1,
};

const DEFAULT_STAGE_WEIGHTS: StageWeights = {
  GJ1: 0.3,
  GJ2: 0.6,
  GJ3: 1,
  R32: 0.8,
  R16: 0.8,
  QF: 0.9,
  SF: 1,
  FINAL: 1,
};

type MatchRow = {
  id: number;
  stage: Stage;
  group_letter: string | null;
  matchday: number | null;
  home: string | null;
  away: string | null;
  status: string;
  score_home: number | null;
  score_away: number | null;
};

type SimConfig = {
  iterations: number;
  swingIterations: number;
  model: typeof DEFAULT_MODEL;
  dramaWeights: DramaWeights;
  stageWeights: StageWeights;
};

function configFromRows(rows: Array<{ key: string; value: unknown }>): SimConfig {
  const cfg = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: string, fallback: number): number => {
    const v = cfg.get(key);
    return typeof v === "number" ? v : fallback;
  };

  return {
    iterations: num("sim_iterations", 10_000),
    swingIterations: num("swing_iterations", 2_000),
    model: {
      eloDivisor: num("elo_divisor", DEFAULT_MODEL.eloDivisor),
      drawBase: num("draw_base", DEFAULT_MODEL.drawBase),
      drawSlope: num("draw_slope", DEFAULT_MODEL.drawSlope),
      drawMin: num("draw_min", DEFAULT_MODEL.drawMin),
      muGoals: num("mu_goals", DEFAULT_MODEL.muGoals),
    },
    dramaWeights: (cfg.get("drama_weights") as DramaWeights | undefined) ?? DEFAULT_DRAMA_WEIGHTS,
    stageWeights: (cfg.get("stage_weights") as StageWeights | undefined) ?? DEFAULT_STAGE_WEIGHTS,
  };
}

function isFinishedGroupMatch(
  m: MatchRow,
): m is MatchRow & { group_letter: string; home: string; away: string; score_home: number; score_away: number } {
  return (
    m.stage === "GROUP" &&
    m.group_letter !== null &&
    m.home !== null &&
    m.away !== null &&
    m.status === "FINISHED" &&
    m.score_home !== null &&
    m.score_away !== null
  );
}

function isPlayableMatch(m: MatchRow): m is MatchRow & { home: string; away: string } {
  return (
    m.home !== null &&
    m.away !== null &&
    m.status !== "FINISHED" &&
    m.status !== "POSTPONED" &&
    m.status !== "SUSPENDED" &&
    m.status !== "CANCELLED"
  );
}

async function writeMatchStakes(
  supabase: SupabaseClient,
  simRunId: number,
  nations: SimNation[],
  simMatches: SimMatch[],
  matches: MatchRow[],
  cfg: SimConfig,
  seed: string,
): Promise<number> {
  const atlas = supabase.schema("atlas");
  const eloByCode = new Map(nations.map((n) => [n.code, n.elo]));
  const rows = [];

  for (const m of matches.filter(isPlayableMatch)) {
    const homeElo = eloByCode.get(m.home) ?? 1400;
    const awayElo = eloByCode.get(m.away) ?? 1400;
    const close = closeness(homeElo, awayElo, cfg.model);
    const stage = stageWeight(m.stage, m.matchday, cfg.stageWeights);
    const elim = elimFlag(m.stage, m.matchday) * stage;
    const upset = upsetPotential(homeElo, awayElo, cfg.model);

    let swing = 0;
    if (m.stage === "GROUP") {
      const homeWin = simulateGroupStage(
        nations,
        simMatches,
        cfg.swingIterations,
        `${seed}:swing:${m.id}:home`,
        cfg.model,
        { matchId: m.id, outcome: "HOME" },
      );
      const awayWin = simulateGroupStage(
        nations,
        simMatches,
        cfg.swingIterations,
        `${seed}:swing:${m.id}:away`,
        cfg.model,
        { matchId: m.id, outcome: "AWAY" },
      );
      swing = Math.max(
        Math.abs((homeWin.probs[m.home]?.p_qualify ?? 0) - (awayWin.probs[m.home]?.p_qualify ?? 0)),
        Math.abs((homeWin.probs[m.away]?.p_qualify ?? 0) - (awayWin.probs[m.away]?.p_qualify ?? 0)),
      );
    }

    const components = { swing, close, elim, stage, upset };
    rows.push({
      match_id: m.id,
      sim_run_id: simRunId,
      drama: composeDrama(components, cfg.dramaWeights),
      components,
      computed_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) return 0;
  const { error } = await atlas.from("match_stakes").upsert(rows, { onConflict: "match_id" });
  if (error) throw new Error(`match_stakes upsert: ${error.message}`);
  return rows.length;
}

async function writeQualificationConditions(
  supabase: SupabaseClient,
  simRunId: number,
  nations: SimNation[],
  matches: MatchRow[],
): Promise<number> {
  const atlas = supabase.schema("atlas");
  const groups = [...new Set(nations.map((n) => n.group))].sort();
  const rows = [];

  for (const group of groups) {
    const codes = nations.filter((n) => n.group === group).map((n) => n.code);
    const groupMatches = matches.filter((m) => m.stage === "GROUP" && m.group_letter === group);
    const played = groupMatches.filter(isFinishedGroupMatch).map((m) => ({
      home: m.home,
      away: m.away,
      scoreHome: m.score_home,
      scoreAway: m.score_away,
    }));
    const remaining = groupMatches
      .filter((m): m is MatchRow & { home: string; away: string } =>
        m.home !== null && m.away !== null && m.status !== "FINISHED",
      )
      .map((m) => ({ id: m.id, home: m.home, away: m.away }));

    const outlook = groupOutlook(codes, played, remaining);
    for (const code of codes) {
      rows.push({
        group_letter: group,
        nation: code,
        sim_run_id: simRunId,
        status: outlook[code].status,
        conditions: outlook[code].conditions,
      });
    }
  }

  if (rows.length === 0) return 0;
  const { error } = await atlas.from("qualification_conditions").upsert(rows, {
    onConflict: "group_letter,nation",
  });
  if (error) throw new Error(`qualification_conditions upsert: ${error.message}`);
  return rows.length;
}

export async function simulateIfStale(supabase: SupabaseClient, force = false): Promise<boolean> {
  const atlas = supabase.schema("atlas");

  const [{ data: nations, error: nErr }, { data: matches, error: mErr }, { data: cfgRows, error: cErr }] =
    await Promise.all([
      atlas.from("nations").select("code, group_letter, fifa_points, status"),
      atlas
        .from("matches")
        .select("id, stage, group_letter, matchday, home, away, status, score_home, score_away")
        .order("id")
        .limit(120),
      atlas.from("game_config").select("key, value").in("key", [
        "sim_iterations",
        "swing_iterations",
        "elo_divisor",
        "draw_base",
        "draw_slope",
        "draw_min",
        "mu_goals",
        "drama_weights",
        "stage_weights",
      ]),
    ]);
  if (nErr) throw new Error(`nations: ${nErr.message}`);
  if (mErr) throw new Error(`matches: ${mErr.message}`);
  if (cErr) throw new Error(`game_config: ${cErr.message}`);

  const allMatches = (matches ?? []) as MatchRow[];
  const groupMatches = allMatches.filter((m) => m.stage === "GROUP");
  const fingerprint = groupMatches
    .map((m) => `${m.id}:${m.status === "FINISHED" ? `${m.score_home}-${m.score_away}` : "?"}`)
    .join("|");

  const { data: state } = await atlas.from("ingest_state").select("value").eq("key", "sim_state").maybeSingle();
  const prev = (state?.value ?? {}) as { fingerprint?: string; ranAt?: string };
  const staleMs = 12 * 3600_000;
  if (!force && prev.fingerprint === fingerprint && prev.ranAt && Date.now() - Date.parse(prev.ranAt) < staleMs) {
    const [{ count: stakesCount }, { count: conditionsCount }] = await Promise.all([
      atlas.from("match_stakes").select("match_id", { count: "exact", head: true }),
      atlas.from("qualification_conditions").select("nation", { count: "exact", head: true }),
    ]);
    if ((stakesCount ?? 0) > 0 && (conditionsCount ?? 0) >= 48) return false;
  }

  const cfg = configFromRows((cfgRows ?? []) as Array<{ key: string; value: unknown }>);
  const simNations: SimNation[] = (nations ?? []).map((n) => ({
    code: n.code as string,
    group: n.group_letter as string,
    elo: n.fifa_points as number,
  }));
  const simMatches: SimMatch[] = groupMatches
    .filter((m): m is MatchRow & { group_letter: string; home: string; away: string } =>
      m.home !== null && m.away !== null && m.group_letter !== null,
    )
    .map((m) => ({
      id: m.id,
      group: m.group_letter,
      home: m.home,
      away: m.away,
      scoreHome: m.status === "FINISHED" ? m.score_home : null,
      scoreAway: m.status === "FINISHED" ? m.score_away : null,
    }));

  const seed = `wc26:${fingerprint.length}:${fingerprint.slice(0, 64)}`;
  const result = simulateGroupStage(simNations, simMatches, cfg.iterations, seed, cfg.model);

  const { data: insertedRun, error: iErr } = await atlas
    .from("sim_runs")
    .insert({
      seed,
      iterations: cfg.iterations,
      engine_version: ENGINE_VERSION,
      probs: result.probs,
    })
    .select("id")
    .single();
  if (iErr) throw new Error(`sim_runs insert: ${iErr.message}`);
  const simRunId = insertedRun!.id as number;

  const stakes = await writeMatchStakes(supabase, simRunId, simNations, simMatches, allMatches, cfg, seed);
  const conditions = await writeQualificationConditions(supabase, simRunId, simNations, allMatches);

  const { error: uErr } = await atlas
    .from("ingest_state")
    .upsert({ key: "sim_state", value: { fingerprint, ranAt: new Date().toISOString() } }, { onConflict: "key" });
  if (uErr) throw new Error(`ingest_state: ${uErr.message}`);

  await logJob(supabase, "simulate", true, {
    iterations: cfg.iterations,
    seedPrefix: seed.slice(0, 32),
    stakes,
    conditions,
  });
  console.log(`✓ simulation ${cfg.iterations} itérations (seed ${seed.slice(0, 24)}…).`);
  return true;
}
