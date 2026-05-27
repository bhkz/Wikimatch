import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import MatchHero from "../components/match/MatchHero";
import MatchEditorialRecap from "../components/match/MatchEditorialRecap";
import MatchStoriesGrid from "../components/match/MatchStoriesGrid";
import MatchNarrativeTimeline from "../components/match/MatchNarrativeTimeline";
import MatchComparisonPreview from "../components/match/MatchComparisonPreview";
import ArticleInstabilityFeature from "../components/match/ArticleInstabilityFeature";
import StabilizedFactsSection from "../components/match/StabilizedFactsSection";
import TrackedSubjectsSection from "../components/match/TrackedSubjectsSection";
import MatchSourcesSection from "../components/match/MatchSourcesSection";
import MatchShareCardPreview from "../components/match/MatchShareCardPreview";
import MatchFinalCTA from "../components/match/MatchFinalCTA";
import { MatchPageState } from "../types";
import { dataProvider, isDemoMode, useAsyncData } from "../data";

export default function MatchDetail() {
  const { slug } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(
    () => dataProvider.getMatchBySlug(slug ?? ""),
    [slug],
  );

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

  if (state.status === "error" || state.data === null) {
    return <Navigate to="/matches" replace />;
  }

  if (!isDemoMode && (slug ?? "").startsWith("demo-")) {
    return <Navigate to="/matches" replace />;
  }

  const {
    match,
    recap,
    stories: matchStories,
    timeline: matchTimeline,
    comparison: matchComparison,
    instability,
    trackedSubjects,
  } = state.data;

  // Create a copy of the match object with the current state applied
  const matchState = (match.state as MatchPageState) ?? "pre_match";

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-32 md:pb-0">
      <SiteHeader />

      <main className="relative pt-[124px] md:pt-[72px]">
        <MatchHero match={match} />

        {matchState === "post_match" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MatchEditorialRecap recap={recap} />
            {matchStories.length > 0 && <MatchStoriesGrid stories={matchStories} />}
            {matchTimeline.length > 0 && <MatchNarrativeTimeline timeline={matchTimeline} />}
            {isDemoMode && <MatchComparisonPreview comparison={matchComparison} />}
            {isDemoMode && instability && <ArticleInstabilityFeature data={instability} />}
            {isDemoMode && <StabilizedFactsSection />}
            <TrackedSubjectsSection subjects={trackedSubjects} />
            {isDemoMode && <MatchSourcesSection />}
            {isDemoMode && <MatchShareCardPreview />}
            {!isDemoMode && matchStories.length === 0 && matchTimeline.length === 0 && (
              <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
                <div className="max-w-screen-xl mx-auto bg-white border border-navy/10 p-8 text-center">
                  <div className="font-display text-3xl uppercase text-navy/40 mb-4">AUCUNE OBSERVATION PUBLIEE</div>
                  <p className="font-sans text-sm text-navy/60 font-light">
                    Ce match est suivi, mais aucune trace publique ou histoire publiee n'est encore disponible.
                  </p>
                </div>
              </section>
            )}
            <MatchFinalCTA />
          </div>
        )}

        {matchState === "live" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 bg-cream min-h-screen pb-24">

            {/* Live Observation Banner */}
            <div className="w-full bg-navy text-white px-4 md:px-8 py-8 border-b-4 border-red-signal shadow-inner">
               <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-red-signal mb-2 flex items-center gap-2">
                       <span className="w-2 h-2 bg-red-signal rounded-full animate-ping" />
                       EN COURS D'OBSERVATION
                    </div>
                    <p className="font-sans text-sm md:text-base font-light leading-relaxed max-w-xl text-white/90">
                      {matchTimeline.length > 0
                        ? `${matchTimeline.length} modification${matchTimeline.length > 1 ? "s" : ""} captée${matchTimeline.length > 1 ? "s" : ""} sur les articles suivis. Ces modifications sont en cours d'analyse.`
                        : "Aucune modification captée sur les articles suivis pour le moment. Le suivi est actif."}
                    </p>
                  </div>
               </div>
            </div>

            {/* Live Timeline from real data */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-16 flex flex-col gap-8">
               <h3 className="font-display text-3xl uppercase text-navy border-b border-navy/10 pb-4">Chronologie en direct</h3>
               {matchTimeline.length > 0 ? (
                 <div className="flex flex-col gap-4">
                   {matchTimeline.map((entry: any, i: number) => (
                     <div key={entry.id || i} className="flex items-center gap-4 bg-white p-4 shadow-sm border border-navy/10 border-l-4 border-l-blue-electric">
                       <span className="font-display text-2xl w-12 text-center text-navy opacity-80">{entry.timeLabel || ""}</span>
                       {entry.languageCode && (
                         <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-navy/5 text-navy border border-navy/10">{entry.languageCode}</span>
                       )}
                       <div className="flex flex-col">
                         <span className="font-sans font-medium text-sm">{entry.label || "Article modifié"}</span>
                         <span className="font-mono text-[10px] text-blue-electric font-bold uppercase tracking-widest mt-1">
                           {entry.statusLabel || "OBSERVATION CAPTÉE"}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="bg-navy/5 border border-navy/10 p-8 text-center">
                   <p className="font-sans text-lg font-light text-navy/60">Aucune modification captée pour le moment.</p>
                   <p className="font-mono text-[10px] uppercase tracking-widest text-navy/30 mt-4">Le suivi est actif — les éditions apparaîtront ici en temps réel.</p>
                 </div>
               )}
            </div>

            {/* Stories candidates from real data */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-16 mb-24">
               <h3 className="font-display text-3xl uppercase text-navy border-b border-navy/10 pb-4 mb-8">Histoires liées</h3>
               {matchStories.length > 0 ? (
                 <div className="flex flex-col gap-4">
                   {matchStories.map((s: any) => (
                     <div key={s.id} className="bg-white border border-navy/10 p-6 shadow-sm hover:border-blue-electric transition-colors">
                       <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric mb-2">{s.categoryLabel || "HISTOIRE"}</div>
                       <h4 className="font-display text-xl uppercase text-navy">{s.title}</h4>
                       {s.excerpt && <p className="font-sans text-sm font-light text-navy/70 mt-2">{s.excerpt}</p>}
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="bg-navy/5 border border-navy/10 p-8 text-center">
                   <p className="font-sans text-lg font-light text-navy/60">Aucune histoire publiée pour ce match.</p>
                   <p className="font-mono text-[10px] uppercase tracking-widest text-navy/30 mt-4">
                     Les histoires seront publiées ici dès que le pipeline éditorial valide une observation.
                   </p>
                 </div>
               )}
            </div>

          </div>
        )}

        {matchState === "pre_match" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 bg-cream min-h-screen">
             <TrackedSubjectsSection subjects={trackedSubjects} />

             <section className="py-24 px-4 md:px-8 max-w-screen-xl mx-auto">
               <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy mb-12">CE QUE WIKIMATCH CHERCHERA</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-white p-8 shadow-sm border border-navy/10 hover:border-navy/30 transition-colors">
                   <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric mb-4">UN FAIT ENTRE</div>
                   <p className="font-sans text-sm font-light leading-relaxed text-navy/80">Résultat, qualification, record ou palmarès.</p>
                 </div>
                 <div className="bg-white p-8 shadow-sm border border-navy/10 hover:border-navy/30 transition-colors">
                   <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#A8B227] mb-4">LES ÉDITIONS DIFFÈRENT</div>
                   <p className="font-sans text-sm font-light leading-relaxed text-navy/80">Un même épisode apparaît différemment selon les articles.</p>
                 </div>
                 <div className="bg-white p-8 shadow-sm border border-navy/10 hover:border-navy/30 transition-colors">
                   <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-signal mb-4">UN ARTICLE DEVIENT INSTABLE</div>
                   <p className="font-sans text-sm font-light leading-relaxed text-navy/80">Un passage est ajouté, retiré puis restauré.</p>
                 </div>
               </div>
             </section>

             <section className="py-24 px-4 md:px-8 bg-navy text-cream text-center">
               <div className="max-w-2xl mx-auto flex flex-col gap-6">
                 <h3 className="font-display text-3xl uppercase tracking-wide">Méthodologie</h3>
                 <p className="font-sans text-lg font-light leading-relaxed opacity-80">
                   Avant le coup d'envoi, aucun score d'activité n'est présenté comme une histoire. Le suivi commence par une sélection vérifiée de pages.
                 </p>
                 <Link to="/methodology" className="font-mono text-[10px] uppercase font-bold tracking-widest mt-4 text-cream/50 hover:text-white transition-colors underline decoration-cream/20">
                   Lire la méthode complète
                 </Link>
               </div>
             </section>
           </div>
        )}

      </main>

      <SiteFooter />
    </div>
  );
}
