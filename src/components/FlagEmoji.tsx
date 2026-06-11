/**
 * Drapeaux : Windows ne rend pas les emoji de drapeaux (lettres "FR" à la
 * place). On affiche le SVG Twemoji correspondant (CC-BY 4.0), avec repli
 * texte si le CDN est indisponible. Conforme spec §22 : aucun écusson, aucun
 * visuel FIFA — uniquement des drapeaux Unicode.
 */

import { type ReactNode, useState } from "react";

const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg";

/** Codepoints d'un emoji → nom de fichier Twemoji (ex: "1f1eb-1f1f7"). */
function twemojiFile(emoji: string): string {
  return [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f") // sélecteur de variation, absent des noms twemoji
    .join("-");
}

export function FlagEmoji({ flag, className }: { flag: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!flag) return null;
  if (failed) return <span className={className}>{flag}</span>;
  return (
    <img
      src={`${TWEMOJI_BASE}/${twemojiFile(flag)}.svg`}
      alt={flag}
      draggable={false}
      onError={() => setFailed(true)}
      className={`inline-block w-[1.15em] h-[1.15em] align-[-0.15em] select-none ${className ?? ""}`}
    />
  );
}

/**
 * Drapeaux (séquences d'indicateurs régionaux ou tag-sequences 🏴…) :
 * détectés dans un texte libre (récits stockés) et remplacés par Twemoji.
 */
const FLAG_REGEX = /(\p{Regional_Indicator}{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]+\u{E007F})/gu;

export function TextWithFlags({ text }: { text: string }): ReactNode {
  // Avec un groupe capturant, split place les drapeaux aux indices impairs.
  const parts = text.split(FLAG_REGEX);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <FlagEmoji key={i} flag={part} /> : <span key={i}>{part}</span>,
      )}
    </>
  );
}
