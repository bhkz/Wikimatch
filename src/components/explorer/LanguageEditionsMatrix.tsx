import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { ExplorerMatrixRow, ExplorerMatrixCellStatus, ExplorerLanguageCode } from "../../types";

export default function LanguageEditionsMatrix({ rows }: { rows: ExplorerMatrixRow[] }) {
  const [selectedRowId, setSelectedRowId] = useState<string>(rows[0]?.id || "");
  const [activeMobileCaseId, setActiveMobileCaseId] = useState<string>(rows[0]?.id || "");

  const handleToast = () => alert("Toast de démonstration : page non construite.");

  const allLangs: ExplorerLanguageCode[] = ["EN", "FR", "ES", "AR", "JA", "PT"];

  return (
    <section id="matrix" className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative scroll-m-20">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12 text-navy">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide leading-[0.9]">
            CE QUE LES ÉDITIONS<br/><span className="text-navy/40">RETIENNENT DIFFÉREMMENT</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Chaque ligne correspond à un fait ou épisode fictif documenté. Chaque colonne correspond à une édition linguistique de Wikipédia.
          </p>
        </div>

        <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#e63946] bg-navy/5 px-4 py-2 border border-[#e63946]/20 w-fit mx-auto md:mx-0">
          EN, FR, ES, JA, AR OU PT DÉSIGNENT DES ÉDITIONS LINGUISTIQUES, JAMAIS DES PAYS NI DES OPINIONS COLLECTIVES.
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-flex flex-wrap md:flex-row gap-4 md:gap-8 mt-4 bg-white border border-navy/10 p-6 md:p-8">
           <LegendItem label="Présent" desc="Le fait est observé dans l'article comparé." color="bg-navy border-navy text-white" />
           <LegendItem label="Non détecté" desc="Le fait n'est pas observé dans la version consultée à cet instant." color="bg-cream border-navy/20 text-navy/50" />
           <LegendItem label="Convergent" desc="Le même fait est présent dans plusieurs éditions comparées." color="bg-blue-electric border-blue-electric text-white" />
           <LegendItem label="Instable" desc="Un passage change plusieurs fois sur un même article." color="bg-[#e63946] border-[#e63946] text-white" />
           <LegendItem label="Non comparé" desc="L'édition ne fait pas partie du cas étudié." color="bg-white border-dashed border-navy/10 text-navy/30" />
        </div>

        {/* Desktop Matrix */}
        <div className="hidden lg:flex flex-col gap-8 mt-8">
           <div className="overflow-x-auto">
             <table className="w-full text-left font-mono uppercase tracking-widest min-w-[1000px] border-collapse">
               <thead>
                 <tr className="border-b-2 border-navy/20 text-xs text-navy/50 font-bold">
                   <th className="pb-4 font-normal pl-4">Sujet observé</th>
                   {allLangs.map(lang => (
                      <th key={lang} className="pb-4 w-32 px-2 text-center text-navy font-bold">{lang}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {rows.map((row) => {
                    const isSelected = selectedRowId === row.id;
                    return (
                       <tr 
                         key={row.id}
                         onClick={() => setSelectedRowId(row.id)}
                         className={`border-b border-navy/10 transition-colors cursor-pointer group
                            ${isSelected ? 'bg-white shadow-sm border-l-4 border-l-navy' : 'hover:bg-white'}
                         `}
                       >
                         <td className="py-6 px-4">
                            <div className="font-bold text-xs text-navy mb-1">{row.topicLabel}</div>
                            <div className="font-light text-[9px] text-navy/50">{row.matchLabel}</div>
                         </td>
                         {allLangs.map(lang => {
                            const cell = row.languages[lang];
                            return (
                               <td key={lang} className="py-6 px-2 text-center">
                                  {cell ? (
                                     <div className={`text-[9px] font-bold py-2 px-1 border h-full flex items-center justify-center
                                        ${getCellStyle(cell.status)}
                                     `}>
                                        {cell.shortText || getStatusLabel(cell.status)}
                                     </div>
                                  ) : (
                                     <div className="text-navy/20 text-[10px]">—</div>
                                  )}
                               </td>
                            );
                         })}
                       </tr>
                    );
                 })}
               </tbody>
             </table>
           </div>

           {/* Desktop Conclusion Panel */}
           <AnimatePresence mode="wait">
              {rows.filter(r => r.id === selectedRowId).map(row => (
                 <motion.div 
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-row justify-between items-center bg-navy text-white p-8 border border-navy/20 shadow-lg mt-4"
                 >
                    <div className="flex flex-col gap-2">
                       <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">CONCLUSION OBSERVÉE</div>
                       <div className="font-sans text-xl font-light leading-relaxed max-w-3xl">{row.conclusion}</div>
                    </div>
                    {row.route ? (
                       <Link to={row.route} className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-white hover:bg-cream transition-colors px-6 py-4 h-fit shrink-0 ml-8 text-center">
                         Voir le détail
                       </Link>
                    ) : (
                       <button onClick={handleToast} className="font-mono text-[10px] uppercase font-bold tracking-widest text-white border border-white/20 hover:bg-white/10 transition-colors px-6 py-4 h-fit shrink-0 ml-8 text-center">
                         Détail à venir
                       </button>
                    )}
                 </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {/* Mobile Format */}
        <div className="flex lg:hidden flex-col gap-8 mt-4">
           {/* Selector */}
           <div className="flex overflow-x-auto gap-2 pb-4 -mx-4 px-4 snap-x">
              {rows.map(row => (
                 <button
                    key={row.id}
                    onClick={() => setActiveMobileCaseId(row.id)}
                    className={`shrink-0 snap-start font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-3 border transition-colors
                       ${activeMobileCaseId === row.id ? 'bg-navy text-white border-navy shadow-md' : 'bg-white text-navy/60 border-navy/20 hover:text-navy'}
                    `}
                 >
                    {row.topicLabel.split(' · ')[0]}
                 </button>
              ))}
           </div>

           {/* Active Card */}
           <AnimatePresence mode="wait">
              {rows.filter(r => r.id === activeMobileCaseId).map(row => (
                 <motion.div
                    key={row.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col bg-white border border-navy/10 select-none"
                 >
                    <div className="p-6 flex flex-col gap-2 border-b border-navy/10">
                       <div className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-1 w-fit border ${getTypeColor(row.type)}`}>
                         {getTypeLabel(row.type)} · {row.matchLabel?.split(' · ')[0]}
                       </div>
                       <h3 className="font-display text-2xl uppercase tracking-wide text-navy leading-tight mt-2">
                         {row.topicLabel}
                       </h3>
                    </div>

                    <div className="flex flex-col gap-4 p-6">
                       {allLangs.map(lang => {
                          const cell = row.languages[lang];
                          if (!cell || cell.status === 'not_compared') return null;
                          return (
                             <div key={lang} className="flex flex-col gap-2">
                                <div className={`font-mono text-[10px] uppercase font-bold tracking-widest flex items-center justify-between border pl-2 ${getCellStyle(cell.status)}`}>
                                   <span className="shrink-0">{lang}</span>
                                   <span className="font-sans font-light text-xs py-2 px-3 border-l bg-transparent text-right break-words max-w-[80%] whitespace-normal border-[inherit]/20">{cell.shortText || getStatusLabel(cell.status)}</span>
                                </div>
                             </div>
                          );
                       })}
                    </div>

                    <div className="p-6 bg-cream border-t border-navy/10 flex flex-col gap-4 mt-4">
                       <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">LECTURE</div>
                       <p className="font-sans text-sm md:text-base text-navy/80 font-light leading-relaxed">
                          {row.conclusion}
                       </p>
                       <div className="mt-4">
                          {row.route ? (
                             <Link to={row.route} className="font-mono text-[10px] block uppercase font-bold tracking-widest text-white bg-navy transition-colors px-4 py-3 text-center">
                               [Ouvrir le dossier]
                             </Link>
                          ) : (
                             <button onClick={handleToast} className="font-mono text-[10px] block w-full uppercase font-bold tracking-widest text-navy border border-navy/20 hover:bg-navy/5 transition-colors px-4 py-3 text-center">
                               [Toast de démonstration]
                             </button>
                          )}
                       </div>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

function LegendItem({ label, desc, color }: { label: string, desc: string, color: string }) {
   return (
      <div className="flex items-center gap-3 w-full md:w-auto flex-1 min-w-[200px]">
         <div className={`w-4 h-4 shrink-0 border ${color}`} />
         <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">{label}</span>
            <span className="font-sans text-[10px] text-navy/50">{desc}</span>
         </div>
      </div>
   );
}

function getCellStyle(status: ExplorerMatrixCellStatus) {
   switch(status) {
      case 'present': return 'bg-navy border-navy text-white';
      case 'not_detected': return 'bg-cream border-navy/10 text-navy/40';
      case 'convergent': return 'bg-blue-electric border-blue-electric text-white';
      case 'unstable': return 'bg-[#e63946] border-[#e63946] text-white';
      case 'not_compared': return 'bg-white border-dashed border-navy/10 text-navy/20';
      default: return 'bg-white border-navy/10 text-navy/50';
   }
}

function getStatusLabel(status: ExplorerMatrixCellStatus) {
   switch(status) {
      case 'present': return 'PRÉSENT';
      case 'not_detected': return 'NON DÉTECTÉ';
      case 'convergent': return 'CONVERGENT';
      case 'unstable': return 'INSTABLE';
      case 'not_compared': return 'NON COMPARÉ';
      default: return '';
   }
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    'fact_entry': 'UN FAIT ENTRE',
    'language_convergence': 'MISE À JOUR CONVERGENTE',
    'language_divergence': 'DIVERGENCE ENTRE ÉDITIONS',
    'article_instability': 'ARTICLE INSTABLE',
    'under_radar': 'SOUS LE RADAR',
    'match_recap': 'RÉCAP MATCH'
  };
  return map[type] || type.toUpperCase();
}

function getTypeColor(type: string) {
  switch(type) {
    case 'fact_entry': return 'text-yellow-600 border-yellow-600/20 bg-yellow-50';
    case 'language_convergence': return 'text-blue-electric border-blue-electric/20 bg-blue-electric/5';
    case 'language_divergence': return 'text-[#e63946] border-[#e63946]/20 bg-[#e63946]/5';
    case 'article_instability': return 'text-[#780000] border-[#780000]/20 bg-[#780000]/5';
    case 'under_radar': return 'text-[#2a9d8f] border-[#2a9d8f]/20 bg-[#2a9d8f]/5';
    case 'match_recap': return 'text-navy border-navy/20 bg-navy/5';
    default: return 'text-navy border-navy/20 bg-white';
  }
}
