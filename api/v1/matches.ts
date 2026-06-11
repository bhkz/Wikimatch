import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../_lib/atlas-api";
import { firstQueryValue, sendServerError } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const date = firstQueryValue(req.query.date);

  try {
    const atlas = atlasClient();
    let query = atlas
      .from("matches")
      .select("id, stage, group_letter, matchday, home, away, kickoff_utc, status, score_home, score_away, duration, pens_home, pens_away")
      .order("kickoff_utc")
      .limit(200);

    if (date) {
      const next = new Date(`${date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      query = query.gte("kickoff_utc", `${date}T00:00:00Z`).lt("kickoff_utc", next.toISOString());
    }

    const [{ data: matches, error: mErr }, { data: stakes, error: sErr }] = await Promise.all([
      query,
      atlas.from("match_stakes").select("match_id, sim_run_id, drama, components, computed_at"),
    ]);
    if (mErr) throw mErr;
    if (sErr) throw sErr;

    const stakesByMatch = new Map((stakes ?? []).map((s) => [s.match_id as number, s]));
    sendJson(
      res,
      { matches: (matches ?? []).map((m) => ({ ...m, stake: stakesByMatch.get(m.id as number) ?? null })) },
      60,
    );
  } catch {
    sendServerError(res);
  }
}
