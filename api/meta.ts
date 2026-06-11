/**
 * OG/SEO dynamiques (spec §14), servi aux crawlers via les rewrites
 * conditionnés au User-Agent dans vercel.json. Les humains reçoivent la SPA.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServerSupabaseClient } from "./_lib/supabase";

const SITE_NAME = "L'Atlas du Mondial";
const DEFAULT_DESC =
  "La Coupe du Monde 2026 racontée par une carte : chaque victoire réelle redessine les frontières du monde.";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function page(title: string, description: string, path: string, imagePath = "/api/og/snapshot"): string {
  const t = esc(`${title} · ${SITE_NAME}`);
  const d = esc(description);
  const url = `https://atlas-mondial.vercel.app${path}`;
  const image = `https://atlas-mondial.vercel.app${imagePath}`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(path)}">
</head><body><a href="${esc(path)}">${t}</a></body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = typeof req.query.path === "string" ? req.query.path : "/";
  let title = "La carte vivante du Mondial 2026";
  let description = DEFAULT_DESC;
  let imagePath = "/api/og/snapshot";

  try {
    const atlas = createServerSupabaseClient().schema("atlas");

    const matchRoute = path.match(/^\/m\/(\d+)$/);
    const nationRoute = path.match(/^\/n\/([A-Za-z]{3})$/);
    const snapshotRoute = path.match(/^\/snapshot\/([\d-]+)$/);

    if (matchRoute) {
      const id = Number(matchRoute[1]);
      const [{ data: m }, { data: r }] = await Promise.all([
        atlas.from("matches").select("home, away, score_home, score_away, stage").eq("id", id).maybeSingle(),
        atlas.from("resolutions").select("narrative").eq("match_id", id).maybeSingle(),
      ]);
      imagePath = `/api/og/match?id=${id}`;
      if (m) {
        const score = m.score_home !== null ? `${m.score_home}-${m.score_away}` : "à venir";
        title = `${m.home ?? "?"} ${score} ${m.away ?? "?"}`;
        if (r?.narrative) description = r.narrative;
      }
    } else if (nationRoute) {
      const code = nationRoute[1].toUpperCase();
      const { data: n } = await atlas
        .from("nations")
        .select("name_fr, status, group_letter")
        .eq("code", code)
        .maybeSingle();
      if (n) {
        title = `${n.name_fr} sur la carte du Mondial`;
        description =
          n.status === "eliminated"
            ? `${n.name_fr} a quitté le tournoi : sa capitale est entrée au memorial.`
            : n.status === "champion"
              ? `${n.name_fr}, championne du monde : la carte entière à ses couleurs.`
              : `Groupe ${n.group_letter} : suivez son territoire évoluer match après match.`;
      }
    } else if (path.startsWith("/nuit/")) {
      const date = path.slice(6);
      title = `La nuit du ${date}`;
      description = "Ce que les matchs de la nuit ont changé sur la carte du monde.";
      imagePath = `/api/og/snapshot?date=${encodeURIComponent(date)}`;
    } else if (snapshotRoute) {
      const date = snapshotRoute[1];
      title = `Carte du ${date}`;
      description = "Un état figé de la carte du Mondial, prêt à partager.";
      imagePath = `/api/og/snapshot?date=${encodeURIComponent(date)}`;
    } else if (path === "/fin") {
      const { data: champion } = await atlas
        .from("nations")
        .select("name_fr, status")
        .eq("status", "champion")
        .maybeSingle();
      title = champion ? `${champion.name_fr} championne du monde` : "La finale de l'Atlas";
      description = champion
        ? "La carte finale, les superlatifs et le replay complet du tournoi."
        : "La page finale s'ouvrira quand la carte aura désigné son champion.";
      imagePath = "/api/og/final";
    }
  } catch {
    // OG par défaut si la DB est indisponible.
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(page(title, description, path, imagePath));
}
