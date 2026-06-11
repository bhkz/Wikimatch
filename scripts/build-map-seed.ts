/**
 * Construction de data/map-seed.json (spec §4.2.1) :
 * - silhouette du planisphère stylisé, dessinée À LA MAIN ci-dessous en
 *   coordonnées offset (col 0..43, row 0..25), convertie en axial ;
 * - capitales : projection équirectangulaire des lat/lon réelles
 *   (nations-static.json), surchargée à la main dans les zones denses
 *   (Europe, Caraïbes, Río de la Plata), avec snap déterministe sur la terre
 *   et résolution de collision en spirale.
 *
 * La sortie est VERSIONNÉE puis auditée visuellement (/admin/map-preview).
 * Usage : npx tsx scripts/build-map-seed.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { compareAxial, hexDistance, hexKey, type Axial } from "../lib/hex";

const DATA_DIR = resolve(import.meta.dirname, "..", "data");
const COLS = 50;
const ROWS = 28;

/**
 * Silhouette terre, rangée par rangée : segments [colDébut, colFin] inclus.
 * DESSINÉ À LA MAIN. Distorsions volontaires de jeu de plateau : Europe
 * agrandie (16 nations × 10 hexes), Manche/Méditerranée comblées, Cap-Vert en
 * archipel atlantique de 10 hexes, Antarctique exclu.
 */
const LAND_ROWS: Array<Array<[number, number]>> = [
  /* r0  arctique   */ [[2, 9], [12, 14], [20, 26], [28, 45]],
  /* r1             */ [[2, 10], [12, 14], [19, 26], [28, 45]],
  /* r2             */ [[2, 11], [13, 14], [16, 18], [20, 27], [29, 45]],
  /* r3             */ [[3, 11], [16, 19], [21, 45]],
  /* r4             */ [[3, 12], [18, 45]],
  /* r5             */ [[4, 12], [19, 45]],
  /* r6             */ [[4, 12], [16, 45]],
  /* r7             */ [[4, 11], [13, 14], [16, 44]],
  /* r8             */ [[5, 10], [13, 14], [17, 38], [41, 44]],
  /* r9             */ [[5, 9], [12, 15], [17, 38], [42, 44]],
  /* r10            */ [[5, 12], [13, 15], [17, 37]],
  /* r11            */ [[6, 13], [17, 38]],
  /* r12            */ [[7, 14], [17, 31], [33, 40]],
  /* r13            */ [[8, 15], [18, 31], [33, 41]],
  /* r14            */ [[8, 17], [19, 29], [34, 42]],
  /* r15            */ [[8, 17], [20, 29], [35, 42]],
  /* r16            */ [[9, 17], [21, 28], [40, 46]],
  /* r17            */ [[10, 15], [21, 28], [39, 47]],
  /* r18            */ [[10, 15], [22, 27], [39, 47]],
  /* r19            */ [[10, 14], [22, 26], [39, 47]],
  /* r20            */ [[10, 14], [23, 25], [40, 46]],
  /* r21            */ [[10, 13], [23, 24], [46, 49]],
  /* r22            */ [[10, 12], [47, 49]],
  /* r23            */ [[10, 12], [47, 49]],
  /* r24            */ [[10, 11]],
  /* r25            */ [[10, 11]],
  /* r26            */ [],
  /* r27            */ [],
];

/**
 * Les 48 capitales, TOUTES placées À LA MAIN (offset [col, row]), espacement
 * axial ≥ 2 vérifié par le script (le BFS équitable a besoin d'air autour de
 * chaque capitale). lat/lon de nations-static.json = simple guide.
 */
const CAPITAL_OVERRIDES: Record<string, [number, number]> = {
  // Amérique du Nord & Caraïbes
  CAN: [9, 3], USA: [8, 5], MEX: [6, 8], PAN: [8, 11], HAI: [11, 10], CUW: [12, 11],
  // Amérique du Sud
  COL: [12, 13], ECU: [10, 14], BRA: [15, 15], PAR: [13, 18], URY: [13, 20], ARG: [11, 21],
  // Europe (agrandie : îles Britanniques dédiées, Scandinavie large)
  NOR: [21, 1], SWE: [24, 1], SCO: [17, 2], ENG: [18, 3], NED: [22, 3], GER: [24, 4],
  CZE: [26, 4], BEL: [20, 5], POR: [16, 6], SUI: [22, 6], AUT: [25, 6], FRA: [19, 7],
  TUR: [29, 7], CRO: [23, 8], BIH: [25, 8], ESP: [18, 8],
  // Moyen-Orient & Asie centrale
  IRN: [34, 7], IRQ: [31, 8], JOR: [28, 9], KSA: [30, 11], QAT: [33, 11], UZB: [36, 5],
  // Afrique (+ archipel Cap-Vert atlantique)
  CPV: [14, 9], MAR: [18, 10], ALG: [21, 10], TUN: [24, 10], EGY: [27, 10], SEN: [17, 12],
  CIV: [19, 14], GHA: [22, 14], COD: [26, 16], RSA: [24, 20],
  // Asie de l'Est & Océanie
  KOR: [41, 8], JPN: [43, 8], AUS: [43, 18], NZL: [48, 22],
};

