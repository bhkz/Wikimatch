/**
 * Classements de groupes (spec §6) — module pur, partagé front / worker / sim.
 * Départage : points → diff → buts marqués → confrontation directe (mini-
 * classement) → au-delà : non simulable, marqué `unresolvedTie` (affiché
 * "départage non décidé" dans l'UI ; tirage 50/50 dans les simulations).
 */

export type GroupMatchInput = {
  home: string;
  away: string;
  scoreHome: number;
  scoreAway: number;
};

export type StandingRow = {
  code: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  /** Égalité parfaite non départageable avec la ligne suivante. */
  unresolvedTie: boolean;
};

function emptyRow(code: string): StandingRow {
  return { code, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, unresolvedTie: false };
}

function accumulate(rows: Map<string, StandingRow>, m: GroupMatchInput): void {
  const h = rows.get(m.home)!;
  const a = rows.get(m.away)!;
  h.played++; a.played++;
  h.gf += m.scoreHome; h.ga += m.scoreAway;
  a.gf += m.scoreAway; a.ga += m.scoreHome;
  if (m.scoreHome > m.scoreAway) { h.won++; a.lost++; h.points += 3; }
  else if (m.scoreHome < m.scoreAway) { a.won++; h.lost++; a.points += 3; }
  else { h.drawn++; a.drawn++; h.points++; a.points++; }
  h.gd = h.gf - h.ga;
  a.gd = a.gf - a.ga;
}

function compareBasic(a: StandingRow, b: StandingRow): number {
  if (a.points !== b.points) return b.points - a.points;
  if (a.gd !== b.gd) return b.gd - a.gd;
  if (a.gf !== b.gf) return b.gf - a.gf;
  return 0;
}

/**
 * Classement d'un groupe. Les égalités après points/diff/buts sont rejouées
 * en mini-classement (confrontations directes), récursivement sur le sous-
 * ensemble. Égalité parfaite résiduelle → ordre alphabétique + unresolvedTie.
 */
export function computeStandings(codes: string[], matches: GroupMatchInput[]): StandingRow[] {
  const rows = new Map(codes.map((c) => [c, emptyRow(c)]));
  for (const m of matches) {
    if (!rows.has(m.home) || !rows.has(m.away)) continue;
    accumulate(rows, m);
  }
  return sortGroup([...rows.values()], matches);
}

function sortGroup(rows: StandingRow[], matches: GroupMatchInput[]): StandingRow[] {
  const sorted = [...rows].sort((a, b) => compareBasic(a, b) || a.code.localeCompare(b.code));

  // Blocs d'égalité au tri de base → confrontation directe.
  const result: StandingRow[] = [];
  let i = 0;
  while (i < sorted.length) {
    const block = [sorted[i]];
    while (i + block.length < sorted.length && compareBasic(sorted[i], sorted[i + block.length]) === 0) {
      block.push(sorted[i + block.length]);
    }
    if (block.length > 1) {
      result.push(...breakTie(block, matches));
    } else {
      result.push(block[0]);
    }
    i += block.length;
  }
  return result;
}

function breakTie(block: StandingRow[], matches: GroupMatchInput[]): StandingRow[] {
  const codes = new Set(block.map((r) => r.code));
  const h2h = matches.filter((m) => codes.has(m.home) && codes.has(m.away));
  if (h2h.length > 0) {
    const sub = new Map([...codes].map((c) => [c, emptyRow(c)]));
    for (const m of h2h) accumulate(sub, m);
    const subSorted = [...sub.values()].sort((a, b) => compareBasic(a, b) || a.code.localeCompare(b.code));
    // Si la confrontation directe sépare au moins partiellement : appliquer cet ordre.
    const separates = subSorted.some((r, idx) => idx > 0 && compareBasic(subSorted[idx - 1], r) !== 0);
    if (separates) {
      const order = new Map(subSorted.map((r, idx) => [r.code, idx]));
      const reordered = [...block].sort((a, b) => order.get(a.code)! - order.get(b.code)!);
      // Marquage des sous-égalités restantes.
      for (let i = 1; i < reordered.length; i++) {
        const prev = subSorted[i - 1];
        const cur = subSorted[i];
        if (compareBasic(prev, cur) === 0) reordered[i - 1].unresolvedTie = reordered[i].unresolvedTie = true;
      }
      return reordered;
    }
  }
  // Égalité parfaite : ordre alphabétique, marquée non départagée (spec §6.4).
  for (const r of block) r.unresolvedTie = true;
  return block;
}

/**
 * Meilleurs troisièmes (spec §6.2) : 8 qualifiés parmi les 12 troisièmes.
 * Tri : points → diff → buts ; égalité résiduelle marquée.
 */
export function rankThirds(thirds: StandingRow[]): StandingRow[] {
  return [...thirds].sort((a, b) => compareBasic(a, b) || a.code.localeCompare(b.code));
}
