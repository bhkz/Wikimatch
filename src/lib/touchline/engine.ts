/**
 * Touchline Commander — moteur de match (labo, hors spec Atlas).
 * Simulation autonome 11v11 : décisions individuelles (passe, dribble, tir,
 * tacle), positionnement par phases (bloc, lignes, largeur, pressing),
 * fatigue, moral, cohésion, coach adverse adaptatif. Pur TypeScript, zéro
 * dépendance, déterministe à seed fixée. Unités : mètres, secondes de match.
 */

export type Vec = { x: number; y: number };
export const FIELD = { w: 105, h: 68 };
const CENTER: Vec = { x: FIELD.w / 2, y: FIELD.h / 2 };

export type Side = "home" | "away";
export type Role = "GK" | "DD" | "DC" | "DG" | "MDC" | "MC" | "MOC" | "AD" | "AG" | "BU";
const DEF_ROLES: Role[] = ["DD", "DC", "DG"];
const MID_ROLES: Role[] = ["MDC", "MC", "MOC"];
const ATT_ROLES: Role[] = ["AD", "AG", "BU"];

export type Attrs = {
  pace: number; stamina: number; technique: number; vision: number;
  aggression: number; discipline: number; intelligence: number; decision: number;
};

export type EffectKind =
  | "shift"      // déplacement de zone (dx, dy)
  | "depth"      // attaque la profondeur
  | "between"    // décroche entre les lignes
  | "cover"      // reste en couverture
  | "push"       // monte (latéral, ligne)
  | "hold"       // ne monte plus
  | "no_dive"    // ne se jette pas
  | "double";    // double le porteur

export type Effect = { kind: EffectKind; dx: number; dy: number; mag: number; until: number };

export type Player = {
  id: number; side: Side; num: number; name: string; role: Role;
  pos: Vec; vel: Vec; anchor: Vec;
  attrs: Attrs; fatigue: number; morale: number;
  effects: Effect[]; intent: string | null; intentUntil: number;
  nextThink: number; stunnedUntil: number; distRun: number;
};

export type Focus = "libre" | "axe" | "ailes" | "gauche" | "droite";
export type Tactics = {
  line: number; width: number; compact: number; press: number;
  tempo: number; risk: number; long: number; gkShort: boolean; focus: Focus;
};

export type TeamState = {
  side: Side; name: string; short: string; color: string; dark: string;
  tactics: Tactics; cohesion: number; pressLoad: number;
};

export type Ball = {
  pos: Vec; vel: Vec; ownerId: number | null;
  flight: null | { kind: "pass" | "long" | "shot" | "clear"; from: Vec; to: Vec; t0: number; dur: number; by: number; targetId: number | null };
};

export type MatchEvent = { t: number; kind: "but" | "occasion" | "arret" | "info" | "consigne"; text: string };

export type Match = {
  t: number; running: boolean; finished: boolean; halfBreakDone: boolean;
  players: Player[]; ball: Ball;
  score: [number, number];
  stats: { poss: [number, number]; shots: [number, number]; sot: [number, number]; xg: [number, number] };
  home: TeamState; away: TeamState;
  events: MatchEvent[];
  danger: number; lastOppCoach: number; lastTouchSide: Side;
  recentOrders: Array<{ action: string; t: number }>;
  rng: () => number;
};

/* ------------------------------- utilitaires ------------------------------ */

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function teamOf(m: Match, side: Side): TeamState { return side === "home" ? m.home : m.away; }
export function goalOf(side: Side): Vec { return side === "home" ? { x: FIELD.w, y: 34 } : { x: 0, y: 34 }; }
const dirOf = (side: Side) => (side === "home" ? 1 : -1);
export function lineOf(role: Role): "GK" | "DEF" | "MID" | "ATT" {
  if (role === "GK") return "GK";
  if (DEF_ROLES.includes(role)) return "DEF";
  if (MID_ROLES.includes(role)) return "MID";
  return "ATT";
}

/* --------------------------------- effectifs ------------------------------ */

type Sheet = Array<[number, string, Role, Partial<Attrs>]>;

const HOME_SHEET: Sheet = [
  [1, "Maes", "GK", { decision: 0.7 }],
  [2, "Varga", "DD", { pace: 0.72, aggression: 0.6 }],
  [4, "Lemoine", "DC", { discipline: 0.85, intelligence: 0.8 }],
  [5, "Okafor", "DC", { pace: 0.75, aggression: 0.75, discipline: 0.55 }],
  [3, "Mendy", "DG", { pace: 0.8, stamina: 0.8 }],
  [6, "Pereira", "MDC", { vision: 0.75, discipline: 0.85 }],
  [8, "Yamada", "MC", { stamina: 0.85, technique: 0.7 }],
  [10, "Ziani", "MOC", { technique: 0.9, vision: 0.9, intelligence: 0.9, stamina: 0.55 }],
  [7, "Costa", "AD", { pace: 0.88, technique: 0.75, discipline: 0.45 }],
  [11, "Lucas", "AG", { pace: 0.85, technique: 0.8 }],
  [9, "Branco", "BU", { technique: 0.7, decision: 0.8, aggression: 0.7 }],
];

