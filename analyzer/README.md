# analyzer/

Service séparé responsable de l'**extraction de propositions normalisées** depuis les `revision_traces` collectées par le worker, et du déclenchement du **pattern matcher** qui décide si une publication automatique est possible via template borné.

Pivot 2026-05-27 — cf. `docs/v2/CORRECTIVE_AUDIT_2026-05-27.md`.

## Ce que fait ce service

1. Polle `revision_traces` où `ingest_status='observed'`.
2. Pour chaque trace : récupère `trace_private_content`, appelle l'extractor (OpenAI primaire, Gemini fallback), produit une `trace_propositions` row.
3. Marque la trace `ingest_status='classified'`.
4. Déclenche le pattern matcher (Jalon C) qui regroupe les propositions et tente la publication via template.

## Ce que ce service NE fait PAS

- Il ne pose **jamais** `public_status` ou `safe_to_publish` directement depuis la sortie IA.
- Il ne touche **jamais** au texte brut Wikipedia pour l'exposer en public.
- Il ne génère **jamais** le texte public final d'une story — c'est le rôle du template publisher (Jalon C).
- Il n'est pas en charge de la fiabilité de la collecte SSE — c'est le rôle de `worker/`.

## Budget IA

Cap journalier configurable via `AI_DAILY_EUR_CAP` (défaut 6.50€). Au-delà, le service skip l'extraction IA (les traces restent à `observed` jusqu'au lendemain). Le compteur lit `ai_analysis_runs.estimated_cost_eur` filtré sur today UTC.

## Lancement

```bash
# local
npm run analyzer:dev

# prod (Render Background Worker — cf. render.yaml)
npm run analyzer:start
```

## Variables d'environnement requises

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — accès DB
- `OPENAI_API_KEY` — provider primaire (peut être absent → skip OpenAI)
- `GEMINI_API_KEY` — provider fallback (peut être absent → skip Gemini)
- `AI_DAILY_EUR_CAP` — cap journalier (défaut 6.50)
- `ANALYZER_POLL_INTERVAL_MS` — fréquence de polling (défaut 10000)
- `ANALYZER_BATCH_SIZE` — taille de lot par tour (défaut 5)
- `ANALYZER_DRY_RUN` — `"true"` n'écrit rien en DB
- `LOG_LEVEL` — `info | debug`

## Tables touchées (en écriture)

- `trace_propositions` (INSERT)
- `revision_traces` (UPDATE de `ingest_status`)
- `ai_analysis_runs` (INSERT)

## Tables lues

- `revision_traces`
- `trace_private_content`
- `wiki_articles`
- `entities`
- `ai_analysis_runs` (pour le cap budget)
