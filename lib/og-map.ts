/**
 * Rendu SVG pur de la carte pour les images de partage (vision P2.D).
 * Même géométrie que HexMap (axial pointy-top) mais en chaîne SVG autonome :
 * consommable par satori/@vercel/og (data-URI) et testable hors DOM.
 */

import { axialToPixel, hexCorners } from "./hex";

export type OgMapHex = { q: number; r: number; fill: string };

export const OG_MAP_COLORS = {
  background: "#0B1021",
  neutral: "#B8B2A2",
  ruins: "#3A3F4D",
  memorial: "#C9A227",
} as const;

/** Couleur d'un hex selon son état (mêmes règles que HexMap.fillOf). */
export function ogFill(
  state: string,
  owner: string | null,
  colorByCode: ReadonlyMap<string, string>,
): string {
  if (state === "memorial") return OG_MAP_COLORS.memorial;
  if (state === "ruins") return OG_MAP_COLORS.ruins;
  if (state === "neutral" || owner === null) return OG_MAP_COLORS.neutral;
  return colorByCode.get(owner) ?? OG_MAP_COLORS.neutral;
}

/** Carte complète en SVG autonome, ajustée dans width×height. */
export function ogMapSvg(hexes: OgMapHex[], width: number, height: number): string {
  if (hexes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`;
  }
  const size = 10;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const centers = hexes.map((h) => {
    const { x, y } = axialToPixel(h, size);
    minX = Math.min(minX, x - size);
    minY = Math.min(minY, y - size);
    maxX = Math.max(maxX, x + size);
    maxY = Math.max(maxY, y + size);
    return { x, y, fill: h.fill };
  });
  const worldW = maxX - minX;
  const worldH = maxY - minY;
  const scale = Math.min(width / worldW, height / worldH);
  const offsetX = (width - worldW * scale) / 2 - minX * scale;
  const offsetY = (height - worldH * scale) / 2 - minY * scale;

  const polygons = centers
    .map(({ x, y, fill }) => {
      const points = hexCorners(x * scale + offsetX, y * scale + offsetY, size * scale * 0.94)
        .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
        .join(" ");
      return `<polygon points="${points}" fill="${fill}"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${polygons}</svg>`;
}

/** Data-URI utilisable comme src d'<img> dans satori. */
export function ogMapDataUri(hexes: OgMapHex[], width: number, height: number): string {
  const svg = ogMapSvg(hexes, width, height);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
