import { Link } from "react-router-dom";
import { PublicSearchResult } from "../../mockSearchData";

export default function SearchResultCard({
  item,
}: {
  item: PublicSearchResult;
}) {
  const handleNotBuilt = (e: React.MouseEvent) => {
    if (!item.available) {
      e.preventDefault();
      alert(
        "Cette page détail n’est pas construite dans la démonstration frontend.",
      );
    }
  };

  const getCardStyle = () => {
    switch (item.type) {
      case "story":
        return "bg-navy border-white/20";
      case "match":
        return "bg-black/20 border-white/10";
      case "entity":
        return "bg-gradient-to-br from-navy to-[#111] border-white/10";
      case "public_trace":
        return "bg-transparent border-dashed border-white/20";
      case "methodology":
        return "bg-cream text-navy border-transparent";
      default:
        return "bg-navy border-white/10";
    }
  };

  return (
    <div
      className={`border p-6 flex flex-col gap-4 relative overflow-hidden group ${getCardStyle()}`}
    >
      {/* Top Metadata */}
      <div className="flex flex-wrap gap-2 items-center">
        <div
          className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-1 ${item.type === "methodology" ? "bg-navy/5 text-navy" : "bg-white/10 text-white"}`}
        >
          {item.metadataLabel}
        </div>
        {item.languages && (
          <div className="flex gap-1">
            {item.languages.map((l) => (
              <span
                key={l}
                className={`font-mono text-[9px] px-1.5 py-1 ${item.type === "methodology" ? "bg-navy/5 text-navy/70" : "bg-white/5 text-white/50"}`}
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-2 mt-2">
        {item.matchLabel && item.type !== "match" && (
          <div
            className={`font-mono text-[10px] uppercase tracking-widest ${item.type === "methodology" ? "text-navy/50" : "text-blue-electric"}`}
          >
            {item.matchLabel}
          </div>
        )}
        <h3
          className={`font-display text-2xl md:text-3xl uppercase leading-tight ${item.type === "methodology" ? "text-navy" : "text-white"}`}
        >
          {item.title}
        </h3>
        <p
          className={`font-sans text-sm md:text-base leading-relaxed font-light ${item.type === "methodology" ? "text-navy/80" : "text-white/70"}`}
        >
          {item.excerpt}
        </p>
      </div>

      {/* Context Links / Associated info */}
      {(item.entityLabel || item.matchLabel) && (
        <div
          className={`mt-4 pt-4 border-t flex flex-col gap-1 text-xs ${item.type === "methodology" ? "border-navy/10 text-navy/60" : "border-white/10 text-white/40"}`}
        >
          {item.entityLabel && <span>Relié au sujet : {item.entityLabel}</span>}
          {item.matchLabel && item.type === "match" && (
            <span>Rencontre associée : {item.matchLabel}</span>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 pt-2">
        <Link
          to={item.route || "#"}
          onClick={handleNotBuilt}
          className={`font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors w-fit p-3 border ${
            item.type === "methodology"
              ? "bg-navy text-white hover:bg-blue-electric border-transparent"
              : "border-white/20 text-white hover:bg-white/10"
          }`}
        >
          {item.type === "story" && "Lire l’histoire"}
          {item.type === "match" && "Ouvrir le dossier match"}
          {item.type === "entity" && "Ouvrir le dossier joueur"}
          {item.type === "public_trace" && "Inspecter dans l'Observatoire"}
          {item.type === "methodology" && "Lire la méthode"}
          {![
            "story",
            "match",
            "entity",
            "public_trace",
            "methodology",
          ].includes(item.type) && "Voir les détails"}
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
