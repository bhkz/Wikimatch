/**
 * Activer ou désactiver explicitement les 12 articles de la répétition PSG — Arsenal.
 *
 * Le worker charge sa liste d'articles surveillés au démarrage.
 * Après activation des articles, il faudra démarrer ou redémarrer le worker.
 *
 * `--enable --apply` capture d'abord l'état initial localement, puis active les 12 articles.
 * `--disable --apply` restaure l'état initial capturé, sans désactiver les articles qui étaient déjà actifs.
 * Arrêter le worker arrête immédiatement la collecte en cours.
 * Après restauration, un éventuel redémarrage du worker recharge l'état restauré.
 *
 * Note : le snapshot local de l'état initial est ignoré par Git et non commité.
 */

import { readFile, writeFile, mkdir, unlink, access } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedArticle = {
  wiki_code: string;
  page_title: string;
};

type SeedFile = {
  entities: unknown[];
  articles: Array<SeedArticle & { entity_slug: string; language_code: string; canonical_url: string; article_type: string }>;
};

type MonitoringBaseline = {
  captured_at: string;
  articles: Array<{
    id: string;
    wiki_code: string;
    page_title: string;
    monitoring_enabled: boolean;
  }>;
};

const BASELINE_PATH = ".rehearsal-state/ucl-final-2026-monitoring-baseline.json";

function parseArgs(argv: string[]): { mode: "enable" | "disable"; apply: boolean } {
  const enable = argv.includes("--enable");
  const disable = argv.includes("--disable");
  const apply = argv.includes("--apply");

  if (enable === disable) {
    throw new Error("Exactly one of --enable or --disable is required");
  }

  return {
    mode: enable ? "enable" : "disable",
    apply,
  };
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

async function baselineExists(): Promise<boolean> {
  try {
    await access(BASELINE_PATH);
    return true;
  } catch {
    return false;
  }
}

async function saveBaseline(articles: Array<{ id: string; wiki_code: string; page_title: string; monitoring_enabled: boolean }>) {
  const baseline: MonitoringBaseline = {
    captured_at: new Date().toISOString(),
    articles,
  };
  await mkdir(dirname(BASELINE_PATH), { recursive: true });
  await writeFile(BASELINE_PATH, JSON.stringify(baseline, null, 2));
}

async function loadBaseline(): Promise<MonitoringBaseline> {
  const raw = JSON.parse(await readFile(BASELINE_PATH, "utf8")) as MonitoringBaseline;
  return raw;
}

async function deleteBaseline() {
  await unlink(BASELINE_PATH);
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

  const validatedArticles = matchingRows
    .map((row) => {
      const idStr = typeof row.id === "string" ? row.id : String(row.id);
      if (idStr.length === 0) throw new Error(`Invalid article ID for ${formatArticleKey(row)}`);
      return {
        id: idStr,
        wiki_code: row.wiki_code,
        page_title: row.page_title,
        monitoring_enabled: Boolean(row.monitoring_enabled),
      };
    });

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

  if (!targetEnabled) {
    if (!apply) {
      const baseline = await loadBaseline();
      const baselineByKey = new Map(baseline.articles.map((a) => [`${a.wiki_code}::${a.page_title}`, a]));

      for (const expected of expectedArticles) {
        const key = formatArticleKey(expected);
        const current = foundByKey.get(key);
        const target = baselineByKey.get(key);
        const currentVal = current ? String(current.monitoring_enabled) : "MISSING";
        const targetVal = target ? String(target.monitoring_enabled) : "UNKNOWN";
        console.log(`[monitor:rehearsal] ${expected.wiki_code}:${expected.page_title} current=${currentVal} restore_target=${targetVal}`);
      }
      console.log("[monitor:rehearsal] DRY-RUN restore complete. Use --disable --apply to restore the captured baseline.");
      return;
    }

    const baseline = await loadBaseline();
    const baselineByKey = new Map(baseline.articles.map((a) => [`${a.wiki_code}::${a.page_title}`, a]));

    for (const article of validatedArticles) {
      const key = `${article.wiki_code}::${article.page_title}`;
      const baselineArticle = baselineByKey.get(key);
      if (!baselineArticle) {
        throw new Error(`Article ${key} missing from baseline snapshot`);
      }
      if (baselineArticle.id !== article.id) {
        throw new Error(`ID mismatch for ${key}: baseline has ${baselineArticle.id}, found ${article.id}`);
      }
    }

    const idsToEnable = validatedArticles
      .filter((a) => {
        const key = `${a.wiki_code}::${a.page_title}`;
        const baseline = baselineByKey.get(key);
        return baseline && baseline.monitoring_enabled;
      })
      .map((a) => a.id);

    const idsToDisable = validatedArticles
      .filter((a) => {
        const key = `${a.wiki_code}::${a.page_title}`;
        const baseline = baselineByKey.get(key);
        return baseline && !baseline.monitoring_enabled;
      })
      .map((a) => a.id);

    if (idsToEnable.length > 0) {
      const { error: enableError } = await supabase
        .from("wiki_articles")
        .update({ monitoring_enabled: true })
        .in("id", idsToEnable);
      if (enableError) throw enableError;
    }

    if (idsToDisable.length > 0) {
      const { error: disableError } = await supabase
        .from("wiki_articles")
        .update({ monitoring_enabled: false })
        .in("id", idsToDisable);
      if (disableError) throw disableError;
    }

    await deleteBaseline();
    console.log("[monitor:rehearsal] ✅ baseline restored");
    console.log(`[monitor:rehearsal] baseline_removed=${BASELINE_PATH}`);
    return;
  }

  if (!apply) {
    console.log("[monitor:rehearsal] DRY-RUN enable complete. --enable --apply will capture a local baseline before updating Supabase.");
    return;
  }

  if (await baselineExists()) {
    throw new Error(
      "Baseline already exists. Restore or remove it manually only after investigation; refusing to overwrite initial monitoring state."
    );
  }

  await saveBaseline(validatedArticles);
  console.log(`[monitor:rehearsal] baseline_saved=${BASELINE_PATH}`);

  const { error: updateError } = await supabase
    .from("wiki_articles")
    .update({ monitoring_enabled: true })
    .in("id", validatedArticles.map((a) => a.id));

  if (updateError) throw updateError;

  console.log(`[monitor:rehearsal] ✅ 12 articles updated to monitoring_enabled=true`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
