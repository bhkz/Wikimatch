import { motion } from "motion/react";
import { EntityTimelineItem } from "../../types";

export default function EntityTournamentTimeline({ timeline }: { timeline: EntityTimelineItem[] }) {
  return (
    <section id="entity-timeline" className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 scroll-m-20">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy">
            COMMENT UN JOUEUR<br/>ENTRE SOUS LE RADAR
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Une chronologie fictive rapprochant le contexte du match et les observations réalisées dans les articles comparés.
          </p>
        </div>

        {/* Mobile Timeline */}
        <div className="flex xl:hidden flex-col relative pl-6">
           <div className="absolute top-0 bottom-0 left-[7px] w-[2px] bg-navy/10" />
           
           {timeline.map((item, i) => (
              <motion.div 
                 key={item.id}
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="flex flex-col gap-3 mb-12 relative pb-2"
              >
                 <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-cream border-2 border-navy z-10" />
                 
                 <div className="flex flex-col font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                    <span>{item.dateLabel} · {item.timeLabel}</span>
                    {getTypeLabel(item.type, item.languageCode)}
                 </div>
                 
                 <div className="bg-white p-6 border border-navy/10 shadow-sm mt-2">
                    <h4 className="font-display text-2xl uppercase text-navy leading-none mb-2">{item.title}</h4>
                    <p className="font-sans text-sm text-navy/70 font-light leading-relaxed">{item.description}</p>
                 </div>
              </motion.div>
           ))}
        </div>

        {/* Desktop Horizontal Timeline */}
        <div className="hidden xl:flex relative mt-16 pb-32">
           <div className="absolute top-[80px] left-0 right-0 h-[2px] bg-navy/10" />
           
           <div className="flex w-full justify-between items-start">
              {timeline.map((item, i) => (
                 <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                   className="flex flex-col items-center flex-1 relative px-4"
                 >
                    {/* Event Type (Alternating top/bottom) */}
                    <div className={`h-[60px] flex flex-col justify-end w-full pb-4 ${i % 2 === 0 ? '' : 'invisible'}`}>
                      {i % 2 === 0 && <TimelineContent item={item} position="top" />}
                    </div>

                    {/* Node on the line */}
                    <div className="relative flex items-center justify-center w-full h-[30px] my-2">
                      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-transparent" />
                      <div className={`w-4 h-4 rounded-full border-2 z-10 ${getNodeColorClass(item.type)}`} />
                    </div>

                    {/* Event Type (Alternating bottom/top) */}
                    <div className={`pt-4 w-full ${i % 2 !== 0 ? '' : 'invisible'}`}>
                      {i % 2 !== 0 && <TimelineContent item={item} position="bottom" />}
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>

        <div className="font-mono text-[10px] uppercase tracking-widest font-bold text-navy/40 max-w-3xl border-l border-navy/20 pl-4 mx-auto md:mx-0">
          Les observations sont rapprochées du match dans le temps. WikiMatch ne prétend pas prouver automatiquement qu'un événement sportif a causé une modification.
        </div>

      </div>
    </section>
  );
}

function getNodeColorClass(type: string) {
  switch (type) {
    case 'match_event': return 'bg-navy border-navy';
    case 'wikipedia_observation': return 'bg-[#e63946] border-[#e63946]';
    case 'comparison_snapshot': return 'bg-blue-electric border-blue-electric';
    case 'published_story': return 'bg-cream border-navy';
    default: return 'bg-white border-navy';
  }
}

function getTypeLabel(type: string, lang?: string) {
   switch(type) {
     case 'match_event': return <span className="text-navy">ÉVÉNEMENT DU MATCH</span>;
     case 'wikipedia_observation': return <span className="text-[#e63946]">OBSERVATION WIKIPÉDIA {lang}</span>;
     case 'comparison_snapshot': return <span className="text-blue-electric">COMPARAISON ENTRE ÉDITIONS</span>;
     case 'published_story': return <span className="text-navy underline decoration-navy/20">HISTOIRE PUBLIÉE</span>;
     default: return null;
   }
}

function TimelineContent({ item, position }: { item: EntityTimelineItem, position: "top" | "bottom" }) {
  return (
    <div className={`flex flex-col w-full text-center ${position === 'top' ? 'justify-end h-full' : 'justify-start'}`}>
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/50 mb-1">
        {item.timeLabel}
      </div>
      <div className="mb-2">
         {getTypeLabel(item.type, item.languageCode)}
      </div>
      <h4 className="font-display text-xl uppercase text-navy leading-tight mb-2">{item.title}</h4>
      <p className="font-sans text-xs text-navy/70 font-light leading-relaxed px-2">{item.description}</p>
    </div>
  );
}
