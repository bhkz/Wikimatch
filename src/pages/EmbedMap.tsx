/**
 * /embed/map (spec §11.4) : la carte seule, sans chrome, intégrable en iframe.
 * postMessage de hauteur pour l'auto-resize côté hôte + lien discret vers
 * l'Atlas — le widget est un canal de distribution.
 */

import { useEffect, useMemo, useRef } from "react";
import HexMap from "../components/HexMap";
import { nationStyles, useAtlasData } from "../lib/atlas";

export default function EmbedMap() {
  const { data, error } = useAtlasData();
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const rootRef = useRef<HTMLElement>(null);

  // Auto-resize de l'iframe hôte : { type: "atlas:height", height } à chaque variation.
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const el = rootRef.current;
    if (!el) return;
    const post = () =>
      window.parent.postMessage({ type: "atlas:height", height: el.scrollHeight }, "*");
    post();
    const observer = new ResizeObserver(post);
    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  return (
    <main ref={rootRef} className="relative min-h-screen bg-navy text-cream">
      {error && (
        <div className="absolute left-3 top-3 z-10 bg-red-signal px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
          Données indisponibles
        </div>
      )}
      {data ? (
        <>
          <HexMap
            hexes={data.hexes}
            nations={styles}
            onHexClick={(hex) => {
              if (hex.state === "owned" && hex.owner) {
                window.open(`${window.location.origin}/n/${hex.owner}`, "_blank", "noopener");
              }
            }}
          />
          <a
            href={typeof window !== "undefined" ? window.location.origin : "/"}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-2 bottom-2 z-10 bg-navy/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cream/70 hover:text-cream border border-cream/15"
          >
            Ouvrir l'Atlas du Mondial ↗
          </a>
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-cream/50">
          Chargement
        </div>
      )}
    </main>
  );
}
