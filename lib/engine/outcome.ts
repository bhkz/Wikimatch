/**
 * Issue d'un match terminé (spec §5.2). Échoue fort sur tout cas incohérent.
 */

import type { NormalizedMatch } from "../providers/types";
import { isKnockout } from "../providers/types";

export type Outcome =
  | { isDraw: false; winner: string; loser: string; goalDiff: number }
  | { isDraw: true };

export function outcome(m: NormalizedMatch): Outcome {
  if (m.status !== "FINISHED") {
    throw new Error(`outcome: match ${m.providerId} non FINISHED (${m.status}).`);
  }
  if (m.scoreHome === null || m.scoreAway === null) {
    throw new Error(`outcome: match ${m.providerId} FINISHED sans score — refus de résoudre.`);
  }

  // Score différent (prolongation incluse) → vainqueur, gd = |Δ|.
  if (m.scoreHome !== m.scoreAway) {
    const homeWins = m.scoreHome > m.scoreAway;
    return {
      isDraw: false,
      winner: homeWins ? m.homeFifa : m.awayFifa,
      loser: homeWins ? m.awayFifa : m.homeFifa,
      goalDiff: Math.abs(m.scoreHome - m.scoreAway),
    };
  }

  // Égalité au score : TAB → vainqueur des TAB, gd = 0.
  if (m.duration === "PENALTY_SHOOTOUT") {
    if (m.pensHome === null || m.pensAway === null || m.pensHome === m.pensAway) {
      throw new Error(`outcome: match ${m.providerId} aux TAB sans détail exploitable — refus de résoudre.`);
    }
    const homeWins = m.pensHome > m.pensAway;
    return {
      isDraw: false,
      winner: homeWins ? m.homeFifa : m.awayFifa,
      loser: homeWins ? m.awayFifa : m.homeFifa,
      goalDiff: 0,
    };
  }

  // Nul : groupes uniquement (spec §5.2/§5.5).
  if (isKnockout(m.stage)) {
    throw new Error(`outcome: match ${m.providerId} nul en phase KO sans TAB — données incohérentes.`);
  }
  return { isDraw: true };
}
