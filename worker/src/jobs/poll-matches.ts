/**
 * Job poll_matches (spec §16.2) : fenêtre J-1 → J+1 via le provider,
 * upsert atlas.matches, mémorise la première détection de FINISHED
 * (ingest_state.finished_seen) pour le délai de confirmation de 5 min.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { FootballDataProvider, UnknownStageError, UnknownTeamError } from "../../../lib/providers/football-data";
import type { NormalizedMatch, Stage } from "../../../lib/providers/types";
import { alert, need, type NationRow } from "../db";

export type PollResult = {
  upserted: number;
  newlyFinished: number[];
  anyLive: boolean;
};

export async function pollMatches(
  supabase: SupabaseClient,
  nations: NationRow[],
  stageMapping: Record<string, Stage>,
): Promise<PollResult> {
  const provider = new FootballDataProvider({
    token: need("FOOTBALL_DATA_TOKEN"),
    teamIdToFifa: new Map(nations.map((n) => [n.fd_team_id, n.code])),
    stageMapping,
  });

  const now = Date.now();
  const from = new Date(now - 24 * 3600_000).toISOString();
  const to = new Date(now + 24 * 3600_000).toISOString();

  let matches: NormalizedMatch[];
  try {
    matches = await provider.fetchWindow(from, to);
  } catch (err) {
    // Stage/équipe inconnus = données suspectes : alerte et on ne touche à rien.
    if (err instanceof UnknownStageError || err instanceof UnknownTeamError) {
      await alert(`poll_matches refusé : ${err.message}`);
      throw err;
    }
    throw err;
  }
  if (matches.length === 0) return { upserted: 0, newlyFinished: [], anyLive: false };

  const { error } = await supabase.schema("atlas").from("matches").upsert(
    matches.map((m) => ({
      id: Number(m.providerId),
      stage: m.stage,
      group_letter: m.group,
      home: m.homeFifa === "TBD" ? null : m.homeFifa,
      away: m.awayFifa === "TBD" ? null : m.awayFifa,
      kickoff_utc: m.kickoffUtc,
      status: m.status,
      score_home: m.scoreHome,
      score_away: m.scoreAway,
      duration: m.duration,
      pens_home: m.pensHome,
      pens_away: m.pensAway,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id" },
  );
  if (error) throw new Error(`matches upsert: ${error.message}`);

  // Première détection de FINISHED → horodatage pour le délai de confirmation.
  const { data: seenRow, error: sErr } = await supabase
    .schema("atlas")
    .from("ingest_state")
    .select("value")
    .eq("key", "finished_seen")
    .maybeSingle();
  if (sErr) throw new Error(`ingest_state: ${sErr.message}`);

  const seen = (seenRow?.value ?? {}) as Record<string, string>;
  const newlyFinished: number[] = [];
  for (const m of matches) {
    if (m.status === "FINISHED" && !seen[m.providerId]) {
      seen[m.providerId] = new Date().toISOString();
      newlyFinished.push(Number(m.providerId));
    }
  }
  if (newlyFinished.length > 0) {
    const { error: uErr } = await supabase
      .schema("atlas")
      .from("ingest_state")
      .upsert({ key: "finished_seen", value: seen }, { onConflict: "key" });
    if (uErr) throw new Error(`ingest_state upsert: ${uErr.message}`);
  }

  const anyLive = matches.some(
    (m) =>
      m.status === "IN_PLAY" ||
      m.status === "PAUSED" ||
      (Math.abs(Date.parse(m.kickoffUtc) - now) < 3 * 3600_000 && m.status !== "FINISHED"),
  );
  return { upserted: matches.length, newlyFinished, anyLive };
}
