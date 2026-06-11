import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../../_lib/atlas-api";
import { firstQueryValue, sendNotFound, sendServerError } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const id = Number(firstQueryValue(req.query.id));
  if (!Number.isFinite(id)) {
    sendNotFound(res);
    return;
  }

  try {
    const atlas = atlasClient();
    const [{ data: match, error: mErr }, { data: resolution, error: rErr }, { data: stake, error: sErr }] =
      await Promise.all([
        atlas.from("matches").select("*").eq("id", id).maybeSingle(),
        atlas.from("resolutions").select("*").eq("match_id", id).maybeSingle(),
        atlas.from("match_stakes").select("match_id, sim_run_id, drama, components, computed_at").eq("match_id", id).maybeSingle(),
      ]);
    if (mErr) throw mErr;
    if (rErr) throw rErr;
    if (sErr) throw sErr;
    if (!match) {
      sendNotFound(res);
      return;
    }
    sendJson(res, { match, resolution, stake }, 60);
  } catch {
    sendServerError(res);
  }
}
