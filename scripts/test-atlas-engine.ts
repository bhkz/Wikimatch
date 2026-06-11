/**
 * Tests offline du moteur Atlas (spec §20 P0.3) — aucun réseau, aucune DB.
 * Usage : npx tsx scripts/test-atlas-engine.ts
 */

import { hexDistance, hexNeighbors } from "../lib/hex";
import { outcome } from "../lib/engine/outcome";
import { baseGain, overextension, territorySize } from "../lib/engine/gain";
import { resolveMatch } from "../lib/engine/resolve";
import { initialState, replay, diffStates, type GeneratedHex } from "../lib/engine/replay";
import { containsForbiddenWord } from "../lib/engine/narrative";
import { parseCsv } from "../lib/providers/csv-import";
import { extractScore } from "../lib/providers/extract-score";
import { FootballDataProvider, UnknownStageError, UnknownTeamError } from "../lib/providers/football-data";
import { computeStandings } from "../lib/standings";
import { simulateGroupStage, type SimMatch, type SimNation } from "../lib/sim/simulate";
import { DEFAULT_MODEL } from "../lib/sim/model";
import { closeness, composeDrama, elimFlag, upsetPotential } from "../lib/drama";
import { groupOutlook } from "../lib/conditions";
import { finalizeGroupStagePlan } from "../lib/group-stage";
import { DEFAULT_GAME_CONFIG, type EngineState } from "../lib/engine/types";
import type { NormalizedMatch, Stage } from "../lib/providers/types";

