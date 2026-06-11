/**
 * Récits générés depuis des TEMPLATES FERMÉS (spec §5.7, §22.3).
 * Liste relue à la main. Vocabulaire exclusivement sportif-ludique :
 * mots interdits : guerre, invasion, armée, troupes, occupation, annexion,
 * frappe, ennemi, détruire. Le champ narrative est stocké, jamais régénéré.
 */

export type NationLabel = { flag: string; name: string };

/** "{flag_w} {Nation_w} prend {n} territoires à {Nation_l}, dont {ville_1}{, ville_2}" */
export function conquestNarrative(
  winner: NationLabel,
  loser: NationLabel,
  count: number,
  cityNames: string[],
): string {
  const territoires = count === 1 ? "1 territoire" : `${count} territoires`;
  const cities = cityNames.slice(0, 2).join(", ");
  const dont = cities ? `, dont ${cities}` : "";
  return `${winner.flag} ${winner.name} prend ${territoires} à ${loser.name}${dont}`;
}

/** Variante enclave : aucun hex pris n'est adjacent au territoire du vainqueur. */
export function enclaveNarrative(winner: NationLabel, firstCity: string): string {
  return `${winner.flag} ${winner.name} plante une enclave à ${firstCity}`;
}

/** Match nul : chaque équipe prend 1 hex neutre (spec §5.5). */
export function drawNarrative(
  a: NationLabel,
  aCity: string | null,
  b: NationLabel,
  bCity: string | null,
): string {
  const parts: string[] = [];
  if (aCity) parts.push(`${a.flag} ${a.name} prend ${aCity}`);
  if (bCity) parts.push(`${b.flag} ${b.name} prend ${bCity}`);
  if (parts.length === 0) return `${a.flag} ${a.name} et ${b.flag} ${b.name} se quittent dos à dos : la carte ne bouge pas`;
  return parts.join(" · ");
}

/** Héritage à l'élimination KO (spec §5.8), le "vae victis" sportif. */
export function eliminationNarrative(winner: NationLabel, eliminated: NationLabel, inherited: number): string {
  if (inherited === 0) return `${eliminated.flag} ${eliminated.name} quitte le tournoi : sa capitale entre au memorial`;
  const territoires = inherited === 1 ? "1 territoire" : `${inherited} territoires`;
  return `${eliminated.flag} ${eliminated.name} quitte le tournoi : ${winner.flag} ${winner.name} recueille ${territoires}`;
}

/** Clôture §5.9 : le monde passe au champion. */
export function worldConqueredNarrative(champion: NationLabel): string {
  return `${champion.flag} ${champion.name} est sur le toit du monde : la carte entière passe à ses couleurs`;
}

/** Garde-fou §22.3 : mots interdits dans tout texte généré (tests offline). */
export const FORBIDDEN_WORDS = [
  "guerre",
  "invasion",
  "armée",
  "troupes",
  "occupation",
  "annexion",
  "frappe",
  "ennemi",
  "détruire",
] as const;

export function containsForbiddenWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}
