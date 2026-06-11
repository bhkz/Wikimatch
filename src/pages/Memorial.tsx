/**
 * /memorial (spec §12) : les nations tombées, leur capitale sanctuarisée,
 * le match fatal. Sobre et solennel — c'est le cimetière du jeu.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import { FlagEmoji } from "../components/FlagEmoji";
import { useAtlasData } from "../lib/atlas";

export default function Memorial() {
  const { data, error } = useAtlasData();

  const fallen = useMemo(
    () =>
      (data?.nations ?? [])
        .filter((n) => n.status === "eliminated")
        .map((n) => {
          const match = data?.matches.find((m) => m.id === n.eliminated_by_match);
          const capital = data?.hexes.find((h) => h.isCapital && h.state === "memorial" && h.owner === null);
          return { nation: n, match, capital };
        }),
    [data],
  );

  return (
    <div className="min-h-screen bg-navy text-cream flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Les capitales sanctuarisées" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-4 text-cream">
          Memorial
        </h1>
        <p className="font-light text-cream/60 max-w-xl leading-relaxed mb-12">
          Quand une nation quitte le tournoi, sa capitale devient un memorial doré —
          intouchable à jamais, même par le champion du monde.
        </p>
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-cream/60">Chargement…</p>}
        {data && fallen.length === 0 && (
          <p className="font-light text-cream/60">
            Personne n'est encore tombé. Les 48 nations sont en vie — la phase à
            élimination directe commence le 28 juin.
          </p>
        )}
        {fallen.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-cream/10 border border-cream/10">
            {fallen.map(({ nation, match }) => (
              <div key={nation.code} className="bg-navy p-8">
                <div className="font-display text-3xl uppercase tracking-wide flex items-center gap-3">
                  <FlagEmoji flag={nation.flag} /> {nation.name_fr}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#C9A227] mt-3">
                  ◉ Capitale au memorial
                </div>
                {match && (
                  <Link
                    to={`/m/${match.id}`}
                    className="font-mono text-[10px] uppercase tracking-widest text-cream/50 hover:text-cream mt-2 inline-block"
                  >
                    Le match fatal →
                  </Link>
                )}
                <div className="mt-4">
                  <Link to={`/n/${nation.code}`} className="font-mono text-[10px] uppercase tracking-widest text-cream/50 hover:text-cream">
                    Son tournoi sur la carte →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
