import { MatchPageState } from "../../types";

export default function MatchDemoBadge({ text = "DÉMONSTRATION D’INTERFACE · SCÉNARIO FICTIF · AUCUNE DONNÉE RÉELLE" }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-red-signal text-white font-mono text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {text}
    </div>
  );
}
