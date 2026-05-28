import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import {
  firstQueryValue,
  sendNotFound,
  sendServerError,
  setPublicCache,
  type ApiRequest,
  type ApiResponse,
} from "../../../_lib/http.js";
import { entityTypeLabel, languageLabel, storyTypeLabel } from "../../../_lib/labels.js";

function matchState(status: string | null | undefined) {
  if (status === "live") return "live";
  if (status === "completed") return "post_match";
  return "pre_match";
}

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  const slug = firstQueryValue(request.query?.slug);
  if (!slug || slug.startsWith("demo-")) {
    sendNotFound(response);
    return;
  }

  // The legacy PSG–Arsenal record carries an obsolete broad watchlist.
  // Only the validated 12-article rehearsal record is public for this test.
  const SUPERSEDED_REHEARSAL_MATCH_SLUG = "final-ucl-2026-psg-arsenal";
  if (slug === SUPERSEDED_REHEARSAL_MATCH_SLUG) {
    sendNotFound(response);
    return;
  }

  try {
    const supabase = createServerSupabaseClient();

    const { data: match, error: matchError } = await supabase
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
      .eq("slug", slug)
      .maybeSingle();

    if (matchError) throw matchError;
    if (!match) {
      sendNotFound(response);
      return;
    }

    const { data: watchlistData, error: watchlistError } = await supabase
      .from("match_watchlist")
      .select(`
        id,
        role,
        monitoring_reason,
        article:wiki_articles!inner (
          id,
          page_title,
          language_code,
          article_type,
          entity:entities!inner (
            id,
            slug,
            canonical_label,
            type
          )
        )
      `)
      .eq("match_id", match.id)
      .eq("enabled", true);
    if (watchlistError) throw watchlistError;

    const watchlist = watchlistData ?? [];
    const articleIds = watchlist
      .map((row: any) => row.article?.id)
      .filter((id: unknown): id is string => Boolean(id));

    const trackedSubjects = watchlist.map((row: any) => {
      const article = row.article;
      const entity = article?.entity;
      return {
        id: row.id,
        type: row.role === "home_team" || row.role === "away_team" ? "team" : row.role,
        label: entity?.canonical_label || article?.page_title || "",
        reason: row.monitoring_reason || entityTypeLabel(entity?.type),
        languageCode: article?.language_code || "",
      };
    });

    let timeline: any[] = [];
    if (articleIds.length > 0) {
      const { data: tracesData, error: tracesError } = await supabase
        .from("revision_traces")
        .select(`
          id,
          observed_at,
          revision_comment_sanitized,
          change_kind,
          public_status,
          section_label,
          source_diff_url,
          size_delta,
          article:wiki_articles!inner (
            page_title,
            language_code,
            article_type,
            entity:entities!inner (
              canonical_label
            )
          )
        `)
        .in("article_id", articleIds)
        .order("observed_at", { ascending: false })
        .limit(50);
      if (tracesError) throw tracesError;

      timeline = (tracesData ?? []).map((trace: any) => {
        const article = trace.article;
        const entity = article?.entity;
        const observedAt = trace.observed_at ? new Date(trace.observed_at) : null;
        return {
          id: trace.id,
          time: observedAt
            ? observedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : "",
          type: trace.public_status === "linked_to_story" ? "published_story" : "wikipedia_observation",
          languageCode: (article?.language_code || "").toUpperCase(),
          title: entity?.canonical_label || article?.page_title || "Article suivi",
          description: trace.revision_comment_sanitized || "Modification observée sur Wikipédia.",
          sourceStatus:
            trace.public_status === "linked_to_story"
              ? "published_story"
              : "wikipedia_observation",
        };
      });
    }

    const { data: storiesData, error: storiesError } = await supabase
      .from("published_stories")
      .select("id, slug, story_type, title, excerpt, published_at")
      .eq("match_id", match.id)
      .in("publication_status", ["published", "corrected"])
      .is("retracted_at", null)
      .not("slug", "like", "demo-%")
      .order("published_at", { ascending: false });
    if (storiesError) throw storiesError;

    const stories = (storiesData ?? []).map((story: any) => ({
      id: story.id,
      slug: story.slug,
      type: story.story_type || "match_recap",
      categoryLabel: storyTypeLabel(story.story_type),
      title: story.title || "",
      excerpt: story.excerpt || "",
      languages: [],
      timeLabel: story.published_at
        ? new Date(story.published_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "",
      statusLabel: "HISTOIRE PUBLIÉE",
      isDemo: false,
      featured: false,
    }));

    let comparisonItems: any[] = [];
    if (articleIds.length > 0) {
      const { data: excerptData, error: excerptError } = await supabase
        .from("public_trace_excerpts")
        .select(`
          trace_id,
          public_added_excerpt,
          translated_excerpt,
          trace:revision_traces!inner (
            article_id,
            section_label,
            article:wiki_articles!inner (
              language_code,
              page_title,
              entity:entities!inner (
                canonical_label
              )
            )
          )
        `)
        .eq("safe_to_publish", true);
      if (excerptError) throw excerptError;

      comparisonItems = (excerptData ?? [])
        .filter((excerpt: any) => articleIds.includes(excerpt.trace?.article_id))
        .map((excerpt: any) => {
          const trace = excerpt.trace;
          const article = trace?.article;
          return {
            observation: trace?.section_label || "Passage observé",
            [(article?.language_code || "").toUpperCase()]: excerpt.translated_excerpt || excerpt.public_added_excerpt || "",
          };
        });
    }

    const homeName = match.home?.canonical_label ?? "À confirmer";
    const awayName = match.away?.canonical_label ?? "À confirmer";
    const scheduledAt = match.scheduled_at ? new Date(match.scheduled_at) : null;

    const responsePayload = {
      match: {
        id: match.id,
        slug: match.slug,
        state: matchState(match.status),
        isDemo: false,
        demoLabel: "",
        competitionLabel: match.competition_label || "Coupe du Monde 2026",
        stageLabel: match.stage_label || "",
        dateLabel: scheduledAt
          ? scheduledAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).toUpperCase()
          : "DATE À CONFIRMER",
        timeLabel: scheduledAt
          ? scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) + " CEST"
          : "",
        venueLabel: "",
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
        score:
          typeof match.home_score === "number" && typeof match.away_score === "number"
            ? [match.home_score, match.away_score]
            : undefined,
      },
      recap: {
        id: `recap-${match.id}`,
        score:
          typeof match.home_score === "number" && typeof match.away_score === "number"
            ? [match.home_score, match.away_score]
            : undefined,
        scoreLabel:
          typeof match.home_score === "number" && typeof match.away_score === "number"
            ? `${match.home_score} — ${match.away_score}`
            : undefined,
        summary: stories.length
          ? `${stories.length} histoire(s) publiée(s) autour de ce match.`
          : "Aucune histoire publiée pour ce match à ce stade.",
        isDemo: false,
      },
      stories,
      timeline,
      comparison: {
        eventLabel: "Comparaison entre éditions suivies",
        rows: comparisonItems,
        conclusion: comparisonItems.length
          ? "Des extraits publics modérés existent pour les articles suivis."
          : "Aucune comparaison publique modérée disponible pour ce match.",
        limitation: "Les comparaisons publiques ne sont affichées qu'à partir d'extraits vérifiés.",
      },
      instability: null,
      trackedSubjects,
    };

    setPublicCache(response, 30);
    response.status(200).json(responsePayload);
  } catch (error) {
    console.error("Match Detail API failed:", error);
    sendServerError(response);
  }
}
