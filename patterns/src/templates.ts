/**
 * Templates publics bornés.
 *
 * Chaque template produit le contenu d'une `published_stories` row à partir
 * d'un TemplateContext structuré. Aucun champ public n'est libre — tous
 * sont assemblés depuis des constantes + des données contrôlées. Aucune
 * sortie IA n'arrive ici.
 *
 * Cf. docs/v2/CORRECTIVE_AUDIT_2026-05-27.md §2 (templates par type).
 */

import { METHODOLOGY_VERSION } from "./config.js";
import type { PatternType, TemplateContext, TemplateOutput } from "./types.js";

function langLabel(code: string): string {
  const c = code.toLowerCase();
  const map: Record<string, string> = {
    en: "anglaise",
    fr: "française",
    es: "espagnole",
    ja: "japonaise",
    ar: "arabe",
    pt: "portugaise",
    de: "allemande",
    ko: "coréenne",
  };
  return map[c] ?? c;
}

function uppercaseLangList(codes: string[]): string {
  return codes.map((c) => c.toUpperCase()).join(", ");
}

function langEnumerated(codes: string[]): string {
  if (codes.length === 0) return "";
  if (codes.length === 1) return `l'édition ${langLabel(codes[0])}`;
  if (codes.length === 2)
    return `les éditions ${langLabel(codes[0])} et ${langLabel(codes[1])}`;
  const head = codes.slice(0, -1).map(langLabel).join(", ");
  const tail = langLabel(codes[codes.length - 1]);
  return `les éditions ${head} et ${tail}`;
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function articleInstabilityTemplate(ctx: TemplateContext): TemplateOutput {
  const lang = ctx.language_codes[0]?.toUpperCase() ?? "";
  const langPretty = langLabel(ctx.language_codes[0] ?? "");
  const title = `ACTIVITÉ À VÉRIFIER · ${ctx.page_title.toUpperCase()} (${lang})`;
  const observation =
    `Sur l'article ${langPretty} de ${ctx.page_title}, plusieurs modifications comprenant des ajouts et des retraits ont été détectées entre ${formatHHMM(
      ctx.observed_window_start
    )} et ${formatHHMM(ctx.observed_window_end)}.`;
  const interpretation =
    `Cette activité peut signaler une réécriture en cours, mais ne démontre ni contestation d'un passage précis, ni séquence d'ajout, retrait et restauration.`;
  const limitation =
    `Une vérification manuelle des diffs est nécessaire avant toute qualification d'instabilité éditoriale. Aucune motivation de contributeur n'est attribuée.`;
  return {
    title,
    excerpt: observation,
    observation_text: observation,
    interpretation_text: interpretation,
    limitation_text: limitation,
    languages: [lang],
    source_count: ctx.proposition_summary ? 1 : 1,
    slug_seed: `${slugify(ctx.page_title)}-activite-a-verifier-${lang.toLowerCase()}`,
  };
}

function languageConvergenceTemplate(ctx: TemplateContext): TemplateOutput {
  const codes = ctx.language_codes_substantive.length
    ? ctx.language_codes_substantive
    : ctx.language_codes;
  const title = `MISE À JOUR ÉQUIVALENTE DÉTECTÉE · ${ctx.page_title.toUpperCase()}`;
  const observation =
    `Une proposition structurée équivalente (${ctx.proposition_summary}) a été détectée dans les modifications de ${codes.length} éditions linguistiques observées : ${uppercaseLangList(
      codes
    )}.`;
  const interpretation =
    `Cette convergence porte sur les modifications détectées dans la fenêtre observée. Elle ne suffit pas à résumer l'ensemble du contenu actuel des articles.`;
  const limitation =
    `Aucune interprétation politique ou nationale ne peut en être déduite. Les codes linguistiques désignent des éditions de Wikipédia.`;
  return {
    title,
    excerpt: observation,
    observation_text: observation,
    interpretation_text: interpretation,
    limitation_text: limitation,
    languages: codes.map((c) => c.toUpperCase()),
    source_count: codes.length,
    slug_seed: `${slugify(ctx.page_title)}-convergence-${codes.length}-editions`,
  };
}

function underRadarTemplate(ctx: TemplateContext): TemplateOutput {
  const presentCode = ctx.language_codes_substantive[0] ?? ctx.language_codes[0];
  const absentCodes = ctx.language_codes_absent ?? [];
  const presentLang = langLabel(presentCode);
  const title = `AJOUT ISOLÉ À VÉRIFIER · ${ctx.page_title.toUpperCase()}`;
  const observation =
    `Dans la fenêtre observée, une proposition substantielle (${ctx.proposition_summary}) a été détectée dans l'édition ${presentLang}, ` +
    (absentCodes.length
      ? `sans détection d'un ajout substantiel comparable dans ${langEnumerated(absentCodes)} observées.`
      : `sans détection d'un ajout substantiel comparable dans les autres éditions observées.`);
  const interpretation =
    `Ce signal identifie un décalage dans les modifications observées, pas une absence démontrée de l'information dans les autres articles.`;
  const limitation =
    `La présence actuelle du fait dans chaque article doit être vérifiée manuellement avant toute publication éditoriale.`;
  return {
    title,
    excerpt: observation,
    observation_text: observation,
    interpretation_text: interpretation,
    limitation_text: limitation,
    languages: [presentCode.toUpperCase(), ...absentCodes.map((c) => c.toUpperCase())],
    source_count: 1,
    slug_seed: `${slugify(ctx.page_title)}-ajout-isole-${presentCode.toLowerCase()}`,
  };
}

export function generate(
  patternType: PatternType,
  ctx: TemplateContext,
): TemplateOutput | null {
  switch (patternType) {
    case "article_instability":
      return articleInstabilityTemplate(ctx);
    case "language_convergence":
      return languageConvergenceTemplate(ctx);
    case "under_radar":
      return underRadarTemplate(ctx);
    case "language_divergence":
    case "match_recap":
      // Templates à implémenter lors d'un prochain jalon — pour l'instant
      // ces patterns ne sont pas publiables.
      return null;
  }
}

export function methodologyVersion(): string {
  return METHODOLOGY_VERSION;
}

function formatHHMM(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
  } catch {
    return iso;
  }
}
