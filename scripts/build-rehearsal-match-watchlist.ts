/**
 * Build match_watchlist entries for the UCL Final rehearsal.
 *
 * Reads the rehearsal match from `matches` (by slug) and the related
 * entities + wiki_articles, then creates match_watchlist rows linking
 * each article to the match with the appropriate role.
 *
 * Usage:
 *   npm run build:rehearsal:watchlist               # dry-run (default)
 *   npm run build:rehearsal:watchlist -- --dry-run   # dry-run (explicit)
 *   npm run build:rehearsal:watchlist -- --apply      # write to Supabase
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const MATCH_SLUG = '2026-ucl-final-psg-arsenal';
const HOME_TEAM_SLUG = 'paris-saint-germain';
const AWAY_TEAM_SLUG = 'arsenal';
const TOURNAMENT_SLUG = 'ucl-2025-26';
const MATCH_ENTITY_SLUG = '2026-ucl-final-psg-arsenal';

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

type RoleMapping = {
  entitySlug: string;
  role: 'match' | 'home_team' | 'away_team' | 'tournament';
};

const ROLE_MAPPINGS: RoleMapping[] = [
  { entitySlug: MATCH_ENTITY_SLUG, role: 'match' },
  { entitySlug: HOME_TEAM_SLUG, role: 'home_team' },
  { entitySlug: AWAY_TEAM_SLUG, role: 'away_team' },
  { entitySlug: TOURNAMENT_SLUG, role: 'tournament' },
];

async function main() {
  console.log('[build:rehearsal:watchlist] mode=', dryRun ? 'dry-run' : 'apply');
  console.log('[build:rehearsal:watchlist] match_slug=', MATCH_SLUG);

  const supabase = createClient(req('SUPABASE_URL'), req('SUPABASE_SERVICE_KEY'));

  // 1. Find the match
  const { data: matchRow, error: matchErr } = await supabase
    .from('matches')
    .select('id, slug')
    .eq('slug', MATCH_SLUG)
    .single();
  if (matchErr) throw new Error(`Match not found: ${MATCH_SLUG} — ${matchErr.message}`);
  console.log('[build:rehearsal:watchlist] match_id=', matchRow.id);

  // 2. Find entities and their articles
  const entitySlugs = ROLE_MAPPINGS.map((r) => r.entitySlug);
  const { data: entities, error: entityErr } = await supabase
    .from('entities')
    .select('id, slug')
    .in('slug', entitySlugs);
  if (entityErr) throw entityErr;

  const entityIdBySlug = new Map((entities ?? []).map((e: any) => [e.slug, e.id]));
  console.log('[build:rehearsal:watchlist] entities_found=', entities?.length ?? 0);

  for (const slug of entitySlugs) {
    if (!entityIdBySlug.has(slug)) {
      console.warn(`[build:rehearsal:watchlist] WARNING: entity not found: ${slug}`);
    }
  }

  // 3. Find all wiki_articles for these entities
  const entityIds = [...entityIdBySlug.values()];
  const { data: articles, error: articleErr } = await supabase
    .from('wiki_articles')
    .select('id, entity_id, wiki_code, page_title')
    .in('entity_id', entityIds);
  if (articleErr) throw articleErr;
  console.log('[build:rehearsal:watchlist] articles_found=', articles?.length ?? 0);

  // 4. Build match_watchlist rows
  const slugByEntityId = new Map([...entityIdBySlug.entries()].map(([slug, id]) => [id, slug]));
  const roleBySlug = new Map(ROLE_MAPPINGS.map((r) => [r.entitySlug, r.role]));

  const watchlistRows = (articles ?? []).map((article: any) => {
    const entitySlug = slugByEntityId.get(article.entity_id);
    const role = entitySlug ? roleBySlug.get(entitySlug) : 'match';
    return {
      match_id: matchRow.id,
      wiki_article_id: article.id,
      role: role ?? 'match',
    };
  });

  console.log('[build:rehearsal:watchlist] watchlist_rows_to_create=', watchlistRows.length);

  for (const row of watchlistRows) {
    const article = (articles ?? []).find((a: any) => a.id === row.wiki_article_id);
    console.log(`  ${row.role} → ${article?.wiki_code}:${article?.page_title}`);
  }

  if (dryRun) {
    console.log('[build:rehearsal:watchlist] DRY-RUN complete. Use --apply to write to Supabase.');
    return;
  }

  // 5. Upsert match_watchlist
  const { error: wlErr } = await supabase
    .from('match_watchlist')
    .upsert(watchlistRows, { onConflict: 'match_id,wiki_article_id' });
  if (wlErr) throw wlErr;

  console.log('[build:rehearsal:watchlist] ✅ match_watchlist upserted:', watchlistRows.length, 'rows');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
