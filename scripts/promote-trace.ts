import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as readline from "node:readline";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variables d'environnement manquantes : SUPABASE_URL ou SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log("=== WikiMatch V2 — Desk-light Trace Moderator ===");

  const args = process.argv.slice(2);
  let searchId = args[0];

  // If no ID is specified, list the most recent traces
  if (!searchId) {
    console.log("\nRecherche des 10 dernières traces observées...");
    const { data: recentTraces, error } = await supabase
      .from("revision_traces")
      .select(`
        id,
        revision_id,
        observed_at,
        change_kind,
        public_status,
        article:wiki_articles (
          page_title,
          language_code
        )
      `)
      .order("observed_at", { ascending: false })
      .limit(10);

    if (error) {
      rl.close();
      throw error;
    }

    if (!recentTraces || recentTraces.length === 0) {
      console.log("ℹ️ Aucune trace trouvée dans la table revision_traces. Le worker a-t-il tourné (WORKER_DRY_RUN=false) ?");
      const testChoice = await askQuestion("\nVoulez-vous injecter une trace de test dans Supabase pour essayer le modérateur ? (y/n, défaut: n) : ");
      if (testChoice.trim().toLowerCase() === "y" || testChoice.trim().toLowerCase() === "o") {
        console.log("\nInjection d'une trace de test...");
        // Get an article from wiki_articles to link our trace to!
        const { data: articles } = await supabase.from("wiki_articles").select("id, page_title, language_code").limit(1);
        if (!articles || articles.length === 0) {
          console.log("❌ Impossible d'injecter une trace car la table wiki_articles est vide. Veuillez d'abord lancer 'npm run seed:watchlist'.");
          rl.close();
          process.exit(0);
        }
        const article = articles[0];
        const traceId = "d7b92bbd-98e3-4708-bd97-6a152fb4db8f";
        const revId = 999999999;
        
        // Upsert revision_traces
        const { error: rtError } = await supabase.from("revision_traces").upsert({
          id: traceId,
          article_id: article.id,
          wikimedia_event_id: "test-event-id-0001",
          revision_id: revId,
          observed_at: new Date().toISOString(),
          revision_timestamp: new Date().toISOString(),
          source_revision_url: `https://${article.language_code}.wikipedia.org/wiki/${encodeURIComponent(article.page_title)}?oldid=${revId}`,
          change_kind: "incident_mention_added",
          public_status: "private_raw"
        });
        if (rtError) {
          rl.close();
          throw rtError;
        }

        // Upsert trace_private_content
        const { error: tpcError } = await supabase.from("trace_private_content").upsert({
          trace_id: traceId,
          raw_added_text: "Ren Ito scored a fantastic goal in the final seconds of the game.",
          raw_removed_text: null
        });
        if (tpcError) {
          rl.close();
          throw tpcError;
        }

        console.log("✅ Trace de test injectée avec succès !");
        searchId = traceId;
      } else {
        console.log("Fermeture.");
        rl.close();
        process.exit(0);
      }
    } else {
      console.log("\nDernières traces trouvées :");
      recentTraces.forEach((t: any, index) => {
        console.log(`[${index + 1}] ID: ${t.id} (Rev: ${t.revision_id})`);
        console.log(`    Article: ${t.article?.page_title} [${t.article?.language_code?.toUpperCase()}]`);
        console.log(`    Date: ${t.observed_at} | Kind: ${t.change_kind} | Status actuel: ${t.public_status}`);
        console.log("----------------------------------------------------------------");
      });

      const choiceInput = await askQuestion("\nEntrez le numéro [1-10] ou collez directement un ID / Revision ID : ");
      const chosenIndex = parseInt(choiceInput, 10) - 1;

      if (chosenIndex >= 0 && chosenIndex < recentTraces.length) {
        searchId = recentTraces[chosenIndex].id;
      } else {
        searchId = choiceInput.trim();
      }
    }
  }

  if (!searchId) {
    console.log("❌ Aucun ID spécifié. Fermeture.");
    rl.close();
    process.exit(1);
  }

  // 1. Fetch trace
  console.log(`\nRecherche de la trace : ${searchId}...`);
  let query = supabase.from("revision_traces").select(`
    id,
    revision_id,
    source_revision_url,
    change_kind,
    public_status,
    article:wiki_articles (
      page_title,
      language_code
    )
  `);

  if (searchId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    query = query.eq("id", searchId);
  } else if (!isNaN(Number(searchId))) {
    query = query.eq("revision_id", Number(searchId));
  } else {
    console.log("❌ Format d'identifiant invalide (doit être un UUID ou un Revision ID numérique).");
    rl.close();
    process.exit(1);
  }

  const { data: traceData, error: traceError } = await query.maybeSingle();
  if (traceError) {
    rl.close();
    throw traceError;
  }

  if (!traceData) {
    console.log(`❌ Impossible de trouver une trace correspondant à : ${searchId}`);
    rl.close();
    process.exit(1);
  }


  const trace = traceData as any;
  console.log("\n✅ Trace chargée avec succès !");
  console.log(`- Article : ${trace.article?.page_title} [${trace.article?.language_code?.toUpperCase()}]`);
  console.log(`- Type d'edit initial : ${trace.change_kind}`);
  console.log(`- Status de publication actuel : ${trace.public_status}`);
  console.log(`- URL source : ${trace.source_revision_url}`);

  // Fetch private diff content if available
  const { data: privateContent } = await supabase
    .from("trace_private_content")
    .select("raw_added_text, raw_removed_text")
    .eq("trace_id", trace.id)
    .maybeSingle();

  if (privateContent) {
    console.log("\n[Diff Privé trouvé dans la base]");
    if (privateContent.raw_added_text) {
      console.log(`➕ Ajouté brut : "${privateContent.raw_added_text}"`);
    }
    if (privateContent.raw_removed_text) {
      console.log(`➖ Retiré brut : "${privateContent.raw_removed_text}"`);
    }
  } else {
    console.log("\nℹ️ Aucun diff privé associé trouvé.");
  }

  // 2. Interactive Prompts
  console.log("\n--- Modération de l'extrait public ---");
  const addedExcerptInput = await askQuestion(`Extrait ajouté public [défaut: "${privateContent?.raw_added_text || ''}"] : `);
  const addedExcerpt = addedExcerptInput.trim() || privateContent?.raw_added_text || "";

  const removedExcerptInput = await askQuestion(`Extrait retiré public [défaut: "${privateContent?.raw_removed_text || ''}"] : `);
  const removedExcerpt = removedExcerptInput.trim() || privateContent?.raw_removed_text || "";

  const translatedExcerpt = (await askQuestion("Traduction française de l'extrait public : ")).trim() || null;

  const defaultAttribution = `Wikipedia (${trace.article?.language_code}) — révision ${trace.revision_id}`;
  const attribution = (await askQuestion(`Attribution de la source [défaut: "${defaultAttribution}"] : `)).trim() || defaultAttribution;

  console.log("\nStatut de publication public :");
  console.log("1. public_substantive (Changement majeur / substantiel)");
  console.log("2. public_minor (Changement mineur)");
  console.log("3. linked_to_story (Relié à une histoire publiée)");
  const statusChoice = await askQuestion("Choisissez le statut [1-3, défaut: 1] : ");
  let publicStatus = "public_substantive";
  if (statusChoice === "2") publicStatus = "public_minor";
  else if (statusChoice === "3") publicStatus = "linked_to_story";

  console.log("\nType de changement :");
  console.log(`- Actuel : ${trace.change_kind || "formatting"}`);
  console.log("Exemples : incident_mention_added, sanction_added, result_added, formatting, etc.");
  const changeKindInput = await askQuestion(`Nouveau type [défaut: "${trace.change_kind || 'formatting'}"] : `);
  const changeKind = changeKindInput.trim() || trace.change_kind || "formatting";

  // 3. Upsert into public_trace_excerpts
  console.log("\nEnregistrement de l'extrait public...");
  const { error: excerptUpsertError } = await supabase
    .from("public_trace_excerpts")
    .upsert({
      trace_id: trace.id,
      public_added_excerpt: addedExcerpt || null,
      public_removed_excerpt: removedExcerpt || null,
      translated_excerpt: translatedExcerpt || null,
      source_attribution_label: attribution,
      source_revision_url: trace.source_revision_url,
      license_label: "CC BY-SA 4.0",
      safe_to_publish: true,
      reviewed_at: new Date().toISOString(),
    }, { onConflict: "trace_id" });

  if (excerptUpsertError) throw excerptUpsertError;

  // 4. Update revision_traces status
  console.log("Mise à jour du statut de la trace...");
  const { error: traceUpdateError } = await supabase
    .from("revision_traces")
    .update({
      public_status: publicStatus,
      change_kind: changeKind,
      ingest_status: "published_evidence",
    })
    .eq("id", trace.id);

  if (traceUpdateError) throw traceUpdateError;

  console.log("\n🎉 Trace promue et publiée avec succès sur l'Observatoire public !");
  console.log(`- ID: ${trace.id}`);
  console.log(`- Statut public: ${publicStatus}`);
  console.log(`- Extrait visible : ${addedExcerpt || removedExcerpt}`);
  console.log(`- Traduction : ${translatedExcerpt || "aucune"}`);
  
  rl.close();
}

main().catch((error) => {
  console.error("❌ Une erreur est survenue lors de la promotion :", error);
  rl.close();
  process.exit(1);
});
