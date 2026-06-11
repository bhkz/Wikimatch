import { Link } from "react-router-dom";
import { FlagEmoji } from "../components/FlagEmoji";
import SectionLabel from "../components/SectionLabel";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { useAtlasData } from "../lib/atlas";

export default function Finale() {
  const { data, error } = useAtlasData();
  const champion = data?.nations.find((n) => n.status === "champion");

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement...</p>}
        {data && !champion && (
          <>
            <SectionLabel label="Ouverture après la finale" />
            <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-8">
              Le monde n'est pas encore figé
            </h1>
            <p className="font-light text-navy/70 max-w-xl leading-relaxed">
              Cette page s'ouvrira quand la finale aura désigné le champion et que la carte aura lancé sa vague finale.
            </p>
            <Link to="/tableau" className="inline-block mt-8 font-mono text-xs uppercase font-bold tracking-widest hover:text-blue-electric">
              Suivre le tableau →
            </Link>
          </>
        )}
        {champion && (
          <>
            <SectionLabel label="Carte finale" />
            <h1 className="font-display text-5xl md:text-8xl uppercase leading-[0.9] tracking-wide mt-4 mb-8">
              <FlagEmoji flag={champion.flag} /> {champion.name_fr}
            </h1>
            <p className="font-light text-navy/70 max-w-xl leading-relaxed">
              Champion du monde. Les ruines et terres neutres sont passées à ses couleurs ; seuls les memorials demeurent.
            </p>
            <div className="mt-10 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-widest">
              <Link to="/" className="hover:text-blue-electric">Voir la carte finale →</Link>
              <Link to="/memorial" className="hover:text-blue-electric">Voir le memorial →</Link>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
