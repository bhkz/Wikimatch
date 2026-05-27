# STAGING_DEPLOYMENT_RUNBOOK

## Minimum services
- Frontend (VITE_DATA_MODE=live)
- Public API
- Worker
- Analyzer
- Pattern engine

## Safety defaults
- AUTO_PUBLISH_ENABLED=false in production
- PATTERNS_DRY_RUN=true in production
