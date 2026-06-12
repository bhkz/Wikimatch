/**
 * Image OG d'un match (vision P2.D) : carton de score aux couleurs des deux
 * nations + récit de conquête. PNG via @vercel/og (edge).
 */

import { ImageResponse } from "@vercel/og";
import { NATION_BY_CODE, loadOgFonts, restSelect, OG_WIDTH, OG_HEIGHT } from "../_lib/og";

export const config = { runtime: "edge" };

type MatchRow = {
  id: number;
  home: string | null;
  away: string | null;
  score_home: number | null;
  score_away: number | null;
  stage: string;
};
type ResolutionRow = { narrative: string };

const STAGE_LABELS: Record<string, string> = {
  GROUP: "PHASE DE GROUPES",
  R32: "16ES DE FINALE",
  R16: "8ES DE FINALE",
  QF: "QUART DE FINALE",
  SF: "DEMI-FINALE",
  THIRD: "PETITE FINALE",
  FINAL: "FINALE",
};

/** Récit sans emojis : satori n'embarque pas de police emoji. */
function stripEmojis(text: string): string {
  return text.replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim();
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);

  let match: MatchRow | null = null;
  let narrative: string | null = null;
  try {
    const [matches, resolutions] = await Promise.all([
      restSelect<MatchRow>(`matches?select=id,home,away,score_home,score_away,stage&id=eq.${id}&limit=1`),
      restSelect<ResolutionRow>(`resolutions?select=narrative&match_id=eq.${id}&limit=1`),
    ]);
    match = matches[0] ?? null;
    narrative = resolutions[0]?.narrative ?? null;
  } catch {
    // Carton générique si la DB est injoignable.
  }

  const home = match?.home ? NATION_BY_CODE.get(match.home) : undefined;
  const away = match?.away ? NATION_BY_CODE.get(match.away) : undefined;
  const score =
    match && match.score_home !== null && match.score_away !== null
      ? `${match.score_home}–${match.score_away}`
      : "À VENIR";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#0B1021" }}>
        <div style={{ flex: 1, display: "flex" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: home?.color ?? "#3A3F4D",
            }}
          >
            <span style={{ fontFamily: "Bebas Neue", fontSize: 72, color: "#F9F8F6", textAlign: "center" }}>
              {home?.name_fr?.toUpperCase() ?? match?.home ?? "?"}
            </span>
          </div>
          <div
            style={{
              width: 280,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#0B1021",
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 18, color: "#0055FF", letterSpacing: 4 }}>
              {STAGE_LABELS[match?.stage ?? ""] ?? "MONDIAL 2026"}
            </span>
            <span style={{ fontFamily: "Bebas Neue", fontSize: 110, color: "#F9F8F6" }}>{score}</span>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: away?.color ?? "#3A3F4D",
            }}
          >
            <span style={{ fontFamily: "Bebas Neue", fontSize: 72, color: "#F9F8F6", textAlign: "center" }}>
              {away?.name_fr?.toUpperCase() ?? match?.away ?? "?"}
            </span>
          </div>
        </div>
        <div
          style={{
            height: 150,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 56px",
            borderTop: "4px solid #0055FF",
            gap: 6,
          }}
        >
          <span style={{ fontFamily: "Inter", fontSize: 26, color: "rgba(249,248,246,0.85)" }}>
            {narrative ? stripEmojis(narrative) : "La carte attend le verdict du terrain."}
          </span>
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 18, color: "#0055FF", letterSpacing: 4 }}>
            L'ATLAS DU MONDIAL · LA CARTE VIVANTE
          </span>
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts: await loadOgFonts(),
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    },
  );
}
