/**
 * Types du moteur de conquête (spec §5, §18).
 * Le moteur est PUR : il opère sur un état en mémoire et produit des events ;
 * la persistance (Supabase) est faite par le worker autour de lui.
 * Toute modification de règle incrémente ENGINE_VERSION (spec, note finale).
 */

export const ENGINE_VERSION = "atlas_engine_v1";

export type HexState = "owned" | "neutral" | "ruins" | "memorial";

export type EngineHex = {
  id: number;
  q: number;
  r: number;
  cityName: string;
  isCapital: boolean;
  originalOwner: string | null; // null = neutre d'origine
  owner: string | null;
  state: HexState;
  conquered: boolean;
};

export type NationStatus = "alive" | "eliminated" | "champion";

export type EngineState = {
  hexes: Map<number, EngineHex>;
  nationStatus: Map<string, NationStatus>;
  gameOver: boolean;
};

export type HexEventType =
  | "captured"
  | "inherited"
  | "neutral_claimed"
  | "ruined"
  | "memorial"
  | "world_conquered"
  | "admin_fix";

/** Ligne atlas.hex_events à insérer (append-only, source du replay). */
export type HexEventDraft = {
  hexId: number;
  matchId: number | null;
  type: HexEventType;
  fromOwner: string | null;
  toOwner: string | null;
  fromState: HexState;
  toState: HexState;
  narrative: string | null;
};

/** Ligne atlas.resolutions à insérer (PK match_id = idempotence). */
export type ResolutionDraft = {
  matchId: number;
  winner: string | null;
  loser: string | null;
  isDraw: boolean;
  goalDiff: number;
  baseGain: number;
  mOverext: number;
  finalGain: number;
  hexesTaken: number[];
  inheritedHexes: number[];
  narrative: string;
  engineVersion: string;
};

/** Constantes de gameplay (game_config §19) — jamais en dur dans le moteur. */
export type GameConfig = {
  gainGroup: number;
  gainR32R16: number;
  gainQf: number;
  gainSf: number;
  gainThird: number;
  gainFinal: number;
  gainGoaldiffCap: number;
  hardCap: number;
  overextMin: number;
  overextMax: number;
  inheritRatio: number;
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  gainGroup: 2,
  gainR32R16: 4,
  gainQf: 5,
  gainSf: 6,
  gainThird: 3,
  gainFinal: 10,
  gainGoaldiffCap: 2,
  hardCap: 12,
  overextMin: 0.5,
  overextMax: 2.0,
  inheritRatio: 0.5,
};

export type ResolveResult = {
  resolution: ResolutionDraft;
  events: HexEventDraft[];
  /** Logs structurés (gain_truncated, draw_no_neutral…) pour job_log. */
  logs: Array<{ code: string; detail?: Record<string, unknown> }>;
};
