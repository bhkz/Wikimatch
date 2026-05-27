/**
 * Seed wiki_articles + entities depuis un JSON.
 *
 * Usage :
 *   npm run seed:watchlist -- --live             # dry-run watchlist live
 *   npm run seed:watchlist -- --live --apply     # write live watchlist to Supabase
 *   npm run seed:watchlist -- --file <path>      # dry-run custom JSON
 *   npm run seed:watchlist -- --file <path> --apply
 *   npm run seed:watchlist -- --file <path> --monitoring-disabled
 *   npm run seed:watchlist -- --file <path> --monitoring-disabled --apply
 *
 * Le format JSON est documenté dans worker/seeds/wc26-watchlist.live.json.
 * En mode générique actif, l'application utilise des upserts idempotents.
 * En mode `--monitoring-disabled`, l'application n'insère que les entités et articles absents afin de préserver toute couverture existante.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type SeedEntity = {
  slug: string;
  type: "player" | "team" | "coach" | "match" | "stadium" | "tournament" | "referee";
  canonical_label: string;
  wikidata_qid: string | null;
  subject_geography_label: string | null;
  subject_latitude: number | null;
  subject_longitude: number | null;
};

type SeedArticle = {
  entity_slug: string;
  wiki_code: string;
  language_code: string;
  page_title: string;
  canonical_url: string;
  article_type: "player" | "team" | "match" | "tournament" | "stadium" | "referee";
};

type SeedFile = {
  entities: SeedEntity[];
  articles: SeedArticle[];
};

function parseArgs(argv: string[]): { filePath: string; apply: boolean; monitoringEnabled: boolean } {
  let filePath = "worker/seeds/wc26-watchlist.live.json";
  let apply = false;
  let monitoringEnabled = true;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--live") {
      filePath = "worker/seeds/wc26-watchlist.live.json";
    } else if (arg === "--file") {
      filePath = argv[i + 1] ?? filePath;
      i += 1;
    } else if (arg === "--apply") {
      apply = true;
    } else if (arg === "--monitoring-disabled") {
      monitoringEnabled = false;
    }
  }
  return { filePath, apply, monitoringEnabled };
}

function validateSeed(seed: SeedFile): void {
  if (!Array.isArray(seed.entities) || seed.entities.length === 0) {
    throw new Error("Seed must contain at least one entity");
  }
  if (!Array.isArray(seed.articles) || seed.articles.length === 0) {
    throw new Error("Seed must contain at least one article");
  }

  const entitySlugs = new Set<string>();
  for (const entity of seed.entities) {
    if (!entity.slug || typeof entity.slug !== "string") {
      throw new Error("Each entity must have a non-empty slug");
    }
    if (entitySlugs.has(entity.slug)) {
      throw new Error(`Duplicate entity.slug detected: ${entity.slug}`);
    }
    entitySlugs.add(entity.slug);
  }

  const articleKeys = new Set<string>();
  for (const article of seed.articles) {
    if (!article.entity_slug || typeof article.entity_slug !== "string") {
      throw new Error("Each article must have a non-empty entity_slug");
    }
    if (!entitySlugs.has(article.entity_slug)) {
      throw new Error(`Article references unknown entity_slug: ${article.entity_slug}`);
    }
    if (!article.wiki_code || typeof article.wiki_code !== "string") {
      throw new Error("Each article must have a non-empty wiki_code");
    }
    if (!article.language_code || typeof article.language_code !== "string") {
      throw new Error("Each article must have a non-empty language_code");
    }
    if (!article.page_title || typeof article.page_title !== "string") {
      throw new Error("Each article must have a non-empty page_title");
    }
    if (!article.canonical_url || typeof article.canonical_url !== "string") {
      throw new Error("Each article must have a canonical_url");
    }
    if (!article.canonical_url.startsWith("https://")) {
      throw new Error(`Article canonical_url must start with https://: ${article.canonical_url}`);
    }
    if (!article.article_type || typeof article.article_type !== "string") {
      throw new Error("Each article must have a non-empty article_type");
    }

    const key = `${article.wiki_code}::${article.page_title}`;
    if (articleKeys.has(key)) {
      throw new Error(`Duplicate article wiki_code+page_title detected: ${key}`);
    }
    articleKeys.add(key);
  }
}

function summarizeEntity(entity: SeedEntity): string {
  return `[seed:watchlist] entity slug=${entity.slug} type=${entity.type}`;
}

function summarizeArticle(article: SeedArticle): string {
  return `[seed:watchlist] article wiki_code=${article.wiki_code} page_title=${article.page_title} entity_slug=${article.entity_slug}`;
}

function createSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("--apply requires SUPABASE_URL and SUPABASE_SERVICE_KEY to be set");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function main() {
  const { filePath, apply, monitoringEnabled } = parseArgs(process.argv.slice(2));
  console.log(`[seed:watchlist] file=${filePath}`);

  const seedPath = new URL(`../${filePath}`, import.meta.url);
  const seedRaw = JSON.parse(await readFile(seedPath, "utf8")) as SeedFile & { _comment?: string };
  const seed: SeedFile = { entities: seedRaw.entities, articles: seedRaw.articles };

  validateSeed(seed);

  console.log(`[seed:watchlist] entities=${seed.entities.length}`);
  console.log(`[seed:watchlist] articles=${seed.articles.length}`);
  console.log(`[seed:watchlist] mode=${apply ? "APPLY" : "DRY_RUN"}`);
  if (monitoringEnabled) {
    console.log("[seed:watchlist] monitoring_enabled=true");
  } else {
    console.log("[seed:watchlist] new_articles_monitoring_enabled=false");
    console.log("[seed:watchlist] existing_articles_monitoring_policy=preserve_on_apply");
  }

  if (!apply) {
    for (const entity of seed.entities) {
      console.log(summarizeEntity(entity));
    }
    for (const article of seed.articles) {
      console.log(summarizeArticle(article));
    }
    console.log("[seed:watchlist] DRY-RUN complete. Use --apply to write to Supabase.");
    return;
  }

  // Load local environment variables only when an explicit database write is requested.
  await import("dotenv/config");
  const supabase = createSupabaseClient();

  if (monitoringEnabled) {
    const { data: entities, error: entityError } = await supabase
      .from("entities")
      .upsert(seed.entities, { onConflict: "slug" })
      .select("id, slug");
    if (entityError) throw entityError;

    const entityIdBySlug = new Map((entities ?? []).map((entity) => [entity.slug, entity.id]));
    const articleRows = seed.articles.map((article) => {
      const entityId = entityIdBySlug.get(article.entity_slug);
      if (!entityId) {
        throw new Error(`Missing seeded entity for article slug ${article.entity_slug}`);
      }
      return {
        entity_id: entityId,
        wiki_code: article.wiki_code,
        language_code: article.language_code,
        page_title: article.page_title,
        canonical_url: article.canonical_url,
        article_type: article.article_type,
        monitoring_enabled: true,
      };
    });

    const { error: articleError } = await supabase
      .from("wiki_articles")
      .upsert(articleRows, { onConflict: "wiki_code,page_title" });
    if (articleError) throw articleError;

    console.log(`[seed:watchlist] mode=APPLY`);
    console.log(`[seed:watchlist] ✅ ${seed.entities.length} entities upserted`);
    console.log(`[seed:watchlist] ✅ ${seed.articles.length} monitored wiki articles upserted`);
    return;
  }

  const seedEntitySlugs = seed.entities.map((entity) => entity.slug);
  const { data: existingEntities, error: existingEntitiesError } = await supabase
    .from("entities")
    .select("id, slug")
    .in("slug", seedEntitySlugs);
  if (existingEntitiesError) throw existingEntitiesError;

  const existingEntitySlugs = new Set((existingEntities ?? []).map((entity) => entity.slug));
  const missingEntities = seed.entities.filter((entity) => !existingEntitySlugs.has(entity.slug));

  let insertedEntities: Array<{ id: string; slug: string }> = [];
  if (missingEntities.length > 0) {
    const { data: inserted, error: insertEntitiesError } = await supabase
      .from("entities")
      .insert(missingEntities)
      .select("id, slug");
    if (insertEntitiesError) throw insertEntitiesError;
    insertedEntities = inserted ?? [];
  }

  const allEntities = [...(existingEntities ?? []), ...insertedEntities];
  const entityIdBySlug = new Map((allEntities ?? []).map((entity) => [entity.slug, entity.id]));
  if (entityIdBySlug.size !== seed.entities.length) {
    throw new Error(`Expected ${seed.entities.length} entity IDs after insert/read, got ${entityIdBySlug.size}`);
  }

  const articleKey = (article: { wiki_code: string; page_title: string }) => `${article.wiki_code}::${article.page_title}`;
  const expectedArticleKeys = new Set(seed.articles.map(articleKey));
  const wikiCodes = Array.from(new Set(seed.articles.map((article) => article.wiki_code)));
  const pageTitles = Array.from(new Set(seed.articles.map((article) => article.page_title)));

  const { data: existingArticles, error: existingArticlesError } = await supabase
    .from("wiki_articles")
    .select("wiki_code, page_title")
    .in("wiki_code", wikiCodes)
    .in("page_title", pageTitles);
  if (existingArticlesError) throw existingArticlesError;

  const existingArticleKeys = new Set(
    (existingArticles ?? [])
      .map((row) => articleKey(row))
      .filter((key) => expectedArticleKeys.has(key))
  );

  const newArticles = seed.articles.filter((article) => !existingArticleKeys.has(articleKey(article)));
  const newArticleRows = newArticles.map((article) => {
    const entityId = entityIdBySlug.get(article.entity_slug);
    if (!entityId) {
      throw new Error(`Missing seeded entity for article slug ${article.entity_slug}`);
    }
    return {
      entity_id: entityId,
      wiki_code: article.wiki_code,
      language_code: article.language_code,
      page_title: article.page_title,
      canonical_url: article.canonical_url,
      article_type: article.article_type,
      monitoring_enabled: false,
    };
  });

  if (newArticleRows.length > 0) {
    const { error: insertArticlesError } = await supabase
      .from("wiki_articles")
      .insert(newArticleRows);
    if (insertArticlesError) throw insertArticlesError;
  }

  console.log(`[seed:watchlist] mode=APPLY`);
  console.log(`[seed:watchlist] existing_entities_untouched=${existingEntitySlugs.size}`);
  console.log(`[seed:watchlist] new_entities_inserted=${missingEntities.length}`);
  console.log(`[seed:watchlist] existing_articles_untouched=${existingArticleKeys.size}`);
  console.log(`[seed:watchlist] new_articles_inserted=${newArticleRows.length}`);
  console.log(`[seed:watchlist] ✅ ${seed.entities.length} entities prepared`);
  console.log(`[seed:watchlist] ✅ ${newArticleRows.length} new wiki articles inserted with monitoring_enabled=false`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
