import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import HexMap from "../components/HexMap";
import MatchChip from "../components/MatchChip";
import TimeScrubber from "../components/TimeScrubber";
import { TextWithFlags } from "../components/FlagEmoji";
import {
  liveOwners,
  nationStyles,
  sameLocalDay,
  useAtlasData,
} from "../lib/atlas";

/**
 * Accueil (spec §12) : la carte vivante plein écran + bandeau des matchs du
 * jour + dernières conquêtes. Les territoires des nations qui jouent pulsent.
 */
export default function Home() {
  const { data, error } = useAtlasData();
  const navigate = useNavigate();
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string | null>(null);

  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const stakesByMatch = useMemo(() => new Map((data?.stakes ?? []).map((s) => [s.match_id, s])), [data]);
  const displayedHexes = useMemo(() => {
    if (!data || !selectedSnapshotDate) return data?.hexes ?? [];
    const snapshot = data.snapshots.find((s) => s.date === selectedSnapshotDate);
    if (!snapshot) return data.hexes;
    const frame = new Map(snapshot.frame.map((h) => [h.id, h]));
    return data.hexes.map((hex) => {
      const h = frame.get(hex.id);
      return h ? { ...hex, owner: h.owner, state: h.state } : hex;
    });
  }, [data, selectedSnapshotDate]);
  const live = useMemo(() => (data ? liveOwners(data.matches) : new Set<string>()), [data]);
  const today = useMemo(
    () =>
      data
        ? data.matches
            .filter((m) => sameLocalDay(m.kickoff_utc, new Date()))
            .sort(
              (a, b) =>
                (stakesByMatch.get(b.id)?.drama ?? -1) - (stakesByMatch.get(a.id)?.drama ?? -1) ||
                a.kickoff_utc.localeCompare(b.kickoff_utc),
            )
        : [],
    [data, stakesByMatch],
  );
  const lastResolutions = data?.resolutions.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mb-2">
              Mondial 2026 · 11 juin → 19 juillet
            </div>
            <h1 className="font-display uppercase tracking-wide leading-[0.9] text-5xl md:text-7xl">
              Le monde, ce soir
            </h1>
          </div>
          {live.size > 0 && (
            <div className="font-mono text-xs uppercase tracking-widest text-red-signal flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-signal animate-pulse" />
              Match en cours — les territoires pulsent
            </div>
          )}
        </div>

        {error && (
          <div className="font-mono text-xs uppercase tracking-widest text-red-signal border border-red-signal/30 px-4 py-3 mb-6">
            Données indisponibles : {error}
          </div>
        )}

        <div className="border border-navy/10">
          {data ? (
            <HexMap
              hexes={displayedHexes}
              nations={styles}
              liveOwners={selectedSnapshotDate ? undefined : live}
              onHexClick={(hex) => hex.owner && navigate(`/n/${hex.owner}`)}
            />
          ) : (
            <div className="aspect-[2/1] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-navy/40 bg-navy/95 text-cream/40">
              Chargement de la carte…
            </div>
          )}
        </div>

        {/* Bandeau matchs du jour (§12) */}
        {data && (
          <TimeScrubber
            snapshots={data.snapshots}
            selectedDate={selectedSnapshotDate}
            onSelect={setSelectedSnapshotDate}
          />
        )}

        <section className="mt-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide">Aujourd'hui</h2>
            <Link to="/calendrier" className="font-mono text-[10px] uppercase font-bold tracking-widest hover:text-blue-electric">
              Calendrier complet →
            </Link>
          </div>
          {today.length === 0 ? (
            <p className="font-light text-navy/70">Pas de match aujourd'hui.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10">
              {today.map((m) => (
                <MatchChip key={m.id} match={m} styles={styles} stake={stakesByMatch.get(m.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Dernières conquêtes */}
        <section className="mt-16">
          <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">La carte a bougé</h2>
          {lastResolutions.length === 0 ? (
            <p className="font-light text-navy/70">
              Rien encore — le premier match redessinera les frontières.
            </p>
          ) : (
            <ul className="divide-y divide-navy/10 border-y border-navy/10">
              {lastResolutions.map((r) => (
                <li key={r.match_id}>
                  <Link
                    to={`/m/${r.match_id}`}
                    className="flex items-baseline justify-between gap-4 py-3 hover:bg-navy/5 px-2 transition-colors"
                  >
                    <span className="font-light"><TextWithFlags text={r.narrative} /></span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40 whitespace-nowrap">
                      {r.is_draw ? "nul" : `+${r.final_gain} hex`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