/** Latitudes couvertes : 75°N (row 0) → -60°S (row 25). */
function project(lat: number, lon: number): { col: number; row: number } {
  const col = Math.round(((lon + 180) / 360) * (COLS - 1));
  const row = Math.round(((75 - lat) / 135) * (ROWS - 1));
  return { col: Math.min(COLS - 1, Math.max(0, col)), row: Math.min(ROWS - 1, Math.max(0, row)) };
}

/** offset (col,row) → axial (q,r) pour grille pointy-top. */
function offsetToAxial(col: number, row: number): Axial {
  return { q: col - Math.floor(row / 2), r: row };
}

type StaticNation = { name_fr: string; capital: string; lat: number; lon: number };

function main() {
  const staticData = JSON.parse(readFileSync(resolve(DATA_DIR, "nations-static.json"), "utf8")) as Record<
    string,
    StaticNation
  >;
  const codes = Object.keys(staticData).filter((k) => k !== "_meta").sort();
  if (codes.length !== 48) throw new Error(`nations-static.json : 48 nations attendues, ${codes.length}.`);

  // --- Terre -----------------------------------------------------------------
  const land: Axial[] = [];
  const landSet = new Set<string>();
  LAND_ROWS.forEach((segments, row) => {
    for (const [from, to] of segments) {
      for (let col = from; col <= to; col++) {
        const h = offsetToAxial(col, row);
        land.push(h);
        landSet.add(hexKey(h));
      }
    }
  });

  // --- Capitales : placement manuel, validé (sur terre + espacement ≥ 2) -----
  const capitals: Record<string, Axial> = {};
  for (const code of codes) {
    const override = CAPITAL_OVERRIDES[code];
    if (!override) throw new Error(`Capitale non placée pour ${code} — compléter CAPITAL_OVERRIDES.`);
    const h = offsetToAxial(...override);
    if (!landSet.has(hexKey(h))) {
      throw new Error(`Capitale de ${code} (col ${override[0]}, row ${override[1]}) hors terre.`);
    }
    capitals[code] = h;
  }
  for (const a of codes) {
    for (const b of codes) {
      if (a >= b) continue;
      const d = hexDistance(capitals[a], capitals[b]);
      if (d < 2) throw new Error(`Capitales trop proches : ${a}–${b} (distance ${d}, minimum 2).`);
    }
  }
  // La projection lat/lon reste un garde-fou : signale un placement aberrant.
  for (const code of codes) {
    const { col, row } = project(staticData[code].lat, staticData[code].lon);
    const projected = offsetToAxial(col, row);
    const drift = hexDistance(projected, capitals[code]);
    if (drift > 8) {
      console.warn(`⚠ ${code} à distance ${drift} de sa projection géographique (distorsion assumée ?).`);
    }
  }

  // --- Sortie + rendu ASCII pour audit rapide --------------------------------
  const out = {
    land: land.sort(compareAxial).map((h) => [h.q, h.r] as [number, number]),
    capitals,
  };
  writeFileSync(resolve(DATA_DIR, "map-seed.json"), JSON.stringify(out) + "\n", "utf8");

  const capitalByKey = new Map(Object.entries(capitals).map(([code, h]) => [hexKey(h), code]));
  console.log(`✓ ${land.length} hexes terre, 48 capitales (cible terre ≈630 : 480 nationaux + ~150 neutres).`);
  for (let row = 0; row < ROWS; row++) {
    let line = "";
    for (let col = 0; col < COLS; col++) {
      const key = hexKey(offsetToAxial(col, row));
      line += capitalByKey.has(key) ? "◉" : landSet.has(key) ? "#" : "·";
    }
    console.log(line);
  }
  console.log("→ data/map-seed.json écrit. Audit visuel détaillé : /admin/map-preview.");
}

main();
