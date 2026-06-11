/**
 * Healthcheck métier (spec §16.6) : alerte si un match aurait dû être
 * FINISHED depuis longtemps sans l'être (API muette, id changé, incident).
 * La parade est humaine : saisie match_overrides depuis /admin (§21.4).
 * Dédoublonné par match via ingest_state pour ne pas spammer le webhook.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { alert, logJob } from "../db";

/** Fenêtre §16.1 (kickoff+180 min de live possible) + 30 min de marge spec. */
const LATE_AFTER_MIN = 210;
const STATE_KEY = "healthcheck_late_alerted";

export async function checkLateMatches(supabase: SupabaseClient): Promise<void> {
  const atlas = supabase.schema("atlas");
  const cutoff = new Date(Date.now() - LATE_AFTER_MIN * 60_000).toISOString();

  const { data: late, error } = await atlas
    .from("matches")
    .select("id, home, away, status, kickoff_utc")
    .lt("kickoff_utc", cutoff)
    .in("status", ["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"]);
  if (error) throw new Error(`matches (late): ${error.message}`);
  if (!late || late.length === 0) return;

  const { data: state } = await atlas.from("ingest_state").select("value").eq("key", STATE_KEY).maybeSingle();
  const alerted = new Set<number>(((state?.value as number[] | undefined) ?? []));
  const fresh = late.filter((m) => !alerted.has(m.id as number));
  if (fresh.length === 0) return;

  const lines = fresh.map(
    (m) => `· match ${m.id} ${m.home ?? "?"}–${m.away ?? "?"} (coup d'envoi ${m.kickoff_utc}, statut ${m.status})`,
  );
  await alert(
    `⚠️ ${fresh.length} match(s) sans statut FINISHED bien après l'heure attendue :\n${lines.join("\n")}\n→ vérifier l'API ou saisir un override sur /admin.`,
  );
  await logJob(supabase, "healthcheck", false, { late: fresh.map((m) => m.id) });

  const next = [...alerted, ...fresh.map((m) => m.id as number)];
  await atlas.from("ingest_state").upsert({ key: STATE_KEY, value: next });
}
