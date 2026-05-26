# SECURITY_PRIVACY_RULES — V2

Règles de sécurité et de privacy applicables à toutes les phases. Ce document doit être référencé par chaque PR touchant le backend, la DB, l'API ou le worker.

## 1. Surface publique

| Permission | État |
| ---------- | ---- |
| Lecture publique anonyme des stories publiées | OUI (`publication_status in ('published','corrected')`) |
| Lecture publique anonyme des extraits `safe_to_publish=true` | OUI |
| Lecture publique anonyme des entités publiables | OUI (filtre par story publiée associée) |
| Lecture publique anonyme des matchs avec source vérifiée | OUI (filtre par `source_verified_at IS NOT NULL` ou démo explicite) |
| Écriture publique anonyme | **NON, sur aucune table** |

## 2. Tables strictement privées

`deny all` à la lecture publique. Accès uniquement via service-role (worker) ou auth Desk (Phase 5) :

- `story_candidates`
- `trace_private_content`
- `ai_analysis_runs`
- `editorial_reviews`
- `ingest_checkpoints`
- `ingest_failures`
- toute table contenant des diffs non modérés
- toute table contenant des données d'administration ou de logs internes

## 3. Données contributeurs : interdictions absolues

Le produit public ne doit jamais afficher, stocker en clair ni dériver :

- nom d'utilisateur Wikipedia ;
- IP (v4 ou v6) ;
- compte temporaire (identifiant `~…`) ;
- profil individuel de contributeur ;
- classement ou ranking de contributeurs ;
- origine supposée d'une modification ;
- carte d'auteurs ;
- historique d'activité d'un individu.

**Conformité worker (legacy `safeUser` réutilisé)** : `filters.ts` ([revision90-worker/src/filters.ts](../../../revision90-worker/src/filters.ts)) masque déjà IPv4, IPv6 et Temporary Account IDs. À conserver tel quel.

