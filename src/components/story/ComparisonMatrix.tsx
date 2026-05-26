import { motion } from "motion/react";

export default function ComparisonMatrix() {
  const rows = [
    { label: "CARTON ROUGE MENTIONNÉ", en: "Oui", es: "Oui", fr: "Non détecté" },
    { label: "ALTERCATION MENTIONNÉE", en: "Oui", es: "Non", fr: "Non détecté" },
    { label: "PASSAGE TRADUIT DISPONIBLE", en: "Oui", es: "Oui", fr: "—" },
    { label: "SOURCE OBSERVÉE", en: "Oui", es: "Oui", fr: "—" },
    { label: "DERNIER ÉTAT OBSERVÉ", en: "Présent", es: "Présent", fr: "Absent" }
  ];

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden text-navy">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <h2 className="font-display text-3xl sm:text-4xl text-center uppercase tracking-wide">
          CE QUI DIFFÈRE, EN UN REGARD
        </h2>

        {/* Desktop Table View */}
        <div className="hidden md:block w-full overflow-hidden border border-navy/10 bg-white">
          <table className="w-full text-left font-mono text-sm uppercase">
            <thead>
              <tr className="bg-navy/5 border-b border-navy/10 text-xs text-navy/50 tracking-widest">
                <th className="p-6 font-normal">Élément observé</th>
                <th className="p-6 font-bold text-navy">EN</th>
                <th className="p-6 font-bold text-navy">ES</th>
                <th className="p-6 font-bold text-navy">FR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr 
                  key={row.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1 }}
                  className="border-b border-navy/5 hover:bg-navy/5 transition-colors"
                >
                  <td className="p-6 tracking-wide text-navy/80">{row.label}</td>
                  <td className={`p-6 ${row.en === 'Oui' || row.en === 'Présent' ? 'font-bold' : 'text-navy/40'}`}>{row.en}</td>
                  <td className={`p-6 ${row.es === 'Oui' || row.es === 'Présent' ? 'font-bold' : 'text-navy/40'}`}>{row.es}</td>
                  <td className={`p-6 ${row.fr === 'Oui' || row.fr === 'Présent' ? 'font-bold' : 'text-navy/40'}`}>{row.fr}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Horizontal Rows View */}
        <div className="flex flex-col md:hidden gap-6">
          {rows.map((row, i) => (
            <motion.div 
              key={row.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col bg-white border border-navy/10 p-4"
            >
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-navy/80 mb-3 border-b border-navy/5 pb-2">
                {row.label}
              </div>
              <div className="flex justify-between items-center font-mono text-xs uppercase">
                <div className="flex flex-col gap-1 w-1/3">
                  <span className="text-navy/40">EN</span>
                  <span className={row.en === 'Oui' || row.en === 'Présent' ? 'font-bold text-navy' : 'text-navy/60'}>{row.en}</span>
                </div>
                <div className="flex flex-col gap-1 w-1/3 text-center border-x border-navy/5 px-2">
                  <span className="text-navy/40">ES</span>
                  <span className={row.es === 'Oui' || row.es === 'Présent' ? 'font-bold text-navy' : 'text-navy/60'}>{row.es}</span>
                </div>
                <div className="flex flex-col gap-1 w-1/3 text-right">
                  <span className="text-navy/40">FR</span>
                  <span className={row.fr === 'Oui' || row.fr === 'Présent' ? 'font-bold text-navy' : 'text-navy/60'}>{row.fr}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center font-mono text-[10px] lg:text-xs uppercase text-navy/50 tracking-widest max-w-2xl mx-auto">
          L’absence détectée à un instant donné ne signifie pas qu’une édition n’intégrera pas l’information plus tard.
        </div>
      </div>
    </section>
  );
}
