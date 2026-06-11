/**
 * Carte compacte d'un match (bandeau du jour, calendrier), DA brutale,
 * angles vifs, mono labels.
 */

import { Link } from "react-router-dom";
import type { Match, MatchStake } from "../lib/atlas";
import { STAGE_LABELS, isLive, kickoffTime } from "../lib/atlas";
import type { NationStyle } from "./HexMap";
import { FlagEmoji } from "./FlagEmoji";
import DramaGauge from "./DramaGauge";

type Props = { match: Match; styles: ReadonlyMap<string, NationStyle>; stake?: MatchStake | null };

function TeamLabel({ code, styles }: { code: string | null; styles: Props["styles"] }) {
  if (!code) return <span className="text-navy/40">À déterminer</span>;
  const s = styles.get(code);
  return (
    <span className="inline-flex items-center gap-2">
      {s && <FlagEmoji flag={s.flag} />}
      <span className="font-medium">{s?.name ?? code}</span>
    </span>
  );
}

export default function MatchChip({ match, styles, stake }: Props) {
  const live = isLive(match);
  const finished = match.status === "FINISHED";

  return (
    <Link to={`/m/${match.id}`} className="block bg-cream hover:bg-cream-dark transition-colors p-4 group">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest mb-3">
        <span className="text-navy/50">
          {STAGE_LABELS[match.stage]}
          {match.group_letter ? ` · Gr. ${match.group_letter}` : ""}
        </span>
        {live ? (
          <span className="text-red-signal flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-signal animate-pulse" />
            En cours
          </span>
        ) : (
          <span className="text-navy/50">{finished ? "Terminé" : kickoffTime(match.kickoff_utc)}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1 text-sm">
          <TeamLabel code={match.home} styles={styles} />
          <TeamLabel code={match.away} styles={styles} />
        </div>
        <div className="font-display text-3xl tracking-wide text-right leading-none">
          {match.score_home !== null && match.score_away !== null ? (
            <>
              <div>{match.score_home}</div>
              <div>{match.score_away}</div>
            </>
          ) : (
            <div className="text-navy/20 group-hover:text-blue-electric transition-colors">VS</div>
          )}
        </div>
      </div>
      {match.duration === "PENALTY_SHOOTOUT" && match.pens_home !== null && (
        <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mt-2">
          TAB {match.pens_home}–{match.pens_away}
        </div>
      )}
      <DramaGauge stake={stake} compact />
    </Link>
  );
}
