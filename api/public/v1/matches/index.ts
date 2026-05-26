import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";
import { countDistinctMonitoredLanguages } from "../../../_lib/labels.js";

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch live matches. Pas de fallback snapshot.
    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_time", { ascending: true });

    const matches = matchesData ?? [];

    // 2. Real counts only
    const monitoredLanguages = await countDistinctMonitoredLanguages(supabase);

    const upcomingCount = matches.filter((m) => m.status === "upcoming").length;
    const completedWithStories = matches.filter((m) => m.status === "completed_with_stories").length;

    const stats = {
      trackedMatches: matches.length,
      dossiersPublished: completedWithStories,
      upcomingMatches: upcomingCount,
      comparedEditions: monitoredLanguages,
      isDemo: false,
    };

    // 3. Map matches to card schemas. Aucun placeholder éditorial fabriqué :
    // les champs vides restent vides.
    const allCards = matches.map((m) => ({
      id: m.id,
      slug: m.slug,
      dateLabel: new Date(m.kickoff_time).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
      timeLabel: m.status === "upcoming"
        ? new Date(m.kickoff_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "TERMINÉ",
      stage: m.stage || "group_stage",
      stageLabel: m.stage_label || "",
      venueLabel: m.venue_label || undefined,
      homeTeam: {
        name: m.team_a_label,
        shortName: (m.team_a_label || "").slice(0, 3).toUpperCase(),
        color: m.team_a_color || "blue",
      },
      awayTeam: {
        name: m.team_b_label,
        shortName: (m.team_b_label || "").slice(0, 3).toUpperCase(),
        color: m.team_b_color || "red",
      },
      status: m.status || "upcoming",
      statusLabel: m.status === "upcoming" ? "À SUIVRE" : m.status === "completed_with_stories" ? "DOSSIER DISPONIBLE" : "TERMINÉ",
      score: m.score || undefined,
      isDemo: false,
      monitoredSubjects: m.monitored_subjects_payload || [],
      storyCount: m.story_count_cached ?? 0,
      languagesCompared: m.languages_compared_payload || [],
      storyTypes: m.story_types_payload || [],
      editorialSummary: m.summary || "",
      availableRoute: `/match/${m.slug}`,
    }));

    const featured = allCards.find((c) => c.status === "completed_with_stories") ?? allCards[0] ?? null;

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
