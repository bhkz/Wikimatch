import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function readPublishedSnapshot(pageKey: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("public_page_snapshots")
    .select("payload")
    .eq("page_key", pageKey)
    .in("publication_status", ["published", "corrected"])
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.payload ?? null;
}
