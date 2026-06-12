/**
 * Pronostics à 1 clic, sans compte (localStorage) : on choisit le soir,
 * le verdict tombe au recap du matin — la boucle soir → matin qui crée
 * l'habitude. Aucune écriture serveur, aucune compétition publique :
 * c'est un pacte entre le visiteur et sa carte.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { Resolution } from "./atlas";

export type Pick = "HOME" | "DRAW" | "AWAY";
type Store = Record<string, { pick: Pick; at: string }>;

const KEY = "atlas_pronos";
const STATS_KEY = "atlas_pronos_stats";
const listeners = new Set<() => void>();
let cache: { raw: string | null; parsed: Store } = { raw: null, parsed: {} };

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cache.raw) cache = { raw, parsed: raw ? (JSON.parse(raw) as Store) : {} };
    return cache.parsed;
  } catch {
    return {};
  }
}

export function usePronos(): [Store, (matchId: number, pick: Pick | null) => void] {
  const store = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => ({}) as Store,
  );
  const set = useCallback((matchId: number, pick: Pick | null) => {
    try {
      const next = { ...read() };
      if (pick) next[String(matchId)] = { pick, at: new Date().toISOString() };
      else delete next[String(matchId)];
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // stockage indisponible : la feature se désactive silencieusement
    }
    listeners.forEach((cb) => cb());
  }, []);
  return [store, set];
}

export type Verdict = { matchId: number; pick: Pick; actual: Pick; correct: boolean };

/** Issue réelle d'une résolution, dans le langage des pronos. */
function actualOf(r: Resolution, home: string | null): Pick {
  if (r.is_draw) return "DRAW";
  return r.winner === home ? "HOME" : "AWAY";
}

/**
 * Verdicts d'une nuit : croise les pronos stockés avec les résolutions.
 * Met à jour les stats cumulées une seule fois par match (flag scored).
 */
export function nightVerdicts(
  resolutions: Resolution[],
  homeOf: (matchId: number) => string | null,
): { verdicts: Verdict[]; totalCorrect: number; totalScored: number } {
  let store: Store = {};
  let scored: Record<string, boolean> = {};
  let stats = { correct: 0, total: 0 };
  try {
    store = read();
    scored = JSON.parse(localStorage.getItem(`${STATS_KEY}_scored`) ?? "{}") as Record<string, boolean>;
    stats = JSON.parse(localStorage.getItem(STATS_KEY) ?? '{"correct":0,"total":0}') as typeof stats;
  } catch {
    return { verdicts: [], totalCorrect: 0, totalScored: 0 };
  }

  const verdicts: Verdict[] = [];
  let dirty = false;
  for (const r of resolutions) {
    const entry = store[String(r.match_id)];
    if (!entry) continue;
    const actual = actualOf(r, homeOf(r.match_id));
    const correct = entry.pick === actual;
    verdicts.push({ matchId: r.match_id, pick: entry.pick, actual, correct });
    if (!scored[String(r.match_id)]) {
      scored[String(r.match_id)] = true;
      stats.total++;
      if (correct) stats.correct++;
      dirty = true;
    }
  }
  if (dirty) {
    try {
      localStorage.setItem(`${STATS_KEY}_scored`, JSON.stringify(scored));
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // tant pis pour les stats cumulées
    }
  }
  return { verdicts, totalCorrect: stats.correct, totalScored: stats.total };
}
