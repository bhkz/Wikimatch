import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { firstQueryValue, sendNotFound, sendServerError, setPublicCache, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";
import { entityTypeLabel, languageLabel, storyTypeLabel } from "../../../_lib/labels.js";

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

    // ── Tracked subjects ─────────────────────────────────────────────
    // match_watchlist → wiki_articles → entities
    const { data: watchlistData } = await supabase
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

    const watchlist = watchlistData ?? [];

    const trackedSubjects = watchlist.map((w: any) => {
      const art = w.article;
      const ent = art?.entity;
      return {
        id: w.id,
        role: w.role || "match",
        entitySlug: ent?.slug || "",
        entityLabel: ent?.canonical_label || art?.page_title || "",
        entityType: ent?.type || art?.article_type || "match",
        entityTypeLabel: entityTypeLabel(ent?.type),
        languageCode: (art?.language_code || "").toUpperCase(),
        languageLabel: `Édition ${languageLabel(art?.language_code)}`,
        articleLabel: `${ent?.canonical_label || art?.page_title || ""} · édition ${languageLabel(art?.language_code)}`,
        monitoringReason: w.monitoring_reason || "",
        isDemo: false,
      };
    });

    // Collect article IDs linked to this match for downstream queries
    const articleIds = watchlist
      .map((w: any) => w.article?.id)
      .filter((id: unknown): id is string => !!id);

    // ── Timeline (revision traces) ──────────────────────────────────
    let timeline: any[] = [];
    if (articleIds.length > 0) {
      const { data: tracesData } = await supabase
        .from("revision_traces")
        .select(`
          id,
          observed_at,
          revision_comment_sanitized,
          change_kind,
          public_status,
          section_label,
          source_diff_url,
          article:wiki_articles!inner (
            page_title,
            language_code,
            article_type,
            entity:entities!inner (
              canonical_label,
              slug
            )
          )
        `)
        .in("article_id", articleIds)
        .order("observed_at", { ascending: false });

      timeline = (tracesData ?? []).map((t: any) => {
        const art = t.article;
        const ent = art?.entity;
        return {
          id: t.id,
          observedAt: t.observed_at,
          observedAtLabel: new Date(t.observed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          languageCode: (art?.language_code || "").toUpperCase(),
          languageLabel: `Édition ${languageLabel(art?.language_code)}`,
          entityLabel: ent?.canonical_label || art?.page_title || "",
          sectionLabel: t.section_label || "Présentation",
          changeKind: t.change_kind || "formatting",
          publicStatus: t.public_status || "minor",
          summary: t.revision_comment_sanitized || "Modification de l'article Wikipédia.",
          sourceDiffUrl: t.source_diff_url || undefined,
          isDemo: false,
        };
      });
    }

    // ── Stories ──────────────────────────────────────────────────────
    // story_evidence → revision_traces (article_id in articleIds) → published_stories
    let stories: any[] = [];
    if (articleIds.length > 0) {
      // First get trace IDs for this match's articles
      const { data: traceIdsData } = await supabase
        .from("revision_traces")
        .select("id")
        .in("article_id", articleIds);

      const traceIds = (traceIdsData ?? []).map((t: any) => t.id).filter(Boolean);

      if (traceIds.length > 0) {
        const { data: evidenceData } = await supabase
          .from("story_evidence")
          .select(`
            story:published_stories!inner (
              id,
              slug,
              title,
              story_type,
              excerpt,
              published_at,
              languages,
              source_count
            )
          `)
          .in("trace_id", traceIds);

        // Deduplicate stories (multiple evidence rows may point to the same story)
        const storyMap = new Map<string, any>();
        for (const ev of evidenceData ?? []) {
          const s = ev.story as any;
          if (s?.id && !storyMap.has(s.id)) {
            storyMap.set(s.id, s);
          }
        }

        stories = Array.from(storyMap.values()).map((s: any) => ({
          id: s.id,
          slug: s.slug,
          type: s.story_type || "language_divergence",
          label: storyTypeLabel(s.story_type),
          title: s.title || "",
          excerpt: s.excerpt || "",
          languages: s.languages || [],
          publishedAt: s.published_at || "",
          sourceCount: s.source_count || 1,
          isDemo: false,
        }));
      }
    }

    // ── Comparison (cross-language excerpts) ─────────────────────────
    let comparisonItems: any[] = [];
    if (articleIds.length > 0) {
      const { data: excerptData } = await supabase
        .from("public_trace_excerpts")
        .select(`
          trace_id,
          public_added_excerpt,
          translated_excerpt,
          safe_to_publish,
          trace:revision_traces!inner (
            observed_at,
            section_label,
            change_kind,
            article:wiki_articles!inner (
              language_code,
              page_title,
              entity:entities!inner (
                canonical_label
              )
            )
          )
        `)
        .eq("safe_to_publish", true)
        .in("trace.article_id", articleIds);

      comparisonItems = (excerptData ?? []).map((exc: any) => {
        const trace = exc.trace;
        const art = trace?.article;
        const ent = art?.entity;
        return {
          traceId: exc.trace_id,
          languageCode: (art?.language_code || "").toUpperCase(),
          languageLabel: `Édition ${languageLabel(art?.language_code)}`,
          entityLabel: ent?.canonical_label || art?.page_title || "",
          sectionLabel: trace?.section_label || "Présentation",
          addedText: exc.public_added_excerpt || undefined,
          translatedText: exc.translated_excerpt || undefined,
          isDemo: false,
        };
      });
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
      stories,
      timeline,
      comparison: {
        id: `comparison-${match.id}`,
        topicLabel: "Comparaison cross-langue",
        explanation: "",
        items: comparisonItems,
        isDemo: false,
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

