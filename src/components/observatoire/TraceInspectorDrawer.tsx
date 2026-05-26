import { ObservatoryTrace } from "../../types";
import { Link } from "react-router-dom";

export default function TraceInspectorDrawer({ trace, isDesktop, onClose }: { trace: ObservatoryTrace, isDesktop: boolean, onClose: () => void }) {
  
  const handleAlert = () => alert("Source non connectée dans cette démonstration frontend.");

  return (
    <div className={`flex flex-col bg-white overflow-y-auto h-full ${isDesktop ? 'border border-navy/20 shadow-lg' : ''}`}>
       
       {/* Header */}
       <div className="flex justify-between items-center p-6 border-b border-navy/10 bg-cream sticky top-0 z-10">
          <div className="font-mono text-xs uppercase font-bold tracking-widest text-navy">
             TRACE OBSERVÉE · DÉMONSTRATION
          </div>
          {!isDesktop && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-navy/20 text-navy font-mono hover:bg-navy hover:text-white transition-colors">
              X
            </button>
          )}
       </div>

       <div className="p-6 md:p-8 flex flex-col gap-8">
          
          {/* Metadata */}
          <div className="flex flex-col gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
             <div>{trace.observedAtLabel}</div>
             <div className="text-navy">{trace.languageCode} · {trace.languageLabel}</div>
             <div>{trace.articleType} : {trace.articleLabel}</div>
             <div>SECTION : {trace.sectionLabel}</div>
             <div className="text-blue-electric mt-2 px-2 py-1 bg-blue-electric/5 border border-blue-electric/20 w-fit">{trace.anonymizedContributorLabel}</div>
          </div>

          <div className="w-full h-[1px] bg-navy/10" />

          {/* Diff view */}
          <div className="flex flex-col gap-6">
             <div className="font-display text-2xl uppercase tracking-wide text-navy leading-tight">
                {trace.summary}
             </div>

             {trace.removedText && (
               <div className="flex flex-col gap-1">
                 <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#e63946] mb-1">RETIRÉ</div>
                 <div className="bg-[#e63946]/5 border-l-2 border-[#e63946] p-4 font-mono text-sm leading-relaxed text-[#e63946]/90 line-through decoration-1 text-wrap break-words">
                   - {trace.removedText}
                 </div>
               </div>
             )}

             {trace.addedText && (
               <div className="flex flex-col gap-1">
                 <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#2a9d8f] mb-1">AJOUTÉ</div>
                 <div className="bg-[#2a9d8f]/5 border-l-2 border-[#2a9d8f] p-4 font-sans text-lg font-light leading-relaxed text-[#2a9d8f]/90 break-words">
                   + {trace.addedText}
                 </div>
               </div>
             )}

             {trace.translatedText && (
               <div className="flex flex-col gap-1 mt-2">
                 <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/50 mb-1">TRADUCTION DE L'EXTRAIT</div>
                 <div className="bg-cream p-4 font-sans text-sm italic font-light leading-relaxed text-navy/80 border border-navy/10 break-words">
                   « {trace.translatedText} »
                 </div>
               </div>
             )}

             {trace.changeKind === "no_equivalent_detected" && (
                <div className="bg-cream border border-navy/10 p-6 flex items-center justify-center font-mono text-xs text-navy/50 text-center">
                   L'absence ne produit pas de diff visuel.
                </div>
             )}
          </div>

          <div className="w-full h-[1px] bg-navy/10" />

          {/* Classification */}
          <div className="flex flex-col gap-4">
             <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy">
               {trace.changeStatus === 'linked_to_published_story' ? 'POURQUOI CETTE TRACE COMPTE' : 'POURQUOI CETTE TRACE N\'EST PAS PUBLIÉE'}
             </h4>
             <p className="font-sans text-sm md:text-base text-navy/70 leading-relaxed font-light">
                {trace.changeStatus === 'linked_to_published_story' 
                  ? 'Cette modification est reliée à une histoire publiée, car elle porte sur le passage comparé entre plusieurs éditions ou sur un fait essentiel de la narration.' 
                  : trace.changeStatus === 'minor' 
                     ? 'Cette correction modifie la forme ou un lien interne, sans changement narratif identifié.' 
                     : 'Ce changement modifie le récit mais n’a pas été relié à une histoire dans le cadre de cette démonstration.'}
             </p>
          </div>

          {/* Links CTA */}
          <div className="flex flex-col gap-3 mt-4">
             {trace.relatedStoryRoute && trace.changeStatus === 'linked_to_published_story' && (
                <Link to={trace.relatedStoryRoute} className="bg-navy text-white px-6 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-blue-electric transition-colors text-center w-full">
                  Ouvrir l'histoire publiée
                </Link>
             )}
             <button onClick={handleAlert} className="border border-navy/20 text-navy px-6 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-navy/5 transition-colors text-center w-full">
               Ouvrir la modification source
             </button>
          </div>

       </div>
    </div>
  );
}
