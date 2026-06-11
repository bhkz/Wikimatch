/**
 * Gain de base (spec §5.3) + surextension impériale (spec §5.4).
 */

import type { Stage } from "../providers/types";
import type { EngineState, GameConfig } from "./types";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** §5.3 — bonus différence de buts : min(max(gd − 1, 0), cap). */
export function baseGain(stage: Stage, goalDiff: number, cfg: GameConfig): number {
  const bonus = Math.min(Math.max(goalDiff - 1, 0), cfg.gainGoaldiffCap);
  switch (stage) {
    case "GROUP":
      return cfg.gainGroup + bonus;
    case "R32":
    case "R16":
      return cfg.gainR32R16 + bonus;
    case "QF":
      return cfg.gainQf + bonus;
    case "SF":
      return cfg.gainSf + bonus;
    case "THIRD":
      return cfg.gainThird; // fixe
    case "FINAL":
      return cfg.gainFinal; // fixe, puis §5.9
  }
}

/** Nombre d'hexes possédés (state='owned') par nation. */
export function territorySize(state: EngineState, nation: string): number {
  let n = 0;
  for (const h of state.hexes.values()) {
    if (h.owner === nation && h.state === "owned") n++;
  }
  return n;
}

/** Territoire médian des nations `alive` AVANT résolution (spec §5.4). */
export function medianAliveTerritory(state: EngineState): number {
  const sizes: number[] = [];
  for (const [code, status] of state.nationStatus) {
    if (status === "alive") sizes.push(territorySize(state, code));
  }
  if (sizes.length === 0) throw new Error("medianAliveTerritory: aucune nation alive.");
  sizes.sort((a, b) => a - b);
  const mid = Math.floor(sizes.length / 2);
  return sizes.length % 2 === 1 ? sizes[mid] : (sizes[mid - 1] + sizes[mid]) / 2;
}

/**
 * §5.4 — final_gain = clamp(round(base × clamp(median_alive/T_winner, min, max)), 1, hardCap).
 * Plancher 1 : toute victoire prend au moins un hex.
 */
export function overextension(
  base: number,
  state: EngineState,
  winner: string,
  cfg: GameConfig,
): { finalGain: number; mOverext: number } {
  const tWinner = territorySize(state, winner);
  if (tWinner <= 0) throw new Error(`overextension: ${winner} sans territoire : état incohérent.`);
  const m = clamp(medianAliveTerritory(state) / tWinner, cfg.overextMin, cfg.overextMax);
  const finalGain = clamp(Math.round(base * m), 1, cfg.hardCap);
  return { finalGain, mOverext: Math.round(m * 100) / 100 };
}
