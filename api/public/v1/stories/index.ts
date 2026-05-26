import { createServerSupabaseClient, readPublishedSnapshot } from "../../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch live stories
    const { data: storiesData } = await supabase
      .from("published_stories")
      .select("*")
      .eq("publication_status", "published")
      .order("published_at", { ascending: false });

    // Fallback to snapshot if no stories found in database
    if (!storiesData || storiesData.length === 0) {
      const snapshot = await readPublishedSnapshot("stories");
      if (snapshot) {
        setPublicCache(response, 60);
        response.status(200).json(snapshot);
        return;
      }
    }

    // 2. Fetch matches to count them for stats
    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    // 3. Compute stats
    const totalSources = storiesData.reduce((acc, s) => acc + (s.source_count ?? 1), 0);
    const stats = {
      storyCount: storiesData.length,
      matchCount: matchesCount ?? 0,
      languageCount: 8,
      sourceCount: totalSources,
      isDemo: false
    };

    const filters = [
      { id: "all", label: "Toutes" },
      { id: "fact_entry", label: "Un fait entre", type: "fact_entry" },
      { id: "language_comparison", label: "Plusieurs éditions" },
      { id: "article_instability", label: "Article instable", type: "article_instability" },
      { id: "under_radar", label: "Sous le radar", type: "under_radar" },
      { id: "match_recap", label: "Récaps match", type: "match_recap" }
    ];

    // 4. Map stories to archive items
    const stories = storiesData.map((s) => ({
      id: s.id,
      slug: s.slug,
      type: s.story_type || "language_divergence",
      categoryLabel: (s.label || "HISTOIRE IA").toUpperCase(),
      title: s.title,
      excerpt: s.excerpt || "",
      publishedAtLabel: s.published_at ? new Date(s.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Date inconnue",
      matchLabel: s.meta_match_label || "Tournoi global",
      entityLabel: s.geo_subject_label || "Sujet suivi",
      languages: s.languages || ["FR"],
      sourceCount: s.source_count || 1,
      readingTimeLabel: s.reading_time_minutes ? `${s.reading_time_minutes} min` : "4 min",
      isDemo: false,
      availableDetailRoute: `/story/${s.slug}`
    }));

    // Find a featured story or use the first one
    const featured = stories[0] ? { ...stories[0], isFeatured: true } : null;

    const collection = {
      id: "collection-live",
      label: "COLLECTION LIVE",
      title: "LES DERNIERS ÉVÉNEMENTS COMPARÉS",
      description: "Une collection des cas de divergence, convergence et instabilité qualifiés par l'IA en temps réel.",
      storyIds: stories.slice(0, 3).map((s) => s.id),
      isDemo: false
    };

    setPublicCache(response, 30);
    response.status(200).json({
      stats,
      featured,
      filters,
      stories,
      collection
    });
  } catch (error) {
    console.error("Stories Archive API failed:", error);
    sendServerError(response);
  }
}
