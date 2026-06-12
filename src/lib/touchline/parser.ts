/**
 * Touchline Commander — parseur de consignes FR (vocal ou texte).
 * 1) cible : numéro, nom, ligne, gardien, poste, équipe entière ;
 * 2) action : lexique tactique (pressing, bloc, largeur, tempo, profondeur…) ;
 * 3) clarté : cible précise + action nette = consigne claire, le reste se
 *    paie en compréhension sur le terrain.
 */

import type { ParsedOrder, Role } from "./engine";

const NUM_WORDS: Record<string, number> = {
  un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7,
  huit: 8, neuf: 9, dix: 10, onze: 11,
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type ActionRule = { action: string; re: RegExp; clarity?: number };

// Ordre = priorité : les plus spécifiques d'abord.
const ACTIONS: ActionRule[] = [
  { action: "press_high", re: /press\w* (tres )?haut|pressing haut|attaquez? (tres )?haut/ },
  { action: "block_low", re: /bloc bas|defendez bas|tout le monde derriere|bus devant/ },
  { action: "block_mid", re: /bloc median|bloc moyen/ },
  { action: "block_high", re: /bloc haut/ },
  { action: "press_more", re: /press\w*|attaque\w* le porteur|allez le chercher/ },
  { action: "double", re: /double\w* (le )?(porteur|l attaquant)?|a deux sur (le porteur|lui)/ },
  { action: "no_dive", re: /ne (vous|te) jet\w* pas|reste\w* debout|pas de tacle|temporise\w* (le|la) defense/ },
  { action: "drop_between", re: /decroch\w*( entre les lignes)?|entre les lignes/ },
  { action: "run_depth", re: /profondeur|dans le dos|appel\w* en profondeur|attaque\w* l espace/ },
  { action: "cover", re: /couvr\w*|couverture|reste\w* (en couverture|derriere)|securise\w*/ },
  { action: "gk_short", re: /relance\w* court|jou\w* court derriere|gardien.*court/ },
  { action: "gk_long", re: /relance\w* long|gardien.*long|degage\w* loin/ },
  { action: "long_ball", re: /jou\w* long|jeu long|long sur (l attaquant|le neuf|la pointe)|balle\w* long/ },
  { action: "short_pass", re: /jou\w* court|jeu court|passes courtes|au sol/ },
  { action: "wings", re: /par les ailes|ecartez le jeu sur les ailes|jou\w* (sur|par) les cotes/ },
  { action: "axis", re: /ferm\w* l axe|par l axe|dans l axe|bloquez le centre|couvre\w* (la zone )?central/ },
  { action: "widen", re: /ecart\w*|prenez de la largeur|plus larges?/ },
  { action: "narrow", re: /resserr\w*|plus etroit/ },
  { action: "compact", re: /compact\w*|restez? groupe/ },
  { action: "calm", re: /calm\w*|temporis\w*|gard\w* le ballon|fai\w* tourner|ralenti\w*|posez le jeu/ },
  { action: "accelerate", re: /accelere\w*|plus vite|du rythme|jou\w* vite|verticali/ },
  { action: "switch_side", re: /chang\w* d aile|renvers\w*( le jeu)?/ },
  { action: "push_up", re: /mont\w*|remont\w*|plus haut|avance\w*/ },
  { action: "drop", re: /recul\w*|redescend\w*|baisse\w*|repli\w*/ },
  { action: "move_side", re: /va (a|sur la|sur le cote) (gauche|droite?)|(passe|glisse) (a|cote) (gauche|droite?)|(a|sur la) (gauche|droite?)$/, clarity: 0.8 },
];

const ROLE_HINTS: Array<[RegExp, Role]> = [
  [/lateral droit|arriere droit/, "DD"],
  [/lateral gauche|arriere gauche/, "DG"],
  [/ailier droit/, "AD"],
  [/ailier gauche/, "AG"],
  [/(avant.?centre|attaquant de pointe|la pointe|le neuf)/, "BU"],
  [/(meneur|le dix|numero dix)/, "MOC"],
  [/sentinelle|six defensif/, "MDC"],
];

export function parseOrder(raw: string, roster: Array<{ num: number; name: string }>): ParsedOrder {
  const s = normalize(raw);
  const order: ParsedOrder = { raw, targetKind: "team", action: "unknown", clarity: 0.5 };

  // --- cible ---
  const numMatch = s.match(/numero (\d{1,2})|le (\d{1,2})\b|^(\d{1,2})\b/);
  if (numMatch) {
    order.targetKind = "player";
    order.num = Number(numMatch[1] ?? numMatch[2] ?? numMatch[3]);
  } else {
    const wordNum = s.match(/numero (un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze)/);
    if (wordNum) {
      order.targetKind = "player";
      order.num = NUM_WORDS[wordNum[1]];
    }
  }
  if (order.num === undefined) {
    for (const p of roster) {
      const n = normalize(p.name);
      if (new RegExp(`\\b${n}\\b`).test(s)) {
        order.targetKind = "player";
        order.name = n;
        break;
      }
    }
  }
  if (order.targetKind === "team") {
    for (const [re, role] of ROLE_HINTS) {
      if (re.test(s)) {
        order.targetKind = "player";
        order.roleHint = role;
        break;
      }
    }
  }
  if (order.targetKind === "team") {
    if (/gardien|portier|goal\b/.test(s)) order.targetKind = "gk";
    else if (/(la )?defense|ligne defensive|les defenseurs|derriere\b/.test(s)) { order.targetKind = "line"; order.line = "DEF"; }
    else if (/(le )?milieu|l entrejeu|les milieux/.test(s)) { order.targetKind = "line"; order.line = "MID"; }
    else if (/(l )?attaque\b|les attaquants|devant\b/.test(s)) { order.targetKind = "line"; order.line = "ATT"; }
  }

  // --- action ---
  for (const rule of ACTIONS) {
    if (rule.re.test(s)) {
      order.action = rule.action;
      order.clarity = rule.clarity ?? 0.9;
      break;
    }
  }

  // direction (pour move_side et désambiguïsation)
  if (/gauche/.test(s)) order.dir = "gauche";
  if (/droite?\b/.test(s)) order.dir = "droite";
  if (order.action === "unknown" && order.dir && order.targetKind === "player") {
    order.action = "move_side";
    order.clarity = 0.55;
  }
  // « gardien, relance » sans précision → courte par défaut.
  if (order.targetKind === "gk" && order.action === "unknown" && /relance/.test(s)) {
    order.action = "gk_short";
    order.clarity = 0.6;
  }

  // clarté finale : cible précise aide, ordre vague pénalise.
  if (order.targetKind === "player" || order.targetKind === "gk") order.clarity = Math.min(1, order.clarity + 0.1);
  if (order.action === "unknown") order.clarity = 0.2;
  return order;
}

/** Exemples affichés dans l'aide — tous réellement parsés. */
export const EXAMPLES: string[] = [
  "Numéro 10, décroche entre les lignes",
  "Lucas, va à gauche",
  "Pressez haut",
  "Bloc médian",
  "Passez par les ailes",
  "Calmez le jeu",
  "Accélérez",
  "Défense, remontez",
  "Numéro 9, attaque la profondeur",
  "Milieu, couvre la zone centrale",
  "Doublez le porteur",
  "Ne vous jetez pas",
  "Gardien, relance court",
  "Latéral droit, monte",
  "Restez compacts",
  "Fermez l'axe",
  "Jouez long sur l'attaquant",
];
