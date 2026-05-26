import { createServerSupabaseClient } from "../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../_lib/http.js";
import { countDistinctMonitoredLanguages, storyTypeLabel } from "../../_lib/labels.js";

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Real stats only — pas de fallback snapshot
    const { count: storiesCount } = await supabase
      .from("published_stories")
      .select("*", { count: "exact", head: true })
      .in("publication_status", ["published", "corrected"]);

    const { count: entitiesCount } = await supabase
      .from("entities")
      .select("*", { count: "exact", head: true });

    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    const monitoredLanguages = await countDistinctMonitoredLanguages(supabase);

    // 2. Fetch published stories to build matrix/timeline dynamically.
    // Si la DB est vide, on renvoie des tableaux vides — le frontend
    // affiche un empty state au lieu d'un placeholder maquillé.
    const { data: stories } = await supabase
      .from("published_stories")
      .select("*")
      .in("publication_status", ["published", "corrected"])
      .order("published_at", { ascending: false });

    const stats = {
      publishedStories: storiesCount ?? 0,
      mappedSubjects: entitiesCount ?? 0,
      comparedEditions: monitoredLanguages,
      documentedMatches: matchesCount ?? 0,
      isDemo: false,
    };

    const legend = [
      {
        type: "fact_entry",
        label: "Un fait entre",
        description: "Un résultat, un record ou un événement majeur apparaît dans Wikipédia.",
        colorToken: "yellow"
      },
      {
        type: "language_convergence",
        label: "Mise à jour convergente",
        description: "Plusieurs éditions intègrent le même fait.",
        colorToken: "blue"
      },
      {
        type: "language_divergence",
        label: "Divergence entre éditions",
        description: "Les articles comparés ne retiennent pas les mêmes éléments.",
        colorToken: "red"
      },
      {
        type: "article_instability",
        label: "Article instable",
        description: "Un passage est ajouté, retiré ou restauré sur un même article.",
        colorToken: "deep-red"
      },
      {
        type: "under_radar",
        label: "Sous le radar",
        description: "Un sujet est documenté dans une édition avant d’apparaître ailleurs.",
        colorToken: "green"
      },
      {
        type: "match_recap",
        label: "Récap match",
        description: "Un dossier rassemble les histoires validées d’une rencontre.",
        colorToken: "navy"
      }
    ];

    // Build timeline and matrix elements from live stories (vides si DB vide)
    const timelineEvents = (stories ?? []).map((s, index) => ({
      id: `timeline-${s.id}`,
      dateLabel: s.published_at ? new Date(s.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).toUpperCase() : "",
      order: index + 1,
      type: s.story_type || "language_divergence",
      categoryLabel: storyTypeLabel(s.story_type),
      title: s.title,
      matchLabel: s.meta_match_label || "",
      languages: s.languages || [],
      route: `/story/${s.slug}`,
      isDemo: false,
    }));

    const matrixRows = (stories ?? []).map((s) => ({
      id: `matrix-${s.id}`,
      storyId: s.id,
      topicLabel: s.title,
      matchLabel: s.meta_match_label || "",
      type: s.story_type || "language_divergence",
      languages: s.matrix_languages_payload || {},
      conclusion: s.excerpt || "",
      route: `/story/${s.slug}`,
      isDemo: false,
    }));

    const anchors = (stories ?? [])
      .filter((s) => s.geo_latitude !== null && s.geo_longitude !== null)
      .map((s) => ({
        id: `anchor-${s.id}`,
        storyId: s.id,
        subjectLabel: s.geo_subject_label || "",
        subjectType: s.geo_subject_type || "player",
        geographyLabel: s.geo_label || "",
        latitude: s.geo_latitude!,
        longitude: s.geo_longitude!,
        type: s.story_type || "language_divergence",
        title: s.title,
        excerpt: s.excerpt || "",
        languages: s.languages || [],
        route: `/story/${s.slug}`,
        isDemo: false,
      }));

    const unmapped = (stories ?? [])
      .filter((s) => s.geo_latitude === null || s.geo_longitude === null)
      .map((s) => ({
        id: s.id,
        label: storyTypeLabel(s.story_type),
        title: s.title,
        reason: "Cette histoire concerne plusieurs sujets ou n'a pas d'ancrage géographique unique.",
        route: `/story/${s.slug}`,
        isDemo: false,
      }));

    setPublicCache(response, 60);
    response.status(200).json({
      stats,
      legend,
      anchors,
      unmapped,
      matrixRows,
      timelineEvents
    });
  } catch (error) {
    console.error("Explorer API failed:", error);
    sendServerError(response);
  }
}
