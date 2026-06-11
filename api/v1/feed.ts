import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../_lib/atlas-api";
import { firstQueryValue, sendServerError } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const limit = Math.min(Math.max(Number(firstQueryValue(req.query.limit) ?? 50), 1), 100);

  try {
    const { data, error } = await atlasClient()
      .from("resolutions")
      .select("match_id, winner, loser, is_draw, final_gain, hexes_taken, inherited_hexes, narrative, resolved_at")
      .order("resolved_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    sendJson(res, { feed: data ?? [] }, 60);
  } catch {
    sendServerError(res);
  }
}
