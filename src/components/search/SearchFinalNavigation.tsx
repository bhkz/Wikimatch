import { Link } from "react-router-dom";

export default function SearchFinalNavigation() {
  const links = [
    { label: "Histoires", route: "/stories", desc: "Le récit du tournoi." },
    { label: "Matchs", route: "/matches", desc: "Les dossiers par rencontre." },
    { label: "Explorer", route: "/explorer", desc: "Les sujets sur la carte." },
    {
      label: "Observatoire",
      route: "/observatoire",
      desc: "L'outil de vérification.",
    },
  ];

  return (
    <section className="py-24 px-4 md:px-8 border-t border-white/10 relative overflow-hidden bg-navy">
      {/* Background decoration */}
      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none w-1/2 h-full"></div>

      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12 relative z-10">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide leading-tight text-white">
            TROUVER UNE ENTRÉE.
            <br />
            PUIS SUIVRE LE RÉCIT.
          </h2>
          <p className="font-sans text-xl text-white/70 leading-relaxed font-light mt-2 max-w-lg">
            Parcourez les histoires publiées, ouvrez les dossiers de match,
            explorez les sujets documentés ou inspectez les traces publiques.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.route}
              className="bg-white/5 border border-white/10 p-8 flex flex-col gap-8 hover:bg-white/10 hover:border-blue-electric transition-all group relative"
            >
              <h3 className="font-display text-2xl uppercase tracking-wide text-white group-hover:text-blue-electric transition-colors">
                {link.label}
              </h3>
              <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest mt-auto">
                {link.desc}
              </span>

              <span className="absolute bottom-8 right-8 text-white/20 group-hover:text-blue-electric transition-colors group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