const AWAY_SHEET: Sheet = [
  [1, "Sokolov", "GK", {}],
  [2, "Reinders", "DD", { pace: 0.7 }],
  [4, "Castellani", "DC", { discipline: 0.8, aggression: 0.7 }],
  [5, "Bouras", "DC", { pace: 0.72 }],
  [3, "Vidal", "DG", { stamina: 0.8 }],
  [6, "Krause", "MDC", { discipline: 0.85, aggression: 0.65 }],
  [8, "Eze", "MC", { pace: 0.78, stamina: 0.85 }],
  [10, "Marchetti", "MOC", { technique: 0.85, vision: 0.85 }],
  [7, "Ito", "AD", { pace: 0.9, technique: 0.7 }],
  [11, "Dudek", "AG", { pace: 0.82 }],
  [9, "Grbic", "BU", { technique: 0.65, aggression: 0.8, decision: 0.75 }],
];

const ANCHORS: Record<Role, Vec> = {
  GK: { x: 5, y: 34 },
  DD: { x: 20, y: 57 }, DC: { x: 17, y: 34 }, DG: { x: 20, y: 11 },
  MDC: { x: 33, y: 34 }, MC: { x: 40, y: 22 }, MOC: { x: 44, y: 45 },
  AD: { x: 58, y: 57 }, AG: { x: 58, y: 11 }, BU: { x: 61, y: 34 },
};

function buildPlayers(rng: () => number): Player[] {
  const players: Player[] = [];
  let id = 0;
  let dcSeen = 0;
  for (const side of ["home", "away"] as Side[]) {
    dcSeen = 0;
    const sheet = side === "home" ? HOME_SHEET : AWAY_SHEET;
    for (const [num, name, role, over] of sheet) {
      const base = ANCHORS[role];
      // Deux DC : écarter leurs ancres.
      const dcOffset = role === "DC" ? (dcSeen++ === 0 ? 8 : -8) : 0;
      const anchor: Vec =
        side === "home"
          ? { x: base.x, y: base.y + dcOffset }
          : { x: FIELD.w - base.x, y: FIELD.h - (base.y + dcOffset) };
      const v = () => 0.45 + rng() * 0.3;
      const attrs: Attrs = {
        pace: v(), stamina: v(), technique: v(), vision: v(),
        aggression: v(), discipline: v(), intelligence: v(), decision: v(),
        ...over,
      };
      players.push({
        id: id++, side, num, name, role,
        pos: { ...anchor }, vel: { x: 0, y: 0 }, anchor,
        attrs, fatigue: 0, morale: 65,
        effects: [], intent: null, intentUntil: 0,
        nextThink: 0, stunnedUntil: 0, distRun: 0,
      });
    }
  }
  return players;
}

const DEFAULT_TACTICS: Tactics = {
  line: 0.5, width: 0.5, compact: 0.5, press: 0.45,
  tempo: 0.5, risk: 0.5, long: 0.3, gkShort: true, focus: "libre",
};

export function createMatch(seed = Date.now()): Match {
  pendingShot = null;
  const rng = mulberry(seed);
  const players = buildPlayers(rng);
  const m: Match = {
    t: 0, running: false, finished: false, halfBreakDone: false,
    players,
    ball: { pos: { ...CENTER }, vel: { x: 0, y: 0 }, ownerId: null, flight: null },
    score: [0, 0],
    stats: { poss: [1, 1], shots: [0, 0], sot: [0, 0], xg: [0, 0] },
    home: { side: "home", name: "Atlas FC", short: "ATL", color: "#22d3ee", dark: "#0e7490", tactics: { ...DEFAULT_TACTICS }, cohesion: 82, pressLoad: 0 },
    away: { side: "away", name: "Dynamo Volta", short: "VOL", color: "#fb7185", dark: "#9f1239", tactics: { ...DEFAULT_TACTICS, press: 0.5, long: 0.4 }, cohesion: 84, pressLoad: 0 },
    events: [], danger: 12, lastOppCoach: 0, lastTouchSide: "home",
    recentOrders: [],
    rng,
  };
  kickoff(m, "home");
  return m;
}

function kickoff(m: Match, side: Side): void {
  for (const p of m.players) {
    p.pos = { x: p.anchor.x + (m.rng() - 0.5) * 2, y: p.anchor.y + (m.rng() - 0.5) * 2 };
    p.vel = { x: 0, y: 0 };
    p.stunnedUntil = 0;
  }
  const starter = m.players.find((p) => p.side === side && p.role === "MC") ?? m.players.find((p) => p.side === side && p.role !== "GK")!;
  starter.pos = { ...CENTER };
  m.ball = { pos: { ...CENTER }, vel: { x: 0, y: 0 }, ownerId: starter.id, flight: null };
  m.lastTouchSide = side;
}

/* ------------------------------ positionnement ---------------------------- */

function defLineX(side: Side, t: Tactics): number {
  const raw = 13 + t.line * 24; // 13 m (bloc bas) → 37 m (bloc très haut)
  return side === "home" ? raw : FIELD.w - raw;
}

function lastDefenderX(m: Match, side: Side): number {
  const xs = m.players.filter((p) => p.side === side && lineOf(p.role) === "DEF").map((p) => p.pos.x);
  return side === "home" ? Math.min(...xs) : Math.max(...xs);
}

