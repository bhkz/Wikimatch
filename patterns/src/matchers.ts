/**
 * Détecteurs de patterns à partir des trace_propositions classifiées.
 *
 * Trois patterns implémentés au Jalon C — les plus automatisables selon
 * docs/v2/CORRECTIVE_AUDIT_2026-05-27.md §2 :
 *  1. article_instability : séquence ajout/retrait/restauration sur même article
 *  2. language_convergence : même proposition dans ≥2 éditions linguistiques
 *  3. under_radar         : 1 proposition substantielle dans 1 édition,
 *                          0 ajout équivalent dans les autres éditions observées
 *
 * language_divergence et match_recap : à ajouter au Jalon suivant.
 */

import {
  CONVERGENCE_MIN_LANGUAGES,
  CONVERGENCE_WINDOW_MIN,
  INSTABILITY_MIN_TRACES,
  INSTABILITY_WINDOW_MIN,
  UNDER_RADAR_WINDOW_MIN,
} from "./config.js";
import { supabase } from "./supabase.js";
import type { DetectedPattern, PropositionRow } from "./types.js";

const SUBSTANTIVE_TYPES = new Set([
  "match_result",
  "goal_scored",
  "red_card",
  "yellow_card",
  "substitution",
  "sanction",
  "lineup_change",
  "transfer",
  "qualification",
  "performance",
  "biographical_fact",
]);

function isSubstantive(p: PropositionRow): boolean {
  return SUBSTANTIVE_TYPES.has(p.proposition_type) && (p.extraction_confidence ?? 0) >= 0.4;
}

const MATCH_LINK_WINDOW_BEFORE_HOURS = 6;
const MATCH_LINK_WINDOW_AFTER_HOURS = 48;

function normalizeClaimText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  // remove diacritics, collapse spaces, lowercase
  const normalized = s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return normalized;
}

