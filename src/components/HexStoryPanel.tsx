/**
 * Mémoire des lieux (vision P2.B) : panneau latéral racontant la biographie
 * d'un hexagone — ouvert au clic sur la carte. Textes = templates fermés
 * (lib/hex-story), drapeaux rendus en Twemoji.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { hexStory } from "../../lib/hex-story";
import { TextWithFlags } from "./FlagEmoji";
import type { MapHex, NationStyle } from "./HexMap";
import type { HexEvent } from "../lib/atlas";

type Props = {
  hex: MapHex;
  events: HexEvent[];
  nations: ReadonlyMap<string, NationStyle>;
  onClose: () => void;
};

export default function HexStoryPanel({ hex, events, nations, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const story = hexStory(
    { cityName: hex.cityName, isCapital: hex.isCapital, originalOwner: hex.originalOwner ?? null },
    events.filter((e) => e.hex_id === hex.id),
    nations,
  );
  const ownerStyle = hex.owner ? nations.get(hex.owner) : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-navy/40" onClick={onClose} aria-hidden />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-cream text-navy border-l border-navy/10 overflow-y-auto"
        role="dialog"
        aria-label={`Histoire de ${hex.cityName}`}
      >
        <div className="sticky top-0 bg-cream border-b border-navy/10 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
              Mémoire des lieux{hex.isCapital && " · capitale"}
              {hex.state === "memorial" && " · memorial"}
              {hex.state === "ruins" && " · ruines"}
            </div>
            <h2 className="font-display text-3xl uppercase tracking-wide leading-none mt-1">{hex.cityName}</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-navy/50 hover:text-navy mt-1">
            <X size={20} />
          </button>
        </div>

        <ol className="px-6 py-6 space-y-5">
          {story.map((entry, i) => (
            <li key={i} className="grid grid-cols-[88px_1fr] gap-3 items-baseline">
              <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40 text-right">
                {entry.dateIso
                  ? new Date(entry.dateIso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                  : "11 juin"}
              </span>
              <span className="font-light leading-relaxed">
                <TextWithFlags text={entry.text} />
                {entry.matchId !== null && (
                  <>
                    {" "}
                    <Link
                      to={`/m/${entry.matchId}`}
                      className="font-mono text-[10px] uppercase tracking-widest text-blue-electric hover:underline whitespace-nowrap"
                    >
                      le match →
                    </Link>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>

        {ownerStyle && hex.owner && hex.state === "owned" && (
          <div className="px-6 pb-8">
            <Link
              to={`/n/${hex.owner}`}
              className="inline-block border border-navy px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-navy hover:text-cream transition-colors"
            >
              Le tournoi de {ownerStyle.name} →
            </Link>
          </div>
        )}
      </motion.aside>
    </>
  );
}
