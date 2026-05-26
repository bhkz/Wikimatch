import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ObservatoryTrackedArticle, ObservatoryArticleType } from "../../types";

export default function TrackedArticlesSection({ articles }: { articles: ObservatoryTrackedArticle[] }) {
  const [filterType, setFilterType] = useState<ObservatoryArticleType | "all">("all");

  const filteredArticles = filterType === "all" 
    ? articles 
    : articles.filter(a => a.articleType === filterType);

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy">
            LES ARTICLES<br/><span className="text-navy/40">SUIVIS DANS CE REJEU</span>
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Chaque histoire repose sur une sélection explicite d’articles associés à un match, un joueur, une équipe ou la compétition. Un article surveillé peut ne produire aucune histoire.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start">
           <FilterChip label="Tous" active={filterType === "all"} onClick={() => setFilterType("all")} />
           <FilterChip label="Matchs" active={filterType === "match"} onClick={() => setFilterType("match")} />
           <FilterChip label="Joueurs" active={filterType === "player"} onClick={() => setFilterType("player")} />
           <FilterChip label="Équipes" active={filterType === "team"} onClick={() => setFilterType("team")} />
           <FilterChip label="Tournoi" active={filterType === "tournament"} onClick={() => setFilterType("tournament")} />
        </div>

        {/* Cards Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence mode="popLayout">
              {filteredArticles.map((article, i) => (
                 <motion.div 
                    key={article.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                 >
                    <TrackedArticleCard article={article} />
                 </motion.div>
              ))}
           </AnimatePresence>
        </motion.div>

        {filteredArticles.length === 0 && (
          <div className="py-12 text-center border border-navy/10 bg-white">
             <div className="font-mono text-sm uppercase font-bold tracking-widest text-navy/40">
               Aucun article suivi pour ce filtre dans la démonstration.
             </div>
          </div>
        )}

      </div>
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest px-4 py-2 border transition-colors
        ${active 
          ? 'bg-navy text-white border-navy' 
          : 'bg-white text-navy/60 border-navy/20 hover:border-navy/60 hover:text-navy'}
      `}
    >
      {label}
    </button>
  );
}

function TrackedArticleCard({ article }: { article: ObservatoryTrackedArticle }) {
  
  const getTypeColor = (type: ObservatoryArticleType) => {
     switch(type) {
       case 'match': return 'text-blue-electric border-blue-electric/20';
       case 'player': return 'text-[#e63946] border-[#e63946]/20';
       case 'team': return 'text-navy border-navy/20';
       case 'tournament': return 'text-navy/50 border-navy/20';
       default: return 'text-navy border-navy/20';
     }
  };

  const getTypeLabel = (type: ObservatoryArticleType) => {
    switch(type) {
      case 'match': return 'MATCH';
      case 'player': return 'JOUEUR';
      case 'team': return 'ÉQUIPE';
      case 'tournament': return 'TOURNOI';
      default: return String(type).toUpperCase();
    }
  };

  return (
    <div className="flex flex-col bg-white border border-navy/10 p-6 shadow-sm h-full hover:shadow-md transition-shadow group">
       <div className="flex items-center gap-2 mb-4">
         <div className="font-mono text-[10px] font-bold uppercase tracking-widest bg-navy/5 px-2 py-1 text-navy border border-navy/10">
           {article.languageCode}
         </div>
         <div className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${getTypeColor(article.articleType)}`}>
           {getTypeLabel(article.articleType)}
         </div>
       </div>

       <h4 className="font-display text-2xl uppercase tracking-wide text-navy mb-1 leading-tight group-hover:text-blue-electric transition-colors">
         {article.entityLabel}
       </h4>
       <div className="font-sans text-xs text-navy/50 font-medium mb-6">
         {article.articleLabel}
       </div>

       <div className="flex flex-col gap-4 mt-auto">
          <div className="flex flex-col gap-1">
             <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/40">POURQUOI CET ARTICLE EST SUIVI :</div>
             <p className="font-sans text-sm text-navy/80 font-light leading-relaxed">
               {article.monitoringReason}
             </p>
          </div>
          <div className="flex flex-col gap-1 pt-4 border-t border-navy/10">
             <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/40">DERNIER ÉTAT :</div>
             <div className="font-mono text-[10px] uppercase tracking-widest text-navy font-bold">
               {article.latestStatusLabel}
             </div>
          </div>
       </div>
    </div>
  );
}
