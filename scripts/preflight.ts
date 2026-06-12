/**
 * Preflight / drill soir de match (spec §20 P0, §21.4) — AUCUNE ÉCRITURE
 * (sauf un message de test sur le webhook Discord si configuré).
 *
 * Vérifie tout ce que la spec marque "⚠️ à vérifier sur payload réel" :
 * 1. env vars présentes ;
 * 2. football-data : compétition WC accessible (free tier), 104 matchs,
 *    stages rencontrés tous mappés (LAST_32…), statuts connus ;
 * 3. mapping des 48 équipes : fd_team_id du seed ↔ équipes de l'API ;
 * 4. dérive API ↔ base (ids, kickoffs) ;
 * 5. drill match_overrides : résolution d'un override À BLANC via le moteur
 *    (le chemin complet admin → resolveMatch, sans toucher la carte) ;
 * 6. webhook Discord : message de test.
 *
 * Usage : npx tsx scripts/preflight.ts
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createWorkerClient, loadConfig, loadEngineState, loadNations } from "../worker/src/db";
import { resolveMatch } from "../lib/engine/resolve";
import { normalizeOverride, type MatchRow as OverrideMatchRow } from "../lib/providers/manual-override";
import type { NationLabel } from "../lib/engine/narrative";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let failures = 0;
let warnings = 0;
function ok(label: string, detail = ""): void {
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
}
function ko(label: string, detail = ""): void {
  failures++;
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
}
function warn(label: string, detail = ""): void {
  warnings++;
  console.warn(`  ⚠ ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main(): Promise<void> {
  console.log("— 1. Variables d'environnement\n");
  for (const name of ["FOOTBALL_DATA_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]) {
    if (process.env[name]) ok(name);
    else ko(`${name} manquante`);
  }
  for (const name of ["ALERT_WEBHOOK_URL", "ADMIN_TOKEN"]) {
    if (process.env[name]) ok(name);
    else warn(`${name} absente du .env local`, name === "ALERT_WEBHOOK_URL" ? "les alertes Discord ne partiront pas (à configurer sur Render aussi)" : "outils /admin inutilisables en local");
  }
  if (failures > 0) {
    console.error("\nPreflight interrompu : env incomplète.");
    process.exit(1);
  }

  console.log("\n— 2. football-data.org (free tier, payloads réels)\n");
  const headers = { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN! };
  const matchesRes = await fetch("https://api.football-data.org/v4/competitions/WC/matches", { headers });
  if (!matchesRes.ok) {
    ko(`GET /competitions/WC/matches → HTTP ${matchesRes.status}`, matchesRes.status === 403 ? "compétition NON couverte par le plan (spec §3.2) !" : await matchesRes.text());
  } else {
    const payload = (await matchesRes.json()) as { matches: Array<Record<string, unknown>> };
    const apiMatches = payload.matches ?? [];
    if (apiMatches.length === 104) ok("104 matchs renvoyés par l'API");
    else warn(`${apiMatches.length} matchs renvoyés (attendu 104)`);

    const stages = [...new Set(apiMatches.map((m) => String(m.stage)))].sort();
    const statuses = [...new Set(apiMatches.map((m) => String(m.status)))].sort();
    console.log(`    stages API : ${stages.join(", ")}`);
    console.log(`    statuts API : ${statuses.join(", ")}`);

    const supabase = createWorkerClient();
    const cfg = await loadConfig(supabase);
    const unmapped = stages.filter((s) => !(s in cfg.stageMapping));
    if (unmapped.length === 0) ok("tous les stages API sont mappés (LAST_32 compris)");
    else ko(`stages NON mappés : ${unmapped.join(", ")}`, "ajouter au stage_mapping de game_config — le moteur refusera de résoudre (§3.2)");

    const knownStatuses = new Set(["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "FINISHED", "POSTPONED", "SUSPENDED", "CANCELLED", "AWARDED"]);
    const unknownStatuses = statuses.filter((s) => !knownStatuses.has(s));
    if (unknownStatuses.length === 0) ok("statuts API tous connus");
    else warn(`statuts inattendus : ${unknownStatuses.join(", ")}`);

    // Sémantique de score sur un payload réel FINISHED (spec §3.2).
    const finished = apiMatches.find((m) => m.status === "FINISHED") as { score?: Record<string, unknown> } | undefined;
    if (finished?.score) ok("payload FINISHED réel disponible", `score=${JSON.stringify(finished.score).slice(0, 140)}…`);
    else warn("aucun match FINISHED encore : relancer ce script après le premier match");

    console.log("\n— 3. Mapping des 48 équipes (fd_team_id, le risque n°1)\n");
    const teamsRes = await fetch("https://api.football-data.org/v4/competitions/WC/teams", { headers });
    if (!teamsRes.ok) {
      ko(`GET /competitions/WC/teams → HTTP ${teamsRes.status}`);
    } else {
      const teamsPayload = (await teamsRes.json()) as { teams: Array<{ id: number; name: string; tla: string }> };
      const apiTeams = new Map(teamsPayload.teams.map((t) => [t.id, t]));
      const seed = JSON.parse(readFileSync(join(root, "data", "nations-seed.json"), "utf8")) as Array<{
        fifa: string;
        name_fr: string;
        fd_team_id: number;
      }>;
      let mapped = 0;
      for (const n of seed) {
        const team = apiTeams.get(n.fd_team_id);
        if (!team) ko(`${n.fifa} (${n.name_fr}) : fd_team_id ${n.fd_team_id} absent de l'API`);
        else mapped++;
      }
      if (mapped === 48) ok("48/48 fd_team_id retrouvés dans l'API");
      const extra = teamsPayload.teams.filter((t) => !seed.some((n) => n.fd_team_id === t.id));
      if (extra.length > 0) warn(`équipes API hors seed : ${extra.map((t) => t.name).join(", ")}`);
    }

    console.log("\n— 4. Dérive API ↔ base\n");
    const atlas = supabase.schema("atlas");
    const { data: dbMatches, error } = await atlas.from("matches").select("id, kickoff_utc, status");
    if (error) ko(`lecture atlas.matches : ${error.message}`);
    else {
      const dbIds = new Set((dbMatches ?? []).map((m) => m.id as number));
      const apiIds = new Set(apiMatches.map((m) => Number(m.id)));
      const missingInDb = [...apiIds].filter((id) => !dbIds.has(id));
      const ghostInDb = [...dbIds].filter((id) => !apiIds.has(id));
      if (missingInDb.length === 0 && ghostInDb.length === 0) ok(`base alignée sur l'API (${dbIds.size} matchs)`);
      else {
        if (missingInDb.length > 0) warn(`matchs API absents de la base : ${missingInDb.slice(0, 5).join(", ")}${missingInDb.length > 5 ? "…" : ""}`, "le poll J-1→J+1 les ajoutera à l'approche");
        if (ghostInDb.length > 0) ko(`matchs en base inconnus de l'API (id changé ? §21.5) : ${ghostInDb.slice(0, 5).join(", ")}`);
      }
    }

    console.log("\n— 5. Drill match_overrides À BLANC (le chemin de secours §21.4)\n");
    const { data: nextMatch } = await atlas
      .from("matches")
      .select("id, stage, group_letter, home, away, kickoff_utc")
      .gt("kickoff_utc", new Date().toISOString())
      .not("home", "is", null)
      .not("away", "is", null)
      .order("kickoff_utc")
      .limit(1)
      .maybeSingle();
    if (!nextMatch) {
      warn("aucun match à venir avec équipes connues : drill sauté");
    } else {
      const nations = await loadNations(supabase);
      const state = await loadEngineState(supabase, nations, cfg.gameOver);
      const labels = new Map<string, NationLabel>(nations.map((n) => [n.code, { flag: n.flag, name: n.name_fr }]));
      const normalized = normalizeOverride(
        {
          id: nextMatch.id,
          stage: nextMatch.stage,
          group_letter: nextMatch.group_letter,
          home: nextMatch.home,
          away: nextMatch.away,
          kickoff_utc: nextMatch.kickoff_utc,
        } as OverrideMatchRow,
        { match_id: nextMatch.id as number, score_home: 2, score_away: 1, duration: "REGULAR", pens_home: null, pens_away: null },
      );
      const result = resolveMatch(state, { matchId: nextMatch.id as number, match: normalized, labels }, cfg.game);
      ok(
        `override 2-1 simulé sur #${nextMatch.id} ${nextMatch.home}–${nextMatch.away}`,
        `${result.resolution.finalGain} hex, récit : « ${result.resolution.narrative} » (rien n'a été écrit)`,
      );
      console.log("    En cas de pépin réel : /admin → saisir le score → le worker résout au tick suivant (< 2 min).");
    }
  }

  console.log("\n— 6. Webhook Discord\n");
  if (!process.env.ALERT_WEBHOOK_URL) {
    warn("ALERT_WEBHOOK_URL non configurée : impossible de tester", "créer un webhook Discord (Serveur → Intégrations) et l'ajouter au .env + Render");
  } else {
    const res = await fetch(process.env.ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `✅ Preflight Atlas : test du webhook réussi (${new Date().toISOString()})` }),
    });
    if (res.ok || res.status === 204) ok("message de test envoyé sur Discord");
    else ko(`webhook → HTTP ${res.status}`);
  }

  console.log(`\nRésultat : ${failures === 0 ? "PRÊT POUR CE SOIR ✓" : `${failures} BLOQUANT(S) ✗`}${warnings > 0 ? ` · ${warnings} avertissement(s)` : ""}`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`Preflight crashé : ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
