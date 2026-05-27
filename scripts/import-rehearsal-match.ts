/**
 * Import the UCL Final rehearsal match into Supabase.
 *
 * Reads data/live/rehearsals/ucl-final-2026-psg-arsenal.match.json
 * and upserts the two teams + match into the database.
 *
 * Usage:
 *   npm run import:rehearsal:match               # dry-run (default)
 *   npm run import:rehearsal:match -- --dry-run   # dry-run (explicit)
 *   npm run import:rehearsal:match -- --apply      # actually write to Supabase
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

type MatchFile = {
  source: {
    name: string;
    url: string;
    verified_at: string;
  };
  match: {
    slug: string;
    competitionLabel: string;
    stageLabel: string;
    groupLabel: string | null;
    scheduledAt: string | null;
    venue?: string;
    homeTeam: { slug: string; label: string; wikidataQid: string | null };
    awayTeam: { slug: string; label: string; wikidataQid: string | null };
    officialSourceName: string;
    officialSourceUrl: string;
  };
};

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function main() {
  const filePath = 'data/live/rehearsals/ucl-final-2026-psg-arsenal.match.json';
  const raw = await readFile(filePath, 'utf8');
  const payload = JSON.parse(raw) as MatchFile;
  const m = payload.match;

  console.log('[import:rehearsal:match] mode=', dryRun ? 'dry-run' : 'apply');
  console.log('[import:rehearsal:match] match=', m.slug);
  console.log('[import:rehearsal:match] competition=', m.competitionLabel);
  console.log('[import:rehearsal:match] stage=', m.stageLabel);
  console.log('[import:rehearsal:match] scheduledAt=', m.scheduledAt);
  console.log('[import:rehearsal:match] venue=', m.venue ?? '(not specified)');
  console.log('[import:rehearsal:match] homeTeam=', m.homeTeam.label, `(${m.homeTeam.slug})`);
  console.log('[import:rehearsal:match] awayTeam=', m.awayTeam.label, `(${m.awayTeam.slug})`);
  console.log('[import:rehearsal:match] source=', payload.source.name, payload.source.url);

  const teams = [
    {
      slug: m.homeTeam.slug,
      type: 'team',
      canonical_label: m.homeTeam.label,
      wikidata_qid: m.homeTeam.wikidataQid,
    },
    {
      slug: m.awayTeam.slug,
      type: 'team',
      canonical_label: m.awayTeam.label,
      wikidata_qid: m.awayTeam.wikidataQid,
    },
  ];

  console.log('[import:rehearsal:match] teams_to_upsert=', teams.length);

  if (dryRun) {
    console.log('[import:rehearsal:match] DRY-RUN complete. Use --apply to write to Supabase.');
    return;
  }

  const supabase = createClient(req('SUPABASE_URL'), req('SUPABASE_SERVICE_KEY'));

  // Upsert teams
  const { data: upTeams, error: teamErr } = await supabase
    .from('entities')
    .upsert(teams, { onConflict: 'slug' })
    .select('id, slug');
  if (teamErr) throw teamErr;

  const teamId = new Map((upTeams ?? []).map((t: any) => [t.slug, t.id]));
  console.log('[import:rehearsal:match] upserted_teams=', upTeams?.length ?? 0);

  // Upsert match
  const matchRow = {
    slug: m.slug,
    competition_label: m.competitionLabel,
    stage_label: m.stageLabel,
    group_label: m.groupLabel,
    scheduled_at: m.scheduledAt,
    home_team_entity_id: teamId.get(m.homeTeam.slug) ?? null,
    away_team_entity_id: teamId.get(m.awayTeam.slug) ?? null,
    status: 'upcoming',
    official_source_name: m.officialSourceName,
    official_source_url: m.officialSourceUrl,
    source_verified_at: payload.source.verified_at,
  };

  const { error: matchErr } = await supabase
    .from('matches')
    .upsert([matchRow], { onConflict: 'slug' });
  if (matchErr) throw matchErr;

  console.log('[import:rehearsal:match] ✅ match upserted:', m.slug);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
