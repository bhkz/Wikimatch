import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import HexMap from "../components/HexMap";
import MatchChip from "../components/MatchChip";
import TimeScrubber from "../components/TimeScrubber";
import FeedTicker from "../components/FeedTicker";
import TerritorySidebar from "../components/TerritorySidebar";
import HexStoryPanel from "../components/HexStoryPanel";
import type { MapHex } from "../components/HexMap";
import { TextWithFlags } from "../components/FlagEmoji";
import {
  isLive,
  kickoffLabel,
  liveOwners,
  nationStyles,
  sameLocalDay,
  useAtlasData,
} from "../lib/atlas";
import { useMyNation } from "../lib/myNation";
import { usePronos, type Pick } from "../lib/pronos";
import { FlagEmoji } from "../components/FlagEmoji";

/**
 * Accueil (spec §12) : la carte vivante plein écran + bandeau des matchs du
 * jour + dernières conquêtes. Les territoires des nations qui jouent pulsent.
 */
export default function Home() {
  const { data, error } = useAtlasData();
  const [myNationCode] = useMyNation();
  const [pronos, setProno] = usePronos();
  const [searchParams, setSearchParams] = useSearchParams();
  const [storyHex, setStoryHex] = useState<MapHex | null>(null);
  const selectedSnapshotDate = searchParams.get("t");

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
  // Nations tombées dans les dernières 36 h : leurs anciens territoires
  // s'éteignent sur la carte. ≥ 8 morts simultanées = la Grande Fracture.
  const recentlyFallen = useMemo(() => {
    const cutoff = Date.now() - 36 * 3600_000;
    return new Set(
      (data?.nations ?? [])
        .filter((n) => n.status === "eliminated" && n.eliminated_at !== null && Date.parse(n.eliminated_at) > cutoff)
        .map((n) => n.code),
    );
  }, [data]);
  const isFractureNight = recentlyFallen.size >= 8;
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

  // « Ma nation » (localStorage) : son état + son prochain match, en un regard.
  const myNation = useMemo(() => {
    if (!data || !myNationCode) return null;
    const nation = data.nations.find((n) => n.code === myNationCode);
    if (!nation) return null;
    const territory = data.hexes.filter((h) => h.owner === myNationCode && h.state === "owned").length;
    const next = data.matches.find(
      (m) => (m.home === myNationCode || m.away === myNationCode) && m.status !== "FINISHED",
    );
    const p = data.sim?.probs[myNationCode];
    return { nation, territory, next, p };
  }, [data, myNationCode]);

  function selectSnapshot(date: string | null) {
    const next = new URLSearchParams(searchParams);
    if (date) next.set("t", date);
    else next.delete("t");
    setSearchParams(next, { replace: true });
  }

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
              Match en cours : les territoires pulsent
            </div>
          )}
        </div>

        {error && (
          <div className="font-mono text-xs uppercase tracking-widest text-red-signal border border-red-signal/30 px-4 py-3 mb-6">
            Données indisponibles : {error}
          </div>
        )}

        {/* Ma nation (localStorage, zéro compte) : l'empire suivi en un regard. */}
        {myNation && (
          <Link
            to={`/n/${myNation.nation.code}`}
            className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border border-navy/10 bg-cream-dark px-4 py-3 mb-6 hover:border-navy/30 transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <span className="font-bold">
              <FlagEmoji flag={myNation.nation.flag} /> {myNation.nation.name_fr}
            </span>
            <span className="text-navy/60">{myNation.territory} territoire{myNation.territory > 1 ? "s" : ""}</span>
            {myNation.p && (
              <span className="text-blue-electric">
                {myNation.p.p_champion !== undefined
                  ? `${Math.round((myNation.p.p_champion ?? 0) * 100)} % champion`
                  : `${Math.round(myNation.p.p_qualify * 100)} % qualif`}
              </span>
            )}
            {myNation.next && (
              <span className="text-navy/60">
                Prochain match : {myNation.next.home === myNation.nation.code ? myNation.next.away : myNation.next.home} ·{" "}
                {kickoffLabel(myNation.next.kickoff_utc)}
              </span>
            )}
            {myNation.nation.status === "eliminated" && <span className="text-red-signal">au memorial</span>}
          </Link>
        )}

        {/* La Grande Fracture (§5.8) : 16 nations grisées d'un coup — l'image du mois. */}
        {isFractureNight && (
          <Link
            to="/memorial"
            className="block border-t-4 border-red-signal bg-navy text-cream px-6 py-5 mb-6 hover:bg-navy/90 transition-colors"
          >
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-red-signal mb-1">
              La Grande Fracture
            </div>
            <div className="font-display text-2xl md:text-4xl uppercase tracking-wide">
              {recentlyFallen.size} nations sont tombées · leurs capitales entrent au memorial →
            </div>
          </Link>
        )}

        <div className="grid xl:grid-cols-[1fr_360px] gap-6">
          <div className="border border-navy/10">
            {data ? (
              <HexMap
                hexes={displayedHexes}
                nations={styles}
                liveOwners={selectedSnapshotDate ? undefined : live}
                fractureOwners={selectedSnapshotDate || recentlyFallen.size === 0 ? undefined : recentlyFallen}
                onHexClick={(hex) => setStoryHex(hex)}
                hexActionLabel={() => "Son histoire →"}
              />
            ) : (
              <div className="aspect-[2/1] flex items-center justify-center font-mono text-xs uppercase tracking-widest bg-navy/95 text-cream/40">
                Chargement de la carte…
              </div>
            )}
          </div>
          {data && <TerritorySidebar nations={data.nations} hexes={displayedHexes} snapshots={data.snapshots} />}
        </div>
        <FeedTicker items={lastResolutions} />

        {/* Replay : remonter le temps jour par jour (§10) */}
        {data && (
          <TimeScrubber
            snapshots={data.snapshots}
            selectedDate={selectedSnapshotDate}
            onSelect={selectSnapshot}
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
              {today.map((m) => {
                const prono = pronos[String(m.id)]?.pick;
                const open = m.status !== "FINISHED" && !isLive(m) && m.home !== null && m.away !== null;
                return (
                  <div key={m.id} className="bg-cream flex flex-col">
                    <MatchChip match={m} styles={styles} stake={stakesByMatch.get(m.id)} />
                    {(open || prono) && m.home && m.away && (
                      <div className="px-4 pb-3 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
                        <span className="text-navy/40 mr-1">{prono ? "Ton prono" : "Ton prono ?"}</span>
                        {(["HOME", "DRAW", "AWAY"] as Pick[]).map((p) => {
                          const label = p === "HOME" ? m.home! : p === "AWAY" ? m.away! : "Nul";
                          const active = prono === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              disabled={!open}
                              onClick={() => setProno(m.id, active ? null : p)}
                              className={`px-2 py-1 border transition-colors ${
                                active
                                  ? "border-blue-electric text-blue-electric font-bold"
                                  : open
                                    ? "border-navy/10 text-navy/50 hover:border-navy/40 hover:text-navy"
                                    : "border-navy/10 text-navy/30"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {today.some((m) => pronos[String(m.id)]) && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-navy/40 mt-3">
              Verdict demain matin à 07h30 dans <Link to="/nuit" className="underline hover:text-blue-electric">le recap de la nuit</Link>.
            </p>
          )}
        </section>

        {/* Dernières conquêtes */}
        <section className="mt-16">
          <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">La carte a bougé</h2>
          {lastResolutions.length === 0 ? (
            <p className="font-light text-navy/70">
              Rien encore : le premier match redessinera les frontières.
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
      {data && storyHex && (
        <HexStoryPanel hex={storyHex} events={data.events} nations={styles} onClose={() => setStoryHex(null)} />
      )}
      <SiteFooter />
    </div>
  );
}
