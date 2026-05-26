import { createServerSupabaseClient, readPublishedSnapshot } from "../../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch live matches
    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_time", { ascending: true });

    // Fallback to snapshot if no matches found in database
    if (!matchesData || matchesData.length === 0) {
      const snapshot = await readPublishedSnapshot("matches");
      if (snapshot) {
        setPublicCache(response, 60);
        response.status(200).json(snapshot);
        return;
      }
    }

    // 2. Fetch counts for stats
    const { count: storiesCount } = await supabase
      .from("published_stories")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "published");

    const upcomingCount = matchesData.filter(m => m.status === "upcoming").length;
    const completedWithStories = matchesData.filter(m => m.status === "completed_with_stories").length;

    const stats = {
      trackedMatches: matchesData.length,
      dossiersPublished: completedWithStories,
      upcomingMatches: upcomingCount,
      comparedEditions: 8,
      isDemo: false
    };

    // 3. Map matches to card schemas
    const allCards = matchesData.map((m) => ({
      id: m.id,
      slug: m.slug,
      dateLabel: new Date(m.kickoff_time).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
      timeLabel: m.status === "upcoming" 
        ? new Date(m.kickoff_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) 
        : "TERMINÉ · LIVE",
      stage: m.stage || "group_stage",
      stageLabel: m.stage_label || "PHASE DE GROUPES",
      venueLabel: m.venue_label || "STADE HÔTE",
      homeTeam: {
        name: m.team_a_label,
        shortName: m.team_a_label.slice(0, 3).toUpperCase(),
        color: m.team_a_color || "blue"
      },
      awayTeam: {
        name: m.team_b_label,
        shortName: m.team_b_label.slice(0, 3).toUpperCase(),
        color: m.team_b_color || "red"
      },
      status: m.status || "upcoming",
      statusLabel: m.status === "upcoming" ? "À SUIVRE" : "DOSSIER LIVE DISPONIBLE",
      score: m.score || undefined,
      isDemo: false,
      monitoredSubjects: ["Page du match", "Sélections", "Joueurs"],
      storyCount: m.status === "completed_with_stories" ? 1 : 0,
      languagesCompared: ["FR", "EN"],
      storyTypes: ["language_divergence"],
      editorialSummary: m.summary || "Dossier de match surveillé en direct.",
      availableRoute: `/match/${m.slug}`
    }));

    const featured = allCards.find(c => c.status === "completed_with_stories") || allCards[0];

    // Group cards by date
    const groupsMap = new Map<string, typeof allCards>();
    for (const card of allCards) {
      const date = card.dateLabel;
      if (!groupsMap.has(date)) groupsMap.set(date, []);
      groupsMap.get(date)!.push(card);
    }

    const allGroups = Array.from(groupsMap.entries()).map(([dateLabel, groupMatches]) => ({
      id: `group-${dateLabel.replace(/\s/g, "-").toLowerCase()}`,
      dateLabel,
      phaseLabel: groupMatches[0].stageLabel,
      matches: groupMatches
    }));

    setPublicCache(response, 30);
    response.status(200).json({
      stats,
      featured,
      allGroups
    });
  } catch (error) {
    console.error("Matches Calendar API failed:", error);
    sendServerError(response);
  }
}
