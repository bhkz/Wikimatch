export default function SectionLabel({ label }: { label: string }) {
  return (
    <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mb-2 border-b border-blue-electric/20 pb-2 w-fit">
      {label}
    </div>
  );
}
