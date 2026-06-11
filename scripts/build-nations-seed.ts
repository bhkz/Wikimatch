/**
 * Fusionne nations-seed.draft.json (API : fd_team_id, groupes) avec
 * nations-static.json (rédigé à la main) et map-seed.json (capitales)
 * → data/nations-seed.json, le seed final des 48 nations (spec §3.4).
 *
 * Échoue fort si un code FIFA du draft est absent du fichier statique
 * (= mapping à vérifier à la main, risque d'erreur n°1, spec §21.6).
 *
 * Usage : npx tsx scripts/build-nations-seed.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DATA_DIR = resolve(import.meta.dirname, "..", "data");

type DraftEntry = { fifa: string; fd_team_id: number; group: string };
type StaticNation = {
  name_fr: string; flag: string; capital: string;
  color: string; fifa_rank: number; fifa_points: number;
};

function main() {
  const draft = JSON.parse(readFileSync(resolve(DATA_DIR, "nations-seed.draft.json"), "utf8")) as DraftEntry[];
  const staticData = JSON.parse(readFileSync(resolve(DATA_DIR, "nations-static.json"), "utf8")) as Record<
    string, StaticNation
  >;
  const mapSeed = JSON.parse(readFileSync(resolve(DATA_DIR, "map-seed.json"), "utf8")) as {
    capitals: Record<string, { q: number; r: number }>;
  };

  if (draft.length !== 48) throw new Error(`draft : 48 attendues, ${draft.length}.`);

  const missing = draft.filter((d) => !staticData[d.fifa]).map((d) => d.fifa);
  if (missing.length > 0) {
    throw new Error(`Codes API absents de nations-static.json (mapping à vérifier) : ${missing.join(", ")}`);
  }
  const extra = Object.keys(staticData).filter((k) => k !== "_meta" && !draft.some((d) => d.fifa === k));
  if (extra.length > 0) {
    throw new Error(`Codes statiques absents du draft API : ${extra.join(", ")}`);
  }

  const seed = draft
    .map((d) => {
      const s = staticData[d.fifa];
      const cap = mapSeed.capitals[d.fifa];
      if (!cap) throw new Error(`Capitale manquante dans map-seed.json pour ${d.fifa}.`);
      if (!/^[A-L]$/.test(d.group)) throw new Error(`Groupe invalide "${d.group}" pour ${d.fifa}.`);
      return {
        fifa: d.fifa,
        name_fr: s.name_fr,
        flag: s.flag,
        fd_team_id: d.fd_team_id,
        fifa_rank: s.fifa_rank,
        fifa_points: s.fifa_points,
        group: d.group,
        color: s.color,
        capital_q: cap.q,
        capital_r: cap.r,
        capital_name: s.capital,
      };
    })
    .sort((a, b) => a.fifa.localeCompare(b.fifa));

  // 12 groupes de 4, strict.
  const byGroup = new Map<string, number>();
  for (const n of seed) byGroup.set(n.group, (byGroup.get(n.group) ?? 0) + 1);
  for (const [g, count] of [...byGroup].sort()) {
    if (count !== 4) throw new Error(`Groupe ${g} : ${count} équipes (4 attendues).`);
  }

  writeFileSync(resolve(DATA_DIR, "nations-seed.json"), JSON.stringify(seed, null, 1) + "\n", "utf8");
  console.log(`✓ data/nations-seed.json : 48 nations, 12 groupes de 4 validés.`);
}

main();
