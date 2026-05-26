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
  const seedPath = new URL("../worker/seeds/wc26-watchlist.demo.json", import.meta.url);
  const seed = JSON.parse(await readFile(seedPath, "utf8")) as SeedFile;

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

  console.log(`Seeded ${seed.entities.length} entities.`);
  console.log(`Seeded ${seed.articles.length} monitored wiki articles.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
