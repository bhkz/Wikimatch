/**
 * ShareBar (spec §13, principe P4) : Web Share API quand disponible (mobile),
 * sinon copie du lien. Aucune dépendance, aucun tracking.
 */

import { useState } from "react";

type Props = {
  /** Titre passé au partage natif (ex : le récit du match). */
  title: string;
  /** URL à partager ; défaut : l'URL courante. */
  url?: string;
  /** Texte riche optionnel (résumé emoji façon Wordle) joint au partage/à la copie. */
  text?: string;
  /** Inverser les couleurs sur fond sombre (memorial, /fin). */
  onDark?: boolean;
};

export default function ShareBar({ title, url, text, onDark = false }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function share() {
    try {
      await navigator.share({ title, text, url: shareUrl });
    } catch {
      // partage annulé par l'utilisateur : rien à faire
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text ? `${text}\n${shareUrl}` : shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard refusé : l'URL est dans la barre d'adresse
    }
  }

  const base = "font-mono text-[10px] uppercase tracking-widest px-3 py-2 border transition-colors";
  const tone = onDark
    ? "border-cream/20 text-cream/70 hover:text-cream hover:border-cream/50"
    : "border-navy/15 text-navy/60 hover:text-navy hover:border-navy/40";

  return (
    <div className="flex items-center gap-2" data-testid="share-bar">
      {canNativeShare && (
        <button type="button" className={`${base} ${tone}`} onClick={share}>
          Partager ↗
        </button>
      )}
      <button type="button" className={`${base} ${tone}`} onClick={copy}>
        {copied ? "Lien copié ✓" : "Copier le lien"}
      </button>
    </div>
  );
}
