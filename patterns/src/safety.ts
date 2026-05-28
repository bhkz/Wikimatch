/**
 * Safety filters obligatoires avant publication automatique.
 * Aucun pattern ne devient une story publique tant que tous ces filtres
 * n'ont pas passé.
 *
 * Cf. docs/v2/CORRECTIVE_AUDIT_2026-05-27.md §4 et
 * docs/v2/SECURITY_PRIVACY_RULES.md §5 + §8.
 */

import { PUBLIC_FIELD_MAX_CHARS } from "./config.js";
import type { SafetyCheckResult, TemplateOutput } from "./types.js";

// PII patterns ciblés. Listes non exhaustives mais raisonnables.
const PII_PATTERNS: { name: string; rx: RegExp }[] = [
  { name: "email", rx: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { name: "phone_intl", rx: /\+\d{1,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,4}/ },
  { name: "phone_fr", rx: /\b0[1-9](?:[\s.-]?\d{2}){4}\b/ },
  { name: "nir_fr", rx: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}(?:\s?\d{2})?\b/ },
  { name: "postal_address_hint", rx: /\b\d{1,4}\s+(rue|avenue|boulevard|impasse|chemin|place|allée)\s+/i },
];

// Vandalism / profanity multilingue — liste minimale pour Phase initiale.
// Liste à étendre via une lib type `bad-words` ou un dictionnaire dédié.
const VANDALISM_KEYWORDS = [
  // FR
  "connard", "salope", "encul", "merde", "putain", "bordel",
  // EN
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt",
  // ES
  "puta", "mierda", "cabrón", "pendejo",
  // Generic vandalism markers
  "hahaha", "lol lol lol", "kjkjkj", "azerty",
];

// Vocabulaire produit interdit (PRODUCT_RULES §4 + §5).
const FORBIDDEN_VOCAB = [
  "guerre", "war", "edit-war",
  "bagarre",
  "drama",
  "burst",
  "scandale",
  "preuve que",
];

// Vocabulaire de causalité interdit (PRODUCT_RULES §7).
const FORBIDDEN_CAUSAL_PATTERNS: RegExp[] = [
  /\bcaus(e|é|és|ée|ées|er)\s+par\b/i,
  /\bprovo(qu|c)/i,
  /\bà cause de\b/i,
  /\ben raison de l[’']/i,
];

// "le <pays>", "les <pays>" interdits (PRODUCT_RULES §5).
const FORBIDDEN_NATIONAL_TENSION: RegExp[] = [
  /\b(le|les|la)\s+(France|Angleterre|Espagne|Allemagne|Italie|Portugal|Maroc|Argentine|Brésil|Japon|Mexique|Canada|Suisse|Belgique|Pays-Bas)\b/i,
  /\b(les)\s+(Français|Anglais|Espagnols|Allemands|Italiens|Portugais|Marocains|Argentins|Brésiliens|Japonais|Mexicains|Canadiens|Suisses|Belges|Néerlandais)\b/i,
];

// Classement / réaction entre éditions linguistiques (STORY_PUBLICATION_CONTRACT.md §8.2).
// WikiMatch ne doit jamais publier de phrase suggérant qu'une édition est plus rapide,
// en retard, "réagit", "ignore" ou "garde le silence" — c'est interpréter les langues
// comme des opinions publiques, ce que les données ne soutiennent pas.
const FORBIDDEN_LANGUAGE_RANKING: RegExp[] = [
  /\bplus rapide\b/i,
  /\ben retard\b/i,
  /\ben avance\b/i,
  /\bsilence\b/i,
  /\bignore(?:nt|r|ent|s)?\b/i,
  /\bréaction\b/i,
  /\bréagi(?:t|ssent|r)\b/i,
  // JavaScript `\b` is ASCII-only, so a trailing `\b` after `é` never matches.
  // Use a negative lookahead on the next letter class instead.
  /\bcommunaut[ée]s?(?![a-zA-ZÀ-ÿ])/i,
  /\bpublic\s+(?:fran[çc]ais|anglais|espagnol|allemand|italien|portugais)\b/i,
  /\bfans?\s+de\s+(?:la\s+)?(?:France|Angleterre|Espagne|Allemagne|Italie|Portugal)\b/i,
];

function checkPiiOnString(text: string, fieldName: string): SafetyCheckResult {
  for (const p of PII_PATTERNS) {
    if (p.rx.test(text)) {
      return {
        passed: false,
        reason: "pii_detected",
        details: { field: fieldName, kind: p.name },
      };
    }
  }
  return { passed: true };
}

function checkVandalismOnString(text: string, fieldName: string): SafetyCheckResult {
  const lower = text.toLowerCase();
  for (const kw of VANDALISM_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        passed: false,
        reason: "vandalism_keyword",
        details: { field: fieldName, keyword: kw },
      };
    }
  }
  return { passed: true };
}

function checkForbiddenVocab(text: string, fieldName: string): SafetyCheckResult {
  const lower = text.toLowerCase();
  for (const kw of FORBIDDEN_VOCAB) {
    if (lower.includes(kw)) {
      return {
        passed: false,
        reason: "forbidden_vocabulary",
        details: { field: fieldName, keyword: kw },
      };
    }
  }
  return { passed: true };
}

function checkCausality(text: string, fieldName: string): SafetyCheckResult {
  for (const rx of FORBIDDEN_CAUSAL_PATTERNS) {
    if (rx.test(text)) {
      return {
        passed: false,
        reason: "causality_forbidden",
        details: { field: fieldName, match: text.match(rx)?.[0] },
      };
    }
  }
  return { passed: true };
}

function checkNationalTension(text: string, fieldName: string): SafetyCheckResult {
  for (const rx of FORBIDDEN_NATIONAL_TENSION) {
    if (rx.test(text)) {
      return {
        passed: false,
        reason: "national_tension_forbidden",
        details: { field: fieldName, match: text.match(rx)?.[0] },
      };
    }
  }
  return { passed: true };
}

function checkLanguageRanking(text: string, fieldName: string): SafetyCheckResult {
  for (const rx of FORBIDDEN_LANGUAGE_RANKING) {
    if (rx.test(text)) {
      return {
        passed: false,
        reason: "language_ranking_forbidden",
        details: { field: fieldName, match: text.match(rx)?.[0] },
      };
    }
  }
  return { passed: true };
}

function checkLength(text: string, fieldName: string): SafetyCheckResult {
  if (text.length > PUBLIC_FIELD_MAX_CHARS) {
    return {
      passed: false,
      reason: "field_too_long",
      details: { field: fieldName, length: text.length, max: PUBLIC_FIELD_MAX_CHARS },
    };
  }
  return { passed: true };
}

const FIELD_CHECKS: ((text: string, name: string) => SafetyCheckResult)[] = [
  checkLength,
  checkPiiOnString,
  checkVandalismOnString,
  checkForbiddenVocab,
  checkCausality,
  checkNationalTension,
  checkLanguageRanking,
];

export function runSafetyChecks(output: TemplateOutput): SafetyCheckResult {
  const fields: [string, string][] = [
    ["title", output.title],
    ["excerpt", output.excerpt],
    ["observation_text", output.observation_text],
    ["interpretation_text", output.interpretation_text],
    ["limitation_text", output.limitation_text],
  ];

  for (const [name, text] of fields) {
    for (const check of FIELD_CHECKS) {
      const r = check(text, name);
      if (!r.passed) return r;
    }
  }

  return { passed: true };
}