/** Cible de position d'un joueur sans ballon selon la phase et les consignes. */
function positionTarget(m: Match, p: Player): Vec {
  const team = teamOf(m, p.side);
  const t = team.tactics;
  const dir = dirOf(p.side);
  const weOwn = ballSide(m) === p.side;
  const ln = lineOf(p.role);

  if (ln === "GK") {
    const gx = p.side === "home" ? 4.5 : FIELD.w - 4.5;
    return { x: gx, y: clamp(34 + (m.ball.pos.y - 34) * 0.25, 26, 42) };
  }

  let target: Vec;
  if (weOwn) {
    // Phase offensive : pousser depuis l'ancre, moduler largeur et focus.
    const pushRole = ln === "DEF" ? 0.45 : ln === "MID" ? 0.85 : 1.1;
    const push = (8 + t.line * 9 + t.tempo * 7) * pushRole;
    let y = 34 + (p.anchor.y - 34) * (0.75 + t.width * 0.55);
    if (t.focus === "axe") y = 34 + (y - 34) * 0.6;
    if (t.focus === "ailes" && (p.role === "AD" || p.role === "AG")) y = 34 + (y - 34) * 1.25;
    if (t.focus === "gauche") y -= dir * 7;
    if (t.focus === "droite") y += dir * 7;
    target = { x: p.anchor.x + dir * push, y };
    if (ln === "MID") target.y = lerp(target.y, m.ball.pos.y, 0.15);
  } else {
    // Phase défensive : bloc en lignes, resserré côté ballon.
    const lx = defLineX(p.side, t);
    const depth = ln === "DEF" ? 0 : ln === "MID" ? 11 : 24;
    const x = lx + dir * depth;
    const spread = 1 - t.compact * 0.45;
    let y = 34 + (p.anchor.y - 34) * spread;
    y = lerp(y, m.ball.pos.y, 0.22 + t.compact * 0.16);
    target = { x, y };
  }

  // Consignes individuelles actives.
  for (const e of p.effects) {
    if (e.until < m.t) continue;
    if (e.kind === "shift") { target.x += dir * e.dx * e.mag; target.y += e.dy * e.mag; }
    if (e.kind === "push") target.x += dir * 12 * e.mag;
    if (e.kind === "hold") target.x = lerp(target.x, p.anchor.x, 0.7);
    if (e.kind === "cover") { target.x = lerp(target.x, p.anchor.x, 0.8); target.y = lerp(target.y, 34, 0.4); }
    if (e.kind === "between" && weOwn) {
      const oppDef = lastDefenderX(m, p.side === "home" ? "away" : "home");
      target.x = oppDef - dir * 9;
      target.y = lerp(target.y, 34, 0.5);
    }
    if (e.kind === "depth" && weOwn) {
      const oppDef = lastDefenderX(m, p.side === "home" ? "away" : "home");
      target.x = oppDef + dir * 0.5;
    }
  }

  // Indiscipline + cohésion basse = flou positionnel.
  const noise = ((100 - team.cohesion) / 100) * 5 + (1 - p.attrs.discipline) * 2.5;
  target.x += (m.rng() - 0.5) * noise;
  target.y += (m.rng() - 0.5) * noise;
  target.x = clamp(target.x, 1, FIELD.w - 1);
  target.y = clamp(target.y, 1, FIELD.h - 1);
  return target;
}

function ballSide(m: Match): Side {
  if (m.ball.ownerId !== null) return m.players[m.ball.ownerId].side;
  if (m.ball.flight) return m.players[m.ball.flight.by].side;
  return m.lastTouchSide;
}

/* ------------------------------- déplacements ----------------------------- */

function maxSpeed(p: Player, sprinting: boolean): number {
  const base = 4.4 + p.attrs.pace * 3.4;
  const fat = 1 - 0.5 * (p.fatigue / 100);
  return base * fat * (sprinting ? 1 : 0.62);
}

function moveToward(p: Player, target: Vec, dt: number, sprinting: boolean): void {
  const d = dist(p.pos, target);
  if (d < 0.3) { p.vel.x *= 0.8; p.vel.y *= 0.8; return; }
  const sp = Math.min(maxSpeed(p, sprinting), d / dt);
  p.vel.x = ((target.x - p.pos.x) / d) * sp;
  p.vel.y = ((target.y - p.pos.y) / d) * sp;
  p.pos.x = clamp(p.pos.x + p.vel.x * dt, 0.5, FIELD.w - 0.5);
  p.pos.y = clamp(p.pos.y + p.vel.y * dt, 0.5, FIELD.h - 0.5);
  p.distRun += sp * dt;
  p.fatigue = clamp(p.fatigue + sp * dt * (sprinting ? 0.016 : 0.007) * (1.35 - p.attrs.stamina * 0.7), 0, 100);
}

/* ----------------------------- décisions porteur --------------------------- */

function pressureOn(m: Match, p: Player): number {
  let best = 99;
  for (const o of m.players) if (o.side !== p.side && o.role !== "GK") best = Math.min(best, dist(o.pos, p.pos));
  return best;
}

function shotXg(p: Player, goal: Vec): number {
  const d = dist(p.pos, goal);
  const ang = Math.atan2(3.66, Math.max(d, 1)); // demi-ouverture du but
  return clamp((1 / (1 + (d / 11) ** 2)) * (0.4 + ang * 1.4), 0.01, 0.62);
}

