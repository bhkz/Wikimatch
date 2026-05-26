import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { firstQueryValue, sendNotFound, sendServerError, setPublicCache, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";
import { storyTypeLabel } from "../../../_lib/labels.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  const slug = firstQueryValue(request.query?.slug);
  if (!slug) {
    sendNotFound(response);
    return;
  }

  try {
    const supabase = createServerSupabaseClient();

    const { data: story } = await supabase
      .from("published_stories")
      .select("*")
      .eq("slug", slug)
      .in("publication_status", ["published", "corrected"])
      .maybeSingle();

    if (!story) {
      // Pas de fallback snapshot.
      sendNotFound(response);
      return;
    }

    const responsePayload = {
      story: {
        id: story.id,
        slug: story.slug,
        type: story.story_type || "language_divergence",
        categoryLabel: storyTypeLabel(story.story_type),
        title: story.title,
        subtitle: story.excerpt || "",
        publishedAt: story.published_at
          ? new Date(story.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : "",
        matchLabel: story.meta_match_label || "",
        matchStage: story.meta_match_stage || "",
        eventLabel: story.geo_subject_label || "",
        languages: story.languages || [],
        isDemo: false,
        observedSummary: story.observation_text || "",
        interpretationSummary: story.interpretation_text || "",
        limitationSummary: story.limitation_text || "",
        languageStates: story.detail_language_states_payload || [],
        timeline: story.detail_timeline_payload || [],
        relatedStoryIds: [],
      },
    };

    setPublicCache(response, 30);
    response.status(200).json(responsePayload);
  } catch (error) {
    console.error("Story Detail API failed:", error);
    sendServerError(response);
  }
}
