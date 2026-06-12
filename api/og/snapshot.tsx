/**
 * Image OG « état du monde » (vision P2.D) : la VRAIE carte, en PNG (les
 * crawlers n'affichent pas le SVG). ?date=YYYY-MM-DD → frame du snapshot ;
 * sans date → carte vivante actuelle. Edge runtime + @vercel/og.
 */

import { ImageResponse } from "@vercel/og";
import { ogFill, ogMapDataUri, OG_MAP_COLORS, type OgMapHex } from "../../lib/og-map";
import { COLOR_BY_CODE, GENERATED_HEXES, loadOgFonts, restSelect, OG_WIDTH, OG_HEIGHT } from "../_lib/og";

export const config = { runtime: "edge" };

type HexState = { id: number; owner: string | null; state: string };
type SnapshotRow = { frame: HexState[]; deltas: Record<string, { gained: number; lost: number }> };

async function loadHexStates(date: string | null): Promise<{ states: Map<number, HexState>; subtitle: string }> {
  if (date) {
    const rows = await restSelect<SnapshotRow>(`snapshots?select=frame,deltas&date=eq.${date}&limit=1`);
    if (rows.length > 0) {
      const movers = Object.values(rows[0].deltas ?? {}).filter((d) => d.gained > 0 || d.lost > 0).length;
      return {
        states: new Map(rows[0].frame.map((h) => [h.id, h])),
        subtitle:
          movers > 0
            ? `${movers} nation${movers > 1 ? "s ont" : " a"} vu son territoire bouger cette journée-là.`
            : "Une journée calme sur la carte du monde.",
      };
    }
  }
  const rows = await restSelect<HexState>("hexes?select=id,owner,state&limit=1000");
  return {
    states: new Map(rows.map((h) => [h.id, h])),
    subtitle: "Chaque victoire réelle redessine les frontières du monde.",
  };
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  let mapHexes: OgMapHex[] = [];
  let subtitle = "Chaque victoire réelle redessine les frontières du monde.";
  try {
    const loaded = await loadHexStates(date);
    subtitle = loaded.subtitle;
    mapHexes = GENERATED_HEXES.map((g) => {
      const s = loaded.states.get(g.id);
      return { q: g.q, r: g.r, fill: ogFill(s?.state ?? "neutral", s?.owner ?? null, COLOR_BY_CODE) };
    });
  } catch {
    // Carte d'origine (seeds) si la DB est injoignable : jamais d'image cassée.
    mapHexes = GENERATED_HEXES.map((g) => ({
      q: g.q,
      r: g.r,
      fill: g.original_owner ? COLOR_BY_CODE.get(g.original_owner) ?? OG_MAP_COLORS.neutral : OG_MAP_COLORS.neutral,
    }));
  }

  const title = date
    ? `LE MONDE DU ${new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }).toUpperCase()}`
    : "LA CARTE VIVANTE DU MONDIAL";

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
        <img src={ogMapDataUri(mapHexes, OG_WIDTH, 470)} width={OG_WIDTH} height={470} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 56px",
            borderTop: "4px solid #0055FF",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <span style={{ fontFamily: "Bebas Neue", fontSize: 64, color: "#F9F8F6", letterSpacing: 2 }}>{title}</span>
            <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 20, color: "#0055FF", letterSpacing: 4 }}>
              L'ATLAS DU MONDIAL
            </span>
          </div>
          <span style={{ fontFamily: "Inter", fontSize: 24, color: "rgba(249,248,246,0.7)" }}>{subtitle}</span>
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
