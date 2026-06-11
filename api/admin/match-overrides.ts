import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertAdmin, acceptPost, jsonBody } from "../_lib/admin";
import { atlasClient } from "../_lib/atlas-api";
import { sendBadRequest, sendServerError } from "../_lib/http";

type Body = {
  match_id?: unknown;
  score_home?: unknown;
  score_away?: unknown;
  duration?: unknown;
  pens_home?: unknown;
  pens_away?: unknown;
  note?: unknown;
};

const DURATIONS = new Set(["REGULAR", "EXTRA_TIME", "PENALTY_SHOOTOUT"]);

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptPost(req, res) || !assertAdmin(req, res)) return;
  const body = jsonBody<Body>(req, res);
  if (!body) return;

  const matchId = Number(body.match_id);
  const scoreHome = Number(body.score_home);
  const scoreAway = Number(body.score_away);
  const duration = typeof body.duration === "string" ? body.duration : "REGULAR";
  const pensHome = nullableNumber(body.pens_home);
  const pensAway = nullableNumber(body.pens_away);

  if (!Number.isInteger(matchId) || !Number.isInteger(scoreHome) || !Number.isInteger(scoreAway)) {
    sendBadRequest(res, "`match_id`, `score_home` and `score_away` must be integers.");
    return;
  }
  if (!DURATIONS.has(duration)) {
    sendBadRequest(res, "`duration` must be REGULAR, EXTRA_TIME or PENALTY_SHOOTOUT.");
    return;
  }
  if (Number.isNaN(pensHome) || Number.isNaN(pensAway)) {
    sendBadRequest(res, "`pens_home` and `pens_away` must be integers or null.");
    return;
  }

  try {
    const { data: match, error: mErr } = await atlasClient()
      .from("matches")
      .select("id, home, away")
      .eq("id", matchId)
      .maybeSingle();
    if (mErr) throw mErr;
    if (!match || !match.home || !match.away) {
      sendBadRequest(res, "Unknown match or TBD teams.");
      return;
    }

    const { data, error } = await atlasClient()
      .from("match_overrides")
      .upsert(
        {
          match_id: matchId,
          score_home: scoreHome,
          score_away: scoreAway,
          duration,
          pens_home: pensHome,
          pens_away: pensAway,
          note: typeof body.note === "string" ? body.note.slice(0, 500) : null,
        },
        { onConflict: "match_id" },
      )
      .select("*")
      .single();
    if (error) throw error;

    res.status(200).json({ ok: true, override: data });
  } catch {
    sendServerError(res);
  }
}