function decideOwner(m: Match, p: Player): void {
  const team = teamOf(m, p.side);
  const t = team.tactics;
  const dir = dirOf(p.side);
  const goal = goalOf(p.side);
  const press = pressureOn(m, p);
  const mates = m.players.filter((x) => x.side === p.side && x.id !== p.id);

  // Gardien : relance selon la consigne.
  if (p.role === "GK") {
    const shortMates = mates.filter((x) => lineOf(x.role) === "DEF");
    if (t.gkShort && press > 6 && shortMates.length) {
      const target = shortMates[Math.floor(m.rng() * shortMates.length)];
      launchPass(m, p, target, "pass");
    } else {
      const longs = mates.filter((x) => lineOf(x.role) === "ATT");
      const target = longs[Math.floor(m.rng() * longs.length)] ?? mates[0];
      launchPass(m, p, target, "long");
    }
    return;
  }

  type Option = { score: number; run: () => void };
  const options: Option[] = [];

  // Tir.
  const xg = shotXg(p, goal);
  const dGoal = dist(p.pos, goal);
  if (dGoal < 27) {
    options.push({
      score: xg * (2.4 + t.risk * 1.6) + (press < 2.5 ? -0.15 : 0) + p.attrs.decision * 0.2,
      run: () => shoot(m, p, xg),
    });
  }

  // Passes : ouverture, progression, risque de ligne de passe.
  for (const mate of mates) {
    if (mate.role === "GK" && press > 3) continue;
    const d = dist(p.pos, mate.pos);
    if (d < 3 || d > 55) continue;
    let openness = 99;
    let laneRisk = 0;
    for (const o of m.players) {
      if (o.side === p.side) continue;
      openness = Math.min(openness, dist(o.pos, mate.pos));
      // distance de l'adversaire au segment de passe
      const vx = mate.pos.x - p.pos.x, vy = mate.pos.y - p.pos.y;
      const wx = o.pos.x - p.pos.x, wy = o.pos.y - p.pos.y;
      const k = clamp((vx * wx + vy * wy) / (vx * vx + vy * vy || 1), 0, 1);
      const dl = Math.hypot(wx - k * vx, wy - k * vy);
      if (dl < 3.5) laneRisk += (3.5 - dl) * 0.5;
    }
    const progress = dir * (mate.pos.x - p.pos.x);
    let bonus = 0;
    if (t.focus === "ailes" && Math.abs(mate.pos.y - 34) > 20) bonus += 1.2;
    if (t.focus === "axe" && Math.abs(mate.pos.y - 34) < 12) bonus += 1;
    if (t.focus === "gauche" && (dir > 0 ? mate.pos.y < 26 : mate.pos.y > 42)) bonus += 1.2;
    if (t.focus === "droite" && (dir > 0 ? mate.pos.y > 42 : mate.pos.y < 26)) bonus += 1.2;
    if (mate.effects.some((e) => e.kind === "depth" && e.until > m.t)) bonus += 1.6;
    const isLong = d > 30;
    const longMod = isLong ? (t.long - 0.45) * 3 : 0;
    const score =
      progress * 0.075 * (0.65 + t.tempo * 0.8) +
      Math.min(openness, 12) * 0.16 -
      laneRisk * 0.55 -
      Math.abs(d - 16) * 0.02 +
      bonus * 0.35 + longMod +
      p.attrs.vision * 0.4 + (m.rng() - 0.5) * (1.1 - p.attrs.decision);
    options.push({ score, run: () => launchPass(m, p, mate, isLong ? "long" : "pass") });
  }

  // Dribble vers l'avant.
  options.push({
    score: (press / 8) * -0.4 + p.attrs.technique * 1.1 + t.risk * 0.4 - p.fatigue / 130 + 0.55,
    run: () => {
      const ty = clamp(p.pos.y + (m.rng() - 0.5) * 14, 4, 64);
      moveToward(p, { x: clamp(p.pos.x + dir * 9, 2, FIELD.w - 2), y: ty }, 0.001, false);
      p.intent = "porte";
    },
  });

  // Dégagement sous pression dans sa moitié.
  const inOwnThird = dir > 0 ? p.pos.x < 35 : p.pos.x > 70;
  if (press < 2.2 && inOwnThird) {
    options.push({ score: 2.2 + (1 - t.risk), run: () => clearBall(m, p) });
  }

  // Temporisation : tempo bas → garder, recycler vers l'arrière.
  if (t.tempo < 0.35 && press > 4) {
    const back = mates.filter((x) => dir * (x.pos.x - p.pos.x) < -3 && x.role !== "GK");
    if (back.length) {
      options.push({ score: 1.6, run: () => launchPass(m, p, back[Math.floor(m.rng() * back.length)], "pass") });
    }
  }

  options.sort((a, b) => b.score - a.score);
  options[0]?.run();
}

function launchPass(m: Match, from: Player, to: Player, kind: "pass" | "long"): void {
  const press = pressureOn(m, from);
  const errP = 0.05 + (kind === "long" ? 0.1 : 0) + Math.max(0, (3.5 - press)) * 0.05 + from.fatigue / 350 - from.attrs.technique * 0.08;
  const target: Vec = { x: to.pos.x + to.vel.x * 0.5, y: to.pos.y + to.vel.y * 0.5 };
  if (m.rng() < clamp(errP, 0.02, 0.45)) {
    target.x += (m.rng() - 0.5) * 14;
    target.y += (m.rng() - 0.5) * 14;
  }
  target.x = clamp(target.x, 1, FIELD.w - 1);
  target.y = clamp(target.y, 1, FIELD.h - 1);
  const speed = kind === "long" ? 24 : 17;
  const d = dist(from.pos, target);
  m.ball.ownerId = null;
  m.ball.flight = { kind, from: { ...from.pos }, to: target, t0: m.t, dur: Math.max(d / speed, 0.25), by: from.id, targetId: to.id };
  m.lastTouchSide = from.side;
}

function clearBall(m: Match, p: Player): void {
  const dir = dirOf(p.side);
  const target: Vec = { x: clamp(p.pos.x + dir * 38, 2, FIELD.w - 2), y: clamp(p.pos.y + (m.rng() - 0.5) * 30, 2, FIELD.h - 2) };
  m.ball.ownerId = null;
  m.ball.flight = { kind: "clear", from: { ...p.pos }, to: target, t0: m.t, dur: dist(p.pos, target) / 22, by: p.id, targetId: null };
  m.lastTouchSide = p.side;
}

