import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AnimatedTextReveal from "../components/AnimatedTextReveal";

export default function Contact() {
  const [formStatus, setFormStatus] = useState<
    "idle" | "submitting" | "success"
  >("idle");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");
    // Simulate a network request
    setTimeout(() => {
      setFormStatus("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-navy text-white selection:bg-white selection:text-navy flex flex-col">
      <SiteHeader />

      <main className="flex-grow pt-32 pb-24 px-4 md:px-8">
        <div className="w-full max-w-screen-xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32">
          <div className="flex-1 flex flex-col gap-12">
            <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide leading-tight">
              <AnimatedTextReveal text="CONTACTER" />
              <AnimatedTextReveal text="LA RÉVISION." delay={0.1} />
            </h1>

            <div className="flex flex-col gap-6 font-sans text-xl text-white/80 leading-relaxed font-light">
              <p>
                Qu'il s'agisse d'un signalement d'erreur statistique dans nos
                relevés, d'une question sur notre méthodologie de détection des
                guerres d'édition, ou simplement d'une demande de contact
                presse.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                  EMAIL DIRECT
                </div>
                <a
                  href="mailto:hello@wikimatch.org"
                  className="font-sans text-2xl text-white hover:text-[#38b000] transition-colors w-fit underline decoration-white/20 underline-offset-8"
                >
                  thomas.david@wikimatch.org
                </a>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white border border-white/10 p-8 shadow-2xl relative">
            <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-navy/30 uppercase tracking-widest select-none pointer-events-none">
              [ TÉLÉTYPE SECURISÉ ] // R26
            </div>
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-cream px-3 py-1 w-fit border border-navy/10 mb-8">
              ENVOYER UNE DÉPÊCHE
            </div>

            {formStatus === "success" ? (
              <div className="flex flex-col gap-4 text-navy py-12">
                <div className="w-12 h-12 bg-[#38b000] text-white flex items-center justify-center font-display text-2xl rounded-full mb-4">
                  ✓
                </div>
                <h3 className="font-display text-3xl uppercase tracking-wide">
                  Message Protocolaire Envoyé.
                </h3>
                <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
                  Vos signaux ont été transmis à l'équipe. Nous analyserons les
                  coordonnées temporelles fournies et nous vous dirigerons vers
                  les bonnes requêtes si nécessaire.
                </p>
                <button
                  onClick={() => setFormStatus("idle")}
                  className="mt-8 border border-navy/20 px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-widest text-navy hover:bg-navy/5 transition-colors w-fit"
                >
                  ÉCRIRE UN AUTRE MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy"
                  >
                    Identifiant (Nom)
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="bg-cream border border-navy/20 px-4 py-3 font-sans text-navy focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30"
                    placeholder="John Doe"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy"
                  >
                    Canal de retour (Email)
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="bg-cream border border-navy/20 px-4 py-3 font-sans text-navy focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="subject"
                    className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy"
                  >
                    Objet de la dépêche
                  </label>
                  <select
                    id="subject"
                    className="bg-cream border border-navy/20 px-4 py-3 font-sans text-navy focus:outline-none focus:border-navy transition-colors appearance-none rounded-none cursor-pointer"
                  >
                    <option>Erreur méthodologique signalée</option>
                    <option>Demande d'interview sportive</option>
                    <option>Demande d'accès au portail API</option>
                    <option>Autre signalement</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="message"
                    className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy"
                  >
                    Message brut
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="bg-cream border border-navy/20 px-4 py-3 font-sans text-navy focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30 resize-y"
                    placeholder="Indiquez ici le lien vers l'article Wikipédia concerné si applicable..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={formStatus === "submitting"}
                  className="mt-4 bg-navy text-white hover:bg-blue-electric transition-colors px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest flex items-center justify-center disabled:opacity-50 disabled:cursor-wait"
                >
                  {formStatus === "submitting"
                    ? "TRANSMISSION..."
                    : "TRANSMETTRE LA DÉPÊCHE"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
