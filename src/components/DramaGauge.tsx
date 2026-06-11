import type { MatchStake } from "../lib/atlas";

type Props = {
  stake: MatchStake | null | undefined;
  compact?: boolean;
};

export function dramaLabel(score: number): string {
  if (score >= 90) return "immanquable";
  if (score >= 70) return "chaud";
  if (score >= 40) return "à suivre";
  return "tranquille";
}

export default function DramaGauge({ stake, compact }: Props) {
  if (!stake) {
    return compact ? null : (
      <div className="font-mono text-[10px] uppercase tracking-widest text-navy/35">
        Drama bientôt calculé
      </div>
    );
  }

  const score = Math.max(0, Math.min(100, Math.round(stake.drama)));
  const label = dramaLabel(score);

  return (
    <div className={compact ? "mt-3" : "max-w-sm"}>
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase font-bold tracking-widest">
        <span className={score >= 70 ? "text-red-signal" : "text-blue-electric"}>Drama {score}</span>
        <span className="text-navy/45">{label}</span>
      </div>
      <div className="mt-1 h-1.5 w-full bg-navy/10" aria-hidden="true">
        <div
          className={score >= 70 ? "h-full bg-red-signal" : "h-full bg-blue-electric"}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
