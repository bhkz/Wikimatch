import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../../_lib/atlas-api";
import { firstQueryValue, sendNotFound, sendServerError } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const date = firstQueryValue(req.query.date);

  try {
    let query = atlasClient().from("recaps").select("date, sections, published_at").order("date", { ascending: false });
    if (date && date !== "latest") query = query.eq("date", date);
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) {
      sendNotFound(res);
      return;
    }
    sendJson(res, data, 300);
  } catch {
    sendServerError(res);
  }
}
