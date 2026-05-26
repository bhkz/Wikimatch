import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { MatchRecap } from "../../types";
import MatchDemoBadge from "./MatchDemoBadge";

export default function MatchEditorialRecap({ recap }: { recap: MatchRecap }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-8 md:w-1/2">
            <h2 className="font-display text-5xl md:text-6xl uppercase tracking-wide text-navy leading-[0.9]">
              {recap.title.split(' ').map((word, i) => (
                <span key={i} className="inline-block mr-3">{word}</span>
              ))}
            </h2>
            <p className="font-sans text-xl md:text-2xl text-navy/80 font-light leading-relaxed">
              {recap.summary}
            </p>
          </div>

          <div className="md:w-5/12 bg-white border border-navy/10 p-8 md:p-12 shadow-sm relative">
            <div className="absolute top-4 right-4">
               <MatchDemoBadge text="FICTIF" />
            </div>
            <div className="font-display text-3xl md:text-4xl text-blue-electric uppercase tracking-wide leading-tight mb-8">
              {recap.keyTakeaway}
            </div>
            
            <div className="flex flex-col gap-6 font-mono text-xs uppercase tracking-widest text-navy/60">
              <div className="flex items-center justify-between border-b border-navy/5 pb-2">
                <span>Histoires publiées</span>
                <span className="font-display text-3xl text-navy">{recap.storyCount}</span>
              </div>
              <div className="flex items-center justify-between border-b border-navy/5 pb-2">
                <span>Éditions comparées</span>
                <span className="font-display text-3xl text-navy">{recap.comparedEditions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Article instable observé</span>
                <span className="font-display text-3xl text-navy">{recap.instabilityCount}</span>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
               <button className="bg-navy text-white px-6 py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-blue-electric transition-colors w-full text-center">
                 Voir les histoires
               </button>
               <Link to="/methodology" className="border border-navy/20 px-6 py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-navy/5 transition-colors w-full flex justify-center items-center">
                 Comprendre la méthode
               </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
