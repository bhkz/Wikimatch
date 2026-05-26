/**
 * Labels publics neutres dérivés des valeurs métier (story_type, etc.).
 *
 * 2026-05-27 — remplace les libellés fabriqués type "HISTOIRE IA" /
 * "ANALYSE IA" / "qualifiés par l'IA en temps réel" qui présentaient l'IA
 * comme un argument éditorial public, en violation de
 * docs/v2/PRODUCT_RULES.md §8. Les labels ici sont déterministes,
 * indépendants du provider IA, et alignés sur les `story_type` du modèle
 * de données (cf. docs/v2/DATA_MODEL_PROPOSAL.md §9).
 */

const STORY_TYPE_LABELS: Record<string, string> = {
  fact_entry: "UN FAIT ENTRE DANS WIKIPÉDIA",
  language_convergence: "MISE À JOUR CONVERGENTE",
  language_divergence: "DIVERGENCE ENTRE ÉDITIONS",
  article_instability: "ARTICLE INSTABLE",
  under_radar: "SOUS LE RADAR",
  match_recap: "RÉCAP MATCH",
};

export function storyTypeLabel(storyType: string | null | undefined): string {
  if (!storyType) return "HISTOIRE PUBLIÉE";
  return STORY_TYPE_LABELS[storyType] ?? "HISTOIRE PUBLIÉE";
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  player: "JOUEUR",
  team: "ÉQUIPE",
  coach: "ENTRAÎNEUR",
  referee: "ARBITRE",
  match: "MATCH",
  stadium: "STADE",
  tournament: "TOURNOI",
};

export function entityTypeLabel(type: string | null | undefined): string {
  if (!type) return "SUJET";
  return ENTITY_TYPE_LABELS[type] ?? "SUJET";
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "anglaise",
  fr: "française",
  es: "espagnole",
  ja: "japonaise",
  ar: "arabe",
  pt: "portugaise",
  de: "allemande",
  ko: "coréenne",
  it: "italienne",
  nl: "néerlandaise",
};

export function languageLabel(code: string | null | undefined): string {
  if (!code) return "";
  return LANGUAGE_NAMES[code.toLowerCase()] ?? code;
}

/**
 * Compte le nombre d'éditions linguistiques distinctes surveillées.
 * Fait via select des language_code puis Set côté JS faute de DISTINCT
 * exposé proprement par supabase-js head-count.
 */
export async function countDistinctMonitoredLanguages(
  supabase: { from: (table: string) => any },
): Promise<number> {
  const { data, error } = await supabase
    .from("wiki_articles")
    .select("language_code")
    .eq("monitoring_enabled", true);
  if (error || !data) return 0;
  const set = new Set<string>();
  for (const row of data) {
    if (row?.language_code) set.add(String(row.language_code).toLowerCase());
  }
  return set.size;
}
