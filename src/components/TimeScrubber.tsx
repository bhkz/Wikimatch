import { useEffect, useMemo, useState } from "react";
import type { SnapshotSummary } from "../lib/atlas";

type Props = {
  snapshots: SnapshotSummary[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
};

export default function TimeScrubber({ snapshots, selectedDate, onSelect }: Props) {
  const [playing, setPlaying] = useState(false);
  const selectedIndex = useMemo(
    () => (selectedDate ? snapshots.findIndex((s) => s.date === selectedDate) : snapshots.length),
    [selectedDate, snapshots],
  );
  const value = selectedIndex < 0 ? snapshots.length : selectedIndex;

  useEffect(() => {
    if (!playing || snapshots.length === 0) return;
    const timer = setTimeout(() => {
      const nextIndex = value >= snapshots.length ? 0 : value + 1;
      onSelect(nextIndex >= snapshots.length ? null : snapshots[nextIndex].date);
      if (nextIndex >= snapshots.length) setPlaying(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [playing, snapshots, value, onSelect]);

  if (snapshots.length === 0) return null;

  return (
    <div className="mt-6 border border-navy/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
          Replay
        </div>
        <div className="flex items-center gap-3">
          <button
            className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 hover:text-blue-electric"
            onClick={() => setPlaying((current) => !current)}
            aria-pressed={playing}
          >
            {playing ? "Pause" : "Lire"}
          </button>
          <button
            className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 hover:text-blue-electric"
            onClick={() => {
              setPlaying(false);
              onSelect(null);
            }}
          >
            Carte actuelle
          </button>
        </div>
      </div>
      <div className="relative pb-4">
        <input
          type="range"
          min={0}
          max={snapshots.length}
          value={value}
          aria-label="Choisir une date de replay"
          onChange={(e) => {
            setPlaying(false);
            const idx = Number(e.target.value);
            onSelect(idx >= snapshots.length ? null : snapshots[idx].date);
          }}
          className="w-full accent-blue-electric"
        />
        <div className="absolute left-0 right-0 bottom-0 h-2 pointer-events-none">
          {snapshots.map((snapshot, index) => (
            <span
              key={snapshot.date}
              className="absolute top-0 h-2 border-l border-navy/20"
              style={{ left: `${(index / snapshots.length) * 100}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-navy/45">
        <span>
          {selectedDate
            ? new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
            : "État live"}
        </span>
        <span>{snapshots.length} snapshots</span>
      </div>
    </div>
  );
}
