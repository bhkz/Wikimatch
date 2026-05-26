import "dotenv/config";
import { readFile } from "node:fs/promises";
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

// Helper for generating standard slugs
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// 10 Famous Referees for the World Cup 2026
const REFEREES = [
  { qid: "Q4353065", name: "Szymon Marciniak", country: "PL", sitelinks: { enwiki: "Szymon Marciniak", frwiki: "Szymon Marciniak", eswiki: "Szymon Marciniak" } },
  { qid: "Q610665", name: "Clément Turpin", country: "FR", sitelinks: { enwiki: "Clément Turpin", frwiki: "Clément Turpin", eswiki: "Clément Turpin" } },
  { qid: "Q3015152", name: "Daniele Orsato", country: "IT", sitelinks: { enwiki: "Daniele Orsato", frwiki: "Daniele Orsato", eswiki: "Daniele Orsato" } },
  { qid: "Q26207432", name: "Jesús Valenzuela", country: "VE", sitelinks: { enwiki: "Jesús Valenzuela", frwiki: "Jesús Valenzuela", eswiki: "Jesús Valenzuela" } },
  { qid: "Q932900", name: "Wilmar Roldán", country: "CO", sitelinks: { enwiki: "Wilmar Roldán", frwiki: "Wilmar Roldán", eswiki: "Wilmar Roldán" } },
  { qid: "Q1928812", name: "Michael Oliver", country: "GB-ENG", sitelinks: { enwiki: "Michael Oliver (referee)", frwiki: "Michael Oliver (arbitre)", eswiki: "Michael Oliver" } },
  { qid: "Q4773549", name: "Anthony Taylor", country: "GB-ENG", sitelinks: { enwiki: "Anthony Taylor (referee)", frwiki: "Anthony Taylor (arbitre)", eswiki: "Anthony Taylor" } },
  { qid: "Q24060241", name: "François Letexier", country: "FR", sitelinks: { enwiki: "François Letexier", frwiki: "François Letexier", eswiki: "François Letexier" } },
  { qid: "Q2078696", name: "Slavko Vinčić", country: "SI", sitelinks: { enwiki: "Slavko Vinčić", frwiki: "Slavko Vinčić", eswiki: "Slavko Vinčić" } },
  { qid: "Q26996229", name: "Facundo Tello", country: "AR", sitelinks: { enwiki: "Facundo Tello", frwiki: "Facundo Tello", eswiki: "Facundo Tello" } }
];

