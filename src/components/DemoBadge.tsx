type DemoBadgeProps = {
  text?: string;
  label?: string;
};

export default function DemoBadge({ text, label }: DemoBadgeProps = {}) {
  const display = text ?? label ?? "DÉMONSTRATION D’INTERFACE · CAS FICTIF";
  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-signal text-white font-mono text-[10px] sm:text-xs font-medium tracking-wide uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {display}
    </div>
  );
}
