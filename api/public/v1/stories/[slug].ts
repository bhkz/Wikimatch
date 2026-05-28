import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import {
  firstQueryValue,
  sendNotFound,
  sendServerError,
  setPublicCache,
  type ApiRequest,
  type ApiResponse,
} from "../../../_lib/http.js";
import { storyTypeLabel } from "../../../_lib/labels.js";

const REHEARSAL_MATCH_SLUG = "2026-ucl-final-psg-arsenal";

// Only Level 2 auto-observations are publishable during the rehearsal
// (docs/v2/STORY_PUBLICATION_CONTRACT.md §4 + §7.1). Any other story_type
// goes to manual review; the public detail endpoint returns 404 for them.
const PUBLISHABLE_STORY_TYPES = new Set<string>(["language_convergence"]);

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  const slug = firstQueryValue(request.query?.slug);
  if (!slug || slug.startsWith("demo-")) {
    sendNotFound(response);
    return;
  }

  try {
    const supabase = createServerSupabaseClient();

    const { data: story, error: storyError } = await supabase
      .from("published_stories")
      .select(
        `
        id,
        slug,
        story_type,
        title,
        excerpt,
        observation_text,
        interpretation_text,
        limitation_text,
        languages,
        source_count,
        published_at,
        publication_status,
        retracted_at,
        published_by_pipeline,
        match_id,
        match:matches!published_stories_match_id_fkey (
          slug,
          competition_label,
          stage_label
        )
      `,
      )
      .eq("slug", slug)
      .maybeSingle();

    if (storyError) throw storyError;
    if (!story) {
      sendNotFound(response);
      return;
    }

    // Hard contract conformance (cf. STORY_PUBLICATION_CONTRACT.md §6)
    if (
      story.publication_status !== "published" &&
      story.publication_status !== "corrected"
    ) {
      sendNotFound(response);
      return;
    }
    if (story.retracted_at) {
      sendNotFound(response);
      return;
    }
    if (!PUBLISHABLE_STORY_TYPES.has(story.story_type)) {
      sendNotFound(response);
      return;
    }
    if (story.published_by_pipeline !== "auto_template_v1") {
      sendNotFound(response);
      return;
    }
    const matchSlug = (story.match as any)?.slug ?? null;
    if (matchSlug !== REHEARSAL_MATCH_SLUG) {
      sendNotFound(response);
      return;
    }

    const { data: evidence, error: evidenceError } = await supabase
      .from("story_evidence")
      .select(
        `
        id,
        evidence_type,
        public_label,
        display_order,
        trace:revision_traces!story_evidence_trace_id_fkey (
          source_diff_url,
          source_revision_url,
          revision_timestamp,
          article:wiki_articles!inner (
            language_code,
            page_title
          )
        )
      `,
      )
      .eq("story_id", story.id)
      .order("display_order", { ascending: true });
    if (evidenceError) throw evidenceError;

    const sources = (evidence ?? [])
      .map((row: any) => {
        const trace = row.trace;
        const article = trace?.article;
        const url = trace?.source_diff_url || trace?.source_revision_url || "";
        return {
          id: row.id,
          label: row.public_label || "Trace observée",
          languageCode: (article?.language_code || "").toUpperCase(),
          pageTitle: article?.page_title || "",
          revisionTimestamp: trace?.revision_timestamp || null,
          url,
        };
      })
      .filter((s: any) => s.url);

    if (sources.length < 2) {
      sendNotFound(response);
      return;
    }

    const responsePayload = {
      story: {
        id: story.id,
        slug: story.slug,
        type: story.story_type,
        categoryLabel: storyTypeLabel(story.story_type),
        badgeLabel: "OBSERVATION AUTOMATIQUE · SOURCES CONSULTABLES",
        title: story.title,
        excerpt: story.excerpt || "",
        observation: story.observation_text || "",
        interpretation: story.interpretation_text || "",
        limitation: story.limitation_text || "",
        languages: Array.isArray(story.languages) ? story.languages : [],
        sourceCount: story.source_count ?? sources.length,
        publishedAtLabel: story.published_at
          ? new Date(story.published_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "",
        match: {
          slug: matchSlug,
          competitionLabel: (story.match as any)?.competition_label ?? "",
          stageLabel: (story.match as any)?.stage_label ?? "",
        },
        sources,
      },
    };

    setPublicCache(response, 30);
    response.status(200).json(responsePayload);
  } catch (error) {
    console.error("Story Detail API failed:", error);
    sendServerError(response);
  }
}
