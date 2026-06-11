/**
 * Drama-mètre (spec §9) — composantes pures ; l'orchestration (sims de swing)
 * vit dans le worker. drama = round(100 × Σ poids × composante), borné 0-100.
 * Toutes les formules sont publiques (méthodo).
 */

import { outcomeProbs, type MatchModelConfig } from "./sim/model";
import type { Stage } from "./providers/types";

export type DramaWeights = {
  swing: number; //  0.35 — ce que le match peut changer aux qualifications
  close: number; //  0.25 — équilibre des forces
  elim: number; //   0.20 — risque d'élimination immédiate
  stage: number; //  0.10 — importance du moment
  upset: number; //  0.10 — potentiel d'exploit
};

export type StageWeights = Record<"GJ1" | "GJ2" | "GJ3" | "R32" | "R16" | "QF" | "SF" | "FINAL", number>;

export type DramaComponents = {
  swing: number;
  close: number;
  elim: number;
  stage: number;
  upset: number;
};

/** Équilibre : 1 quand les deux équipes sont à 50/50 (nul exclu). */
export function closeness(eloHome: number, eloAway: number, model: MatchModelConfig): number {
  const { pHome, pAway } = outcomeProbs(eloHome, eloAway, model);
  const total = pHome + pAway;
  if (total === 0) return 1;
  return 1 - Math.abs(pHome - pAway) / total;
}

/** Potentiel d'exploit : proba de l'outsider × ampleur de l'écart Elo. */
export function upsetPotential(eloHome: number, eloAway: number, model: MatchModelConfig): number {
  const { pHome, pAway } = outcomeProbs(eloHome, eloAway, model);
  const pUnderdog = Math.min(pHome, pAway);
  const gapFactor = Math.min(Math.abs(eloHome - eloAway) / 400, 1);
  return pUnderdog * 2 * gapFactor; // ×2 : pUnderdog ≤ 0.5 → composante ∈ [0, ~1]
}

/** Poids du moment : GJ1..GJ3 pour les groupes (journée), sinon le stage. */
export function stageWeight(stage: Stage, matchday: number | null, weights: StageWeights): number {
  if (stage === "GROUP") {
    const key = matchday === 3 ? "GJ3" : matchday === 2 ? "GJ2" : "GJ1";
    return weights[key];
  }
  if (stage === "THIRD") return weights.SF; // même gravité de fin de parcours
  return weights[stage];
}

/** Risque d'élimination immédiate : KO = 1 ; J3 de groupes = 1 ; J2 = 0.5. */
export function elimFlag(stage: Stage, matchday: number | null): number {
  if (stage !== "GROUP") return 1;
  if (matchday === 3) return 1;
  if (matchday === 2) return 0.5;
  return 0;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function composeDrama(components: DramaComponents, weights: DramaWeights): number {
  const score =
    weights.swing * clamp01(components.swing) +
    weights.close * clamp01(components.close) +
    weights.elim * clamp01(components.elim) +
    weights.stage * clamp01(components.stage) +
    weights.upset * clamp01(components.upset);
  return Math.min(100, Math.max(0, Math.round(100 * score)));
}
