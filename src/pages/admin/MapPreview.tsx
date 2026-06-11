/**
 * /admin/map-preview : audit visuel OBLIGATOIRE de la carte de départ
 * (spec §20 P0.1). Lit les seeds versionnés (pas la DB) : ce qu'on voit ici
 * est exactement ce qui a été seedé.
 */

import { useMemo } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import SectionLabel from "../../components/SectionLabel";
import HexMap, { type MapHex, type NationStyle } from "../../components/HexMap";
import { FlagEmoji } from "../../components/FlagEmoji";
import mapGenerated from "../../../data/map-generated.json";
import nationsSeed from "../../../data/nations-seed.json";

type GeneratedHex = {
  id: number; q: number; r: number; city_name: string;
  is_capital: boolean; original_owner: string | null;
};
type NationSeed = {
  fifa: string; name_fr: string; flag: string; group: string; color: string;
};

export default function MapPreview() {
  const nations = useMemo(() => {
    const m = new Map<string, NationStyle>();
    for (const n of nationsSeed as NationSeed[]) {
      m.set(n.fifa, { color: n.color, name: n.name_fr, flag: n.flag });
    }
    return m;
  }, []);

  const hexes = useMemo<MapHex[]>(
    () =>
      (mapGenerated as GeneratedHex[]).map((h) => ({
        id: h.id,
        q: h.q,
        r: h.r,
        cityName: h.city_name,
        isCapital: h.is_capital,
        owner: h.original_owner,
        state: h.original_owner === null ? ("neutral" as const) : ("owned" as const),
      })),
    [],
  );

  const stats = useMemo(() => {
    const perNation = new Map<string, number>();
    let neutral = 0;
    for (const h of hexes) {
      if (h.owner === null) neutral++;
      else perNation.set(h.owner, (perNation.get(h.owner) ?? 0) + 1);
    }
    const badCounts = [...perNation].filter(([, n]) => n !== 10);
    return { total: hexes.length, neutral, badCounts };
  }, [hexes]);

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Admin · Audit de la carte de départ" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-8">
          Aperçu de la carte
        </h1>

        <div className="font-mono text-xs tracking-widest uppercase mb-6 flex flex-wrap gap-x-8 gap-y-2">
          <span>{stats.total} hexes</span>
          <span>480 nationaux attendus · {stats.total - stats.neutral} constatés</span>
          <span>{stats.neutral} neutres</span>
          <span className={stats.badCounts.length ? "text-red-signal" : ""}>
            {stats.badCounts.length === 0
              ? "✓ 10 hexes pour chacune des 48 nations"
              : `✗ écarts : ${stats.badCounts.map(([c, n]) => `${c}=${n}`).join(", ")}`}
          </span>
        </div>

        <div className="border border-navy/10">
          <HexMap hexes={hexes} nations={nations} />
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-3">
          {[...nations.entries()].map(([code, n]) => (
            <div key={code} className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
              <span className="inline-block w-3 h-3 border border-navy/20" style={{ background: n.color }} />
              <span className="inline-flex items-center gap-1.5"><FlagEmoji flag={n.flag} /> {code}</span>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm font-light text-navy/70 max-w-2xl leading-relaxed">
          Contrôles : silhouette reconnaissable, capitales bien placées, exclaves
          acceptables (zones denses), lisibilité des couleurs voisines. Tout
          ajustement se fait dans <span className="font-mono">scripts/build-map-seed.ts</span> ou{" "}
          <span className="font-mono">data/nations-static.json</span>, puis régénération + re-seed.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
