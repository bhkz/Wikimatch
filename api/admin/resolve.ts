import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertAdmin, acceptPost } from "../_lib/admin";
import { sendServerError } from "../_lib/http";
import { createServerSupabaseClient } from "../_lib/supabase";
import { loadConfig, loadEngineState, loadNations } from "../../worker/src/db";
import { resolveFinishedMatches } from "../../worker/src/jobs/resolve-matches";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptPost(req, res) || !assertAdmin(req, res)) return;

  try {
    const supabase = createServerSupabaseClient();
    const cfg = await loadConfig(supabase);
    const nations = await loadNations(supabase);
    const state = await loadEngineState(supabase, nations, cfg.gameOver);
    const resolved = await resolveFinishedMatches(supabase, state, nations, cfg.game, 0);
    res.status(200).json({ ok: true, resolved });
  } catch {
    sendServerError(res);
  }
}
