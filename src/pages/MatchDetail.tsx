import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import DemoStateSwitcher from "../components/match/DemoStateSwitcher";
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

import { 
  demoMatch, 
  demoRecap, 
  matchStories,
  matchTimeline,
  matchComparison,
  demoInstability,
  trackedSubjects
} from "../mockMatchData";
import { MatchPageState } from "../types";

export default function MatchDetail() {
  const [matchState, setMatchState] = useState<MatchPageState>("post_match");

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Create a copy of the match object with the current state applied
  const currentMatch = { ...demoMatch, state: matchState };

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-32 md:pb-0">
      <SiteHeader />
      
      {/* State Switcher for Demo Purposes */}
      <DemoStateSwitcher activeState={matchState} onChange={setMatchState} />

      <main className="relative pt-[124px] md:pt-[72px]">
        <MatchHero match={currentMatch} />
        
        {matchState === "post_match" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MatchEditorialRecap recap={demoRecap} />
            <MatchStoriesGrid stories={matchStories} />
            <MatchNarrativeTimeline timeline={matchTimeline} />
            <MatchComparisonPreview comparison={matchComparison} />
            <ArticleInstabilityFeature data={demoInstability} />
            <StabilizedFactsSection />
            <TrackedSubjectsSection subjects={trackedSubjects} />
            <MatchSourcesSection />
            <MatchShareCardPreview />
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
                      Une mise à jour liée au score final n'existe pas encore : le match est toujours en cours.<br/>Deux articles suivis ont été modifiés depuis le coup d'envoi. Ces modifications restent en cours d'analyse.
                    </p>
                  </div>
               </div>
            </div>

            {/* Live Timeline simple preview */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-16 flex flex-col gap-8">
               <h3 className="font-display text-3xl uppercase text-navy border-b border-navy/10 pb-4">Chronologie en direct</h3>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-white p-4 shadow-sm border border-navy/10">
                     <span className="font-display text-2xl w-12 text-center text-navy font-bold text-navy/40">34'</span>
                     <span className="w-2 h-2 rounded-full bg-navy" />
                     <span className="font-sans font-light">But inscrit · événement fictif</span>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 shadow-sm border border-navy/10 border-l-4 border-l-blue-electric">
                     <span className="font-display text-2xl w-12 text-center text-navy opacity-80">21:41</span>
                     <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-navy/5 text-navy border border-navy/10">EN</span>
                     <div className="flex flex-col">
                       <span className="font-sans font-medium text-sm">Page du match modifiée</span>
                       <span className="font-mono text-[10px] text-blue-electric font-bold uppercase tracking-widest mt-1">Analyse en cours</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 shadow-sm border border-navy/10 border-l-4 border-l-blue-electric">
                     <span className="font-display text-2xl w-12 text-center text-navy opacity-80">21:46</span>
                     <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-navy/5 text-navy border border-navy/10">FR</span>
                     <div className="flex flex-col">
                       <span className="font-sans font-medium text-sm">Page d'un joueur modifiée</span>
                       <span className="font-mono text-[10px] text-blue-electric font-bold uppercase tracking-widest mt-1">Analyse en cours</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Candidates Preview */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-16 mb-24">
               <h3 className="font-display text-3xl uppercase text-navy border-b border-navy/10 pb-4 mb-8">Changements à analyser</h3>
               <div className="bg-navy/5 border border-navy/10 p-8 shadow-sm">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-4 bg-white w-fit px-2 py-1 rounded">CANDIDAT · NON PUBLIÉ</div>
                  <p className="font-sans text-lg font-light leading-relaxed text-navy">
                     Deux éditions ont modifié une page liée au buteur. WikiMatch doit encore vérifier si elles parlent du même fait.
                  </p>
                  <button className="mt-6 font-mono text-[10px] font-bold uppercase tracking-widest text-navy underline decoration-navy/30 hover:text-blue-electric transition-colors">
                     Voir l'observation
                  </button>
               </div>
               <div className="mt-8 font-mono text-[10px] uppercase tracking-widest text-navy/40 text-center">
                  Aucune carte partageable tant qu'aucune story n'est publiée.
               </div>
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
