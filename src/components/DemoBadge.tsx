import { isLiveMode } from "../data";

type DemoBadgeProps = {
  text?: string;
  label?: string;
};

/**
 * Badge "DÉMONSTRATION" — n'est rendu que si VITE_DATA_MODE n'est pas "live".
 * En mode live, ce badge n'a aucun sens : les données viennent de la DB et
 * ne sont pas des fixtures. On renvoie donc null pour que l'UI soit
 * automatiquement nettoyée de ses marqueurs démo.
 */
export default function DemoBadge({ text, label }: DemoBadgeProps = {}) {
  if (isLiveMode) return null;
  const display = text ?? label ?? "DÉMONSTRATION D’INTERFACE · CAS FICTIF";
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-signal text-white font-mono text-[10px] sm:text-xs font-medium tracking-wide uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {display}
    </div>
  );
}
