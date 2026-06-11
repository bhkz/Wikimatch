import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertAdmin, acceptPost, jsonBody } from "../_lib/admin";
import { atlasClient } from "../_lib/atlas-api";
import { sendBadRequest, sendServerError } from "../_lib/http";
import { createServerSupabaseClient } from "../_lib/supabase";
import { finalizeGroupStagePlan, type GroupStageMatch, type GroupStageNation } from "../../lib/group-stage";
import { loadConfig, loadEngineState, loadNations } from "../../worker/src/db";

type Body = { dry_run?: unknown };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptPost(req, res) || !assertAdmin(req, res)) return;
  const body = jsonBody<Body>(req, res);
  if (!body) return;

  try {
    const supabase = createServerSupabaseClient();
    const atlas = atlasClient();
    const [{ data: nationRows, error: nErr }, { data: matchRows, error: mErr }] = await Promise.all([
      atlas.from("nations").select("code, group_letter, name_fr, flag").order("code"),
      atlas
        .from("matches")
        .select("group_letter, home, away, status, score_home, score_away")
        .eq("stage", "GROUP")
        .order("id"),
    ]);
    if (nErr) throw nErr;
    if (mErr) throw mErr;

    const matches = (matchRows ?? [])
      .filter((m) => m.group_letter && m.home && m.away && m.status === "FINISHED" && m.score_home !== null && m.score_away !== null)
      .map((m) => ({
        group: m.group_letter as string,
        home: m.home as string,
        away: m.away as string,
        scoreHome: m.score_home as number,
        scoreAway: m.score_away as number,
      })) satisfies GroupStageMatch[];

    if (matches.length !== 72) {
      sendBadRequest(res, `Group stage not complete: ${matches.length}/72 finished matches.`);
      return;
    }

    const workerNations = await loadNations(supabase);
    const cfg = await loadConfig(supabase);
    const state = await loadEngineState(supabase, workerNations, cfg.gameOver);
    const nations = (nationRows ?? []).map((n) => ({
      code: n.code as string,
      group: n.group_letter as string,
      label: { flag: n.flag as string, name: n.name_fr as string },
    })) satisfies GroupStageNation[];
    const plan = finalizeGroupStagePlan(state, nations, matches, cfg.game);

    if (body.dry_run !== false) {
      res.status(200).json({
        ok: true,
        dry_run: true,
        qualified: plan.qualified,
        eliminated: plan.eliminated,
        event_count: plan.events.length,
        warnings: plan.warnings,
      });
      return;
    }

    const { data: applied, error } = await supabase.schema("atlas").rpc("apply_group_fracture", {
      p_events: plan.events.map((e) => ({
        hex_id: e.hexId,
        match_id: e.matchId,
        type: e.type,
        from_owner: e.fromOwner,
        to_owner: e.toOwner,
        from_state: e.fromState,
        to_state: e.toState,
        narrative: e.narrative,
      })),
      p_nation_updates: plan.nationUpdates,
    });
    if (error) throw error;

    await atlas.from("job_log").insert({
      job: "finalize_group_stage",
      ok: true,
      detail: { applied, eliminated: plan.eliminated, warnings: plan.warnings },
    });
    res.status(200).json({ ok: true, dry_run: false, applied, eliminated: plan.eliminated, warnings: plan.warnings });
  } catch {
    sendServerError(res);
  }
}
