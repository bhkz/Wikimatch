/**
 * Génération de la carte de départ (spec §4.2).
 *
 * Entrées (versionnées dans data/, vérifiées à la main) :
 * - data/map-seed.json     : { land: [q,r][], capitals: { FIFA: {q,r} } }
 *                            land = silhouette du planisphère stylisé (~630 hexes
 *                            dans un rectangle axial ≈ 44×26), posée à la main.
 * - data/nations-seed.json : les 48 nations (code, capital_name, …).
 * - data/city-names.json   : { FIFA: [villes...], _neutral: [noms océans/déserts] }.
 *
 * Algorithme :
 * 1. Capitales posées depuis map-seed.
 * 2. Flood-fill BFS de 9 hexes autour de chaque capitale ; en zone dense le
 *    BFS alterne entre nations par ordre alphabétique de code FIFA, un hex
 *    par tour (répartition équitable). Total : 10 hexes par nation, strict.
 * 3. Tout hex terre non attribué → neutral (≈150 attendus).
 * 4. Nommage : capitale = vraie capitale ; le reste par distance croissante =
 *    villes par taille décroissante ; neutres = noms d'océans/déserts cyclés.
 *
 * Sortie : data/map-generated.json — VERSIONNÉ et AUDITÉ VISUELLEMENT À LA MAIN
 * (/admin/map-preview) avant lancement. Jamais régénéré au runtime.
 *
 * Usage : npx tsx scripts/generate-map.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { hexDistance, hexKey, hexNeighbors, compareAxial, type Axial } from "../lib/hex";

const DATA_DIR = resolve(import.meta.dirname, "..", "data");
const HEXES_PER_NATION = 10; // spec §4.3 — égalité stricte, aucun bonus

type MapSeed = {
  land: Array<[number, number]>;
  capitals: Record<string, { q: number; r: number }>;
};
type NationSeed = {
  fifa: string;
  name_fr: string;
  capital_name: string;
};
type CityNames = Record<string, string[]>; // clé FIFA + clé spéciale "_neutral"

function loadJson<T>(file: string): T {
  try {
    return JSON.parse(readFileSync(resolve(DATA_DIR, file), "utf8")) as T;
  } catch (err) {
    console.error(`✗ Impossible de lire data/${file} — seed manquant ou invalide.`);
    throw err;
  }
}

function main() {
  const mapSeed = loadJson<MapSeed>("map-seed.json");
  const nations = loadJson<NationSeed[]>("nations-seed.json");
  const cityNames = loadJson<CityNames>("city-names.json");

  // --- Validations d'entrée (fail-fast, jamais deviner) ---------------------
  if (nations.length !== 48) {
    throw new Error(`nations-seed.json : 48 nations attendues, ${nations.length} trouvées.`);
  }
  const land = new Set<string>(mapSeed.land.map(([q, r]) => hexKey({ q, r })));
  const codes = nations.map((n) => n.fifa).sort(); // ordre alphabétique FIFA (spec §4.2.2)
  for (const code of codes) {
    if (!mapSeed.capitals[code]) throw new Error(`map-seed.json : capitale manquante pour ${code}.`);
    if (!land.has(hexKey(mapSeed.capitals[code]))) {
      throw new Error(`map-seed.json : la capitale de ${code} n'est pas sur un hex terre.`);
    }
    const cities = cityNames[code];
    if (!cities || cities.length < HEXES_PER_NATION) {
      throw new Error(`city-names.json : ≥${HEXES_PER_NATION} noms requis pour ${code}.`);
    }
  }
  if (!cityNames._neutral?.length) {
    throw new Error("city-names.json : liste _neutral (océans/déserts) requise.");
  }
  const capitalKeys = new Map<string, string>(); // hexKey -> code
  for (const code of codes) {
    const key = hexKey(mapSeed.capitals[code]);
    if (capitalKeys.has(key)) {
      throw new Error(`map-seed.json : capitales superposées (${capitalKeys.get(key)} / ${code}).`);
    }
    capitalKeys.set(key, code);
  }

  // --- 2. Flood-fill BFS alterné, un hex par tour ---------------------------
  const ownerByKey = new Map<string, string>();
  const frontiers = new Map<string, Axial[]>(); // file BFS par nation (ordre FIFO)
  const counts = new Map<string, number>();

  for (const code of codes) {
    const cap = mapSeed.capitals[code];
    ownerByKey.set(hexKey(cap), code);
    frontiers.set(code, [cap]);
    counts.set(code, 1);
  }

  let progress = true;
  while (progress) {
    progress = false;
    for (const code of codes) {
      if (counts.get(code)! >= HEXES_PER_NATION) continue;
      const frontier = frontiers.get(code)!;
      // Cherche le prochain hex terre libre accessible en BFS.
      let claimed: Axial | null = null;
      while (frontier.length > 0 && claimed === null) {
        const current = frontier[0];
        // Voisins triés (q,r) pour un BFS déterministe.
        const free = hexNeighbors(current)
          .filter((n) => land.has(hexKey(n)) && !ownerByKey.has(hexKey(n)))
          .sort(compareAxial);
        if (free.length === 0) {
          frontier.shift(); // hex épuisé, on avance dans la file
          continue;
        }
        claimed = free[0];
      }
      if (claimed) {
        ownerByKey.set(hexKey(claimed), code);
        frontier.push(claimed);
        counts.set(code, counts.get(code)! + 1);
        progress = true;
      }
    }
  }

  const starved = codes.filter((c) => counts.get(c)! < HEXES_PER_NATION);
  if (starved.length > 0) {
    throw new Error(
      `Flood-fill incomplet — nations sans leurs ${HEXES_PER_NATION} hexes : ${starved
        .map((c) => `${c}(${counts.get(c)})`)
        .join(", ")}. Élargir la terre ou écarter les capitales dans map-seed.json.`,
    );
  }

  // --- 3 + 4. Hexes neutres + nommage ---------------------------------------
  type GeneratedHex = {
    id: number;
    q: number;
    r: number;
    city_name: string;
    is_capital: boolean;
    original_owner: string | null;
  };

  // Ids stables : tri (q,r) lexicographique de TOUS les hexes terre.
  const allLand = [...land].map((k) => {
    const [q, r] = k.split(",").map(Number);
    return { q, r };
  });
  allLand.sort(compareAxial);

  // Nommage national : capitale puis villes par distance croissante.
  const nationByCode = new Map(nations.map((n) => [n.fifa, n]));
  const nameByKey = new Map<string, string>();
  for (const code of codes) {
    const cap = mapSeed.capitals[code];
    const owned = allLand
      .filter((h) => ownerByKey.get(hexKey(h)) === code)
      .sort((a, b) => {
        const d = hexDistance(a, cap) - hexDistance(b, cap);
        return d !== 0 ? d : compareAxial(a, b);
      });
    owned.forEach((h, i) => {
      const isCap = hexKey(h) === hexKey(cap);
      const name = isCap ? nationByCode.get(code)!.capital_name : cityNames[code][i];
      nameByKey.set(hexKey(h), name);
    });
  }

  let neutralIdx = 0;
  const neutralNames = cityNames._neutral;
  const hexes: GeneratedHex[] = allLand.map((h, idx) => {
    const key = hexKey(h);
    const owner = ownerByKey.get(key) ?? null;
    const name = owner ? nameByKey.get(key)! : neutralNames[neutralIdx++ % neutralNames.length];
    return {
      id: idx + 1,
      q: h.q,
      r: h.r,
      city_name: name,
      is_capital: owner !== null && capitalKeys.get(key) === owner,
      original_owner: owner,
    };
  });

  const neutralCount = hexes.filter((h) => h.original_owner === null).length;
  const out = resolve(DATA_DIR, "map-generated.json");
  writeFileSync(out, JSON.stringify(hexes, null, 1) + "\n", "utf8");

  console.log(`✓ ${hexes.length} hexes générés (${48 * HEXES_PER_NATION} nationaux, ${neutralCount} neutres).`);
  if (neutralCount < 100 || neutralCount > 220) {
    console.warn(`⚠ ${neutralCount} hexes neutres — cible ≈150 (spec §4.1). Ajuster la silhouette terre.`);
  }
  console.log(`→ ${out}`);
  console.log("→ AUDIT VISUEL OBLIGATOIRE sur /admin/map-preview avant lancement.");
}

main();
