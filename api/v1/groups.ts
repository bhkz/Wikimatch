import type { VercelRequest, VercelResponse } from "@vercel/node";
import { computeStandings } from "../../lib/standings";
import { acceptGet, atlasClient, sendJson } from "../_lib/atlas-api";
import { sendServerError } from "../_lib/http";

type MatchRow = {
  group_letter: string | null;
  home: string | null;
  away: string | null;
  status: string;
  score_home: number | null;
  score_away: number | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  try {
    const atlas = atlasClient();
    const [
      { data: nations, error: nErr },
      { data: matches, error: mErr },
      { data: sim, error: sErr },
      { data: conditions, error: cErr },
    ] = await Promise.all([
      atlas.from("nations").select("code, name_fr, flag, group_letter").order("code"),
      atlas.from("matches").select("group_letter, home, away, status, score_home, score_away").eq("stage", "GROUP").order("id"),
      atlas.from("sim_runs").select("id, run_at, iterations, probs").order("id", { ascending: false }).limit(1).maybeSingle(),
      atlas.from("qualification_conditions").select("group_letter, nation, status, conditions"),
    ]);
    if (nErr) throw nErr;
    if (mErr) throw mErr;
    if (sErr) throw sErr;
    if (cErr) throw cErr;

    const probs = (sim?.probs ?? {}) as Record<string, unknown>;
    const nationByCode = new Map((nations ?? []).map((n) => [n.code as string, n]));
    const conditionByKey = new Map((conditions ?? []).map((c) => [`${c.group_letter}:${c.nation}`, c]));
    const letters = [...new Set((nations ?? []).map((n) => n.group_letter as string).filter(Boolean))].sort();

    const groups = letters.map((letter) => {
      const codes = (nations ?? []).filter((n) => n.group_letter === letter).map((n) => n.code as string);
      const played = ((matches ?? []) as MatchRow[])
        .filter((m) => m.group_letter === letter && m.status === "FINISHED" && m.home && m.away && m.score_home !== null && m.score_away !== null)
        .map((m) => ({ home: m.home!, away: m.away!, scoreHome: m.score_home!, scoreAway: m.score_away! }));
      const standings = computeStandings(codes, played).map((row) => ({
        ...row,
        nation: nationByCode.get(row.code) ?? null,
        probs: probs[row.code] ?? null,
        condition: conditionByKey.get(`${letter}:${row.code}`) ?? null,
      }));
      return { letter, standings };
    });

    sendJson(res, { sim, groups }, 60);
  } catch {
    sendServerError(res);
  }
}
