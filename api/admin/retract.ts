/**
 * Kill switch admin — Jalon D.
 *
 * POST /api/admin/retract
 *   Header: Authorization: Bearer $ADMIN_TOKEN
 *   Body  : { target_table: "published_stories" | "public_trace_excerpts" | "detected_patterns",
 *             target_id: uuid,
 *             reason: string }
 *
 * Effets :
 *  - published_stories : publication_status='retracted' + retracted_at + retracted_reason
 *  - public_trace_excerpts : safe_to_publish=false
 *  - detected_patterns : retracted_at + retracted_reason
 *  - INSERT admin_retract_log (avec hash du token, jamais le token brut)
 *
 * Auth minimale par token statique (env ADMIN_TOKEN). Suffisant pour un
 * usage interne pendant la phase initiale. Une vraie auth Supabase peut
 * remplacer ce token plus tard sans casser le contrat.
 */

import { createHash } from "node:crypto";
import { createServerSupabaseClient } from "../_lib/supabase.js";
import {
  sendMethodNotAllowed,
  sendServerError,
  type ApiRequest,
  type ApiResponse,
} from "../_lib/http.js";

type AdminApiRequest = ApiRequest & {
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

const ALLOWED_TABLES = new Set([
  "published_stories",
  "public_trace_excerpts",
  "detected_patterns",
]);

function unauthorized(response: ApiResponse) {
  response.status(401).json({
    error: { code: "unauthorized", message: "Admin token required." },
  });
}

function badRequest(response: ApiResponse, reason: string) {
  response.status(400).json({
    error: { code: "bad_request", message: reason },
  });
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readBearerToken(headers: AdminApiRequest["headers"]): string | null {
  if (!headers) return null;
  const raw = headers.authorization ?? headers.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1] ?? null;
}

interface RetractBody {
  target_table?: string;
  target_id?: string;
  reason?: string;
}

export default async function handler(
  request: AdminApiRequest,
  response: ApiResponse,
) {
  if (request.method && request.method !== "POST") {
    sendMethodNotAllowed(response);
    return;
  }

  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 16) {
    // Pas configuré ou trop court — on refuse plutôt que d'accepter
    // un token vide ou trivial.
    sendServerError(response);
    return;
  }

  const provided = readBearerToken(request.headers);
  if (!provided || provided !== expected) {
    unauthorized(response);
    return;
  }

  const body = (request.body ?? {}) as RetractBody;
  if (!body.target_table || !ALLOWED_TABLES.has(body.target_table)) {
    badRequest(response, "target_table invalide");
    return;
  }
  if (!body.target_id || typeof body.target_id !== "string") {
    badRequest(response, "target_id requis (uuid)");
    return;
  }
  if (!body.reason || typeof body.reason !== "string" || body.reason.length < 4) {
    badRequest(response, "reason requise (>= 4 chars)");
    return;
  }

  try {
    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();

    if (body.target_table === "published_stories") {
      const { error } = await supabase
        .from("published_stories")
        .update({
          publication_status: "retracted",
          retracted_at: now,
          retracted_reason: body.reason,
        })
        .eq("id", body.target_id);
      if (error) throw error;
    } else if (body.target_table === "public_trace_excerpts") {
      const { error } = await supabase
        .from("public_trace_excerpts")
        .update({ safe_to_publish: false })
        .eq("trace_id", body.target_id);
      if (error) throw error;
    } else if (body.target_table === "detected_patterns") {
      const { error } = await supabase
        .from("detected_patterns")
        .update({
          retracted_at: now,
          retracted_reason: body.reason,
        })
        .eq("id", body.target_id);
      if (error) throw error;
    }

    // Insertion du log admin (toujours, même si la mise à jour cible est
    // un no-op : on garde une trace de la tentative).
    await supabase.from("admin_retract_log").insert({
      target_table: body.target_table,
      target_id: body.target_id,
      reason: body.reason,
      admin_token_hash: hashToken(provided),
    });

    response.status(200).json({
      ok: true,
      target_table: body.target_table,
      target_id: body.target_id,
      retracted_at: now,
    });
  } catch (error) {
    console.error("admin retract failed:", error);
    sendServerError(response);
  }
}
