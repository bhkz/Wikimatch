/**
 * Résolution déterministe d'un match terminé (spec §5, §18.1).
 *
 * Fonction PURE sur un EngineState en mémoire : produit la ligne resolution,
 * les hex_events append-only et des logs structurés. Aucune écriture DB ici —
 * le worker enveloppe ce module dans une transaction avec advisory lock.
 * Rejouable : l'état de carte se reconstruit en rejouant les events (§18.4).
 */

import type { NormalizedMatch } from "../providers/types";
import { isKnockout } from "../providers/types";
import { outcome } from "./outcome";
import { baseGain, overextension, territorySize } from "./gain";
import { buildKeyIndex, capitalOf, nearestNeutral, selectHexesFromLoser, selectOverflow } from "./select";
import {
  conquestNarrative,
  drawNarrative,
  eliminationNarrative,
  enclaveNarrative,
  worldConqueredNarrative,
  type NationLabel,
} from "./narrative";
import { hexDistance, hexKey, hexNeighbors, compareAxial } from "../hex";
import {
  ENGINE_VERSION,
  type EngineHex,
  type EngineState,
  type GameConfig,
  type HexEventDraft,
  type ResolveResult,
} from "./types";

export type ResolveInput = {
  matchId: number;
  match: NormalizedMatch;
  labels: ReadonlyMap<string, NationLabel>; // code FIFA → {flag, name_fr}
};

function label(labels: ReadonlyMap<string, NationLabel>, code: string): NationLabel {
  const l = labels.get(code);
  if (!l) throw new Error(`resolve: label manquant pour ${code}.`);
  return l;
}

/** Transfert d'un hex avec event append-only. */
function transfer(
  events: HexEventDraft[],
  hex: EngineHex,
  matchId: number,
  type: HexEventDraft["type"],
  toOwner: string | null,
  toState: EngineHex["state"],
  narrative: string | null = null,
): void {
  events.push({
    hexId: hex.id,
    matchId,
    type,
    fromOwner: hex.owner,
    toOwner,
    fromState: hex.state,
    toState,
    narrative,
  });
  hex.owner = toOwner;
  hex.state = toState;
  if (type === "captured" || type === "inherited" || type === "neutral_claimed") {
    hex.conquered = true;
  }
}

/**
 * Élimination d'une nation (spec §5.8) : capitale → memorial ; si un
 * éliminateur est présent (KO), il hérite de floor(restant × inherit_ratio)
 * via la sélection §5.6 ; le reste devient ruins.
 * `inheritor=null` : pas d'héritier (Grande Fracture, ou vainqueur de THIRD
 * lui-même éliminé après son gain — son tombeur de demi-finale a déjà été
 * servi à la résolution de la demie, spec §21.9).
 */
export function eliminateNation(
  state: EngineState,
  events: HexEventDraft[],
  nation: string,
  inheritor: string | null,
  matchId: number | null,
  cfg: GameConfig,
  narrative: string | null,
): number[] {
  const inherited: number[] = [];
  const capital = capitalOf(state, nation);

  if (inheritor) {
    const remaining = territorySize(state, nation) - 1; // hors capitale
    const toInherit = Math.floor(Math.max(remaining, 0) * cfg.inheritRatio);
    if (toInherit > 0) {
      const hexes = selectHexesFromLoser(state, nation, inheritor, toInherit);
      for (const h of hexes) {
        transfer(events, h, matchId ?? 0, "inherited", inheritor, "owned");
        inherited.push(h.id);
      }
    }
  }

  // Le reste du territoire devient ruins (nom conservé, décor dramatique).
  for (const h of [...state.hexes.values()].sort((a, b) => compareAxial(a, b))) {
    if (h.owner === nation && h.state === "owned" && !h.isCapital) {
      transfer(events, h, matchId ?? 0, "ruined", null, "ruins");
    }
  }

  // Capitale → memorial (intouchable à jamais).
  transfer(events, capital, matchId ?? 0, "memorial", null, "memorial", narrative);
  state.nationStatus.set(nation, "eliminated");
  return inherited;
}

