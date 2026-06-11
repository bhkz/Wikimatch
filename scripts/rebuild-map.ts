/**
 * Vérification de reconstruction (spec §18.4, filet de sécurité n°1) :
 * rejoue TOUS les hex_events depuis la carte de départ versionnée et compare
 * à l'état atlas.hexes en DB. Diff non vide = bug critique d'atomicité.
 *
 * Usage : npx tsx scripts/rebuild-map.ts [--fix]
 *   --fix : répare la DB depuis l'état rejoué (events = source de vérité),
 *           à n'utiliser qu'après diagnostic.
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { diffStates, replay, type GeneratedHex } from "../lib/engine/replay";
import type { EngineState, HexEventDraft } from "../lib/engine/types";

const DATA_DIR = resolve(import.meta.dirname, "..", "data");

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ ${name} manquant.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const fix = process.argv.includes("--fix");
  const supabase = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const atlas = supabase.schema("atlas");

  const generated = JSON.parse(readFileSync(resolve(DATA_DIR, "map-generated.json"), "utf8")) as GeneratedHex[];
  const nationCodes = (JSON.parse(readFileSync(resolve(DATA_DIR, "nations-seed.json"), "utf8")) as Array<{ fifa: string }>).map(
    (n) => n.fifa,
  );

  // Events ordonnés par id (append-only) — pagination par 1000.
  const events: HexEventDraft[] = [];
  for (let fromId = 0; ; ) {
    const { data, error } = await atlas
      .from("hex_events")
      .select("id, hex_id, match_id, type, from_owner, to_owner, from_state, to_state, narrative")
      .gt("id", fromId)
      .order("id")
      .limit(1000);
    if (error) throw new Error(`hex_events: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const e of data) {
      events.push({
        hexId: e.hex_id as number,
        matchId: e.match_id as number | null,
        type: e.type as HexEventDraft["type"],
        fromOwner: e.from_owner as string | null,
        toOwner: e.to_owner as string | null,
        fromState: e.from_state as HexEventDraft["fromState"],
        toState: e.to_state as HexEventDraft["toState"],
        narrative: e.narrative as string | null,
      });
    }
    fromId = data[data.length - 1].id as number;
  }

  const rebuilt = replay(generated, nationCodes, events);

  // État DB courant.
  const { data: dbHexes, error: hErr } = await atlas
    .from("hexes")
    .select("id, q, r, city_name, is_capital, original_owner, owner, state, conquered")
    .order("id")
    .limit(2000);
  if (hErr) throw new Error(`hexes: ${hErr.message}`);
  const dbState: EngineState = {
    hexes: new Map(
      (dbHexes ?? []).map((h) => [
        h.id as number,
        {
          id: h.id as number, q: h.q as number, r: h.r as number,
          cityName: h.city_name as string, isCapital: h.is_capital as boolean,
          originalOwner: h.original_owner as string | null,
          owner: h.owner as string | null,
          state: h.state as "owned" | "neutral" | "ruins" | "memorial",
          conquered: h.conquered as boolean,
        },
      ]),
    ),
    nationStatus: new Map(),
    gameOver: false,
  };

  const diffs = diffStates(rebuilt, dbState);
  console.log(`${events.length} events rejoués sur ${generated.length} hexes.`);
  if (diffs.length === 0) {
    console.log("✓ Reconstruction identique à la DB — intégrité OK.");
    return;
  }
  console.error(`✗ ${diffs.length} divergence(s) :`);
  for (const d of diffs.slice(0, 30)) console.error(`  - ${d}`);

  if (!fix) {
    console.error("→ Relancer avec --fix pour réparer la DB depuis le replay (events = vérité).");
    process.exit(1);
  }
  for (const [id, h] of rebuilt.hexes) {
    const db = dbState.hexes.get(id);
    if (db && db.owner === h.owner && db.state === h.state && db.conquered === h.conquered) continue;
    const { error } = await atlas
      .from("hexes")
      .update({ owner: h.owner, state: h.state, conquered: h.conquered })
      .eq("id", id);
    if (error) throw new Error(`fix hex ${id}: ${error.message}`);
  }
  console.log("✓ DB réparée depuis le replay.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
