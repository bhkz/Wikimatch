/**
 * Mémoire des lieux (vision P2.B) — biographie d'un hexagone générée depuis
 * atlas.hex_events (append-only). Templates FERMÉS, vocabulaire sportif-ludique
 * (spec §22.3) : chaque ville raconte son tournoi, du premier jour au memorial.
 */

export type StoryEventInput = {
  type: string; // HexEventType côté moteur
  from_owner: string | null;
  to_owner: string | null;
  match_id: number | null;
  created_at: string; // ISO
};

export type StoryHexInput = {
  cityName: string;
  isCapital: boolean;
  originalOwner: string | null;
};

export type StoryLabel = { flag: string; name: string };

export type StoryEntry = {
  dateIso: string | null; // null = ouverture (avant le tournoi)
  text: string;
  matchId: number | null;
};

function label(code: string | null, labels: ReadonlyMap<string, StoryLabel>): string {
  if (!code) return "personne";
  const l = labels.get(code);
  return l ? `${l.flag} ${l.name}` : code;
}

/** Chronologie complète d'un hex : ouverture + un paragraphe par événement. */
export function hexStory(
  hex: StoryHexInput,
  events: StoryEventInput[],
  labels: ReadonlyMap<string, StoryLabel>,
): StoryEntry[] {
  const entries: StoryEntry[] = [];
  const capitale = hex.isCapital ? " — capitale" : "";

  entries.push({
    dateIso: null,
    matchId: null,
    text: hex.originalOwner
      ? `${hex.cityName}${capitale} entre dans le tournoi sous les couleurs de ${label(hex.originalOwner, labels)}.`
      : `${hex.cityName} entre dans le tournoi en eaux neutres : elle attend un premier vainqueur.`,
  });

  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const ev of sorted) {
    const from = label(ev.from_owner, labels);
    const to = label(ev.to_owner, labels);
    let text: string;
    switch (ev.type) {
      case "captured":
        text = `Prise par ${to} aux dépens de ${from}.`;
        break;
      case "neutral_claimed":
        text = `Sort des eaux neutres : ${to} plante son drapeau.`;
        break;
      case "inherited":
        text = `Recueillie par ${to} au départ de ${from}.`;
        break;
      case "ruined":
        text = `La Grande Fracture la laisse en ruines : terre à reconquérir.`;
        break;
      case "memorial":
        text = `Sanctuarisée : memorial de ${label(ev.from_owner ?? hex.originalOwner, labels)}, intouchable à jamais.`;
        break;
      case "world_conquered":
        text = `Le monde a un champion : elle passe aux couleurs de ${to}.`;
        break;
      case "admin_fix":
        text = `Correction officielle : rendue à ${to}.`;
        break;
      default:
        text = `Changement de mains : ${from} → ${to}.`;
    }
    entries.push({ dateIso: ev.created_at, matchId: ev.match_id, text });
  }
  return entries;
}

/** Résumé d'une ligne pour les tooltips : dernier fait marquant. */
export function hexStoryHeadline(
  hex: StoryHexInput,
  events: StoryEventInput[],
  labels: ReadonlyMap<string, StoryLabel>,
): string {
  const story = hexStory(hex, events, labels);
  return story[story.length - 1].text;
}
