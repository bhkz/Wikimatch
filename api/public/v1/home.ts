import { createServerSupabaseClient } from "../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../_lib/http.js";
import { countDistinctMonitoredLanguages, storyTypeLabel } from "../../_lib/labels.js";

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch live stories. Pas de fallback snapshot : si la DB est vide,
    // on renvoie un payload honnête avec featuredStory:null / latestStories:[].
    const { data: storiesData } = await supabase
      .from("published_stories")
      .select("*")
      .eq("publication_status", "published")
      .order("published_at", { ascending: false })
      .limit(4);

    const stories = storiesData ?? [];

    // 2. Fetch counts for stats (toujours réels, jamais inventés)
    const { count: tracesCount } = await supabase
      .from("revision_traces")
      .select("*", { count: "exact", head: true });

    const { count: storiesCount } = await supabase
      .from("published_stories")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "published");

    const monitoredLanguages = await countDistinctMonitoredLanguages(supabase);

    // 3. Fetch next match
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    // 4. Map stories. Les labels publics viennent de story_type, jamais de
    // "HISTOIRE IA" ou autre attribut éditorial fabriqué.
    const featuredStory = stories[0] ? {
      id: stories[0].id,
      slug: stories[0].slug,
      type: stories[0].story_type || "language_divergence",
      label: storyTypeLabel(stories[0].story_type),
      title: stories[0].title,
      excerpt: stories[0].excerpt || "",
      languages: stories[0].languages || [],
      publishedAt: stories[0].published_at || new Date().toISOString(),
      sourceCount: stories[0].source_count || 1,
      isDemo: false,
    } : null;

    const latestStories = stories.slice(1).map((s) => ({
      id: s.id,
      slug: s.slug,
      type: s.story_type || "language_divergence",
      label: storyTypeLabel(s.story_type),
      title: s.title,
      excerpt: s.excerpt || "",
      languages: s.languages || [],
      publishedAt: s.published_at || new Date().toISOString(),
      sourceCount: s.source_count || 1,
      isDemo: false,
      heroImage: s.hero_image || undefined,
    }));

    // 5. Map match. Si pas de match en base, on renvoie null — le frontend
    // affiche un empty state honnête au lieu d'un placeholder maquillé.
    const nextMatch = matchData ? {
      id: matchData.id,
      teams: [matchData.team_a_label, matchData.team_b_label],
      stage: matchData.stage_label || "Phase de groupes",
      dateLabel: new Date(matchData.kickoff_time).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
      timeLabel: new Date(matchData.kickoff_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: matchData.status || "upcoming",
      trackedPagesLabel: "Match · Sélections · Joueurs",
      isDemo: false,
    } : null;

    const observatoryData = {
      capturedEdits: tracesCount ?? 0,
      monitoredLanguages,
      publishedStories: storiesCount ?? 0,
      noiseFilteredPercent: 0,
    };

    setPublicCache(response, 60);
    response.status(200).json({
      featuredStory,
      latestStories,
      nextMatch,
      observatoryData,
    });
  } catch (error) {
    console.error("Home page api failed:", error);
    sendServerError(response);
  }
}
