/**
 * /methodo (spec §12, §22) : les règles du jeu, honnêtes et complètes.
 * Texte statique relu à la main — vocabulaire sportif-ludique uniquement.
 */

import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";

const RULES: Array<{ title: string; body: string }> = [
  {
    title: "Le principe",
    body: "Chaque nation qualifiée démarre avec 10 territoires hexagonaux autour de sa vraie capitale, sur un planisphère stylisé de 682 hexes. Les résultats réels des matchs — et rien d'autre — redessinent les frontières. Aucun compte, aucun pari, aucun argent : un pur spectacle de données.",
  },
  {
    title: "Gains par victoire",
    body: "Phase de groupes : 2 territoires de base. 16es et 8es : 4. Quarts : 5. Demies : 6. Petite finale : 3 (fixe). Finale : 10 (fixe). Bonus : +1 par but d'écart au-delà du premier, plafonné à +2. Une victoire aux tirs au but vaut une victoire sans bonus.",
  },
  {
    title: "La surextension impériale",
    body: "Le gain est multiplié par (territoire médian des nations en vie ÷ territoire du vainqueur), borné entre ×0,5 et ×2. Les petits prennent plus, les empires s'essoufflent — c'est la mécanique d'équilibre du jeu. Le gain final est toujours entre 1 et 12.",
  },
  {
    title: "Quels territoires changent de main ?",
    body: "Le perdant cède d'abord ses marches : les hexes les plus éloignés de sa capitale, en priorité ceux qu'il avait conquis, en privilégiant ceux qui touchent le territoire du vainqueur. La capitale est imprenable tant que la nation est en vie. Un match nul : chaque équipe prend 1 hex neutre près de chez elle.",
  },
  {
    title: "L'élimination",
    body: "En phase à élimination directe, le perdant disparaît de la carte : sa capitale devient un memorial doré, intouchable à jamais ; le vainqueur hérite de la moitié de ses territoires restants ; le reste tombe en ruines. Les perdants des demi-finales ne tombent qu'après la petite finale.",
  },
  {
    title: "Le sacre",
    body: "À la fin de la finale, toutes les ruines et terres neutres passent aux couleurs du champion, par vagues depuis sa capitale. Seuls les memorials demeurent. La carte est alors figée pour l'éternité.",
  },
  {
    title: "Les données",
    body: "Calendrier et scores proviennent de football-data.org, vérifiés et confirmés 5 minutes après le coup de sifflet final avant d'être appliqués. Chaque mouvement de la carte est journalisé et rejouable : l'état complet peut être reconstruit depuis l'historique des événements, publiquement.",
  },
  {
    title: "Les probabilités",
    body: "Après chaque résultat, 10 000 fins de phase de groupes sont simulées avec un modèle public basé sur les points FIFA : issue du match, buts simulés pour les départages, puis top 2 et huit meilleurs troisièmes. Les phrases de qualification de la dernière journée viennent d'une énumération exacte des issues restantes.",
  },
  {
    title: "Le Drama-mètre",
    body: "Chaque match à venir reçoit un score de 0 à 100. Il combine le swing potentiel sur les chances de qualification, l'équilibre des forces, le risque d'élimination, l'importance du moment et le potentiel de surprise. L'objectif est simple : savoir quel match regarder en priorité.",
  },
  {
    title: "Ce que ce site n'est pas",
    body: "Une carte géopolitique. Les frontières, noms et couleurs sont un terrain de jeu graphique sans aucune lecture politique. Site indépendant, non affilié à la FIFA ni à aucune fédération. Aucune marque ni écusson officiel n'est utilisé — uniquement des drapeaux Unicode.",
  },
];

export default function Methodo() {
  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Comment ça marche" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-12">
          Les règles du jeu
        </h1>
        <div className="grid md:grid-cols-2 gap-px bg-navy/10 border border-navy/10 max-w-5xl">
          {RULES.map((rule, i) => (
            <article key={rule.title} className="bg-cream p-8">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mb-3">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h2 className="font-display text-2xl uppercase tracking-wide mb-3">{rule.title}</h2>
              <p className="font-light text-navy/70 leading-relaxed text-sm">{rule.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-12 font-mono text-[10px] uppercase tracking-widest text-navy/40 max-w-2xl">
          Moteur déterministe versionné (atlas_engine_v1) · constantes publiques ·
          historique des événements rejouable · données football-data.org
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
