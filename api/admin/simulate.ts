import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertAdmin, acceptPost } from "../_lib/admin";
import { sendServerError } from "../_lib/http";
import { createServerSupabaseClient } from "../_lib/supabase";
import { simulateIfStale } from "../../worker/src/jobs/simulate";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptPost(req, res) || !assertAdmin(req, res)) return;

  try {
    const ran = await simulateIfStale(createServerSupabaseClient(), true);
    res.status(200).json({ ok: true, ran });
  } catch {
    sendServerError(res);
  }
}
