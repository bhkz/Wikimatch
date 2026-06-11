/**
 * /nuit et /nuit/:date (spec §8, §12) : le Recap de la Nuit publié par le
 * worker (table recaps, sections dans l'ordre normatif §8), carte avant/après
 * via les snapshots quotidiens. Repli : vue dérivée en direct des résolutions
 * tant que le recap du matin n'est pas publié.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import HexMap, { type MapHex } from "../components/HexMap";
import BeforeAfterMap from "../components/BeforeAfterMap";
import MatchChip from "../components/MatchChip";
import ShareBar from "../components/ShareBar";
import { TextWithFlags } from "../components/FlagEmoji";
import { atlas } from "../lib/supabase";
import { nationStyles, useAtlasData } from "../lib/atlas";

type RecapSection = {
  type: "summary" | "major_event" | "surprise" | "movements" | "qualif_swing" | "tonight";
  title: string;
  text?: string;
  match_id?: number;
  resolution_count?: number;
  gains?: Array<{ code: string; delta: number }>;
  losses?: Array<{ code: string; delta: number }>;
  matches?: Array<{ id: number; drama: number | null }>;
};

type RecapRow = { date: string; sections: RecapSection[]; published_at: string | null };

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

function previousDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function Night() {
  const { date } = useParams();
  const { data, error } = useAtlasData();
  const atlasDate = date ?? currentAtlasDate();
  const { from, to } = windowOf(atlasDate);
  const [recap, setRecap] = useState<RecapRow | null>(null);
  const [recapLoaded, setRecapLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRecapLoaded(false);
    atlas
      .from("recaps")
      .select("date, sections, published_at")
      .eq("date", atlasDate)
      .maybeSingle()
      .then(({ data: row }) => {
        if (cancelled) return;
        setRecap((row as RecapRow | null) ?? null);
        setRecapLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [atlasDate]);

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

  // Avant/après : frames des snapshots D-1 (début de journée) et D (fin).
  const frames = useMemo(() => {
    if (!data) return null;
    const byDate = new Map(data.snapshots.map((s) => [s.date, s.frame]));
    const before = byDate.get(previousDate(atlasDate));
    const after = byDate.get(atlasDate);
    if (!before || !after) return null;
    const apply = (frame: Array<{ id: number; owner: string | null; state: MapHex["state"] }>) => {
      const byId = new Map(frame.map((h) => [h.id, h]));
      return data.hexes.map((hex) => {
        const f = byId.get(hex.id);
        return f ? { ...hex, owner: f.owner, state: f.state } : hex;
      });
    };
    return { before: apply(before), after: apply(after) };
  }, [data, atlasDate]);

  const sections = recap?.sections ?? [];
  const tonightMatches = useMemo(() => {
    const section = sections.find((s) => s.type === "tonight");
    if (!section?.matches || !data) return [];
    const byId = new Map(data.matches.map((m) => [m.id, m]));
    return section.matches.map((m) => byId.get(m.id)).filter((m) => m !== undefined);
  }, [sections, data]);

  const label = new Date(`${atlasDate}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const summary = sections.find((s) => s.type === "summary");
  const major = sections.find((s) => s.type === "major_event");
  const surprise = sections.find((s) => s.type === "surprise");
  const movements = sections.find((s) => s.type === "movements");
  const swing = sections.find((s) => s.type === "qualif_swing");
  const nationName = (code: string) => styles.get(code)?.name ?? code;

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Pendant que tu dormais" />
        <div className="mt-4 mb-12 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide">
            La nuit du {label}
          </h1>
          <ShareBar title={`L'Atlas du Mondial — la nuit du ${label}`} />
        </div>
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {(!data || !recapLoaded) && <p className="font-light text-navy/70">Chargement…</p>}

        {/* ----- Recap publié (sections §8 dans l'ordre) ----- */}
        {data && recapLoaded && recap && (
          <>
            {summary && (
              <p className="font-light text-xl md:text-2xl text-navy/80 max-w-2xl mb-10">{summary.text}</p>
            )}

            {frames && (
              <section className="mb-12">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Avant / après</h2>
                <BeforeAfterMap before={frames.before} after={frames.after} nations={styles} highlightIds={highlight.size > 0 ? highlight : undefined} />
              </section>
            )}

            {major?.match_id !== undefined && (
              <section className="mb-10 max-w-3xl">
                <div className="border-t-4 border-blue-electric bg-cream-dark p-6">
                  <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-2">
                    {major.title}
                  </div>
                  <Link to={`/m/${major.match_id}`} className="text-xl md:text-3xl font-light leading-relaxed hover:text-blue-electric transition-colors">
                    <TextWithFlags text={major.text ?? ""} />
                  </Link>
                </div>
              </section>
            )}

            {surprise && (
              <section className="mb-10 max-w-3xl">
                <div className="border-t-4 border-green-acid bg-cream-dark p-6">
                  <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-2">
                    {surprise.title}
                  </div>
                  {surprise.match_id !== undefined ? (
                    <Link to={`/m/${surprise.match_id}`} className="text-xl md:text-2xl font-light leading-relaxed hover:text-blue-electric transition-colors">
                      <TextWithFlags text={surprise.text ?? ""} />
                    </Link>
                  ) : (
                    <p className="text-xl md:text-2xl font-light leading-relaxed"><TextWithFlags text={surprise.text ?? ""} /></p>
                  )}
                </div>
              </section>
            )}

            {movements && ((movements.gains?.length ?? 0) > 0 || (movements.losses?.length ?? 0) > 0) && (
              <section className="mb-10 max-w-3xl">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">{movements.title}</h2>
                <div className="grid md:grid-cols-2 gap-px bg-navy/10 border border-navy/10">
                  <ul className="bg-cream p-5 font-mono text-xs uppercase tracking-widest space-y-2">
                    {(movements.gains ?? []).map((g) => (
                      <li key={g.code} className="flex justify-between gap-4">
                        <Link to={`/n/${g.code}`} className="hover:text-blue-electric">{nationName(g.code)}</Link>
                        <span className="text-blue-electric">+{g.delta}</span>
                      </li>
                    ))}
                    {(movements.gains ?? []).length === 0 && <li className="text-navy/40">Aucun gain</li>}
                  </ul>
                  <ul className="bg-cream p-5 font-mono text-xs uppercase tracking-widest space-y-2">
                    {(movements.losses ?? []).map((l) => (
                      <li key={l.code} className="flex justify-between gap-4">
                        <Link to={`/n/${l.code}`} className="hover:text-blue-electric">{nationName(l.code)}</Link>
                        <span className="text-red-signal">{l.delta}</span>
                      </li>
                    ))}
                    {(movements.losses ?? []).length === 0 && <li className="text-navy/40">Aucune perte</li>}
                  </ul>
                </div>
              </section>
            )}

            {swing && (
              <section className="mb-10 max-w-3xl">
                <div className="border-l-2 border-navy/20 pl-5 py-1">
                  <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-2">
                    {swing.title}
                  </div>
                  <p className="text-lg md:text-xl font-light leading-relaxed"><TextWithFlags text={swing.text ?? ""} /></p>
                </div>
              </section>
            )}

            {nightResolutions.length > 0 && (
              <section className="mb-12 max-w-3xl">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Toutes les résolutions</h2>
                <ul className="divide-y divide-navy/10 border-y border-navy/10">
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
              </section>
            )}

            {tonightMatches.length > 0 && (
              <section className="mb-4">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Ce soir</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10">
                  {tonightMatches.map((m) => (
                    <MatchChip key={m.id} match={m} styles={styles} stake={data.stakes.find((s) => s.match_id === m.id)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ----- Repli : recap pas (encore) publié, vue dérivée en direct ----- */}
        {data && recapLoaded && !recap && nightResolutions.length === 0 && (
          <p className="font-light text-navy/70 max-w-xl">
            La carte n'a pas (encore) bougé cette nuit-là.{" "}
            <Link to="/calendrier" className="underline hover:text-blue-electric">Voir le calendrier</Link>.
          </p>
        )}
        {data && recapLoaded && !recap && nightResolutions.length > 0 && (
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
