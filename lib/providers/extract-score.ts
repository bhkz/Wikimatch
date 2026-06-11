/**
 * Extraction du score "décisif" depuis un payload football-data v4 (spec §3.2).
 *
 * ⚠️ SÉMANTIQUE FIGÉE ICI (et nulle part ailleurs) :
 * - `score.fullTime` inclut la prolongation mais PAS les tirs au but
 *   (convention documentée v4). Le score décisif = fullTime.
 * - `score.penalties` contient les buts de la séance de TAB uniquement.
 * - `score.duration` ∈ REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT.
 * - `score.winner` ∈ HOME_TEAM | AWAY_TEAM | DRAW | null.
 *
 * ⚠️ Hypothèse à CONFIRMER sur un payload réel de match à prolongation dès
 * qu'il y en a un (spec §3.2) : enregistrer le payload en fixture JSON commitée
 * dans data/fixtures/ et l'ajouter aux tests offline. Si la sémantique réelle
 * diffère (fullTime = 90 min seulement), SEUL ce fichier change.
 */

export type FdScore = {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  fullTime: { home: number | null; away: number | null };
  regularTime?: { home: number | null; away: number | null };
  extraTime?: { home: number | null; away: number | null };
  penalties?: { home: number | null; away: number | null };
};

export type ExtractedScore = {
  scoreHome: number | null;
  scoreAway: number | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | null;
  pensHome: number | null;
  pensAway: number | null;
};

export function extractScore(score: FdScore | null | undefined): ExtractedScore {
  if (!score) {
    return { scoreHome: null, scoreAway: null, duration: null, pensHome: null, pensAway: null };
  }

  const scoreHome = score.fullTime?.home ?? null;
  const scoreAway = score.fullTime?.away ?? null;

  if (score.duration === "PENALTY_SHOOTOUT") {
    const pensHome = score.penalties?.home ?? null;
    const pensAway = score.penalties?.away ?? null;
    // Garde-fou : un match aux TAB sans détail de TAB est inexploitable —
    // on renvoie null pour que le moteur refuse de résoudre (jamais deviner).
    if (pensHome === null || pensAway === null || pensHome === pensAway) {
      return { scoreHome, scoreAway, duration: "PENALTY_SHOOTOUT", pensHome: null, pensAway: null };
    }
    return { scoreHome, scoreAway, duration: "PENALTY_SHOOTOUT", pensHome, pensAway };
  }

  return {
    scoreHome,
    scoreAway,
    duration: score.duration ?? null,
    pensHome: null,
    pensAway: null,
  };
}