let passed = 0;
let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}\n    ${err instanceof Error ? err.message : err}`);
  }
}
function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
function assertThrows(fn: () => void, fragment: string) {
  try {
    fn();
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    assert(m.includes(fragment), `erreur attendue contenant "${fragment}", reçue : "${m}"`);
    return;
  }
  throw new Error(`aucune erreur levée (attendu : "${fragment}")`);
}

// ---------------------------------------------------------------------------
// Fixture : 4 nations × 10 hexes en lignes séparées + 6 neutres.
// AAA r=0 q0..9 (capitale q0) · BBB r=2 · CCC r=4 · DDD r=6 · neutres r=8 q0..5
// ---------------------------------------------------------------------------
const NATIONS = ["AAA", "BBB", "CCC", "DDD"];
const LABELS = new Map(NATIONS.map((c, i) => [c, { flag: ["🟥", "🟦", "🟩", "🟨"][i], name: `Nation ${c}` }]));

function makeGenerated(): GeneratedHex[] {
  const hexes: GeneratedHex[] = [];
  let id = 1;
  NATIONS.forEach((code, i) => {
    for (let q = 0; q < 10; q++) {
      hexes.push({
        id: id++,
        q,
        r: i * 2,
        city_name: `${code}-ville-${q}`,
        is_capital: q === 0,
        original_owner: code,
      });
    }
  });
  for (let q = 0; q < 6; q++) {
    hexes.push({ id: id++, q, r: 8, city_name: `Océan-${q}`, is_capital: false, original_owner: null });
  }
  return hexes;
}
function makeState(): EngineState {
  return initialState(makeGenerated(), NATIONS);
}
function fakeMatch(over: Partial<NormalizedMatch> = {}): NormalizedMatch {
  return {
    providerId: "1",
    stage: "GROUP",
    group: "A",
    homeFifa: "AAA",
    awayFifa: "BBB",
    kickoffUtc: "2026-06-11T19:00:00Z",
    status: "FINISHED",
    scoreHome: 1,
    scoreAway: 0,
    duration: "REGULAR",
    pensHome: null,
    pensAway: null,
    ...over,
  };
}
const CFG = DEFAULT_GAME_CONFIG;

console.log("\n— Géométrie hexagonale (§4.1)");
check("distance axiale", () => {
  assert(hexDistance({ q: 0, r: 0 }, { q: 3, r: 0 }) === 3, "distance droite");
  assert(hexDistance({ q: 0, r: 0 }, { q: 0, r: 2 }) === 2, "distance r");
  assert(hexDistance({ q: 2, r: -1 }, { q: 2, r: -1 }) === 0, "distance nulle");
});
check("6 voisins", () => assert(hexNeighbors({ q: 0, r: 0 }).length === 6, "6 attendus"));

console.log("\n— Issue d'un match (§5.2)");
check("victoire au score (prolongation incluse)", () => {
  const o = outcome(fakeMatch({ scoreHome: 3, scoreAway: 1 }));
  assert(!o.isDraw && o.winner === "AAA" && o.goalDiff === 2, "AAA gd2 attendu");
});
check("victoire extérieure", () => {
  const o = outcome(fakeMatch({ scoreHome: 0, scoreAway: 2 }));
  assert(!o.isDraw && o.winner === "BBB" && o.loser === "AAA", "BBB attendu");
});
check("TAB → vainqueur des TAB, gd=0", () => {
  const o = outcome(fakeMatch({ stage: "R16", scoreHome: 1, scoreAway: 1, duration: "PENALTY_SHOOTOUT", pensHome: 4, pensAway: 2 }));
  assert(!o.isDraw && o.winner === "AAA" && o.goalDiff === 0, "AAA gd0 attendu");
});
check("nul en groupes", () => {
  const o = outcome(fakeMatch({ scoreHome: 1, scoreAway: 1 }));
  assert(o.isDraw, "nul attendu");
});
check("nul en KO sans TAB → refus", () =>
  assertThrows(() => outcome(fakeMatch({ stage: "QF", scoreHome: 1, scoreAway: 1 })), "incohérentes"));
check("FINISHED sans score → refus", () =>
  assertThrows(() => outcome(fakeMatch({ scoreHome: null })), "sans score"));
check("non FINISHED → refus", () =>
  assertThrows(() => outcome(fakeMatch({ status: "IN_PLAY" })), "non FINISHED"));

console.log("\n— Gain de base (§5.3)");
check("barème par stage", () => {
  const cases: Array<[Stage, number, number]> = [
    ["GROUP", 1, 2], ["GROUP", 2, 3], ["GROUP", 5, 4],
    ["R32", 1, 4], ["R16", 3, 6], ["QF", 1, 5], ["SF", 4, 8],
    ["THIRD", 5, 3], ["FINAL", 5, 10],
  ];
  for (const [stage, gd, expected] of cases) {
    const got = baseGain(stage, gd, CFG);
    assert(got === expected, `${stage} gd${gd} : ${got} ≠ ${expected}`);
  }
});

console.log("\n— Surextension impériale (§5.4)");
check("territoires égaux → m=1", () => {
  const { finalGain, mOverext } = overextension(4, makeState(), "AAA", CFG);
  assert(mOverext === 1 && finalGain === 4, `m=${mOverext} gain=${finalGain}`);
});
check("poucet gagne double (clamp 2.0)", () => {
  const s = makeState();
  for (const h of s.hexes.values()) if (h.owner === "AAA" && !h.isCapital && h.q > 1) { h.owner = null; h.state = "neutral"; }
  assert(territorySize(s, "AAA") === 2, "AAA réduit à 2");
  const { mOverext } = overextension(2, s, "AAA", CFG);
  assert(mOverext === 2, `clamp 2.0 attendu, m=${mOverext}`);
});
check("plancher 1 et plafond 12", () => {
  const s = makeState();
  const { finalGain } = overextension(1, s, "AAA", { ...CFG, overextMin: 0.1 });
  assert(finalGain >= 1, "plancher 1");
  const big = overextension(8, s, "AAA", { ...CFG, overextMax: 2.0 });
  assert(big.finalGain <= 12, "plafond 12");
});

console.log("\n— Résolution : victoire en groupes (§5.6–5.7)");
check("l'empire perd ses marches (distance décroissante)", () => {
  const s = makeState();
  const { resolution, events } = resolveMatch(s, { matchId: 1, match: fakeMatch({ scoreHome: 2, scoreAway: 0 }), labels: LABELS }, CFG);
  // gd=2 → base 3, m=1 → gain 3 : BBB perd q9, q8, q7 (les plus loin de sa capitale q0).
  assert(resolution.finalGain === 3, `gain=${resolution.finalGain}`);
  const takenQ = events.filter((e) => e.type === "captured").map((e) => s.hexes.get(e.hexId)!.q).sort((a, b) => a - b);
  assert(JSON.stringify(takenQ) === "[7,8,9]", `q pris : ${takenQ}`);
  for (const id of resolution.hexesTaken) {
    const h = s.hexes.get(id)!;
    assert(h.owner === "AAA" && h.conquered && h.state === "owned", `hex ${id} mal transféré`);
  }
});
check("capitale imprenable tant que la nation est alive", () => {
  const s = makeState();
  const { resolution } = resolveMatch(s, { matchId: 2, match: fakeMatch({ scoreHome: 9, scoreAway: 0 }), labels: LABELS }, CFG);
  const capital = [...s.hexes.values()].find((h) => h.originalOwner === "BBB" && h.isCapital)!;
  assert(!resolution.hexesTaken.includes(capital.id), "capitale prise !");
  assert(capital.owner === "BBB", "capitale transférée !");
});
check("hexes conquered pris avant les hexes d'origine (à distance égale)", () => {
  const s = makeState();
  // BBB possède un hex volé à même distance que ses marches : q9 conquered.
  const q9 = [...s.hexes.values()].find((h) => h.originalOwner === "BBB" && h.q === 9)!;
  const q8 = [...s.hexes.values()].find((h) => h.originalOwner === "BBB" && h.q === 8)!;
  q8.conquered = true; // q8 (dist 8) vs q9 (dist 9) : distance prime, q9 d'abord
  const { resolution } = resolveMatch(s, { matchId: 3, match: fakeMatch(), labels: LABELS }, CFG);
  assert(resolution.finalGain === 2 && resolution.hexesTaken.includes(q9.id) && resolution.hexesTaken.includes(q8.id),
    "q9 (distance) puis q8 (conquered) attendus");
});
check("récit conquête (template fermé)", () => {
  const s = makeState();
  // AAA possède déjà q8 de la ligne BBB → le prochain hex pris (q9) lui est adjacent.
  const q8 = [...s.hexes.values()].find((h) => h.originalOwner === "BBB" && h.q === 8)!;
  q8.owner = "AAA";
  q8.conquered = true;
  const { resolution } = resolveMatch(s, { matchId: 4, match: fakeMatch(), labels: LABELS }, CFG);
  assert(resolution.narrative.includes("prend") && resolution.narrative.includes("Nation AAA"), resolution.narrative);
  assert(!resolution.narrative.includes("enclave"), resolution.narrative);
});
check("variante enclave si aucun hex pris adjacent au vainqueur", () => {
  const s = makeState(); // AAA (r=0) et BBB (r=2) ne sont jamais adjacents (distance 2)
  const { resolution } = resolveMatch(s, { matchId: 5, match: fakeMatch(), labels: LABELS }, CFG);
  assert(resolution.narrative.includes("enclave"), resolution.narrative);
});

console.log("\n— Match nul (§5.5)");
check("chaque équipe prend le neutre le plus proche de sa capitale", () => {
  const s = makeState();
  const { resolution, events } = resolveMatch(s, { matchId: 6, match: fakeMatch({ homeFifa: "CCC", awayFifa: "DDD", scoreHome: 0, scoreAway: 0 }), labels: LABELS }, CFG);
  assert(resolution.isDraw && resolution.hexesTaken.length === 2, "2 hexes attendus");
  assert(events.every((e) => e.type === "neutral_claimed"), "type neutral_claimed");
  const owners = resolution.hexesTaken.map((id) => s.hexes.get(id)!.owner).sort();
  assert(JSON.stringify(owners) === '["CCC","DDD"]', `owners : ${owners}`);
});
check("nul sans neutre disponible → aucun gain + log draw_no_neutral (§21.8)", () => {
  const s = makeState();
  for (const h of s.hexes.values()) if (h.state === "neutral") { h.state = "ruins"; }
  const { resolution, logs } = resolveMatch(s, { matchId: 7, match: fakeMatch({ scoreHome: 0, scoreAway: 0 }), labels: LABELS }, CFG);
  assert(resolution.hexesTaken.length === 0, "aucun hex");
  assert(logs.filter((l) => l.code === "draw_no_neutral").length === 2, "2 logs attendus");
});

console.log("\n— Élimination KO, héritage, ruines (§5.8)");
check("R16 : perdant éliminé, capitale memorial, héritage floor(n/2), reste en ruines", () => {
  const s = makeState();
  const { resolution } = resolveMatch(s, { matchId: 8, match: fakeMatch({ stage: "R16", scoreHome: 1, scoreAway: 0 }), labels: LABELS }, CFG);
  assert(s.nationStatus.get("BBB") === "eliminated", "BBB eliminated");
  const bbbHexes = [...s.hexes.values()].filter((h) => h.originalOwner === "BBB");
  const capital = bbbHexes.find((h) => h.isCapital)!;
  assert(capital.state === "memorial" && capital.owner === null, "capitale memorial");
  // gain 4 → il reste 10-1(cap)-4 = 5 → héritage floor(5×0.5)=2, ruines 3.
  assert(resolution.finalGain === 4, `gain=${resolution.finalGain}`);
  assert(resolution.inheritedHexes.length === 2, `héritage=${resolution.inheritedHexes.length}`);
  assert(bbbHexes.filter((h) => h.state === "ruins").length === 3, "3 ruines attendues");
});
check("SF : élimination différée (perdant reste alive)", () => {
  const s = makeState();
  resolveMatch(s, { matchId: 9, match: fakeMatch({ stage: "SF", scoreHome: 1, scoreAway: 0 }), labels: LABELS }, CFG);
  assert(s.nationStatus.get("BBB") === "alive", "BBB doit rester alive (§21.9)");
});
check("THIRD : gain de 3 d'abord, puis les deux perdants de demies tombent (§21.9)", () => {
  const s = makeState();
  const { resolution } = resolveMatch(s, { matchId: 10, match: fakeMatch({ stage: "THIRD", scoreHome: 1, scoreAway: 0 }), labels: LABELS }, CFG);
  assert(resolution.finalGain === 3, `gain=${resolution.finalGain}`);
  assert(s.nationStatus.get("AAA") === "eliminated" && s.nationStatus.get("BBB") === "eliminated", "les deux eliminated");
  const capitals = [...s.hexes.values()].filter((h) => h.isCapital && ["AAA", "BBB"].includes(h.originalOwner!));
  assert(capitals.every((c) => c.state === "memorial"), "2 memorials");
});
check("memorial intouchable (jamais sélectionnable ensuite)", () => {
  const s = makeState();
  resolveMatch(s, { matchId: 11, match: fakeMatch({ stage: "R16", scoreHome: 1, scoreAway: 0 }), labels: LABELS }, CFG);
  const memorialId = [...s.hexes.values()].find((h) => h.state === "memorial")!.id;
  const { resolution } = resolveMatch(s, { matchId: 12, match: fakeMatch({ homeFifa: "CCC", awayFifa: "AAA", stage: "QF", scoreHome: 9, scoreAway: 0 }), labels: LABELS }, CFG);
  assert(!resolution.hexesTaken.includes(memorialId), "memorial pris !");
});
check("débordement : perdant réduit déborde sur ruines puis neutres (§21.7)", () => {
  const s = makeState();
  // BBB réduit à sa capitale + 1 hex ; des ruines existent (via élimination de CCC simulée).
  for (const h of s.hexes.values()) {
    if (h.originalOwner === "BBB" && !h.isCapital && h.q > 1) { h.owner = null; h.state = "ruins"; }
  }
  const { resolution, logs } = resolveMatch(s, { matchId: 13, match: fakeMatch({ scoreHome: 4, scoreAway: 0 }), labels: LABELS }, CFG);
  // base 4 (gd cap), m clampé ; il n'y a qu'1 hex BBB éligible → débordement sur ruines.
  const overflowed = resolution.hexesTaken.map((id) => s.hexes.get(id)!).filter((h) => h.originalOwner === "BBB" && h.q > 1);
  assert(overflowed.length > 0, "débordement attendu sur les ruines");
  assert(logs.every((l) => l.code !== "gain_truncated"), "pas de troncature ici");
});

console.log("\n— Finale et world_conquered (§5.9, §21.16)");
check("FINAL : champion, vague sur ruines+neutres, memorials préservés, game_over", () => {
  const s = makeState();
  resolveMatch(s, { matchId: 14, match: fakeMatch({ homeFifa: "CCC", awayFifa: "DDD", stage: "SF", scoreHome: 2, scoreAway: 0 }), labels: LABELS }, CFG);
  const { resolution } = resolveMatch(s, { matchId: 15, match: fakeMatch({ stage: "FINAL", scoreHome: 1, scoreAway: 0 }), labels: LABELS }, CFG);
  assert(s.nationStatus.get("AAA") === "champion", "AAA champion");
  assert(s.gameOver, "game_over");
  assert(resolution.finalGain === 10, `gain=${resolution.finalGain}`);
  const leftovers = [...s.hexes.values()].filter((h) => h.state === "ruins" || h.state === "neutral");
  assert(leftovers.length === 0, `${leftovers.length} hexes non balayés`);
  const memorials = [...s.hexes.values()].filter((h) => h.state === "memorial");
  assert(memorials.length === 1, "le memorial de BBB doit rester");
});
check("game_over → toute résolution refusée", () => {
  const s = makeState();
  s.gameOver = true;
  assertThrows(() => resolveMatch(s, { matchId: 16, match: fakeMatch(), labels: LABELS }, CFG), "game_over");
});

console.log("\n— Replay et reconstruction (§18.4)");
check("rejouer les events reproduit l'état à l'identique", () => {
  const generated = makeGenerated();
  const s = initialState(generated, NATIONS);
  const allEvents = [
    ...resolveMatch(s, { matchId: 20, match: fakeMatch({ scoreHome: 3, scoreAway: 0 }), labels: LABELS }, CFG).events,
    ...resolveMatch(s, { matchId: 21, match: fakeMatch({ homeFifa: "CCC", awayFifa: "DDD", scoreHome: 0, scoreAway: 0 }), labels: LABELS }, CFG).events,
    ...resolveMatch(s, { matchId: 22, match: fakeMatch({ homeFifa: "CCC", awayFifa: "BBB", stage: "R16", scoreHome: 0, scoreAway: 1, duration: "REGULAR" }), labels: LABELS }, CFG).events,
  ];
  const rebuilt = replay(makeGenerated(), NATIONS, allEvents);
  const diffs = diffStates(s, rebuilt);
  assert(diffs.length === 0, `diff non vide : ${diffs.slice(0, 3).join(" ; ")}`);
});

console.log("\n— Ton anti-géopolitique (§22.3)");
check("aucun mot interdit dans les récits générés", () => {
  const s = makeState();
  const narratives = [
    resolveMatch(s, { matchId: 30, match: fakeMatch({ scoreHome: 2, scoreAway: 0 }), labels: LABELS }, CFG).resolution.narrative,
    resolveMatch(s, { matchId: 31, match: fakeMatch({ homeFifa: "CCC", awayFifa: "DDD", scoreHome: 1, scoreAway: 1 }), labels: LABELS }, CFG).resolution.narrative,
    resolveMatch(s, { matchId: 32, match: fakeMatch({ homeFifa: "CCC", awayFifa: "BBB", stage: "FINAL", scoreHome: 2, scoreAway: 0 }), labels: LABELS }, CFG).resolution.narrative,
  ];
  for (const n of narratives) {
    const bad = containsForbiddenWord(n);
    assert(bad === null, `mot interdit "${bad}" dans : ${n}`);
  }
});

console.log("\n— Providers (§3.2–3.3)");
check("extract-score : temps réglementaire", () => {
  const r = extractScore({ winner: "HOME_TEAM", duration: "REGULAR", fullTime: { home: 2, away: 1 } });
  assert(r.scoreHome === 2 && r.duration === "REGULAR" && r.pensHome === null, JSON.stringify(r));
});
check("extract-score : TAB", () => {
  const r = extractScore({ winner: "AWAY_TEAM", duration: "PENALTY_SHOOTOUT", fullTime: { home: 1, away: 1 }, penalties: { home: 3, away: 4 } });
  assert(r.scoreHome === 1 && r.pensAway === 4, JSON.stringify(r));
});
check("extract-score : TAB sans détail → pens null (refus de deviner)", () => {
  const r = extractScore({ winner: "AWAY_TEAM", duration: "PENALTY_SHOOTOUT", fullTime: { home: 1, away: 1 } });
  assert(r.pensHome === null && r.pensAway === null, JSON.stringify(r));
});
check("CSV : parse valide", () => {
  const rows = parseCsv(
    "provider_id,stage,group,home_fifa,away_fifa,kickoff_utc,status,score_home,score_away,duration,pens_home,pens_away\n" +
    "500001,GROUP,A,MEX,RSA,2026-06-11T19:00:00Z,FINISHED,2,1,REGULAR,,\n" +
    "500050,R32,,FRA,MAR,2026-06-29T01:00:00Z,FINISHED,1,1,PENALTY_SHOOTOUT,4,2",
  );
  assert(rows.length === 2 && rows[0].homeFifa === "MEX" && rows[1].pensHome === 4, JSON.stringify(rows[1]));
});
check("CSV : en-tête invalide → refus", () => assertThrows(() => parseCsv("a,b,c\n1,2,3"), "en-tête"));
check("CSV : stage inconnu → refus", () =>
  assertThrows(() => parseCsv(
    "provider_id,stage,group,home_fifa,away_fifa,kickoff_utc,status,score_home,score_away,duration,pens_home,pens_away\n" +
    "1,QUALIF,A,MEX,RSA,2026-06-11T19:00:00Z,FINISHED,2,1,REGULAR,,",
  ), "stage"));
check("football-data normalize : mapping ok + groupe extrait", () => {
  const p = new FootballDataProvider({
    token: "x",
    teamIdToFifa: new Map([[770, "MEX"], [771, "RSA"]]),
    stageMapping: { GROUP_STAGE: "GROUP" },
  });
  const m = p.normalize({
    id: 500001, utcDate: "2026-06-11T19:00:00Z", status: "FINISHED", stage: "GROUP_STAGE", group: "GROUP_A", matchday: 1,
    homeTeam: { id: 770 }, awayTeam: { id: 771 },
    score: { winner: "HOME_TEAM", duration: "REGULAR", fullTime: { home: 2, away: 1 } },
  });
  assert(m.homeFifa === "MEX" && m.group === "A" && m.scoreHome === 2, JSON.stringify(m));
});
check("football-data : stage inconnu → alerte, jamais deviner (§21.5)", () => {
  const p = new FootballDataProvider({ token: "x", teamIdToFifa: new Map(), stageMapping: { GROUP_STAGE: "GROUP" } });
  assertThrows(() => p.normalize({
    id: 1, utcDate: "2026-06-11T19:00:00Z", status: "TIMED", stage: "PLAYOFFS", group: null, matchday: null,
    homeTeam: { id: null }, awayTeam: { id: null }, score: null,
  }), "Stage inconnu");
});
check("football-data : équipe inconnue → refus (§21.6)", () => {
  const p = new FootballDataProvider({ token: "x", teamIdToFifa: new Map(), stageMapping: { GROUP_STAGE: "GROUP" } });
  assertThrows(() => p.normalize({
    id: 1, utcDate: "2026-06-11T19:00:00Z", status: "TIMED", stage: "GROUP_STAGE", group: "GROUP_A", matchday: 1,
    homeTeam: { id: 999 }, awayTeam: { id: null }, score: null,
  }), "fd_team_id 999");
});
check("football-data : équipe placeholder (tableau) → TBD", () => {
  const p = new FootballDataProvider({ token: "x", teamIdToFifa: new Map(), stageMapping: { LAST_16: "R16" } });
  const m = p.normalize({
    id: 2, utcDate: "2026-07-01T19:00:00Z", status: "SCHEDULED", stage: "LAST_16", group: null, matchday: null,
    homeTeam: { id: null }, awayTeam: { id: null }, score: null,
  });
  assert(m.homeFifa === "TBD" && m.awayFifa === "TBD", JSON.stringify(m));
});

console.log("\n— Classements de groupe (§6)");
check("points puis diff puis buts marqués", () => {
  const rows = computeStandings(["AAA", "BBB", "CCC", "DDD"], [
    { home: "AAA", away: "BBB", scoreHome: 2, scoreAway: 0 },
    { home: "CCC", away: "DDD", scoreHome: 1, scoreAway: 1 },
    { home: "AAA", away: "CCC", scoreHome: 1, scoreAway: 1 },
    { home: "BBB", away: "DDD", scoreHome: 3, scoreAway: 0 },
  ]);
  assert(rows[0].code === "AAA" && rows[0].points === 4, JSON.stringify(rows.map((r) => r.code)));
  assert(rows[1].code === "BBB", "BBB 2e (diff +1 vs CCC/DDD)");
});
check("confrontation directe départage à égalité parfaite de stats", () => {
  // AAA et BBB : 3 pts, même diff, mêmes buts — BBB a battu AAA.
  const rows = computeStandings(["AAA", "BBB", "CCC", "DDD"], [
    { home: "BBB", away: "AAA", scoreHome: 1, scoreAway: 0 },
    { home: "AAA", away: "CCC", scoreHome: 1, scoreAway: 0 },
    { home: "BBB", away: "DDD", scoreHome: 0, scoreAway: 1 },
  ]);
  const posBBB = rows.findIndex((r) => r.code === "BBB");
  const posAAA = rows.findIndex((r) => r.code === "AAA");
  assert(posBBB < posAAA, `BBB doit devancer AAA (h2h) : ${rows.map((r) => r.code).join(",")}`);
  assert(!rows[posBBB].unresolvedTie, "départagé proprement");
});
check("égalité parfaite résiduelle → marquée unresolvedTie", () => {
  const rows = computeStandings(["AAA", "BBB", "CCC", "DDD"], [
    { home: "AAA", away: "BBB", scoreHome: 1, scoreAway: 1 },
  ]);
  const a = rows.find((r) => r.code === "AAA")!;
  const b = rows.find((r) => r.code === "BBB")!;
  assert(a.unresolvedTie && b.unresolvedTie, "égalité 1-1 sans critère : non départagée");
});

console.log("\n— Simulation Monte-Carlo (§7)");
const SIM_NATIONS: SimNation[] = [
  { code: "AAA", group: "A", elo: 1900 },
  { code: "BBB", group: "A", elo: 1600 },
  { code: "CCC", group: "A", elo: 1500 },
  { code: "DDD", group: "A", elo: 1300 },
];
const SIM_MATCHES: SimMatch[] = [
  { id: 1, group: "A", home: "AAA", away: "BBB", scoreHome: null, scoreAway: null },
  { id: 2, group: "A", home: "CCC", away: "DDD", scoreHome: null, scoreAway: null },
  { id: 3, group: "A", home: "AAA", away: "CCC", scoreHome: null, scoreAway: null },
  { id: 4, group: "A", home: "BBB", away: "DDD", scoreHome: null, scoreAway: null },
  { id: 5, group: "A", home: "AAA", away: "DDD", scoreHome: null, scoreAway: null },
  { id: 6, group: "A", home: "BBB", away: "CCC", scoreHome: null, scoreAway: null },
];
check("déterminisme : même seed → mêmes probabilités", () => {
  const a = simulateGroupStage(SIM_NATIONS, SIM_MATCHES, 500, "seed-x");
  const b = simulateGroupStage(SIM_NATIONS, SIM_MATCHES, 500, "seed-x");
  assert(JSON.stringify(a.probs) === JSON.stringify(b.probs), "runs divergents");
});
check("cohérence : favoris devant, p_win_group somme à 1", () => {
  const { probs } = simulateGroupStage(SIM_NATIONS, SIM_MATCHES, 2000, "seed-y");
  const sum = Object.values(probs).reduce((s, p) => s + p.p_win_group, 0);
  assert(Math.abs(sum - 1) < 1e-9, `somme p_win_group=${sum}`);
  assert(probs.AAA.p_win_group > probs.DDD.p_win_group, "AAA (1900) doit dominer DDD (1300)");
  assert(probs.AAA.p_qualify >= probs.AAA.p_top2, "p_qualify ≥ p_top2");
});
check("matchs déjà joués respectés + issue forcée (swing)", () => {
  const played: SimMatch[] = SIM_MATCHES.map((m) =>
    m.id <= 4 ? { ...m, scoreHome: m.home === "DDD" ? 0 : 3, scoreAway: m.away === "DDD" ? 0 : m.id === 1 ? 1 : 0 } : m,
  );
  const base = simulateGroupStage(SIM_NATIONS, played, 1000, "seed-z");
  const forcedWin = simulateGroupStage(SIM_NATIONS, played, 1000, "seed-z", undefined, {
    matchId: 5,
    outcome: "AWAY", // DDD bat AAA
  });
  assert(forcedWin.probs.DDD.p_qualify >= base.probs.DDD.p_qualify, "forcer la victoire de DDD doit aider DDD");
});

console.log("\n— Drama-mètre (§9)");
check("closeness max à forces égales, upset nul à forces égales", () => {
  const even = closeness(1600, 1600, DEFAULT_MODEL);
  const skewed = closeness(1900, 1300, DEFAULT_MODEL);
  assert(even > 0.99 && skewed < even, `even=${even} skewed=${skewed}`);
  assert(upsetPotential(1600, 1600, DEFAULT_MODEL) === 0, "pas d'exploit possible sans écart");
  assert(upsetPotential(1900, 1300, DEFAULT_MODEL) > 0.1, "exploit possible avec gros écart");
});
check("composition pondérée bornée 0-100", () => {
  const weights = { swing: 0.35, close: 0.25, elim: 0.2, stage: 0.1, upset: 0.1 };
  const max = composeDrama({ swing: 1, close: 1, elim: 1, stage: 1, upset: 1 }, weights);
  const min = composeDrama({ swing: 0, close: 0, elim: 0, stage: 0, upset: 0 }, weights);
  assert(max === 100 && min === 0, `max=${max} min=${min}`);
  assert(elimFlag("R16", null) === 1 && elimFlag("GROUP", 3) === 1 && elimFlag("GROUP", 1) === 0, "elim flags");
});

console.log("\n— Conditions de qualification (§6.5)");
check("top 2 garanti dans tous les scénarios → qualified", () => {
  // AAA a gagné ses 2 premiers matchs 3-0 ; les autres se neutralisent.
  const outlook = groupOutlook(
    ["AAA", "BBB", "CCC", "DDD"],
    [
      { home: "AAA", away: "BBB", scoreHome: 3, scoreAway: 0 },
      { home: "AAA", away: "CCC", scoreHome: 3, scoreAway: 0 },
      { home: "CCC", away: "DDD", scoreHome: 0, scoreAway: 0 },
      { home: "BBB", away: "DDD", scoreHome: 0, scoreAway: 0 },
    ],
    [
      { id: 5, home: "AAA", away: "DDD" },
      { id: 6, home: "BBB", away: "CCC" },
    ],
  );
  assert(outlook.AAA.status === "qualified", `AAA=${outlook.AAA.status}`);
  assert(outlook.DDD.status === "contender", `DDD=${outlook.DDD.status}`);
});
check("4e dans tous les scénarios → eliminated", () => {
  // DDD a perdu 0-5, 0-5 et son dernier match est déjà joué (perdu aussi).
  const outlook = groupOutlook(
    ["AAA", "BBB", "CCC", "DDD"],
    [
      { home: "AAA", away: "DDD", scoreHome: 5, scoreAway: 0 },
      { home: "BBB", away: "DDD", scoreHome: 5, scoreAway: 0 },
      { home: "CCC", away: "DDD", scoreHome: 5, scoreAway: 0 },
      { home: "AAA", away: "BBB", scoreHome: 1, scoreAway: 0 },
    ],
    [
      { id: 9, home: "AAA", away: "CCC" },
      { id: 10, home: "BBB", away: "CCC" },
    ],
  );
  assert(outlook.DDD.status === "eliminated", `DDD=${outlook.DDD.status}`);
});
check("conditions par issue avec templates fermés (et déterministes)", () => {
  const args = [
    ["AAA", "BBB", "CCC", "DDD"],
    [
      { home: "AAA", away: "BBB", scoreHome: 1, scoreAway: 0 },
      { home: "CCC", away: "DDD", scoreHome: 1, scoreAway: 0 },
      { home: "AAA", away: "CCC", scoreHome: 1, scoreAway: 0 },
      { home: "BBB", away: "DDD", scoreHome: 1, scoreAway: 0 },
    ],
    [
      { id: 5, home: "AAA", away: "DDD" },
      { id: 6, home: "BBB", away: "CCC" },
    ],
  ] as const;
  const a = groupOutlook([...args[0]], [...args[1]], [...args[2]]);
  const b = groupOutlook([...args[0]], [...args[1]], [...args[2]]);
  assert(JSON.stringify(a) === JSON.stringify(b), "non déterministe");
  assert(a.BBB.status === "contender" && a.BBB.conditions.length === 3, JSON.stringify(a.BBB));
  assert(a.BBB.conditions.some((c) => c.text.includes("victoire")), "template victoire attendu");
  for (const code of Object.keys(a)) {
    for (const c of a[code].conditions) {
      const bad = containsForbiddenWord(c.text);
      assert(bad === null, `mot interdit "${bad}" dans : ${c.text}`);
    }
  }
});

console.log("\n— Finalisation groupes / Grande Fracture (§16.5)");
check("12 groupes → 32 qualifiés, 16 éliminés, events hors match", () => {
  const groups = "ABCDEFGHIJKL".split("");
  const nations = groups.flatMap((g) =>
    [1, 2, 3, 4].map((rank) => ({
      code: `${g}${rank}X`,
      group: g,
      label: { flag: "", name: `${g}${rank}` },
    })),
  );
  const generated: GeneratedHex[] = [];
  let id = 1;
  nations.forEach((n, idx) => {
    for (let q = 0; q < 3; q++) {
      generated.push({
        id: id++,
        q,
        r: idx,
        city_name: `${n.code}-${q}`,
        is_capital: q === 0,
        original_owner: n.code,
      });
    }
  });
  const matches = groups.flatMap((g) => {
    const [a, b, c, d] = [1, 2, 3, 4].map((rank) => `${g}${rank}X`);
    return [
      { group: g, home: a, away: b, scoreHome: 1, scoreAway: 0 },
      { group: g, home: a, away: c, scoreHome: 1, scoreAway: 0 },
      { group: g, home: a, away: d, scoreHome: 1, scoreAway: 0 },
      { group: g, home: b, away: c, scoreHome: 1, scoreAway: 0 },
      { group: g, home: b, away: d, scoreHome: 1, scoreAway: 0 },
      { group: g, home: c, away: d, scoreHome: 1, scoreAway: 0 },
    ];
  });
  const state = initialState(generated, nations.map((n) => n.code));
  const plan = finalizeGroupStagePlan(state, nations, matches, CFG);
  assert(plan.qualified.length === 32, `qualified=${plan.qualified.length}`);
  assert(plan.eliminated.length === 16, `eliminated=${plan.eliminated.length}`);
  assert(plan.nationUpdates.length === 16, `updates=${plan.nationUpdates.length}`);
  assert(plan.events.some((e) => e.type === "memorial" && e.matchId === null), "memorial hors match attendu");
  for (const code of plan.eliminated) {
    assert(state.nationStatus.get(code) === "eliminated", `${code} doit être eliminated`);
  }
});

console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) process.exit(1);
