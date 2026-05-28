import "dotenv/config";

export const PATTERNS_DRY_RUN = process.env.PATTERNS_DRY_RUN === "true";
export const PATTERNS_POLL_INTERVAL_MS = Number(
  process.env.PATTERNS_POLL_INTERVAL_MS ?? 30_000,
);

// Safety gate: automatic public story publication is opt-in only. It must stay false during rehearsal.
export const AUTO_PUBLICATION_ENABLED = process.env.AUTO_PUBLICATION_ENABLED === "true";

// Rehearsal-only kill switch. Even when AUTO_PUBLICATION_ENABLED=true, Level 2
// observations (docs/v2/STORY_PUBLICATION_CONTRACT.md §4) only reach published_stories
// if REHEARSAL_AUTO_PUBLICATION_ENABLED=true as well. Setting this back to false
// stops every new publication without interrupting the worker or analyzer.
export const REHEARSAL_AUTO_PUBLICATION_ENABLED =
  process.env.REHEARSAL_AUTO_PUBLICATION_ENABLED === "true";

// Canonical rehearsal match. Level 2 auto-publication is restricted to this slug.
export const CANONICAL_REHEARSAL_MATCH_SLUG = "2026-ucl-final-psg-arsenal";

// Public marker for Level 2 rehearsal observations. Written into
// published_stories.methodology_version (free-text field, no schema change
// required) and read back by the public API to distinguish new contract-
// conformant observations from any legacy auto_template_v1 row.
export const REHEARSAL_LEVEL2_METHODOLOGY_VERSION = "rehearsal_level2_auto_v1";

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
