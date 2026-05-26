import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { DemoPublicDataProvider } from "../src/data/DemoPublicDataProvider";

type SnapshotInput = {
  page_key: string;
  payload: unknown;
  publication_status: "published";
  generated_from: string;
  generated_at: string;
};

type SnapshotTuple = readonly [pageKey: string, payload: unknown | null];

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
  const provider = new DemoPublicDataProvider();

  const story = await provider.getStoryBySlug("demo-divergence");
  const match = await provider.getMatchBySlug("demo-france-belgique");
  const entity = await provider.getEntityBySlug("demo-japan-goalkeeper");

  const generatedAt = new Date().toISOString();
  const snapshots: SnapshotTuple[] = [
    ["home", await provider.getHomePageData()],
    ["stories", await provider.getStoriesArchivePageData()],
    ["matches", await provider.getMatchesCalendarPageData()],
    ["explorer", await provider.getExplorerPageData()],
    ["observatory", await provider.getObservatoryPageData()],
    ["methodology", await provider.getMethodologyPageData()],
    ["search", await provider.getSearchPageData()],
    ["story:demo-divergence", story],
    ["match:demo-france-belgique", match],
    ["entity:demo-japan-goalkeeper", entity],
  ];

  const rows: SnapshotInput[] = snapshots
    .filter((snapshot): snapshot is readonly [string, unknown] => snapshot[1] !== null)
    .map(([page_key, payload]) => ({
      page_key,
      payload,
      publication_status: "published",
      generated_from: "demo-fixtures",
      generated_at: generatedAt,
    }));

  const { error } = await supabase
    .from("public_page_snapshots")
    .upsert(rows, { onConflict: "page_key" });

  if (error) {
    throw error;
  }

  console.log(`Seeded ${rows.length} public page snapshots:`);
  for (const row of rows) {
    console.log(`- ${row.page_key}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
