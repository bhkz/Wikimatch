/**
 * Recap de la Nuit (spec §8, §16.4) : contenu structuré et déterministe,
 * publié après 07:30 Europe/Paris.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logJob } from "../db";

const TZ = "Europe/Paris";

function parisNow(): { date: string; minutes: number } {
  const now = new Date();
  const date = now.toLocaleDateString("en-CA", { timeZone: TZ });
  const [h, m] = now
    .toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
    .split(":")
    .map(Number);
  return { date, minutes: h * 60 + m };
}

function previousDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function windowOf(snapshotDate: string, currentDate: string): { fromUtc: string; toUtc: string } {
  return { fromUtc: `${snapshotDate}T10:00:00Z`, toUtc: `${currentDate}T05:30:00Z` };
}

export async function buildNightRecapIfDue(supabase: SupabaseClient): Promise<boolean> {
  const { date, minutes } = parisNow();
  if (minutes < 7 * 60 + 30) return false;

  const recapDate = previousDate(date);
  const atlas = supabase.schema("atlas");
  const { data: existing, error: eErr } = await atlas.from("recaps").select("date").eq("date", recapDate).maybeSingle();
  if (eErr) throw new Error(`recaps: ${eErr.message}`);
  if (existing) return false;

  const { fromUtc, toUtc } = windowOf(recapDate, date);
  const [
    { data: resolutions, error: rErr },
    { data: events, error: evErr },
    { data: todayMatches, error: mErr },
  ] = await Promise.all([
    atlas
      .from("resolutions")
      .select("match_id, winner, loser, is_draw, final_gain, hexes_taken, inherited_hexes, narrative, resolved_at")
      .gte("resolved_at", fromUtc)
      .lt("resolved_at", toUtc)
      .order("resolved_at"),
    atlas.from("hex_events").select("from_owner, to_owner, created_at").gte("created_at", fromUtc).lt("created_at", toUtc).limit(5000),
    atlas
      .from("matches")
      .select("id, stage, group_letter, home, away, kickoff_utc, status")
      .gte("kickoff_utc", `${date}T00:00:00Z`)
      .lt("kickoff_utc", `${date}T23:59:59Z`)
      .order("kickoff_utc"),
  ]);
  if (rErr) throw new Error(`resolutions: ${rErr.message}`);
  if (evErr) throw new Error(`hex_events: ${evErr.message}`);
  if (mErr) throw new Error(`matches: ${mErr.message}`);

  const movement = new Map<string, { gained: number; lost: number; delta: number }>();
  const bump = (code: string | null, key: "gained" | "lost") => {
    if (!code) return;
    const row = movement.get(code) ?? { gained: 0, lost: 0, delta: 0 };
    row[key]++;
    row.delta = row.gained - row.lost;
    movement.set(code, row);
  };
  for (const ev of events ?? []) {
    bump(ev.to_owner as string | null, "gained");
    bump(ev.from_owner as string | null, "lost");
  }

  const biggest = [...(resolutions ?? [])].sort(
    (a, b) =>
      (b.final_gain as number) - (a.final_gain as number) ||
      String(a.resolved_at).localeCompare(String(b.resolved_at)),
  )[0] ?? null;

  const moves = [...movement.entries()]
    .map(([code, value]) => ({ code, ...value }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.code.localeCompare(b.code));

  const sections = [
    {
      type: "summary",
      title: (resolutions?.length ?? 0) > 0 ? "La carte a bougé cette nuit" : "Nuit calme",
      text:
        (resolutions?.length ?? 0) > 0
          ? `${resolutions!.length} match(s) ont redessiné la carte.`
          : "Aucune résolution sur la fenêtre de nuit.",
      resolution_count: resolutions?.length ?? 0,
    },
    biggest
      ? {
          type: "major_event",
          title: "Fait majeur",
          match_id: biggest.match_id,
          text: biggest.narrative,
          final_gain: biggest.final_gain,
        }
      : { type: "major_event", title: "Fait majeur", text: "Aucun basculement territorial cette nuit." },
    {
      type: "movements",
      title: "Mouvements",
      gains: moves.filter((m) => m.delta > 0).slice(0, 5),
      losses: moves.filter((m) => m.delta < 0).slice(0, 5),
    },
    {
      type: "tonight",
      title: "Ce soir",
      matches: todayMatches ?? [],
    },
  ];

  const { error: iErr } = await atlas.from("recaps").insert({
    date: recapDate,
    sections,
    published_at: new Date().toISOString(),
  });
  if (iErr) throw new Error(`recaps insert: ${iErr.message}`);

  await logJob(supabase, "build_night_recap", true, {
    date: recapDate,
    resolutions: resolutions?.length ?? 0,
    matchesTonight: todayMatches?.length ?? 0,
  });
  console.log(`✓ recap ${recapDate} publié (${resolutions?.length ?? 0} résolution(s)).`);
  return true;
}
