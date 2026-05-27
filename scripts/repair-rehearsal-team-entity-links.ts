/**
 * Repair script to safely relink matches and articles linked to duplicate
 * rehearsal entities (paris-saint-germain, arsenal) back to the canonical
 * historical team entities (paris-saint-germain-fc, arsenal-fc).
 *
 * It also safely audits and repairs incorrect metadata (wikidata_qid) on the
 * canonical Arsenal team entity if it matches the observed incorrect QID.
 *
 * This script is sequential, idempotent, and designed to fail-closed on any
 * concurrency changes or unexpected state.
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

const EXPECTED_TEAM_QIDS = {
  home: 'Q483020',
  away: 'Q9617',
};

const OBSERVED_INCORRECT_CANONICAL_QIDS = {
  away: 'Q9610',
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
    .select('id, slug, type, canonical_label, wikidata_qid')
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

  // 4. Verify QID for PSG
  if (canonicalHome.wikidata_qid !== EXPECTED_TEAM_QIDS.home) {
    throw new Error(
      `Canonical PSG entity has unexpected Wikidata QID: ${canonicalHome.wikidata_qid ?? 'null'}`
    );
  }

  // 5. Verify QID for Arsenal
  const canonicalAwayNeedsQidRepair = canonicalAway.wikidata_qid === OBSERVED_INCORRECT_CANONICAL_QIDS.away;
  if (!canonicalAwayNeedsQidRepair && canonicalAway.wikidata_qid !== EXPECTED_TEAM_QIDS.away) {
    throw new Error(
      `Canonical Arsenal entity has completely unexpected Wikidata QID in database: ${canonicalAway.wikidata_qid ?? 'null'}. ` +
      `Aborting automatic repair.`
    );
  }

  console.log(`[repair:rehearsal:entities] canonical_home_qid current=${canonicalHome.wikidata_qid} expected=${EXPECTED_TEAM_QIDS.home}`);
  console.log(`[repair:rehearsal:entities] canonical_away_qid current=${canonicalAway.wikidata_qid} expected=${EXPECTED_TEAM_QIDS.away} repair_required=${canonicalAwayNeedsQidRepair}`);

  // 6. Verify Match current links before any repair (fail-closed guard)
  const allowedHomeEntityIds = new Set([canonicalHome.id, duplicateHome.id]);
  const allowedAwayEntityIds = new Set([canonicalAway.id, duplicateAway.id]);

  if (!allowedHomeEntityIds.has(matchRow.home_team_entity_id)) {
    throw new Error(
      `Safety alert! Match home team points to an unexpected entity ID. Refusing automatic repair.`
    );
  }
  if (!allowedAwayEntityIds.has(matchRow.away_team_entity_id)) {
    throw new Error(
      `Safety alert! Match away team points to an unexpected entity ID. Refusing automatic repair.`
    );
  }

  // 7. Fetch 12 expected articles from seed JSON
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

  // 8. Determine required match & article changes
  let homeTeamSlugCurrent = 'UNKNOWN';
  if (matchRow.home_team_entity_id === canonicalHome.id) homeTeamSlugCurrent = canonicalHome.slug;
  if (matchRow.home_team_entity_id === duplicateHome.id) homeTeamSlugCurrent = duplicateHome.slug;

  let awayTeamSlugCurrent = 'UNKNOWN';
  if (matchRow.away_team_entity_id === canonicalAway.id) awayTeamSlugCurrent = canonicalAway.slug;
  if (matchRow.away_team_entity_id === duplicateAway.id) awayTeamSlugCurrent = duplicateAway.slug;

  console.log(`[repair:rehearsal:entities] match_home current=${homeTeamSlugCurrent} target=${canonicalHome.slug}`);
  console.log(`[repair:rehearsal:entities] match_away current=${awayTeamSlugCurrent} target=${canonicalAway.slug}`);

  const articleUpdates: Array<{
    id: string;
    source_entity_id: string;
    target_entity_id: string;
    key: string;
    current_slug: string;
    target_slug: string;
  }> = [];

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
        source_entity_id: dbArticle.entity_id,
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

  if (canonicalAwayNeedsQidRepair) {
    console.log(`[repair:rehearsal:entities] entity_metadata_update ${CANONICAL_TEAM_SLUGS.away}.wikidata_qid current=${OBSERVED_INCORRECT_CANONICAL_QIDS.away} target=${EXPECTED_TEAM_QIDS.away}`);
  }

  if (dryRun) {
    console.log('[repair:rehearsal:entities] DRY-RUN complete. Use --apply to perform updates.');
    return;
  }

  // 9. Perform Supabase updates in APPLY mode
  // A. Repair Arsenal QID first if necessary
  if (canonicalAwayNeedsQidRepair) {
    const { data: currentDbAway, error: fetchAwayErr } = await supabase
      .from('entities')
      .select('wikidata_qid')
      .eq('id', canonicalAway.id)
      .single();
    if (fetchAwayErr) throw fetchAwayErr;

    if (currentDbAway.wikidata_qid !== OBSERVED_INCORRECT_CANONICAL_QIDS.away) {
      throw new Error(`Concurrency error: Arsenal QID in DB has changed to ${currentDbAway.wikidata_qid ?? 'null'}. Aborting repair.`);
    }

    const { data: updatedAway, error: qidUpdateErr } = await supabase
      .from('entities')
      .update({ wikidata_qid: EXPECTED_TEAM_QIDS.away })
      .eq('id', canonicalAway.id)
      .eq('wikidata_qid', OBSERVED_INCORRECT_CANONICAL_QIDS.away)
      .select('id, wikidata_qid');

    if (qidUpdateErr) throw qidUpdateErr;

    if (!updatedAway || updatedAway.length !== 1 || updatedAway[0].wikidata_qid !== EXPECTED_TEAM_QIDS.away) {
      throw new Error(
        'Concurrency error: Arsenal QID repair did not update exactly the expected entity. Aborting before match/article relinking.'
      );
    }

    console.log(`[repair:rehearsal:entities] ✅ Canonical Arsenal QID successfully repaired to ${EXPECTED_TEAM_QIDS.away}`);
  }

  // B. Update match if necessary (conditional on previous state)
  if (matchRow.home_team_entity_id !== canonicalHome.id || matchRow.away_team_entity_id !== canonicalAway.id) {
    const { data: updatedMatch, error: updateMatchErr } = await supabase
      .from('matches')
      .update({
        home_team_entity_id: canonicalHome.id,
        away_team_entity_id: canonicalAway.id,
      })
      .eq('id', matchRow.id)
      .eq('home_team_entity_id', matchRow.home_team_entity_id)
      .eq('away_team_entity_id', matchRow.away_team_entity_id)
      .select('id, home_team_entity_id, away_team_entity_id');

    if (updateMatchErr) throw updateMatchErr;

    if (!updatedMatch || updatedMatch.length !== 1) {
      throw new Error(
        'Concurrency error: rehearsal match references changed before repair could be applied. Aborting article relinking.'
      );
    }
    console.log('[repair:rehearsal:entities] ✅ Rehearsal match entity links updated');
  } else {
    console.log('[repair:rehearsal:entities] Match already linked to canonical entities');
  }

  // C. Update articles if necessary (conditional on duplicate slug entity_id)
  for (const update of articleUpdates) {
    const { data: updatedArticles, error: updateArtErr } = await supabase
      .from('wiki_articles')
      .update({ entity_id: update.target_entity_id })
      .eq('id', update.id)
      .eq('entity_id', update.source_entity_id)
      .select('id, entity_id');

    if (updateArtErr) throw updateArtErr;

    if (!updatedArticles || updatedArticles.length !== 1) {
      throw new Error(
        `Concurrency error: article ${update.key} no longer points to the expected duplicate entity. ` +
        `Relinking aborted mid-process.`
      );
    }
    console.log(`[repair:rehearsal:entities] ✅ Relinked ${update.key} to ${update.target_slug}`);
  }

  // 10. Verify after apply
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

  const { data: finalAway, error: finalAwayErr } = await supabase
    .from('entities')
    .select('wikidata_qid')
    .eq('id', canonicalAway.id)
    .single();
  if (finalAwayErr) throw finalAwayErr;
  if (finalAway.wikidata_qid !== EXPECTED_TEAM_QIDS.away) {
    throw new Error('Verification failed: Final canonical Arsenal QID is not ' + EXPECTED_TEAM_QIDS.away);
  }

  console.log('[repair:rehearsal:entities] ✅ All verifications PASSED. Relinking and QID repair successful!');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
