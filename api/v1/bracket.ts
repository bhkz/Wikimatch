import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../_lib/atlas-api";
import { sendServerError } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  try {
    const atlas = atlasClient();
    const [{ data: matches, error: mErr }, { data: stakes, error: sErr }] = await Promise.all([
      atlas
        .from("matches")
        .select("id, stage, home, away, kickoff_utc, status, score_home, score_away, duration, pens_home, pens_away")
        .neq("stage", "GROUP")
        .order("kickoff_utc"),
      atlas.from("match_stakes").select("match_id, sim_run_id, drama, components, computed_at"),
    ]);
    if (mErr) throw mErr;
    if (sErr) throw sErr;

    const stakesByMatch = new Map((stakes ?? []).map((s) => [s.match_id as number, s]));
    sendJson(
      res,
      { matches: (matches ?? []).map((m) => ({ ...m, stake: stakesByMatch.get(m.id as number) ?? null })) },
      300,
    );
  } catch {
    sendServerError(res);
  }
}
