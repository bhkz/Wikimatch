import { createServerSupabaseClient } from "../../_lib/supabase.js";
import { setPublicCache, sendServerError, firstQueryValue, type ApiRequest, type ApiResponse } from "../../_lib/http.js";
import { entityTypeLabel, storyTypeLabel } from "../../_lib/labels.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();
    const queryStr = firstQueryValue(request.query?.q)?.trim().toLowerCase() || "";

    // 1. Real stats for search header — pas de fallback
    const { count: storiesCount } = await supabase
      .from("published_stories")
      .select("*", { count: "exact", head: true })
      .in("publication_status", ["published", "corrected"]);

    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    const { count: entitiesCount } = await supabase
      .from("entities")
      .select("*", { count: "exact", head: true });

    const { count: tracesCount } = await supabase
      .from("public_trace_excerpts")
      .select("trace_id", { count: "exact", head: true })
      .eq("safe_to_publish", true);

    const demoStats = {
      indexedStories: storiesCount ?? 0,
      indexedMatches: matchesCount ?? 0,
      indexedSubjects: entitiesCount ?? 0,
      indexedPublicTraces: tracesCount ?? 0,
      isDemo: false,
    };

    const suggestions = [
      {
        id: "suggest-live-entities",
        label: "Joueurs & Clubs",
        query: "sélection",
        filter: "entity" as const,
        description: "Rechercher parmi les sujets suivis.",
      },
      {
        id: "suggest-live-stories",
        label: "Histoires publiées",
        query: "divergence",
        filter: "story" as const,
        description: "Parcourir les récits publiés par le pipeline automatique.",
      },
    ];

    // 2. Si la requête est vide, on renvoie un index neutre (suggestions +
    // catalogue vide). Pas de fallback snapshot.
    if (!queryStr) {
      setPublicCache(response, 30);
      response.status(200).json({
        demoStats,
        suggestions,
        allResults: [],
      });
      return;
    }

    // 3. Live queries on relational tables. allResults reste vide si rien
    // ne matche — pas de fallback snapshot, pas de copy IA.
    const allResults: any[] = [];

    const { data: entities } = await supabase
      .from("entities")
      .select("id, slug, canonical_label, type, subject_geography_label")
      .ilike("canonical_label", `%${queryStr}%`)
      .limit(10);

    if (entities) {
      for (const ent of entities) {
        const label = entityTypeLabel(ent.type);
        allResults.push({
          id: `entity-${ent.id}`,
          type: "entity",
          title: ent.canonical_label,
          excerpt: `Sujet suivi : ${ent.canonical_label}.`,
          metadataLabel: `DOSSIER ${label}`,
          publicStatusLabel: "SUIVI EN COURS",
          keywords: [ent.canonical_label.toLowerCase(), ent.type, "sujet"],
          route: `/entity/${ent.slug}`,
          available: true,
          isDemo: false,
        });
      }
    }

    const { data: matches } = await supabase
      .from("matches")
      .select("id, slug, team_a_label, team_b_label, stage_label")
      .or(`team_a_label.ilike.%${queryStr}%,team_b_label.ilike.%${queryStr}%`)
      .limit(10);

    if (matches) {
      for (const m of matches) {
        allResults.push({
          id: `match-${m.id}`,
          type: "match",
          title: `${m.team_a_label} — ${m.team_b_label}`,
          excerpt: `Dossier de match : ${m.team_a_label} contre ${m.team_b_label}${m.stage_label ? ` (${m.stage_label})` : ""}.`,
          metadataLabel: "DOSSIER MATCH",
          publicStatusLabel: "DOSSIER DISPONIBLE",
          keywords: [m.team_a_label.toLowerCase(), m.team_b_label.toLowerCase(), "match", "dossier"],
          route: `/match/${m.slug}`,
          available: true,
          isDemo: false,
        });
      }
    }

    const { data: stories } = await supabase
      .from("published_stories")
      .select("id, slug, title, excerpt, story_type, languages")
      .or(`title.ilike.%${queryStr}%,excerpt.ilike.%${queryStr}%`)
      .in("publication_status", ["published", "corrected"])
      .limit(10);

    if (stories) {
      for (const s of stories) {
        allResults.push({
          id: `story-${s.id}`,
          type: "story",
          subtype: s.story_type || "language_divergence",
          title: s.title,
          excerpt: s.excerpt || "",
          metadataLabel: "HISTOIRE PUBLIÉE",
          languages: s.languages || [],
          publicStatusLabel: storyTypeLabel(s.story_type),
          keywords: [s.title.toLowerCase(), "story", "histoire"],
          route: `/story/${s.slug}`,
          available: true,
          isDemo: false,
        });
      }
    }

    setPublicCache(response, 10);
    response.status(200).json({
      demoStats,
      suggestions,
      allResults,
    });
  } catch (error) {
    console.error("Search API failed:", error);
    sendServerError(response);
  }
}
