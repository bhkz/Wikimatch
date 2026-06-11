/**
 * ManualOverrideProvider — prime TOUJOURS sur l'API (spec §3.3.1).
 *
 * Lit la table atlas.match_overrides (saisie via /admin). C'est aussi l'outil
 * de test : une journée entière doit pouvoir être jouée 100 % en manuel.
 *
 * Un override ne porte que le RÉSULTAT (score/duration/pens) ; les métadonnées
 * du match (stage, équipes, kickoff) viennent de atlas.matches déjà seedée.
 * Tout match overridé est considéré FINISHED.
 */

import type { NormalizedMatch, ResultProvider, Stage } from "./types";

export type MatchRow = {
  id: number;
  stage: Stage;
  group_letter: string | null;
  home: string;
  away: string;
  kickoff_utc: string;
};

export type OverrideRow = {
  match_id: number;
  score_home: number;
  score_away: number;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  pens_home: number | null;
  pens_away: number | null;
};

/** Construction pure (testable offline) d'un NormalizedMatch depuis un override. */
export function normalizeOverride(match: MatchRow, override: OverrideRow): NormalizedMatch {
  return {
    providerId: `manual-${override.match_id}`,
    stage: match.stage,
    group: match.group_letter,
    homeFifa: match.home,
    awayFifa: match.away,
    kickoffUtc: match.kickoff_utc,
    status: "FINISHED",
    scoreHome: override.score_home,
    scoreAway: override.score_away,
    duration: override.duration,
    pensHome: override.pens_home,
    pensAway: override.pens_away,
  };
}

type SupabaseLike = {
  schema: (name: string) => {
    from: (table: string) => {
      select: (cols: string) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };
};

export class ManualOverrideProvider implements ResultProvider {
  readonly name = "manual-override";

  constructor(private readonly supabase: SupabaseLike) {}

  async fetchSchedule(): Promise<NormalizedMatch[]> {
    const { data: overrides, error } = await this.supabase
      .schema("atlas")
      .from("match_overrides")
      .select("match_id, score_home, score_away, duration, pens_home, pens_away");
    if (error) throw new Error(`match_overrides: ${error.message}`);
    const rows = (overrides ?? []) as OverrideRow[];
    if (rows.length === 0) return [];

    const { data: matches, error: mErr } = await this.supabase
      .schema("atlas")
      .from("matches")
      .select("id, stage, group_letter, home, away, kickoff_utc");
    if (mErr) throw new Error(`matches: ${mErr.message}`);
    const matchById = new Map((matches as MatchRow[]).map((m) => [m.id, m]));

    return rows.flatMap((o) => {
      const match = matchById.get(o.match_id);
      if (!match) return []; // override orphelin : ignoré (le seed des matchs fait foi)
      return [normalizeOverride(match, o)];
    });
  }

  async fetchWindow(fromIso: string, toIso: string): Promise<NormalizedMatch[]> {
    const all = await this.fetchSchedule();
    return all.filter((m) => m.kickoffUtc >= fromIso && m.kickoffUtc <= toIso);
  }
}
