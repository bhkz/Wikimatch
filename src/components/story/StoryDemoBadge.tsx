import { Link } from "react-router-dom";

export default function StoryDemoBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-red-signal text-white font-mono text-[10px] sm:text-xs font-medium tracking-wide uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      DÉMONSTRATION D’INTERFACE · CAS FICTIF · AUCUNE DONNÉE RÉELLE
    </div>
  );
}
