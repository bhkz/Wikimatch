import { Link } from "react-router-dom";
import type { StoryArchiveItem } from "../../types";

export default function MatchRecapsSection({ stories }: { stories: StoryArchiveItem[] }) {
  const recaps = stories.filter((s) => s.type === "match_recap");
  if (recaps.length === 0) return null;

  const [main, ...rest] = recaps;

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide text-navy">
            LES MATCHS<br />QUI ONT LAISSÉ UNE TRACE
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Un récap réunit les histoires validées d'une rencontre : faits intégrés, comparaisons entre éditions et articles instables.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col">
            <Link
              to={main.availableDetailRoute ?? `/story/${main.slug}`}
              className="group flex flex-col h-full border border-navy/10 bg-white hover:border-navy/30 transition-colors shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-electric/5 to-transparent pointer-events-none" />
              <div className="p-8 md:p-16 flex flex-col gap-8 flex-grow z-10">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">RÉCAP MATCH</div>
                <div className="font-display text-3xl md:text-5xl uppercase text-navy group-hover:text-blue-electric transition-colors leading-[0.95]">
                  {main.title}
                </div>
                {main.excerpt && (
                  <div className="font-sans text-base md:text-lg text-navy/70 font-light leading-relaxed max-w-md">{main.excerpt}</div>
                )}
                {main.matchLabel && <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-navy/50">{main.matchLabel}</div>}
              </div>
              <div className="px-8 py-6 border-t border-navy/10 bg-navy text-white font-mono text-xs uppercase font-bold tracking-widest flex justify-between items-center group-hover:bg-blue-electric transition-colors">
                <span>Ouvrir le dossier du match</span>
                <span className="text-lg">→</span>
              </div>
            </Link>
          </div>

          {rest.length > 0 && (
            <div className="lg:col-span-4 flex flex-col gap-8">
              {rest.slice(0, 2).map((r) => (
                <Link
                  key={r.id}
                  to={r.availableDetailRoute ?? `/story/${r.slug}`}
                  className="flex-grow flex flex-col border border-navy/10 bg-cream-dark relative overflow-hidden hover:border-navy/30 transition-colors"
                >
                  <div className="p-8 flex flex-col gap-4 h-full justify-center text-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 font-bold">RÉCAP MATCH</div>
                    <div className="font-display text-2xl md:text-3xl uppercase text-navy leading-tight">{r.title}</div>
                    {r.matchLabel && <div className="font-sans text-sm text-navy/60 font-light">{r.matchLabel}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
