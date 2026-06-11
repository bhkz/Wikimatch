import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServerSupabaseClient } from "./supabase";
import { sendMethodNotAllowed, setPublicCache } from "./http";

export function atlasClient() {
  return createServerSupabaseClient().schema("atlas");
}

export function acceptGet(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(204).end();
    return false;
  }
  if (req.method !== "GET") {
    sendMethodNotAllowed(res);
    return false;
  }
  return true;
}

export function sendJson(res: VercelResponse, body: unknown, seconds = 60): void {
  setPublicCache(res, seconds);
  res.status(200).json(body);
}
