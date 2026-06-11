import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import HexMap, { type MapHex } from "../components/HexMap";
import SectionLabel from "../components/SectionLabel";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import ShareBar from "../components/ShareBar";
import { atlas } from "../lib/supabase";
import { nationStyles, useAtlasData } from "../lib/atlas";

type SnapshotRow = {
  date: string;
  frame: Array<{ id: number; owner: string | null; state: MapHex["state"] }>;
  deltas: Record<string, { gained: number; lost: number }>;
  og_image_url: string | null;
  story_image_url: string | null;
};

function currentAtlasDate(): string {
  const now = new Date();
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  if (paris.getHours() * 60 + paris.getMinutes() < 7 * 60 + 30) paris.setDate(paris.getDate() - 1);
  return paris.toLocaleDateString("en-CA");
}

export default function Snapshot() {
  const { date } = useParams();
  const snapshotDate = date ?? currentAtlasDate();
  const { data, error } = useAtlasData();
  const [snapshot, setSnapshot] = useState<SnapshotRow | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: row, error: err } = await atlas
        .from("snapshots")
        .select("date, frame, deltas, og_image_url, story_image_url")
        .eq("date", snapshotDate)
        .maybeSingle();
      if (cancelled) return;
      if (err) setSnapshotError(err.message);
      else {
        setSnapshot((row as SnapshotRow | null) ?? null);
        setSnapshotError(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [snapshotDate]);

  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const hexes = useMemo(() => {
    if (!data || !snapshot) return data?.hexes ?? [];
    const frame = new Map(snapshot.frame.map((h) => [h.id, h]));
    return data.hexes.map((hex) => {
      const state = frame.get(hex.id);
      return state ? { ...hex, owner: state.owner, state: state.state } : hex;
    });
  }, [data, snapshot]);

  const deltas = Object.entries(snapshot?.deltas ?? {})
    .map(([code, d]) => [code, d.gained - d.lost] as const)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Snapshot quotidien" />
        <div className="mt-4 mb-10 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide">
            Carte du {new Date(`${snapshotDate}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </h1>
          <ShareBar title={`L'Atlas du Mondial — carte du ${snapshotDate}`} />
        </div>
        {(error || snapshotError) && (
          <div className="font-mono text-xs uppercase tracking-widest text-red-signal mb-6">
            {error ?? snapshotError}
          </div>
        )}
        {data && !snapshot && !snapshotError && (
          <p className="font-light text-navy/70 max-w-xl mb-10">
            Aucun snapshot figé pour cette date. <Link to="/nuit" className="underline hover:text-blue-electric">Voir le recap de nuit</Link>.
          </p>
        )}
        {hexes.length > 0 && (
          <div className="border border-navy/10">
            <HexMap hexes={hexes} nations={styles} />
          </div>
        )}
        {deltas.length > 0 && (
          <section className="mt-12 max-w-xl">
            <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Mouvements</h2>
            <ul className="divide-y divide-navy/10 border-y border-navy/10 font-mono text-xs uppercase tracking-widest">
              {deltas.slice(0, 12).map(([code, delta]) => (
                <li key={code} className="py-2 flex justify-between">
                  <span>{code}</span>
                  <span className={delta >= 0 ? "text-blue-electric" : "text-red-signal"}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
