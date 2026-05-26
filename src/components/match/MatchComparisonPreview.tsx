import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { MatchLanguageComparison } from "../../types";

export default function MatchComparisonPreview({ comparison }: { comparison: MatchLanguageComparison }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden text-navy">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wide">
            UN ÉPISODE.<br/>PLUSIEURS ÉDITIONS.
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
            Comment les articles comparés traitent l'incident fictif de fin de match.
          </p>
        </div>

        <div className="font-mono text-xs font-bold uppercase tracking-widest text-navy bg-navy/5 w-fit px-4 py-2 border border-navy/10 mx-auto md:mx-0">
          {comparison.eventLabel}
        </div>

        <div className="mt-4 w-full overflow-hidden border border-navy/10 bg-white">
          {/* Desktop Table View */}
          <table className="hidden md:table w-full text-left font-mono text-sm uppercase">
            <thead>
              <tr className="bg-navy/5 border-b border-navy/10 text-xs text-navy/50 tracking-widest">
                <th className="p-6 font-normal">Élément observé</th>
                <th className="p-6 font-bold text-navy">EN</th>
                <th className="p-6 font-bold text-navy">ES</th>
                <th className="p-6 font-bold text-navy">FR</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row, i) => (
                <motion.tr 
                  key={row.observation}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1 }}
                  className="border-b border-navy/5 hover:bg-navy/5 transition-colors group cursor-default"
                >
                  <td className="p-6 tracking-wide text-navy/80">{row.observation}</td>
                  <td className={`p-6 ${row.EN === 'Oui' || row.EN === 'Présent' ? 'font-bold' : 'text-navy/40'} group-hover:text-blue-electric transition-colors`}>{row.EN}</td>
                  <td className={`p-6 ${row.ES === 'Oui' || row.ES === 'Présent' ? 'font-bold' : 'text-navy/40'}`}>{row.ES}</td>
                  <td className={`p-6 ${row.FR === 'Oui' || row.FR === 'Présent' ? 'font-bold' : 'text-navy/40'}`}>{row.FR}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Horizontal Rows View */}
          <div className="flex flex-col md:hidden">
            {comparison.rows.map((row, i) => (
              <motion.div 
                key={row.observation}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col p-4 border-b border-navy/10 last:border-b-0"
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/80 mb-3 pb-2 border-b border-navy/5">
                  {row.observation}
                </div>
                <div className="flex justify-between items-center font-mono text-[10px] uppercase">
                  <div className="flex flex-col gap-1 w-1/3">
                    <span className="text-navy/40">EN</span>
                    <span className={row.EN === 'Oui' || row.EN === 'Présent' ? 'font-bold text-navy' : 'text-navy/60'}>{row.EN}</span>
                  </div>
                  <div className="flex flex-col gap-1 w-1/3 text-center border-x border-navy/5 px-2">
                    <span className="text-navy/40">ES</span>
                    <span className={row.ES === 'Oui' || row.ES === 'Présent' ? 'font-bold text-navy' : 'text-navy/60'}>{row.ES}</span>
                  </div>
                  <div className="flex flex-col gap-1 w-1/3 text-right">
                    <span className="text-navy/40">FR</span>
                    <span className={row.FR === 'Oui' || row.FR === 'Présent' ? 'font-bold text-navy' : 'text-navy/60'}>{row.FR}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric">OBSERVATION</span>
            <p className="font-sans text-base text-navy/80 leading-relaxed font-light">{comparison.conclusion}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/40">LIMITE</span>
            <p className="font-sans text-base text-navy/60 leading-relaxed font-light">{comparison.limitation}</p>
          </div>
        </div>

        <div className="flex justify-center mt-8">
           <Link to="/story/demo-divergence" className="inline-block bg-navy text-white px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest hover:bg-blue-electric transition-colors shadow-lg">
             Ouvrir la comparaison complète
           </Link>
        </div>

      </div>
    </section>
  );
}