// Helper to chunk arrays
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function main() {
  console.log("=== Loading entities index from legacy worker ===");
  const rawIndex = await readFile("C:/Users/thoma/revision90-worker/data/index.json", "utf8");
  const index = JSON.parse(rawIndex);

  console.log("=== Seeding Tournament, Teams, Stadiums, Coaches, and Select Players ===");

  const entitiesToUpsert: any[] = [];
  const articlesToUpsert: any[] = [];
  const seenSlugs = new Set<string>();

  // 1. Add tournament
  const tournamentSlug = "2026-fifa-world-cup";
  entitiesToUpsert.push({
    slug: tournamentSlug,
    type: "tournament",
    canonical_label: "2026 FIFA World Cup",
    wikidata_qid: "Q284163",
    subject_geography_label: "North America",
    metadata: { isLive: true }
  });
  seenSlugs.add(tournamentSlug);

  // 2. Add referees
  for (const ref of REFEREES) {
    const slug = slugify(ref.name);
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    entitiesToUpsert.push({
      slug,
      type: "referee",
      canonical_label: ref.name,
      wikidata_qid: ref.qid,
      subject_geography_label: ref.country,
      metadata: { isLive: true }
    });
  }

  // 3. Process index.json
  const allowedTypes = ["team", "stadium", "coach", "player"];
  for (const qid in index) {
    const e = index[qid];
    if (!allowedTypes.includes(e.type)) continue;

    // Filter players to keep the database size reasonable and of extremely high quality:
    // Only players who have at least 3 sitelinks
    if (e.type === "player" && Object.keys(e.sitelinks || {}).length < 3) {
      continue;
    }

    const slug = slugify(e.name);
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    entitiesToUpsert.push({
      slug,
      type: e.type,
      canonical_label: e.name,
      wikidata_qid: qid,
      subject_geography_label: e.country_code || null,
      metadata: { isLive: true }
    });
  }

  console.log(`Upserting ${entitiesToUpsert.length} entities in Supabase...`);
  const entityIdMap = new Map<string, string>(); // slug -> id
  const entityQidMap = new Map<string, string>(); // qid -> id

  for (const batch of chunkArray(entitiesToUpsert, 200)) {
    const { data, error } = await supabase
      .from("entities")
      .upsert(batch, { onConflict: "slug" })
      .select("id, slug, wikidata_qid");

    if (error) {
      console.error("Entity upsert error:", error);
      throw error;
    }

    for (const row of data || []) {
      entityIdMap.set(row.slug, row.id);
      if (row.wikidata_qid) {
        entityQidMap.set(row.wikidata_qid, row.id);
      }
    }
  }
  console.log("✅ Entities upserted successfully.");

  // 4. Build wiki_articles
  // Seed tournament articles
  const tournamentId = entityIdMap.get("2026-fifa-world-cup")!;
  const tournamentSitelinks = {
    enwiki: "2026 FIFA World Cup",
    frwiki: "Coupe du monde de football 2026",
    eswiki: "Copa Mundial de Fútbol de 2026",
    jawiki: "2026 FIFAワールドカップ",
    arwiki: "كأس العالم لكرة القدم 2026"
  };
  for (const [wiki, title] of Object.entries(tournamentSitelinks)) {
    const lang = wiki.slice(0, 2);
    articlesToUpsert.push({
      entity_id: tournamentId,
      wiki_code: wiki,
      language_code: lang,
      page_title: title,
      canonical_url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      article_type: "tournament",
      monitoring_enabled: true
    });
  }

  // Seed referees articles
  for (const ref of REFEREES) {
    const refId = entityIdMap.get(slugify(ref.name))!;
    for (const [wiki, title] of Object.entries(ref.sitelinks)) {
      const lang = wiki.slice(0, 2);
      articlesToUpsert.push({
        entity_id: refId,
        wiki_code: wiki,
        language_code: lang,
        page_title: title,
        canonical_url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        article_type: "referee",
        monitoring_enabled: true
      });
    }
  }

  // Seed index.json articles
  for (const qid in index) {
    const e = index[qid];
    if (!allowedTypes.includes(e.type)) continue;
    if (e.type === "player" && Object.keys(e.sitelinks || {}).length < 3) {
      continue;
    }

    const slug = slugify(e.name);
    const entityId = entityIdMap.get(slug);
    if (!entityId) continue;

    const sitelinks = e.sitelinks || {};
    // Only import sitelinks for major languages to avoid cluttering: en, fr, es, de, ja, pt, it, ar
    const allowedLangs = ["enwiki", "frwiki", "eswiki", "dewiki", "jawiki", "ptwiki", "itwiki", "arwiki"];
    for (const [wiki, title] of Object.entries(sitelinks)) {
      if (!allowedLangs.includes(wiki)) continue;
      const lang = wiki.slice(0, 2);
      articlesToUpsert.push({
        entity_id: entityId,
        wiki_code: wiki,
        language_code: lang,
        page_title: title as string,
        canonical_url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent((title as string).replace(/ /g, "_"))}`,
        article_type: e.type === "coach" ? "player" : e.type,
        monitoring_enabled: true
      });
    }
  }

  console.log(`Upserting ${articlesToUpsert.length} wiki articles in Supabase...`);
  const articleIdByTitleAndWiki = new Map<string, string>(); // `${wiki_code}:${page_title}` -> id
  const teamArticlesMap = new Map<string, string[]>(); // `country_code` -> article_ids[]
  const playerArticlesMap = new Map<string, string[]>(); // `country_code` -> article_ids[]
  const coachArticlesMap = new Map<string, string[]>(); // `country_code` -> article_ids[]
  const tournamentArticleIds: string[] = [];

  for (const batch of chunkArray(articlesToUpsert, 200)) {
    const { data, error } = await supabase
      .from("wiki_articles")
      .upsert(batch, { onConflict: "wiki_code,page_title" })
      .select("id, wiki_code, page_title, entity_id, article_type");

    if (error) {
      console.error("Article upsert error:", error);
      throw error;
    }

    for (const row of data || []) {
      articleIdByTitleAndWiki.set(`${row.wiki_code}:${row.page_title}`, row.id);
      
      // Find the entity for categorizing articles by country code
      // We can search the entitiesToUpsert list or look up the entity_id
      const ent = entitiesToUpsert.find(x => entityIdMap.get(x.slug) === row.entity_id);
      if (ent && ent.subject_geography_label) {
        const country = ent.subject_geography_label;
        if (row.article_type === "team") {
          if (!teamArticlesMap.has(country)) teamArticlesMap.set(country, []);
          teamArticlesMap.get(country)!.push(row.id);
        } else if (row.article_type === "player") {
          if (!playerArticlesMap.has(country)) playerArticlesMap.set(country, []);
          playerArticlesMap.get(country)!.push(row.id);
        } else if (row.article_type === "coach") {
          if (!coachArticlesMap.has(country)) coachArticlesMap.set(country, []);
          coachArticlesMap.get(country)!.push(row.id);
        }
      }
      if (row.article_type === "tournament") {
        tournamentArticleIds.push(row.id);
      }
    }
  }
  console.log("✅ Wiki articles upserted successfully.");

  // 5. Generate and Seed the 104 Matches of the World Cup 2026
  console.log("=== Generating 104 World Cup 2026 matches schedule ===");
  const { matches: generatedMatches, teamCodeMap } = getWc26Schedule();

  const matchesToUpsert: any[] = [];
  for (const m of generatedMatches) {
    const homeTeamSlug = m.home.code !== "TBD" ? slugify(m.home.name) : null;
    const awayTeamSlug = m.away.code !== "TBD" ? slugify(m.away.name) : null;

    const homeId = homeTeamSlug ? entityIdMap.get(homeTeamSlug) || null : null;
    const awayId = awayTeamSlug ? entityIdMap.get(awayTeamSlug) || null : null;

    matchesToUpsert.push({
      slug: m.id,
      competition_label: "Coupe du Monde 2026",
      stage_label: m.group ? `GROUPE ${m.group}` : (m.round || "ELIMINATION DIRECTE"),
      scheduled_at: m.kickoff,
      home_team_entity_id: homeId,
      away_team_entity_id: awayId,
      status: "upcoming"
    });
  }

  console.log(`Upserting ${matchesToUpsert.length} matches into Supabase...`);
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .upsert(matchesToUpsert, { onConflict: "slug" })
    .select("id, slug");
  if (matchError) throw matchError;
  console.log("✅ Matches seeded successfully.");

  // 6. Build and Seed the match_watchlist (The Critical Link!)
  console.log("=== Rebuilding watchlist mappings for all matches ===");
  const watchlistToUpsert: any[] = [];

  // Match referees round-robin
  const refereeEntities = entitiesToUpsert.filter(e => e.type === "referee");

  for (const m of generatedMatches) {
    const dbMatch = matchData.find(dm => dm.slug === m.id);
    if (!dbMatch) continue;

    const matchId = dbMatch.id;

    // A. Add tournament articles to this match watchlist
    for (const artId of tournamentArticleIds) {
      watchlistToUpsert.push({
        match_id: matchId,
        article_id: artId,
        role: "tournament",
        monitoring_reason: "Surveillance de la page du tournoi mondial pendant la rencontre.",
        enabled: true
      });
    }

    // B. Add referee to this match watchlist
    const refIndex = m.matchN ? (m.matchN % refereeEntities.length) : 0;
    const assignedReferee = refereeEntities[refIndex];
    if (assignedReferee) {
      const refEntityId = entityIdMap.get(assignedReferee.slug);
      const refArticles = articlesToUpsert.filter(a => a.entity_id === refEntityId);
      for (const refArt of refArticles) {
        const artId = articleIdByTitleAndWiki.get(`${refArt.wiki_code}:${refArt.page_title}`);
        if (artId) {
          watchlistToUpsert.push({
            match_id: matchId,
            article_id: artId,
            role: "referee",
            monitoring_reason: `Arbitre désigné pour le match : ${assignedReferee.canonical_label}.`,
            enabled: true
          });
        }
      }
    }

    // C. Add home team & away team articles
    const homeTeamCode = m.home.code;
    const awayTeamCode = m.away.code;

    // Home Team articles
    const homeArtIds = teamArticlesMap.get(homeTeamCode) || [];
    for (const artId of homeArtIds) {
      watchlistToUpsert.push({
        match_id: matchId,
        article_id: artId,
        role: "home_team",
        monitoring_reason: `Équipe nationale à domicile : ${m.home.name}.`,
        enabled: true
      });
    }

    // Away Team articles
    const awayArtIds = teamArticlesMap.get(awayTeamCode) || [];
    for (const artId of awayArtIds) {
      watchlistToUpsert.push({
        match_id: matchId,
        article_id: artId,
        role: "away_team",
        monitoring_reason: `Équipe nationale à l'extérieur : ${m.away.name}.`,
        enabled: true
      });
    }

    // D. Add home and away coaches
    const homeCoachIds = coachArticlesMap.get(homeTeamCode) || [];
    for (const artId of homeCoachIds) {
      watchlistToUpsert.push({
        match_id: matchId,
        article_id: artId,
        role: "coach",
        monitoring_reason: `Sélectionneur de l'équipe : ${m.home.name}.`,
        enabled: true
      });
    }
    const awayCoachIds = coachArticlesMap.get(awayTeamCode) || [];
    for (const artId of awayCoachIds) {
      watchlistToUpsert.push({
        match_id: matchId,
        article_id: artId,
        role: "coach",
        monitoring_reason: `Sélectionneur de l'équipe : ${m.away.name}.`,
        enabled: true
      });
    }

    // E. Add home and away top players (limit to top 6 players per team for efficiency)
    const homePlayerIds = (playerArticlesMap.get(homeTeamCode) || []).slice(0, 6);
    for (const artId of homePlayerIds) {
      watchlistToUpsert.push({
        match_id: matchId,
        article_id: artId,
        role: "player",
        monitoring_reason: `Joueur clé de l'équipe : ${m.home.name}.`,
        enabled: true
      });
    }
    const awayPlayerIds = (playerArticlesMap.get(awayTeamCode) || []).slice(0, 6);
    for (const artId of awayPlayerIds) {
      watchlistToUpsert.push({
        match_id: matchId,
        article_id: artId,
        role: "player",
        monitoring_reason: `Joueur clé de l'équipe : ${m.away.name}.`,
        enabled: true
      });
    }
  }

  console.log(`Upserting ${watchlistToUpsert.length} match watchlist entries...`);
  // Delete all existing match watchlist records first to ensure no conflicts on unique key
  await supabase.from("match_watchlist").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (const batch of chunkArray(watchlistToUpsert, 300)) {
    const { error } = await supabase.from("match_watchlist").insert(batch);
    if (error) {
      console.error("Watchlist insert error:", error);
      throw error;
    }
  }
  console.log("✅ Watchlist entries populated successfully.");
  console.log("=== Seeding process completed perfectly ===");
}

