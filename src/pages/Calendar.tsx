/**
 * /calendrier (spec §12) : les 104 matchs groupés par jour, heure locale.
 */

import { useMemo } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import MatchChip from "../components/MatchChip";
import { nationStyles, useAtlasData, type Match } from "../lib/atlas";

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function Calendar() {
  const { data, error } = useAtlasData();
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const stakesByMatch = useMemo(() => new Map((data?.stakes ?? []).map((s) => [s.match_id, s])), [data]);

  const byDay = useMemo(() => {
    const groups = new Map<string, Match[]>();
    for (const m of data?.matches ?? []) {
      const key = dayKey(m.kickoff_utc);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return [...groups.entries()];
  }, [data]);

  const todayKey = dayKey(new Date().toISOString());

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Mondial 2026 · 104 matchs" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-12">
          Calendrier
        </h1>
        {error && (
          <div className="font-mono text-xs uppercase tracking-widest text-red-signal mb-6">{error}</div>
        )}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}
        {byDay.map(([day, matches]) => (
          <section key={day} className="mb-12" id={day === todayKey ? "today" : undefined}>
            <h2 className="font-display text-2xl md:text-3xl uppercase tracking-wide mb-4 flex items-baseline gap-3">
              {day}
              {day === todayKey && (
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
                  Aujourd'hui
                </span>
              )}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10">
              {matches.map((m) => (
                <MatchChip key={m.id} match={m} styles={styles} stake={stakesByMatch.get(m.id)} />
              ))}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
