/**
 * Image OG de la fin du monde (vision P2.B/D) : la carte aux couleurs du
 * champion — ou la carte vivante tant que le tournoi n'est pas joué.
 */

import { ImageResponse } from "@vercel/og";
import { ogFill, ogMapDataUri, OG_MAP_COLORS, type OgMapHex } from "../../lib/og-map";
import { COLOR_BY_CODE, GENERATED_HEXES, NATION_BY_CODE, loadOgFonts, restSelect, OG_WIDTH, OG_HEIGHT } from "../_lib/og";

export const config = { runtime: "edge" };

type NationRow = { code: string; name_fr: string };
type HexState = { id: number; owner: string | null; state: string };

export default async function handler() {
  let champion: NationRow | null = null;
  let mapHexes: OgMapHex[] = [];
  try {
    const [champions, hexes] = await Promise.all([
      restSelect<NationRow>("nations?select=code,name_fr&status=eq.champion&limit=1"),
      restSelect<HexState>("hexes?select=id,owner,state&limit=1000"),
    ]);
    champion = champions[0] ?? null;
    const states = new Map(hexes.map((h) => [h.id, h]));
    mapHexes = GENERATED_HEXES.map((g) => {
      const s = states.get(g.id);
      return { q: g.q, r: g.r, fill: ogFill(s?.state ?? "neutral", s?.owner ?? null, COLOR_BY_CODE) };
    });
  } catch {
    mapHexes = GENERATED_HEXES.map((g) => ({
      q: g.q,
      r: g.r,
      fill: g.original_owner ? COLOR_BY_CODE.get(g.original_owner) ?? OG_MAP_COLORS.neutral : OG_MAP_COLORS.neutral,
    }));
  }

  const championSeed = champion ? NATION_BY_CODE.get(champion.code) : undefined;
  const title = champion ? `${champion.name_fr.toUpperCase()}, SUR LE TOIT DU MONDE` : "LA FINALE DE L'ATLAS";
  const subtitle = champion
    ? "La carte entière est passée à ses couleurs — sauf les memorials, intouchables."
    : "La page finale s'ouvrira quand la carte aura désigné son champion.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: OG_MAP_COLORS.background,
        }}
      >
        <img src={ogMapDataUri(mapHexes, OG_WIDTH, 460)} width={OG_WIDTH} height={460} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 56px",
            borderTop: `8px solid ${championSeed?.color ?? "#C9A227"}`,
            gap: 4,
          }}
        >
          <span style={{ fontFamily: "Bebas Neue", fontSize: 60, color: "#F9F8F6", letterSpacing: 2 }}>{title}</span>
          <span style={{ fontFamily: "Inter", fontSize: 22, color: "rgba(249,248,246,0.7)" }}>{subtitle}</span>
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts: await loadOgFonts(),
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    },
  );
}
