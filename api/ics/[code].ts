/**
 * GET /api/ics/:code — calendrier ICS des matchs d'une nation (rétention
 * sans compte : « ses matchs dans mon agenda »). Heures en UTC, les agendas
 * convertissent. Cache CDN 1 h.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient } from "../_lib/atlas-api";

const SITE = "https://atlas-mondial.vercel.app";

const STAGE_FR: Record<string, string> = {
  GROUP: "Groupes",
  R32: "16e de finale",
  R16: "8e de finale",
  QF: "Quart de finale",
  SF: "Demi-finale",
  THIRD: "Petite finale",
  FINAL: "FINALE",
};

function icsDate(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;
  const code = String(req.query.code ?? "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    res.status(400).send("code FIFA invalide");
    return;
  }

  try {
    const client = atlasClient();
    const [{ data: nation, error: nErr }, { data: matches, error: mErr }] = await Promise.all([
      client.from("nations").select("code, name_fr").eq("code", code).maybeSingle(),
      client
        .from("matches")
        .select("id, stage, group_letter, home, away, kickoff_utc")
        .or(`home.eq.${code},away.eq.${code}`)
        .order("kickoff_utc"),
    ]);
    if (nErr) throw nErr;
    if (mErr) throw mErr;
    if (!nation) {
      res.status(404).send("nation inconnue");
      return;
    }

    const { data: names } = await client.from("nations").select("code, name_fr");
    const nameOf = new Map((names ?? []).map((n) => [n.code as string, n.name_fr as string]));

    const events = (matches ?? [])
      .map((m) => {
        const start = icsDate(new Date(m.kickoff_utc as string).toISOString());
        const end = icsDate(new Date(Date.parse(m.kickoff_utc as string) + 2 * 3600_000).toISOString());
        const title = `${nameOf.get(m.home as string) ?? m.home ?? "?"} – ${nameOf.get(m.away as string) ?? m.away ?? "?"} (${STAGE_FR[m.stage as string] ?? m.stage})`;
        return [
          "BEGIN:VEVENT",
          `UID:atlas-wc26-${m.id}@atlas-mondial`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:${esc(`⚽ ${title}`)}`,
          `DESCRIPTION:${esc(`Mondial 2026 · la carte bougera à la fin du match : ${SITE}/m/${m.id}`)}`,
          `URL:${SITE}/m/${m.id}`,
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="mondial-2026-${code}.ics"`);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Atlas du Mondial//WC26//FR",
        `X-WR-CALNAME:Mondial 2026 · ${esc(nation.name_fr as string)}`,
        events,
        "END:VCALENDAR",
      ].join("\r\n"),
    );
  } catch {
    res.status(500).send("ICS unavailable");
  }
}
