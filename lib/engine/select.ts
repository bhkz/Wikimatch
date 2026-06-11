/**
 * Sélection déterministe des hexes pris (spec §5.6, NORMATIF) + débordement.
 */

import { compareAxial, hexDistance, hexKey, hexNeighbors } from "../hex";
import type { EngineHex, EngineState } from "./types";

export function capitalOf(state: EngineState, nation: string): EngineHex {
  for (const h of state.hexes.values()) {
    if (h.isCapital && h.originalOwner === nation) return h;
  }
  throw new Error(`capitalOf: capitale introuvable pour ${nation}.`);
}

/** Un hex est-il adjacent au territoire (owned) du vainqueur ? */
function isAdjacentToNation(state: EngineState, hex: EngineHex, nation: string, byKey: Map<string, EngineHex>): boolean {
  return hexNeighbors(hex).some((n) => {
    const nb = byKey.get(hexKey(n));
    return nb !== undefined && nb.owner === nation && nb.state === "owned";
  });
}

export function buildKeyIndex(state: EngineState): Map<string, EngineHex> {
  const byKey = new Map<string, EngineHex>();
  for (const h of state.hexes.values()) byKey.set(hexKey(h), h);
  return byKey;
}

/**
 * §5.6 — hexes éligibles du perdant = tous sauf capitale. Tri :
 * 1. distance à la capitale du PERDANT, DÉCROISSANTE (l'empire perd ses marches) ;
 * 2. conquered=true avant hexes d'origine ;
 * 3. adjacents au territoire du vainqueur d'abord ;
 * 4. tie-break final : (q, r) lexicographique croissant.
 */
export function selectHexesFromLoser(
  state: EngineState,
  loser: string,
  winner: string,
  count: number,
): EngineHex[] {
  const byKey = buildKeyIndex(state);
  const loserCapital = capitalOf(state, loser);

  const eligible = [...state.hexes.values()].filter(
    (h) => h.owner === loser && h.state === "owned" && !h.isCapital,
  );

  eligible.sort((a, b) => {
    const dist = hexDistance(b, loserCapital) - hexDistance(a, loserCapital); // décroissante
    if (dist !== 0) return dist;
    const conq = Number(b.conquered) - Number(a.conquered); // conquered d'abord
    if (conq !== 0) return conq;
    const adjA = isAdjacentToNation(state, a, winner, byKey) ? 1 : 0;
    const adjB = isAdjacentToNation(state, b, winner, byKey) ? 1 : 0;
    if (adjA !== adjB) return adjB - adjA; // adjacents d'abord
    return compareAxial(a, b);
  });

  return eligible.slice(0, count);
}

/**
 * Débordement (§5.6 fin) : surplus sur les hexes `ruins` puis `neutral` les
 * plus proches de la capitale du perdant ; s'il n'y a rien, surplus perdu.
 */
export function selectOverflow(state: EngineState, loser: string, count: number): EngineHex[] {
  if (count <= 0) return [];
  const loserCapital = capitalOf(state, loser);

  const pick = (st: "ruins" | "neutral") =>
    [...state.hexes.values()]
      .filter((h) => h.state === st)
      .sort((a, b) => {
        const d = hexDistance(a, loserCapital) - hexDistance(b, loserCapital); // croissante
        return d !== 0 ? d : compareAxial(a, b);
      });

  const pool = [...pick("ruins"), ...pick("neutral")];
  return pool.slice(0, count);
}

/** §5.5 — hex neutre le plus proche d'une capitale (tie-break (q,r)). */
export function nearestNeutral(state: EngineState, nation: string): EngineHex | null {
  const capital = capitalOf(state, nation);
  let best: EngineHex | null = null;
  let bestDist = Infinity;
  for (const h of state.hexes.values()) {
    if (h.state !== "neutral") continue;
    const d = hexDistance(h, capital);
    if (d < bestDist || (d === bestDist && best !== null && compareAxial(h, best) < 0)) {
      best = h;
      bestDist = d;
    }
  }
  return best;
}
