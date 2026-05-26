# LIVE_SCHEMA_GAP_AUDIT

## Summary
This PR audited schema/API/frontend contracts and applied additive migration updates.

## Main gaps found
- API matches endpoints still use legacy `kickoff_time`, `team_a_label`, `team_b_label` while canonical target expects relational team links.
- Search frontend filtered a preloaded array; in live mode this produced weak/empty behavior.
- Public API lacked a centralized documented contract.

## Corrected in PR02
- Added forward-only migration `202605271200_live_contract_alignment.sql` with additive canonical columns and indexes.
- Added/updated public RLS policy for `public_trace_excerpts` (`safe_to_publish=true`).
- Implemented live search API querying on user input via debounced requests.

## Deferred to PR03+
- Full relational rewrite of matches payloads to use `home_team_entity_id`/`away_team_entity_id` joins.
- Full endpoint serializer layer across all routes.
- Real WC match import and watchlist population.
