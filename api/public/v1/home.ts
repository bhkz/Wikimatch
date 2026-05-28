import { createServerSupabaseClient } from "../../_lib/supabase.js";
import { setPublicCache, sendServerError, type ApiRequest, type ApiResponse } from "../../_lib/http.js";
import { countDistinctMonitoredLanguages, storyTypeLabel } from "../../_lib/labels.js";

export default async function handler(
  _request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    // 1. Fetch live stories (strictly disabled for now)
    const stories: any[] = [];

    // 2. Fetch counts for stats (toujours réels, jamais inventés)
    const { count: tracesCount } = await supabase
      .from("revision_traces")
      .select("*", { count: "exact", head: true });

    const storiesCount = 0;

    const monitoredLanguages = await countDistinctMonitoredLanguages(supabase);

    // 3. Fetch next match
    const { data: matchData } = await supabase
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
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    // 4. Map stories. Les labels publics viennent de story_type, jamais de
    // "HISTOIRE IA" ou autre attribut éditorial fabriqué.
    const featuredStory = stories[0] ? {
      id: stories[0].id,
      slug: stories[0].slug,
      type: stories[0].story_type || "language_divergence",
      label: storyTypeLabel(stories[0].story_type),
      title: stories[0].title,
      excerpt: stories[0].excerpt || "",
      languages: [],
      publishedAt: stories[0].published_at || new Date().toISOString(),
      sourceCount: 0,
      isDemo: false,
    } : null;

    const latestStories = stories.slice(1).map((s) => ({
      id: s.id,
      slug: s.slug,
      type: s.story_type || "language_divergence",
      label: storyTypeLabel(s.story_type),
      title: s.title,
      excerpt: s.excerpt || "",
      languages: [],
      publishedAt: s.published_at || new Date().toISOString(),
      sourceCount: 0,
      isDemo: false,
      heroImage: s.share_image_url || undefined,
    }));

    // 5. Map match. Si pas de match en base, on renvoie null — le frontend
    // affiche un empty state honnête au lieu d'un placeholder maquillé.
    const nextMatch = matchData ? {
      id: matchData.id,
      teams: [
        matchData.home?.canonical_label ?? "À confirmer",
        matchData.away?.canonical_label ?? "À confirmer",
      ],
      stage: matchData.stage_label || "Phase de groupes",
      dateLabel: matchData.scheduled_at
        ? new Date(matchData.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).toUpperCase()
        : "DATE À CONFIRMER",
      timeLabel: matchData.scheduled_at
        ? new Date(matchData.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) + " CEST"
        : "",
      status: matchData.status || "upcoming",
      trackedPagesLabel: "Match · Clubs · Compétition (FR · EN · ES)",
      isDemo: false,
    } : null;

    const observatoryData = {
      capturedEdits: tracesCount ?? 0,
      monitoredLanguages,
      publishedStories: storiesCount ?? 0,
      noiseFilteredPercent: 0,
    };

    setPublicCache(response, 60);
    response.status(200).json({
      featuredStory,
      latestStories,
      nextMatch,
      observatoryData,
    });
  } catch (error) {
    console.error("Home page api failed:", error);
    sendServerError(response);
  }
}
