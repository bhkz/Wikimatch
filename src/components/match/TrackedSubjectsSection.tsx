import { motion } from "motion/react";
import { MatchTrackedSubject } from "../../types";

export default function TrackedSubjectsSection({ subjects }: { subjects: MatchTrackedSubject[] }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream-dark border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        <div className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            CE QUE WIKIMATCH<br/>SURVEILLE<br/>POUR CE MATCH
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light mb-8 lg:mb-0">
            WikiMatch ne considère pas tout le football mondial comme lié à cette rencontre. Le suivi porte sur une sélection explicite de pages associées au match.
          </p>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub, i) => (
              <motion.div 
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-navy/10 p-6 flex flex-col gap-3 hover:border-blue-electric transition-colors shadow-sm"
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric">
                  {sub.type === "match" ? "Page Match" : sub.type === "team" ? "Équipe" : sub.type === "player" ? "Joueur" : "Tournoi"}
                </div>
                <h4 className="font-display text-2xl uppercase tracking-wide text-navy">
                  {sub.label}
                </h4>
                <p className="font-sans text-sm text-navy/60 font-light leading-relaxed mt-auto">
                  {sub.reason}
                </p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 font-mono text-[10px] text-navy/40 uppercase tracking-widest text-center border-t border-navy/5 pt-6">
            La présence d’une modification dans cette sélection n’en fait pas automatiquement une histoire publiée.
          </div>
        </div>

      </div>
    </section>
  );
}
