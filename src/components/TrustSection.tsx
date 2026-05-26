import { Link } from "react-router-dom";

export default function TrustSection() {
  return (
    <section className="py-32 px-4 md:px-8 bg-cream">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-24">
        <h2 className="font-display text-5xl md:text-7xl lg:text-[8rem] uppercase leading-none text-navy text-center">
          OBSERVER SANS SURINTERPRÉTER.
        </h2>

        <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full">
          {[
            {
              title: "LES SOURCES RESTENT ACCESSIBLES",
              text: "Chaque histoire renvoie aux modifications Wikipédia observées."
            },
            {
              title: "LES LANGUES NE SONT PAS DES PAYS",
              text: "Une édition linguistique ne représente pas l’opinion d’une population."
            },
            {
              title: "L’IA N’EST PAS LA RÉDACTRICE EN CHEF",
              text: "Elle pourra aider à traduire ou rapprocher des changements. La publication repose sur une validation éditoriale."
            }
          ].map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-4 md:gap-12 pb-12 border-b border-navy/10 items-start md:items-baseline">
              <h3 className="font-mono text-sm md:text-base font-bold uppercase tracking-widest text-navy md:w-1/3">
                {item.title}
              </h3>
              <p className="font-sans text-xl md:text-3xl text-navy/80 font-light leading-tight md:w-2/3">
                {item.text}
              </p>
            </div>
          ))}
          
          <div className="flex justify-center mt-8">
            <Link to="/methodology" className="text-navy font-mono text-sm tracking-widest uppercase hover:text-blue-electric transition-colors underline underline-offset-8 decoration-2">
              Découvrir la méthodologie complète
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