function normalizeClaimMinute(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0) {
    return String(value);
  }

  if (typeof value !== "string") return null;

  const compact = value
    .trim()
    .replace(/[’']/g, "")
    .replace(/\s+/g, "");

  // Accept either a plain integer minute (e.g. "90") or an added-time minute (e.g. "90+1").
  // Reject ambiguous or partially-parsed strings like "90abc".
  if (!/^\d{1,3}(?:\+\d{1,2})?$/.test(compact)) return null;

  return compact;
}

function strictConvergenceClaimKey(p: PropositionRow): string | null {
  const payload = p.normalized_payload ?? {} as any;
  switch (p.proposition_type) {
    case "match_result": {
      // Un score sans identité d'équipes ni ordre home/away vérifiable ne suffit
      // pas à établir automatiquement une convergence entre éditions.
      // Pour cette répétition, n'autorisons pas automatiquement la convergence
      // sur `match_result`.
      return null;
    }
    case "goal_scored": {
      const scorer = normalizeClaimText(payload.scorer);
      const minute = normalizeClaimMinute(payload.minute ?? payload.time);
      if (!scorer || !minute) return null;
      return `goal_scored:${scorer}:${minute}`;
    }
    case "red_card": {
      const player = normalizeClaimText(payload.player ?? payload.target);
      const minute = normalizeClaimMinute(payload.minute ?? payload.time) ?? "unknown";
      if (!player) return null;
      return `red_card:${player}:${minute}`;
    }
    case "yellow_card": {
      const player = normalizeClaimText(payload.player ?? payload.target);
      const minute = normalizeClaimMinute(payload.minute ?? payload.time);
      if (!player || !minute) return null;
      return `yellow_card:${player}:${minute}`;
    }
    case "substitution": {
      const pin = normalizeClaimText(payload.player_in);
      const pout = normalizeClaimText(payload.player_out);
      const minute = normalizeClaimMinute(payload.minute ?? payload.time);
      if (!pin || !pout || !minute) return null;
      return `substitution:${pin}:${pout}:${minute}`;
    }
    case "qualification": {
      const team = normalizeClaimText(payload.team);
      const stage = normalizeClaimText(payload.stage_reached ?? payload.stage);
      if (!team || !stage) return null;
      return `qualification:${team}:${stage}`;
    }
    case "sanction": {
      const target = normalizeClaimText(payload.target);
      const kind = normalizeClaimText(payload.sanction_kind ?? payload.kind ?? payload.type);
      if (!target || !kind) return null;
      return `sanction:${target}:${kind}`;
    }
    default:
      return null;
  }
}

/**
 * Cette fenêtre sert uniquement à relier prudemment une observation documentaire
 * à un match surveillé. Elle ne prouve aucune causalité.
 * En cas de plusieurs matchs possibles, aucun rattachement n'est effectué.
 */
async function resolveUniqueMatchIdForRows(rows: PropositionRow[]): Promise<string | null> {
  const articleIds = [...new Set(rows.map((row) => row.trace.article_id))];
  if (articleIds.length === 0) return null;

  const observedTimestamps = rows
    .map((row) => new Date(row.trace.observed_at).getTime())
    .filter((timestamp) => !Number.isNaN(timestamp));
  if (observedTimestamps.length === 0) return null;

  const observedWindowStart = Math.min(...observedTimestamps);
  const observedWindowEnd = Math.max(...observedTimestamps);

  const { data: watchlistLinks, error: watchlistError } = await supabase
    .from("match_watchlist")
    .select("match_id,article_id")
    .eq("enabled", true)
    .in("article_id", articleIds);

  if (watchlistError) {
    console.error("[match-link] watchlist query failed:", watchlistError.message);
    return null;
  }
  if (!watchlistLinks || watchlistLinks.length === 0) return null;

  const candidateMatchIds = [...new Set(watchlistLinks.map((link: any) => link.match_id))];
  if (candidateMatchIds.length === 0) return null;

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id,slug,scheduled_at,status")
    .in("id", candidateMatchIds)
    .neq("status", "cancelled");

  if (matchesError) {
    console.error("[match-link] match query failed:", matchesError.message);
    return null;
  }
  if (!matches || matches.length === 0) return null;

  const candidates = matches
    .filter((match: any) => match.scheduled_at)
    .filter((match: any) => {
      const scheduled = new Date(match.scheduled_at).getTime();
      if (Number.isNaN(scheduled)) return false;
      const windowStart = scheduled - MATCH_LINK_WINDOW_BEFORE_HOURS * 60 * 60_000;
      const windowEnd = scheduled + MATCH_LINK_WINDOW_AFTER_HOURS * 60 * 60_000;
      return observedWindowEnd >= windowStart && observedWindowStart <= windowEnd;
    })
    .reduce((acc: any[], match: any) => {
      if (!acc.some((entry) => entry.id === match.id)) acc.push(match);
      return acc;
    }, [] as any[]);

  if (candidates.length !== 1) {
    if (candidates.length > 1) {
      const articleIdsCsv = articleIds.join(",");
      console.log(
        `[match-link] ambiguous pattern association — ${candidates.length} eligible matches for articles=${articleIdsCsv}`
      );
    }
    return null;
  }

  return candidates[0].id;
}

function summarizeProposition(p: PropositionRow): string {
  switch (p.proposition_type) {
    case "match_result": {
      const payload = p.normalized_payload as { home_score?: number; away_score?: number };
      if (typeof payload.home_score === "number" && typeof payload.away_score === "number") {
        return `score ${payload.home_score}-${payload.away_score}`;
      }
      return "résultat de match";
    }
    case "goal_scored":
      return "but inscrit";
    case "red_card":
      return "carton rouge";
    case "yellow_card":
      return "carton jaune";
    case "substitution":
      return "remplacement";
    case "sanction":
      return "sanction disciplinaire";
    case "lineup_change":
      return "changement de composition";
    case "transfer":
      return "transfert";
    case "qualification":
      return "qualification";
    case "performance":
      return "performance sportive notable";
    case "biographical_fact":
      return "fait biographique";
    default:
      return p.proposition_type;
  }
}

async function fetchRecentPropositions(windowMinutes: number): Promise<PropositionRow[]> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from("trace_propositions")
    .select(
      `
      id,
      trace_id,
      proposition_type,
      normalized_payload,
      language_code,
      extraction_confidence,
      created_at,
      trace:revision_traces!inner (
        id,
        article_id,
        observed_at,
        revision_timestamp,
        size_delta,
        source_revision_url,
        article:wiki_articles!inner (
          id,
          entity_id,
          language_code,
          page_title,
          canonical_url,
          article_type
        )
      )
    `,
    )
    .gte("created_at", since)
    .neq("proposition_type", "noise")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[matchers] fetch error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as PropositionRow[];
}

