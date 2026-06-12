/**
 * /multivers (vision P2.A) — la Machine à Futurs.
 * L'utilisateur force l'issue (1/N/2) des matchs de groupes à venir ; un Web
 * Worker relance la simulation Monte-Carlo en local et la page recalcule
 * classements (exacts) + statuts (énumération exhaustive) + probabilités.
 * Le scénario vit dans l'URL → partageable sans compte.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import { FlagEmoji } from "../components/FlagEmoji";
import { computeStandings, type GroupMatchInput } from "../../lib/standings";
import { groupOutlook } from "../../lib/conditions";
import type { ForcedOutcome, SimMatch, SimNation, SimResult } from "../../lib/sim/simulate";
import type { MultiverseRequest, MultiverseResponse } from "../workers/multiverse.worker";
import { nationStyles, useAtlasData, type AtlasData, type Match } from "../lib/atlas";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const ITERATIONS = 4000;
type Outcome = ForcedOutcome["outcome"];
const OUTCOME_CODE: Record<Outcome, string> = { HOME: "H", DRAW: "D", AWAY: "A" };
const CODE_OUTCOME: Record<string, Outcome> = { H: "HOME", D: "DRAW", A: "AWAY" };

/* ------------------------------ Scénario ↔ URL ------------------------------ */

function parseScenario(raw: string | null): Map<number, Outcome> {
  const scenario = new Map<number, Outcome>();
  if (!raw) return scenario;
  for (const token of raw.split(",")) {
    const [id, code] = token.split(":");
    const outcome = CODE_OUTCOME[code];
    if (outcome && /^\d+$/.test(id)) scenario.set(Number(id), outcome);
  }
  return scenario;
}

function serializeScenario(scenario: Map<number, Outcome>): string {
  return [...scenario.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, o]) => `${id}:${OUTCOME_CODE[o]}`)
    .join(",");
}

/* ------------------------------- Sim (worker) ------------------------------- */

function toSimInputs(data: AtlasData): { nations: SimNation[]; matches: SimMatch[] } {
  const nations: SimNation[] = data.nations.map((n) => ({
    code: n.code,
    group: n.group_letter,
    elo: n.fifa_points,
  }));
  const matches: SimMatch[] = data.matches
    .filter(
      (m): m is Match & { group_letter: string; home: string; away: string } =>
        m.stage === "GROUP" && m.group_letter !== null && m.home !== null && m.away !== null,
    )
    .map((m) => ({
      id: m.id,
      group: m.group_letter,
      home: m.home,
      away: m.away,
      scoreHome: m.status === "FINISHED" ? m.score_home : null,
      scoreAway: m.status === "FINISHED" ? m.score_away : null,
    }));
  return { nations, matches };
}

