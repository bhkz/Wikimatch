import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log("=== Seeding live relations in Supabase matching exact schema ===");

  // 1. Seed Entities
  const entities = [
    {
      slug: "france-national-team",
      type: "team",
      canonical_label: "France",
      wikidata_qid: "Q47774",
      subject_geography_label: "France",
      subject_latitude: 46.2276,
      subject_longitude: 2.2137,
    },
    {
      slug: "belgium-national-team",
      type: "team",
      canonical_label: "Belgique",
      wikidata_qid: "Q166776",
      subject_geography_label: "Belgium",
      subject_latitude: 50.5039,
      subject_longitude: 4.4699,
    },
    {
      slug: "ren-ito",
      type: "player",
      canonical_label: "Ren Ito",
      wikidata_qid: null,
      subject_geography_label: "Japan",
      subject_latitude: 36.2048,
      subject_longitude: 138.2529,
    }
  ];

  const { data: entityData, error: entityError } = await supabase
    .from("entities")
    .upsert(entities, { onConflict: "slug" })
    .select();
  if (entityError) throw entityError;
  console.log(`✅ Seeded ${entityData.length} entities.`);

  const franceId = entityData.find(e => e.slug === "france-national-team")?.id;
  const belgiumId = entityData.find(e => e.slug === "belgium-national-team")?.id;
  const renItoId = entityData.find(e => e.slug === "ren-ito")?.id;

  // 2. Seed Matches
  const matches = [
    {
      slug: "demo-france-belgique",
      competition_label: "Coupe du Monde 2026",
      stage_label: "PHASE DE GROUPES",
      scheduled_at: new Date("2026-06-18T21:00:00Z").toISOString(),
      home_team_entity_id: franceId,
      away_team_entity_id: belgiumId,
      status: "completed",
    },
    {
      slug: "demo-japan-senegal",
      competition_label: "Coupe du Monde 2026",
      stage_label: "PHASE DE GROUPES",
      scheduled_at: new Date("2026-06-11T18:00:00Z").toISOString(),
      home_team_entity_id: renItoId,
      away_team_entity_id: null,
      status: "upcoming",
    }
  ];

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .upsert(matches, { onConflict: "slug" })
    .select();
  if (matchError) throw matchError;
  console.log(`✅ Seeded ${matchData.length} matches.`);

  const franceBelgiumMatchId = matchData.find(m => m.slug === "demo-france-belgique")?.id;

  // 3. Seed Published Stories
  const stories = [
    {
      slug: "demo-divergence",
      story_type: "language_divergence",
      title: "UN MÊME CARTON ROUGE. TROIS TRAITEMENTS WIKIPÉDIA.",
      excerpt: "Après un incident fictif de fin de match, les éditions anglaise et espagnole ne retiennent pas exactement les mêmes éléments, tandis qu’aucune mention équivalente n’est observée dans l’édition française.",
      observation_text: "Dans ce scénario fictif, l’édition anglaise mentionne une altercation suivie d’un carton rouge. L’édition espagnole mentionne uniquement la sanction. Aucune mention équivalente de l’incident n’est détectée dans l’édition française au moment de la comparaison.",
      interpretation_text: "Les trois articles comparés ne retiennent pas encore les mêmes éléments du même épisode de match.",
      limitation_text: "Cette différence observable ne permet pas de déduire l’opinion des publics, des pays ou des contributeurs. Une édition linguistique de Wikipédia n’est pas la voix d’une nation.",
      entity_id: renItoId,
      match_id: franceBelgiumMatchId,
      publication_status: "published",
      published_at: new Date("2026-06-18T23:10:00Z").toISOString(),
    }
  ];

  const { data: storyData, error: storyError } = await supabase
    .from("published_stories")
    .upsert(stories, { onConflict: "slug" })
    .select();
  if (storyError) throw storyError;
  console.log(`✅ Seeded ${storyData.length} published stories.`);

  console.log("=== Database Relational Seeding Completed Successfully ===");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
