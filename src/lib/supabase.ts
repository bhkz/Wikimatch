/**
 * Client Supabase FRONT — clé anon, lecture seule (RLS, spec §15).
 * Requiert dans .env : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    throw new Error(
      "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants dans .env — clés publiques (anon), pas la service key.",
    );
  }
  client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Accès au schéma atlas (lecture seule via RLS). Lazy : une erreur de config
 *  s'affiche en bandeau dans l'UI au lieu de faire tomber toute l'app. */
export const atlas = new Proxy({} as ReturnType<SupabaseClient["schema"]>, {
  get(_target, prop) {
    const schema = getClient().schema("atlas");
    const value = schema[prop as keyof typeof schema];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(schema) : value;
  },
});
