import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../_lib/atlas-api";
import { sendServerError } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  try {
    const { data, error } = await atlasClient()
      .from("hexes")
      .select("id, owner, state")
      .order("id")
      .limit(2000);
    if (error) throw error;
    sendJson(res, { frame: data ?? [], generated_at: new Date().toISOString() }, 60);
  } catch {
    sendServerError(res);
  }
}
