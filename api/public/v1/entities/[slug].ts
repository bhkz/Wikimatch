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

    const { data: entity } = await supabase
      .from("entities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!entity) {
      // Pas de fallback snapshot.
      sendNotFound(response);
      return;
    }

    const { data: articles } = await supabase
      .from("wiki_articles")
      .select("*")
      .eq("entity_id", entity.id);

    const articlesList = articles ?? [];
    const articleIds = articlesList.map((a) => a.id);

    // ── Revision traces for this entity's articles ──────────────────────
    let tracesByArticle = new Map<string, any[]>();
    let allTraces: any[] = [];

    if (articleIds.length > 0) {
      const { data: tracesData } = await supabase
        .from("revision_traces")
        .select("*")
        .in("article_id", articleIds)
        .order("observed_at", { ascending: false });

      allTraces = tracesData ?? [];
      for (const t of allTraces) {
        const list = tracesByArticle.get(t.article_id) ?? [];
        list.push(t);
        tracesByArticle.set(t.article_id, list);
      }
    }

    // ── Public trace excerpts (latest per article) ──────────────────────
    const substantiveTraceIds = allTraces
      .filter((t) => ["public_substantive", "linked_to_story"].includes(t.public_status))
      .map((t) => t.id);

    let excerptsByTrace = new Map<string, any>();

    if (substantiveTraceIds.length > 0) {
      const { data: excerptsData } = await supabase
        .from("public_trace_excerpts")
        .select("*")
        .in("trace_id", substantiveTraceIds)
        .eq("safe_to_publish", true);

      for (const exc of excerptsData ?? []) {
        excerptsByTrace.set(exc.trace_id, exc);
      }
    }

    // ── Build languageStates with real data ──────────────────────────────
    const languageStates = articlesList.map((art) => {
      const artTraces = tracesByArticle.get(art.id) ?? [];
      const substantiveCount = artTraces.filter(
        (t) => ["public_substantive", "linked_to_story"].includes(t.public_status),
      ).length;

      // Latest observed_at
      const latestTrace = artTraces[0]; // already sorted desc
      const lastObservedLabel = latestTrace?.observed_at
        ? new Date(latestTrace.observed_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      // Latest translated excerpt from substantive traces
      const substantiveForArt = artTraces.filter(
        (t) => ["public_substantive", "linked_to_story"].includes(t.public_status),
      );
      let translatedExcerpt = "";
      for (const st of substantiveForArt) {
        const exc = excerptsByTrace.get(st.id);
        if (exc?.translated_excerpt) {
          translatedExcerpt = exc.translated_excerpt;
          break;
        }
      }

      return {
        languageCode: (art.language_code || "").toUpperCase(),
        languageLabel: `Édition ${languageLabel(art.language_code)}`,
        articleLabel: art.page_title,
        articleDepthLabel: "Article surveillé",
        lastObservedLabel,
        substantiveChanges: substantiveCount,
        presentClaims: [],
        absentClaims: [],
        translatedExcerpt,
        sourceCount: 1,
        state: "expanded" as const,
      };
    });

    // ── Timeline from revision_traces ───────────────────────────────────
    // Build a lookup from article_id → article for labels
    const articleMap = new Map<string, any>();
    for (const art of articlesList) {
      articleMap.set(art.id, art);
    }

    const timeline = allTraces.slice(0, 50).map((t) => {
      const art = articleMap.get(t.article_id);
      const langCode = art?.language_code ?? "";
      const observed = new Date(t.observed_at);
      const pad = (n: number) => String(n).padStart(2, "0");

      return {
        id: t.id,
        dateLabel: observed.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).toUpperCase(),
        timeLabel: `${pad(observed.getUTCHours())}:${pad(observed.getUTCMinutes())}`,
        languageCode: langCode.toUpperCase(),
        languageLabel: `Édition ${languageLabel(langCode)}`,
        sectionLabel: t.section_label || "Présentation",
        changeKind: t.change_kind || "formatting",
        summary: t.revision_comment_sanitized || "Modification de l'article Wikipédia.",
        sizeDelta: t.size_delta ?? 0,
        isDemo: false,
      };
    });

    // ── Related matches via match_watchlist ──────────────────────────────
    let relatedMatches: any[] = [];

    if (articleIds.length > 0) {
      const { data: watchlistData } = await supabase
        .from("match_watchlist")
        .select(`
          match_id,
          role,
          match:matches!inner (
            id,
            slug,
            team_a_label,
            team_b_label,
            stage_label,
            kickoff_time,
            status
          )
        `)
        .in("article_id", articleIds)
        .eq("enabled", true);

      // Deduplicate by match id
      const seenMatchIds = new Set<string>();
      for (const row of watchlistData ?? []) {
        const m = row.match as any;
        if (!m || seenMatchIds.has(m.id)) continue;
        seenMatchIds.add(m.id);

        relatedMatches.push({
          id: m.id,
          slug: m.slug,
          teams: [m.team_a_label, m.team_b_label],
          stage: m.stage_label || "",
          dateLabel: new Date(m.kickoff_time).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).toUpperCase(),
          timeLabel: m.status === "upcoming"
            ? new Date(m.kickoff_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : "TERMINÉ",
          status: m.status || "upcoming",
          isDemo: false,
        });
      }
    }

    // ── Featured story via story_evidence → published_stories ───────────
    let featuredStory = null;

    if (substantiveTraceIds.length > 0) {
      const { data: evidenceData } = await supabase
        .from("story_evidence")
        .select(`
          trace_id,
          story:published_stories!inner (
            id,
            slug,
            title,
            story_type,
            excerpt,
            published_at
          )
        `)
        .in("trace_id", substantiveTraceIds);

      // Pick the most recently published story
      let bestStory: any = null;
      for (const ev of evidenceData ?? []) {
        const s = ev.story as any;
        if (!s) continue;
        if (!bestStory || (s.published_at && s.published_at > (bestStory.published_at ?? ""))) {
          bestStory = s;
        }
      }

      if (bestStory) {
        featuredStory = {
          id: bestStory.id,
          slug: bestStory.slug,
          type: bestStory.story_type || "language_divergence",
          label: storyTypeLabel(bestStory.story_type),
          title: bestStory.title,
          excerpt: bestStory.excerpt || "",
          publishedAt: bestStory.published_at || "",
          isDemo: false,
        };
      }
    }

    // ── Comparison rows: cross-language edition comparison ───────────────
    // Group substantive traces by section_label across languages
    const sectionDataByLang = new Map<string, Map<string, { count: number; latestExcerpt: string }>>();
    for (const art of articlesList) {
      const lang = (art.language_code || "").toUpperCase();
      const artTraces = tracesByArticle.get(art.id) ?? [];
      const substantive = artTraces.filter(
        (t) => ["public_substantive", "linked_to_story"].includes(t.public_status),
      );
      for (const t of substantive) {
        const section = t.section_label || "Présentation";
        if (!sectionDataByLang.has(section)) {
          sectionDataByLang.set(section, new Map());
        }
        const langMap = sectionDataByLang.get(section)!;
        const existing = langMap.get(lang) ?? { count: 0, latestExcerpt: "" };
        existing.count += 1;
        if (!existing.latestExcerpt) {
          const exc = excerptsByTrace.get(t.id);
          if (exc?.translated_excerpt) {
            existing.latestExcerpt = exc.translated_excerpt;
          }
        }
        langMap.set(lang, existing);
      }
    }

    const comparisonRows: any[] = [];
    for (const [section, langMap] of sectionDataByLang) {
      const cells = Array.from(langMap.entries()).map(([lang, data]) => ({
        languageCode: lang,
        present: data.count > 0,
        changeCount: data.count,
        excerpt: data.latestExcerpt || undefined,
      }));
      comparisonRows.push({
        factLabel: section,
        cells,
        isDemo: false,
      });
    }

    const typeLabel = entityTypeLabel(entity.type);

    const responsePayload = {
      entity: {
        id: entity.id,
        slug: entity.slug,
        type: entity.type || "player",
        name: (entity.canonical_label || "").toUpperCase(),
        displayRole: typeLabel,
        associatedTeam: entity.subject_geography_label || "",
        tournamentLabel: "",
        shortDescription: "",
        editorialAngle: "",
        isDemo: false,
      },
      featuredStory,
      languageStates,
      comparison: {
        categoryLabel: "COMPARAISON ENTRE ÉDITIONS",
        title: "COMPARAISON DES ÉDITIONS WIKIPÉDIA",
        description: "",
        rows: comparisonRows,
        observation: "",
        limitation: "",
        isDemo: false,
      },
      timeline,
      relatedMatches,
    };

    setPublicCache(response, 30);
    response.status(200).json(responsePayload);
  } catch (error) {
    console.error("Entity Detail API failed:", error);
    sendServerError(response);
  }
}
