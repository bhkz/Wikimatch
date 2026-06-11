/**
 * FeedTicker (spec §13) : les derniers récits de conquête. Défilement
 * horizontal natif (scroll-snap) — tous les récits sont accessibles au doigt,
 * pas seulement le premier visible.
 */

import { Link } from "react-router-dom";
import { TextWithFlags } from "./FlagEmoji";
import type { Resolution } from "../lib/atlas";

type Props = {
  items: Resolution[];
};

export default function FeedTicker({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8 border-y border-navy/10 py-3 overflow-x-auto" data-testid="feed-ticker">
      <div className="flex gap-8 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest snap-x snap-mandatory w-max pr-8">
        {items.map((item) => (
          <Link key={item.match_id} to={`/m/${item.match_id}`} className="hover:text-blue-electric snap-start">
            <TextWithFlags text={item.narrative} />
          </Link>
        ))}
      </div>
    </div>
  );
}
