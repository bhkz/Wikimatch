import type { ApiRequest, ApiResponse } from "../../../_lib/http.js";
import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { setPublicCache, sendServerError } from "../../../_lib/http.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  if (request.method && request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({
      error: { code: "method_not_allowed", message: "Only GET is allowed." },
    });
    return;
  }

  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch counts for stats
    const { count: countAllTraces } = await supabase
      .from("revision_traces")
      .select("*", { count: "exact", head: true });

    const { count: countSubstantive } = await supabase
      .from("revision_traces")
      .select("*", { count: "exact", head: true })
      .in("public_status", ["public_substantive", "linked_to_story"]);

    const { count: countStories } = await supabase
      .from("published_stories")
      .select("*", { count: "exact", head: true })
      .in("publication_status", ["published", "corrected"]);

    const { count: countMonitored } = await supabase
      .from("wiki_articles")
      .select("*", { count: "exact", head: true })
      .eq("monitoring_enabled", true);

    const stats = {
      observedTraces: countAllTraces ?? 0,
      substantialChanges: countSubstantive ?? 0,
      publishedStoryLinks: countStories ?? 0,
      monitoredArticles: countMonitored ?? 0,
      isDemo: false,
    };

    // 2. Static pipeline steps matching methodology definitions
    const pipelineSteps = [
      {
        id: "observe",
        label: "Observer",
        publicDescription: "Une modification apparaît sur un article suivi.",
        publicStatus: "shown_here"
      },
      {
        id: "read",
        label: "Lire le changement",
        publicDescription: "Le passage ajouté ou retiré devient consultable.",
        publicStatus: "shown_here"
      },
      {
        id: "qualify",
        label: "Qualifier",
        publicDescription: "Le changement est décrit comme mineur, substantiel ou relié à une histoire publiée.",
        publicStatus: "shown_here"
      },
      {
        id: "compare",
        label: "Comparer",
        publicDescription: "Lorsque plusieurs articles sont concernés, leurs contenus peuvent être comparés.",
        publicStatus: "published_elsewhere"
      },
      {
        id: "publish",
        label: "Publier",
        publicDescription: "Seules les histoires validées rejoignent le Magazine public.",
        publicStatus: "published_elsewhere"
      },
      {
        id: "review",
        label: "Revue interne",
        publicDescription: "La validation éditoriale détaillée appartient au futur Desk privé.",
        publicStatus: "private_later"
      }
    ];

    // 3. Fetch monitored articles
    const { data: articlesData, error: articlesError } = await supabase
      .from("wiki_articles")
      .select(`
        id,
        language_code,
        page_title,
        article_type,
        entity:entities!inner (
          canonical_label
        )
      `)
      .eq("monitoring_enabled", true);

    if (articlesError) throw articlesError;

    const languageMap: Record<string, string> = {
      en: "anglaise",
      fr: "française",
      es: "espagnole",
      ja: "japonaise",
      ar: "arabe",
      pt: "portugaise",
      de: "allemande",
      ko: "coréenne",
    };

    const getLanguageLabel = (code: string) => languageMap[code.toLowerCase()] || code;

    const getMonitoringReason = (type: string, name: string) => {
      switch (type) {
        case "tournament": return `Suivi global des modifications du tournoi ${name}.`;
        case "team": return `Suivi des sélections nationales et de l'effectif pour ${name}.`;
        case "player": return `Documentation des performances et incidents de ${name}.`;
        case "match": return `Suivi des événements de jeu et résumés pour le match ${name}.`;
        default: return `Surveillance de l'article Wikipédia pour ${name}.`;
      }
    };

    const trackedArticles = (articlesData ?? []).map((art: any) => ({
      id: art.id,
      languageCode: art.language_code.toUpperCase(),
      articleLabel: `Article de ${art.entity?.canonical_label || art.page_title} · édition ${getLanguageLabel(art.language_code)}`,
      entityLabel: art.entity?.canonical_label || art.page_title,
      articleType: art.article_type,
      monitoringReason: getMonitoringReason(art.article_type, art.entity?.canonical_label || art.page_title),
      latestStatusLabel: "Suivi en cours",
      isDemo: false
    }));

    // 4. Fetch safe to publish excerpts
    const { data: excerpts, error: excerptsError } = await supabase
      .from("public_trace_excerpts")
      .select(`
        trace_id,
        public_added_excerpt,
        public_removed_excerpt,
        translated_excerpt,
        source_attribution_label,
        source_revision_url,
        license_label,
        trace:revision_traces!inner (
          observed_at,
          section_label,
          public_status,
          change_kind,
          article:wiki_articles!inner (
            article_type,
            page_title,
            language_code,
            entity:entities!inner (
              canonical_label
            )
          )
        )
      `)
      .eq("safe_to_publish", true);

    if (excerptsError) throw excerptsError;

    // Fetch related stories (if any exist) to map links to published story traces
    const { data: storyEvidences } = await supabase
      .from("story_evidence")
      .select(`
        trace_id,
        story:published_stories!inner (
          id,
          title,
          slug
        )
      `)
      .not("trace_id", "is", null);

    const storyMap = new Map();
    if (storyEvidences) {
      for (const ev of storyEvidences) {
        if (ev.trace_id && ev.story) {
          storyMap.set(ev.trace_id, ev.story);
        }
      }
    }

    const formatChangeStatus = (status: string) => {
      if (status === "linked_to_story") return "linked_to_published_story";
      if (status === "public_substantive") return "substantive";
      return "minor";
    };

    const formatChangeStatusLabel = (status: string) => {
      if (status === "linked_to_story") return "RELIÉ À UNE HISTOIRE PUBLIÉE";
      if (status === "public_substantive") return "SUBSTANTIEL · HISTOIRE NON OUVERTE";
      return "MINEUR · NON PUBLIÉ";
    };

    const getObservedAtLabel = (dateStr: string) => {
      const d = new Date(dateStr);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    };

    const traces = (excerpts ?? []).map((exc: any) => {
      const trace = exc.trace;
      const article = trace?.article;
      const entity = article?.entity;
      const story = storyMap.get(exc.trace_id);

      return {
        id: exc.trace_id,
        observedAtLabel: getObservedAtLabel(trace.observed_at),
        languageCode: article.language_code.toUpperCase(),
        languageLabel: `Édition ${getLanguageLabel(article.language_code)}`,
        articleType: article.article_type,
        articleLabel: `Article de ${entity?.canonical_label || article.page_title} · édition ${getLanguageLabel(article.language_code)}`,
        entityLabel: entity?.canonical_label || article.page_title,
        sectionLabel: trace.section_label || "Présentation",
        changeKind: trace.change_kind || "formatting",
        changeStatus: formatChangeStatus(trace.public_status),
        statusLabel: formatChangeStatusLabel(trace.public_status),
        summary: trace.revision_comment_sanitized || "Modification de l'article Wikipédia.",
        addedText: exc.public_added_excerpt || undefined,
        removedText: exc.public_removed_excerpt || undefined,
        translatedText: exc.translated_excerpt || undefined,
        anonymizedContributorLabel: "Contributeur anonymisé",
        relatedStoryId: story?.id,
        relatedStoryTitle: story?.title,
        relatedStoryRoute: story?.slug ? `/story/${story.slug}` : undefined,
        isDemo: false
      };
    });

    // 5. Source chain : pas de fallback hardcodé. La vraie sourceChain sera
    // calculée par le pattern matcher quand au moins une story publiée
    // référence plusieurs traces via story_evidence. En attendant : null
    // → le frontend affiche un empty state honnête.
    const sourceChain = null;

    const pageData = {
      stats,
      pipelineSteps,
      trackedArticles,
      traces,
      sourceChain,
    };

    setPublicCache(response, 30);
    response.status(200).json(pageData);
  } catch (error) {
    console.error("Failed to generate live observatory page data:", error);
    sendServerError(response);
  }
}