export function resolveMatch(state: EngineState, input: ResolveInput, cfg: GameConfig): ResolveResult {
  const { matchId, match, labels } = input;
  if (state.gameOver) throw new Error("resolve: game_over=true — plus aucune mutation (spec §21.16).");

  const events: HexEventDraft[] = [];
  const logs: ResolveResult["logs"] = [];
  const o = outcome(match);

  // --- Match nul (groupes uniquement, spec §5.5) ----------------------------
  if (o.isDraw) {
    const taken: number[] = [];
    let homeCity: string | null = null;
    let awayCity: string | null = null;
    for (const side of [match.homeFifa, match.awayFifa]) {
      const hex = nearestNeutral(state, side);
      if (!hex) {
        logs.push({ code: "draw_no_neutral", detail: { nation: side, matchId } });
        continue;
      }
      transfer(events, hex, matchId, "neutral_claimed", side, "owned");
      taken.push(hex.id);
      if (side === match.homeFifa) homeCity = hex.cityName;
      else awayCity = hex.cityName;
    }
    const narrative = drawNarrative(
      label(labels, match.homeFifa), homeCity,
      label(labels, match.awayFifa), awayCity,
    );
    return {
      resolution: {
        matchId,
        winner: null,
        loser: null,
        isDraw: true,
        goalDiff: 0,
        baseGain: 0,
        mOverext: 0,
        finalGain: 0,
        hexesTaken: taken,
        inheritedHexes: [],
        narrative,
        engineVersion: ENGINE_VERSION,
      },
      events,
      logs,
    };
  }

  // --- Victoire : gain de base × surextension (spec §5.3–5.4) --------------
  const { winner, loser, goalDiff } = o;
  const base = baseGain(match.stage, goalDiff, cfg);
  const { finalGain, mOverext } = overextension(base, state, winner, cfg);

  // Sélection §5.6 + débordement.
  const fromLoser = selectHexesFromLoser(state, loser, winner, finalGain);
  const overflow = selectOverflow(state, loser, finalGain - fromLoser.length);
  if (fromLoser.length + overflow.length < finalGain) {
    logs.push({
      code: "gain_truncated",
      detail: { matchId, wanted: finalGain, got: fromLoser.length + overflow.length },
    });
  }

  // Variante enclave : aucun hex pris (au perdant) adjacent au territoire du
  // vainqueur — évaluée AVANT transfert (spec §5.7).
  const byKey = buildKeyIndex(state);
  const anyAdjacent = fromLoser.some((h) =>
    hexNeighbors(h).some((n) => {
      const nb = byKey.get(hexKey(n));
      return nb !== undefined && nb.owner === winner && nb.state === "owned";
    }),
  );

  const taken: number[] = [];
  const takenCities: string[] = [];
  for (const h of [...fromLoser, ...overflow]) {
    transfer(events, h, matchId, "captured", winner, "owned");
    taken.push(h.id);
    takenCities.push(h.cityName);
  }

  const winnerLabel = label(labels, winner);
  const loserLabel = label(labels, loser);
  let narrative =
    !anyAdjacent && fromLoser.length > 0
      ? enclaveNarrative(winnerLabel, fromLoser[0].cityName)
      : conquestNarrative(winnerLabel, loserLabel, taken.length, takenCities);

  // --- Élimination & héritage (spec §5.8, §21.9) ----------------------------
  const inherited: number[] = [];
  if (isKnockout(match.stage)) {
    if (match.stage === "SF") {
      // Différé : les perdants de demies tombent à la résolution du THIRD.
    } else if (match.stage === "THIRD") {
      // Le vainqueur de THIRD a d'abord son gain de 3, puis les deux passent
      // eliminated : le perdant lègue la moitié au vainqueur, le vainqueur
      // tombe sans héritier (son tombeur de demie a déjà été servi).
      inherited.push(
        ...eliminateNation(state, events, loser, winner, matchId, cfg,
          eliminationNarrative(winnerLabel, loserLabel, 0)),
      );
      eliminateNation(state, events, winner, null, matchId, cfg,
        eliminationNarrative(winnerLabel, winnerLabel, 0));
    } else {
      // R32 / R16 / QF / FINAL : le perdant tombe, le vainqueur hérite.
      inherited.push(
        ...eliminateNation(state, events, loser, winner, matchId, cfg,
          eliminationNarrative(winnerLabel, loserLabel, 0)),
      );
    }
  }

  // --- Champion (spec §5.9) --------------------------------------------------
  if (match.stage === "FINAL") {
    state.nationStatus.set(winner, "champion");
    narrative = `${narrative} · ${worldConqueredNarrative(winnerLabel)}`;
    const championCapital = capitalOf(state, winner);
    const wave = [...state.hexes.values()]
      .filter((h) => h.state === "ruins" || h.state === "neutral")
      .sort((a, b) => {
        const d = hexDistance(a, championCapital) - hexDistance(b, championCapital); // croissante
        return d !== 0 ? d : compareAxial(a, b);
      });
    for (const h of wave) {
      transfer(events, h, matchId, "world_conquered", winner, "owned");
    }
    state.gameOver = true;
  }

  return {
    resolution: {
      matchId,
      winner,
      loser,
      isDraw: false,
      goalDiff,
      baseGain: base,
      mOverext,
      finalGain,
      hexesTaken: taken,
      inheritedHexes: inherited,
      narrative,
      engineVersion: ENGINE_VERSION,
    },
    events,
    logs,
  };
}
