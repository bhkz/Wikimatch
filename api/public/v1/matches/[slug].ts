import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import {
  firstQueryValue,
  sendNotFound,
  sendServerError,
  setPublicCache,
  type ApiRequest,
  type ApiResponse,
} from "../../../_lib/http.js";
import { entityTypeLabel, storyTypeLabel } from "../../../_lib/labels.js";
import {
  PUBLISHABLE_STATUSES,
  REHEARSAL_LEVEL2_METHODOLOGY_VERSION,
  REHEARSAL_LEVEL2_PIPELINE,
  REHEARSAL_LEVEL2_STORY_TYPE,
  REHEARSAL_MATCH_SLUG,
  buildObservationCard,
  evidencePassesGate,
  storyRowPassesGate,
  type PublicAutomaticObservationCard,
} from "../_lib/publicLevel2Observation.js";

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

    // On récupère l'ensemble du watchlist du match (sans filtrer enabled)
    // pour pouvoir distinguer le périmètre « sélectionné » (toutes les lignes)
    // du périmètre « armé » (lignes enabled=true). Le frontend a uniquement
    // besoin du second pour les sujets suivis affichés.
    const { data: watchlistData, error: watchlistError } = await supabase
      .from("match_watchlist")
      .select(`
        id,
        role,
        monitoring_reason,
        enabled,
        article:wiki_articles!inner (
          id,
          page_title,
          language_code,
          wiki_code,
          canonical_url,
          article_type,
          monitoring_enabled,
          entity:entities!inner (
            id,
            slug,
            canonical_label,
            type
          )
        )
      `)
      .eq("match_id", match.id);
    if (watchlistError) throw watchlistError;

    const fullWatchlist = watchlistData ?? [];
    const watchlist = fullWatchlist.filter((row: any) => row.enabled === true);
    const articleIds = watchlist
      .map((row: any) => row.article?.id)
      .filter((id: unknown): id is string => Boolean(id));

    const trackedSubjects = watchlist.map((row: any) => {
      const article = row.article;
      const entity = article?.entity;
      return {
        id: row.id,
        type: row.role === "home_team" || row.role === "away_team" ? "team" : row.role,
        role: row.role,
        label: entity?.canonical_label || article?.page_title || "",
        reason: row.monitoring_reason || entityTypeLabel(entity?.type),
        languageCode: (article?.language_code || "").toUpperCase(),
        pageTitle: article?.page_title || "",
        canonicalUrl: article?.canonical_url || "",
        wikiCode: article?.wiki_code || "",
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

    // Gate niveau 2 strict (cf. _lib/publicLevel2Observation.ts) — mêmes
    // critères que /api/public/v1/stories. On filtre côté SQL sur ce qu'on
    // peut filtrer simplement, puis on revalide via storyRowPassesGate +
    // evidencePassesGate sur ce qui nécessite un join evidence/article.
    const { data: storiesData, error: storiesError } = await supabase
      .from("published_stories")
      .select(
        `
        id,
        slug,
        story_type,
        title,
        excerpt,
        languages,
        source_count,
        published_at,
        publication_status,
        retracted_at,
        published_by_pipeline,
        methodology_version,
        match:matches!published_stories_match_id_fkey (
          slug
        ),
        evidence:story_evidence (
          id,
          trace:revision_traces!story_evidence_trace_id_fkey (
            source_diff_url,
            source_revision_url,
            article:wiki_articles!inner (
              language_code
            )
          )
        )
      `,
      )
      .eq("match_id", match.id)
      .in("publication_status", PUBLISHABLE_STATUSES as unknown as string[])
      .is("retracted_at", null)
      .eq("story_type", REHEARSAL_LEVEL2_STORY_TYPE)
      .eq("published_by_pipeline", REHEARSAL_LEVEL2_PIPELINE)
      .eq("methodology_version", REHEARSAL_LEVEL2_METHODOLOGY_VERSION)
      .not("slug", "like", "demo-%")
      .order("published_at", { ascending: false });
    if (storiesError) throw storiesError;

    const automaticObservations: PublicAutomaticObservationCard[] = [];
    for (const story of (storiesData ?? []) as any[]) {
      if (!storyRowPassesGate(story)) continue;
      const evRows = (story.evidence ?? []).map((ev: any) => ({
        url: ev.trace?.source_diff_url || ev.trace?.source_revision_url || "",
        languageCode: ev.trace?.article?.language_code || "",
      }));
      if (!evidencePassesGate(evRows)) continue;
      const conformingCount = evRows.filter(
        (r: { url: string }) => r.url.length > 0,
      ).length;
      automaticObservations.push(buildObservationCard(story, conformingCount));
    }

    // Légacy : la grille « stories du match » existante reste un canal
    // distinct ; on la garde vide tant qu'aucune story conforme legacy
    // (non niveau 2) ne devrait y apparaître. Cela évite que la page
    // match expose, par effet de bord, des stories non niveau 2.
    const stories: Array<{
      id: string;
      slug: string;
      type: string;
      categoryLabel: string;
      title: string;
      excerpt: string;
      languages: string[];
      timeLabel: string;
      statusLabel: string;
      isDemo: boolean;
      featured: boolean;
    }> = [];
    void storyTypeLabel;

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

    // === Rehearsal monitoring ============================================
    // On expose un état OBSERVABLE de préparation de la collecte pour le
    // match canonique uniquement. « armé » signifie strictement : les pages
    // role='match' sélectionnées ont match_watchlist.enabled=true ET
    // wiki_articles.monitoring_enabled=true. Cela ne prouve PAS que le
    // worker tourne ni qu'aucune erreur n'est survenue (aucun heartbeat
    // public n'existe dans le schéma). Cf. STORY_PUBLICATION_CONTRACT.md
    // §8.3 et UCL_FINAL_2026_REHEARSAL.md.
    let rehearsalMonitoring: {
      selectedMatchArticles: number;
      enabledMatchArticles: number;
      isFullyArmed: boolean;
      lastTraceObservedAt: string | null;
      recentTraceCount: number | null;
    } | null = null;

    if (match.slug === REHEARSAL_MATCH_SLUG) {
      const matchRoleRows = fullWatchlist.filter(
        (row: any) => row.role === "match",
      );
      const selectedMatchArticles = matchRoleRows.length;
      const enabledMatchArticles = matchRoleRows.filter(
        (row: any) =>
          row.enabled === true && row.article?.monitoring_enabled === true,
      ).length;
      const isFullyArmed =
        selectedMatchArticles > 0 && enabledMatchArticles === selectedMatchArticles;

      let lastTraceObservedAt: string | null = null;
      let recentTraceCount: number | null = null;
      const matchRoleArticleIds = matchRoleRows
        .map((row: any) => row.article?.id)
        .filter((id: unknown): id is string => Boolean(id));
      if (matchRoleArticleIds.length > 0) {
        const { data: lastTrace, error: lastTraceErr } = await supabase
          .from("revision_traces")
          .select("observed_at")
          .in("article_id", matchRoleArticleIds)
          .order("observed_at", { ascending: false })
          .limit(1);
        if (lastTraceErr) throw lastTraceErr;
        lastTraceObservedAt = lastTrace?.[0]?.observed_at ?? null;

        const { count, error: countErr } = await supabase
          .from("revision_traces")
          .select("id", { count: "exact", head: true })
          .in("article_id", matchRoleArticleIds);
        if (countErr) throw countErr;
        recentTraceCount = typeof count === "number" ? count : null;
      }

      rehearsalMonitoring = {
        selectedMatchArticles,
        enabledMatchArticles,
        isFullyArmed,
        lastTraceObservedAt,
        recentTraceCount,
      };
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
      automaticObservations,
      rehearsalMonitoring,
    };

    setPublicCache(response, 30);
    response.status(200).json(responsePayload);
  } catch (error) {
    console.error("Match Detail API failed:", error);
    sendServerError(response);
  }
}
