/**
 * Conditions de qualification en clair (spec §6.5) — module pur.
 *
 * Méthode EXACTE (pas de Monte-Carlo) : énumération exhaustive des issues
 * (V/N/D) des matchs restants du groupe, classement de chaque scénario via
 * lib/standings. Activée quand ≤ 3 matchs restent dans le groupe (27 combos
 * max) — avant, le texte serait illisible et sans intérêt.
 *
 * Statuts :
 * - qualified  : top 2 dans TOUS les scénarios (qualif. directe assurée) ;
 * - eliminated : 4e dans TOUS les scénarios (même le repêchage est exclu) ;
 * - contender  : le reste — accompagné de conditions en TEMPLATES FERMÉS.
 * Une 3e place n'est jamais "qualifiée" (repêchage inter-groupes, spec §6.2).
 */

import { computeStandings, type GroupMatchInput } from "./standings";

export type RemainingMatch = { id: number; home: string; away: string };

export type NationCondition = { text: string; gd_dependent: boolean };

export type NationOutlook = {
  status: "qualified" | "eliminated" | "contender";
  conditions: NationCondition[];
};

type Outcome = "HOME" | "DRAW" | "AWAY";
const OUTCOMES: Outcome[] = ["HOME", "DRAW", "AWAY"];

function scoreOf(o: Outcome): { scoreHome: number; scoreAway: number } {
  return o === "HOME" ? { scoreHome: 1, scoreAway: 0 } : o === "AWAY" ? { scoreHome: 0, scoreAway: 1 } : { scoreHome: 0, scoreAway: 0 };
}

function ownOutcomeLabel(o: Outcome, isHome: boolean): string {
  if (o === "DRAW") return "nul";
  return (o === "HOME") === isHome ? "victoire" : "défaite";
}

export function groupOutlook(
  codes: string[],
  played: GroupMatchInput[],
  remaining: RemainingMatch[],
): Record<string, NationOutlook> {
  const result: Record<string, NationOutlook> = {};

  // Trop de matchs restants : statuts sans conditions détaillées.
  if (remaining.length > 3) {
    for (const code of codes) result[code] = { status: "contender", conditions: [] };
    return result;
  }

  // Énumération des scénarios.
  type Scenario = { outcomes: Outcome[]; ranks: Map<string, number>; tied: Set<string> };
  const scenarios: Scenario[] = [];
  const combos = OUTCOMES.length ** remaining.length;
  for (let c = 0; c < combos; c++) {
    const outcomes: Outcome[] = [];
    let acc = c;
    for (let i = 0; i < remaining.length; i++) {
      outcomes.push(OUTCOMES[acc % 3]);
      acc = Math.floor(acc / 3);
    }
    const full = [
      ...played,
      ...remaining.map((m, i) => ({ home: m.home, away: m.away, ...scoreOf(outcomes[i]) })),
    ];
    const rows = computeStandings(codes, full);
    scenarios.push({
      outcomes,
      ranks: new Map(rows.map((r, idx) => [r.code, idx + 1])),
      tied: new Set(rows.filter((r) => r.unresolvedTie).map((r) => r.code)),
    });
  }

  for (const code of codes) {
    const allRanks = scenarios.map((s) => s.ranks.get(code)!);
    const worst = Math.max(...allRanks);
    const best = Math.min(...allRanks);

    if (worst <= 2) {
      result[code] = { status: "qualified", conditions: [] };
      continue;
    }
    if (best >= 4) {
      result[code] = { status: "eliminated", conditions: [] };
      continue;
    }

    // Conditions par issue de SON match restant (templates fermés).
    const conditions: NationCondition[] = [];
    const ownIdx = remaining.findIndex((m) => m.home === code || m.away === code);
    if (ownIdx >= 0) {
      const isHome = remaining[ownIdx].home === code;
      for (const o of OUTCOMES) {
        const subset = scenarios.filter((s) => s.outcomes[ownIdx] === o);
        const ranks = subset.map((s) => s.ranks.get(code)!);
        const w = Math.max(...ranks);
        const b = Math.min(...ranks);
        const gd = subset.some((s) => s.tied.has(code));
        const label = ownOutcomeLabel(o, isHome);
        if (w <= 2) conditions.push({ text: `Top 2 assuré en cas de ${label}`, gd_dependent: gd });
        else if (b <= 2 && w <= 3) conditions.push({ text: `En cas de ${label} : top 2 possible, au pire 3e (repêchage selon les autres groupes)`, gd_dependent: gd });
        else if (b <= 2) conditions.push({ text: `En cas de ${label} : top 2 possible selon l'autre match`, gd_dependent: gd });
        else if (w <= 3) conditions.push({ text: `En cas de ${label} : au mieux 3e (repêchage selon les autres groupes)`, gd_dependent: gd });
        else if (b <= 3) conditions.push({ text: `En cas de ${label} : 3e possible selon l'autre match, sinon éliminé`, gd_dependent: gd });
        else conditions.push({ text: `Éliminé en cas de ${label}`, gd_dependent: gd });
      }
    } else if (remaining.length > 0) {
      const gd = scenarios.some((s) => s.tied.has(code));
      const matchList = remaining.map((m) => `${m.home}–${m.away}`).join(", ");
      if (best <= 2) conditions.push({ text: `A fini ses matchs : top 2 possible selon ${matchList}`, gd_dependent: gd });
      else conditions.push({ text: `A fini ses matchs : au mieux 3e selon ${matchList} (repêchage selon les autres groupes)`, gd_dependent: gd });
    }
    result[code] = { status: "contender", conditions };
  }
  return result;
}
