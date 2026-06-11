import { Link } from "react-router-dom";
import { FlagEmoji } from "./FlagEmoji";
import type { Nation, SnapshotSummary } from "../lib/atlas";
import type { MapHex } from "./HexMap";

type Props = {
  nations: Nation[];
  hexes: MapHex[];
  snapshots: SnapshotSummary[];
};

function countsForFrame(frame: SnapshotSummary["frame"]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const h of frame) {
    if (!h.owner || h.state !== "owned") continue;
    counts.set(h.owner, (counts.get(h.owner) ?? 0) + 1);
  }
  return counts;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="text-navy/25">n/d</span>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(max - min, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 64},${18 - ((v - min) / span) * 18}`)
    .join(" ");
  return (
    <svg viewBox="0 0 64 20" className="h-5 w-16" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function TerritorySidebar({ nations, hexes, snapshots }: Props) {
  const current = new Map<string, number>();
  for (const h of hexes) {
    if (!h.owner || h.state !== "owned") continue;
    current.set(h.owner, (current.get(h.owner) ?? 0) + 1);
  }
  const historical = snapshots.slice(-7).map((s) => countsForFrame(s.frame));
  const rows = nations
    .map((n) => ({
      nation: n,
      territory: current.get(n.code) ?? 0,
      series: [...historical.map((h) => h.get(n.code) ?? 0), current.get(n.code) ?? 0],
    }))
    .sort((a, b) => b.territory - a.territory || a.nation.name_fr.localeCompare(b.nation.name_fr))
    .slice(0, 12);

  return (
    <aside className="border border-navy/10 bg-cream p-4">
      <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mb-3">
        Territoires
      </div>
      <ol className="divide-y divide-navy/10">
        {rows.map((row, index) => (
          <li key={row.nation.code} className="py-2 flex items-center gap-3">
            <span className="w-5 font-mono text-[10px] text-navy/35">{index + 1}</span>
            <Link to={`/n/${row.nation.code}`} className="min-w-0 flex-1 inline-flex items-center gap-2 hover:text-blue-electric">
              <FlagEmoji flag={row.nation.flag} />
              <span className="truncate text-sm">{row.nation.name_fr}</span>
            </Link>
            <span className="font-mono text-xs tabular-nums">{row.territory}</span>
            <span className="text-blue-electric"><Sparkline values={row.series} /></span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
