import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveMatch } from "../../../../lib/engine/resolve";
import type { NormalizedMatch } from "../../../../lib/providers/types";
import { acceptGet, sendJson } from "../../../_lib/atlas-api";
import { firstQueryValue, sendBadRequest, sendNotFound, sendServerError } from "../../../_lib/http";
import { createServerSupabaseClient } from "../../../_lib/supabase";
import { loadConfig, loadEngineState, loadNations } from "../../../../worker/src/db";

function fallbackScore(outcome: string | undefined): { scoreHome: number; scoreAway: number } {
  if (outcome === "away") return { scoreHome: 0, scoreAway: 1 };
  if (outcome === "draw") return { scoreHome: 0, scoreAway: 0 };
  return { scoreHome: 1, scoreAway: 0 };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  const id = Number(firstQueryValue(req.query.id));
  if (!Number.isFinite(id)) {
    sendNotFound(res);
    return;
  }

  try {
    const supabase = createServerSupabaseClient();
    const atlas = supabase.schema("atlas");
    const { data: match, error } = await atlas
      .from("matches")
      .select("id, stage, group_letter, home, away, kickoff_utc, status, score_home, score_away, duration, pens_home, pens_away")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!match) {
      sendNotFound(res);
      return;
    }
    if (!match.home || !match.away) {
      sendBadRequest(res, "Cannot preview a match with TBD teams.");
      return;
    }

    const fallback = fallbackScore(firstQueryValue(req.query.outcome));
    const scoreHome = match.score_home ?? fallback.scoreHome;
    const scoreAway = match.score_away ?? fallback.scoreAway;
    const normalized: NormalizedMatch = {
      providerId: `provisional-${id}`,
      stage: match.stage,
      group: match.group_letter,
      homeFifa: match.home,
      awayFifa: match.away,
      kickoffUtc: match.kickoff_utc,
      status: "FINISHED",
      scoreHome,
      scoreAway,
      duration: match.duration ?? "REGULAR",
      pensHome: match.pens_home,
      pensAway: match.pens_away,
    };

    const cfg = await loadConfig(supabase);
    const nations = await loadNations(supabase);
    const state = await loadEngineState(supabase, nations, cfg.gameOver);
    const labels = new Map(nations.map((n) => [n.code, { flag: n.flag, name: n.name_fr }]));
    const result = resolveMatch(state, { matchId: id, match: normalized, labels }, cfg.game);

    sendJson(
      res,
      {
        match_id: id,
        assumed_score: { home: scoreHome, away: scoreAway },
        would_gain: result.resolution.finalGain,
        hex_ids: result.resolution.hexesTaken,
        inherited_hex_ids: result.resolution.inheritedHexes,
        narrative_preview: result.resolution.narrative,
        logs: result.logs,
      },
      30,
    );
  } catch (err) {
    if (err instanceof Error) {
      sendBadRequest(res, err.message);
      return;
    }
    sendServerError(res);
  }
}
