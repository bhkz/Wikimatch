# WikiMatch Worker V2

Phase 3 worker for Wikimedia ingestion.

It is a refactor of the useful legacy worker pieces only:

- Wikimedia EventStreams SSE ingestion.
- `Last-Event-ID` resume support.
- watchdog + reconnect backoff.
- batched Supabase writes.
- checkpoint advances only after confirmed write.
- `revision_traces` private-by-default rows.
- `trace_private_content` raw diff storage for Desk review.

It intentionally does **not** include:

- scoring,
- drama/war/burst detection,
- automatic story creation,
- public trace excerpt creation,
- AI interpretation.

## Local Setup

Required env:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
WIKIMEDIA_USER_AGENT="WikiMatch/2.0 (contact@example.com) Node"
WORKER_DRY_RUN=true
WORKER_FETCH_DIFF=true
```

Seed monitored articles:

```bash
npm run seed:watchlist
```

Start in dry-run first:

```bash
npm run worker:dev
```

Then, only when logs look correct:

```bash
WORKER_DRY_RUN=false npm run worker:dev
```

On PowerShell:

```powershell
$env:WORKER_DRY_RUN="false"
npm run worker:dev
```

## Render

Use a Render Background Worker with:

```bash
Build Command: npm install
Start Command: npm run worker:start
```

Required env vars:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
WIKIMEDIA_USER_AGENT=WikiMatch/2.0 (<real-contact>) Node
WORKER_DRY_RUN=false
WORKER_FETCH_DIFF=true
LOG_LEVEL=info
PORT=10000
```

Keep `WORKER_DRY_RUN=true` for the first deployment if you want to inspect logs
without writing `revision_traces`.
