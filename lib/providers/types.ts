/**
 * Couche d'abstraction des résultats (spec §3.3, NORMATIF).
 * Le moteur ne connaît QUE NormalizedMatch — jamais le format football-data.
 */

/** Notre enum interne de stages (spec §15, table atlas.matches). */
export type Stage = "GROUP" | "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL";

export const KO_STAGES: readonly Stage[] = ["R32", "R16", "QF", "SF", "THIRD", "FINAL"] as const;

export function isKnockout(stage: Stage): boolean {
  return KO_STAGES.includes(stage);
}

/** Statuts football-data v4 (spec §3.2). */
export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED";

export interface NormalizedMatch {
  providerId: string; //         id football-data, ou "manual-<n>"
  stage: Stage; //               notre enum
  group: string | null; //       'A'..'L'
  homeFifa: string;
  awayFifa: string; //           codes FIFA 3 lettres
  kickoffUtc: string; //         ISO
  status: MatchStatus;
  scoreHome: number | null;
  scoreAway: number | null; //   score "décisif" (prolongation incluse)
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | null;
  pensHome: number | null;
  pensAway: number | null;
}

export interface ResultProvider {
  name: string;
  fetchSchedule(): Promise<NormalizedMatch[]>;
  fetchWindow(fromIso: string, toIso: string): Promise<NormalizedMatch[]>;
}