/**
 * article_instability : ≥3 traces sur le même article_id dans la fenêtre,
 * dont au moins 2 avec size_delta de signes opposés (ajout puis retrait).
 */
async function detectInstability(rows: PropositionRow[]): Promise<DetectedPattern[]> {
  const byArticle = new Map<string, PropositionRow[]>();
  for (const r of rows) {
    const id = r.trace.article_id;
    if (!byArticle.has(id)) byArticle.set(id, []);
    byArticle.get(id)!.push(r);
  }
  const out: DetectedPattern[] = [];
  for (const [articleId, group] of byArticle) {
    if (group.length < INSTABILITY_MIN_TRACES) continue;
    const hasPositive = group.some((g) => (g.trace.size_delta ?? 0) > 0);
    const hasNegative = group.some((g) => (g.trace.size_delta ?? 0) < 0);
    if (!hasPositive || !hasNegative) continue;
    const article = group[0].trace.article;
    const first = group[0];
    const last = group[group.length - 1];
    const matchId = await resolveUniqueMatchIdForRows(group);
    out.push({
      pattern_type: "article_instability",
      proposition_ids: group.map((g) => g.id),
      trace_ids: group.map((g) => g.trace.id),
      entity_id: article.entity_id,
      match_id: matchId,
      article_id: articleId,
      templateContext: {
        language_codes: [article.language_code],
        language_codes_substantive: [article.language_code],
        topic_label: article.page_title,
        page_title: article.page_title,
        observed_window_start: first.trace.observed_at,
        observed_window_end: last.trace.observed_at,
        proposition_summary: summarizeProposition(first),
        article_canonical_url: article.canonical_url,
        size_delta_pattern: group
          .map((g) => (g.trace.size_delta ?? 0))
          .join(", "),
      },
    });
  }
  return out;
}

/**
 * language_convergence : pour chaque entity_id, ≥2 propositions du même
 * proposition_type substantif dans des language_code distincts.
 */
async function detectConvergence(rows: PropositionRow[]): Promise<DetectedPattern[]> {
  // Convergence publiable : on n'agrège que des faits structurés strictement
  // équivalents sur des articles de match. Un même type de proposition ne suffit jamais.
  const byEntityClaim = new Map<string, PropositionRow[]>();
  for (const r of rows) {
    if (!isSubstantive(r)) continue;
    // Only consider match articles for safe automatic convergence
    if (r.trace.article.article_type !== "match") continue;
    const claimKey = strictConvergenceClaimKey(r);
    if (!claimKey) continue;
    const key = `${r.trace.article.entity_id}::${claimKey}`;
    if (!byEntityClaim.has(key)) byEntityClaim.set(key, []);
    byEntityClaim.get(key)!.push(r);
  }
  const out: DetectedPattern[] = [];
  for (const [key, group] of byEntityClaim) {
    const distinctLangs = new Set(group.map((g) => g.language_code.toLowerCase()));
    if (distinctLangs.size < CONVERGENCE_MIN_LANGUAGES) continue;
    const [entityId] = key.split("::");
    const article = group[0].trace.article;
    const first = group[0];
    const last = group[group.length - 1];
    const matchId = await resolveUniqueMatchIdForRows(group);
    out.push({
      pattern_type: "language_convergence",
      proposition_ids: group.map((g) => g.id),
      trace_ids: group.map((g) => g.trace.id),
      entity_id: entityId,
      match_id: matchId,
      article_id: null,
      templateContext: {
        language_codes: Array.from(distinctLangs),
        language_codes_substantive: Array.from(distinctLangs),
        topic_label: article.page_title,
        page_title: article.page_title,
        observed_window_start: first.trace.observed_at,
        observed_window_end: last.trace.observed_at,
        proposition_summary: summarizeProposition(first),
      },
    });
  }
  return out;
}

