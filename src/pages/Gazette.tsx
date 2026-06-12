/**
 * /gazette et /gazette/:date (vision P2.C) — la une de journal du matin,
 * composée depuis atlas.recaps (sections normées §8, générées à 07:30 par le
 * worker). DA print : manchette Bebas, colonnes, filets. 39 unes = collection.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import HexMap from "../components/HexMap";
import { FlagEmoji, TextWithFlags } from "../components/FlagEmoji";
import {
  fetchRecaps,
  kickoffLabel,
  nationStyles,
  useAtlasData,
  STAGE_LABELS,
  type Recap,
  type RecapSection,
} from "../lib/atlas";

const TOURNAMENT_START = "2026-06-11";

function editionNumber(date: string): number {
  return Math.round((Date.parse(date) - Date.parse(TOURNAMENT_START)) / 86_400_000) + 1;
}

function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function section<T extends RecapSection["type"]>(recap: Recap, type: T): RecapSection | undefined {
  return recap.sections.find((s) => s.type === type);
}

export default function Gazette() {
  const { date } = useParams();
  const { data, error } = useAtlasData();
  const [recaps, setRecaps] = useState<Recap[] | null>(null);
  const [recapsError, setRecapsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecaps()
      .then((rows) => !cancelled && setRecaps(rows))
      .catch((err) => !cancelled && setRecapsError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const recap = useMemo(() => {
    if (!recaps || recaps.length === 0) return null;
    return date ? recaps.find((r) => r.date === date) ?? null : recaps[0];
  }, [recaps, date]);

  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);

  // La carte « au matin » : frame du snapshot du même jour Atlas.
  const morningHexes = useMemo(() => {
    if (!data || !recap) return null;
    const snapshot = data.snapshots.find((s) => s.date === recap.date);
    if (!snapshot) return null;
    const frame = new Map(snapshot.frame.map((h) => [h.id, h]));
    return data.hexes.map((hex) => {
      const h = frame.get(hex.id);
      return h ? { ...hex, owner: h.owner, state: h.state } : hex;
    });
  }, [data, recap]);

  const summary = recap ? section(recap, "summary") : undefined;
  const major = recap ? section(recap, "major_event") : undefined;
  const surprise = recap ? section(recap, "surprise") : undefined;
  const movements = recap ? section(recap, "movements") : undefined;
  const swing = recap ? section(recap, "qualif_swing") : undefined;
  const tonight = recap ? section(recap, "tonight") : undefined;

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pt-24 pb-24">
        {/* Manchette du journal */}
        <header className="border-b-4 border-navy pb-6 mb-2 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50 flex justify-between">
            <span>Mondial 2026 · carte vivante</span>
            {recap && <span>N° {editionNumber(recap.date)}</span>}
          </div>
          <h1 className="font-display text-5xl md:text-8xl uppercase tracking-wide leading-none mt-3">
            La Gazette de l'Atlas
          </h1>
          <div className="font-mono text-xs uppercase tracking-widest text-navy/60 mt-3">
            {recap ? longDate(recap.date) : "Édition du matin · 7h30"}
          </div>
        </header>
        <div className="border-b border-navy/20 mb-10" />

        {(error || recapsError) && (
          <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error ?? recapsError}</div>
        )}
        {!recaps && !recapsError && <p className="font-light text-navy/70 text-center">Impression en cours…</p>}

        {recaps && !recap && (
          <p className="font-light text-navy/70 text-center max-w-xl mx-auto">
            {date
              ? `Pas d'édition pour le ${date}.`
              : "La première édition paraîtra demain à 7h30, après la première nuit de matchs."}{" "}
            <Link to="/nuit" className="underline hover:text-blue-electric">Voir la nuit en direct →</Link>
          </p>
        )}

        {recap && (
          <>
            {/* Manchette : le fait majeur en très gros */}
            {major?.text && (
              <section className="text-center mb-10">
                <div className="font-mono text-[10px] uppercase tracking-widest text-blue-electric mb-3">
                  {summary?.title ?? "Cette nuit"}
                </div>
                <h2 className="font-display text-3xl md:text-6xl uppercase leading-[0.95] tracking-wide max-w-4xl mx-auto">
                  <TextWithFlags text={major.text} />
                </h2>
                {major.match_id !== undefined && (
                  <Link
                    to={`/m/${major.match_id}`}
                    className="inline-block mt-4 font-mono text-[10px] uppercase tracking-widest text-blue-electric hover:underline"
                  >
                    Lire le match →
                  </Link>
                )}
              </section>
            )}

            {/* La carte au matin */}
            {morningHexes && (
              <section className="mb-10 border border-navy/10">
                <HexMap hexes={morningHexes} nations={styles} />
                <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 px-3 py-2 border-t border-navy/10">
                  Le monde au matin du {longDate(recap.date)} ·{" "}
                  <Link to={`/nuit/${recap.date}`} className="text-blue-electric hover:underline">
                    revivre la nuit →
                  </Link>
                </div>
              </section>
            )}

            {/* Colonnes : surprise / basculement / mouvements */}
            <section className="grid md:grid-cols-3 gap-px bg-navy/20 border-y-2 border-navy mb-10">
              <article className="bg-cream p-5">
                <h3 className="font-display text-2xl uppercase tracking-wide border-b border-navy/20 pb-2 mb-3">
                  La surprise
                </h3>
                <p className="font-light leading-relaxed">
                  {surprise?.text ? <TextWithFlags text={surprise.text} /> : "Aucun exploit à signaler — la hiérarchie a tenu."}
                </p>
                {surprise?.match_id !== undefined && (
                  <Link to={`/m/${surprise.match_id}`} className="font-mono text-[10px] uppercase tracking-widest text-blue-electric hover:underline">
                    Le match →
                  </Link>
                )}
              </article>
              <article className="bg-cream p-5">
                <h3 className="font-display text-2xl uppercase tracking-wide border-b border-navy/20 pb-2 mb-3">
                  Le basculement
                </h3>
                <p className="font-light leading-relaxed">
                  {swing?.text ? <TextWithFlags text={swing.text} /> : "Les probabilités de qualification n'ont pas bougé d'un point."}
                </p>
                {swing?.nation && (
                  <Link to={`/n/${swing.nation}`} className="font-mono text-[10px] uppercase tracking-widest text-blue-electric hover:underline">
                    Sa fiche →
                  </Link>
                )}
              </article>
              <article className="bg-cream p-5">
                <h3 className="font-display text-2xl uppercase tracking-wide border-b border-navy/20 pb-2 mb-3">
                  Mouvements
                </h3>
                {movements && ((movements.gains?.length ?? 0) > 0 || (movements.losses?.length ?? 0) > 0) ? (
                  <table className="w-full font-mono text-xs">
                    <tbody>
                      {[...(movements.gains ?? []), ...(movements.losses ?? [])].map((m) => {
                        const s = styles.get(m.code);
                        return (
                          <tr key={m.code} className="border-b border-navy/10 last:border-b-0">
                            <td className="py-1.5">
                              <Link to={`/n/${m.code}`} className="inline-flex items-center gap-2 hover:text-blue-electric">
                                {s && <FlagEmoji flag={s.flag} />} {s?.name ?? m.code}
                              </Link>
                            </td>
                            <td className={`text-right tabular-nums ${m.delta > 0 ? "text-blue-electric" : "text-red-signal"}`}>
                              {m.delta > 0 ? `+${m.delta}` : m.delta} hex
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="font-light leading-relaxed">Les frontières n'ont pas bougé.</p>
                )}
              </article>
            </section>

            {/* Ce soir */}
            {tonight?.matches && tonight.matches.length > 0 && (
              <section className="mb-10">
                <h3 className="font-display text-3xl uppercase tracking-wide border-b-2 border-navy pb-2 mb-4">
                  Ce soir à la une
                </h3>
                <ul className="divide-y divide-navy/10">
                  {tonight.matches.map((m) => {
                    const home = m.home ? styles.get(m.home) : null;
                    const away = m.away ? styles.get(m.away) : null;
                    return (
                      <li key={m.id}>
                        <Link to={`/m/${m.id}`} className="flex items-center gap-4 py-3 px-2 hover:bg-navy/5 transition-colors">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40 w-14">
                            {kickoffLabel(m.kickoff_utc)}
                          </span>
                          <span className="flex-1 inline-flex items-center gap-2 font-light">
                            {home && <FlagEmoji flag={home.flag} />} {home?.name ?? m.home ?? "?"}
                            <span className="text-navy/40">vs</span>
                            {away && <FlagEmoji flag={away.flag} />} {away?.name ?? m.away ?? "?"}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
                            {m.stage === "GROUP" ? `Gr. ${m.group_letter}` : STAGE_LABELS[m.stage]}
                          </span>
                          {m.drama !== null && (
                            <span
                              className={`font-mono text-[10px] uppercase tracking-widest font-bold ${
                                m.drama >= 60 ? "text-red-signal" : m.drama >= 35 ? "text-blue-electric" : "text-navy/40"
                              }`}
                              title="Drama-mètre"
                            >
                              ⚡ {m.drama}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}

        {/* Archives : la collection des unes */}
        {recaps && recaps.length > 0 && (
          <footer className="border-t-2 border-navy pt-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mr-4">Anciens numéros :</span>
            {recaps.map((r) => (
              <Link
                key={r.date}
                to={`/gazette/${r.date}`}
                className={`font-mono text-[10px] uppercase tracking-widest mr-3 hover:text-blue-electric ${
                  recap?.date === r.date ? "text-blue-electric underline" : "text-navy/60"
                }`}
              >
                N°{editionNumber(r.date)}
              </Link>
            ))}
          </footer>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
