import { methodologyVersions } from "../../mockMethodologyData";

export default function CorrectionsAndVersioningSection() {
  const handleAlert = () =>
    alert("Le canal de correction sera connecté après stabilisation de la V2.");
  const handleSourceAlert = () =>
    alert("Le dépôt public de la V2 sera relié après audit et stabilisation.");

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] mb-2">
            12 — RESPONSABILITÉ
          </div>
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            UNE MÉTHODE
            <br />
            DOIT POUVOIR
            <br />
            ÊTRE CORRIGÉE.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            Si WikiMatch devient public pendant le tournoi, la méthodologie
            devra évoluer de manière visible : règles de comparaison, limites
            connues, corrections apportées et historique des changements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-navy/10 p-8 flex flex-col gap-6 shadow-sm">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-cream px-3 py-1 w-fit border border-navy/10">
              SIGNALER UNE ERREUR
            </div>
            <ul className="flex flex-col gap-3 font-sans text-lg text-navy">
              <li className="flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e63946]"></div>
                Une source manque ?
              </li>
              <li className="flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e63946]"></div>
                Une traduction semble incorrecte ?
              </li>
              <li className="flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e63946]"></div>
                Une formulation va trop loin ?
              </li>
            </ul>
            <p className="font-sans text-sm text-navy/70 leading-relaxed max-w-sm mt-4">
              Un canal de correction devra être disponible dans la version
              connectée.
            </p>
            <button
              onClick={handleAlert}
              className="mt-4 bg-transparent border border-navy/20 text-navy px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-navy transition-colors w-fit"
            >
              [CONTACT À CONNECTER]
            </button>
          </div>

          <div className="bg-white border border-navy/10 p-8 flex flex-col gap-8 shadow-sm">
            <div className="flex flex-col gap-6">
              {methodologyVersions.map((version, idx) => (
                <div
                  key={version.version}
                  className={`flex flex-col gap-4 ${idx !== methodologyVersions.length - 1 ? "pb-6 border-b border-navy/10" : ""}`}
                >
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-display text-2xl text-navy">
                      {version.version}
                    </span>
                    <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/50 px-2 py-0.5 border border-navy/10">
                      {version.dateLabel}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 ${version.status === "MÉTHODE CIBLE" ? "bg-[#38b000] text-white" : "bg-navy/10 text-navy/60"}`}
                    >
                      {version.status}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2 font-sans text-sm text-navy/80">
                    {version.changes.map((change, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-navy/30">-</span> {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={handleSourceAlert}
              className="bg-transparent text-blue-electric font-mono text-[10px] uppercase font-bold tracking-widest hover:text-navy transition-colors flex items-center justify-start gap-2 pt-4 border-t border-navy/5"
            >
              VOIR LE CODE SOURCE →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
