/**
 * Replay des hex_events (spec §10, §18.4) — filet de sécurité n°1 du produit.
 * L'état de carte DOIT être reconstructible à l'identique en rejouant les
 * events ordonnés par id. Utilisé par rebuild-map (CI + /admin) et les frames.
 */

import type { EngineHex, EngineState, HexEventDraft, HexState, NationStatus } from "./types";

/** Hex de map-generated.json (carte de départ figée, jamais régénérée). */
export type GeneratedHex = {
  id: number;
  q: number;
  r: number;
  city_name: string;
  is_capital: boolean;
  original_owner: string | null;
};

/** État initial : hexes nationaux owned, interstices neutral, tout le monde alive. */
export function initialState(generated: GeneratedHex[], nationCodes: string[]): EngineState {
  const hexes = new Map<number, EngineHex>();
  for (const g of generated) {
    hexes.set(g.id, {
      id: g.id,
      q: g.q,
      r: g.r,
      cityName: g.city_name,
      isCapital: g.is_capital,
      originalOwner: g.original_owner,
      owner: g.original_owner,
      state: g.original_owner === null ? "neutral" : "owned",
      conquered: false,
    });
  }
  const nationStatus = new Map<string, NationStatus>();
  for (const code of nationCodes) nationStatus.set(code, "alive");
  return { hexes, nationStatus, gameOver: false };
}

/** Applique un event sur l'état (déterministe, sans validation métier). */
export function applyEvent(state: EngineState, ev: HexEventDraft): void {
  const hex = state.hexes.get(ev.hexId);
  if (!hex) throw new Error(`applyEvent: hex ${ev.hexId} inconnu.`);
  hex.owner = ev.toOwner;
  hex.state = ev.toState;
  if (ev.type === "captured" || ev.type === "inherited" || ev.type === "neutral_claimed") {
    hex.conquered = true;
  }
  if (ev.type === "memorial" && ev.fromOwner) {
    state.nationStatus.set(ev.fromOwner, "eliminated");
  }
  if (ev.type === "world_conquered" && ev.toOwner) {
    state.nationStatus.set(ev.toOwner, "champion");
    state.gameOver = true;
  }
}

export function replay(generated: GeneratedHex[], nationCodes: string[], events: HexEventDraft[]): EngineState {
  const state = initialState(generated, nationCodes);
  for (const ev of events) applyEvent(state, ev);
  return state;
}

/** Diff entre deux états (pour rebuild-map : diff vide exigé). */
export function diffStates(a: EngineState, b: EngineState): string[] {
  const diffs: string[] = [];
  const keys: Array<keyof Pick<EngineHex, "owner" | "state" | "conquered">> = ["owner", "state", "conquered"];
  for (const [id, ha] of a.hexes) {
    const hb = b.hexes.get(id);
    if (!hb) {
      diffs.push(`hex ${id} absent du second état`);
      continue;
    }
    for (const k of keys) {
      if (ha[k] !== hb[k]) diffs.push(`hex ${id}.${k}: ${String(ha[k])} ≠ ${String(hb[k])}`);
    }
  }
  for (const id of b.hexes.keys()) {
    if (!a.hexes.has(id)) diffs.push(`hex ${id} absent du premier état`);
  }
  return diffs;
}

/** Frame compacte [{id,owner,state}] (spec §15 snapshots, §17 /api/v1/map). */
export function toFrame(state: EngineState): Array<{ id: number; owner: string | null; state: HexState }> {
  return [...state.hexes.values()]
    .sort((a, b) => a.id - b.id)
    .map((h) => ({ id: h.id, owner: h.owner, state: h.state }));
}
