/**
 * Repair script to safely relink matches and articles linked to duplicate
 * rehearsal entities (paris-saint-germain, arsenal) back to the canonical
 * historical team entities (paris-saint-germain-fc, arsenal-fc).
 *
 * Usage:
 *   npm run repair:rehearsal:entities               # dry-run (default)
 *   npm run repair:rehearsal:entities -- --apply    # perform the write operations
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const MATCH_SLUG = '2026-ucl-final-psg-arsenal';

const CANONICAL_TEAM_SLUGS = {
  home: 'paris-saint-germain-fc',
  away: 'arsenal-fc',
};

const DUPLICATE_REHEARSAL_SLUGS = {
  home: 'paris-saint-germain',
  away: 'arsenal',
};

const dryRun = !process.argv.includes('--apply');

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
  console.log('[repair:rehearsal:entities] mode=', dryRun ? 'DRY_RUN' : 'APPLY');

  const supabase = createClient(req('SUPABASE_URL'), req('SUPABASE_SERVICE_KEY'));

  // 1. Fetch match
  const { data: matchRow, error: matchErr } = await supabase
    .from('matches')
    .select('id, slug, home_team_entity_id, away_team_entity_id')
    .eq('slug', MATCH_SLUG)
    .single();
  if (matchErr) throw new Error(`Match not found: ${MATCH_SLUG} — ${matchErr.message}`);

  // 2. Fetch expected entities (both canonical and duplicates)
  const targetSlugs = [
    CANONICAL_TEAM_SLUGS.home,
    CANONICAL_TEAM_SLUGS.away,
    DUPLICATE_REHEARSAL_SLUGS.home,
    DUPLICATE_REHEARSAL_SLUGS.away,
    '2026-ucl-final-psg-arsenal',
    'ucl-2025-26',
  ];

  const { data: entities, error: entityErr } = await supabase
    .from('entities')
    .select('id, slug, type, canonical_label')
    .in('slug', targetSlugs);
  if (entityErr) throw entityErr;

  const entityBySlug = new Map(entities?.map(e => [e.slug, e]) ?? []);

  // 3. Verify conditions
  const canonicalHome = entityBySlug.get(CANONICAL_TEAM_SLUGS.home);
  const canonicalAway = entityBySlug.get(CANONICAL_TEAM_SLUGS.away);
  const duplicateHome = entityBySlug.get(DUPLICATE_REHEARSAL_SLUGS.home);
  const duplicateAway = entityBySlug.get(DUPLICATE_REHEARSAL_SLUGS.away);

  if (!canonicalHome || canonicalHome.type !== 'team') {
    throw new Error(`Canonical home entity ${CANONICAL_TEAM_SLUGS.home} does not exist or is not a team`);
  }
  if (!canonicalAway || canonicalAway.type !== 'team') {
    throw new Error(`Canonical away entity ${CANONICAL_TEAM_SLUGS.away} does not exist or is not a team`);
  }
  if (!duplicateHome) {
    throw new Error(`Duplicate rehearsal home entity ${DUPLICATE_REHEARSAL_SLUGS.home} not found`);
  }
  if (!duplicateAway) {
    throw new Error(`Duplicate rehearsal away entity ${DUPLICATE_REHEARSAL_SLUGS.away} not found`);
  }

  // 4. Fetch 12 expected articles from seed JSON
  const seedPath = new URL('../worker/seeds/ucl-final-2026-rehearsal.watchlist.json', import.meta.url);
  const seed = JSON.parse(await readFile(seedPath, 'utf8')) as SeedFile;
  const expectedArticles = seed.articles;

  const wikiCodes = Array.from(new Set(expectedArticles.map(a => a.wiki_code)));
  const pageTitles = Array.from(new Set(expectedArticles.map(a => a.page_title)));

  const { data: articles, error: articleErr } = await supabase
    .from('wiki_articles')
    .select('id, entity_id, wiki_code, page_title')
    .in('wiki_code', wikiCodes)
    .in('page_title', pageTitles);
  if (articleErr) throw articleErr;

  const articleKey = (a: { wiki_code: string; page_title: string }) => `${a.wiki_code}::${a.page_title}`;
  const articleMap = new Map(articles?.map(a => [articleKey(a), a]) ?? []);

  // 5. Determine required changes
  let homeTeamSlugCurrent = 'UNKNOWN';
  if (matchRow.home_team_entity_id === canonicalHome.id) homeTeamSlugCurrent = canonicalHome.slug;
  if (matchRow.home_team_entity_id === duplicateHome.id) homeTeamSlugCurrent = duplicateHome.slug;

  let awayTeamSlugCurrent = 'UNKNOWN';
  if (matchRow.away_team_entity_id === canonicalAway.id) awayTeamSlugCurrent = canonicalAway.slug;
  if (matchRow.away_team_entity_id === duplicateAway.id) awayTeamSlugCurrent = duplicateAway.slug;

  console.log(`[repair:rehearsal:entities] match_home current=${homeTeamSlugCurrent} target=${canonicalHome.slug}`);
  console.log(`[repair:rehearsal:entities] match_away current=${awayTeamSlugCurrent} target=${canonicalAway.slug}`);

  const articleUpdates: Array<{ id: string; target_entity_id: string; key: string; current_slug: string; target_slug: string }> = [];

  for (const seedArticle of expectedArticles) {
    const key = articleKey(seedArticle);
    const dbArticle = articleMap.get(key);
    if (!dbArticle) {
      throw new Error(`Article not found in database: ${key}`);
    }

    const expectedCanonicalEntity = entityBySlug.get(seedArticle.entity_slug);
    if (!expectedCanonicalEntity) {
      throw new Error(`Expected canonical entity slug not loaded: ${seedArticle.entity_slug}`);
    }

    // Check if the article is currently linked to the duplicate slug
    let isLinkedToDuplicate = false;
    let duplicateSlug = '';
    if (seedArticle.entity_slug === CANONICAL_TEAM_SLUGS.home && dbArticle.entity_id === duplicateHome.id) {
      isLinkedToDuplicate = true;
      duplicateSlug = duplicateHome.slug;
    }
    if (seedArticle.entity_slug === CANONICAL_TEAM_SLUGS.away && dbArticle.entity_id === duplicateAway.id) {
      isLinkedToDuplicate = true;
      duplicateSlug = duplicateAway.slug;
    }

    if (isLinkedToDuplicate) {
      articleUpdates.push({
        id: dbArticle.id,
        target_entity_id: expectedCanonicalEntity.id,
        key,
        current_slug: duplicateSlug,
        target_slug: expectedCanonicalEntity.slug,
      });
    } else {
      // Safety check: ensure it is either linked to canonical already or is a match/tournament article
      if (dbArticle.entity_id !== expectedCanonicalEntity.id) {
        throw new Error(
          `Safety alert! Article ${key} is linked to a completely different entity ID ` +
          `(neither the canonical nor the duplicate slug we expect).`
        );
      }
    }
  }

  console.log(`[repair:rehearsal:entities] articles_to_relink=${articleUpdates.length}`);
  for (const update of articleUpdates) {
    console.log(`[repair:rehearsal:entities] ${update.key} current_entity=${update.current_slug} target_entity=${update.target_slug}`);
  }

  if (dryRun) {
    console.log('[repair:rehearsal:entities] DRY-RUN complete. Use --apply to perform updates.');
    return;
  }

  // 6. Perform Supabase updates in APPLY mode
  // A. Update match if necessary
  if (matchRow.home_team_entity_id !== canonicalHome.id || matchRow.away_team_entity_id !== canonicalAway.id) {
    const { error: updateMatchErr } = await supabase
      .from('matches')
      .update({
        home_team_entity_id: canonicalHome.id,
        away_team_entity_id: canonicalAway.id,
      })
      .eq('id', matchRow.id);
    if (updateMatchErr) throw updateMatchErr;
    console.log('[repair:rehearsal:entities] ✅ Rehearsal match entity links updated');
  } else {
    console.log('[repair:rehearsal:entities] Match already linked to canonical entities');
  }

  // B. Update articles if necessary
  for (const update of articleUpdates) {
    const { error: updateArtErr } = await supabase
      .from('wiki_articles')
      .update({ entity_id: update.target_entity_id })
      .eq('id', update.id);
    if (updateArtErr) throw updateArtErr;
    console.log(`[repair:rehearsal:entities] ✅ Relinked ${update.key} to ${update.target_slug}`);
  }

  // 7. Verify after apply
  const { data: verifiedMatch } = await supabase
    .from('matches')
    .select('home_team_entity_id, away_team_entity_id')
    .eq('id', matchRow.id)
    .single();

  if (verifiedMatch?.home_team_entity_id !== canonicalHome.id || verifiedMatch?.away_team_entity_id !== canonicalAway.id) {
    throw new Error('Verification failed: match team links were not successfully updated');
  }

  const { data: verifiedArticles } = await supabase
    .from('wiki_articles')
    .select('wiki_code, page_title, entity_id')
    .in('wiki_code', wikiCodes)
    .in('page_title', pageTitles);

  const verifiedArticleMap = new Map(verifiedArticles?.map(a => [articleKey(a), a]) ?? []);
  for (const expectedArticle of expectedArticles) {
    const key = articleKey(expectedArticle);
    const dbArt = verifiedArticleMap.get(key);
    const canonicalEnt = entityBySlug.get(expectedArticle.entity_slug);
    if (dbArt?.entity_id !== canonicalEnt?.id) {
      throw new Error(`Verification failed: article ${key} is not correctly linked to ${expectedArticle.entity_slug}`);
    }
  }

  console.log('[repair:rehearsal:entities] ✅ All verifications PASSED. Relinking successful!');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
