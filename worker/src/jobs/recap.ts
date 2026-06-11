/**
 * Recap de la Nuit (spec §8, §16.4) : contenu structuré et déterministe,
 * publié après 07:30 Europe/Paris. Sections dans l'ordre normatif §8 :
 * summary, fait majeur, surprise (victoire la moins probable, p < 0.35),
 * mouvements, basculement de qualif (|Δ p_qualify| max), ce soir (tri drama).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_MODEL, outcomeProbs } from "../../../lib/sim/model";
import { logJob } from "../db";

const TZ = "Europe/Paris";
const SURPRISE_THRESHOLD = 0.35;

function parisNow(): { date: string; minutes: number } {
  const now = new Date();
  const date = now.toLocaleDateString("en-CA", { timeZone: TZ });
  const [h, m] = now
    .toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
    .split(":")
    .map(Number);
  return { date, minutes: h * 60 + m };
}

function previousDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function windowOf(snapshotDate: string, currentDate: string): { fromUtc: string; toUtc: string } {
  return { fromUtc: `${snapshotDate}T10:00:00Z`, toUtc: `${currentDate}T05:30:00Z` };
}

type NationRow = { code: string; name_fr: string; flag: string; fifa_points: number };
type SimProbs = Record<string, { p_qualify?: number }>;

export async function buildNightRecapIfDue(supabase: SupabaseClient): Promise<boolean> {
  const { date, minutes } = parisNow();
  if (minutes < 7 * 60 + 30) return false;

  const recapDate = previousDate(date);
  const atlas = supabase.schema("atlas");
  const { data: existing, error: eErr } = await atlas.from("recaps").select("date").eq("date", recapDate).maybeSingle();
  if (eErr) throw new Error(`recaps: ${eErr.message}`);
  if (existing) return false;

  const { fromUtc, toUtc } = windowOf(recapDate, date);
  const [
    { data: resolutions, error: rErr },
    { data: events, error: evErr },
    { data: todayMatches, error: mErr },
    { data: nations, error: nErr },
    { data: stakes, error: sErr },
  ] = await Promise.all([
    atlas
      .from("resolutions")
      .select("match_id, winner, loser, is_draw, final_gain, hexes_taken, inherited_hexes, narrative, resolved_at")
      .gte("resolved_at", fromUtc)
      .lt("resolved_at", toUtc)
      .order("resolved_at"),
    atlas.from("hex_events").select("from_owner, to_owner, created_at").gte("created_at", fromUtc).lt("created_at", toUtc).limit(5000),
    atlas
      .from("matches")
      .select("id, stage, group_letter, home, away, kickoff_utc, status")
      .gte("kickoff_utc", `${date}T00:00:00Z`)
      .lt("kickoff_utc", `${date}T23:59:59Z`)
      .order("kickoff_utc"),
    atlas.from("nations").select("code, name_fr, flag, fifa_points"),
    atlas.from("match_stakes").select("match_id, drama"),
  ]);
  if (rErr) throw new Error(`resolutions: ${rErr.message}`);
  if (evErr) throw new Error(`hex_events: ${evErr.message}`);
  if (mErr) throw new Error(`matches: ${mErr.message}`);
  if (nErr) throw new Error(`nations: ${nErr.message}`);
  if (sErr) throw new Error(`match_stakes: ${sErr.message}`);

  const nationByCode = new Map((nations ?? []).map((n) => [n.code as string, n as NationRow]));
  const dramaByMatch = new Map((stakes ?? []).map((s) => [s.match_id as number, s.drama as number]));

  const movement = new Map<string, { gained: number; lost: number; delta: number }>();
  const bump = (code: string | null, key: "gained" | "lost") => {
    if (!code) return;
    const row = movement.get(code) ?? { gained: 0, lost: 0, delta: 0 };
    row[key]++;
    row.delta = row.gained - row.lost;
    movement.set(code, row);
  };
  for (const ev of events ?? []) {
    bump(ev.to_owner as string | null, "gained");
    bump(ev.from_owner as string | null, "lost");
  }

  const biggest = [...(resolutions ?? [])].sort(
    (a, b) =>
      (b.final_gain as number) - (a.final_gain as number) ||
      (dramaByMatch.get(b.match_id as number) ?? 0) - (dramaByMatch.get(a.match_id as number) ?? 0) ||
      String(a.resolved_at).localeCompare(String(b.resolved_at)),
  )[0] ?? null;

  // §8.3 La surprise : la victoire à la plus petite probabilité pré-match
  // (modèle Elo public §6.2 sur les points FIFA seedés). Section omise si p ≥ 0.35.
  let surprise: { match_id: number; text: string; p: number } | null = null;
  // On retrouve home/away depuis la table matches pour situer le vainqueur.
  const nightMatchIds = (resolutions ?? []).filter((r) => !r.is_draw && r.winner).map((r) => r.match_id as number);
  if (nightMatchIds.length > 0) {
    const { data: nightMatches, error: nmErr } = await atlas
      .from("matches")
      .select("id, home, away")
      .in("id", nightMatchIds);
    if (nmErr) throw new Error(`matches (nuit): ${nmErr.message}`);
    const sideByMatch = new Map((nightMatches ?? []).map((m) => [m.id as number, m]));
    for (const r of resolutions ?? []) {
      if (r.is_draw || !r.winner) continue;
      const m = sideByMatch.get(r.match_id as number);
      const home = m?.home ? nationByCode.get(m.home as string) : undefined;
      const away = m?.away ? nationByCode.get(m.away as string) : undefined;
      if (!home || !away) continue;
      const { pHome, pAway } = outcomeProbs(home.fifa_points, away.fifa_points, DEFAULT_MODEL);
      const p = r.winner === home.code ? pHome : pAway;
      if (p < SURPRISE_THRESHOLD && (!surprise || p < surprise.p)) {
        const winner = nationByCode.get(r.winner as string);
        surprise = {
          match_id: r.match_id as number,
          p,
          text: `${winner?.flag ?? ""} ${winner?.name_fr ?? r.winner} ne partait qu'à ${Math.round(p * 100)} % de chances de victoire — et l'a fait.`,
        };
      }
    }
  }

  // §8.5 Le basculement de qualif : |Δ p_qualify| max entre le dernier run
  // d'avant la fenêtre de nuit et le run le plus récent.
  let qualifSwing: { nation: string; text: string; delta: number } | null = null;
  const [{ data: runBefore }, { data: runAfter }] = await Promise.all([
    atlas.from("sim_runs").select("probs").lt("run_at", fromUtc).order("id", { ascending: false }).limit(1).maybeSingle(),
    atlas.from("sim_runs").select("probs").order("id", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (runBefore?.probs && runAfter?.probs) {
    const before = runBefore.probs as SimProbs;
    const after = runAfter.probs as SimProbs;
    for (const code of Object.keys(after)) {
      const delta = (after[code]?.p_qualify ?? 0) - (before[code]?.p_qualify ?? 0);
      if (!qualifSwing || Math.abs(delta) > Math.abs(qualifSwing.delta)) {
        const n = nationByCode.get(code);
        qualifSwing = {
          nation: code,
          delta,
          text: `${n?.flag ?? ""} ${n?.name_fr ?? code} : ${Math.round((before[code]?.p_qualify ?? 0) * 100)} % → ${Math.round((after[code]?.p_qualify ?? 0) * 100)} % de chances de qualification.`,
        };
      }
    }
    // Une nuit sans match ne fait pas bouger les probas : section omise sous 1 point.
    if (qualifSwing && Math.abs(qualifSwing.delta) < 0.01) qualifSwing = null;
  }

  // §8.6 Ce soir : trié par drama décroissant.
  const tonight = [...(todayMatches ?? [])]
    .map((m) => ({ ...m, drama: dramaByMatch.get(m.id as number) ?? null }))
    .sort((a, b) => (b.drama ?? -1) - (a.drama ?? -1) || String(a.kickoff_utc).localeCompare(String(b.kickoff_utc)));

  const moves = [...movement.entries()]
    .map(([code, value]) => ({ code, ...value }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.code.localeCompare(b.code));

  const sections = [
    {
      type: "summary",
      title: (resolutions?.length ?? 0) > 0 ? "La carte a bougé cette nuit" : "Nuit calme",
      text:
        (resolutions?.length ?? 0) > 0
          ? `${resolutions!.length} match(s) ont redessiné la carte.`
          : "Aucune résolution sur la fenêtre de nuit.",
      resolution_count: resolutions?.length ?? 0,
    },
    biggest
      ? {
          type: "major_event",
          title: "Fait majeur",
          match_id: biggest.match_id,
          text: biggest.narrative,
          final_gain: biggest.final_gain,
        }
      : { type: "major_event", title: "Fait majeur", text: "Aucun basculement territorial cette nuit." },
    ...(surprise
      ? [{ type: "surprise", title: "La surprise", match_id: surprise.match_id, text: surprise.text, p: surprise.p }]
      : []),
    {
      type: "movements",
      title: "Mouvements",
      gains: moves.filter((m) => m.delta > 0).slice(0, 5),
      losses: moves.filter((m) => m.delta < 0).slice(0, 5),
    },
    ...(qualifSwing
      ? [{ type: "qualif_swing", title: "Le basculement de qualif", nation: qualifSwing.nation, text: qualifSwing.text, delta: qualifSwing.delta }]
      : []),
    {
      type: "tonight",
      title: "Ce soir",
      matches: tonight,
    },
  ];

  const { error: iErr } = await atlas.from("recaps").insert({
    date: recapDate,
    sections,
    published_at: new Date().toISOString(),
  });
  if (iErr) throw new Error(`recaps insert: ${iErr.message}`);

  await logJob(supabase, "build_night_recap", true, {
    date: recapDate,
    resolutions: resolutions?.length ?? 0,
    surprise: surprise !== null,
    qualifSwing: qualifSwing?.nation ?? null,
    matchesTonight: tonight.length,
  });
  console.log(`✓ recap ${recapDate} publié (${resolutions?.length ?? 0} résolution(s)).`);
  return true;
}