/** Lance la sim dans le Web Worker, en ignorant les réponses périmées. */
function useMultiverseSim(data: AtlasData | null, forced: ForcedOutcome[]): SimResult | null {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [result, setResult] = useState<SimResult | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/multiverse.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<MultiverseResponse>) => {
      if (event.data.requestId === requestIdRef.current) setResult(event.data.result);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const scenarioKey = forced.map((f) => `${f.matchId}:${f.outcome}`).join(",");
  useEffect(() => {
    if (!data || !workerRef.current) return;
    const request: MultiverseRequest = {
      requestId: ++requestIdRef.current,
      ...toSimInputs(data),
      iterations: ITERATIONS,
      forced,
    };
    workerRef.current.postMessage(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scenarioKey]);

  return result;
}

/* --------------------------------- Affichage -------------------------------- */

function forcedToScore(o: Outcome): { scoreHome: number; scoreAway: number } {
  return o === "HOME" ? { scoreHome: 1, scoreAway: 0 } : o === "AWAY" ? { scoreHome: 0, scoreAway: 1 } : { scoreHome: 0, scoreAway: 0 };
}

function Delta({ now, base }: { now: number | undefined; base: number | undefined }) {
  if (now === undefined || base === undefined) return null;
  const diff = Math.round((now - base) * 100);
  if (Math.abs(diff) < 1) return null;
  return (
    <span className={`ml-1 ${diff > 0 ? "text-blue-electric" : "text-red-signal"}`}>
      {diff > 0 ? `▲${diff}` : `▼${-diff}`}
    </span>
  );
}

export default function Multiverse() {
  const { data, error } = useAtlasData();
  const [searchParams, setSearchParams] = useSearchParams();
  const scenario = useMemo(() => parseScenario(searchParams.get("s")), [searchParams]);
  const forced = useMemo(
    () => [...scenario.entries()].map(([matchId, outcome]) => ({ matchId, outcome })),
    [scenario],
  );
  const [copied, setCopied] = useState(false);

  const scenarioSim = useMultiverseSim(data, forced);
  const baselineSim = useMultiverseSim(data, []);
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);

  function setOutcome(matchId: number, outcome: Outcome | null) {
    const next = new Map(scenario);
    if (outcome === null) next.delete(matchId);
    else next.set(matchId, outcome);
    const s = serializeScenario(next);
    setSearchParams(s ? { s } : {}, { replace: true });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="La machine à futurs · simulation dans votre navigateur" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-4">
          Le Multivers
        </h1>
        <p className="font-light text-navy/70 max-w-2xl leading-relaxed mb-8">
          Forcez l'issue des matchs à venir et regardez les destins recalculer :
          classements, qualifiés, éliminés, probabilités. Le lien de la page contient
          votre scénario — partagez votre futur.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-12 font-mono text-xs uppercase tracking-widest">
          <span className="text-navy/50">
            {scenario.size === 0 ? "Aucun match forcé — futur de référence" : `${scenario.size} futur${scenario.size > 1 ? "s" : ""} forcé${scenario.size > 1 ? "s" : ""}`}
          </span>
          {scenario.size > 0 && (
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="border border-navy px-3 py-1.5 hover:bg-navy hover:text-cream transition-colors"
            >
              Réinitialiser
            </button>
          )}
          <button
            onClick={copyLink}
            className="border border-blue-electric text-blue-electric px-3 py-1.5 hover:bg-blue-electric hover:text-cream transition-colors"
          >
            {copied ? "Lien copié ✓" : "Partager ce futur"}
          </button>
          {scenarioSim && (
            <span className="text-navy/40">
              {ITERATIONS.toLocaleString("fr-FR")} simulations · issues forcées : 1-0 / 0-0 / 0-1
            </span>
          )}
        </div>

        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}

        {data && (
          <div className="grid lg:grid-cols-2 gap-px bg-navy/10 border border-navy/10">
            {LETTERS.map((letter) => (
              <GroupPanel
                key={letter}
                letter={letter}
                data={data}
                styles={styles}
                scenario={scenario}
                setOutcome={setOutcome}
                scenarioSim={scenarioSim}
                baselineSim={baselineSim}
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function GroupPanel({
  letter,
  data,
  styles,
  scenario,
  setOutcome,
  scenarioSim,
  baselineSim,
}: {
  letter: string;
  data: AtlasData;
  styles: ReturnType<typeof nationStyles>;
  scenario: Map<number, Outcome>;
  setOutcome: (matchId: number, outcome: Outcome | null) => void;
  scenarioSim: SimResult | null;
  baselineSim: SimResult | null;
}) {
  const codes = data.nations.filter((n) => n.group_letter === letter).map((n) => n.code);
  const groupMatches = data.matches.filter(
    (m): m is Match & { home: string; away: string } =>
      m.stage === "GROUP" && m.group_letter === letter && m.home !== null && m.away !== null,
  );

  const finished = groupMatches.filter((m) => m.status === "FINISHED" && m.score_home !== null && m.score_away !== null);
  const open = groupMatches.filter((m) => m.status !== "FINISHED");

  const played: GroupMatchInput[] = [
    ...finished.map((m) => ({ home: m.home, away: m.away, scoreHome: m.score_home!, scoreAway: m.score_away! })),
    ...open
      .filter((m) => scenario.has(m.id))
      .map((m) => ({ home: m.home, away: m.away, ...forcedToScore(scenario.get(m.id)!) })),
  ];
  const remaining = open.filter((m) => !scenario.has(m.id)).map((m) => ({ id: m.id, home: m.home, away: m.away }));

  const rows = computeStandings(codes, played);
  const outlook = groupOutlook(codes, played, remaining);

  return (
    <div className="bg-cream p-6">
      <div className="flex items-baseline justify-between mb-4">
        <Link to={`/groupes/${letter}`} className="font-display text-2xl uppercase tracking-wide hover:text-blue-electric">
          Groupe {letter}
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
          {remaining.length === 0 ? "groupe scellé" : `${remaining.length} match${remaining.length > 1 ? "s" : ""} libre${remaining.length > 1 ? "s" : ""}`}
        </span>
      </div>

      <table className="w-full font-mono text-xs mb-5">
        <tbody>
          {rows.map((r, i) => {
            const s = styles.get(r.code);
            const status = outlook[r.code]?.status;
            const zone = i < 2 ? "border-l-2 border-blue-electric" : i === 2 ? "border-l-2 border-navy/30" : "border-l-2 border-transparent";
            return (
              <tr key={r.code} className={`${zone} border-b border-navy/10 last:border-b-0`}>
                <td className="py-1.5 pl-2">
                  <span className="inline-flex items-center gap-2">
                    {s && <FlagEmoji flag={s.flag} />}
                    {s?.name ?? r.code}
                    {r.unresolvedTie && <span className="text-navy/40" title="Égalité non départagée">*</span>}
                  </span>
                </td>
                <td className="text-right tabular-nums">{r.points} pts</td>
                <td className="text-right tabular-nums w-12">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td className="text-right w-24 tabular-nums">
                  {status === "qualified" ? (
                    <span className="text-blue-electric font-bold">QUALIFIÉ</span>
                  ) : status === "eliminated" ? (
                    <span className="text-red-signal font-bold">ÉLIMINÉ</span>
                  ) : (
                    <>
                      {scenarioSim ? `${Math.round((scenarioSim.probs[r.code]?.p_qualify ?? 0) * 100)}%` : "…"}
                      <Delta now={scenarioSim?.probs[r.code]?.p_qualify} base={baselineSim?.probs[r.code]?.p_qualify} />
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="space-y-2">
        {open.map((m) => {
          const chosen = scenario.get(m.id);
          const home = styles.get(m.home);
          const away = styles.get(m.away);
          return (
            <div key={m.id} className="flex items-center gap-2 font-mono text-[11px]">
              <span className="flex-1 inline-flex items-center gap-1.5 justify-end text-right">
                {home?.name ?? m.home} {home && <FlagEmoji flag={home.flag} />}
              </span>
              <span className="inline-flex border border-navy/20">
                {(["HOME", "DRAW", "AWAY"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOutcome(m.id, chosen === o ? null : o)}
                    className={`px-2.5 py-1 uppercase tracking-widest transition-colors ${
                      chosen === o ? "bg-navy text-cream" : "hover:bg-navy/10"
                    } ${o !== "HOME" ? "border-l border-navy/20" : ""}`}
                    title={o === "HOME" ? `Victoire ${home?.name ?? m.home}` : o === "AWAY" ? `Victoire ${away?.name ?? m.away}` : "Match nul"}
                  >
                    {o === "HOME" ? "1" : o === "DRAW" ? "N" : "2"}
                  </button>
                ))}
              </span>
              <span className="flex-1 inline-flex items-center gap-1.5">
                {away && <FlagEmoji flag={away.flag} />} {away?.name ?? m.away}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
