import "dotenv/config";

export const STREAM_URL = "https://stream.wikimedia.org/v2/stream/recentchange";

export const USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ??
  "WikiMatch/2.0 (contact@wikimatch.example) Node";

export const STREAM_NAME = process.env.WORKER_STREAM_NAME ?? "wikimedia-recentchange";

// Default to dry-run locally and on first Render deploy. Set explicitly to
// "false" only after the watchlist and logs are validated.
export const WORKER_DRY_RUN = process.env.WORKER_DRY_RUN !== "false";

export const FETCH_DIFF_CONTENT = process.env.WORKER_FETCH_DIFF !== "false";
