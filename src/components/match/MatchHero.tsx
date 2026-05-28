import { motion } from "motion/react";
import { isLiveMode } from "../../data";
import { MatchContext } from "../../types";
import MatchDemoBadge from "./MatchDemoBadge";

export default function MatchHero({ match }: { match: MatchContext }) {
  let title = "COMMENT CE MATCH\nS'EST ECRIT\nSUR WIKIPEDIA.";
  let subtitle = isLiveMode
    ? "WikiMatch affiche uniquement les donnees publiees par le pipeline live : articles suivis, traces observees et histoires validees."
    : "Resultat integre, editions comparees, incident raconte differemment : voici les histoires fictives publiees autour de cette rencontre.";

  if (match.state === "live") {
    title = "COMMENT CE MATCH\nENTRE DANS WIKIPEDIA.";
    subtitle = "WikiMatch observe les articles suivis. Aucune nouvelle histoire n'est publiee tant qu'un changement substantiel n'est pas verifie.";
  } else if (match.state === "pre_match") {
    title = "COMMENT CE MATCH\nSERA SUIVI\nSUR WIKIPEDIA.";
    subtitle = match.isDemo
      ? "Le dispositif de surveillance est pret. Les modifications Wikimedia rattachees aux articles suivis apparaitront automatiquement apres ingestion."
      : "Le périmètre d'observation est préparé. Douze articles en français, anglais et espagnol ont été sélectionnés pour suivre le match, les deux clubs et la compétition. La collecte dédiée sera activée au moment du test.";
  }

  return (
    <section className="relative min-h-[88svh] md:min-h-screen w-full flex flex-col justify-end overflow-hidden pt-32 pb-16 px-4 md:px-8 bg-navy text-cream">
      <motion.div
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0 z-0 bg-navy"
      >
        <img
          src="https://images.unsplash.com/photo-1518605368461-1ee0670d8a43?q=80&w=2600&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-25 grayscale brightness-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/40" />
        <div className="absolute inset-0 bg-grid-pattern-light opacity-5 mix-blend-overlay" />
      </motion.div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-12 md:gap-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative">
          <div className="flex flex-col gap-4 items-start">
            <MatchDemoBadge />
            <div className="font-mono text-[10px] sm:text-xs text-blue-electric uppercase tracking-widest font-bold">
              {match.isDemo ? (
                `DOSSIER MATCH · COUPE DU MONDE 2026 ${match.state === "live" ? "· EN COURS" : match.state === "pre_match" ? "· A VENIR" : ""}`
              ) : (
                `MATCH TEST · ${match.competitionLabel?.toUpperCase() || "UEFA CHAMPIONS LEAGUE 2025/26"} ${match.state === "live" ? "· EN COURS" : match.state === "pre_match" ? "· À VENIR · COLLECTE NON ACTIVÉE" : ""}`
              )}
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-1 font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream/50">
            <span>{match.stageLabel}</span>
            <span>{match.dateLabel} · {match.timeLabel}</span>
            {match.venueLabel && <span>{match.venueLabel}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <div className="flex items-center gap-4 text-white">
            <h2 className="font-display text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10vw] leading-none uppercase tracking-wide">
              {match.homeTeam.name}
            </h2>
            {match.state !== "pre_match" && match.score && (
              <span className="font-display text-[3rem] sm:text-[4rem] md:text-[6rem] text-blue-electric">
                {match.score[0]}
              </span>
            )}
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="w-64 md:w-96 h-[2px] bg-blue-electric origin-left relative mb-2"
          >
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy px-4 font-mono text-xs uppercase text-cream/50 tracking-widest">
              VS
            </span>
          </motion.div>

          <div className="flex items-center gap-4 text-white">
            <h2 className="font-display text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10vw] leading-none uppercase tracking-wide text-cream/70">
              {match.awayTeam.name}
            </h2>
            {match.state !== "pre_match" && match.score && (
              <span className="font-display text-[3rem] sm:text-[4rem] md:text-[6rem] text-blue-electric">
                {match.score[1]}
              </span>
            )}
          </div>

          <div className="font-mono text-sm uppercase tracking-widest font-bold mt-4 flex items-center gap-3">
            {match.state === "live" && <span className="w-2 h-2 rounded-full bg-red-signal animate-pulse" />}
            <span className={match.state === "live" ? "text-red-signal" : "text-blue-electric"}>
              {match.state === "live" ? `${match.minute ?? "LIVE"}` : match.finalStatus}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mt-8 border-t border-cream/10 pt-8">
          <div className="flex flex-col gap-6 md:w-2/3">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide leading-[0.9] text-white">
              {title.split("\n").map((line, index) => (
                <span key={line} className="block overflow-hidden pb-1">
                  <motion.span
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="block"
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="max-w-xl font-sans text-lg md:text-xl text-cream/70 leading-relaxed font-light"
            >
              {subtitle}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex flex-col gap-4 w-full md:w-auto"
          >
            {match.state === "post_match" ? (
              <button className="bg-blue-electric text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-sm hover:bg-white hover:text-blue-electric transition-colors w-full md:w-auto text-center">
                Voir les observations
              </button>
            ) : match.state === "live" ? (
              <div className="bg-navy border border-cream/20 p-4 w-full md:w-64 flex items-center justify-center">
                <span className="font-mono text-[10px] text-cream/50 uppercase tracking-widest text-center">
                  Ecriture en cours...
                  <br />
                  Flux sous surveillance
                </span>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 right-8 z-10 hidden md:flex flex-col items-center gap-2 text-cream/40"
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-cream/40 to-transparent animate-pulse" />
      </motion.div>
    </section>
  );
}
