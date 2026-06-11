import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../../_lib/atlas-api";
import { firstQueryValue, sendNotFound, sendServerError } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const code = firstQueryValue(req.query.code)?.toUpperCase();
  if (!code) {
    sendNotFound(res);
    return;
  }

  try {
    const atlas = atlasClient();
    const [{ data: nation, error: nErr }, { data: territory, error: hErr }, { data: events, error: eErr }] =
      await Promise.all([
        atlas.from("nations").select("*").eq("code", code).maybeSingle(),
        atlas.from("hexes").select("id, q, r, city_name, is_capital, owner, state").eq("owner", code).order("id").limit(1000),
        atlas
          .from("hex_events")
          .select("id, hex_id, match_id, type, from_owner, to_owner, narrative, created_at")
          .or(`from_owner.eq.${code},to_owner.eq.${code}`)
          .order("id", { ascending: false })
          .limit(100),
      ]);
    if (nErr) throw nErr;
    if (hErr) throw hErr;
    if (eErr) throw eErr;
    if (!nation) {
      sendNotFound(res);
      return;
    }
    sendJson(res, { nation, territory: territory ?? [], events: events ?? [] }, 60);
  } catch {
    sendServerError(res);
  }
}
