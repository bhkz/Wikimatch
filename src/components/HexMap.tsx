/**
 * Rendu SVG de la carte hexagonale (pointy-top, axial), spec §4, DA DESIGN.md.
 * Composant pur et réutilisable : Home (P0), replay (P2), embed, map-preview.
 *
 * Interactions (§13) : hover desktop = tooltip au curseur ; molette/pinch =
 * zoom ; drag = pan (une fois zoomé) ; au doigt, un tap SÉLECTIONNE l'hex
 * (panneau fixe sous la carte) et le panneau porte le lien vers la nation —
 * jamais de navigation aveugle au premier contact.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { axialToPixel, hexCorners } from "../../lib/hex";
import { colors } from "../design/tokens";
import { FlagEmoji } from "./FlagEmoji";

export type MapHex = {
  id: number;
  q: number;
  r: number;
  cityName: string;
  isCapital: boolean;
  /** Propriétaire d'origine (null = neutre) — sert au memorial et aux fiches nation. */
  originalOwner?: string | null;
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
  /** Nations à garder lisibles en priorité, par exemple sur une fiche pays. */
  focusOwners?: ReadonlySet<string>;
  /** Nations dont un match est EN COURS : leurs territoires pulsent. */
  liveOwners?: ReadonlySet<string>;
  /** Nations fraîchement éliminées : leurs anciens territoires s'éteignent (Grande Fracture). */
  fractureOwners?: ReadonlySet<string>;
};

type ViewBox = { x: number; y: number; w: number; h: number };

const MAX_ZOOM = 8;