function shoot(m: Match, p: Player, xg: number): void {
  const goal = goalOf(p.side);
  const si = p.side === "home" ? 0 : 1;
  m.stats.shots[si]++;
  m.stats.xg[si] = Math.round((m.stats.xg[si] + xg) * 100) / 100;
  const gk = m.players.find((x) => x.side !== p.side && x.role === "GK")!;
  const onTarget = m.rng() < 0.42 + p.attrs.technique * 0.3 - p.fatigue / 400;
  const goalP = xg * (1.15 + p.attrs.technique * 0.4) * (1 - 0.25 * (1 - xg));
  const isGoal = onTarget && m.rng() < goalP;
  const ty = isGoal ? 34 + (m.rng() - 0.5) * 6 : onTarget ? 34 + (m.rng() - 0.5) * 6 : 34 + (m.rng() < 0.5 ? -1 : 1) * (5 + m.rng() * 6);
  m.ball.ownerId = null;
  m.ball.flight = { kind: "shot", from: { ...p.pos }, to: { x: goal.x, y: ty }, t0: m.t, dur: dist(p.pos, goal) / 28, by: p.id, targetId: null };
  m.lastTouchSide = p.side;
  // Résolution préparée : stockée sur la trajectoire via champs implicites.
  pendingShot = { isGoal, onTarget, shooter: p.id, xg, gkId: gk.id };
}

let pendingShot: { isGoal: boolean; onTarget: boolean; shooter: number; xg: number; gkId: number } | null = null;

/* --------------------------------- défense -------------------------------- */

function tryTackles(m: Match, dt: number): void {
  const owner = m.ball.ownerId !== null ? m.players[m.ball.ownerId] : null;
  if (!owner) return;
  for (const p of m.players) {
    if (p.side === owner.side || p.role === "GK" || p.stunnedUntil > m.t) continue;
    if (dist(p.pos, owner.pos) > 1.5) continue;
    const noDive = p.effects.some((e) => e.kind === "no_dive" && e.until > m.t);
    const attemptP = (noDive ? 0.25 : 0.85) * dt * 2.2;
    if (m.rng() > attemptP) continue;
    const success = 0.3 + p.attrs.aggression * 0.22 - owner.attrs.technique * 0.2 - p.fatigue / 350 + (noDive ? 0.08 : 0);
    if (m.rng() < clamp(success, 0.08, 0.75)) {
      m.ball.ownerId = p.id;
      m.ball.flight = null;
      m.lastTouchSide = p.side;
      p.morale = clamp(p.morale + 4, 0, 100);
      owner.morale = clamp(owner.morale - 3, 0, 100);
      p.nextThink = m.t + 0.25;
    } else if (!noDive) {
      p.stunnedUntil = m.t + 1.1; // battu sur l'engagement
    }
  }
}

/* ------------------------------- consignes -------------------------------- */

export type OrderTargetKind = "player" | "line" | "team" | "gk";
export type ParsedOrder = {
  raw: string;
  targetKind: OrderTargetKind;
  num?: number; name?: string; roleHint?: Role;
  line?: "DEF" | "MID" | "ATT";
  action: string;
  dir?: "gauche" | "droite";
  clarity: number;
};

export type Feedback = { level: "ok" | "partial" | "confused" | "tired" | "none"; text: string; nums: number[] };

const CONTRADICTIONS: Array<[string, string]> = [
  ["press_high", "block_low"], ["accelerate", "calm"], ["push_up", "drop"],
  ["widen", "narrow"], ["long_ball", "short_pass"], ["wings", "axis"],
];

