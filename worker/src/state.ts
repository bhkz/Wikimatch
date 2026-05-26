import { STREAM_NAME } from "./config";
import { supabase } from "./supabase";

export interface WorkerState {
  lastEventId: string | null;
  lastEventAt: string | null;
}

export async function loadState(): Promise<WorkerState> {
  const { data, error } = await supabase
    .from("ingest_checkpoints")
    .select("last_confirmed_event_id, last_confirmed_at")
    .eq("stream_name", STREAM_NAME)
    .maybeSingle();

  if (error) {
    console.error("[state] failed to load:", error.message);
    return { lastEventId: null, lastEventAt: null };
  }

  return {
    lastEventId: data?.last_confirmed_event_id ?? null,
    lastEventAt: data?.last_confirmed_at ?? null,
  };
}

export async function persistState(
  lastEventId: string | null,
  lastEventAt: Date,
): Promise<void> {
  const { error } = await supabase.from("ingest_checkpoints").upsert({
    stream_name: STREAM_NAME,
    last_confirmed_event_id: lastEventId,
    last_confirmed_at: lastEventAt.toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) console.error("[state] failed to persist:", error.message);
}

