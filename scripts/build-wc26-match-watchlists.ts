import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

function req(name: string) { const v = process.env[name]; if (!v) throw new Error(`Missing ${name}`); return v; }

async function main() {
  console.log('[build:wc26:watchlists] mode=', dryRun ? 'dry-run' : 'apply');
  const supabase = createClient(req('SUPABASE_URL'), req('SUPABASE_SERVICE_KEY'));

  const { data: matches, error: mErr } = await supabase.from('matches').select('id,home_team_entity_id,away_team_entity_id');
  if (mErr) throw mErr;
  const { data: articles, error: aErr } = await supabase.from('wiki_articles').select('id,entity_id').eq('monitoring_enabled', true);
  if (aErr) throw aErr;

  const byEntity = new Map<string, string[]>();
  for (const a of articles ?? []) {
    if (!byEntity.has((a as any).entity_id)) byEntity.set((a as any).entity_id, []);
    byEntity.get((a as any).entity_id)!.push((a as any).id);
  }

  const rows: any[] = [];
  for (const m of matches ?? []) {
    for (const role of ['home_team','away_team'] as const) {
      const eId = role === 'home_team' ? (m as any).home_team_entity_id : (m as any).away_team_entity_id;
      for (const articleId of byEntity.get(eId) ?? []) {
        rows.push({ match_id: (m as any).id, article_id: articleId, role, enabled: true, monitoring_reason: 'wc26_auto_watchlist' });
      }
    }
  }
  console.log('[build:wc26:watchlists] candidate_rows=', rows.length);

  if (dryRun) return;
  if (!rows.length) return;
  const { error } = await supabase.from('match_watchlist').upsert(rows, { onConflict: 'match_id,article_id,role' });
  if (error) throw error;
  console.log('[build:wc26:watchlists] upserted_rows=', rows.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