// Full WC26 Schedule Generator (mirrors the logic of build-wc26-schedule.ts)
function getWc26Schedule() {
  const TEAMS: Record<string, { code: string; short: string; name: string }> = {
    MEX: { code: 'MX', short: 'MEX', name: 'Mexique' },
    CAN: { code: 'CA', short: 'CAN', name: 'Canada' },
    USA: { code: 'US', short: 'USA', name: 'États-Unis' },
    RSA: { code: 'ZA', short: 'RSA', name: 'Afrique du Sud' },
    KOR: { code: 'KR', short: 'KOR', name: 'Corée du Sud' },
    CZE: { code: 'CZ', short: 'CZE', name: 'République tchèque' },
    BIH: { code: 'BA', short: 'BIH', name: 'Bosnie-Herzégovine' },
    QAT: { code: 'QA', short: 'QAT', name: 'Qatar' },
    SUI: { code: 'CH', short: 'SUI', name: 'Suisse' },
    BRA: { code: 'BR', short: 'BRA', name: 'Brésil' },
    MAR: { code: 'MA', short: 'MAR', name: 'Maroc' },
    HAI: { code: 'HT', short: 'HAI', name: 'Haïti' },
    SCO: { code: 'GB-SCT', short: 'SCO', name: 'Écosse' },
    PAR: { code: 'PY', short: 'PAR', name: 'Paraguay' },
    AUS: { code: 'AU', short: 'AUS', name: 'Australie' },
    TUR: { code: 'TR', short: 'TUR', name: 'Turquie' },
    GER: { code: 'DE', short: 'GER', name: 'Allemagne' },
    CUW: { code: 'CW', short: 'CUW', name: 'Curaçao' },
    CIV: { code: 'CI', short: 'CIV', name: 'Côte d’Ivoire' },
    ECU: { code: 'EC', short: 'ECU', name: 'Équateur' },
    NED: { code: 'NL', short: 'NED', name: 'Pays-Bas' },
    JPN: { code: 'JP', short: 'JPN', name: 'Japon' },
    SWE: { code: 'SE', short: 'SWE', name: 'Suède' },
    TUN: { code: 'TN', short: 'TUN', name: 'Tunisie' },
    BEL: { code: 'BE', short: 'BEL', name: 'Belgique' },
    EGY: { code: 'EG', short: 'EGY', name: 'Égypte' },
    IRN: { code: 'IR', short: 'IRN', name: 'Iran' },
    NZL: { code: 'NZ', short: 'NZL', name: 'Nouvelle-Zélande' },
    ESP: { code: 'ES', short: 'ESP', name: 'Espagne' },
    CPV: { code: 'CV', short: 'CPV', name: 'Cap-Vert' },
    KSA: { code: 'SA', short: 'KSA', name: 'Arabie saoudite' },
    URU: { code: 'UY', short: 'URU', name: 'Uruguay' },
    FRA: { code: 'FR', short: 'FRA', name: 'France' },
    SEN: { code: 'SN', short: 'SEN', name: 'Sénégal' },
    IRQ: { code: 'IQ', short: 'IRQ', name: 'Irak' },
    NOR: { code: 'NO', short: 'NOR', name: 'Norvège' },
    ARG: { code: 'AR', short: 'ARG', name: 'Argentine' },
    ALG: { code: 'DZ', short: 'ALG', name: 'Algérie' },
    AUT: { code: 'AT', short: 'AUT', name: 'Autriche' },
    JOR: { code: 'JO', short: 'JOR', name: 'Jordanie' },
    POR: { code: 'PT', short: 'POR', name: 'Portugal' },
    COD: { code: 'CD', short: 'COD', name: 'RD Congo' },
    UZB: { code: 'UZ', short: 'UZB', name: 'Ouzbékistan' },
    COL: { code: 'CO', short: 'COL', name: 'Colombie' },
    ENG: { code: 'GB-ENG', short: 'ENG', name: 'Angleterre' },
    CRO: { code: 'HR', short: 'CRO', name: 'Croatie' },
    GHA: { code: 'GH', short: 'GHA', name: 'Ghana' },
    PAN: { code: 'PA', short: 'PAN', name: 'Panama' },
  };

  const TBD = { code: 'TBD', short: 'TBD', name: 'À déterminer' };

  const VENUES: Record<string, { name: string; city: string; utcOffset: number }> = {
    AZTECA: { name: 'Estadio Azteca', city: 'Mexico', utcOffset: -6 },
    AKRON: { name: 'Estadio Akron', city: 'Zapopan', utcOffset: -6 },
    BBVA: { name: 'Estadio BBVA', city: 'Monterrey', utcOffset: -6 },
    BMO: { name: 'BMO Field', city: 'Toronto', utcOffset: -4 },
    BC_PLACE: { name: 'BC Place', city: 'Vancouver', utcOffset: -7 },
    SOFI: { name: 'SoFi Stadium', city: 'Los Angeles', utcOffset: -7 },
    GILLETTE: { name: 'Gillette Stadium', city: 'Boston', utcOffset: -4 },
    METLIFE: { name: 'MetLife Stadium', city: 'New York / NJ', utcOffset: -4 },
    LEVIS: { name: "Levi's Stadium", city: 'San Francisco Bay', utcOffset: -7 },
    LINCOLN: { name: 'Lincoln Financial Field', city: 'Philadelphie', utcOffset: -4 },
    HARDROCK: { name: 'Hard Rock Stadium', city: 'Miami', utcOffset: -4 },
    MERCEDES: { name: 'Mercedes-Benz Stadium', city: 'Atlanta', utcOffset: -4 },
    ATT: { name: 'AT&T Stadium', city: 'Dallas', utcOffset: -5 },
    NRG: { name: 'NRG Stadium', city: 'Houston', utcOffset: -5 },
    ARROWHEAD: { name: 'Arrowhead Stadium', city: 'Kansas City', utcOffset: -5 },
    LUMEN: { name: 'Lumen Field', city: 'Seattle', utcOffset: -7 },
  };

  const DAY_BY_MATCH: Record<number, number> = {
    1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1,
    7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2,
    13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3,
    19: 4, 20: 4, 21: 4, 22: 4, 23: 4, 24: 4,
    25: 5, 26: 5, 27: 5, 28: 5,
    29: 6, 30: 6, 31: 6, 32: 6, 33: 6, 34: 6,
    35: 7, 36: 7, 37: 7, 38: 7, 39: 7, 40: 7,
    41: 8, 42: 8, 43: 8, 44: 8, 45: 8, 46: 8,
    47: 9, 48: 9, 49: 9, 50: 9,
    51: 10, 52: 10, 53: 10, 54: 10,
    55: 11, 56: 11, 57: 11, 58: 11,
    59: 12, 60: 12, 61: 12, 62: 12,
    63: 13, 64: 13, 65: 13, 66: 13,
    67: 14, 68: 14, 69: 14, 70: 14,
    71: 15, 72: 15,
  };

  const GROUP_FIXTURES = [
    { matchN: 1, group: 'A', homeKey: 'MEX', awayKey: 'RSA', venueKey: 'AZTECA', hourLocal: 20 },
    { matchN: 2, group: 'A', homeKey: 'KOR', awayKey: 'CZE', venueKey: 'AKRON', hourLocal: 12 },
    { matchN: 25, group: 'A', homeKey: 'CZE', awayKey: 'RSA', venueKey: 'MERCEDES', hourLocal: 18 },
    { matchN: 28, group: 'A', homeKey: 'MEX', awayKey: 'KOR', venueKey: 'AKRON', hourLocal: 18 },
    { matchN: 53, group: 'A', homeKey: 'CZE', awayKey: 'MEX', venueKey: 'AZTECA', hourLocal: 20 },
    { matchN: 54, group: 'A', homeKey: 'RSA', awayKey: 'KOR', venueKey: 'BBVA', hourLocal: 20 },
    { matchN: 3, group: 'B', homeKey: 'CAN', awayKey: 'BIH', venueKey: 'BMO', hourLocal: 18 },
    { matchN: 8, group: 'B', homeKey: 'QAT', awayKey: 'SUI', venueKey: 'LEVIS', hourLocal: 18 },
    { matchN: 26, group: 'B', homeKey: 'SUI', awayKey: 'BIH', venueKey: 'SOFI', hourLocal: 12 },
    { matchN: 27, group: 'B', homeKey: 'CAN', awayKey: 'QAT', venueKey: 'BC_PLACE', hourLocal: 18 },
    { matchN: 51, group: 'B', homeKey: 'SUI', awayKey: 'CAN', venueKey: 'BC_PLACE', hourLocal: 18 },
    { matchN: 52, group: 'B', homeKey: 'BIH', awayKey: 'QAT', venueKey: 'LUMEN', hourLocal: 12 },
    { matchN: 7, group: 'C', homeKey: 'BRA', awayKey: 'MAR', venueKey: 'METLIFE', hourLocal: 21 },
    { matchN: 5, group: 'C', homeKey: 'HAI', awayKey: 'SCO', venueKey: 'GILLETTE', hourLocal: 15 },
    { matchN: 30, group: 'C', homeKey: 'SCO', awayKey: 'MAR', venueKey: 'GILLETTE', hourLocal: 15 },
    { matchN: 29, group: 'C', homeKey: 'BRA', awayKey: 'HAI', venueKey: 'LINCOLN', hourLocal: 18 },
    { matchN: 49, group: 'C', homeKey: 'SCO', awayKey: 'BRA', venueKey: 'HARDROCK', hourLocal: 21 },
    { matchN: 50, group: 'C', homeKey: 'MAR', awayKey: 'HAI', venueKey: 'MERCEDES', hourLocal: 18 },
    { matchN: 4, group: 'D', homeKey: 'USA', awayKey: 'PAR', venueKey: 'SOFI', hourLocal: 15 },
    { matchN: 6, group: 'D', homeKey: 'AUS', awayKey: 'TUR', venueKey: 'BC_PLACE', hourLocal: 21 },
    { matchN: 32, group: 'D', homeKey: 'USA', awayKey: 'AUS', venueKey: 'LUMEN', hourLocal: 18 },
    { matchN: 31, group: 'D', homeKey: 'TUR', awayKey: 'PAR', venueKey: 'LEVIS', hourLocal: 12 },
    { matchN: 59, group: 'D', homeKey: 'TUR', awayKey: 'USA', venueKey: 'SOFI', hourLocal: 18 },
    { matchN: 60, group: 'D', homeKey: 'PAR', awayKey: 'AUS', venueKey: 'LEVIS', hourLocal: 18 },
    { matchN: 10, group: 'E', homeKey: 'GER', awayKey: 'CUW', venueKey: 'NRG', hourLocal: 17 },
    { matchN: 9, group: 'E', homeKey: 'CIV', awayKey: 'ECU', venueKey: 'LINCOLN', hourLocal: 12 },
    { matchN: 33, group: 'E', homeKey: 'GER', awayKey: 'CIV', venueKey: 'BMO', hourLocal: 18 },
    { matchN: 34, group: 'E', homeKey: 'ECU', awayKey: 'CUW', venueKey: 'ARROWHEAD', hourLocal: 12 },
    { matchN: 55, group: 'E', homeKey: 'CUW', awayKey: 'CIV', venueKey: 'LINCOLN', hourLocal: 12 },
    { matchN: 56, group: 'E', homeKey: 'ECU', awayKey: 'GER', venueKey: 'METLIFE', hourLocal: 18 },
    { matchN: 11, group: 'F', homeKey: 'NED', awayKey: 'JPN', venueKey: 'ATT', hourLocal: 18 },
    { matchN: 12, group: 'F', homeKey: 'SWE', awayKey: 'TUN', venueKey: 'BBVA', hourLocal: 21 },
    { matchN: 35, group: 'F', homeKey: 'NED', awayKey: 'SWE', venueKey: 'NRG', hourLocal: 21 },
    { matchN: 36, group: 'F', homeKey: 'TUN', awayKey: 'JPN', venueKey: 'BBVA', hourLocal: 14 },
    { matchN: 57, group: 'F', homeKey: 'JPN', awayKey: 'SWE', venueKey: 'ATT', hourLocal: 14 },
    { matchN: 58, group: 'F', homeKey: 'TUN', awayKey: 'NED', venueKey: 'ARROWHEAD', hourLocal: 14 },
    { matchN: 16, group: 'G', homeKey: 'BEL', awayKey: 'EGY', venueKey: 'LUMEN', hourLocal: 18 },
    { matchN: 15, group: 'G', homeKey: 'IRN', awayKey: 'NZL', venueKey: 'SOFI', hourLocal: 12 },
    { matchN: 39, group: 'G', homeKey: 'BEL', awayKey: 'IRN', venueKey: 'SOFI', hourLocal: 12 },
    { matchN: 40, group: 'G', homeKey: 'NZL', awayKey: 'EGY', venueKey: 'BC_PLACE', hourLocal: 18 },
    { matchN: 63, group: 'G', homeKey: 'EGY', awayKey: 'IRN', venueKey: 'LUMEN', hourLocal: 12 },
    { matchN: 64, group: 'G', homeKey: 'NZL', awayKey: 'BEL', venueKey: 'BC_PLACE', hourLocal: 12 },
    { matchN: 14, group: 'H', homeKey: 'ESP', awayKey: 'CPV', venueKey: 'MERCEDES', hourLocal: 18 },
    { matchN: 13, group: 'H', homeKey: 'KSA', awayKey: 'URU', venueKey: 'HARDROCK', hourLocal: 12 },
    { matchN: 38, group: 'H', homeKey: 'ESP', awayKey: 'KSA', venueKey: 'MERCEDES', hourLocal: 21 },
    { matchN: 37, group: 'H', homeKey: 'URU', awayKey: 'CPV', venueKey: 'HARDROCK', hourLocal: 18 },
    { matchN: 65, group: 'H', homeKey: 'CPV', awayKey: 'KSA', venueKey: 'NRG', hourLocal: 14 },
    { matchN: 66, group: 'H', homeKey: 'URU', awayKey: 'ESP', venueKey: 'AKRON', hourLocal: 14 },
    { matchN: 17, group: 'I', homeKey: 'FRA', awayKey: 'SEN', venueKey: 'METLIFE', hourLocal: 21 },
    { matchN: 18, group: 'I', homeKey: 'IRQ', awayKey: 'NOR', venueKey: 'GILLETTE', hourLocal: 12 },
    { matchN: 42, group: 'I', homeKey: 'FRA', awayKey: 'IRQ', venueKey: 'LINCOLN', hourLocal: 21 },
    { matchN: 41, group: 'I', homeKey: 'NOR', awayKey: 'SEN', venueKey: 'METLIFE', hourLocal: 12 },
    { matchN: 61, group: 'I', homeKey: 'NOR', awayKey: 'FRA', venueKey: 'GILLETTE', hourLocal: 18 },
    { matchN: 62, group: 'I', homeKey: 'SEN', awayKey: 'IRQ', venueKey: 'BMO', hourLocal: 18 },
    { matchN: 19, group: 'J', homeKey: 'ARG', awayKey: 'ALG', venueKey: 'ARROWHEAD', hourLocal: 18 },
    { matchN: 20, group: 'J', homeKey: 'AUT', awayKey: 'JOR', venueKey: 'LEVIS', hourLocal: 12 },
    { matchN: 43, group: 'J', homeKey: 'ARG', awayKey: 'AUT', venueKey: 'ATT', hourLocal: 18 },
    { matchN: 44, group: 'J', homeKey: 'JOR', awayKey: 'ALG', venueKey: 'LEVIS', hourLocal: 12 },
    { matchN: 69, group: 'J', homeKey: 'ALG', awayKey: 'AUT', venueKey: 'ARROWHEAD', hourLocal: 14 },
    { matchN: 70, group: 'J', homeKey: 'JOR', awayKey: 'ARG', venueKey: 'ATT', hourLocal: 14 },
    { matchN: 23, group: 'K', homeKey: 'POR', awayKey: 'COD', venueKey: 'NRG', hourLocal: 18 },
    { matchN: 24, group: 'K', homeKey: 'UZB', awayKey: 'COL', venueKey: 'AZTECA', hourLocal: 21 },
    { matchN: 47, group: 'K', homeKey: 'POR', awayKey: 'UZB', venueKey: 'NRG', hourLocal: 18 },
    { matchN: 48, group: 'K', homeKey: 'COL', awayKey: 'COD', venueKey: 'AKRON', hourLocal: 18 },
    { matchN: 71, group: 'K', homeKey: 'COL', awayKey: 'POR', venueKey: 'HARDROCK', hourLocal: 14 },
    { matchN: 72, group: 'K', homeKey: 'COD', awayKey: 'UZB', venueKey: 'MERCEDES', hourLocal: 14 },
    { matchN: 22, group: 'L', homeKey: 'ENG', awayKey: 'CRO', venueKey: 'ATT', hourLocal: 21 },
    { matchN: 21, group: 'L', homeKey: 'GHA', awayKey: 'PAN', venueKey: 'BMO', hourLocal: 12 },
    { matchN: 45, group: 'L', homeKey: 'ENG', awayKey: 'GHA', venueKey: 'GILLETTE', hourLocal: 18 },
    { matchN: 46, group: 'L', homeKey: 'PAN', awayKey: 'CRO', venueKey: 'BMO', hourLocal: 12 },
    { matchN: 67, group: 'L', homeKey: 'PAN', awayKey: 'ENG', venueKey: 'METLIFE', hourLocal: 18 },
    { matchN: 68, group: 'L', homeKey: 'CRO', awayKey: 'GHA', venueKey: 'LINCOLN', hourLocal: 18 },
  ];

  const KNOCKOUTS = [
    { matchN: 73, round: 'R32', date: '2026-06-28', hourLocal: 12, venueKey: 'METLIFE', homeLabel: '1A', awayLabel: '2B' },
    { matchN: 74, round: 'R32', date: '2026-06-28', hourLocal: 18, venueKey: 'AZTECA', homeLabel: '1B', awayLabel: '2A' },
    { matchN: 75, round: 'R32', date: '2026-06-29', hourLocal: 12, venueKey: 'NRG', homeLabel: '1C', awayLabel: '2F' },
    { matchN: 76, round: 'R32', date: '2026-06-29', hourLocal: 18, venueKey: 'BBVA', homeLabel: '1F', awayLabel: '2C' },
    { matchN: 77, round: 'R32', date: '2026-06-30', hourLocal: 12, venueKey: 'LINCOLN', homeLabel: '1D', awayLabel: '2E' },
    { matchN: 78, round: 'R32', date: '2026-06-30', hourLocal: 18, venueKey: 'ATT', homeLabel: '1E', awayLabel: '2D' },
    { matchN: 79, round: 'R32', date: '2026-07-01', hourLocal: 12, venueKey: 'BMO', homeLabel: '1G', awayLabel: '2H' },
    { matchN: 80, round: 'R32', date: '2026-07-01', hourLocal: 18, venueKey: 'BC_PLACE', homeLabel: '1H', awayLabel: '2G' },
    { matchN: 81, round: 'R32', date: '2026-07-02', hourLocal: 12, venueKey: 'SOFI', homeLabel: '1I', awayLabel: '2J' },
    { matchN: 82, round: 'R32', date: '2026-07-02', hourLocal: 18, venueKey: 'METLIFE', homeLabel: '1J', awayLabel: '2I' },
    { matchN: 83, round: 'R32', date: '2026-07-02', hourLocal: 21, venueKey: 'LEVIS', homeLabel: '1K', awayLabel: '2L' },
    { matchN: 84, round: 'R32', date: '2026-07-03', hourLocal: 12, venueKey: 'AKRON', homeLabel: '1L', awayLabel: '2K' },
    { matchN: 85, round: 'R32', date: '2026-07-03', hourLocal: 15, venueKey: 'MERCEDES', homeLabel: '3A/B/F', awayLabel: '3C/E/H' },
    { matchN: 86, round: 'R32', date: '2026-07-03', hourLocal: 18, venueKey: 'GILLETTE', homeLabel: '3D/E/F', awayLabel: '3A/B/C' },
    { matchN: 87, round: 'R32', date: '2026-07-03', hourLocal: 21, venueKey: 'LUMEN', homeLabel: '3G/H/I', awayLabel: '3J/K/L' },
    { matchN: 88, round: 'R32', date: '2026-07-03', hourLocal: 21, venueKey: 'ARROWHEAD', homeLabel: '3I/J/K', awayLabel: '3D/G/H' },
    { matchN: 89, round: 'R16', date: '2026-07-04', hourLocal: 12, venueKey: 'LINCOLN', homeLabel: 'V73', awayLabel: 'V74' },
    { matchN: 90, round: 'R16', date: '2026-07-04', hourLocal: 16, venueKey: 'METLIFE', homeLabel: 'V75', awayLabel: 'V76' },
    { matchN: 91, round: 'R16', date: '2026-07-05', hourLocal: 12, venueKey: 'BMO', homeLabel: 'V77', awayLabel: 'V78' },
    { matchN: 92, round: 'R16', date: '2026-07-05', hourLocal: 16, venueKey: 'BC_PLACE', homeLabel: 'V79', awayLabel: 'V80' },
    { matchN: 93, round: 'R16', date: '2026-07-06', hourLocal: 12, venueKey: 'SOFI', homeLabel: 'V81', awayLabel: 'V82' },
    { matchN: 94, round: 'R16', date: '2026-07-06', hourLocal: 16, venueKey: 'AZTECA', homeLabel: 'V83', awayLabel: 'V84' },
    { matchN: 95, round: 'R16', date: '2026-07-07', hourLocal: 12, venueKey: 'ATT', homeLabel: 'V85', awayLabel: 'V86' },
    { matchN: 96, round: 'R16', date: '2026-07-07', hourLocal: 16, venueKey: 'NRG', homeLabel: 'V87', awayLabel: 'V88' },
    { matchN: 97, round: 'QF', date: '2026-07-09', hourLocal: 16, venueKey: 'BMO', homeLabel: 'V89', awayLabel: 'V90' },
    { matchN: 98, round: 'QF', date: '2026-07-09', hourLocal: 20, venueKey: 'METLIFE', homeLabel: 'V91', awayLabel: 'V92' },
    { matchN: 99, round: 'QF', date: '2026-07-10', hourLocal: 16, venueKey: 'LINCOLN', homeLabel: 'V93', awayLabel: 'V94' },
    { matchN: 100, round: 'QF', date: '2026-07-11', hourLocal: 16, venueKey: 'MERCEDES', homeLabel: 'V95', awayLabel: 'V96' },
    { matchN: 101, round: 'SF', date: '2026-07-14', hourLocal: 15, venueKey: 'ATT', homeLabel: 'V97', awayLabel: 'V98' },
    { matchN: 102, round: 'SF', date: '2026-07-15', hourLocal: 15, venueKey: 'METLIFE', homeLabel: 'V99', awayLabel: 'V100' },
    { matchN: 103, round: '3RD', date: '2026-07-18', hourLocal: 15, venueKey: 'HARDROCK', homeLabel: 'P101', awayLabel: 'P102' },
    { matchN: 104, round: 'F', date: '2026-07-19', hourLocal: 15, venueKey: 'METLIFE', homeLabel: 'V101', awayLabel: 'V102' },
  ];

  function buildIsoLocal(year: number, month: number, day: number, hour: number, offset: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const sign = offset >= 0 ? '+' : '-';
    const offsetStr = `${sign}${pad(Math.abs(offset))}:00`;
    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:00:00${offsetStr}`;
  }

  function dayIndexToDate(day: number): { y: number; m: number; d: number } {
    const start = Date.UTC(2026, 5, 11); // June 11, 2026
    const t = start + day * 86400000;
    const dt = new Date(t);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }

  const matches: any[] = [];

  // Group fixtures
  for (const f of GROUP_FIXTURES) {
    const day = DAY_BY_MATCH[f.matchN];
    const { y, m, d } = dayIndexToDate(day);
    const v = VENUES[f.venueKey]!;
    const home = TEAMS[f.homeKey]!;
    const away = TEAMS[f.awayKey]!;
    matches.push({
      id: `wc26-${String(f.matchN).padStart(3, '0')}`,
      matchN: f.matchN,
      group: f.group,
      kickoff: buildIsoLocal(y, m, d, f.hourLocal, v.utcOffset),
      home,
      away,
    });
  }

  // Knockout stage placeholders
  for (const k of KNOCKOUTS) {
    const [y, m, d] = k.date.split('-').map(Number);
    const v = VENUES[k.venueKey]!;
    matches.push({
      id: `wc26-${String(k.matchN).padStart(3, '0')}`,
      matchN: k.matchN,
      round: k.round,
      kickoff: buildIsoLocal(y!, m!, d!, k.hourLocal, v.utcOffset),
      home: { ...TBD, short: k.homeLabel, name: k.homeLabel },
      away: { ...TBD, short: k.awayLabel, name: k.awayLabel },
    });
  }

  return { matches, teamCodeMap: TEAMS };
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
