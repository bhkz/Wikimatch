/**
 * Modèle de match pour les simulations (spec §7.2, constantes §19).
 * Force = points FIFA traités comme un Elo. Modèle assumé simple et PUBLIC
 * (affiché en méthodo) : logistique Elo + nul paramétrique + buts Poisson.
 * Les scores simulés ne servent qu'aux départages (diff/buts).
 */

import { poisson, type Rng } from "./rng";

export type MatchModelConfig = {
  eloDivisor: number; //  600
  drawBase: number; //    0.26
  drawSlope: number; //   0.20
  drawMin: number; //     0.10
  muGoals: number; //     2.6 (total de buts attendu)
};

export const DEFAULT_MODEL: MatchModelConfig = {
  eloDivisor: 600,
  drawBase: 0.26,
  drawSlope: 0.2,
  drawMin: 0.1,
  muGoals: 2.6,
};

export type OutcomeProbs = { pHome: number; pDraw: number; pAway: number };

/** Probabilités d'issue (sans nul : logistique Elo ; nul décroissant avec l'écart). */
export function outcomeProbs(eloHome: number, eloAway: number, cfg: MatchModelConfig): OutcomeProbs {
  const expHome = 1 / (1 + 10 ** (-(eloHome - eloAway) / cfg.eloDivisor));
  const gap = Math.abs(eloHome - eloAway) / cfg.eloDivisor;
  const pDraw = Math.max(cfg.drawMin, cfg.drawBase - cfg.drawSlope * gap);
  return {
    pHome: expHome * (1 - pDraw),
    pDraw,
    pAway: (1 - expHome) * (1 - pDraw),
  };
}

export type SimScore = { scoreHome: number; scoreAway: number };

/** Tire une issue puis un score cohérent avec elle. */
export function sampleScore(rng: Rng, eloHome: number, eloAway: number, cfg: MatchModelConfig): SimScore {
  const { pHome, pDraw } = outcomeProbs(eloHome, eloAway, cfg);
  const roll = rng();
  const half = cfg.muGoals / 2;

  if (roll < pDraw) {
    const g = poisson(rng, half);
    return { scoreHome: g, scoreAway: g };
  }
  const homeWins = roll < pDraw + pHome;
  const winnerGoals = 1 + poisson(rng, half);
  let loserGoals = poisson(rng, half);
  if (loserGoals >= winnerGoals) loserGoals = winnerGoals - 1;
  return homeWins
    ? { scoreHome: winnerGoals, scoreAway: loserGoals }
    : { scoreHome: loserGoals, scoreAway: winnerGoals };
}