export function applyOrder(m: Match, o: ParsedOrder): Feedback {
  const team = m.home;
  const t = team.tactics;
  const now = m.t;
  const TTL = 75 + 45 * o.clarity;

  // Cibles.
  let targets: Player[] = [];
  const homies = m.players.filter((p) => p.side === "home");
  if (o.targetKind === "gk") targets = homies.filter((p) => p.role === "GK");
  else if (o.targetKind === "player") {
    targets = homies.filter(
      (p) =>
        (o.num !== undefined && p.num === o.num) ||
        (o.name !== undefined && p.name.toLowerCase() === o.name) ||
        (o.roleHint !== undefined && p.role === o.roleHint),
    );
  } else if (o.targetKind === "line") targets = homies.filter((p) => lineOf(p.role) === o.line);
  else targets = homies.filter((p) => p.role !== "GK");

  if (targets.length === 0) return { level: "none", text: "Personne ne se reconnaît dans cette consigne.", nums: [] };

  // Coût en cohésion + contradictions récentes.
  m.recentOrders.push({ action: o.action, t: now });
  m.recentOrders = m.recentOrders.filter((r) => now - r.t < 90);
  let contradiction = false;
  for (const [a, b] of CONTRADICTIONS) {
    const hasA = m.recentOrders.some((r) => r.action === a);
    const hasB = m.recentOrders.some((r) => r.action === b);
    if (hasA && hasB) contradiction = true;
  }
  team.cohesion = clamp(team.cohesion - (o.targetKind === "team" ? 3.5 : 1.5) - (contradiction ? 7 : 0), 20, 95);
  if (m.recentOrders.length > 7) team.cohesion = clamp(team.cohesion - 4, 20, 95);

  // Compréhension : meneur intelligent > latéral cuit à la 80e.
  const lead = targets.reduce((best, p) => (p.attrs.intelligence > best.attrs.intelligence ? p : best), targets[0]);
  const physical = ["press_high", "press_more", "run_depth", "push_up", "accelerate", "double"].includes(o.action);
  if (physical && lead.fatigue > 82) {
    return { level: "tired", text: `${lead.name} n'a plus les jambes pour ça.`, nums: targets.map((p) => p.num) };
  }
  const comp = 0.42 + lead.attrs.intelligence * 0.4 + o.clarity * 0.28 - lead.fatigue / 400 + (team.cohesion - 60) / 250;
  const roll = m.rng();
  const level: Feedback["level"] = roll < comp * 0.78 ? "ok" : roll < comp * 1.25 ? "partial" : "confused";
  const mag = level === "ok" ? 1 : level === "partial" ? 0.5 : 0;
  const until = now + (level === "ok" ? TTL : TTL * 0.5);

  const mark = (p: Player, intent: string, e?: Omit<Effect, "until">) => {
    p.intent = intent;
    p.intentUntil = now + 6;
    if (e && mag > 0) p.effects = [...p.effects.filter((x) => x.kind !== e.kind), { ...e, mag: e.mag * mag, until }];
  };

  const team$ = (fn: () => void, intent: string) => {
    if (mag > 0) fn();
    targets.forEach((p) => mark(p, intent));
  };

  switch (o.action) {
    case "press_high": team$(() => { t.press = clamp(t.press + 0.3 * mag, 0, 1); t.line = clamp(t.line + 0.22 * mag, 0, 1); }, "presse"); break;
    case "press_more": team$(() => { t.press = clamp(t.press + 0.25 * mag, 0, 1); }, "presse"); break;
    case "block_low": team$(() => { t.line = 0.16; t.press = clamp(t.press - 0.2, 0, 1); }, "bloc bas"); break;
    case "block_mid": team$(() => { t.line = 0.48; }, "bloc médian"); break;
    case "block_high": team$(() => { t.line = 0.85; }, "bloc haut"); break;
    case "push_up": targets.forEach((p) => mark(p, "monte", { kind: "push", dx: 0, dy: 0, mag: 1 })); if (o.targetKind === "team" || o.line === "DEF") t.line = clamp(t.line + 0.2 * mag, 0, 1); break;
    case "drop": targets.forEach((p) => mark(p, "recule", { kind: "hold", dx: 0, dy: 0, mag: 1 })); if (o.targetKind === "team" || o.line === "DEF") t.line = clamp(t.line - 0.22 * mag, 0, 1); break;
    case "widen": team$(() => { t.width = clamp(t.width + 0.3 * mag, 0, 1); }, "écarte"); break;
    case "narrow": team$(() => { t.width = clamp(t.width - 0.25 * mag, 0, 1); t.compact = clamp(t.compact + 0.25 * mag, 0, 1); }, "resserre"); break;
    case "compact": team$(() => { t.compact = clamp(t.compact + 0.3 * mag, 0, 1); }, "compact"); break;
    case "wings": team$(() => { t.focus = "ailes"; }, "par les ailes"); break;
    case "axis": team$(() => { t.focus = "axe"; t.compact = clamp(t.compact + 0.15, 0, 1); }, "ferme l'axe"); break;
    case "calm": team$(() => { t.tempo = clamp(t.tempo - 0.3 * mag, 0, 1); t.risk = clamp(t.risk - 0.2 * mag, 0, 1); }, "temporise"); break;
    case "accelerate": team$(() => { t.tempo = clamp(t.tempo + 0.3 * mag, 0, 1); t.risk = clamp(t.risk + 0.15 * mag, 0, 1); }, "accélère"); break;
    case "long_ball": team$(() => { t.long = clamp(t.long + 0.4 * mag, 0, 1); }, "jeu long"); break;
    case "short_pass": team$(() => { t.long = clamp(t.long - 0.35 * mag, 0, 1); }, "jeu court"); break;
    case "drop_between": targets.forEach((p) => mark(p, "entre les lignes", { kind: "between", dx: 0, dy: 0, mag: 1 })); break;
    case "run_depth": targets.forEach((p) => mark(p, "profondeur", { kind: "depth", dx: 0, dy: 0, mag: 1 })); break;
    case "cover": targets.forEach((p) => mark(p, "couverture", { kind: "cover", dx: 0, dy: 0, mag: 1 })); break;
    case "double": team$(() => { /* géré par le pressing : un chasseur de plus */ }, "double le porteur"); targets.forEach((p) => mark(p, "double", { kind: "double", dx: 0, dy: 0, mag: 1 })); break;
    case "no_dive": targets.forEach((p) => mark(p, "reste debout", { kind: "no_dive", dx: 0, dy: 0, mag: 1 })); break;
    case "gk_short": team$(() => { t.gkShort = true; }, "relance courte"); break;
    case "gk_long": team$(() => { t.gkShort = false; t.long = clamp(t.long + 0.2, 0, 1); }, "relance longue"); break;
    case "move_side": {
      const dy = o.dir === "gauche" ? -14 : 14; // côté gauche écran = y faible
      targets.forEach((p) => mark(p, `va à ${o.dir}`, { kind: "shift", dx: 0, dy, mag: 1 }));
      break;
    }
    case "switch_side": team$(() => { t.focus = m.rng() < 0.5 ? "gauche" : "droite"; }, "renverse"); break;
    default:
      return { level: "confused", text: "Le banc n'a pas compris la consigne.", nums: [] };
  }

  const who =
    o.targetKind === "team" ? "L'équipe" :
    o.targetKind === "gk" ? targets[0].name :
    o.targetKind === "line" ? (o.line === "DEF" ? "La défense" : o.line === "MID" ? "Le milieu" : "L'attaque") :
    targets.map((p) => p.name).join(", ");
  const text =
    level === "ok" ? `${who} : consigne comprise.` :
    level === "partial" ? `${who} acquiesce… à moitié convaincu.` :
    `${who} échange des regards : consigne confuse.`;
  if (contradiction) m.events.push({ t: now, kind: "info", text: "Consignes contradictoires : la cohésion en prend un coup." });
  m.events.push({ t: now, kind: "consigne", text: `🎙 « ${o.raw} » → ${text}` });
  return { level, text: contradiction ? `${text} (contradiction récente !)` : text, nums: targets.map((p) => p.num) };
}

