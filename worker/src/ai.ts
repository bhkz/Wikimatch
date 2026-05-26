import "dotenv/config";
import { supabase } from "./supabase";

const DAILY_BUDGET_CAP_EUR = 6.50; // Cap journalier de 6,50 €
const USD_TO_EUR_RATE = 0.92;      // Taux de conversion USD -> EUR

export interface AIAnalysisResult {
  change_kind: "formatting" | "result_added" | "incident_mention_added" | "sanction_added" | "performance_added" | "source_added";
  public_status: "public_minor" | "public_substantive";
  translated_excerpt: string | null;
  summary: string;
}

export interface AIOrchestrationOutput {
  allowed: boolean;
  currentDailySpendEur?: number;
  result?: AIAnalysisResult;
  provider?: "openai" | "gemini";
  modelName?: string;
  costEur?: number;
}

/**
 * Calcule la somme dépensée aujourd'hui sur l'IA (depuis 00:00 UTC).
 */
export async function getDailyAISpend(): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ai_analysis_runs")
    .select("estimated_cost_eur")
    .gte("created_at", startOfToday.toISOString());

  if (error) {
    console.error("[ai] Erreur lors du calcul du budget IA :", error);
    return 0;
  }

  const total = (data ?? []).reduce((sum, run) => sum + (Number(run.estimated_cost_eur) || 0), 0);
  return total;
}

/**
 * Exécute l'analyse d'IA de manière autonome et sécurisée.
 */
export async function runAutomatedAIAnalysis(
  articleTitle: string,
  languageCode: string,
  articleType: string,
  addedText: string | null,
  removedText: string | null
): Promise<AIOrchestrationOutput> {
  // 1. Vérifier le budget
  const currentDailySpend = await getDailyAISpend();
  if (currentDailySpend >= DAILY_BUDGET_CAP_EUR) {
    console.warn(`[ai] 🔌 DISJONCTEUR ACTIF : Cap journalier de ${DAILY_BUDGET_CAP_EUR} € atteint (${currentDailySpend.toFixed(4)} € dépensés). IA ignorée.`);
    return { allowed: false, currentDailySpendEur: currentDailySpend };
  }

  // 2. Construire le prompt d'analyse
  const prompt = `Vous êtes l'IA éditoriale neutre et factuelle de WikiMatch. 
Analysez cette modification apportée à l'article Wikipédia "${articleTitle}" (Édition linguistique: "${languageCode}", Type d'article: "${articleType}").

Texte ajouté : ${addedText ? `"${addedText}"` : "Aucun"}
Texte retiré : ${removedText ? `"${removedText}"` : "Aucun"}

Consignes strictes :
1. Traduisez fidèlement en français le texte ajouté ou modifié (fournissez le résultat dans "translated_excerpt"). Si rien n'est ajouté ou qu'il s'agit uniquement de mise en forme, laissez null.
2. Rédigez un résumé court, neutre, purement factuel et en français de la modification dans "summary". N'inventez RIEN, ne nommez aucun contributeur Wikipédia et n'utilisez aucun pseudo.
3. Déterminez si cette modification est mineure ("public_minor" pour les fautes, la grammaire, la typographie, les liens internes) ou majeure ("public_substantive" s'il s'agit d'un ajout ou changement de faits narratifs comme un score de match, un carton, un incident, un transfert ou une performance) dans "public_status".
4. Sélectionnez le type de changement ("change_kind") uniquement parmi la liste suivante :
   - "formatting" : correction de liens, de fautes, de mise en page.
   - "result_added" : ajout d'un score de match ou d'une qualification de club/sélection.
   - "incident_mention_added" : mention d'une altercation, bagarre, carton rouge ou incident de jeu.
   - "sanction_added" : mention d'une sanction officielle ou d'une suspension.
   - "performance_added" : mention d'un but, d'un arrêt décisif, ou d'une performance sportive majeure.
   - "source_added" : ajout d'une source ou référence bibliographique.

Vous devez obligatoirement répondre sous la forme d'un objet JSON valide unique contenant précisément ces 4 clés sans aucun autre texte autour :
{
  "change_kind": "...",
  "public_status": "...",
  "translated_excerpt": "...",
  "summary": "..."
}`;

  // 3. Essayer avec OpenAI en premier (gpt-4o-mini)
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const body = await response.json();
        const content = body.choices?.[0]?.message?.content;
        const usage = body.usage;

        if (content && usage) {
          const parsed = JSON.parse(content) as AIAnalysisResult;

          // Calculer le coût gpt-4o-mini ($0.150 / 1M tokens input, $0.600 / 1M tokens output)
          const costUSD = (usage.prompt_tokens * 0.00000015) + (usage.completion_tokens * 0.00000060);
          const costEur = costUSD * USD_TO_EUR_RATE;

          return {
            allowed: true,
            currentDailySpendEur: currentDailySpend,
            result: parsed,
            provider: "openai",
            modelName: "gpt-4o-mini",
            costEur: parseFloat(costEur.toFixed(6)),
          };
        }
      } else {
        console.warn(`[ai] Échec d'OpenAI (Statut: ${response.status}). Basculement vers Gemini...`);
      }
    } catch (err) {
      console.warn("[ai] Erreur lors de l'appel OpenAI. Basculement vers Gemini...", err);
    }
  }

  // 4. Fallback avec Gemini (gemini-2.5-flash)
  if (process.env.GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const body = await response.json();
        const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
        const usage = body.usageMetadata;

        if (text && usage) {
          const parsed = JSON.parse(text) as AIAnalysisResult;

          // Calculer le coût gemini-2.5-flash ($0.075 / 1M tokens input, $0.300 / 1M tokens output)
          const costUSD = (usage.promptTokenCount * 0.000000075) + (usage.candidatesTokenCount * 0.00000030);
          const costEur = costUSD * USD_TO_EUR_RATE;

          return {
            allowed: true,
            currentDailySpendEur: currentDailySpend,
            result: parsed,
            provider: "gemini",
            modelName: "gemini-2.5-flash",
            costEur: parseFloat(costEur.toFixed(6)),
          };
        }
      } else {
        console.error(`[ai] Échec de Gemini (Statut: ${response.status}). Impossible de procéder à l'analyse.`);
      }
    } catch (err) {
      console.error("[ai] Erreur lors de l'appel Gemini :", err);
    }
  }

  return { allowed: false, currentDailySpendEur: currentDailySpend };
}
