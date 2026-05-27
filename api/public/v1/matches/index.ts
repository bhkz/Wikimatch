import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";
import { countDistinctMonitoredLanguages } from "../../../_lib/labels.js";

function cardStage(stageLabel: string | null | undefined) {
  const normalized = (stageLabel ?? "").toLowerCase();
  if (normalized.includes("finale") || normalized.includes("final")) return "final";
  if (normalized.includes("demi") || normalized.includes("semi")) return "semi_final";
  if (normalized.includes("quart")) return "quarter_final";
  if (normalized.includes("16")) return "round_of_16";
  if (normalized.includes("32")) return "round_of_32";
  return "group_stage";
}

function statusForCard(status: string, storyCount: number) {
  if (status === "upcoming") return "upcoming";
  if (status === "live") return "observing";
  if (storyCount > 0) return "completed_with_stories";
  return "completed_without_story";
}

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: matchesData, error: matchesError } = await supabase
      .from("matches")
      .select(`
        *,
        home:entities!matches_home_team_entity_id_fkey (
          canonical_label
        ),
        away:entities!matches_away_team_entity_id_fkey (
          canonical_label
        )
      `)
      .not("slug", "like", "demo-%")
      .order("scheduled_at", { ascending: true });

    if (matchesError) throw matchesError;

    const matches = matchesData ?? [];
    const matchIds = matches.map((match) => match.id);
    const storyCountByMatch = new Map<string, number>();
    const storyTypesByMatch = new Map<string, string[]>();

    if (matchIds.length > 0) {
      const { data: storiesData, error: storiesError } = await supabase
        .from("published_stories")
        .select("id, match_id, story_type")
        .in("match_id", matchIds)
        .in("publication_status", ["published", "corrected"])
        .is("retracted_at", null)
        .not("slug", "like", "demo-%");
      if (storiesError) throw storiesError;

      for (const story of storiesData ?? []) {
        if (!story.match_id) continue;
        storyCountByMatch.set(story.match_id, (storyCountByMatch.get(story.match_id) ?? 0) + 1);
        const types = storyTypesByMatch.get(story.match_id) ?? [];
        if (story.story_type && !types.includes(story.story_type)) types.push(story.story_type);
        storyTypesByMatch.set(story.match_id, types);
      }
    }

    const monitoredLanguages = await countDistinctMonitoredLanguages(supabase);

    const allCards = matches.map((match) => {
      const homeName = match.home?.canonical_label ?? "À confirmer";
      const awayName = match.away?.canonical_label ?? "À confirmer";
      const storyCount = storyCountByMatch.get(match.id) ?? 0;
      const status = statusForCard(match.status ?? "upcoming", storyCount);
      const scheduledAt = match.scheduled_at ? new Date(match.scheduled_at) : null;

      return {
        id: match.id,
        slug: match.slug,
        dateLabel: scheduledAt
          ? scheduledAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase()
          : "DATE À CONFIRMER",
        timeLabel: scheduledAt
          ? scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "",
        stage: cardStage(match.stage_label),
        stageLabel: match.stage_label || "",
        homeTeam: {
          name: homeName,
          shortName: homeName.slice(0, 3).toUpperCase(),
          color: "blue",
        },
        awayTeam: {
          name: awayName,
          shortName: awayName.slice(0, 3).toUpperCase(),
          color: "red",
        },
        status,
        statusLabel:
          status === "upcoming"
            ? "À SUIVRE"
            : status === "observing"
              ? "EN OBSERVATION"
              : status === "completed_with_stories"
                ? "DOSSIER DISPONIBLE"
                : "AUCUNE HISTOIRE PUBLIÉE",
        score:
          typeof match.home_score === "number" && typeof match.away_score === "number"
            ? [match.home_score, match.away_score]
            : undefined,
        isDemo: false,
        monitoredSubjects: [],
        storyCount,
        languagesCompared: monitoredLanguages > 0 ? [`${monitoredLanguages} éditions`] : [],
        storyTypes: storyTypesByMatch.get(match.id) ?? [],
        editorialSummary: storyCount > 0
          ? `${storyCount} histoire(s) publiée(s) à partir des traces suivies.`
          : "",
        availableRoute: `/match/${match.slug}`,
      };
    });

    const stats = {
      trackedMatches: matches.length,
      dossiersPublished: allCards.filter((card) => card.status === "completed_with_stories").length,
      upcomingMatches: allCards.filter((card) => card.status === "upcoming").length,
      comparedEditions: monitoredLanguages,
      isDemo: false,
    };

    const groupsMap = new Map<string, typeof allCards>();
    for (const card of allCards) {
      if (!groupsMap.has(card.dateLabel)) groupsMap.set(card.dateLabel, []);
      groupsMap.get(card.dateLabel)!.push(card);
    }

    const allGroups = Array.from(groupsMap.entries()).map(([dateLabel, groupMatches]) => ({
      id: `group-${dateLabel.replace(/\s/g, "-").toLowerCase()}`,
      dateLabel,
      phaseLabel: groupMatches[0]?.stageLabel ?? "",
      matches: groupMatches,
    }));

    const featured = allCards.find((card) => card.status === "completed_with_stories") ?? allCards[0] ?? null;

    setPublicCache(response, 30);
    response.status(200).json({
      stats,
      featured,
      allGroups,
    });
  } catch (error) {
    console.error("Matches Calendar API failed:", error);
    sendServerError(response);
  }
}
