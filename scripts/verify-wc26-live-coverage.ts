import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function req(name: string) { const v = process.env[name]; if (!v) throw new Error(`Missing ${name}`); return v; }

async function main() {
  const supabase = createClient(req('SUPABASE_URL'), req('SUPABASE_SERVICE_KEY'));
  const [{ count: matches }, { count: teams }, { count: articles }, { count: watch }] = await Promise.all([
    supabase.from('matches').select('*', { head: true, count: 'exact' }),
    supabase.from('entities').select('*', { head: true, count: 'exact' }).eq('type', 'team'),
    supabase.from('wiki_articles').select('*', { head: true, count: 'exact' }).eq('monitoring_enabled', true),
    supabase.from('match_watchlist').select('*', { head: true, count: 'exact' }).eq('enabled', true),
  ] as any);
  console.log('[verify:wc26:coverage] matches_imported=', matches ?? 0);
  console.log('[verify:wc26:coverage] teams=', teams ?? 0);
  console.log('[verify:wc26:coverage] monitored_articles=', articles ?? 0);
  console.log('[verify:wc26:coverage] watchlist_rows=', watch ?? 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
