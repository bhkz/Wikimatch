import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../../_lib/atlas-api";
import { firstQueryValue, sendServerError } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const date = firstQueryValue(req.query.date);

  try {
    const atlas = atlasClient();
    if (date) {
      const { data, error } = await atlas.from("snapshots").select("date, frame").eq("date", date).maybeSingle();
      if (error) throw error;
      sendJson(res, data ?? { date, frame: [] }, 3600);
      return;
    }

    const { data, error } = await atlas.from("hexes").select("id, owner, state").order("id").limit(2000);
    if (error) throw error;
    sendJson(res, { date: null, frame: data ?? [] }, 60);
  } catch {
    sendServerError(res);
  }
}