/* ------------------------------ coach adverse ------------------------------ */

function oppCoach(m: Match): void {
  if (m.t - m.lastOppCoach < 300) return;
  m.lastOppCoach = m.t;
  const t = m.away.tactics;
  const diff = m.score[1] - m.score[0];
  if (diff < 0) { t.line = clamp(t.line + 0.15, 0, 1); t.press = clamp(t.press + 0.15, 0, 1); t.tempo = clamp(t.tempo + 0.15, 0, 1); }
  if (diff > 0 && m.t > 3900) { t.line = 0.2; t.press = 0.3; t.long = 0.7; t.tempo = 0.3; }
  // Punir la ligne haute : profondeur pour les attaquants adverses.
  if (m.home.tactics.line > 0.72) {
    t.long = clamp(t.long + 0.3, 0, 1);
    for (const p of m.players) {
      if (p.side === "away" && lineOf(p.role) === "ATT") {
        p.effects = [...p.effects.filter((e) => e.kind !== "depth"), { kind: "depth", dx: 0, dy: 0, mag: 1, until: m.t + 280 }];
      }
    }
    m.events.push({ t: m.t, kind: "info", text: "Le coach adverse a vu votre ligne haute : ils cherchent la profondeur." });
  }
  if (m.home.pressLoad > 240) {
    t.long = clamp(t.long + 0.25, 0, 1);
    m.events.push({ t: m.t, kind: "info", text: "Ils sautent votre pressing en jouant long." });
  }
}

/* ---------------------------------- step ---------------------------------- */

export function step(m: Match, dt: number): void {
  if (!m.running || m.finished) return;
  m.t += dt;

  // Mi-temps & fin.
  if (!m.halfBreakDone && m.t >= 2700) {
    m.halfBreakDone = true;
    for (const p of m.players) p.fatigue = clamp(p.fatigue - 26, 0, 100);
    m.home.cohesion = clamp(m.home.cohesion + 8, 0, 95);
    m.events.push({ t: m.t, kind: "info", text: "Mi-temps. Les organismes soufflent." });
  }
  if (m.t >= 5400) {
    m.finished = true;
    m.running = false;
    m.events.push({ t: m.t, kind: "info", text: `Coup de sifflet final : ${m.home.short} ${m.score[0]}–${m.score[1]} ${m.away.short}.` });
    return;
  }

  // Charges de pressing & régénérations.
  for (const team of [m.home, m.away]) {
    if (team.tactics.press > 0.7) team.pressLoad += dt; else team.pressLoad = Math.max(0, team.pressLoad - dt * 0.5);
    team.cohesion = clamp(team.cohesion + dt * 0.013, 20, 95);
  }
  if (m.home.pressLoad > 240) {
    for (const p of m.players) if (p.side === "home" && p.role !== "GK") p.fatigue = clamp(p.fatigue + dt * 0.05, 0, 100);
  }

  oppCoach(m);

  // Possession.
  const bs = ballSide(m);
  m.stats.poss[bs === "home" ? 0 : 1] += dt;

  // Danger (menace adverse sur NOTRE but, côté home → but en x=0).
  const threat = bs === "away" && m.ball.pos.x < 42 ? (42 - m.ball.pos.x) / 42 : 0;
  m.danger = clamp(m.danger + (threat * 55 - m.danger) * dt * 0.25, 0, 100);

  // Ballon en vol.
  if (m.ball.flight) {
    const f = m.ball.flight;
    const k = clamp((m.t - f.t0) / f.dur, 0, 1);
    m.ball.pos = { x: lerp(f.from.x, f.to.x, k), y: lerp(f.from.y, f.to.y, k) };
    // Interceptions en cours de vol (passes uniquement).
    if (f.kind !== "shot" && k > 0.15 && k < 0.92) {
      for (const o of m.players) {
        if (o.side === m.players[f.by].side || o.role === "GK") continue;
        if (dist(o.pos, m.ball.pos) < 1.15 && m.rng() < (0.3 + o.attrs.vision * 0.3) * dt * 8) {
          m.ball.flight = null;
          m.ball.ownerId = o.id;
          m.lastTouchSide = o.side;
          o.nextThink = m.t + 0.3;
          m.events.push({ t: m.t, kind: "info", text: `Interception de ${o.name} (${teamOf(m, o.side).short}).` });
          break;
        }
      }
    }
    if (m.ball.flight && k >= 1) resolveFlightArrival(m);
  } else if (m.ball.ownerId !== null) {
    const owner = m.players[m.ball.ownerId];
    m.ball.pos = { x: owner.pos.x + owner.vel.x * 0.09, y: owner.pos.y + owner.vel.y * 0.09 };
    if (m.t >= owner.nextThink) {
      owner.nextThink = m.t + 0.45 * (1.25 - owner.attrs.decision * 0.6);
      decideOwner(m, owner);
    }
  } else {
    // Ballon libre : décélère, le plus rapide s'en empare.
    m.ball.pos.x = clamp(m.ball.pos.x + m.ball.vel.x * dt, 0.5, FIELD.w - 0.5);
    m.ball.pos.y = clamp(m.ball.pos.y + m.ball.vel.y * dt, 0.5, FIELD.h - 0.5);
    m.ball.vel.x *= 1 - dt * 1.6;
    m.ball.vel.y *= 1 - dt * 1.6;
    for (const p of m.players) {
      if (p.stunnedUntil > m.t) continue;
      if (dist(p.pos, m.ball.pos) < 1.1) {
        m.ball.ownerId = p.id;
        m.lastTouchSide = p.side;
        p.nextThink = m.t + 0.3;
        break;
      }
    }
  }

  // Déplacements de tous les joueurs.
  const owner = m.ball.ownerId !== null ? m.players[m.ball.ownerId] : null;
  for (const team of [m.home, m.away]) {
    const defending = bs !== team.side;
    const chasers: Player[] = [];
    if (defending) {
      const doubleUp = m.players.some((p) => p.side === team.side && p.effects.some((e) => e.kind === "double" && e.until > m.t));
      const n = 1 + Math.round(team.tactics.press * 2) + (doubleUp ? 1 : 0);
      chasers.push(
        ...m.players
          .filter((p) => p.side === team.side && p.role !== "GK" && p.stunnedUntil <= m.t)
          .sort((a, b) => dist(a.pos, m.ball.pos) - dist(b.pos, m.ball.pos))
          .slice(0, n),
      );
    }
    for (const p of m.players) {
      if (p.side !== team.side) continue;
      if (p.stunnedUntil > m.t) continue;
      if (owner && p.id === owner.id) {
        // Porteur : avance (le dribble réel est gradué dans decideOwner).
        const dir = dirOf(p.side);
        moveToward(p, { x: clamp(p.pos.x + dir * 6, 2, FIELD.w - 2), y: p.pos.y }, dt, team.tactics.tempo > 0.6);
        continue;
      }
      if (chasers.includes(p)) {
        moveToward(p, m.ball.pos, dt, true);
        continue;
      }
      moveToward(p, positionTarget(m, p), dt, false);
    }
  }

  tryTackles(m, dt);

  // Récupération lente des organismes à l'arrêt (faible).
  for (const p of m.players) p.fatigue = clamp(p.fatigue - dt * 0.004, 0, 100);
}

