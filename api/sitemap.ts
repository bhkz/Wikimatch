/**
 * sitemap.xml (spec §14) : routes statiques + 104 matchs + 48 nations +
 * journées (nuit/snapshot). Servi via le rewrite /sitemap.xml de vercel.json.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient } from "./_lib/atlas-api";

const SITE = "https://atlas-mondial.vercel.app";

const STATIC_ROUTES = ["/", "/groupes", "/tableau", "/calendrier", "/memorial", "/nuit", "/methodo"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  try {
    const client = atlasClient();
    const [{ data: matches, error: mErr }, { data: nations, error: nErr }, { data: recaps, error: rErr }] =
      await Promise.all([
        client.from("matches").select("id").order("id"),
        client.from("nations").select("code").order("code"),
        client.from("recaps").select("date").order("date"),
      ]);
    if (mErr) throw mErr;
    if (nErr) throw nErr;
    if (rErr) throw rErr;

    const urls = [
      ...STATIC_ROUTES.map((p) => `${SITE}${p}`),
      ..."ABCDEFGHIJKL".split("").map((g) => `${SITE}/groupes/${g}`),
      ...(matches ?? []).map((m) => `${SITE}/m/${m.id}`),
      ...(nations ?? []).map((n) => `${SITE}/n/${n.code}`),
      ...(recaps ?? []).flatMap((r) => [`${SITE}/nuit/${r.date}`, `${SITE}/snapshot/${r.date}`]),
    ];

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n")}
</urlset>`);
  } catch {
    res.status(500).send("sitemap unavailable");
  }
}
