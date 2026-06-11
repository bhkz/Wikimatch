import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendBadRequest, sendMethodNotAllowed, sendUnauthorized } from "./http";

export function assertAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const provided =
    req.headers["x-admin-token"] ??
    req.query.token ??
    (typeof req.query.admin_token === "string" ? req.query.admin_token : undefined);
  const token = Array.isArray(provided) ? provided[0] : provided;

  if (!expected || token !== expected) {
    sendUnauthorized(res);
    return false;
  }
  return true;
}

export function acceptPost(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(204).end();
    return false;
  }
  if (req.method !== "POST") {
    sendMethodNotAllowed(res, "POST");
    return false;
  }
  return true;
}

export function jsonBody<T extends Record<string, unknown>>(req: VercelRequest, res: VercelResponse): T | null {
  if (req.body && typeof req.body === "object") return req.body as T;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      sendBadRequest(res, "Invalid JSON body.");
      return null;
    }
  }
  return {} as T;
}
