import { createServerSupabaseClient } from "../../_lib/supabase.js";
import { setPublicCache, sendServerError, firstQueryValue, type ApiRequest, type ApiResponse } from "../../_lib/http.js";
import { entityTypeLabel, storyTypeLabel } from "../../_lib/labels.js";

function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

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
      .in("publication_status", ["published", "corrected"])
      .is("retracted_at", null)
      .not("slug", "like", "demo-%");

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
        description: "Parcourir les récits publiés par WikiMatch.",
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
      .ilike("canonical_label", `%${escapeIlike(queryStr)}%`)
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
      .select(`
        id,
        slug,
        stage_label,
        home:entities!matches_home_team_entity_id_fkey (
          canonical_label
        ),
        away:entities!matches_away_team_entity_id_fkey (
          canonical_label
        )
      `)
      .not("slug", "like", "demo-%")
      .limit(200);

    if (matches) {
      for (const m of matches.filter((match: any) => {
        const home = String(match.home?.canonical_label ?? "").toLowerCase();
        const away = String(match.away?.canonical_label ?? "").toLowerCase();
        return home.includes(queryStr) || away.includes(queryStr) || String(match.stage_label ?? "").toLowerCase().includes(queryStr);
      }).slice(0, 10) as any[]) {
        const homeName = m.home?.canonical_label ?? "À confirmer";
        const awayName = m.away?.canonical_label ?? "À confirmer";
        allResults.push({
          id: `match-${m.id}`,
          type: "match",
          title: `${homeName} — ${awayName}`,
          excerpt: `Dossier de match : ${homeName} contre ${awayName}${m.stage_label ? ` (${m.stage_label})` : ""}.`,
          metadataLabel: "DOSSIER MATCH",
          publicStatusLabel: "DOSSIER DISPONIBLE",
          keywords: [homeName.toLowerCase(), awayName.toLowerCase(), "match", "dossier"],
          route: `/match/${m.slug}`,
          available: true,
          isDemo: false,
        });
      }
    }

    const { data: stories } = await supabase
      .from("published_stories")
      .select("id, slug, title, excerpt, story_type")
      .or(`title.ilike.%${escapeIlike(queryStr)}%,excerpt.ilike.%${escapeIlike(queryStr)}%`)
      .in("publication_status", ["published", "corrected"])
      .is("retracted_at", null)
      .not("slug", "like", "demo-%")
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
          languages: [],
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
