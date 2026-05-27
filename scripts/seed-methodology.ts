import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const content = {
  definitions: [
    {
      id: "trace",
      term: "Trace",
      shortDefinition: "Modification publique observée sur un article Wikipédia suivi.",
      fullDefinition: "Une trace est un fait technique observé : article, édition linguistique, heure, révision et éventuellement extrait privé. Une trace n'est pas une histoire publiée.",
    },
    {
      id: "story",
      term: "Histoire",
      shortDefinition: "Récit public produit uniquement quand plusieurs preuves publiables le justifient.",
      fullDefinition: "Une histoire est une publication structurée, sourcée et limitée. Elle ne déduit jamais une intention de contributeur ni une opinion nationale.",
    },
    {
      id: "language-edition",
      term: "Édition linguistique",
      shortDefinition: "Version de Wikipédia dans une langue, pas représentation d'un pays.",
      fullDefinition: "WikiMatch compare des articles par langue. Une édition linguistique ne représente ni un pays, ni un public, ni la localisation des contributeurs.",
    },
  ],
  pipeline: [
    {
      id: "observe",
      number: "01",
      label: "Observer",
      title: "Observer les articles suivis",
      description: "Le worker écoute Wikimedia EventStreams et stocke les modifications dans revision_traces.",
      visibleIn: "observatory",
      statusLabel: "PUBLIC",
    },
    {
      id: "protect",
      number: "02",
      label: "Protéger",
      title: "Garder les diffs bruts privés",
      description: "Les contenus bruts sont stockés dans trace_private_content et ne sont jamais exposés publiquement sans modération.",
      visibleIn: "desk_private",
      statusLabel: "PRIVÉ",
    },
    {
      id: "publish",
      number: "03",
      label: "Publier",
      title: "Publier uniquement les preuves sûres",
      description: "Le public ne voit que les stories et extraits marqués comme publiables.",
      visibleIn: "magazine",
      statusLabel: "VALIDÉ",
    },
  ],
  cases: [],
  comparisonRules: [
    {
      id: "language-not-country",
      incorrectAssumption: "Une édition linguistique équivaut à l'opinion d'un pays.",
      correctReading: "Une édition linguistique est un article dans une langue, pas un sondage national.",
    },
  ],
  publicationCriteria: [
    {
      id: "evidence",
      question: "Le fait est-il vérifiable depuis une source publique ou un extrait modéré ?",
      acceptedAnswer: "Oui, avec lien de révision et contexte.",
      rejectedExample: "Non, si l'affirmation repose sur un volume d'édition ou une interprétation automatique seule.",
    },
  ],
  aiRules: [
    {
      id: "assistant-only",
      task: "Extraction et résumé internes",
      allowed: true,
      explanation: "L'IA peut aider à structurer des propositions, mais ne publie pas seule.",
    },
    {
      id: "no-intent",
      task: "Attribuer une intention à un contributeur",
      allowed: false,
      explanation: "WikiMatch ne publie pas d'hypothèse sur les motivations individuelles.",
    },
  ],
  privacyPrinciples: [
    {
      id: "no-contributor",
      title: "Pas de contributeur public",
      description: "Le site ne publie ni IP, ni compte temporaire, ni classement de contributeurs.",
      prohibitedPublicOutput: ["IP", "compte temporaire", "classement individuel", "carte des auteurs"],
    },
  ],
  limitations: [
    {
      id: "wikipedia-is-not-official",
      title: "Wikipédia n'est pas la source sportive officielle",
      description: "Les scores, horaires et événements sportifs doivent provenir de sources officielles identifiées.",
      consequence: "Une modification Wikipédia peut être observée, mais ne suffit pas à établir un résultat sportif.",
    },
  ],
  faq: [
    {
      id: "automatic",
      question: "Le site est-il automatique ?",
      answer: "La collecte et les agrégations sont automatiques. Les contenus publics restent filtrés par des règles de sécurité et de publication.",
    },
  ],
  versions: [
    {
      version: "v2-live",
      dateLabel: "27 mai 2026",
      status: "Version live",
      changes: ["Suppression des fallbacks fictifs publics", "Connexion aux traces Wikimedia et aux tables Supabase live"],
    },
  ],
};

async function main() {
  const { error } = await supabase.from("methodology_versions").upsert({
    version_label: "v2-live",
    status: "published",
    published_at: new Date().toISOString(),
    summary: "Méthodologie publique WikiMatch V2 live.",
    content_json: content,
  }, { onConflict: "version_label" });

  if (error) throw error;
  console.log("Seeded published methodology version v2-live.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
