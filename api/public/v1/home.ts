import { createServerSupabaseClient, readPublishedSnapshot } from "../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../_lib/http.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch stories
    const { data: storiesData } = await supabase
      .from("published_stories")
      .select("*")
      .eq("publication_status", "published")
      .order("published_at", { ascending: false })
      .limit(4);

    // If there are no real stories in the table, fallback to the snapshot so the demo content is visible
    if (!storiesData || storiesData.length === 0) {
      const snapshot = await readPublishedSnapshot("home");
      if (snapshot) {
        setPublicCache(response, 60);
        response.status(200).json(snapshot);
        return;
      }
    }

    // 2. Fetch counts for stats
    const { count: tracesCount } = await supabase
      .from("revision_traces")
      .select("*", { count: "exact", head: true });

    const { count: articlesCount } = await supabase
      .from("wiki_articles")
      .select("*", { count: "exact", head: true })
      .eq("monitoring_enabled", true);

    const { count: storiesCount } = await supabase
      .from("published_stories")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "published");

    // 3. Fetch next match
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    // 4. Map stories
    const featuredStory = storiesData[0] ? {
      id: storiesData[0].id,
      slug: storiesData[0].slug,
      type: storiesData[0].story_type || "language_divergence",
      label: storiesData[0].label || "HISTOIRE IA",
      title: storiesData[0].title,
      excerpt: storiesData[0].excerpt || "",
      languages: storiesData[0].languages || ["FR"],
      publishedAt: storiesData[0].published_at || new Date().toISOString(),
      sourceCount: storiesData[0].source_count || 1,
      isDemo: false,
    } : null;

    const latestStories = storiesData.slice(1).map((s) => ({
      id: s.id,
      slug: s.slug,
      type: s.story_type || "language_divergence",
      label: s.label || "HISTOIRE IA",
      title: s.title,
      excerpt: s.excerpt || "",
      languages: s.languages || ["FR"],
      publishedAt: s.published_at || new Date().toISOString(),
      sourceCount: s.source_count || 1,
      isDemo: false,
      heroImage: s.hero_image || undefined,
    }));

    // 5. Map match
    const nextMatch = matchData ? {
      id: matchData.id,
      teams: [matchData.team_a_label, matchData.team_b_label],
      stage: matchData.stage_label || "PHASE DE GROUPES",
      dateLabel: new Date(matchData.kickoff_time).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
      timeLabel: new Date(matchData.kickoff_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: matchData.status || "upcoming",
      trackedPagesLabel: "Match · Sélections · Joueurs",
      isDemo: false,
    } : {
      id: "no-match",
      teams: ["AUCUN MATCH INCRUSTÉ"],
      stage: "CALENDRIER",
      dateLabel: "À CONNECTER",
      timeLabel: "--:--",
      status: "upcoming",
      trackedPagesLabel: "Aucun match actif",
      isDemo: false,
    };

    const observatoryData = {
      capturedEdits: tracesCount ?? 0,
      monitoredLanguages: 8,
      publishedStories: storiesCount ?? 0,
      noiseFilteredPercent: 98,
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
