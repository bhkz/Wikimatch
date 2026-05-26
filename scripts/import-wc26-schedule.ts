import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

type NormalizedMatch = {
  sourceId?: string;
  slug: string;
  competitionLabel: string;
  stageLabel?: string | null;
  groupLabel?: string | null;
  scheduledAt?: string | null;
  homeTeam: { slug: string; label: string; wikidataQid?: string | null };
  awayTeam: { slug: string; label: string; wikidataQid?: string | null };
  officialSourceName?: string | null;
  officialSourceUrl?: string | null;
};

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

function req(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function main() {
  const raw = await readFile('data/live/wc26/schedule.normalized.json', 'utf8');
  const payload = JSON.parse(raw) as { matches: NormalizedMatch[] };
  const matches = payload.matches ?? [];

  console.log('[import:wc26:schedule] mode=', dryRun ? 'dry-run' : 'apply');
  console.log('[import:wc26:schedule] detected_matches=', matches.length);

  const teams = new Map<string, { slug: string; canonical_label: string; wikidata_qid: string | null; type: string }>();
  for (const m of matches) {
    teams.set(m.homeTeam.slug, { slug: m.homeTeam.slug, canonical_label: m.homeTeam.label, wikidata_qid: m.homeTeam.wikidataQid ?? null, type: 'team' });
    teams.set(m.awayTeam.slug, { slug: m.awayTeam.slug, canonical_label: m.awayTeam.label, wikidata_qid: m.awayTeam.wikidataQid ?? null, type: 'team' });
  }

  if (dryRun) {
    console.log('[import:wc26:schedule] unique_teams=', teams.size);
    return;
  }

  const supabase = createClient(req('SUPABASE_URL'), req('SUPABASE_SERVICE_KEY'));
  const { data: upTeams, error: teamErr } = await supabase.from('entities').upsert([...teams.values()], { onConflict: 'slug' }).select('id,slug');
  if (teamErr) throw teamErr;
  const teamId = new Map((upTeams ?? []).map((t:any) => [t.slug, t.id]));

  const rows = matches.map((m) => ({
    slug: m.slug,
    competition_label: m.competitionLabel,
    stage_label: m.stageLabel ?? null,
    group_label: m.groupLabel ?? null,
    scheduled_at: m.scheduledAt ?? null,
    home_team_entity_id: teamId.get(m.homeTeam.slug) ?? null,
    away_team_entity_id: teamId.get(m.awayTeam.slug) ?? null,
    status: 'scheduled',
    official_source_name: m.officialSourceName ?? 'FIFA',
    official_source_url: m.officialSourceUrl ?? null,
    source_verified_at: new Date().toISOString(),
  }));

  const { error: matchErr } = await supabase.from('matches').upsert(rows, { onConflict: 'slug' });
  if (matchErr) throw matchErr;
  console.log('[import:wc26:schedule] upserted_matches=', rows.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
