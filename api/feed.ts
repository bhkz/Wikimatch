import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient } from "./_lib/atlas-api";

const SITE = "https://atlas-mondial.vercel.app";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  try {
    const { data, error } = await atlasClient()
      .from("resolutions")
      .select("match_id, narrative, resolved_at")
      .order("resolved_at", { ascending: false })
      .limit(30);
    if (error) throw error;

    const items = (data ?? [])
      .map(
        (row) => `<item>
<title>${esc(row.narrative as string)}</title>
<link>${SITE}/m/${row.match_id}</link>
<guid>${SITE}/m/${row.match_id}</guid>
<pubDate>${new Date(row.resolved_at as string).toUTCString()}</pubDate>
<description>${esc(row.narrative as string)}</description>
</item>`,
      )
      .join("");

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>L'Atlas du Mondial</title>
<link>${SITE}</link>
<description>Les derniers mouvements de la carte du Mondial 2026.</description>
${items}
</channel>
</rss>`);
  } catch {
    res.status(500).send("RSS unavailable");
  }
}
