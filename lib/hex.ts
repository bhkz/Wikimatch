/**
 * Géométrie hexagonale — grille pointy-top, coordonnées axiales (q, r).
 * Spec §4.1. Module pur, partagé entre scripts de génération, moteur et front.
 */

export type Axial = { q: number; r: number };

/** Distance hexagonale axiale : (|dq| + |dr| + |dq+dr|) / 2 (spec §4.1). */
export function hexDistance(a: Axial, b: Axial): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** Les 6 directions axiales (pointy-top). */
export const HEX_DIRECTIONS: readonly Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const;

export function hexNeighbors(h: Axial): Axial[] {
  return HEX_DIRECTIONS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
}

/** Clé stable pour Map/Set. */
export function hexKey(h: Axial): string {
  return `${h.q},${h.r}`;
}

export function parseHexKey(key: string): Axial {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

/**
 * Tri lexicographique (q, r) croissant — tie-break final déterministe
 * de la sélection des hexes pris (spec §5.6.4).
 */
export function compareAxial(a: Axial, b: Axial): number {
  return a.q !== b.q ? a.q - b.q : a.r - b.r;
}

/**
 * Conversion axiale → pixel pour le rendu SVG (pointy-top, taille 1).
 * x = sqrt(3) * (q + r/2) ; y = 3/2 * r.
 */
export function axialToPixel(h: Axial, size = 1): { x: number; y: number } {
  return {
    x: size * Math.sqrt(3) * (h.q + h.r / 2),
    y: size * (3 / 2) * h.r,
  };
}

/** Sommets d'un hexagone pointy-top centré en (cx, cy). */
export function hexCorners(cx: number, cy: number, size = 1): Array<{ x: number; y: number }> {
  const corners: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
  }
  return corners;
}
