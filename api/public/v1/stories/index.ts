import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import {
  setPublicCache,
  sendServerError,
  type ApiRequest,
  type ApiResponse,
} from "../../../_lib/http.js";
import { countDistinctMonitoredLanguages, storyTypeLabel } from "../../../_lib/labels.js";

const REHEARSAL_MATCH_SLUG = "2026-ucl-final-psg-arsenal";
const PUBLISHABLE_STORY_TYPES = new Set<string>(["language_convergence"]);

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Liste stricte des observations niveau 2 conformes :
    //    auto_template_v1 + story_type whitelisté + match canonique + ≥2 sources.
    const { data: storiesData, error: storiesError } = await supabase
      .from("published_stories")
      .select(
        `
        id,
        slug,
        story_type,
        title,
        excerpt,
        languages,
        source_count,
        published_at,
        publication_status,
        retracted_at,
        published_by_pipeline,
        match:matches!published_stories_match_id_fkey (
          slug
        )
      `,
      )
      .in("publication_status", ["published", "corrected"])
      .is("retracted_at", null)
      .eq("published_by_pipeline", "auto_template_v1")
      .order("published_at", { ascending: false });
    if (storiesError) throw storiesError;

    const conformingStories = (storiesData ?? []).filter((s: any) => {
      if (!PUBLISHABLE_STORY_TYPES.has(s.story_type)) return false;
      const matchSlug = s.match?.slug ?? null;
      return matchSlug === REHEARSAL_MATCH_SLUG;
    });

    // 2. Real counts only
    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    const monitoredLanguages = await countDistinctMonitoredLanguages(supabase);

    const totalSourceCount = conformingStories.reduce(
      (acc: number, s: any) => acc + (s.source_count ?? 0),
      0,
    );

    const stats = {
      storyCount: conformingStories.length,
      matchCount: matchesCount ?? 0,
      languageCount: monitoredLanguages,
      sourceCount: totalSourceCount,
      isDemo: false,
    };

    const filters = [
      { id: "all", label: "Toutes" },
      { id: "language_convergence", label: "Observation automatique", type: "language_convergence" },
    ];

    const stories = conformingStories.map((s: any) => ({
      id: s.id,
      slug: s.slug,
      type: s.story_type,
      categoryLabel: storyTypeLabel(s.story_type),
      badgeLabel: "OBSERVATION AUTOMATIQUE · SOURCES CONSULTABLES",
      title: s.title,
      excerpt: s.excerpt || "",
      publishedAtLabel: s.published_at
        ? new Date(s.published_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "",
      matchLabel: undefined,
      entityLabel: undefined,
      languages: Array.isArray(s.languages) ? s.languages : [],
      sourceCount: s.source_count ?? 0,
      readingTimeLabel: "",
      isDemo: false,
      availableDetailRoute: `/observation/${s.slug}`,
    }));

    const featured = stories[0] ? { ...stories[0], isFeatured: true } : null;
    const collection = null;

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
