import type { SnapshotSummary } from "../lib/atlas";

type Props = {
  snapshots: SnapshotSummary[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
};

export default function TimeScrubber({ snapshots, selectedDate, onSelect }: Props) {
  if (snapshots.length === 0) return null;

  const selectedIndex = selectedDate ? snapshots.findIndex((s) => s.date === selectedDate) : snapshots.length;
  const value = selectedIndex < 0 ? snapshots.length : selectedIndex;

  return (
    <div className="mt-6 border border-navy/10 bg-cream p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
          Replay
        </div>
        <button
          className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 hover:text-blue-electric"
          onClick={() => onSelect(null)}
        >
          Carte actuelle
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={snapshots.length}
        value={value}
        onChange={(e) => {
          const idx = Number(e.target.value);
          onSelect(idx >= snapshots.length ? null : snapshots[idx].date);
        }}
        className="w-full accent-blue-electric"
      />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-navy/45">
        {selectedDate
          ? new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
          : "État live"}
      </div>
    </div>
  );
}
