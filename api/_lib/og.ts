/**
 * Helpers des images OG (Edge runtime, @vercel/og).
 * - REST PostgREST direct (pas de supabase-js : bundle edge minimal) ;
 * - polices Google chargées en TTF (satori ne lit pas le woff2) et mises en
 *   cache au niveau module ;
 * - couleurs/noms des nations depuis les seeds versionnés (zéro latence).
 */

import nationsSeed from "../../data/nations-seed.json";
import mapGenerated from "../../data/map-generated.json";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

type NationSeed = { fifa: string; name_fr: string; color: string; group: string };
type GeneratedHex = { id: number; q: number; r: number; original_owner: string | null };

export const NATION_BY_CODE: ReadonlyMap<string, NationSeed> = new Map(
  (nationsSeed as NationSeed[]).map((n) => [n.fifa, n]),
);
export const COLOR_BY_CODE: ReadonlyMap<string, string> = new Map(
  (nationsSeed as NationSeed[]).map((n) => [n.fifa, n.color]),
);
export const GENERATED_HEXES = mapGenerated as GeneratedHex[];

/** SELECT REST sur le schéma atlas (lecture seule). */
export async function restSelect<T>(pathAndQuery: string): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  const response = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Accept-Profile": "atlas",
    },
  });
  if (!response.ok) throw new Error(`REST ${pathAndQuery}: ${response.status}`);
  return (await response.json()) as T[];
}

/* ------------------------------- Polices TTF ------------------------------- */

const fontCache = new Map<string, Promise<ArrayBuffer>>();

async function fetchGoogleFontTtf(family: string, weight: number): Promise<ArrayBuffer> {
  const cacheKey = `${family}:${weight}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
    // UA ancien → Google sert du TTF (satori ne supporte pas le woff2).
    const css = await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:10.0)" } }).then(
      (r) => r.text(),
    );
    const match = css.match(/src:\s*url\(([^)]+\.ttf)\)/);
    if (!match) throw new Error(`Police TTF introuvable : ${family} ${weight}`);
    const buffer = await fetch(match[1]).then((r) => r.arrayBuffer());
    return buffer;
  })();
  fontCache.set(cacheKey, promise);
  return promise;
}

export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

export async function loadOgFonts(): Promise<OgFont[]> {
  const [bebas, inter, interBold] = await Promise.all([
    fetchGoogleFontTtf("Bebas Neue", 400),
    fetchGoogleFontTtf("Inter", 400),
    fetchGoogleFontTtf("Inter", 700),
  ]);
  return [
    { name: "Bebas Neue", data: bebas, weight: 400, style: "normal" },
    { name: "Inter", data: inter, weight: 400, style: "normal" },
    { name: "Inter", data: interBold, weight: 700, style: "normal" },
  ];
}
