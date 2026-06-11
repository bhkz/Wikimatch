import { Link } from "react-router-dom";
import { TextWithFlags } from "./FlagEmoji";
import type { Resolution } from "../lib/atlas";

type Props = {
  items: Resolution[];
};

export default function FeedTicker({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8 border-y border-navy/10 py-3 overflow-hidden">
      <div className="flex gap-8 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest">
        {items.map((item) => (
          <Link key={item.match_id} to={`/m/${item.match_id}`} className="hover:text-blue-electric">
            <TextWithFlags text={item.narrative} />
          </Link>
        ))}
      </div>
    </div>
  );
}
