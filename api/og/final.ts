import type { VercelRequest, VercelResponse } from "@vercel/node";
import { atlasClient } from "../_lib/atlas-api";
import { atlasOgSvg } from "../_lib/svg";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let title = "La finale de l'Atlas";
  let subtitle = "Le replay complet et la carte finale du Mondial.";

  try {
    const atlas = atlasClient();
    const { data: champion } = await atlas
      .from("nations")
      .select("code, name_fr, flag")
      .eq("status", "champion")
      .maybeSingle();

    if (champion) {
      const { count } = await atlas
        .from("hexes")
        .select("id", { count: "exact", head: true })
        .eq("owner", champion.code)
        .eq("state", "owned");
      title = `${champion.flag} ${champion.name_fr}`;
      subtitle = `Champion du monde : ${count ?? 0} territoires, replay complet et carte finale.`;
    }
  } catch {
    // Fallback SVG.
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  res.status(200).send(atlasOgSvg(title, subtitle));
}
