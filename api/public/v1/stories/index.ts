import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import {
  setPublicCache,
  sendServerError,
  type ApiRequest,
  type ApiResponse,
} from "../../../_lib/http.js";
import { countDistinctMonitoredLanguages, storyTypeLabel } from "../../../_lib/labels.js";

import {
  REHEARSAL_LEVEL2_METHODOLOGY_VERSION,
  REHEARSAL_LEVEL2_PIPELINE,
  REHEARSAL_LEVEL2_STORY_TYPE,
  REHEARSAL_MATCH_SLUG,
} from "../_lib/publicLevel2Observation.js";

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Liste stricte des observations niveau 2 conformes :
    //    - publication_status published/corrected, non retractée
    //    - story_type language_convergence
    //    - published_by_pipeline auto_template_v1
    //    - methodology_version = rehearsal_level2_auto_v1 (marker explicite)
    //    - rattachée au match canonique
    //    - ≥2 langues distinctes côté evidences (vérifié après fetch)
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
        methodology_version,
        match:matches!published_stories_match_id_fkey (
          slug
        ),
        evidence:story_evidence!story_evidence_story_id_fkey (
          trace:revision_traces!story_evidence_trace_id_fkey (
            source_diff_url,
            source_revision_url,
            article:wiki_articles!inner (
              language_code
            )
          )
        )
      `,
      )
      .in("publication_status", ["published", "corrected"])
      .is("retracted_at", null)
      .eq("published_by_pipeline", REHEARSAL_LEVEL2_PIPELINE)
      .eq("methodology_version", REHEARSAL_LEVEL2_METHODOLOGY_VERSION)
      .eq("story_type", REHEARSAL_LEVEL2_STORY_TYPE)
      .order("published_at", { ascending: false });
    if (storiesError) throw storiesError;

    const conformingStories = (storiesData ?? []).filter((s: any) => {
      if (s.story_type !== REHEARSAL_LEVEL2_STORY_TYPE) return false;
      if (s.match?.slug !== REHEARSAL_MATCH_SLUG) return false;
      const evidences = Array.isArray(s.evidence) ? s.evidence : [];
      const sourcedLanguages = new Set<string>();
      for (const ev of evidences) {
        const trace = ev?.trace;
        if (!trace) continue;
        const url = (trace.source_diff_url || trace.source_revision_url || "").trim();
        if (!url) continue;
        const lang = String(trace.article?.language_code || "").toLowerCase();
        if (lang.length > 0) sourcedLanguages.add(lang);
      }
      return sourcedLanguages.size >= 2;
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