function resolveFlightArrival(m: Match): void {
  const f = m.ball.flight!;
  m.ball.flight = null;
  const passer = m.players[f.by];

  if (f.kind === "shot" && pendingShot && pendingShot.shooter === f.by) {
    const s = pendingShot;
    pendingShot = null;
    const si = passer.side === "home" ? 0 : 1;
    const gk = m.players[s.gkId];
    if (s.isGoal) {
      m.score[si]++;
      m.stats.sot[si]++;
      for (const p of m.players) p.morale = clamp(p.morale + (p.side === passer.side ? 9 : -8), 0, 100);
      m.events.push({ t: m.t, kind: "but", text: `⚽ BUT ! ${passer.name} (${teamOf(m, passer.side).short}) — ${m.home.short} ${m.score[0]}–${m.score[1]} ${m.away.short}` });
      kickoff(m, passer.side === "home" ? "away" : "home");
      return;
    }
    if (s.onTarget) {
      m.stats.sot[si]++;
      m.events.push({ t: m.t, kind: "arret", text: `🧤 Arrêt de ${gk.name} devant ${passer.name} (xG ${s.xg.toFixed(2)}).` });
      m.ball.ownerId = gk.id;
      m.lastTouchSide = gk.side;
      gk.nextThink = m.t + 1;
      return;
    }
    m.events.push({ t: m.t, kind: "occasion", text: `${passer.name} tente sa chance : à côté (xG ${s.xg.toFixed(2)}).` });
    m.ball.ownerId = m.players.find((p) => p.side !== passer.side && p.role === "GK")!.id;
    m.lastTouchSide = passer.side === "home" ? "away" : "home";
    return;
  }

  // Passe / long / dégagement : contrôle du plus proche.
  const candidates = m.players
    .filter((p) => p.stunnedUntil <= m.t)
    .sort((a, b) => dist(a.pos, m.ball.pos) - dist(b.pos, m.ball.pos));
  const nearest = candidates[0];
  if (nearest && dist(nearest.pos, m.ball.pos) < 3.2) {
    const control = 0.75 + nearest.attrs.technique * 0.2 - (f.kind === "long" ? 0.18 : 0);
    if (m.rng() < control) {
      m.ball.ownerId = nearest.id;
      m.lastTouchSide = nearest.side;
      nearest.nextThink = m.t + 0.3;
      return;
    }
  }
  // Contrôle manqué : ballon libre qui fuit.
  m.ball.ownerId = null;
  m.ball.vel = { x: (m.rng() - 0.5) * 10, y: (m.rng() - 0.5) * 10 };
}

/* ------------------------------ accès pratiques ---------------------------- */

export function possessionPct(m: Match): number {
  return Math.round((m.stats.poss[0] / (m.stats.poss[0] + m.stats.poss[1])) * 100);
}
export function clockLabel(m: Match): string {
  const mins = Math.floor(m.t / 60);
  const secs = Math.floor(m.t % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
export function avgFatigue(m: Match, side: Side): number {
  const ps = m.players.filter((p) => p.side === side && p.role !== "GK");
  return Math.round(ps.reduce((s, p) => s + p.fatigue, 0) / ps.length);
}
export function avgMorale(m: Match, side: Side): number {
  const ps = m.players.filter((p) => p.side === side);
  return Math.round(ps.reduce((s, p) => s + p.morale, 0) / ps.length);
}
