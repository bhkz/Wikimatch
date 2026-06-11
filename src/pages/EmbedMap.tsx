import { useMemo } from "react";
import HexMap from "../components/HexMap";
import { nationStyles, useAtlasData } from "../lib/atlas";

export default function EmbedMap() {
  const { data, error } = useAtlasData();
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);

  return (
    <main className="min-h-screen bg-navy text-cream">
      {error && (
        <div className="absolute left-3 top-3 z-10 bg-red-signal px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
          Données indisponibles
        </div>
      )}
      {data ? (
        <HexMap hexes={data.hexes} nations={styles} />
      ) : (
        <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest text-cream/50">
          Chargement
        </div>
      )}
    </main>
  );
}
