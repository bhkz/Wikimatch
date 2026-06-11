/**
 * /groupes et /groupes/:letter (spec §12) : classements en direct calculés
 * depuis les matchs terminés (lib/standings, mêmes règles que le moteur).
 */

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import MatchChip from "../components/MatchChip";
import { FlagEmoji } from "../components/FlagEmoji";
import { computeStandings, type StandingRow } from "../../lib/standings";
import { nationStyles, useAtlasData, type AtlasData } from "../lib/atlas";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

function groupStandings(data: AtlasData, letter: string): StandingRow[] {
  const codes = data.nations.filter((n) => n.group_letter === letter).map((n) => n.code);
  const finished = data.matches.filter(
    (m): m is typeof m & { home: string; away: string; score_home: number; score_away: number } =>
      m.stage === "GROUP" &&
      m.group_letter === letter &&
      m.status === "FINISHED" &&
      m.home !== null &&
      m.away !== null &&
      m.score_home !== null &&
      m.score_away !== null,
  );
  return computeStandings(
    codes,
    finished.map((m) => ({ home: m.home, away: m.away, scoreHome: m.score_home, scoreAway: m.score_away })),
  );
}

function QualifyBar({ p }: { p: number | undefined }) {
  if (p === undefined) return <span className="text-navy/30">—</span>;
  const pct = Math.round(p * 100);
  return (
    <span className="inline-flex items-center gap-2" title={`Probabilité de qualification : ${pct} %`}>
      <span className="inline-block w-12 h-1.5 bg-navy/10 align-middle">
        <span className="block h-full bg-blue-electric" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums">{pct}%</span>
    </span>
  );
}

function StandingsTable({ rows, data, compact }: { rows: StandingRow[]; data: AtlasData; compact?: boolean }) {
  const styles = nationStyles(data.nations);
  const probs = data.sim?.probs;
  return (
    <table className="w-full font-mono text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-widest text-navy/40 text-right">
          <th className="text-left font-medium py-1">Équipe</th>
          <th className="font-medium">J</th>
          {!compact && <th className="font-medium">G</th>}
          {!compact && <th className="font-medium">N</th>}
          {!compact && <th className="font-medium">P</th>}
          <th className="font-medium">+/−</th>
          <th className="font-medium">Pts</th>
          {!compact && <th className="font-medium pl-4">Qualif</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const s = styles.get(r.code);
          // Top 2 qualifiés directs ; 3e : repêchable (8 meilleurs) — spec §6.2.
          const zone = i < 2 ? "border-l-2 border-blue-electric" : i === 2 ? "border-l-2 border-navy/30" : "border-l-2 border-transparent";
          return (
            <tr key={r.code} className={`${zone} border-b border-navy/10 last:border-b-0`}>
              <td className="py-2 pl-2">
                <Link to={`/n/${r.code}`} className="inline-flex items-center gap-2 hover:text-blue-electric">
                  {s && <FlagEmoji flag={s.flag} />}
                  <span className="font-medium">{s?.name ?? r.code}</span>
                  {r.unresolvedTie && (
                    <span title="Égalité non départagée" className="text-navy/40">
                      *
                    </span>
                  )}
                </Link>
              </td>
              <td className="text-right">{r.played}</td>
              {!compact && <td className="text-right">{r.won}</td>}
              {!compact && <td className="text-right">{r.drawn}</td>}
              {!compact && <td className="text-right">{r.lost}</td>}
              <td className="text-right">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="text-right font-medium">{r.points}</td>
              {!compact && (
                <td className="text-right pl-4">
                  <QualifyBar p={probs?.[r.code]?.p_qualify} />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ConditionsPanel({ data, letter }: { data: AtlasData; letter: string }) {
  const rows = data.conditions.filter((c) => c.group_letter === letter);
  const hasContent = rows.some((r) => r.status !== "contender" || r.conditions.length > 0);
  if (!hasContent) return null;

  const styles = nationStyles(data.nations);
  const statusText = {
    qualified: "Qualifié quel que soit le résultat",
    eliminated: "Éliminé quoi qu'il arrive",
    contender: "Encore en jeu",
  } as const;

  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">
        Conditions de qualification
      </h2>
      <div className="grid md:grid-cols-2 gap-px bg-navy/10 border border-navy/10 max-w-5xl">
        {rows.map((row) => {
          const s = styles.get(row.nation);
          return (
            <article key={row.nation} className="bg-cream p-5">
              <div className="flex items-center justify-between gap-3">
                <Link to={`/n/${row.nation}`} className="inline-flex items-center gap-2 font-medium hover:text-blue-electric">
                  {s && <FlagEmoji flag={s.flag} />}
                  {s?.name ?? row.nation}
                </Link>
                <span
                  className={`font-mono text-[10px] uppercase font-bold tracking-widest ${
                    row.status === "qualified"
                      ? "text-blue-electric"
                      : row.status === "eliminated"
                        ? "text-red-signal"
                        : "text-navy/45"
                  }`}
                >
                  {statusText[row.status]}
                </span>
              </div>
              {row.conditions.length > 0 && (
                <ul className="mt-4 space-y-2 font-mono text-[11px] uppercase tracking-widest text-navy/65">
                  {row.conditions.map((condition) => (
                    <li key={condition.text}>
                      {condition.text}
                      {condition.gd_dependent && <span className="text-red-signal"> · diff. buts</span>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function Groups() {
  const { letter } = useParams();
  const { data, error } = useAtlasData();
  const upper = letter?.toUpperCase();
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const stakesByMatch = useMemo(() => new Map((data?.stakes ?? []).map((s) => [s.match_id, s])), [data]);

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Phase de groupes · 12 groupes · top 2 + 8 meilleurs troisièmes" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-12">
          {upper ? `Groupe ${upper}` : "Les groupes"}
        </h1>
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}

        {data && !upper && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10">
            {LETTERS.map((l) => (
              <div key={l} className="bg-cream p-6">
                <Link to={`/groupes/${l}`} className="font-display text-3xl uppercase tracking-wide hover:text-blue-electric">
                  Groupe {l} →
                </Link>
                <div className="mt-4">
                  <StandingsTable rows={groupStandings(data, l)} data={data} compact />
                </div>
              </div>
            ))}
          </div>
        )}

        {data && upper && (
          <>
            <div className="max-w-2xl border border-navy/10 p-6 mb-12 bg-cream">
              <StandingsTable rows={groupStandings(data, upper)} data={data} />
              <p className="font-mono text-[10px] uppercase tracking-widest text-navy/40 mt-4">
                <span className="text-blue-electric">▎</span> qualifiés directs ·{" "}
                <span className="text-navy/60">▎</span> 3e repêchable · * égalité non départagée
                {data.sim && (
                  <>
                    {" · "}probabilités : {data.sim.iterations.toLocaleString("fr-FR")} simulations,{" "}
                    {new Date(data.sim.run_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </>
                )}
              </p>
            </div>
            <ConditionsPanel data={data} letter={upper} />
            <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Matchs du groupe</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10">
              {data.matches
                .filter((m) => m.stage === "GROUP" && m.group_letter === upper)
                .map((m) => (
                  <MatchChip key={m.id} match={m} styles={styles} stake={stakesByMatch.get(m.id)} />
                ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
