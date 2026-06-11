/**
 * /n/:code (spec §12) : fiche nation — statut, territoire, matchs, récits.
 */

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import HexMap from "../components/HexMap";
import MatchChip from "../components/MatchChip";
import { nationStyles, useAtlasData } from "../lib/atlas";

export default function NationPage() {
  const { code } = useParams();
  const { data, error } = useAtlasData();
  const upper = (code ?? "").toUpperCase();

  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const nation = data?.nations.find((n) => n.code === upper);

  const territory = useMemo(
    () => (data ? data.hexes.filter((h) => h.owner === upper && h.state === "owned") : []),
    [data, upper],
  );
  const highlight = useMemo(() => new Set(territory.map((h) => h.id)), [territory]);
  const matches = useMemo(
    () => (data ? data.matches.filter((m) => m.home === upper || m.away === upper) : []),
    [data, upper],
  );
  const stories = useMemo(
    () =>
      (data?.resolutions ?? [])
        .filter((r) => r.winner === upper || r.loser === upper || matches.some((m) => m.id === r.match_id))
        .sort((a, b) => a.resolved_at.localeCompare(b.resolved_at)),
    [data, upper, matches],
  );

  const capital = territory.find((h) => h.isCapital);

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}
        {data && !nation && (
          <p className="font-light text-navy/70">
            Nation inconnue. <Link to="/" className="underline hover:text-blue-electric">Retour à la carte</Link>.
          </p>
        )}
        {data && nation && (
          <>
            <SectionLabel label={`Groupe ${nation.group_letter} · Rang FIFA ${nation.fifa_rank}`} />
            <div className="mt-4 mb-2 flex flex-wrap items-center gap-6">
              <h1 className="font-display text-5xl md:text-8xl uppercase leading-[0.9] tracking-wide">
                {nation.flag} {nation.name_fr}
              </h1>
              <span
                className="inline-block w-6 h-6 border border-navy/20"
                style={{ background: nation.color }}
                title="Couleur sur la carte"
              />
            </div>
            <div className="font-mono text-xs uppercase tracking-widest mb-10">
              {nation.status === "alive" && (
                <span className="text-blue-electric">
                  En lice · {territory.length} territoire{territory.length > 1 ? "s" : ""}
                  {capital ? ` · capitale ${capital.cityName}` : ""}
                </span>
              )}
              {nation.status === "eliminated" && (
                <span className="text-red-signal">
                  Éliminée — sa capitale est entrée au memorial
                  {nation.eliminated_by_match && (
                    <>
                      {" · "}
                      <Link to={`/m/${nation.eliminated_by_match}`} className="underline hover:text-navy">
                        le match fatal
                      </Link>
                    </>
                  )}
                </span>
              )}
              {nation.status === "champion" && <span className="text-blue-electric">CHAMPIONNE DU MONDE 🏆</span>}
            </div>

            <div className="border border-navy/10 mb-12">
              <HexMap hexes={data.hexes} nations={styles} highlightIds={highlight.size > 0 ? highlight : undefined} />
            </div>

            {territory.length > 0 && (
              <section className="mb-12">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Territoire</h2>
                <p className="font-light text-navy/70 max-w-3xl leading-relaxed">
                  {territory.map((h) => h.cityName).join(" · ")}
                </p>
              </section>
            )}

            {stories.length > 0 && (
              <section className="mb-12">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Son tournoi sur la carte</h2>
                <ul className="divide-y divide-navy/10 border-y border-navy/10">
                  {stories.map((r) => (
                    <li key={r.match_id}>
                      <Link to={`/m/${r.match_id}`} className="block py-3 px-2 font-light hover:bg-navy/5 transition-colors">
                        {r.narrative}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Matchs</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10">
                {matches.map((m) => (
                  <MatchChip key={m.id} match={m} styles={styles} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
