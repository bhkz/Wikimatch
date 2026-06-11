/**
 * Job resolve (spec §16.2, §18.2) : résout les matchs terminés confirmés,
 * dans l'ordre chronologique (déterminisme : la surextension dépend de l'état
 * courant). Écriture atomique via RPC atlas.apply_resolution (advisory lock).
 *
 * Sources de résultat, par priorité (spec §3.3) :
 * 1. match_overrides (admin) — résolution immédiate ;
 * 2. matches FINISHED depuis ≥ resolution_confirm_delay_s (anti-correction API).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMatch } from "../../../lib/engine/resolve";
import type { EngineState, GameConfig } from "../../../lib/engine/types";
import { normalizeOverride, type MatchRow, type OverrideRow } from "../../../lib/providers/manual-override";
import type { NormalizedMatch } from "../../../lib/providers/types";
import { alert, logJob, type NationRow } from "../db";

type DbMatch = MatchRow & {
  status: string;
  score_home: number | null;
  score_away: number | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | null;
  pens_home: number | null;
  pens_away: number | null;
};

export async function resolveFinishedMatches(
  supabase: SupabaseClient,
  state: EngineState,
  nations: NationRow[],
  cfg: GameConfig,
  confirmDelayS: number,
): Promise<number> {
  const atlas = supabase.schema("atlas");

  const [{ data: matches, error: mErr }, { data: resolutions, error: rErr }, { data: overrides, error: oErr }, { data: seenRow }] =
    await Promise.all([
      atlas
        .from("matches")
        .select("id, stage, group_letter, home, away, kickoff_utc, status, score_home, score_away, duration, pens_home, pens_away")
        .order("kickoff_utc")
        .order("id")
        .limit(200),
      atlas.from("resolutions").select("match_id").limit(200),
      atlas.from("match_overrides").select("match_id, score_home, score_away, duration, pens_home, pens_away").limit(200),
      atlas.from("ingest_state").select("value").eq("key", "finished_seen").maybeSingle(),
    ]);
  if (mErr) throw new Error(`matches: ${mErr.message}`);
  if (rErr) throw new Error(`resolutions: ${rErr.message}`);
  if (oErr) throw new Error(`match_overrides: ${oErr.message}`);

  const resolved = new Set((resolutions ?? []).map((r) => r.match_id as number));
  const overrideById = new Map((overrides ?? []).map((o) => [o.match_id as number, o as OverrideRow]));
  const finishedSeen = ((seenRow?.value ?? {}) as Record<string, string>) ?? {};
  const labels = new Map(nations.map((n) => [n.code, { flag: n.flag, name: n.name_fr }]));
  const now = Date.now();

  let count = 0;
  for (const raw of (matches ?? []) as DbMatch[]) {
    if (resolved.has(raw.id)) continue;

    const override = overrideById.get(raw.id);
    let normalized: NormalizedMatch | null = null;

    if (override && raw.home && raw.away) {
      normalized = normalizeOverride(raw, override);
    } else if (raw.status === "FINISHED") {
      // Délai de confirmation : on attend N secondes après première détection.
      const seenAt = finishedSeen[String(raw.id)];
      if (!seenAt || now - Date.parse(seenAt) < confirmDelayS * 1000) continue;
      if (!raw.home || !raw.away) {
        await alert(`Match ${raw.id} FINISHED avec équipe inconnue (TBD) — résolution bloquée.`);
        continue;
      }
      normalized = {
        providerId: String(raw.id),
        stage: raw.stage,
        group: raw.group_letter,
        homeFifa: raw.home,
        awayFifa: raw.away,
        kickoffUtc: raw.kickoff_utc,
        status: "FINISHED",
        scoreHome: raw.score_home,
        scoreAway: raw.score_away,
        duration: raw.duration,
        pensHome: raw.pens_home,
        pensAway: raw.pens_away,
      };
    }
    if (!normalized) continue;

    // Statuts avant/après pour dériver les mises à jour nations.
    const statusBefore = new Map(state.nationStatus);
    let result;
    try {
      result = resolveMatch(state, { matchId: raw.id, match: normalized, labels }, cfg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await alert(`resolve(${raw.id}) refusé : ${msg}`);
      await logJob(supabase, "resolve", false, { matchId: raw.id, error: msg });
      continue; // jamais deviner — on passe, l'opérateur tranchera
    }

    const nationUpdates = [...state.nationStatus]
      .filter(([code, status]) => statusBefore.get(code) !== status)
      .map(([code, status]) => ({ code, status, eliminated_by_match: raw.id }));

    const { data: applied, error: aErr } = await supabase.schema("atlas").rpc("apply_resolution", {
      p_resolution: {
        match_id: result.resolution.matchId,
        winner: result.resolution.winner,
        loser: result.resolution.loser,
        is_draw: result.resolution.isDraw,
        goal_diff: result.resolution.goalDiff,
        base_gain: result.resolution.baseGain,
        m_overext: result.resolution.mOverext,
        final_gain: result.resolution.finalGain,
        hexes_taken: result.resolution.hexesTaken,
        inherited_hexes: result.resolution.inheritedHexes,
        narrative: result.resolution.narrative,
        engine_version: result.resolution.engineVersion,
      },
      p_events: result.events.map((e) => ({
        hex_id: e.hexId,
        match_id: e.matchId,
        type: e.type,
        from_owner: e.fromOwner,
        to_owner: e.toOwner,
        from_state: e.fromState,
        to_state: e.toState,
        narrative: e.narrative,
      })),
      p_nation_updates: nationUpdates,
      p_game_over: state.gameOver,
    });
    if (aErr) throw new Error(`apply_resolution(${raw.id}): ${aErr.message}`);

    await logJob(supabase, "resolve", true, {
      matchId: raw.id,
      applied,
      narrative: result.resolution.narrative,
      logs: result.logs,
      source: override ? "manual-override" : "football-data",
    });
    console.log(`✓ résolu #${raw.id} : ${result.resolution.narrative}`);
    count++;
  }
  return count;
}
