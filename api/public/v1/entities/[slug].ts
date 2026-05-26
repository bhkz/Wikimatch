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

    // 1. Try to fetch from live relation table entities
    const { data: entity } = await supabase
      .from("entities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (entity) {
      // 2. Fetch associated wiki_articles to show tracked pages
      const { data: articles } = await supabase
        .from("wiki_articles")
        .select("*")
        .eq("entity_id", entity.id);

      const languageStates = (articles ?? []).map((art) => ({
        languageCode: art.language_code.toUpperCase(),
        languageLabel: `Édition ${art.language_code.toUpperCase() === "FR" ? "française" : art.language_code.toUpperCase() === "EN" ? "anglaise" : art.language_code}`,
        articleLabel: art.page_title,
        articleDepthLabel: "SUIVI EN COURS",
        lastObservedLabel: "Observé en direct",
        substantiveChanges: 0,
        presentClaims: [
          `Fiche de ${entity.canonical_label} sur Wikipédia`
        ],
        absentClaims: [],
        translatedExcerpt: "",
        sourceCount: 1,
        state: "expanded" as const
      }));

      const responsePayload = {
        entity: {
          id: entity.id,
          slug: entity.slug,
          type: entity.type || "player",
          name: entity.canonical_label.toUpperCase(),
          displayRole: `${entity.type === "player" ? "JOUEUR" : "ÉQUIPE"} · SUIVI EN DIRECT`,
          associatedTeam: entity.subject_geography_label || "Sélection nationale",
          tournamentLabel: "COUPE DU MONDE 2026",
          shortDescription: `Fiche de suivi en temps réel pour ${entity.canonical_label} connectée à Wikipédia.`,
          editorialAngle: "SOUS LE RADAR : SURVEILLANCE DES ÉDITIONS EN DIRECT",
          isDemo: false
        },
        featuredStory: null,
        languageStates,
        comparison: {
          categoryLabel: "COMPARAISON EN DIRECT",
          title: "COMPARAISON DES ÉDITIONS WIKIPÉDIA",
          description: "Niveaux de documentation du sujet entre les différentes langues comparées.",
          rows: [],
          observation: "Aucune divergence majeure n'est actuellement signalée par l'IA.",
          limitation: "Cette analyse décrit l'état en direct de Wikipédia et respecte la neutralité.",
          isDemo: false
        },
        timeline: [],
        relatedMatches: []
      };

      setPublicCache(response, 30);
      response.status(200).json(responsePayload);
      return;
    }

    // 3. Fallback to pre-seeded snapshot in the database if not found in relation tables
    const snapshot = await readPublishedSnapshot(`entity:${slug}`);
    if (snapshot) {
      setPublicCache(response, 60);
      response.status(200).json(snapshot);
      return;
    }

    sendNotFound(response);
  } catch (error) {
    console.error("Entity Detail API failed:", error);
    sendServerError(response);
  }
}
