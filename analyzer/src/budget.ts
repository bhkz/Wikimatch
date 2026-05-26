import { AI_DAILY_EUR_CAP } from "./config.js";
import { supabase } from "./supabase.js";

/**
 * Cumul du coût IA estimé pour la journée UTC en cours.
 * Lit tous les ai_analysis_runs de la table publique partagée avec le Desk.
 */
export async function dailyAiSpendEur(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ai_analysis_runs")
    .select("estimated_cost_eur")
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    console.error("[budget] failed to read ai_analysis_runs:", error.message);
    return 0;
  }
  return (data ?? []).reduce(
    (sum, row) => sum + (Number(row?.estimated_cost_eur) || 0),
    0,
  );
}

/**
 * True si on a encore du budget pour appeler un provider payant aujourd'hui.
 */
export async function isBudgetAvailable(): Promise<boolean> {
  const spent = await dailyAiSpendEur();
  return spent < AI_DAILY_EUR_CAP;
}
