import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atlasClient } from "../_lib/atlas-api";
import { atlasOgSvg } from "../_lib/svg";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Number(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  let title = "Match du Mondial";
  let subtitle = "La carte bouge avec le résultat réel.";

  if (Number.isFinite(id)) {
    try {
      const [{ data: match }, { data: resolution }] = await Promise.all([
        atlasClient().from("matches").select("home, away, score_home, score_away").eq("id", id).maybeSingle(),
        atlasClient().from("resolutions").select("narrative").eq("match_id", id).maybeSingle(),
      ]);
      if (match) {
        const score = match.score_home !== null ? `${match.score_home}-${match.score_away}` : "VS";
        title = `${match.home ?? "?"} ${score} ${match.away ?? "?"}`;
      }
      if (resolution?.narrative) subtitle = resolution.narrative;
    } catch {
      // Fallback SVG.
    }
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  res.status(200).send(atlasOgSvg(title, subtitle));
}
