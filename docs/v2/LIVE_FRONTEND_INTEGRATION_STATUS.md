# LIVE_FRONTEND_INTEGRATION_STATUS

## Status
- Live mode pages use API-driven provider and honest empty states.
- Demo artifacts are gated away from live pages (PR01 prerequisite branch).

## Search
- Fixed: live mode now queries `/api/public/v1/search` with debounce + abort.

## Known deferred items
- Full canonical match relational contract wiring.
- Real match/calendar import.
- Full watchlist population for real matches.
