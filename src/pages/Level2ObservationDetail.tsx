/**
 * Level 2 observation detail — rendu sobre mobile-first pour les
 * observations automatiques rehearsal PSG — Arsenal.
 *
 * Implémente docs/v2/STORY_PUBLICATION_CONTRACT.md §8.1 :
 *  - badge "OBSERVATION AUTOMATIQUE · SOURCES CONSULTABLES"
 *  - titre / résumé / observation / limitation
 *  - liste des sources Wikimédia (langue · page · timestamp · lien diff/revision)
 *  - PAS de CTA "Comparer les versions" tant qu'aucun extrait public modéré n'existe.
 */

import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

type Source = {
  id: string;
  label: string;
  languageCode: string;
  pageTitle: string;
  revisionTimestamp: string | null;
  url: string;
};

type Observation = {
  id: string;
  slug: string;
  type: string;
  categoryLabel: string;
  badgeLabel: string;
  title: string;
  excerpt: string;
  observation: string;
  interpretation: string;
  limitation: string;
  languages: string[];
  sourceCount: number;
  publishedAtLabel: string;
  match: { slug: string; competitionLabel: string; stageLabel: string };
  sources: Source[];
};

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not_found" }
  | { status: "ok"; observation: Observation };

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} UTC`;
  } catch {
    return "";
  }
}

export default function Level2ObservationDetail() {
  const { slug } = useParams();
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!slug) {
      setState({ status: "not_found" });
      return;
    }
    let cancelled = false;
    const url = `/api/public/v1/stories/${encodeURIComponent(slug)}`;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        if (!res.ok) {
          setState({ status: "error" });
          return;
        }
        const body = await res.json();
        const story = body?.story;
        if (!story) {
          setState({ status: "not_found" });
          return;
        }
        setState({ status: "ok", observation: story as Observation });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh] font-mono text-[10px] uppercase tracking-widest text-navy/40 pt-32">
          Chargement…
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (state.status === "not_found") {
    return <Navigate to="/stories" replace />;
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader />
        <main className="pt-32 px-4 md:px-8">
          <div className="max-w-2xl mx-auto py-16 text-center font-mono text-xs uppercase tracking-widest text-navy/60">
            Observation indisponible pour le moment.
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const obs = state.observation;

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />
      <main className="pt-[72px]">
        <article className="px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-2xl mx-auto flex flex-col gap-8">
            <header className="flex flex-col gap-4">
              <span className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest px-3 py-2 bg-blue-electric text-white self-start">
                {obs.badgeLabel}
              </span>
              <h1 className="font-display text-3xl md:text-5xl uppercase leading-tight text-navy">
                {obs.title}
              </h1>
              <p className="font-sans text-base md:text-lg text-navy/70 leading-relaxed">
                {obs.excerpt}
              </p>
              {obs.match?.slug && (
                <Link
                  to={`/match/${obs.match.slug}`}
                  className="font-mono text-[10px] uppercase tracking-widest text-blue-electric hover:underline self-start"
                >
                  Voir le match suivi →
                </Link>
              )}
              <div className="flex flex-wrap gap-2 items-center pt-2">
                {obs.languages.map((l) => (
                  <span
                    key={l}
                    className="bg-navy/5 px-2 py-1 font-mono text-[10px] uppercase text-navy/80 font-bold"
                  >
                    {l}
                  </span>
                ))}
                <span className="ml-auto font-mono text-[10px] uppercase text-navy/40 tracking-widest">
                  {obs.sourceCount} source{obs.sourceCount > 1 ? "s" : ""}
                </span>
              </div>
            </header>

            <section className="flex flex-col gap-3 border-l-4 border-navy/20 pl-4">
              <h2 className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                Ce que l'on peut observer
              </h2>
              <p className="font-sans text-base text-navy leading-relaxed">
                {obs.observation}
              </p>
            </section>

            <section className="flex flex-col gap-3 border-l-4 border-blue-electric/40 pl-4">
              <h2 className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                Sources Wikimédia consultables
              </h2>
              <ul className="flex flex-col gap-3">
                {obs.sources.map((src) => (
                  <li key={src.id} className="flex flex-col gap-1">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs uppercase tracking-widest text-blue-electric hover:underline break-all"
                    >
                      {src.languageCode} · {src.pageTitle}
                      {formatTimestamp(src.revisionTimestamp)
                        ? ` · ${formatTimestamp(src.revisionTimestamp)}`
                        : ""}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-3 border-l-4 border-red-signal/40 pl-4">
              <h2 className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                Ce que l'on ne peut pas conclure
              </h2>
              <p className="font-sans text-sm text-navy/70 leading-relaxed">
                {obs.limitation}
              </p>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
