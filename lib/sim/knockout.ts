/**
 * Simulation Monte-Carlo de la phase à élimination directe (spec §6.1, §6.3).
 *
 * Activation : UNIQUEMENT quand les 16 affiches des 16es (R32) sont connues
 * (fin des groupes) — on ne devine jamais les appariements (§21.5). L'arbre
 * (quel match nourrit quel match) est inféré de l'ordre chronologique du
 * calendrier officiel seedé, puis VALIDÉ en continu : dès qu'une équipe
 * réelle apparaît dans un tour, elle doit être compatible avec les nourrices
 * prédites, sinon la simulation KO se désactive (alerte, pas de mensonge).
 *
 * Modèle de match KO (§6.2) : pas de nul — issue logistique Elo, et si le
 * tirage donne un nul, "TAB virtuel" Bernoulli(E).
 */

import { DEFAULT_MODEL, outcomeProbs, type MatchModelConfig } from "./model";
import { mulberry32 } from "./rng";

export type KoStage = "R32" | "R16" | "QF" | "SF" | "FINAL";
const KO_ORDER: KoStage[] = ["R32", "R16", "QF", "SF", "FINAL"];
const EXPECTED_COUNTS = [16, 8, 4, 2, 1];

export type KoMatchInput = {
  id: number;
  stage: KoStage;
  home: string | null;
  away: string | null;
  /** Vainqueur réel si le match est FINISHED (TAB inclus), sinon null. */
  winner: string | null;
  kickoffUtc: string;
};

export type KoProbs = {
  p_r16: number;
  p_qf: number;
  p_sf: number;
  p_final: number;
  p_champion: number;
};

export type KoRounds =
  | { ok: true; rounds: KoMatchInput[][] }
  | { ok: false; reason: string };

/**
 * Construit l'arbre du tableau : rounds[i][j] est nourri par
 * rounds[i-1][2j] et rounds[i-1][2j+1] (matchs triés par coup d'envoi).
 */
export function buildKnockoutRounds(matches: KoMatchInput[]): KoRounds {
  const rounds: KoMatchInput[][] = [];
  for (let i = 0; i < KO_ORDER.length; i++) {
    const stage = KO_ORDER[i];
    const list = matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc) || a.id - b.id);
    if (list.length !== EXPECTED_COUNTS[i]) {
      return { ok: false, reason: `${stage}: ${list.length} matchs au lieu de ${EXPECTED_COUNTS[i]}` };
    }
    rounds.push(list);
  }

  // R32 : les 32 équipes doivent être connues et distinctes.
  const r32Teams = rounds[0].flatMap((m) => [m.home, m.away]);
  if (r32Teams.some((t) => t === null)) return { ok: false, reason: "R32 incomplet : affiches inconnues" };
  if (new Set(r32Teams).size !== 32) return { ok: false, reason: "R32 : équipes dupliquées" };

  // Validation de l'arbre : toute équipe réelle d'un tour i doit venir d'une
  // des deux nourrices prédites du tour i-1.
  for (let i = 1; i < rounds.length; i++) {
    for (let j = 0; j < rounds[i].length; j++) {
      const feeders = [rounds[i - 1][2 * j], rounds[i - 1][2 * j + 1]];
      for (const team of [rounds[i][j].home, rounds[i][j].away]) {
        if (team === null) continue;
        const candidates = feeders.flatMap((f) => (f.winner ? [f.winner] : [f.home, f.away]));
        if (!candidates.includes(team)) {
          return {
            ok: false,
            reason: `arbre invalide : ${team} (${KO_ORDER[i]} #${rounds[i][j].id}) ne sort pas des nourrices prédites #${feeders[0].id}/#${feeders[1].id}`,
          };
        }
      }
    }
  }
  return { ok: true, rounds };
}

/** Issue d'un match KO simulé : pas de nul, TAB virtuel Bernoulli(E) (§6.2). */
function simulateKoWinner(
  rng: () => number,
  home: string,
  away: string,
  elo: ReadonlyMap<string, number>,
  model: MatchModelConfig,
): string {
  const eloHome = elo.get(home) ?? 1400;
  const eloAway = elo.get(away) ?? 1400;
  const { pHome, pAway, pDraw } = outcomeProbs(eloHome, eloAway, model);
  const roll = rng();
  if (roll < pHome) return home;
  if (roll < pHome + pAway) return away;
  // Nul tiré → TAB virtuel : Bernoulli sur l'expected score Elo pur.
  const expHome = pHome / (pHome + pAway || 1);
  void pDraw;
  return rng() < expHome ? home : away;
}

export function simulateKnockout(
  rounds: KoMatchInput[][],
  elo: ReadonlyMap<string, number>,
  iterations: number,
  seed: string,
  model: MatchModelConfig = DEFAULT_MODEL,
): Record<string, KoProbs> {
  const rng = mulberry32(seed);
  const tally = new Map<string, { r16: number; qf: number; sf: number; final: number; champion: number }>();
  const bump = (code: string, key: "r16" | "qf" | "sf" | "final" | "champion") => {
    const row = tally.get(code) ?? { r16: 0, qf: 0, sf: 0, final: 0, champion: 0 };
    row[key]++;
    tally.set(code, row);
  };
  const REACH_KEYS = ["r16", "qf", "sf", "final", "champion"] as const;

  for (let it = 0; it < iterations; it++) {
    // winners[i][j] = vainqueur du match j du tour i dans cette itération.
    const winners: string[][] = [];
    for (let i = 0; i < rounds.length; i++) {
      winners.push([]);
      for (let j = 0; j < rounds[i].length; j++) {
        const m = rounds[i][j];
        // Équipes : réelles si connues, sinon vainqueurs simulés des nourrices.
        const home = m.home ?? winners[i - 1][2 * j];
        const away = m.away ?? winners[i - 1][2 * j + 1];
        const w = m.winner ?? simulateKoWinner(rng, home, away, elo, model);
        winners[i].push(w);
        bump(w, REACH_KEYS[i]);
      }
    }
  }

  const probs: Record<string, KoProbs> = {};
  const r32Teams = rounds[0].flatMap((m) => [m.home!, m.away!]);
  for (const code of r32Teams) {
    const t = tally.get(code) ?? { r16: 0, qf: 0, sf: 0, final: 0, champion: 0 };
    probs[code] = {
      p_r16: t.r16 / iterations,
      p_qf: t.qf / iterations,
      p_sf: t.sf / iterations,
      p_final: t.final / iterations,
      p_champion: t.champion / iterations,
    };
  }
  return probs;
}
