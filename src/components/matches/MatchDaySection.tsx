import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { MatchDayGroup, TrackedMatchCard } from "../../types";
import UpcomingMatchCard from "./cards/UpcomingMatchCard";
import ObservingMatchCard from "./cards/ObservingMatchCard";
import PublishedMatchCard from "./cards/PublishedMatchCard";
import NoStoryMatchCard from "./cards/NoStoryMatchCard";

export default function MatchDaySection({ group }: { key?: any, group: MatchDayGroup }) {
  return (
    <section className="flex flex-col gap-6 relative">
      <div className="flex flex-col gap-1 border-b border-navy/10 pb-4 sticky top-[160px] z-20 bg-cream/90 backdrop-blur-sm py-4">
        <h3 className="font-display text-4xl text-navy uppercase tracking-wide">
          {group.dateLabel}
        </h3>
        <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy/50">
          {group.phaseLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {group.matches.map((match, i) => (
           <MatchCardRouter key={match.id} match={match} index={i} />
        ))}
      </div>
    </section>
  );
}

function MatchCardRouter({ match, index }: { key?: any, match: TrackedMatchCard, index: number }) {
  switch (match.status) {
    case "upcoming":
      return <UpcomingMatchCard match={match} index={index} />;
    case "observing":
      return <ObservingMatchCard match={match} index={index} />;
    case "completed_with_stories":
      return <PublishedMatchCard match={match} index={index} />;
    case "completed_without_story":
      return <NoStoryMatchCard match={match} index={index} />;
    default:
      return null;
  }
}
