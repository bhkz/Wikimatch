# LIVE_PUBLIC_API_CONTRACT

## Scope
Public read-only endpoints under `/api/public/v1/*`.

## Rules
- No demo fallback in live mode.
- No raw private diffs exposed.
- Empty DB returns empty arrays/null with honest copy on frontend.

## Endpoints (current stabilized)
- `GET /home`: featured/latest stories, next match, stats.
- `GET /stories`, `GET /stories/:slug`: published/corrected stories only.
- `GET /matches`, `GET /matches/:slug`: public matches + linked public observations.
- `GET /entities/:slug`: entity + public linked content.
- `GET /explorer`: public stories/comparisons.
- `GET /observatory/traces`: safe excerpts only.
- `GET /search?q=&type=&language=`: live query-backed search.

## Private fields excluded
- `trace_private_content.raw_added_text`
- `trace_private_content.raw_removed_text`
- author IP/identity metadata
