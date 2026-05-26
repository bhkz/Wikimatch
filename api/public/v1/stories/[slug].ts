import { createServerSupabaseClient, readPublishedSnapshot } from "../../../_lib/supabase.js";
import { firstQueryValue, sendNotFound, sendServerError, setPublicCache, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";

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

    // 1. Try to fetch from the live relational table published_stories
    const { data: story } = await supabase
      .from("published_stories")
      .select("*")
      .eq("slug", slug)
      .eq("publication_status", "published")
      .maybeSingle();

    // 2. If found, let's build the detail object dynamically!
    if (story) {
      const responsePayload = {
        story: {
          id: story.id,
          slug: story.slug,
          type: story.story_type || "language_divergence",
          categoryLabel: (story.label || "HISTOIRE IA").toUpperCase(),
          title: story.title,
          subtitle: story.excerpt || "",
          publishedAt: story.published_at ? new Date(story.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Récemment",
          matchLabel: story.meta_match_label || "Tournoi global",
          matchStage: "Phase de groupes",
          eventLabel: story.geo_subject_label || "Sujet suivi",
          languages: story.languages || ["FR"],
          isDemo: false,
          observedSummary: story.content || "",
          interpretationSummary: story.excerpt || "",
          limitationSummary: "Cette analyse décrit les versions comparées de Wikipédia observées en direct. Elle respecte la neutralité et ne présuppose aucun parti pris national.",
          languageStates: story.detail_language_states_payload || [],
          timeline: story.detail_timeline_payload || [],
          relatedStoryIds: []
        }
      };

      setPublicCache(response, 30);
      response.status(200).json(responsePayload);
      return;
    }

    // 3. Fallback to pre-seeded snapshot in the database if not found in relation tables
    const snapshot = await readPublishedSnapshot(`story:${slug}`);
    if (snapshot) {
      setPublicCache(response, 60);
      response.status(200).json({ story: snapshot });
      return;
    }

    sendNotFound(response);
  } catch (error) {
    console.error("Story Detail API failed:", error);
    sendServerError(response);
  }
}
