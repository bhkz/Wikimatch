/**
 * Bootstrap des seeds depuis football-data.org v4 (spec §3.2, §3.4).
 *
 * Produit data/nations-seed.draft.json à partir de GET /competitions/WC/teams
 * et GET /competitions/WC/matches (groupes déduits du calendrier).
 *
 * Le draft doit ensuite être COMPLÉTÉ ET VÉRIFIÉ À LA MAIN (risque d'erreur n°1 :
 * le mapping fd_team_id ↔ code FIFA), puis renommé en nations-seed.json :
 * - vérifier les 48 mappings fd_team_id / tla,
 * - remplir fifa_rank / fifa_points (dernier classement FIFA publié, figé),
 * - remplir capital_q / capital_r (posés à la main dans map-seed.json),
 * - remplir color (palette 48 couleurs dérivée des tokens DA, cf. tokens.ts).
 *
 * Usage : FOOTBALL_DATA_TOKEN=xxx npx tsx scripts/fetch-seed-draft.ts
 */

import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API = "https://api.football-data.org/v4";
const TOKEN = process.env.FOOTBALL_DATA_TOKEN;

if (!TOKEN) {
  console.error("✗ FOOTBALL_DATA_TOKEN manquant (env var ou .env). Inscription gratuite : football-data.org");
  process.exit(1);
}

async function fd<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { "X-Auth-Token": TOKEN! } });
  if (!res.ok) {
    throw new Error(`football-data ${path} → HTTP ${res.status} : ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/** Drapeau emoji depuis un code pays ISO-3166 alpha-2 (jamais les crests API, spec §22). */
function flagFromAlpha2(alpha2: string): string {
  return String.fromCodePoint(...[...alpha2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

type FdTeam = { id: number; name: string; tla: string };
type FdMatch = {
  id: number;
  stage: string;
  group: string | null;
  homeTeam: { id: number | null; name: string | null };
  awayTeam: { id: number | null; name: string | null };
};

async function main() {
  console.log("→ GET /competitions/WC/teams …");
  const { teams } = await fd<{ teams: FdTeam[] }>("/competitions/WC/teams");
  console.log(`  ${teams.length} équipes reçues (48 attendues).`);

  // Respect du rate-limit free tier (~10 req/min) : pause entre les 2 appels.
  await new Promise((r) => setTimeout(r, 6500));

  console.log("→ GET /competitions/WC/matches …");
  const { matches } = await fd<{ matches: FdMatch[] }>("/competitions/WC/matches");
  console.log(`  ${matches.length} matchs reçus (104 attendus).`);

  // Groupe de chaque équipe, déduit du calendrier de la phase de groupes.
  const groupByTeamId = new Map<number, string>();
  for (const m of matches) {
    if (m.stage !== "GROUP_STAGE" || !m.group) continue;
    const letter = m.group.replace(/^GROUP_/, "");
    if (m.homeTeam.id) groupByTeamId.set(m.homeTeam.id, letter);
    if (m.awayTeam.id) groupByTeamId.set(m.awayTeam.id, letter);
  }

  const draft = teams
    .map((t) => ({
      fifa: t.tla, //                       ⚠ vérifier : tla n'est pas toujours le code FIFA
      name_fr: t.name, //                   ⚠ traduire en français à la main
      flag: "", //                          ⚠ remplir (emoji Unicode) — helper flagFromAlpha2
      fd_team_id: t.id,
      fifa_rank: 0, //                      ⚠ dernier classement FIFA publié (figé)
      fifa_points: 0, //                    ⚠ idem
      group: groupByTeamId.get(t.id) ?? "?",
      color: "", //                         ⚠ palette 48 couleurs (tokens DA)
      capital_q: 0, //                      ⚠ posé à la main (cohérent avec map-seed.json)
      capital_r: 0,
      capital_name: "", //                  ⚠ vraie capitale, orthographe FR
    }))
    .sort((a, b) => a.fifa.localeCompare(b.fifa));

  const out = resolve(import.meta.dirname, "..", "data", "nations-seed.draft.json");
  writeFileSync(out, JSON.stringify(draft, null, 2) + "\n", "utf8");
  console.log(`✓ Draft écrit : ${out}`);
  console.log("→ VÉRIFICATION MANUELLE DES 48 MAPPINGS OBLIGATOIRE avant de renommer en nations-seed.json.");
  console.log(`  (helper drapeaux : flagFromAlpha2('MA') = ${flagFromAlpha2("MA")})`);

  const unknownGroups = draft.filter((d) => d.group === "?");
  if (teams.length !== 48) console.warn(`⚠ ${teams.length} équipes ≠ 48.`);
  if (matches.length !== 104) console.warn(`⚠ ${matches.length} matchs ≠ 104.`);
  if (unknownGroups.length) console.warn(`⚠ groupe inconnu pour : ${unknownGroups.map((d) => d.fifa).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
