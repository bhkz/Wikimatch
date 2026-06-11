/**
 * Rendu SVG de la carte hexagonale (pointy-top, axial) — spec §4, DA DESIGN.md.
 * Composant pur et réutilisable : Home (P0), replay (P2), embed, map-preview.
 */

import { useMemo, useRef, useState } from "react";
import { axialToPixel, hexCorners } from "../../lib/hex";
import { colors } from "../design/tokens";

export type MapHex = {
  id: number;
  q: number;
  r: number;
  cityName: string;
  isCapital: boolean;
  owner: string | null;
  state: "owned" | "neutral" | "ruins" | "memorial";
};

export type NationStyle = { color: string; name: string; flag: string };

type Props = {
  hexes: MapHex[];
  nations: ReadonlyMap<string, NationStyle>;
  /** Taille d'un hex en unités SVG. */
  size?: number;
  onHexClick?: (hex: MapHex) => void;
  /** Hexes à mettre en avant (ex : pris cette nuit). */
  highlightIds?: ReadonlySet<number>;
};

const NEUTRAL_FILL = "#D8D4C8"; // sable discret sur océan navy
const RUINS_FILL = "#3A3F4D";
const MEMORIAL_FILL = "#C9A227"; // or — sanctuaire

export default function HexMap({ hexes, nations, size = 10, onHexClick, highlightIds }: Props) {
  const [hovered, setHovered] = useState<MapHex | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { polygons, viewBox } = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const polygons = hexes.map((h) => {
      const { x, y } = axialToPixel(h, size);
      const points = hexCorners(x, y, size * 0.96)
        .map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`)
        .join(" ");
      minX = Math.min(minX, x - size);
      minY = Math.min(minY, y - size);
      maxX = Math.max(maxX, x + size);
      maxY = Math.max(maxY, y + size);
      return { hex: h, x, y, points };
    });
    return {
      polygons,
      viewBox: `${(minX - size).toFixed(0)} ${(minY - size).toFixed(0)} ${(maxX - minX + 2 * size).toFixed(0)} ${(maxY - minY + 2 * size).toFixed(0)}`,
    };
  }, [hexes, size]);

  function fillOf(h: MapHex): string {
    if (h.state === "memorial") return MEMORIAL_FILL;
    if (h.state === "ruins") return RUINS_FILL;
    if (h.state === "neutral" || h.owner === null) return NEUTRAL_FILL;
    return nations.get(h.owner)?.color ?? NEUTRAL_FILL;
  }

  function onMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div className="relative w-full" ref={containerRef} onMouseMove={onMouseMove}>
      <svg viewBox={viewBox} className="w-full h-auto block" style={{ background: colors.navy }} role="img" aria-label="Carte du monde hexagonale">
        {polygons.map(({ hex, points }) => (
          <polygon
            key={hex.id}
            points={points}
            fill={fillOf(hex)}
            stroke={colors.navy}
            strokeWidth={size * 0.06}
            opacity={highlightIds && !highlightIds.has(hex.id) ? 0.55 : 1}
            style={{ cursor: onHexClick ? "pointer" : "default", transition: "opacity 150ms" }}
            onMouseEnter={() => setHovered(hex)}
            onMouseLeave={() => setHovered((prev) => (prev?.id === hex.id ? null : prev))}
            onClick={() => onHexClick?.(hex)}
          />
        ))}
        {/* Capitales : anneau + point, par-dessus les aplats. */}
        {polygons
          .filter(({ hex }) => hex.isCapital)
          .map(({ hex, x, y }) => (
            <g key={`cap-${hex.id}`} pointerEvents="none">
              <circle cx={x} cy={y} r={size * 0.42} fill="none" stroke={hex.state === "memorial" ? colors.navy : colors.cream} strokeWidth={size * 0.1} />
              <circle cx={x} cy={y} r={size * 0.14} fill={hex.state === "memorial" ? colors.navy : colors.cream} />
            </g>
          ))}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 bg-cream text-navy px-3 py-2 font-mono text-xs tracking-widest uppercase border border-navy/10 whitespace-nowrap"
          style={{
            left: cursor.x + 14,
            top: cursor.y + 14,
            transform:
              containerRef.current && cursor.x > containerRef.current.clientWidth - 240
                ? "translateX(calc(-100% - 28px))"
                : undefined,
          }}
          data-testid="hex-tooltip"
        >
          <span className="font-medium">{hovered.cityName}</span>
          {" · "}
          {hovered.state === "neutral" || hovered.owner === null
            ? "Eaux neutres"
            : `${nations.get(hovered.owner)?.flag ?? ""} ${nations.get(hovered.owner)?.name ?? hovered.owner}`}
          {hovered.isCapital && " · Capitale"}
          {hovered.state === "ruins" && " · Ruines"}
          {hovered.state === "memorial" && " · Memorial"}
        </div>
      )}
    </div>
  );
}
