/**
 * Répétition générale de la Grande Fracture (critère de sortie P2, spec §20) :
 * 100 % offline — aucune écriture en base.
 *
 * 1. Charge la vraie carte (data/map-generated.json, 682 hexes) et les 48
 *    nations réelles ;
 * 2. joue les 72 matchs de groupes avec des scores fictifs seedés (mêmes
 *    résultats à chaque run) via le moteur resolveMatch ;
 * 3. exécute finalizeGroupStagePlan (la Grande Fracture) ;
 * 4. vérifie les invariants : 32 qualifiés / 16 éliminées, capitales en
 *    memorial, plus aucun hex possédé par les éliminées, récits sans mot
 *    interdit ;
 * 5. rejoue TOUS les events depuis la carte initiale et exige un diff vide
 *    (la garantie §18.4).
 *
 * Usage : npx tsx scripts/rehearse-fracture.ts
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveMatch } from "../lib/engine/resolve";
import { initialState, replay, diffStates, type GeneratedHex } from "../lib/engine/replay";
import { DEFAULT_GAME_CONFIG, type HexEventDraft } from "../lib/engine/types";
import { containsForbiddenWord, type NationLabel } from "../lib/engine/narrative";
import { finalizeGroupStagePlan, type GroupStageMatch } from "../lib/group-stage";
import { mulberry32 } from "../lib/sim/rng";
import type { NormalizedMatch } from "../lib/providers/types";

type SeedNation = { fifa: string; name_fr: string; flag: string; group: string };

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generated = JSON.parse(readFileSync(join(root, "data", "map-generated.json"), "utf8")) as GeneratedHex[];
const nations = JSON.parse(readFileSync(join(root, "data", "nations-seed.json"), "utf8")) as SeedNation[];

const codes = nations.map((n) => n.fifa);
const labels = new Map<string, NationLabel>(nations.map((n) => [n.fifa, { flag: n.flag, name: n.name_fr }]));
const cfg = DEFAULT_GAME_CONFIG;

// Scores fictifs variés (nuls compris), tirés avec un RNG seedé : la
// répétition est reproductible à l'identique.
const SCORE_POOL: Array<[number, number]> = [
  [1, 0], [2, 0], [2, 1], [3, 1], [0, 0], [1, 1], [0, 1], [1, 2], [0, 2], [4, 0], [2, 2], [3, 0],
];
const rng = mulberry32("fracture-rehearsal-2026");

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (ok) console.log(`  ✓ ${label}`);
  else {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("— Répétition générale : 72 matchs de groupes fictifs sur la vraie carte\n");

const state = initialState(generated, codes);
const allEvents: HexEventDraft[] = [];
const groupResults: GroupStageMatch[] = [];

const groups = [...new Set(nations.map((n) => n.group))].sort();
check("12 groupes de 4 dans le seed", groups.length === 12 && nations.length === 48, `groups=${groups.length} nations=${nations.length}`);

let matchId = 900_001;
let kickoffDay = 11;
for (const group of groups) {
  const members = nations.filter((n) => n.group === group).map((n) => n.fifa).sort();
  const [a, b, c, d] = members;
  // Les 6 affiches du groupe, dans l'ordre des journées 1 → 3.
  const fixtures: Array<[string, string]> = [[a, b], [c, d], [a, c], [b, d], [a, d], [b, c]];
  for (const [home, away] of fixtures) {
    const [scoreHome, scoreAway] = SCORE_POOL[Math.floor(rng() * SCORE_POOL.length)];
    const match: NormalizedMatch = {
      providerId: String(matchId),
      stage: "GROUP",
      group,
      homeFifa: home,
      awayFifa: away,
      kickoffUtc: `2026-06-${String(kickoffDay).padStart(2, "0")}T18:00:00Z`,
      status: "FINISHED",
      scoreHome,
      scoreAway,
      duration: "REGULAR",
      pensHome: null,
      pensAway: null,
    };
    const result = resolveMatch(state, { matchId, match, labels }, cfg);
    allEvents.push(...result.events);
    const forbidden = containsForbiddenWord(result.resolution.narrative);
    if (forbidden) check(`récit sans mot interdit (#${matchId})`, false, `"${forbidden}" dans : ${result.resolution.narrative}`);
    groupResults.push({ group, home, away, scoreHome, scoreAway });
    matchId++;
    if (matchId % 4 === 0) kickoffDay = Math.min(kickoffDay + 1, 27);
  }
}

check("72 matchs résolus par le moteur", groupResults.length === 72, `n=${groupResults.length}`);
check("aucune nation éliminée au fil de l'eau (spec §5.8)", [...state.nationStatus.values()].every((s) => s === "alive"));

console.log("\n— La Grande Fracture (finalize_group_stage)\n");

const plan = finalizeGroupStagePlan(
  state,
  nations.map((n) => ({ code: n.fifa, group: n.group, label: labels.get(n.fifa)! })),
  groupResults,
  cfg,
);
allEvents.push(...plan.events);

check("32 qualifiés", plan.qualified.length === 32, `n=${plan.qualified.length}`);
check("16 éliminées", plan.eliminated.length === 16, `n=${plan.eliminated.length}`);
check("8 meilleurs troisièmes repêchés", plan.thirds.slice(0, 8).every((t) => plan.qualified.includes(t.code)));
check(
  "departages non résolus signalés (décision admin, §21.10)",
  plan.warnings.every((w) => w.code !== "group_size_unexpected" && w.code !== "group_matches_unexpected"),
  JSON.stringify(plan.warnings),
);

for (const code of plan.eliminated) {
  const hexes = [...state.hexes.values()];
  const capital = hexes.find((h) => h.isCapital && h.originalOwner === code);
  const owned = hexes.filter((h) => h.owner === code && h.state === "owned");
  check(`${labels.get(code)?.name ?? code} : capitale memorial, 0 hex possédé`,
    capital?.state === "memorial" && owned.length === 0,
    `capital=${capital?.state} owned=${owned.length}`);
}

const ruins = [...state.hexes.values()].filter((h) => h.state === "ruins").length;
const memorials = [...state.hexes.values()].filter((h) => h.state === "memorial").length;
check("16 memorials sur la carte", memorials === 16, `n=${memorials}`);
check("des ruines existent (décor de la phase KO)", ruins > 0, `n=${ruins}`);

console.log("\n— Replay de contrôle (§18.4) : rejouer tous les events depuis la carte vierge\n");

const replayed = replay(generated, codes, allEvents);
const diff = diffStates(state, replayed);
check("diff vide entre l'état joué et l'état rejoué", diff.length === 0, diff.slice(0, 5).join(" | "));

console.log("\n— Les 16 tombées de la répétition :");
for (const code of plan.eliminated) {
  console.log(`  ${labels.get(code)?.flag ?? ""} ${labels.get(code)?.name ?? code}`);
}

console.log(`\nRésultat : ${failures === 0 ? "RÉPÉTITION RÉUSSIE ✓" : `${failures} ÉCHEC(S) ✗`}`);
if (failures > 0) process.exit(1);
