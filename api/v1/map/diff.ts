import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../../_lib/atlas-api";
import { firstQueryValue, sendBadRequest, sendServerError } from "../../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const since = firstQueryValue(req.query.since);
  if (!since || Number.isNaN(Date.parse(since))) {
    sendBadRequest(res, "Query parameter `since` must be an ISO timestamp.");
    return;
  }

  try {
    const { data, error } = await atlasClient()
      .from("hex_events")
      .select("id, hex_id, match_id, type, from_owner, to_owner, from_state, to_state, narrative, created_at")
      .gt("created_at", since)
      .order("id")
      .limit(1000);
    if (error) throw error;
    sendJson(res, { since, events: data ?? [] }, 30);
  } catch {
    sendServerError(res);
  }
}