Si une distinction technique d'acteurs s'avère nécessaire pour analyser une instabilité, elle doit être :
1. minimisée (compteur agrégé, jamais d'identifiant individuel) ;
2. strictement privée (jamais sortie de la zone Desk / privée) ;
3. justifiée par écrit et validée explicitement avant implémentation.

## 4. Secrets

| Secret | Stockage | Accès |
| ------ | -------- | ----- |
| `SUPABASE_SERVICE_KEY` | Variables d'env worker, secrets manager hébergeur | Worker + Desk (côté serveur) uniquement |
| `SUPABASE_URL` | Variables d'env | Frontend OK (`anon` key seulement côté front) |
| `SUPABASE_ANON_KEY` | Variables d'env frontend (préfixée `VITE_`) | Frontend public |
| `WIKIMEDIA_USER_AGENT` | Variables d'env worker | Worker uniquement (contact réel maintenu) |
| `OPENAI_API_KEY` ou équivalent IA Desk | Variables d'env Desk | Desk uniquement (Phase 5) |
| `GEMINI_API_KEY` (export AI Studio) | `.env` local frontend | À retirer du frontend public V2 ou conserver hors prod |

**Règles** :
- Aucun secret n'est jamais committé. `.gitignore` doit lister `.env`, `.env.*`, `*.local`.
- Aucun secret n'est jamais préfixé `VITE_` sauf l'anon key publique.
- Les rapports d'audit n'affichent jamais une valeur — uniquement des noms de variables et des sources.

## 5. Diffs bruts

Un diff brut Wikipédia peut contenir vandalisme, insultes, diffamation, données personnelles, contenus illégaux.

| Règle | Implémentation |
| ----- | -------------- |
| Stockage privé par défaut | `trace_private_content` (RLS `deny all` public) |
| Aucun affichage public automatique | `public_trace_excerpts.safe_to_publish` doit passer à `true` explicitement via le Desk |
| Sanitation côté worker | `wiki-diff.ts` du legacy strippe le HTML et tronque à 800 chars/side. **Conserver.** |
| Sanitation supplémentaire avant exposition publique | À définir Phase 4 — minimum : suppression des liens externes non vérifiés, normalisation des caractères de contrôle |
| Attribution et licence | `public_trace_excerpts.source_attribution_label`, `source_revision_url`, `license_label='CC BY-SA 4.0'` |

## 6. Wikimedia : conformité

| Exigence | Implémentation |
| -------- | -------------- |
| User-Agent identifiable avec contact | `WIKIMEDIA_USER_AGENT` obligatoire, format `<App>/<Version> (<contact>) Node` |
| Respect des limites de requêtes (`action=compare`) | Timeout 8s par appel, batching d'inserts, pas d'appel en boucle |
| Attribution publique des extraits | Mention explicite + lien vers la révision source dans chaque extrait public |
| Licence | Mention `CC BY-SA 4.0` au moins en `/methodology` et sur chaque page exposant des extraits |
| Retrait à la demande | Procédure à définir Phase 5 (correction / retracted via `story_corrections` + `publication_status='retracted'`) |

## 7. Sanitation XSS / injection

| Surface | Règle |
| ------- | ----- |
| Tout texte issu d'une révision Wikipédia | Strip HTML côté worker (déjà fait par `wiki-diff.ts`). Côté frontend, **jamais** de `dangerouslySetInnerHTML` sur un contenu non sanitisé. |
| Champs `metadata jsonb` | Validation Zod côté worker / Desk avant insert |
| Inputs publics (`/search`) | Paramètre `q` borné en longueur (ex: 200 chars), trim, sans interprétation HTML |
| URLs sortantes | Liste blanche de domaines pour les `canonical_url` (wikipedia.org, wikimedia.org) ; toute autre URL = warning |

## 8. Interdictions strictes (V2)

| # | Interdiction |
| - | ----------- |
| 1 | Écriture publique anonyme sur stories, traces, instabilités, comparaisons |
| 2 | `SUPABASE_SERVICE_KEY` côté frontend ou exposée dans le bundle |
| 3 | Clé Wikimedia privée (s'il y en a) côté client |
| 4 | Sortie IA interne visible publiquement |
| 5 | Diff brut non modéré affiché automatiquement en public |
| 6 | Géolocalisation supposée d'un contributeur |
| 7 | Publication automatique d'une story sans `editorial_review` approuvée |
| 8 | Stocker une IP utilisateur Wikipedia en clair (`safeUser` au worker garantit l'absence) |
| 9 | Stocker un Temporary Account ID en clair (`~…` filtrés par `safeUser`) |
| 10 | Cartographier ou ranker des contributeurs |

## 9. Politiques RLS recommandées (Phase 2)

Sketch SQL :

```sql
-- Stories publiées : lisibles par tout le monde uniquement si publiées/corrigées
alter table published_stories enable row level security;
create policy public_read_published on published_stories
  for select using (publication_status in ('published','corrected'));

-- Extraits publics : lisibles uniquement si safe_to_publish=true
alter table public_trace_excerpts enable row level security;
create policy public_read_safe_excerpts on public_trace_excerpts
  for select using (safe_to_publish = true);

-- Tables privées : aucune policy = deny all par défaut (RLS activée)
alter table story_candidates       enable row level security;
alter table trace_private_content  enable row level security;
alter table ai_analysis_runs       enable row level security;
alter table editorial_reviews      enable row level security;
alter table ingest_checkpoints     enable row level security;
alter table ingest_failures        enable row level security;

-- Worker / Desk : connectés en service-role, bypass RLS par construction
```

Tests d'intégration à prévoir :
- requête `select` anonyme sur `trace_private_content` → 0 résultat.
- requête `select` anonyme sur `public_trace_excerpts` filtrant un `safe_to_publish=false` → 0 résultat.
- requête `insert` anonyme sur `published_stories` → refus.

## 10. Données sportives officielles

| Règle | Détail |
| ----- | ------ |
| Source explicite | `matches.official_source_name` + `official_source_url` + `source_verified_at` obligatoires avant affichage live |
| Pas de score "by Wikipedia" | Les traces Wikipedia ne sont jamais utilisées comme source d'événements sportifs (cf. [[PRODUCT_RULES]] §11) |
| Mode démo | Toujours étiqueté `isDemo=true` côté frontend, ne doit jamais apparaître comme officiel |

## 11. Procédure de correction publique

| Étape | Action |
| ----- | ------ |
| 1 | Identifier l'erreur dans `published_stories` |
| 2 | Créer une entrée dans `story_corrections` (motif + note publique) |
| 3 | Mettre à jour `published_stories.publication_status='corrected'` + `corrected_at=now()` |
| 4 | Si grave : passer `publication_status='retracted'`. La story disparaît des feeds publics par RLS. |
| 5 | Conserver l'historique en `story_corrections` (jamais effacé) |

## 12. Risques résiduels et mitigation

| Risque | Mitigation |
| ------ | ---------- |
| Un contributeur signe un edit avec son vrai nom dans un commit | Le frontend public n'affiche jamais `user_display` ; le Desk peut y accéder pour analyse interne |
| Un diff contient une menace ou contenu illégal | `moderation_status='flagged'` côté Desk. Pas de publication. Suppression du `raw_*` possible à la demande. |
| Bypass RLS via une vue mal configurée | Toutes les vues utilisées par l'API publique sont `security_invoker=true` et testées en CI |
| Fuite par messages d'erreur API (stack traces, noms de tables) | Réponses API publiques génériques sur 500 ; détail loggé côté serveur uniquement |
| Logs serveur contenant des secrets | Lint des logs (regex Supabase URL, clés) avant export ; rotation logs |