/**
 * under_radar : pour chaque entity_id, une proposition substantive dans
 * UNE seule édition linguistique, alors qu'au moins deux autres
 * wiki_articles de la même entity sont surveillés et n'ont produit
 * aucune proposition substantive dans la fenêtre.
 */
async function detectUnderRadar(rows: PropositionRow[]): Promise<DetectedPattern[]> {
  const byEntity = new Map<string, PropositionRow[]>();
  for (const r of rows) {
    if (!isSubstantive(r)) continue;
    const id = r.trace.article.entity_id;
    if (!byEntity.has(id)) byEntity.set(id, []);
    byEntity.get(id)!.push(r);
  }

  const out: DetectedPattern[] = [];
  for (const [entityId, group] of byEntity) {
    const distinctLangs = new Set(group.map((g) => g.language_code.toLowerCase()));
    if (distinctLangs.size !== 1) continue; // Doit être présent dans UNE seule édition

    // Vérifier qu'au moins 2 autres éditions linguistiques sont surveillées
    // sur la même entity sans proposition substantielle dans la fenêtre.
    const { data: allArticles } = await supabase
      .from("wiki_articles")
      .select("language_code")
      .eq("entity_id", entityId)
      .eq("monitoring_enabled", true);
    if (!allArticles) continue;
    const allLangs = new Set(allArticles.map((a) => a.language_code.toLowerCase()));
    const presentLang = group[0].language_code.toLowerCase();
    const absentLangs = Array.from(allLangs).filter((l) => l !== presentLang);
    if (absentLangs.length < 2) continue;

    const article = group[0].trace.article;
    const first = group[0];
    const last = group[group.length - 1];
    const matchId = await resolveUniqueMatchIdForRows(group);
    out.push({
      pattern_type: "under_radar",
      proposition_ids: group.map((g) => g.id),
      trace_ids: group.map((g) => g.trace.id),
      entity_id: entityId,
      match_id: matchId,
      article_id: article.id,
      templateContext: {
        language_codes: [presentLang, ...absentLangs],
        language_codes_substantive: [presentLang],
        language_codes_absent: absentLangs,
        topic_label: article.page_title,
        page_title: article.page_title,
        observed_window_start: first.trace.observed_at,
        observed_window_end: last.trace.observed_at,
        proposition_summary: summarizeProposition(first),
      },
    });
  }
  return out;
}

export async function detectPatterns(): Promise<DetectedPattern[]> {
  const widest = Math.max(
    INSTABILITY_WINDOW_MIN,
    CONVERGENCE_WINDOW_MIN,
    UNDER_RADAR_WINDOW_MIN,
  );
  const all = await fetchRecentPropositions(widest);
  if (all.length === 0) return [];

  // Filtre fenêtre par pattern.
  const instabilityRows = all.filter((r) => {
    const ageMin = (Date.now() - new Date(r.created_at).getTime()) / 60_000;
    return ageMin <= INSTABILITY_WINDOW_MIN;
  });
  const convergenceRows = all.filter((r) => {
    const ageMin = (Date.now() - new Date(r.created_at).getTime()) / 60_000;
    return ageMin <= CONVERGENCE_WINDOW_MIN;
  });
  const underRadarRows = all.filter((r) => {
    const ageMin = (Date.now() - new Date(r.created_at).getTime()) / 60_000;
    return ageMin <= UNDER_RADAR_WINDOW_MIN;
  });

  const detected = [
    ...(await detectInstability(instabilityRows)),
    ...(await detectConvergence(convergenceRows)),
    ...(await detectUnderRadar(underRadarRows)),
  ];

  // Déduplique par hash léger (pattern_type + sorted proposition_ids).
  const seen = new Set<string>();
  const unique: DetectedPattern[] = [];
  for (const d of detected) {
    const key = `${d.pattern_type}::${[...d.proposition_ids].sort().join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(d);
  }
  return unique;
}
