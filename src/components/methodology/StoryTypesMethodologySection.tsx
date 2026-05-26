import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";

const types = [
  {
    id: "fact_entry",
    label: "UN FAIT ENTRE",
    color: "bg-[#38b000]/10 border-[#38b000]/30 text-[#38b000]",
    desc: "Un résultat, une qualification, un record ou un titre apparaît dans un ou plusieurs articles.",
    example: "La qualification du Maroc apparaît dans quatre éditions.",
    route: null,
    btn: null,
  },
  {
    id: "language_convergence",
    label: "MISE À JOUR CONVERGENTE",
    color: "bg-navy/5 border-navy/20 text-navy",
    desc: "Le même fait identifiable est observé dans plusieurs éditions.",
    subDesc:
      "Ce que cela dit : plusieurs articles intègrent la même information.\nCe que cela ne dit pas : qui a influencé qui.",
    route: null,
    btn: null,
  },
  {
    id: "language_divergence",
    label: "DIVERGENCE ENTRE ÉDITIONS",
    color: "bg-blue-electric/10 border-blue-electric/30 text-blue-electric",
    desc: "Plusieurs articles comparés ne retiennent pas les mêmes éléments du même épisode.",
    example: "Un même carton rouge. Trois traitements Wikipédia.",
    route: "/story/demo-divergence",
    btn: "Lire l'exemple",
  },
  {
    id: "article_instability",
    label: "ARTICLE INSTABLE",
    color: "bg-[#e63946]/10 border-[#e63946]/30 text-[#e63946]",
    desc: "Sur un même article, un passage est ajouté, retiré, restauré ou reformulé plusieurs fois.",
    subDesc:
      "Important : la tension concerne une page précise, pas plusieurs langues actives.",
    route: "/match/demo-france-belgique",
    btn: "Voir dans le dossier match",
  },
  {
    id: "under_radar",
    label: "SOUS LE RADAR",
    color: "bg-white border-navy/10 text-navy",
    desc: "Un sujet reçoit des ajouts substantiels dans une édition avant que des ajouts équivalents ne soient observés ailleurs.",
    example:
      "Ren Ito, documenté dans l’édition japonaise avant les articles anglais et français.",
    route: "/entity/demo-japan-goalkeeper",
    btn: "Voir le dossier joueur",
  },
  {
    id: "match_recap",
    label: "RÉCAP MATCH",
    color: "bg-navy text-white border-navy",
    desc: "Un dossier rassemble les histoires validées issues d’une rencontre : faits entrés, divergences, instabilités et éléments stabilisés.",
    route: "/match/demo-france-belgique",
    btn: "Ouvrir un dossier match",
  },
];

export default function StoryTypesMethodologySection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-white border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-8 max-w-3xl">
          <SectionLabel label="04 — CATÉGORIES" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            CE QUE WIKIMATCH
            <br />
            PEUT PUBLIER.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            Chaque histoire publique appartient à une catégorie lisible. La
            catégorie décrit ce qui est démontré, pas ce que l’on imagine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`border p-8 flex flex-col gap-4 shadow-sm relative group transition-colors ${type.color.includes("bg-navy") ? "bg-navy border-navy" : "bg-white hover:border-navy/30 hover:shadow-md"}`}
            >
              <div
                className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-1 w-fit border ${type.color.includes("bg-navy") ? "bg-white/20 text-white border-white/20" : type.color}`}
              >
                {type.label}
              </div>

              <p
                className={`font-sans text-base leading-relaxed ${type.color.includes("bg-navy") ? "text-white/90" : "text-navy/80"}`}
              >
                {type.desc}
              </p>

              {type.example && (
                <div
                  className={`mt-4 pt-4 border-t ${type.color.includes("bg-navy") ? "border-white/10" : "border-navy/5"} font-sans text-sm italic ${type.color.includes("bg-navy") ? "text-white/70" : "text-navy/60"}`}
                >
                  Exemple fictif :<br />
                  {type.example}
                </div>
              )}

              {type.subDesc && (
                <div
                  className={`mt-4 pt-4 border-t ${type.color.includes("bg-navy") ? "border-white/10" : "border-navy/5"} font-sans text-sm ${type.color.includes("bg-navy") ? "text-white/70" : "text-navy/60"} whitespace-pre-line`}
                >
                  {type.subDesc}
                </div>
              )}

              {type.route && type.btn && (
                <div className="mt-auto pt-8">
                  <a
                    href={type.route}
                    className={`font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all ${type.color.includes("bg-navy") ? "text-white hover:text-white/70" : "text-blue-electric hover:text-navy"}`}
                  >
                    {type.btn} <span className="text-lg">→</span>
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
