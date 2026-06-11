/**
 * /calendrier (spec §12) : les 104 matchs groupés par jour, heure locale,
 * drama, filtres nation/groupe, scroll automatique sur aujourd'hui.
 */

import { useEffect, useMemo, useRef, useState } from "react";
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

const GROUPS = "ABCDEFGHIJKL".split("");

export default function Calendar() {
  const { data, error } = useAtlasData();
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const stakesByMatch = useMemo(() => new Map((data?.stakes ?? []).map((s) => [s.match_id, s])), [data]);
  const [nationFilter, setNationFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const scrolledOnce = useRef(false);

  const filtered = useMemo(
    () =>
      (data?.matches ?? []).filter((m) => {
        if (nationFilter && m.home !== nationFilter && m.away !== nationFilter) return false;
        if (groupFilter && m.group_letter !== groupFilter) return false;
        return true;
      }),
    [data, nationFilter, groupFilter],
  );

  const byDay = useMemo(() => {
    const groups = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = dayKey(m.kickoff_utc);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return [...groups.entries()];
  }, [filtered]);

  const todayKey = dayKey(new Date().toISOString());

  // Arrivée sur la page : on atterrit sur aujourd'hui, pas sur le 11 juin.
  useEffect(() => {
    if (!data || scrolledOnce.current || nationFilter || groupFilter) return;
    const el = document.getElementById("today");
    if (el) {
      el.scrollIntoView({ block: "start" });
      scrolledOnce.current = true;
    }
  }, [data, nationFilter, groupFilter]);

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Mondial 2026 · 104 matchs" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-8">
          Calendrier
        </h1>

        <div className="flex flex-wrap gap-3 mb-10 font-mono text-xs uppercase tracking-widest">
          <select
            value={nationFilter}
            onChange={(e) => setNationFilter(e.target.value)}
            className="bg-cream border border-navy/15 px-3 py-2 uppercase tracking-widest"
            aria-label="Filtrer par nation"
          >
            <option value="">Toutes les nations</option>
            {(data?.nations ?? []).map((n) => (
              <option key={n.code} value={n.code}>
                {n.name_fr}
              </option>
            ))}
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-cream border border-navy/15 px-3 py-2 uppercase tracking-widest"
            aria-label="Filtrer par groupe"
          >
            <option value="">Tous les groupes</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                Groupe {g}
              </option>
            ))}
          </select>
          {(nationFilter || groupFilter) && (
            <button
              type="button"
              className="px-3 py-2 border border-navy/15 text-navy/60 hover:text-navy uppercase tracking-widest"
              onClick={() => {
                setNationFilter("");
                setGroupFilter("");
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {error && (
          <div className="font-mono text-xs uppercase tracking-widest text-red-signal mb-6">{error}</div>
        )}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}
        {data && byDay.length === 0 && (
          <p className="font-light text-navy/70">Aucun match ne correspond à ce filtre.</p>
        )}
        {byDay.map(([day, matches]) => (
          <section key={day} className="mb-12 scroll-mt-24" id={day === todayKey ? "today" : undefined}>
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
