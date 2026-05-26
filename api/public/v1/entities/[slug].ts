import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { firstQueryValue, sendNotFound, sendServerError, setPublicCache, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";
import { entityTypeLabel, languageLabel } from "../../../_lib/labels.js";

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

    const { data: entity } = await supabase
      .from("entities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!entity) {
      // Pas de fallback snapshot.
      sendNotFound(response);
      return;
    }

    const { data: articles } = await supabase
      .from("wiki_articles")
      .select("*")
      .eq("entity_id", entity.id);

    const languageStates = (articles ?? []).map((art) => ({
      languageCode: (art.language_code || "").toUpperCase(),
      languageLabel: `Édition ${languageLabel(art.language_code)}`,
      articleLabel: art.page_title,
      articleDepthLabel: "Article surveillé",
      lastObservedLabel: "",
      substantiveChanges: 0,
      presentClaims: [],
      absentClaims: [],
      translatedExcerpt: "",
      sourceCount: 1,
      state: "expanded" as const,
    }));

    const typeLabel = entityTypeLabel(entity.type);

    const responsePayload = {
      entity: {
        id: entity.id,
        slug: entity.slug,
        type: entity.type || "player",
        name: (entity.canonical_label || "").toUpperCase(),
        displayRole: typeLabel,
        associatedTeam: entity.subject_geography_label || "",
        tournamentLabel: "",
        shortDescription: "",
        editorialAngle: "",
        isDemo: false,
      },
      featuredStory: null,
      languageStates,
      comparison: {
        categoryLabel: "COMPARAISON ENTRE ÉDITIONS",
        title: "COMPARAISON DES ÉDITIONS WIKIPÉDIA",
        description: "",
        rows: [],
        observation: "",
        limitation: "",
        isDemo: false,
      },
      timeline: [],
      relatedMatches: [],
    };

    setPublicCache(response, 30);
    response.status(200).json(responsePayload);
  } catch (error) {
    console.error("Entity Detail API failed:", error);
    sendServerError(response);
  }
}
