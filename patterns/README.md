# patterns/

Service séparé responsable de la **détection de patterns** sur les `trace_propositions` produites par l'analyzer, et de la **publication automatique** des stories via **templates bornés** lorsque tous les **safety filters** passent.

Pivot 2026-05-27 — cf. `docs/v2/CORRECTIVE_AUDIT_2026-05-27.md` Jalon C.

## Ce que fait ce service

1. Polle `trace_propositions` récentes regroupées par `article_id` / `entity_id` / temps.
2. Pour chaque cluster, applique en cascade les **détecteurs de pattern** (matchers) :
   - `article_instability` : ≥3 traces sur le même article dans 30 min avec `size_delta` de signes opposés.
   - `language_convergence` : ≥2 propositions de même type sur la même entité, dans langues distinctes, dans 60 min.
   - `under_radar` : 1 proposition substantielle sur une entité dans une seule édition + 0 proposition équivalente sur les autres éditions observées dans 60 min.
3. Pour chaque pattern détecté, applique les **safety filters** :
   - PII regex (email, téléphone, NIR, adresses)
   - vandalisme / profanity (lexique multilingue)
   - bounds de longueur sur les champs publiés
   - anti-causalité (refuse toute formulation qui n'est pas littéralement dans le template)
   - anti-tension nationale (refuse "le [pays]", n'accepte que "l'édition [code]")
4. Si tous les filtres passent : **génère** la story via un **template figé** (pas de free-form IA), insère dans `detected_patterns` + `published_stories` + `story_evidence`, marque le pattern comme publié.
5. Si un filtre échoue : insère dans `detected_patterns` avec `safety_checks_passed=false` et `safety_blocked_reason` documenté (privé).

## Ce que ce service NE fait PAS

- Il n'appelle **jamais** OpenAI/Gemini. Toute la copy publique est générée par template TypeScript pur.
- Il n'utilise **jamais** de texte brut Wikipedia dans la story publiée — uniquement les `proposition_type` et le `normalized_payload` structuré.
- Il ne décide **jamais** un score d'importance.
- Il ne crée **jamais** un `match_recap` automatique sans qu'au moins 3 stories soient déjà publiées pour le match (Jalon ultérieur).

## Lancement

```bash
npm run patterns:dev     # local
npm run patterns:start   # prod Render
```

## Variables d'environnement

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `PATTERNS_POLL_INTERVAL_MS` — fréquence (défaut 30000)
- `PATTERNS_DRY_RUN` — `"true"` log les patterns détectés sans écrire en DB
- `PATTERNS_INSTABILITY_WINDOW_MIN` — fenêtre article_instability (défaut 30)
- `PATTERNS_CONVERGENCE_WINDOW_MIN` — fenêtre language_convergence (défaut 60)
- `PATTERNS_UNDER_RADAR_WINDOW_MIN` — fenêtre under_radar (défaut 60)

## Tables touchées (écriture)

- `detected_patterns` (INSERT)
- `published_stories` (INSERT)
- `story_evidence` (INSERT)
- `revision_traces` (UPDATE ingest_status='published_evidence' pour les traces référencées)

## Tables lues

- `trace_propositions`
- `revision_traces`
- `wiki_articles`
- `entities`
- `matches`
