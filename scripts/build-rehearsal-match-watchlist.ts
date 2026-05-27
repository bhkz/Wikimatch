/**
 * Build match_watchlist entries for the UCL Final rehearsal.
 *
 * Reads the rehearsal match from `matches` (by slug) and the related
 * entities + wiki_articles from the rehearsal seed, then creates
 * match_watchlist rows linking each article to the match with the appropriate role.
 *
 * Usage:
 *   npm run build:rehearsal:watchlist               # dry-run (default)
 *   npm run build:rehearsal:watchlist -- --dry-run   # dry-run (explicit)
 *   npm run build:rehearsal:watchlist -- --apply      # write to Supabase
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const MATCH_SLUG = '2026-ucl-final-psg-arsenal';

const ROLE_BY_SLUG: Record<string, 'match' | 'home_team' | 'away_team' | 'tournament'> = {
  '2026-ucl-final-psg-arsenal': 'match',
  'paris-saint-germain-fc': 'home_team',
  'arsenal-fc': 'away_team',
  'ucl-2025-26': 'tournament',
};

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

type SeedArticle = {
  entity_slug: string;
  wiki_code: string;
  page_title: string;
};

type SeedFile = {
  entities: Array<{ slug: string }>;
  articles: SeedArticle[];
};

async function main() {
  console.log('[build:rehearsal:watchlist] mode=', dryRun ? 'dry-run' : 'apply');
  console.log('[build:rehearsal:watchlist] match_slug=', MATCH_SLUG);

  // 1. Load seed JSON
  const seedPath = new URL('../worker/seeds/ucl-final-2026-rehearsal.watchlist.json', import.meta.url);
  const seed = JSON.parse(await readFile(seedPath, 'utf8')) as SeedFile;

  if (!Array.isArray(seed.articles) || seed.articles.length !== 12) {
    throw new Error(`Expected exactly 12 articles in rehearsal watchlist seed, got ${seed.articles?.length}`);
  }

  const articleKey = (a: { wiki_code: string; page_title: string }) => `${a.wiki_code}::${a.page_title}`;
  const seedKeys = new Set<string>();
  for (const art of seed.articles) {
    const key = articleKey(art);
    if (seedKeys.has(key)) {
      throw new Error(`Duplicate article in seed: ${key}`);
    }
    seedKeys.add(key);
  }

  const supabase = createClient(req('SUPABASE_URL'), req('SUPABASE_SERVICE_KEY'));

  // 2. Find the match
  const { data: matchRow, error: matchErr } = await supabase
    .from('matches')
    .select('id, slug')
    .eq('slug', MATCH_SLUG)
    .single();
  if (matchErr) throw new Error(`Match not found: ${MATCH_SLUG} — ${matchErr.message}`);
  console.log('[build:rehearsal:watchlist] match_id=', matchRow.id);

  // 3. Find the 4 expected entities
  const expectedSlugs = Object.keys(ROLE_BY_SLUG);
  const { data: entities, error: entityErr } = await supabase
    .from('entities')
    .select('id, slug')
    .in('slug', expectedSlugs);
  if (entityErr) throw entityErr;

  const entityIdBySlug = new Map((entities ?? []).map((e: any) => [e.slug, e.id]));
  console.log('[build:rehearsal:watchlist] entities_found=', entities?.length ?? 0);

  for (const slug of expectedSlugs) {
    if (!entityIdBySlug.has(slug)) {
      throw new Error(`Expected entity not found: ${slug}`);
    }
  }

  // 4. Find the articles in Supabase matching wiki_code & page_title
  const wikiCodes = Array.from(new Set(seed.articles.map(a => a.wiki_code)));
  const pageTitles = Array.from(new Set(seed.articles.map(a => a.page_title)));

  const { data: articles, error: articleErr } = await supabase
    .from('wiki_articles')
    .select('id, entity_id, wiki_code, page_title')
    .in('wiki_code', wikiCodes)
    .in('page_title', pageTitles);
  if (articleErr) throw articleErr;

  console.log('[build:rehearsal:watchlist] articles_found=', articles?.length ?? 0);

  const articleMap = new Map((articles ?? []).map(a => [articleKey(a), a]));
  const watchlistRows = [];

  // 5. Verify and link each article from the seed
  for (const seedArticle of seed.articles) {
    const key = articleKey(seedArticle);
    const dbArticle = articleMap.get(key);
    if (!dbArticle) {
      throw new Error(`Article not found in database: ${key}`);
    }

    const expectedEntityId = entityIdBySlug.get(seedArticle.entity_slug);
    if (dbArticle.entity_id !== expectedEntityId) {
      // Find actual entity slug for clear error output
      const { data: actualEntity } = await supabase
        .from('entities')
        .select('slug')
        .eq('id', dbArticle.entity_id)
        .maybeSingle();

      throw new Error(
        `Mismatched entity for article ${key}: ` +
        `expected slug="${seedArticle.entity_slug}", but article in DB is linked to slug="${actualEntity?.slug ?? 'UNKNOWN'}"`
      );
    }

    const role = ROLE_BY_SLUG[seedArticle.entity_slug];
    if (!role) {
      throw new Error(`No role mapping defined for entity slug: ${seedArticle.entity_slug}`);
    }

    watchlistRows.push({
      match_id: matchRow.id,
      article_id: dbArticle.id,
      role,
      monitoring_reason: 'ucl_final_2026_rehearsal',
      enabled: true,
    });
  }

  console.log('[build:rehearsal:watchlist] watchlist_rows_to_create=', watchlistRows.length);

  for (const row of watchlistRows) {
    const dbArt = (articles ?? []).find((a: any) => a.id === row.article_id);
    console.log(`  ${row.role} → ${dbArt?.wiki_code}:${dbArt?.page_title}`);
  }

  if (dryRun) {
    console.log('[build:rehearsal:watchlist] DRY-RUN complete. Use --apply to write to Supabase.');
    return;
  }

  // 6. Upsert match_watchlist
  const { error: wlErr } = await supabase
    .from('match_watchlist')
    .upsert(watchlistRows, { onConflict: 'match_id,article_id,role' });
  if (wlErr) throw wlErr;

  console.log('[build:rehearsal:watchlist] ✅ match_watchlist upserted:', watchlistRows.length, 'rows');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
