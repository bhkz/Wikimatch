/**
 * Simulation Monte-Carlo de la phase de groupes (spec §7).
 * Pur et déterministe à seed fixée. P1.2a : probabilités de qualification
 * (top 2 + 8 meilleurs troisièmes). Les probabilités de parcours KO arrivent
 * quand l'API révèle les appariements réels du tableau (jamais deviner le
 * bracket, spec §21.5).
 */

import { computeStandings, rankThirds, type GroupMatchInput, type StandingRow } from "../standings";
import { DEFAULT_MODEL, sampleScore, type MatchModelConfig } from "./model";
import { mulberry32, type Rng } from "./rng";

export type SimNation = { code: string; group: string; elo: number };

export type SimMatch = {
  id: number;
  group: string;
  home: string;
  away: string;
  /** null = pas encore joué → simulé. */
  scoreHome: number | null;
  scoreAway: number | null;
};

export type NationProbs = {
  p_win_group: number;
  p_top2: number;
  p_third_rescued: number;
  p_qualify: number;
};

export type SimResult = {
  seed: string;
  iterations: number;
  probs: Record<string, NationProbs>;
};

/** Force une issue pour le calcul de swing du drama-mètre (spec §9). */
export type ForcedOutcome = { matchId: number; outcome: "HOME" | "DRAW" | "AWAY" };

function forcedScore(outcome: ForcedOutcome["outcome"]): { scoreHome: number; scoreAway: number } {
  // Score représentatif minimal : 1-0 / 0-0 / 0-1 (seuls points/diff comptent).
  if (outcome === "HOME") return { scoreHome: 1, scoreAway: 0 };
  if (outcome === "AWAY") return { scoreHome: 0, scoreAway: 1 };
  return { scoreHome: 0, scoreAway: 0 };
}

/** Égalités non départageables : ordre aléatoire 50/50 (spec §6.4, §7.3). */
function shuffleUnresolvedTies(rows: StandingRow[], rng: Rng): StandingRow[] {
  const out = [...rows];
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i].unresolvedTie && out[i + 1].unresolvedTie && rng() < 0.5) {
      [out[i], out[i + 1]] = [out[i + 1], out[i]];
    }
  }
  return out;
}

export function simulateGroupStage(
  nations: SimNation[],
  matches: SimMatch[],
  iterations: number,
  seed: string,
  model: MatchModelConfig = DEFAULT_MODEL,
  forced?: ForcedOutcome,
): SimResult {
  const rng = mulberry32(seed);
  const eloByCode = new Map(nations.map((n) => [n.code, n.elo]));
  const groups = [...new Set(nations.map((n) => n.group))].sort();
  const codesByGroup = new Map(groups.map((g) => [g, nations.filter((n) => n.group === g).map((n) => n.code)]));
  const matchesByGroup = new Map(groups.map((g) => [g, matches.filter((m) => m.group === g)]));

  const tally = new Map<string, { winGroup: number; top2: number; third: number; qualify: number }>(
    nations.map((n) => [n.code, { winGroup: 0, top2: 0, third: 0, qualify: 0 }]),
  );

  for (let it = 0; it < iterations; it++) {
    const thirds: StandingRow[] = [];
    const qualifiedDirect: string[] = [];

    for (const g of groups) {
      const played: GroupMatchInput[] = matchesByGroup.get(g)!.map((m) => {
        if (forced && m.id === forced.matchId) {
          const s = forcedScore(forced.outcome);
          return { home: m.home, away: m.away, ...s };
        }
        if (m.scoreHome !== null && m.scoreAway !== null) {
          return { home: m.home, away: m.away, scoreHome: m.scoreHome, scoreAway: m.scoreAway };
        }
        const s = sampleScore(rng, eloByCode.get(m.home) ?? 1400, eloByCode.get(m.away) ?? 1400, model);
        return { home: m.home, away: m.away, ...s };
      });

      const rows = shuffleUnresolvedTies(computeStandings(codesByGroup.get(g)!, played), rng);
      tally.get(rows[0].code)!.winGroup++;
      qualifiedDirect.push(rows[0].code, rows[1].code);
      thirds.push(rows[2]);
    }

    // 8 meilleurs troisièmes (spec §6.2), égalités résiduelles tirées au sort.
    const rankedThirds = shuffleUnresolvedTies(rankThirds(thirds), rng);
    const rescued = rankedThirds.slice(0, 8).map((r) => r.code);

    for (const code of qualifiedDirect) {
      tally.get(code)!.top2++;
      tally.get(code)!.qualify++;
    }
    for (const code of rescued) {
      tally.get(code)!.third++;
      tally.get(code)!.qualify++;
    }
  }

  const probs: Record<string, NationProbs> = {};
  for (const [code, t] of tally) {
    probs[code] = {
      p_win_group: t.winGroup / iterations,
      p_top2: t.top2 / iterations,
      p_third_rescued: t.third / iterations,
      p_qualify: t.qualify / iterations,
    };
  }
  return { seed, iterations, probs };
}
