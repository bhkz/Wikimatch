import { MatchPageState } from "../../types";

type Props = {
  activeState: MatchPageState;
  onChange: (s: MatchPageState) => void;
};

export default function DemoStateSwitcher({ activeState, onChange }: Props) {
  return (
    <div className="fixed top-[72px] z-40 left-0 right-0 bg-navy/95 backdrop-blur border-b border-white/10 p-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-cream shadow-xl">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50 font-bold hidden md:inline">
          PROTOTYPE FRONTEND · AFFICHER L’ÉTAT DU MATCH
        </span>
        <div className="flex bg-navy p-1 rounded border border-white/5">
          <button
            onClick={() => onChange("pre_match")}
            className={`font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-colors ${
              activeState === "pre_match" ? "bg-cream text-navy" : "text-cream/50 hover:text-cream"
            }`}
          >
            Avant
          </button>
          <button
            onClick={() => onChange("live")}
            className={`font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${
              activeState === "live" ? "bg-red-signal text-white" : "text-cream/50 hover:text-cream"
            }`}
          >
            {activeState === "live" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            En direct
          </button>
          <button
            onClick={() => onChange("post_match")}
            className={`font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-colors ${
              activeState === "post_match" ? "bg-cream text-navy" : "text-cream/50 hover:text-cream"
            }`}
          >
            Après
          </button>
        </div>
      </div>
    </div>
  );
}
