import { supabase } from "./supabase";
import { buildIndexKey } from "./filters";
import type { MonitoredArticle } from "./types";

export interface LoadedIndex {
  byKey: Map<string, MonitoredArticle>;
  articleCount: number;
}

export async function loadIndex(): Promise<LoadedIndex> {
  const byKey = new Map<string, MonitoredArticle>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("wiki_articles")
      .select("id, entity_id, wiki_code, language_code, page_title, canonical_url, article_type")
      .eq("monitoring_enabled", true)
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`[index] failed to load wiki_articles: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) {
      byKey.set(buildIndexKey(row.wiki_code, row.page_title), {
        articleId: row.id,
        entityId: row.entity_id,
        wikiCode: row.wiki_code,
        languageCode: row.language_code,
        pageTitle: row.page_title,
        canonicalUrl: row.canonical_url,
        articleType: row.article_type,
      });
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`[index] loaded ${byKey.size} monitored wiki articles`);
  return { byKey, articleCount: byKey.size };
}

