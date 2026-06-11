/**
 * /m/:id (spec §12) : un match = score réel + sa conséquence sur la carte.
 * P0 : avant/après via le récit de résolution + hexes pris en surbrillance.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import HexMap from "../components/HexMap";
import BeforeAfterMap from "../components/BeforeAfterMap";
import { STAGE_LABELS, isLive, kickoffLabel, nationStyles, useAtlasData } from "../lib/atlas";
import { FlagEmoji, TextWithFlags } from "../components/FlagEmoji";
import DramaGauge from "../components/DramaGauge";
import ShareBar from "../components/ShareBar";

type ProvisionalPreview = {
  assumed_score: { home: number; away: number };
  would_gain: number;
  hex_ids: number[];
  inherited_hex_ids: number[];
  narrative_preview: string;
};

export default function MatchPage() {
  const { id } = useParams();
  const { data, error } = useAtlasData({ withEvents: true });
  const [preview, setPreview] = useState<ProvisionalPreview | null>(null);
  const matchId = Number(id);

  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const match = data?.matches.find((m) => m.id === matchId);
  const resolution = data?.resolutions.find((r) => r.match_id === matchId);
  const stake = data?.stakes.find((s) => s.match_id === matchId);
  const highlight = useMemo(
    () =>
      new Set<number>([
        ...(resolution?.hexes_taken ?? []),
        ...(resolution?.inherited_hexes ?? []),
        ...(preview?.hex_ids ?? []),
        ...(preview?.inherited_hex_ids ?? []),
      ]),
    [resolution, preview],
  );
  const matchEvents = useMemo(
    () => (data?.events ?? []).filter((event) => event.match_id === matchId),
    [data, matchId],
  );
  const beforeHexes = useMemo(() => {
    if (!data || matchEvents.length === 0) return data?.hexes ?? [];
    const byHex = new Map(matchEvents.map((event) => [event.hex_id, event]));
    return data.hexes.map((hex) => {
      const event = byHex.get(hex.id);
      return event ? { ...hex, owner: event.from_owner, state: event.from_state } : hex;
    });
  }, [data, matchEvents]);
  const hexById = useMemo(() => new Map((data?.hexes ?? []).map((hex) => [hex.id, hex])), [data]);

  const home = match?.home ? styles.get(match.home) : null;
  const away = match?.away ? styles.get(match.away) : null;

  useEffect(() => {
    if (!match || resolution || match.home === null || match.away === null) {
      setPreview(null);
      return;
    }
    const currentMatch = match;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const response = await fetch(`/api/v1/matches/${currentMatch.id}/provisional?outcome=home`);
        if (!response.ok) throw new Error("preview unavailable");
        const payload = (await response.json()) as ProvisionalPreview;
        if (!cancelled) setPreview(payload);
      } catch {
        if (!cancelled) setPreview(null);
      }
      if (!cancelled && isLive(currentMatch)) timer = setTimeout(load, 60_000);
    }
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [match, resolution]);

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
                {" "}
                <span className="text-navy/30 mx-4">
                  {match.score_home !== null ? `${match.score_home}-${match.score_away}` : "VS"}
                </span>
                {" "}
                {away ? <><FlagEmoji flag={away.flag} /> {away.name}</> : "À déterminer"}
              </h1>
              {isLive(match) && (
                <span className="font-mono text-xs uppercase tracking-widest text-red-signal flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-signal animate-pulse" />
                  En cours
                </span>
              )}
              <ShareBar
                title={
                  resolution
                    ? resolution.narrative
                    : `${home?.name ?? "?"} – ${away?.name ?? "?"} sur l'Atlas du Mondial`
                }
              />
            </div>
            {match.duration === "PENALTY_SHOOTOUT" && match.pens_home !== null && (
              <p className="font-mono text-xs uppercase tracking-widest text-navy/60 -mt-6 mb-8">
                Tirs au but : {match.pens_home}-{match.pens_away}
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

            {/* Enjeux de qualification des deux camps (§12), tant que le match n'est pas joué. */}
            {!resolution && match.stage === "GROUP" && data.sim && match.home && match.away && (
              <section className="mb-10 max-w-3xl grid grid-cols-2 gap-px bg-navy/10 border border-navy/10">
                {[match.home, match.away].map((code) => {
                  const p = data.sim?.probs[code]?.p_qualify;
                  return (
                    <div key={code} className="bg-cream p-4">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mb-1">
                        {styles.get(code)?.name ?? code} · qualification
                      </div>
                      <div className="font-display text-3xl">{p !== undefined ? `${Math.round(p * 100)} %` : "—"}</div>
                      {p !== undefined && (
                        <div className="h-1 bg-navy/10 mt-2">
                          <div className="h-1 bg-blue-electric" style={{ width: `${Math.round(p * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
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
                      ? "Match nul : chaque équipe grappille en terre neutre"
                      : `${resolution.final_gain} territoire(s) pris${resolution.inherited_hexes.length ? ` · ${resolution.inherited_hexes.length} hérité(s)` : ""}`}
                  </div>
                </div>
              </section>
            ) : (
              <section className="mb-10 max-w-3xl">
                {preview ? (
                  <div className="border-t-4 border-blue-electric bg-cream-dark p-6">
                    <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-2">
                      Territoires en jeu
                    </div>
                    <p className="text-xl md:text-3xl font-light leading-relaxed">
                      <TextWithFlags text={preview.narrative_preview} />
                    </p>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 mt-4">
                      {isLive(match)
                        ? `Au score actuel (${preview.assumed_score.home}-${preview.assumed_score.away}) : ${preview.would_gain} territoire(s) · score il y a ~2 min`
                        : `Si ça finissait ${preview.assumed_score.home}-${preview.assumed_score.away} : ${preview.would_gain} territoire(s)`}
                    </div>
                  </div>
                ) : (
                  <p className="font-light text-navy/70">
                    {match.status === "FINISHED"
                      ? "Résolution en cours de confirmation (quelques minutes après le coup de sifflet final)."
                      : "La carte bougera à la fin du match : le vainqueur prendra des territoires au vaincu."}
                  </p>
                )}
              </section>
            )}

            {resolution && matchEvents.length > 0 ? (
              <BeforeAfterMap
                before={beforeHexes}
                after={data.hexes}
                nations={styles}
                highlightIds={highlight.size > 0 ? highlight : undefined}
              />
            ) : (
              <div className="border border-navy/10">
                <HexMap hexes={data.hexes} nations={styles} highlightIds={highlight.size > 0 ? highlight : undefined} />
              </div>
            )}

            {matchEvents.length > 0 && (
              <section className="mt-10 max-w-3xl">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">
                  Hexes transférés
                </h2>
                <ul className="divide-y divide-navy/10 border-y border-navy/10 font-mono text-xs uppercase tracking-widest">
                  {matchEvents.slice(0, 16).map((event) => {
                    const hex = hexById.get(event.hex_id);
                    return (
                      <li key={event.id} className="py-2 flex flex-wrap items-baseline justify-between gap-3">
                        <span>{hex?.cityName ?? `Hex ${event.hex_id}`}</span>
                        <span className="text-navy/45">
                          {event.from_owner ?? "neutre"} vers {event.to_owner ?? event.to_state}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
