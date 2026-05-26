import { createServerSupabaseClient } from "../../../_lib/supabase.js";
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

    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!match) {
      // Pas de fallback snapshot.
      sendNotFound(response);
      return;
    }

    const responsePayload = {
      match: {
        id: match.id,
        teams: [match.team_a_label, match.team_b_label],
        stage: match.stage_label || "",
        dateLabel: new Date(match.kickoff_time).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
        timeLabel: match.status === "upcoming"
          ? new Date(match.kickoff_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "TERMINÉ",
        status: match.status || "upcoming",
        trackedPagesLabel: "Match · Sélections · Joueurs",
        isDemo: false,
      },
      recap: {
        id: `recap-${match.id}`,
        score: match.score || undefined,
        scoreLabel: match.score ? `${match.score[0]} — ${match.score[1]}` : undefined,
        summary: match.summary || "",
        isDemo: false,
      },
      stories: [],
      timeline: [],
      comparison: {
        id: `comparison-${match.id}`,
        topicLabel: "Comparaison cross-langue",
        explanation: "",
        items: [],
        isDemo: false,
      },
      instability: null,
      trackedSubjects: [],
    };

    setPublicCache(response, 30);
    response.status(200).json(responsePayload);
  } catch (error) {
    console.error("Match Detail API failed:", error);
    sendServerError(response);
  }
}
