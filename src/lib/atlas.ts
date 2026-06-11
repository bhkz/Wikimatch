/**
 * Couche données front (lecture seule) + hooks de polling légers.
 * P0 : requêtes directes Supabase anon ; les routes /api/v1 cacheables
 * arrivent en P0.6 (spec §17) sans changer les composants.
 */

import { useEffect, useState } from "react";
import { atlas } from "./supabase";
import type { MapHex, NationStyle } from "../components/HexMap";

/* ---------------------------------- Types --------------------------------- */

export type Nation = {
  code: string;
  name_fr: string;
  flag: string;
  color: string;
  fifa_rank: number;
  group_letter: string;
  status: "alive" | "eliminated" | "champion";
  eliminated_by_match: number | null;
};

export type Match = {
  id: number;
  stage: "GROUP" | "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL";
  group_letter: string | null;
  home: string | null;
  away: string | null;
  kickoff_utc: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
  duration: string | null;
  pens_home: number | null;
  pens_away: number | null;
};

export type Resolution = {
  match_id: number;
  winner: string | null;
  loser: string | null;
  is_draw: boolean;
  goal_diff: number;
  final_gain: number;
  hexes_taken: number[];
  inherited_hexes: number[];
  narrative: string;
  resolved_at: string;
};

export type SimProbs = Record<
  string,
  { p_win_group: number; p_top2: number; p_third_rescued: number; p_qualify: number }
>;

export type SimRun = { id: number; run_at: string; iterations: number; probs: SimProbs };

export type MatchStake = {
  match_id: number;
  sim_run_id: number | null;
  drama: number;
  components: {
    swing: number;
    close: number;
    elim: number;
    stage: number;
    upset: number;
  };
  computed_at: string;
};

export type QualificationCondition = {
  group_letter: string;
  nation: string;
  sim_run_id: number | null;
  status: "qualified" | "eliminated" | "contender";
  conditions: Array<{ text: string; gd_dependent: boolean }>;
};

export type SnapshotSummary = {
  date: string;
  frame: Array<{ id: number; owner: string | null; state: MapHex["state"] }>;
  deltas: Record<string, { gained: number; lost: number }>;
};

export type HexEvent = {
  id: number;
  hex_id: number;
  match_id: number | null;
  type: string;
  from_owner: string | null;
  to_owner: string | null;
  from_state: MapHex["state"];
  to_state: MapHex["state"];
  narrative: string | null;
  created_at: string;
};

export const STAGE_LABELS: Record<Match["stage"], string> = {
  GROUP: "Groupes",
  R32: "16es de finale",
  R16: "8es de finale",
  QF: "Quart de finale",
  SF: "Demi-finale",
  THIRD: "Petite finale",
  FINAL: "FINALE",
};

/* -------------------------------- Fetchers -------------------------------- */

export async function fetchNations(): Promise<Nation[]> {
  const { data, error } = await atlas
    .from("nations")
    .select("code, name_fr, flag, color, fifa_rank, group_letter, status, eliminated_by_match")
    .order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as Nation[];
}

export async function fetchHexes(): Promise<MapHex[]> {
  const { data, error } = await atlas
    .from("hexes")
    .select("id, q, r, city_name, is_capital, owner, state")
    .order("id")
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((h) => ({
    id: h.id as number,
    q: h.q as number,
    r: h.r as number,
    cityName: h.city_name as string,
    isCapital: h.is_capital as boolean,
    owner: h.owner as string | null,
    state: h.state as MapHex["state"],
  }));
}

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await atlas
    .from("matches")
    .select("id, stage, group_letter, home, away, kickoff_utc, status, score_home, score_away, duration, pens_home, pens_away")
    .order("kickoff_utc")
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Match[];
}

export async function fetchLatestSim(): Promise<SimRun | null> {
  const { data, error } = await atlas
    .from("sim_runs")
    .select("id, run_at, iterations, probs")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SimRun | null) ?? null;
}

export async function fetchMatchStakes(): Promise<MatchStake[]> {
  const { data, error } = await atlas
    .from("match_stakes")
    .select("match_id, sim_run_id, drama, components, computed_at")
    .order("drama", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MatchStake[];
}

export async function fetchQualificationConditions(): Promise<QualificationCondition[]> {
  const { data, error } = await atlas
    .from("qualification_conditions")
    .select("group_letter, nation, sim_run_id, status, conditions")
    .order("group_letter")
    .order("nation");
  if (error) throw new Error(error.message);
  return (data ?? []) as QualificationCondition[];
}

export async function fetchSnapshots(): Promise<SnapshotSummary[]> {
  const { data, error } = await atlas
    .from("snapshots")
    .select("date, frame, deltas")
    .order("date", { ascending: true })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as SnapshotSummary[];
}

export async function fetchResolutions(): Promise<Resolution[]> {
  const { data, error } = await atlas
    .from("resolutions")
    .select("match_id, winner, loser, is_draw, goal_diff, final_gain, hexes_taken, inherited_hexes, narrative, resolved_at")
    .order("resolved_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Resolution[];
}

export async function fetchHexEvents(): Promise<HexEvent[]> {
  const { data, error } = await atlas
    .from("hex_events")
    .select("id, hex_id, match_id, type, from_owner, to_owner, from_state, to_state, narrative, created_at")
    .order("id", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as HexEvent[];
}

/* --------------------------------- Helpers -------------------------------- */

export function nationStyles(nations: Nation[]): Map<string, NationStyle> {
  return new Map(nations.map((n) => [n.code, { color: n.color, name: n.name_fr, flag: n.flag }]));
}

export function isLive(m: Match): boolean {
  return m.status === "IN_PLAY" || m.status === "PAUSED" || m.status === "LIVE";
}

/** Nations dont un match est en cours (pour le pulse de la carte). */
export function liveOwners(matches: Match[]): Set<string> {
  const live = new Set<string>();
  for (const m of matches) {
    if (!isLive(m)) continue;
    if (m.home) live.add(m.home);
    if (m.away) live.add(m.away);
  }
  return live;
}

export function kickoffLabel(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function kickoffTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Date "journée Atlas" : les matchs de la nuit appartiennent à la veille (§8). */
export function sameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") === ref.toLocaleDateString("fr-FR");
}

/* ----------------------------------- Hook ---------------------------------- */

export type AtlasData = {
  nations: Nation[];
  hexes: MapHex[];
  matches: Match[];
  resolutions: Resolution[];
  sim: SimRun | null;
  stakes: MatchStake[];
  conditions: QualificationCondition[];
  snapshots: SnapshotSummary[];
  events: HexEvent[];
};

/**
 * Charge tout l'état public et rafraîchit : 30 s si un match est en cours,
 * 120 s sinon (poids minuscule : 4 requêtes lisant des tables de ≤700 lignes).
 */
export function useAtlasData(): { data: AtlasData | null; error: string | null } {
  const [data, setData] = useState<AtlasData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        const [nations, hexes, matches, resolutions, sim, stakes, conditions, snapshots, events] = await Promise.all([
          fetchNations(),
          fetchHexes(),
          fetchMatches(),
          fetchResolutions(),
          fetchLatestSim(),
          fetchMatchStakes(),
          fetchQualificationConditions(),
          fetchSnapshots(),
          fetchHexEvents(),
        ]);
        if (cancelled) return;
        setData({ nations, hexes, matches, resolutions, sim, stakes, conditions, snapshots, events });
        setError(null);
        timer = setTimeout(load, matches.some(isLive) ? 30_000 : 120_000);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        timer = setTimeout(load, 60_000);
      }
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { data, error };
}
