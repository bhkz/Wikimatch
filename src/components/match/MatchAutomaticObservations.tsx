import { Link } from "react-router-dom";
import type {
  MatchAutomaticObservationCard,
  MatchRehearsalMonitoring,
} from "../../data/PublicDataProvider";

interface Props {
  observations: MatchAutomaticObservationCard[];
  monitoring: MatchRehearsalMonitoring | null | undefined;
}

/**
 * Surface mobile de contrôle du rehearsal PSG — Arsenal.
 *
 *   - Si une observation niveau 2 conforme existe : on l'affiche (carte +
 *     CTA vers /observation/:slug).
 *   - Sinon, on choisit un état OBSERVABLE basé sur ce que la base permet
 *     de prouver, pas sur des suppositions :
 *       1. périmètre non armé → "COLLECTE NON ACTIVÉE" ;
 *       2. armé + au moins une trace reçue → "MODIFICATIONS SOURCES REÇUES" ;
 *       3. armé sans trace → "PÉRIMÈTRE ARMÉ · AUCUNE OBSERVATION PUBLIÉE" ;
 *       4. pas de signal monitoring fiable → message neutre.
 *
 * Aucun état "pipeline_error" / "pipeline OK" n'est inventé : la base ne
 * possède ni heartbeat ni status_worker. On affiche uniquement ce qui est
 * vérifiable.
 */
export default function MatchAutomaticObservations({
  observations,
  monitoring,
}: Props) {
  const hasObservations = observations.length > 0;

  return (
    <section className="py-12 px-4 md:py-16 md:px-8 bg-white border-t border-b border-navy/10">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="font-display text-2xl md:text-4xl uppercase text-navy mb-6 md:mb-8 tracking-wide">
          Observations automatiques
        </h2>

        {hasObservations ? (
          <ObservationsList observations={observations} />
        ) : (
          <NoObservationsState monitoring={monitoring} />
        )}

        <p className="mt-8 font-mono text-[10px] md:text-[11px] uppercase tracking-widest text-navy/40 leading-relaxed">
          L'absence de modification ou d'observation ne permet pas, à elle
          seule, de conclure à une erreur de collecte.
        </p>
      </div>
    </section>
  );
}

function ObservationsList({
  observations,
}: {
  observations: MatchAutomaticObservationCard[];
}) {
  return (
    <ul className="flex flex-col gap-4">
      {observations.map((obs) => (
        <li
          key={obs.slug}
          className="bg-cream border border-navy/15 p-5 md:p-6 shadow-sm"
        >
          <div className="font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-blue-electric mb-3">
            {obs.badgeLabel}
          </div>
          <h3 className="font-display text-xl md:text-2xl uppercase text-navy leading-tight mb-3">
            {obs.title}
          </h3>
          {obs.excerpt && (
            <p className="font-sans text-sm font-light text-navy/70 leading-relaxed mb-4">
              {obs.excerpt}
            </p>
          )}
          <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mb-4">
            {(obs.languages || []).join(" · ")}
            {obs.languages?.length > 0 && obs.sourceCount > 0 ? " · " : ""}
            {obs.sourceCount > 0
              ? `${obs.sourceCount} source${obs.sourceCount > 1 ? "s" : ""}`
              : ""}
          </div>
          <Link
            to={obs.detailRoute}
            className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 bg-navy text-cream font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-blue-electric transition-colors"
          >
            Voir l'observation et ses sources →
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatTraceTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function NoObservationsState({
  monitoring,
}: {
  monitoring: MatchRehearsalMonitoring | null | undefined;
}) {
  if (!monitoring) {
    return (
      <StatusCard
        title="Aucune observation automatique publiée pour le moment"
        body="Aucun signal de collecte fiable n'est exposé pour ce match. Une observation automatique apparaîtra ici si elle remplit les critères de publication."
      />
    );
  }

  if (!monitoring.isFullyArmed) {
    return (
      <StatusCard
        title="Collecte non activée"
        body={
          monitoring.selectedMatchArticles > 0
            ? `Les ${monitoring.selectedMatchArticles} pages de match sélectionnées ne sont pas encore toutes armées pour la collecte (${monitoring.enabledMatchArticles}/${monitoring.selectedMatchArticles}).`
            : "Les pages de match sélectionnées ne sont pas encore armées pour la collecte."
        }
      />
    );
  }

  if (monitoring.lastTraceObservedAt) {
    const time = formatTraceTime(monitoring.lastTraceObservedAt);
    return (
      <StatusCard
        title="Modifications sources reçues · aucune observation publiable"
        body={
          time
            ? `Dernière modification Wikipédia reçue sur une page de match sélectionnée : ${time}. Cela confirme la réception d'au moins une modification source, pas l'existence d'une observation publiable.`
            : "Au moins une modification Wikipédia a été reçue sur une page de match sélectionnée. Cela confirme la réception d'une modification source, pas l'existence d'une observation publiable."
        }
      />
    );
  }

  return (
    <StatusCard
      title="Périmètre armé · aucune observation publiée"
      body="Les pages de match sélectionnées sont configurées pour la collecte. Aucune observation automatique remplissant les critères de publication n'est visible pour le moment."
    />
  );
}

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-cream border border-navy/15 p-6 md:p-8">
      <div className="font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-navy/60 mb-3">
        État observable
      </div>
      <h3 className="font-display text-lg md:text-xl uppercase text-navy mb-3 leading-tight">
        {title}
      </h3>
      <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
        {body}
      </p>
    </div>
  );
}
