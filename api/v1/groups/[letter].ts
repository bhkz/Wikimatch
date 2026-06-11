import type { VercelRequest, VercelResponse } from "@vercel/node";
import { computeStandings } from "../../../lib/standings";
import { acceptGet, atlasClient, sendJson } from "../../_lib/atlas-api";
import { firstQueryValue, sendNotFound, sendServerError } from "../../_lib/http";

type MatchRow = {
  id: number;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const letter = firstQueryValue(req.query.letter)?.toUpperCase();
  if (!letter) {
    sendNotFound(res);
    return;
  }

  try {
    const atlas = atlasClient();
    const [
      { data: nations, error: nErr },
      { data: matches, error: mErr },
      { data: sim, error: sErr },
      { data: conditions, error: cErr },
      { data: stakes, error: stErr },
    ] = await Promise.all([
      atlas.from("nations").select("code, name_fr, flag, group_letter").eq("group_letter", letter).order("code"),
      atlas
        .from("matches")
        .select("id, group_letter, home, away, kickoff_utc, status, score_home, score_away, duration, pens_home, pens_away")
        .eq("stage", "GROUP")
        .eq("group_letter", letter)
        .order("kickoff_utc"),
      atlas.from("sim_runs").select("id, run_at, iterations, probs").order("id", { ascending: false }).limit(1).maybeSingle(),
      atlas.from("qualification_conditions").select("group_letter, nation, status, conditions").eq("group_letter", letter),
      atlas.from("match_stakes").select("match_id, sim_run_id, drama, components, computed_at"),
    ]);
    if (nErr) throw nErr;
    if (mErr) throw mErr;
    if (sErr) throw sErr;
    if (cErr) throw cErr;
    if (stErr) throw stErr;
    if (!nations || nations.length === 0) {
      sendNotFound(res);
      return;
    }

    const codes = nations.map((n) => n.code as string);
    const played = ((matches ?? []) as MatchRow[])
      .filter((m) => m.status === "FINISHED" && m.home && m.away && m.score_home !== null && m.score_away !== null)
      .map((m) => ({ home: m.home!, away: m.away!, scoreHome: m.score_home!, scoreAway: m.score_away! }));
    const probs = (sim?.probs ?? {}) as Record<string, unknown>;
    const nationByCode = new Map(nations.map((n) => [n.code as string, n]));
    const conditionByCode = new Map((conditions ?? []).map((c) => [c.nation as string, c]));
    const stakesByMatch = new Map((stakes ?? []).map((s) => [s.match_id as number, s]));

    const standings = computeStandings(codes, played).map((row) => ({
      ...row,
      nation: nationByCode.get(row.code) ?? null,
      probs: probs[row.code] ?? null,
      condition: conditionByCode.get(row.code) ?? null,
    }));
    const matchList = ((matches ?? []) as MatchRow[]).map((m) => ({
      ...m,
      stake: stakesByMatch.get(m.id) ?? null,
    }));

    sendJson(res, { sim, group: { letter, standings, matches: matchList } }, 60);
  } catch {
    sendServerError(res);
  }
}
