import { createServerSupabaseClient, readPublishedSnapshot } from "../../_lib/supabase.js";
import { setPublicCache, sendServerError, firstQueryValue, type ApiRequest, type ApiResponse } from "../../_lib/http.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();
    const queryStr = firstQueryValue(request.query?.q)?.trim().toLowerCase() || "";

    // 1. Fetch live stats for search header
    const { count: storiesCount } = await supabase
      .from("published_stories")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "published");

    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    const { count: entitiesCount } = await supabase
      .from("entities")
      .select("*", { count: "exact", head: true });

    const { count: tracesCount } = await supabase
      .from("revision_traces")
      .select("*", { count: "exact", head: true });

    const demoStats = {
      indexedStories: storiesCount ?? 0,
      indexedMatches: matchesCount ?? 0,
      indexedSubjects: entitiesCount ?? 0,
      indexedPublicTraces: tracesCount ?? 0,
      isDemo: false
    };

    const suggestions = [
      {
        id: "suggest-live-entities",
        label: "Joueurs & Clubs",
        query: "sélection",
        filter: "entity" as const,
        description: "Rechercher parmi les entités suivies."
      },
      {
        id: "suggest-live-stories",
        label: "Histoires validées",
        query: "divergence",
        filter: "story" as const,
        description: "Retrouver des analyses comparatives de l'IA."
      }
    ];

    // If query is empty, return suggestions and the pre-computed snapshot default results
    if (!queryStr) {
      const snapshot = await readPublishedSnapshot("search");
      if (snapshot) {
        setPublicCache(response, 30);
        response.status(200).json({
          demoStats,
          suggestions: snapshot.suggestions || suggestions,
          allResults: snapshot.allResults || []
        });
        return;
      }
    }

    // 2. Perform live queries on relational tables
    const allResults: any[] = [];

    // Search entities
    const { data: entities } = await supabase
      .from("entities")
      .select("id, slug, canonical_label, type, subject_geography_label")
      .ilike("canonical_label", `%${queryStr}%`)
      .limit(10);

    if (entities) {
      for (const ent of entities) {
        allResults.push({
          id: `entity-${ent.id}`,
          type: "entity",
          title: ent.canonical_label,
          excerpt: `Fiche de suivi pour ${ent.canonical_label} (${ent.type === "player" ? "Joueur" : "Équipe"}).`,
          metadataLabel: `DOSSIER ${ent.type === "player" ? "JOUEUR" : "ÉQUIPE"} · SUIVI LIVE`,
          publicStatusLabel: "SUIVI EN COURS",
          keywords: [ent.canonical_label.toLowerCase(), ent.type, "fiche"],
          route: `/entity/${ent.slug}`,
          available: true,
          isDemo: false
        });
      }
    }

    // Search matches
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
          excerpt: `Dossier de match pour l'affiche ${m.team_a_label} contre ${m.team_b_label} (${m.stage_label || "Tournoi"}).`,
          metadataLabel: "DOSSIER MATCH · SYNTHÈSE LIVE",
          publicStatusLabel: "DOSSIER DISPONIBLE",
          keywords: [m.team_a_label.toLowerCase(), m.team_b_label.toLowerCase(), "match", "dossier"],
          route: `/match/${m.slug}`,
          available: true,
          isDemo: false
        });
      }
    }

    // Search stories
    const { data: stories } = await supabase
      .from("published_stories")
      .select("id, slug, title, excerpt, story_type, label, languages")
      .or(`title.ilike.%${queryStr}%,excerpt.ilike.%${queryStr}%`)
      .eq("publication_status", "published")
      .limit(10);

    if (stories) {
      for (const s of stories) {
        allResults.push({
          id: `story-${s.id}`,
          type: "story",
          subtype: s.story_type || "language_divergence",
          title: s.title,
          excerpt: s.excerpt || "",
          metadataLabel: "HISTOIRE PUBLIÉE · ANALYSE IA",
          languages: s.languages || ["FR"],
          publicStatusLabel: (s.label || "HISTOIRE").toUpperCase(),
          keywords: [s.title.toLowerCase(), "story", "histoire"],
          route: `/story/${s.slug}`,
          available: true,
          isDemo: false
        });
      }
    }

    // If no dynamic matches found, mix in or fallback to snapshot results matching keyword
    if (allResults.length === 0) {
      const snapshot = await readPublishedSnapshot("search");
      if (snapshot && snapshot.allResults) {
        const filteredSnapshotResults = snapshot.allResults.filter((res: any) => 
          res.title.toLowerCase().includes(queryStr) || 
          res.excerpt.toLowerCase().includes(queryStr) ||
          res.keywords.some((k: string) => k.toLowerCase().includes(queryStr))
        );
        allResults.push(...filteredSnapshotResults);
      }
    }

    setPublicCache(response, 10);
    response.status(200).json({
      demoStats,
      suggestions,
      allResults
    });
  } catch (error) {
    console.error("Search API failed:", error);
    sendServerError(response);
  }
}
