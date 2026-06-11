/**
 * Job snapshot quotidien (spec §10, §16.2) : à partir de 07:30 Europe/Paris,
 * fige l'état de la carte pour la "journée Atlas" écoulée (la veille, qui
 * couvre les matchs du soir et de la nuit) : frame compacte + deltas/nation.
 * Idempotent : PK snapshots(date).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { toFrame } from "../../../lib/engine/replay";
import type { EngineState } from "../../../lib/engine/types";
import { logJob } from "../db";

const TZ = "Europe/Paris";

function parisNow(): { date: string; minutes: number } {
  const now = new Date();
  const date = now.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
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

export async function snapshotIfDue(supabase: SupabaseClient, state: EngineState): Promise<boolean> {
  const { date, minutes } = parisNow();
  if (minutes < 7 * 60 + 30) return false; // pas avant 07:30 locale
  const snapshotDate = previousDate(date); // la journée Atlas écoulée

  const atlas = supabase.schema("atlas");
  const { data: existing, error: eErr } = await atlas
    .from("snapshots")
    .select("date")
    .eq("date", snapshotDate)
    .maybeSingle();
  if (eErr) throw new Error(`snapshots: ${eErr.message}`);
  if (existing) return false;

  // Fenêtre de la journée Atlas : veille 12:00 → jour 07:30 (heure Paris ≈ UTC+2).
  const fromUtc = `${snapshotDate}T10:00:00Z`;
  const toUtc = `${date}T05:30:00Z`;
  const { data: events, error: evErr } = await atlas
    .from("hex_events")
    .select("type, from_owner, to_owner, created_at")
    .gte("created_at", fromUtc)
    .lt("created_at", toUtc)
    .limit(5000);
  if (evErr) throw new Error(`hex_events: ${evErr.message}`);

  const deltas: Record<string, { gained: number; lost: number }> = {};
  const bump = (code: string | null, key: "gained" | "lost") => {
    if (!code) return;
    deltas[code] ??= { gained: 0, lost: 0 };
    deltas[code][key]++;
  };
  for (const ev of events ?? []) {
    bump(ev.to_owner as string | null, "gained");
    bump(ev.from_owner as string | null, "lost");
  }

  const { error: iErr } = await atlas.from("snapshots").insert({
    date: snapshotDate,
    frame: toFrame(state),
    deltas,
  });
  if (iErr) throw new Error(`snapshot insert: ${iErr.message}`);

  await logJob(supabase, "snapshot", true, { date: snapshotDate, events: events?.length ?? 0 });
  console.log(`✓ snapshot ${snapshotDate} figé (${events?.length ?? 0} events).`);
  return true;
}
