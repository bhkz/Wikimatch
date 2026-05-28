/**
 * Gate public partagé pour les observations automatiques niveau 2 du
 * rehearsal final PSG — Arsenal (cf. docs/v2/STORY_PUBLICATION_CONTRACT.md
 * §7.1 + §11). Ce module est l'unique source de vérité côté API publique
 * pour décider si une story est exposable.
 *
 * Trois endpoints l'utilisent :
 *   - /api/public/v1/stories
 *   - /api/public/v1/stories/[slug]
 *   - /api/public/v1/matches/[slug]   (ajouté Prompt 3C)
 *
 * Règle d'or : ce helper n'élargit jamais la surface publique. Toute
 * modification doit être strictement plus restrictive ou neutre.
 */

export const REHEARSAL_MATCH_SLUG = "2026-ucl-final-psg-arsenal";
export const REHEARSAL_LEVEL2_METHODOLOGY_VERSION = "rehearsal_level2_auto_v1";
export const REHEARSAL_LEVEL2_PIPELINE = "auto_template_v1";
export const REHEARSAL_LEVEL2_STORY_TYPE = "language_convergence";
export const REHEARSAL_LEVEL2_BADGE = "OBSERVATION AUTOMATIQUE · SOURCES CONSULTABLES" as const;

export const PUBLISHABLE_STATUSES = ["published", "corrected"] as const;

/**
 * Source de preuve consommée publiquement : doit avoir une URL Wikimedia
 * réellement consultable et un code langue.
 */
export interface PublicEvidenceRow {
  url: string;
  languageCode: string;
}

/**
 * Vérifie qu'une story attelée à des evidences satisfait toutes les
 * conditions d'exposition publique (≥2 sources URL, ≥2 langues distinctes).
 * À combiner avec `storyRowPassesGate` qui couvre les colonnes scalaires.
 */
export function evidencePassesGate(rows: PublicEvidenceRow[]): boolean {
  const withUrl = rows.filter((r) => r.url && r.url.length > 0);
  if (withUrl.length < 2) return false;
  const distinct = new Set(
    withUrl
      .map((r) => (r.languageCode || "").toLowerCase())
      .filter((c) => c.length > 0),
  );
  return distinct.size >= 2;
}

/**
 * Vérifie les colonnes scalaires de `published_stories` (statut, marker
 * méthodologique, type, pipeline, match canonique).
 *
 * Prend en entrée la story telle que renvoyée par le SELECT API : avec
 * `match.slug` joint via la fk.
 */
export function storyRowPassesGate(row: {
  publication_status?: string | null;
  retracted_at?: string | null;
  story_type?: string | null;
  published_by_pipeline?: string | null;
  methodology_version?: string | null;
  match?: { slug?: string | null } | null;
}): boolean {
  if (!row) return false;
  if (
    row.publication_status !== "published" &&
    row.publication_status !== "corrected"
  ) {
    return false;
  }
  if (row.retracted_at) return false;
  if (row.story_type !== REHEARSAL_LEVEL2_STORY_TYPE) return false;
  if (row.published_by_pipeline !== REHEARSAL_LEVEL2_PIPELINE) return false;
  if (row.methodology_version !== REHEARSAL_LEVEL2_METHODOLOGY_VERSION) return false;
  const matchSlug = row.match?.slug ?? null;
  if (matchSlug !== REHEARSAL_MATCH_SLUG) return false;
  return true;
}

/**
 * Carte d'observation publique consommable sur la page match mobile.
 * Forme stable, à ne pas étendre sans mise à jour du contrat.
 */
export interface PublicAutomaticObservationCard {
  slug: string;
  badgeLabel: typeof REHEARSAL_LEVEL2_BADGE;
  title: string;
  excerpt: string;
  publishedAt: string;
  languages: string[];
  sourceCount: number;
  detailRoute: string;
}

/**
 * Construit la carte mobile à partir d'une story validée + ses evidences
 * conformes. L'appelant doit avoir déjà vérifié `storyRowPassesGate` et
 * `evidencePassesGate`.
 */
export function buildObservationCard(
  story: {
    slug: string;
    title: string | null;
    excerpt: string | null;
    languages: unknown;
    source_count: number | null;
    published_at: string | null;
  },
  conformingEvidenceCount: number,
): PublicAutomaticObservationCard {
  return {
    slug: story.slug,
    badgeLabel: REHEARSAL_LEVEL2_BADGE,
    title: story.title || "",
    excerpt: story.excerpt || "",
    publishedAt: story.published_at || "",
    languages: Array.isArray(story.languages)
      ? (story.languages as unknown[]).map((l) => String(l))
      : [],
    sourceCount: story.source_count ?? conformingEvidenceCount,
    detailRoute: `/observation/${story.slug}`,
  };
}
