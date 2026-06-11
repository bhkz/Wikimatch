/**
 * Seed Supabase du schéma atlas (spec §15) :
 * - nations  ← data/nations-seed.json
 * - hexes    ← data/map-generated.json (owner = original_owner au départ)
 * - matches  ← football-data /competitions/WC/matches (104, via provider normalisé)
 *
 * Idempotent (upsert sur clés primaires). Requiert dans .env :
 * SUPABASE_URL, SUPABASE_SERVICE_KEY, FOOTBALL_DATA_TOKEN.
 *
 * Usage : npx tsx scripts/seed-atlas.ts [--skip-matches]
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { FootballDataProvider } from "../lib/providers/football-data";
import type { Stage } from "../lib/providers/types";

const DATA_DIR = resolve(import.meta.dirname, "..", "data");

type NationSeed = {
  fifa: string; name_fr: string; flag: string; fd_team_id: number;
  fifa_rank: number; fifa_points: number; group: string; color: string;
  capital_q: number; capital_r: number; capital_name: string;
};
type GeneratedHex = {
  id: number; q: number; r: number; city_name: string;
  is_capital: boolean; original_owner: string | null;
};

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Variable d'environnement manquante : ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const skipMatches = process.argv.includes("--skip-matches");
  const supabase = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const atlas = supabase.schema("atlas");

  const nations = JSON.parse(readFileSync(resolve(DATA_DIR, "nations-seed.json"), "utf8")) as NationSeed[];
  const hexes = JSON.parse(readFileSync(resolve(DATA_DIR, "map-generated.json"), "utf8")) as GeneratedHex[];
  if (nations.length !== 48) throw new Error(`48 nations attendues, ${nations.length}.`);
  if (hexes.length < 600) throw new Error(`map-generated.json suspect : ${hexes.length} hexes.`);

  // --- nations ---------------------------------------------------------------
  const { error: nErr } = await atlas.from("nations").upsert(
    nations.map((n) => ({
      code: n.fifa,
      name_fr: n.name_fr,
      flag: n.flag,
      color: n.color,
      fifa_rank: n.fifa_rank,
      fifa_points: n.fifa_points,
      fd_team_id: n.fd_team_id,
      group_letter: n.group,
    })),
    { onConflict: "code" },
  );
  if (nErr) throw new Error(`nations: ${nErr.message}`);
  console.log("✓ 48 nations upsertées.");

  // --- hexes (état initial : owner = original_owner, neutres sans owner) ------
  const { error: hErr } = await atlas.from("hexes").upsert(
    hexes.map((h) => ({
      id: h.id,
      q: h.q,
      r: h.r,
      city_name: h.city_name,
      is_capital: h.is_capital,
      original_owner: h.original_owner,
      owner: h.original_owner,
      state: h.original_owner === null ? "neutral" : "owned",
      conquered: false,
    })),
    { onConflict: "id" },
  );
  if (hErr) throw new Error(`hexes: ${hErr.message}`);
  console.log(`✓ ${hexes.length} hexes upsertés.`);

  // --- matches (104) ----------------------------------------------------------
  if (skipMatches) {
    console.log("→ matches sautés (--skip-matches).");
    return;
  }
  const { data: cfg, error: cErr } = await atlas
    .from("game_config")
    .select("value")
    .eq("key", "stage_mapping")
    .single();
  if (cErr) throw new Error(`game_config.stage_mapping: ${cErr.message}`);

  const provider = new FootballDataProvider({
    token: need("FOOTBALL_DATA_TOKEN"),
    teamIdToFifa: new Map(nations.map((n) => [n.fd_team_id, n.fifa])),
    stageMapping: cfg!.value as Record<string, Stage>,
  });
  const matches = await provider.fetchSchedule();
  if (matches.length !== 104) console.warn(`⚠ ${matches.length} matchs reçus (104 attendus).`);

  const { error: mErr } = await atlas.from("matches").upsert(
    matches.map((m) => ({
      id: Number(m.providerId),
      stage: m.stage,
      group_letter: m.group,
      home: m.homeFifa === "TBD" ? null : m.homeFifa,
      away: m.awayFifa === "TBD" ? null : m.awayFifa,
      kickoff_utc: m.kickoffUtc,
      status: m.status,
      score_home: m.scoreHome,
      score_away: m.scoreAway,
      duration: m.duration,
      pens_home: m.pensHome,
      pens_away: m.pensAway,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id" },
  );
  if (mErr) throw new Error(`matches: ${mErr.message}`);
  console.log(`✓ ${matches.length} matchs upsertés.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
