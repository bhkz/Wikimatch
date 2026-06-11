/**
 * /nuit et /nuit/:date (spec §8, §12) : "pendant que tu dormais", ce que les
 * matchs de la journée Atlas ont changé. P1.1 : dérivé en direct des
 * résolutions ; le recap éditorial généré (sections riches) arrive avec le
 * job recap du worker.
 */

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import HexMap from "../components/HexMap";
import { TextWithFlags } from "../components/FlagEmoji";
import { nationStyles, useAtlasData } from "../lib/atlas";

/** Journée Atlas `D` = du D 12:00 Paris au D+1 07:30 Paris (≈ UTC+2). */
function windowOf(date: string): { from: string; to: string } {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { from: `${date}T10:00:00Z`, to: `${next.toISOString().slice(0, 10)}T05:30:00Z` };
}

/** Journée Atlas courante : avant 07:30 on est encore "hier". */
function currentAtlasDate(): string {
  const now = new Date();
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  if (paris.getHours() * 60 + paris.getMinutes() < 7 * 60 + 30) paris.setDate(paris.getDate() - 1);
  return paris.toLocaleDateString("en-CA");
}

export default function Night() {
  const { date } = useParams();
  const { data, error } = useAtlasData();
  const atlasDate = date ?? currentAtlasDate();
  const { from, to } = windowOf(atlasDate);

  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);

  const nightResolutions = useMemo(
    () =>
      (data?.resolutions ?? [])
        .filter((r) => r.resolved_at >= from && r.resolved_at < to)
        .sort((a, b) => a.resolved_at.localeCompare(b.resolved_at)),
    [data, from, to],
  );
  const highlight = useMemo(
    () => new Set(nightResolutions.flatMap((r) => [...r.hexes_taken, ...r.inherited_hexes])),
    [nightResolutions],
  );

  const label = new Date(`${atlasDate}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Pendant que tu dormais" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-12">
          La nuit du {label}
        </h1>
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}
        {data && nightResolutions.length === 0 && (
          <p className="font-light text-navy/70 max-w-xl">
            La carte n'a pas (encore) bougé cette nuit-là.{" "}
            <Link to="/calendrier" className="underline hover:text-blue-electric">Voir le calendrier</Link>.
          </p>
        )}
        {data && nightResolutions.length > 0 && (
          <>
            <ul className="divide-y divide-navy/10 border-y border-navy/10 max-w-3xl mb-12">
              {nightResolutions.map((r) => (
                <li key={r.match_id}>
                  <Link to={`/m/${r.match_id}`} className="flex items-baseline justify-between gap-4 py-4 px-2 hover:bg-navy/5 transition-colors">
                    <span className="text-lg font-light"><TextWithFlags text={r.narrative} /></span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40 whitespace-nowrap">
                      {r.is_draw ? "nul" : `+${r.final_gain} hex`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">
              Les territoires qui ont changé de main
            </h2>
            <div className="border border-navy/10">
              <HexMap hexes={data.hexes} nations={styles} highlightIds={highlight} />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
