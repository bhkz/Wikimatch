import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atlasClient } from "../_lib/atlas-api";
import { atlasOgSvg } from "../_lib/svg";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;
  let title = date ? `Carte du ${date}` : "Snapshot quotidien";
  let subtitle = "Le monde du Mondial au réveil.";

  if (date) {
    try {
      const { data } = await atlasClient().from("snapshots").select("deltas").eq("date", date).maybeSingle();
      const deltas = data?.deltas && typeof data.deltas === "object" ? Object.keys(data.deltas).length : 0;
      subtitle = `${deltas} nation(s) ont changé de territoire sur cette journée Atlas.`;
    } catch {
      // Fallback SVG.
    }
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  res.status(200).send(atlasOgSvg(title, subtitle));
}
