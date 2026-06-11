import { useMemo, useState } from "react";
import HexMap, { type MapHex, type NationStyle } from "./HexMap";

type Props = {
  before: MapHex[];
  after: MapHex[];
  nations: ReadonlyMap<string, NationStyle>;
  highlightIds?: ReadonlySet<number>;
};

export default function BeforeAfterMap({ before, after, nations, highlightIds }: Props) {
  const [afterView, setAfterView] = useState(true);
  const frame = afterView ? after : before;
  const label = afterView ? "Après" : "Avant";
  const changed = useMemo(() => highlightIds?.size ?? 0, [highlightIds]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
          Avant / après
          {changed > 0 && <span className="text-navy/40"> · {changed} hex</span>}
        </div>
        <div className="inline-flex border border-navy/15 font-mono text-[10px] uppercase font-bold tracking-widest">
          <button
            className={`px-3 py-2 ${!afterView ? "bg-navy text-cream" : "bg-cream text-navy hover:bg-cream-dark"}`}
            onClick={() => setAfterView(false)}
            aria-pressed={!afterView}
          >
            Avant
          </button>
          <button
            className={`px-3 py-2 ${afterView ? "bg-navy text-cream" : "bg-cream text-navy hover:bg-cream-dark"}`}
            onClick={() => setAfterView(true)}
            aria-pressed={afterView}
          >
            Après
          </button>
        </div>
      </div>
      <div className="border border-navy/10">
        <HexMap hexes={frame} nations={nations} highlightIds={highlightIds} />
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-navy/40">{label}</div>
    </div>
  );
}
