/**
 * Accès Supabase du worker (service role) + chargement config/état moteur.
 * Le worker est le SEUL écrivain du schéma atlas (spec §15, §16).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EngineState, GameConfig, NationStatus } from "../../lib/engine/types";
import type { Stage } from "../../lib/providers/types";

export function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

export function createWorkerClient(): SupabaseClient {
  return createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type WorkerConfig = {
  game: GameConfig;
  stageMapping: Record<string, Stage>;
  resolutionConfirmDelayS: number;
  pollFastS: number;
  pollSlowS: number;
  gameOver: boolean;
};

export async function loadConfig(supabase: SupabaseClient): Promise<WorkerConfig> {
  const { data, error } = await supabase.schema("atlas").from("game_config").select("key, value");
  if (error) throw new Error(`game_config: ${error.message}`);
  const cfg = new Map<string, unknown>((data ?? []).map((r) => [r.key as string, r.value]));
  const num = (key: string): number => {
    const v = cfg.get(key);
    if (typeof v !== "number") throw new Error(`game_config.${key} manquant ou non numérique.`);
    return v;
  };
  return {
    game: {
      gainGroup: num("gain_group"),
      gainR32R16: num("gain_r32_r16"),
      gainQf: num("gain_qf"),
      gainSf: num("gain_sf"),
      gainThird: num("gain_third"),
      gainFinal: num("gain_final"),
      gainGoaldiffCap: num("gain_goaldiff_cap"),
      hardCap: num("hard_cap"),
      overextMin: num("overext_min"),
      overextMax: num("overext_max"),
      inheritRatio: num("inherit_ratio"),
    },
    stageMapping: (cfg.get("stage_mapping") ?? {}) as Record<string, Stage>,
    resolutionConfirmDelayS: num("resolution_confirm_delay_s"),
    pollFastS: num("poll_fast_s"),
    pollSlowS: num("poll_slow_s"),
    gameOver: cfg.get("game_over") === true,
  };
}

export type NationRow = {
  code: string;
  name_fr: string;
  flag: string;
  fd_team_id: number;
  status: NationStatus;
};

export async function loadNations(supabase: SupabaseClient): Promise<NationRow[]> {
  const { data, error } = await supabase
    .schema("atlas")
    .from("nations")
    .select("code, name_fr, flag, fd_team_id, status");
  if (error) throw new Error(`nations: ${error.message}`);
  if (!data || data.length !== 48) throw new Error(`nations: ${data?.length ?? 0} lignes (48 attendues).`);
  return data as NationRow[];
}

/** Charge l'état moteur complet depuis la DB (hexes + statuts + game_over). */
export async function loadEngineState(
  supabase: SupabaseClient,
  nations: NationRow[],
  gameOver: boolean,
): Promise<EngineState> {
  const { data, error } = await supabase
    .schema("atlas")
    .from("hexes")
    .select("id, q, r, city_name, is_capital, original_owner, owner, state, conquered")
    .order("id")
    .limit(2000);
  if (error) throw new Error(`hexes: ${error.message}`);
  if (!data || data.length < 600) throw new Error(`hexes: ${data?.length ?? 0} lignes : seed manquant ?`);

  const hexes = new Map(
    data.map((h) => [
      h.id as number,
      {
        id: h.id as number,
        q: h.q as number,
        r: h.r as number,
        cityName: h.city_name as string,
        isCapital: h.is_capital as boolean,
        originalOwner: h.original_owner as string | null,
        owner: h.owner as string | null,
        state: h.state as "owned" | "neutral" | "ruins" | "memorial",
        conquered: h.conquered as boolean,
      },
    ]),
  );
  const nationStatus = new Map(nations.map((n) => [n.code, n.status]));
  return { hexes, nationStatus, gameOver };
}

export async function logJob(
  supabase: SupabaseClient,
  job: string,
  ok: boolean,
  detail?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.schema("atlas").from("job_log").insert({ job, ok, detail: detail ?? null });
  if (error) console.error(`job_log(${job}): ${error.message}`);
}

/** Alerte opérateur (webhook Discord/Slack-compatible), best-effort (spec §16.4). */
export async function alert(message: string): Promise<void> {
  console.error(`🚨 ${message}`);
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `🌍 Atlas : ${message}` }),
    });
  } catch (err) {
    console.error(`alert webhook KO: ${err instanceof Error ? err.message : err}`);
  }
}
