export default function MapTrustSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-white relative">
      <div className="w-full max-w-screen-md mx-auto flex flex-col gap-8 text-center relative border border-white/20 p-8 md:p-12">
          
          <h2 className="font-display text-4xl md:text-5xl uppercase tracking-wide leading-tight">
            NOUS CARTOGRAPHIONS DES CONCEPTS, PAS DES ADRESSES IP.
          </h2>

          <p className="font-sans text-lg text-white/70 leading-relaxed font-light">
            Dans la démonstration WikiMatch, l'Atlas de l'Explorer est une visualisation symbolique. Les points d'ancrage y renvoient au siège géographique des sujets (la capitale d'un pays engagé ou d'un club). L'interface ne traque et n'expose jamais les localisations réelles des contributeurs Wikipédia.
          </p>

          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#2a9d8f] mt-4">
             ENGAGEMENT DE CONCEPTION DE L'INTERFACE
          </div>
          
      </div>
    </section>
  );
}