export default function HexMap({ hexes, nations, size = 10, onHexClick, highlightIds, focusOwners, liveOwners, fractureOwners }: Props) {
  const [hovered, setHovered] = useState<MapHex | null>(null);
  const [selected, setSelected] = useState<MapHex | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [view, setView] = useState<ViewBox | null>(null); // null = vue monde
  const [changedIds, setChangedIds] = useState<ReadonlySet<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; lastDist: number | null }>({ moved: false, lastDist: null });
  const prevFrame = useRef<Map<number, string> | null>(null);

  // Transitions : un hex dont le propriétaire/état change (replay, scrub,
  // résolution en direct) flashe brièvement — on VOIT où la carte bouge.
  useEffect(() => {
    const frame = new Map(hexes.map((h) => [h.id, `${h.owner ?? ""}|${h.state}`]));
    const prev = prevFrame.current;
    prevFrame.current = frame;
    if (!prev) return;
    const changed = new Set<number>();
    for (const [id, sig] of frame) {
      if (prev.has(id) && prev.get(id) !== sig) changed.add(id);
    }
    if (changed.size === 0) return;
    setChangedIds(changed);
    const timer = setTimeout(() => setChangedIds(new Set()), 1300);
    return () => clearTimeout(timer);
  }, [hexes]);

  const { polygons, fullView } = useMemo(() => {
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
    const fullView: ViewBox = {
      x: minX - size,
      y: minY - size,
      w: maxX - minX + 2 * size,
      h: maxY - minY + 2 * size,
    };
    return { polygons, fullView };
  }, [hexes, size]);

  const vb = view ?? fullView;
  const zoomed = view !== null && view.w < fullView.w * 0.98;

  /** Borne la vue dans le monde et neutralise les zooms ≈ 1. */
  function clampView(next: ViewBox): ViewBox | null {
    const w = Math.min(Math.max(next.w, fullView.w / MAX_ZOOM), fullView.w);
    const h = w * (fullView.h / fullView.w);
    if (w >= fullView.w * 0.98) return null;
    return {
      x: Math.min(Math.max(next.x, fullView.x), fullView.x + fullView.w - w),
      y: Math.min(Math.max(next.y, fullView.y), fullView.y + fullView.h - h),
      w,
      h,
    };
  }

  /** Point client → coordonnées SVG de la vue courante. */
  function toSvgPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: vb.x, y: vb.y };
    return {
      x: vb.x + ((clientX - rect.left) / rect.width) * vb.w,
      y: vb.y + ((clientY - rect.top) / rect.height) * vb.h,
    };
  }

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const p = toSvgPoint(clientX, clientY);
    setView((prev) => {
      const cur = prev ?? fullView;
      const w = cur.w * factor;
      const h = cur.h * factor;
      return clampView({ x: p.x - (p.x - cur.x) * factor, y: p.y - (p.y - cur.y) * factor, w, h });
    });
  }

  function zoomCenter(factor: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }

  // Molette : listener natif non-passif (React attache wheel en passif → preventDefault inopérant).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.18 : 1 / 1.18);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vb.x, vb.y, vb.w, vb.h, fullView.w, fullView.h]);

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved = false;
    gesture.current.lastDist = null;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) {
      // Souris sans bouton : tooltip au curseur.
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }
    const pts = [...pointers.current.entries()];
    if (pts.length === 2) {
      // Pinch : zoom sur le centre des deux doigts.
      const other = pts.find(([id]) => id !== e.pointerId)![1];
      const dist = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (gesture.current.lastDist !== null && dist > 0) {
        const factor = gesture.current.lastDist / dist;
        if (Math.abs(1 - factor) > 0.01) {
          zoomAt((e.clientX + other.x) / 2, (e.clientY + other.y) / 2, factor);
          gesture.current.moved = true;
        }
      }
      gesture.current.lastDist = dist;
    } else if (zoomed) {
      // Pan (un seul pointeur, vue zoomée).
      const dx = ((e.clientX - prev.x) / (svgRef.current?.getBoundingClientRect().width ?? 1)) * vb.w;
      const dy = ((e.clientY - prev.y) / (svgRef.current?.getBoundingClientRect().height ?? 1)) * vb.h;
      if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 3) gesture.current.moved = true;
      setView((cur) => (cur ? clampView({ ...cur, x: cur.x - dx, y: cur.y - dy }) : cur));
    } else if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 8) {
      gesture.current.moved = true;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    gesture.current.lastDist = null;
  }

  function onHexTap(hex: MapHex) {
    if (gesture.current.moved) return; // fin de drag/pinch, pas un tap
    // Souris : clic = navigation directe (le hover a déjà montré le tooltip).
    if (!isTouchScreen()) {
      onHexClick?.(hex);
      return;
    }
    // Doigt : 1er tap = sélection (panneau), 2e tap sur le même hex = navigation.
    if (selected?.id === hex.id) onHexClick?.(hex);
    else setSelected(hex);
  }

  const hoverOwner = hovered?.state === "owned" && hovered.owner ? hovered.owner : null;
  const requestedFocusOwners =
    focusOwners && focusOwners.size > 0 ? focusOwners : hoverOwner ? new Set([hoverOwner]) : undefined;
  const focusedOwners =
    requestedFocusOwners &&
    polygons.some(({ hex }) => hex.state === "owned" && hex.owner !== null && requestedFocusOwners.has(hex.owner))
      ? requestedFocusOwners
      : undefined;

  function isFocusedCountry(h: MapHex): boolean {
    return h.state === "owned" && h.owner !== null && focusedOwners !== undefined && focusedOwners.has(h.owner);
  }

  function isDimmed(h: MapHex): boolean {
    if (focusedOwners) return !isFocusedCountry(h);
    return highlightIds !== undefined && !highlightIds.has(h.id);
  }

  function fillOf(h: MapHex): string {
    if (h.state === "memorial") return colors.mapMemorial;
    if (h.state === "ruins") return colors.mapRuins;
    if (h.state === "neutral" || h.owner === null) return colors.mapNeutral;
    return nations.get(h.owner)?.color ?? colors.mapNeutral;
  }

  function hexLabel(h: MapHex): React.ReactNode {
    return (
      <>
        <span className="font-medium">{h.cityName}</span>
        {" · "}
        {h.state === "neutral" || h.owner === null ? (
          "Eaux neutres"
        ) : (
          <>
            <FlagEmoji flag={nations.get(h.owner)?.flag ?? ""} /> {nations.get(h.owner)?.name ?? h.owner}
          </>
        )}
        {h.isCapital && " · Capitale"}
        {h.state === "ruins" && " · Ruines"}
        {h.state === "memorial" && " · Memorial"}
      </>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <svg
        ref={svgRef}
        viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`}
        className="w-full h-auto block select-none"
        style={{ background: colors.navy, touchAction: zoomed ? "none" : "pan-y" }}
        role="img"
        aria-label="Carte du monde hexagonale"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHovered(null)}
      >
        {polygons.map(({ hex, points }) => {
          const isLive = liveOwners !== undefined && hex.owner !== null && hex.state === "owned" && liveOwners.has(hex.owner);
          const isFracture =
            fractureOwners !== undefined &&
            (hex.state === "ruins" || hex.state === "memorial") &&
            hex.originalOwner != null &&
            fractureOwners.has(hex.originalOwner);
          const isChanged = changedIds.has(hex.id);
          return (
            <polygon
              key={hex.id}
              points={points}
              fill={fillOf(hex)}
              stroke={colors.navy}
              strokeWidth={size * 0.06}
              opacity={isDimmed(hex) ? 0.34 : 1}
              className={isChanged ? "hex-changed" : isLive ? "hex-live" : isFracture ? "hex-fracture" : undefined}
              style={{ cursor: onHexClick ? "pointer" : "default", transition: "opacity 150ms" }}
              onMouseEnter={() => setHovered(hex)}
              onMouseLeave={() => setHovered((prev) => (prev?.id === hex.id ? null : prev))}
              onClick={() => onHexTap(hex)}
            />
          );
        })}
        {polygons
          .filter(({ hex }) => isFocusedCountry(hex) || highlightIds?.has(hex.id) || selected?.id === hex.id)
          .map(({ hex, points }) => {
            const countryFocus = isFocusedCountry(hex);
            return (
              <polygon
                key={`outline-${hex.id}`}
                points={points}
                fill="none"
                stroke={countryFocus ? colors.cream : colors.greenAcid}
                strokeWidth={countryFocus ? size * 0.16 : size * 0.12}
                opacity={countryFocus ? 0.95 : 0.85}
                pointerEvents="none"
              />
            );
          })}
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

      {/* Contrôles zoom : fallback fiable, indispensable mobile. */}
      <div className="absolute right-2 top-2 flex flex-col gap-px font-mono text-sm" aria-hidden>
        <button
          type="button"
          aria-label="Zoomer"
          className="w-8 h-8 bg-cream text-navy border border-navy/10 hover:bg-cream-dark"
          onClick={() => zoomCenter(1 / 1.5)}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Dézoomer"
          className="w-8 h-8 bg-cream text-navy border border-navy/10 hover:bg-cream-dark"
          onClick={() => zoomCenter(1.5)}
        >
          −
        </button>
        {zoomed && (
          <button
            type="button"
            aria-label="Vue monde"
            className="w-8 h-8 bg-cream text-navy border border-navy/10 hover:bg-cream-dark text-[10px] uppercase"
            onClick={() => setView(null)}
          >
            ⛶
          </button>
        )}
      </div>

      {/* Tooltip souris (desktop). */}
      {hovered && !selected && (
        <div
          className="pointer-events-none absolute z-10 bg-cream text-navy px-3 py-2 font-mono text-xs tracking-widest uppercase border border-navy/10 whitespace-nowrap hidden md:block"
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
          {hexLabel(hovered)}
        </div>
      )}

      {/* Panneau de sélection (tap mobile) : l'info AVANT la navigation. */}
      {selected && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 bg-cream text-navy border-t border-navy/10 px-3 py-2 flex items-center justify-between gap-3 font-mono text-xs tracking-widest uppercase"
          data-testid="hex-selected-panel"
        >
          <span className="truncate">{hexLabel(selected)}</span>
          <span className="flex items-center gap-3 shrink-0">
            {onHexClick && selected.state === "owned" && selected.owner !== null && (
              <button
                type="button"
                className="text-blue-electric underline underline-offset-2"
                onClick={() => onHexClick(selected)}
              >
                Voir la nation →
              </button>
            )}
            <button type="button" aria-label="Fermer" className="text-navy/50" onClick={() => setSelected(null)}>
              ✕
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

/** Pointeur principal grossier = écran tactile : le tap doit informer avant de naviguer. */
function isTouchScreen(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true;
}
