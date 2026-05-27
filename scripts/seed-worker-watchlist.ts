/**
 * Seed wiki_articles + entities depuis un JSON.
 *
 * Usage :
 *   npm run seed:watchlist                          # seed demo (5 entités, 7 articles)
 *   npm run seed:watchlist -- --live                # seed live (16 entités, ~50 articles)
 *   npm run seed:watchlist -- --file <path>         # JSON personnalisé
 *
 * Le format JSON est documenté dans worker/seeds/wc26-watchlist.live.json.
 * Toutes les insertions sont des upserts idempotents : safe à relancer.
 */

import "dotenv/config";
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

function parseArgs(argv: string[]): { filePath: string } {
  let filePath = "worker/seeds/wc26-watchlist.live.json";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--live") {
      filePath = "worker/seeds/wc26-watchlist.live.json";
    } else if (arg === "--file") {
      filePath = argv[i + 1] ?? filePath;
      i += 1;
    }
  }
  return { filePath };
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const { filePath } = parseArgs(process.argv.slice(2));
  console.log(`[seed:watchlist] loading ${filePath}`);

  const seedPath = new URL(`../${filePath}`, import.meta.url);
  const seedRaw = JSON.parse(await readFile(seedPath, "utf8")) as SeedFile & { _comment?: string };
  const seed: SeedFile = { entities: seedRaw.entities, articles: seedRaw.articles };

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

  console.log(`[seed:watchlist] ✅ ${seed.entities.length} entities upserted`);
  console.log(`[seed:watchlist] ✅ ${seed.articles.length} monitored wiki articles upserted`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
