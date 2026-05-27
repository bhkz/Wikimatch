/**
 * Activer ou désactiver explicitement les 12 articles de la répétition PSG — Arsenal.
 *
 * Le worker charge sa liste d'articles surveillés au démarrage.
 * Après activation des articles, il faudra démarrer ou redémarrer le worker.
 * Après désactivation, il faudra aussi redémarrer le worker pour que les articles
 * cessent d'être surveillés en mémoire.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type SeedArticle = {
  wiki_code: string;
  page_title: string;
};

type SeedFile = {
  entities: unknown[];
  articles: Array<SeedArticle & { entity_slug: string; language_code: string; canonical_url: string; article_type: string }>;
};

function parseArgs(argv: string[]): { mode: "enable" | "disable"; apply: boolean } {
  let mode: "enable" | "disable" | null = null;
  let apply = false;

  for (const arg of argv) {
    if (arg === "--enable") {
      mode = "enable";
    } else if (arg === "--disable") {
      mode = "disable";
    } else if (arg === "--apply") {
      apply = true;
    }
  }

  if (!mode) {
    throw new Error("Exactly one of --enable or --disable is required");
  }

  return { mode, apply };
}

function validateSeedFile(seed: SeedFile): Array<SeedArticle> {
  if (!Array.isArray(seed.articles)) {
    throw new Error("Seed JSON must contain an articles array");
  }

  if (seed.articles.length !== 12) {
    throw new Error(`Expected exactly 12 articles in rehearsal watchlist JSON, got ${seed.articles.length}`);
  }

  const articleKeys = new Set<string>();
  const expectedArticles: Array<SeedArticle> = [];

  for (const article of seed.articles) {
    if (!article.wiki_code || !article.page_title) {
      throw new Error("Each article must contain wiki_code and page_title");
    }

    const key = `${article.wiki_code}::${article.page_title}`;
    if (articleKeys.has(key)) {
      throw new Error(`Duplicate article wiki_code+page_title detected: ${key}`);
    }
    articleKeys.add(key);
    expectedArticles.push({ wiki_code: article.wiki_code, page_title: article.page_title });
  }

  return expectedArticles;
}

function formatArticleKey(article: SeedArticle): string {
  return `${article.wiki_code}::${article.page_title}`;
}

function createSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required for Supabase access");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function loadExpectedArticles(): Promise<Array<SeedArticle>> {
  const seedPath = new URL("../worker/seeds/ucl-final-2026-rehearsal.watchlist.json", import.meta.url);
  const raw = JSON.parse(await readFile(seedPath, "utf8")) as SeedFile & { _comment?: string };
  return validateSeedFile(raw);
}

async function main() {
  const { mode, apply } = parseArgs(process.argv.slice(2));
  const targetEnabled = mode === "enable";
  const expectedArticles = await loadExpectedArticles();
  const expectedKeys = new Set(expectedArticles.map(formatArticleKey));

  console.log(`[monitor:rehearsal] mode=${apply ? "APPLY" : "DRY_RUN"}`);
  console.log(`[monitor:rehearsal] target=${mode.toUpperCase()}`);
  console.log(`[monitor:rehearsal] articles_expected=${expectedArticles.length}`);

  await import("dotenv/config");
  const supabase = createSupabaseClient();

  const wikiCodes = Array.from(new Set(expectedArticles.map((article) => article.wiki_code)));
  const { data, error } = await supabase
    .from("wiki_articles")
    .select("id, wiki_code, page_title, monitoring_enabled")
    .in("wiki_code", wikiCodes);

  if (error) throw error;

  const matchingRows = (data ?? []).filter((row) => expectedKeys.has(formatArticleKey(row)));
  const foundByKey = new Map(matchingRows.map((row) => [formatArticleKey(row), row]));

  for (const expected of expectedArticles) {
    const key = formatArticleKey(expected);
    const row = foundByKey.get(key);
    const current = row ? String(row.monitoring_enabled) : "MISSING";
    console.log(`[monitor:rehearsal] ${expected.wiki_code}:${expected.page_title} current=${current} target=${targetEnabled}`);
  }

  console.log(`[monitor:rehearsal] articles_found=${matchingRows.length}`);

  if (matchingRows.length !== expectedArticles.length) {
    throw new Error(`Found ${matchingRows.length} article(s) of ${expectedArticles.length} expected`);
  }

  if (!apply) {
    console.log("[monitor:rehearsal] DRY-RUN complete. Use --apply to update Supabase.");
    return;
  }

  const ids = matchingRows.map((row) => row.id).filter((id): id is number => typeof id === "number");
  if (ids.length !== expectedArticles.length) {
    throw new Error(`Expected ${expectedArticles.length} valid IDs, got ${ids.length}`);
  }

  const { error: updateError } = await supabase
    .from("wiki_articles")
    .update({ monitoring_enabled: targetEnabled })
    .in("id", ids);

  if (updateError) throw updateError;

  console.log(`[monitor:rehearsal] ✅ ${ids.length} articles updated to monitoring_enabled=${targetEnabled}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
