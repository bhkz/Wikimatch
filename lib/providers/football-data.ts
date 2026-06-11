/**
 * FootballDataProvider — implémentation par défaut (spec §3.2–3.3).
 *
 * - Auth : header X-Auth-Token (FOOTBALL_DATA_TOKEN).
 * - Mapping équipes : SEULE la table fd_team_id ↔ code FIFA fait foi (spec §21.6).
 * - Mapping stages : table de correspondance en config (game_config.stage_mapping) ;
 *   stage inconnu → erreur explicite, jamais deviner (spec §3.2, §21.5).
 */

import type { MatchStatus, NormalizedMatch, ResultProvider, Stage } from "./types";
import { extractScore, type FdScore } from "./extract-score";

const API_BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

export type FdRawMatch = {
  id: number;
  utcDate: string;
  status: MatchStatus;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: { id: number | null };
  awayTeam: { id: number | null };
  score: FdScore | null;
};

export class UnknownStageError extends Error {
  constructor(stage: string, matchId: number) {
    super(`Stage inconnu "${stage}" (match ${matchId}) — refus de normaliser, vérifier stage_mapping.`);
    this.name = "UnknownStageError";
  }
}

export class UnknownTeamError extends Error {
  constructor(fdTeamId: number, matchId: number) {
    super(`fd_team_id ${fdTeamId} inconnu (match ${matchId}) — vérifier le mapping des 48 équipes.`);
    this.name = "UnknownTeamError";
  }
}

export type FootballDataProviderOptions = {
  token: string;
  /** fd_team_id → code FIFA (table atlas.nations, vérifiée à la main). */
  teamIdToFifa: ReadonlyMap<number, string>;
  /** stage football-data → notre enum (game_config.stage_mapping). */
  stageMapping: Readonly<Record<string, Stage>>;
  fetchImpl?: typeof fetch;
};

export class FootballDataProvider implements ResultProvider {
  readonly name = "football-data";
  private readonly opts: FootballDataProviderOptions;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: FootballDataProviderOptions) {
    this.opts = opts;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async fetchSchedule(): Promise<NormalizedMatch[]> {
    return this.fetchMatches(`/competitions/${COMPETITION}/matches`);
  }

  async fetchWindow(fromIso: string, toIso: string): Promise<NormalizedMatch[]> {
    const from = fromIso.slice(0, 10);
    const to = toIso.slice(0, 10);
    return this.fetchMatches(`/competitions/${COMPETITION}/matches?dateFrom=${from}&dateTo=${to}`);
  }

  private async fetchMatches(path: string): Promise<NormalizedMatch[]> {
    const res = await this.fetchImpl(`${API_BASE}${path}`, {
      headers: { "X-Auth-Token": this.opts.token },
    });
    if (!res.ok) {
      throw new Error(`football-data ${path} → HTTP ${res.status}`);
    }
    const body = (await res.json()) as { matches: FdRawMatch[] };
    return body.matches.map((m) => this.normalize(m));
  }

  /** Public pour les tests offline sur fixtures JSON commitées. */
  normalize(m: FdRawMatch): NormalizedMatch {
    const stage = this.opts.stageMapping[m.stage];
    if (!stage) throw new UnknownStageError(m.stage, m.id);

    const resolveTeam = (fdId: number | null): string => {
      // Placeholders du tableau (équipes non encore connues) : pas un code réel.
      if (fdId === null) return "TBD";
      const fifa = this.opts.teamIdToFifa.get(fdId);
      if (!fifa) throw new UnknownTeamError(fdId, m.id);
      return fifa;
    };

    const score = extractScore(m.score);
    return {
      providerId: String(m.id),
      stage,
      group: m.group ? m.group.replace(/^GROUP_/, "") : null,
      homeFifa: resolveTeam(m.homeTeam.id),
      awayFifa: resolveTeam(m.awayTeam.id),
      kickoffUtc: m.utcDate,
      status: m.status,
      scoreHome: score.scoreHome,
      scoreAway: score.scoreAway,
      duration: score.duration,
      pensHome: score.pensHome,
      pensAway: score.pensAway,
    };
  }
}
