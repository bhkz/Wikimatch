import "dotenv/config";

export const PATTERNS_DRY_RUN = process.env.PATTERNS_DRY_RUN === "true";
export const PATTERNS_POLL_INTERVAL_MS = Number(
  process.env.PATTERNS_POLL_INTERVAL_MS ?? 30_000,
);

// Safety gate: automatic public story publication is opt-in only. It must stay false during rehearsal.
export const AUTO_PUBLICATION_ENABLED = process.env.AUTO_PUBLICATION_ENABLED === "true";

// Fenêtres temporelles (minutes) — bornées pour rester conservatrices.
export const INSTABILITY_WINDOW_MIN = Number(
  process.env.PATTERNS_INSTABILITY_WINDOW_MIN ?? 30,
);
export const CONVERGENCE_WINDOW_MIN = Number(
  process.env.PATTERNS_CONVERGENCE_WINDOW_MIN ?? 60,
);
export const UNDER_RADAR_WINDOW_MIN = Number(
  process.env.PATTERNS_UNDER_RADAR_WINDOW_MIN ?? 60,
);

// Seuils minimaux pour déclencher un pattern.
export const INSTABILITY_MIN_TRACES = 3;
export const CONVERGENCE_MIN_LANGUAGES = 2;

// Borne maximale de longueur pour les champs publics générés par template.
export const PUBLIC_FIELD_MAX_CHARS = 500;

// Version du moteur de templates (versionné pour traçabilité).
export const TEMPLATE_VERSION = "v1";
export const METHODOLOGY_VERSION = "v0.3-auto";
