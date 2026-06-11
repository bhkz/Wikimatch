/**
 * /m/:id (spec §12) : un match = score réel + sa conséquence sur la carte.
 * P0 : avant/après via le récit de résolution + hexes pris en surbrillance.
 */

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import HexMap from "../components/HexMap";
import { STAGE_LABELS, isLive, kickoffLabel, nationStyles, useAtlasData } from "../lib/atlas";
import { FlagEmoji, TextWithFlags } from "../components/FlagEmoji";
import DramaGauge from "../components/DramaGauge";

export default function MatchPage() {
  const { id } = useParams();
  const { data, error } = useAtlasData();
  const matchId = Number(id);

  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const match = data?.matches.find((m) => m.id === matchId);
  const resolution = data?.resolutions.find((r) => r.match_id === matchId);
  const stake = data?.stakes.find((s) => s.match_id === matchId);
  const highlight = useMemo(
    () => new Set<number>([...(resolution?.hexes_taken ?? []), ...(resolution?.inherited_hexes ?? [])]),
    [resolution],
  );

  const home = match?.home ? styles.get(match.home) : null;
  const away = match?.away ? styles.get(match.away) : null;

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}
        {data && !match && (
          <p className="font-light text-navy/70">
            Match introuvable. <Link to="/calendrier" className="underline hover:text-blue-electric">Retour au calendrier</Link>.
          </p>
        )}
        {data && match && (
          <>
            <SectionLabel
              label={`${STAGE_LABELS[match.stage]}${match.group_letter ? ` · Groupe ${match.group_letter}` : ""} · ${kickoffLabel(match.kickoff_utc)}`}
            />
            <div className="mt-6 mb-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <h1 className="font-display text-4xl md:text-7xl uppercase leading-[0.9] tracking-wide">
                {home ? <><FlagEmoji flag={home.flag} /> {home.name}</> : "À déterminer"}
                <span className="text-navy/30 mx-4">
                  {match.score_home !== null ? `${match.score_home} – ${match.score_away}` : "VS"}
                </span>
                {away ? <><FlagEmoji flag={away.flag} /> {away.name}</> : "À déterminer"}
              </h1>
              {isLive(match) && (
                <span className="font-mono text-xs uppercase tracking-widest text-red-signal flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-signal animate-pulse" />
                  En cours
                </span>
              )}
            </div>
            {match.duration === "PENALTY_SHOOTOUT" && match.pens_home !== null && (
              <p className="font-mono text-xs uppercase tracking-widest text-navy/60 -mt-6 mb-8">
                Tirs au but : {match.pens_home}–{match.pens_away}
              </p>
            )}

            {stake && (
              <section className="mb-10 max-w-3xl border-y border-navy/10 py-5">
                <DramaGauge stake={stake} />
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-[10px] uppercase tracking-widest text-navy/50">
                  <span>Swing {Math.round(stake.components.swing * 100)}</span>
                  <span>Équilibre {Math.round(stake.components.close * 100)}</span>
                  <span>Élim. {Math.round(stake.components.elim * 100)}</span>
                  <span>Moment {Math.round(stake.components.stage * 100)}</span>
                  <span>Surprise {Math.round(stake.components.upset * 100)}</span>
                </div>
              </section>
            )}

            {resolution ? (
              <section className="mb-10">
                <div className="border-t-4 border-blue-electric bg-cream-dark p-6 max-w-3xl">
                  <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-2">
                    Conséquence sur la carte
                  </div>
                  <p className="text-xl md:text-3xl font-light leading-relaxed"><TextWithFlags text={resolution.narrative} /></p>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 mt-4">
                    {resolution.is_draw
                      ? "Match nul — chaque équipe grappille en terre neutre"
                      : `${resolution.final_gain} territoire(s) pris${resolution.inherited_hexes.length ? ` · ${resolution.inherited_hexes.length} hérité(s)` : ""}`}
                  </div>
                </div>
              </section>
            ) : (
              <p className="font-light text-navy/70 mb-10 max-w-2xl">
                {match.status === "FINISHED"
                  ? "Résolution en cours de confirmation (quelques minutes après le coup de sifflet final)."
                  : "La carte bougera à la fin du match : le vainqueur prendra des territoires au vaincu."}
              </p>
            )}

            <div className="border border-navy/10">
              <HexMap hexes={data.hexes} nations={styles} highlightIds={highlight.size > 0 ? highlight : undefined} />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
