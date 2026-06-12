/**
 * « Ma nation » — personnalisation sans compte (principe P1) : un code FIFA
 * épinglé en localStorage. Le site s'ouvre sur son empire, son prochain
 * match, ses probas. Même mécanique que le streak : zéro serveur.
 */

import { useCallback, useSyncExternalStore } from "react";

const KEY = "atlas_my_nation";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function useMyNation(): [string | null, (code: string | null) => void] {
  const code = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
  const set = useCallback((next: string | null) => {
    try {
      if (next) localStorage.setItem(KEY, next);
      else localStorage.removeItem(KEY);
    } catch {
      // stockage indisponible (navigation privée) : la feature se désactive
    }
    listeners.forEach((cb) => cb());
  }, []);
  return [code, set];
}

/**
 * Streak « X matins de suite » sur le recap (pattern Wordle, sans compte).
 * Incrémenté quand on consulte la nuit du jour Atlas courant et que la
 * dernière visite était la nuit précédente.
 */
export function bumpStreak(atlasDate: string): number {
  try {
    const raw = localStorage.getItem("atlas_streak");
    const prev = raw ? (JSON.parse(raw) as { last: string; count: number }) : null;
    if (prev?.last === atlasDate) return prev.count;
    const d = new Date(`${atlasDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    const count = prev?.last === yesterday ? prev.count + 1 : 1;
    localStorage.setItem("atlas_streak", JSON.stringify({ last: atlasDate, count }));
    return count;
  } catch {
    return 0;
  }
}
