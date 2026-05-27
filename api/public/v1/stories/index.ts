import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";
import { countDistinctMonitoredLanguages, storyTypeLabel } from "../../../_lib/labels.js";

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch live stories. Pas de fallback snapshot.
    const { data: storiesData } = await supabase
      .from("published_stories")
      .select("*")
      .in("publication_status", ["published", "corrected"])
      .is("retracted_at", null)
      .not("slug", "like", "demo-%")
      .order("published_at", { ascending: false });

    const rawStories = storiesData ?? [];

    // 2. Real counts only
    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    const monitoredLanguages = await countDistinctMonitoredLanguages(supabase);

    const totalSources = rawStories.reduce((acc, s) => acc + (s.source_count ?? 1), 0);
    const stats = {
      storyCount: rawStories.length,
      matchCount: matchesCount ?? 0,
      languageCount: monitoredLanguages,
      sourceCount: totalSources,
      isDemo: false,
    };

    const filters = [
      { id: "all", label: "Toutes" },
      { id: "fact_entry", label: "Un fait entre", type: "fact_entry" },
      { id: "language_comparison", label: "Plusieurs éditions" },
      { id: "article_instability", label: "Article instable", type: "article_instability" },
      { id: "under_radar", label: "Sous le radar", type: "under_radar" },
      { id: "match_recap", label: "Récaps match", type: "match_recap" },
    ];

    // 3. Map stories. Labels publics ← story_type (neutre).
    const stories = rawStories.map((s) => ({
      id: s.id,
      slug: s.slug,
      type: s.story_type || "language_divergence",
      categoryLabel: storyTypeLabel(s.story_type),
      title: s.title,
      excerpt: s.excerpt || "",
      publishedAtLabel: s.published_at
        ? new Date(s.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : "",
      matchLabel: s.meta_match_label || undefined,
      entityLabel: s.geo_subject_label || undefined,
      languages: [],
      sourceCount: 0,
      readingTimeLabel: s.reading_time_minutes ? `${s.reading_time_minutes} min` : "",
      isDemo: false,
      availableDetailRoute: `/story/${s.slug}`,
    }));

    const featured = stories[0] ? { ...stories[0], isFeatured: true } : null;

    // Collection : null tant que la DB n'expose pas une collection éditoriale
    // validée. Pas de copy hardcodée "qualifiés par l'IA en temps réel".
    const collection = stories.length >= 3
      ? {
          id: "collection-recent",
          label: "DERNIERS RÉCITS",
          title: "DERNIÈRES HISTOIRES PUBLIÉES",
          description: "Les récits les plus récents publiés par WikiMatch à partir de traces observées.",
          storyIds: stories.slice(0, 3).map((s) => s.id),
          isDemo: false,
        }
      : null;

    setPublicCache(response, 30);
    response.status(200).json({
      stats,
      featured,
      filters,
      stories,
      collection,
    });
  } catch (error) {
    console.error("Stories Archive API failed:", error);
    sendServerError(response);
  }
}
