import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HexMap from "../components/HexMap";
import { FlagEmoji, TextWithFlags } from "../components/FlagEmoji";
import SectionLabel from "../components/SectionLabel";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import TimeScrubber from "../components/TimeScrubber";
import { nationStyles, useAtlasData } from "../lib/atlas";

function territoryCounts(frame: Array<{ owner: string | null; state: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const hex of frame) {
    if (!hex.owner || hex.state !== "owned") continue;
    counts.set(hex.owner, (counts.get(hex.owner) ?? 0) + 1);
  }
  return counts;
}

export default function Finale() {
  const { data, error } = useAtlasData();
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string | null>(null);

  const champion = data?.nations.find((n) => n.status === "champion");
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
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

  const largestResolution = useMemo(
    () =>
      [...(data?.resolutions ?? [])].sort(
        (a, b) =>
          b.final_gain + b.inherited_hexes.length - (a.final_gain + a.inherited_hexes.length) ||
          b.resolved_at.localeCompare(a.resolved_at),
      )[0],
    [data],
  );

  const peakEmpire = useMemo(() => {
    if (!data) return null;
    let best: { code: string; count: number; date: string } | null = null;
    const frames = [
      ...data.snapshots.map((snapshot) => ({
        date: snapshot.date,
        counts: territoryCounts(snapshot.frame),
      })),
      {
        date: "live",
        counts: territoryCounts(data.hexes),
      },
    ];
    for (const frame of frames) {
      for (const [code, count] of frame.counts) {
        if (!best || count > best.count) best = { code, count, date: frame.date };
      }
    }
    return best;
  }, [data]);

  const memorials = data?.hexes.filter((h) => h.state === "memorial").length ?? 0;
  const peakNation = peakEmpire ? data?.nations.find((n) => n.code === peakEmpire.code) : null;

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement...</p>}
        {data && !champion && (
          <>
            <SectionLabel label="Ouverture après la finale" />
            <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-8">
              Le monde n'est pas encore figé
            </h1>
            <p className="font-light text-navy/70 max-w-xl leading-relaxed">
              Cette page s'ouvrira quand la finale aura désigné le champion et que la carte aura lancé sa vague finale.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-widest">
              <Link to="/tableau" className="hover:text-blue-electric">Suivre le tableau →</Link>
              <Link to="/" className="hover:text-blue-electric">Voir la carte live →</Link>
            </div>
          </>
        )}
        {data && champion && (
          <>
            <SectionLabel label="Carte finale" />
            <h1 className="font-display text-5xl md:text-8xl uppercase leading-[0.9] tracking-wide mt-4 mb-6">
              <FlagEmoji flag={champion.flag} /> {champion.name_fr}
            </h1>
            <p className="font-light text-navy/70 max-w-2xl leading-relaxed mb-10">
              Champion du monde. Les ruines et terres neutres sont passées à ses couleurs ; seuls les memorials demeurent.
            </p>

            <div className="grid md:grid-cols-4 gap-px bg-navy/10 border border-navy/10 mb-10">
              <div className="bg-cream p-6">
                <div className="font-display text-5xl">{data.resolutions.length}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Matchs résolus</div>
              </div>
              <div className="bg-cream p-6">
                <div className="font-display text-5xl">{memorials}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Memorials</div>
              </div>
              <div className="bg-cream p-6">
                <div className="font-display text-5xl">{peakEmpire?.count ?? 0}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50">
                  Pic territorial{peakNation ? ` · ${peakNation.name_fr}` : ""}
                </div>
              </div>
              <div className="bg-cream p-6">
                <div className="font-display text-5xl">
                  {largestResolution ? largestResolution.final_gain + largestResolution.inherited_hexes.length : 0}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50">Plus gros mouvement</div>
              </div>
            </div>

            <div className="border border-navy/10">
              <HexMap hexes={displayedHexes} nations={styles} />
            </div>
            <TimeScrubber snapshots={data.snapshots} selectedDate={selectedSnapshotDate} onSelect={setSelectedSnapshotDate} />

            {largestResolution && (
              <section className="mt-12 max-w-3xl">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">
                  Le plus grand basculement
                </h2>
                <Link
                  to={`/m/${largestResolution.match_id}`}
                  className="block border-t-4 border-blue-electric bg-cream-dark p-6 hover:bg-navy/5"
                >
                  <p className="text-xl md:text-3xl font-light leading-relaxed">
                    <TextWithFlags text={largestResolution.narrative} />
                  </p>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 mt-4">
                    {largestResolution.final_gain} pris · {largestResolution.inherited_hexes.length} hérités
                  </div>
                </Link>
              </section>
            )}

            <div className="mt-12 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-widest">
              <Link to="/" className="hover:text-blue-electric">Voir la carte finale →</Link>
              <Link to="/memorial" className="hover:text-blue-electric">Voir le memorial →</Link>
              <Link to="/snapshot" className="hover:text-blue-electric">Partager un snapshot →</Link>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
