# CORRECTIVE_AUDIT — 2026-05-27

Audit correctif déclenché après ajouts backend (worker + API + IA pipeline + snapshots) effectués en dehors de la branche `v2/audit-and-architecture` avec Gemini. Trois commits concernés :

- `cb43e8a feat(phase2): scaffold Vercel and Supabase live foundation`
- `8e4a740 feat(phase2): add snapshot-backed public API`
- `8fd3610 feat(worker): add Wikimedia ingestion worker scaffold`
- `d69f831 feat: phase 5 - automated AI pipeline with daily budget disjoncteur`
- `55e15f2 feat: phase 6 - 100% dynamic relational Supabase-direct architecture`

Ces commits introduisent une pile complète, partiellement utile, partiellement incompatible avec les règles V2 documentées.

## 1. Verdict général

| Couche | Verdict | Détail |
| ------ | ------- | ------ |
| Schéma Supabase ([supabase/migrations/](../../supabase/migrations/)) | ✅ **À CONSERVER** | Aligné avec [[DATA_MODEL_PROPOSAL]]. RLS strictes. Vues `v_public_*` filtrent `safe_to_publish=true`. Bonne hygiène. |
| Worker SSE base ([worker/src/ingest.ts](../../worker/src/ingest.ts) hors lignes 297-362) | ✅ **À CONSERVER** | Reprise saine du legacy. Watchdog, backoff, batching, checkpoint après upsert OK. |
| `worker/src/wiki-diff.ts`, `filters.ts`, `revert.ts`, `state.ts`, `index-loader.ts` | ✅ **À CONSERVER** | Repris du legacy, fidèles. |
| **Boucle auto-publish IA dans le worker** ([worker/src/ingest.ts](../../worker/src/ingest.ts) **L.297-362**) | ❌ **À RETIRER IMMÉDIATEMENT** | Viole [[PRODUCT_RULES]] §8 + §11 et [[SECURITY_PRIVACY_RULES]] §5 + §8. Détails §3 ci-dessous. |
| Endpoints API publics ([api/public/v1/](../../api/public/v1/)) | 🟡 **À REFAIRE EN PARTIE** | La forme est OK, mais 4 défauts critiques (§4). |
| `worker/src/ai.ts` actuel | 🟡 **À REPOSITIONNER** | Le code n'est pas mauvais, mais son rôle doit changer : IA = extracteur de proposition, pas classificateur de publication. Voir §6. |
| `public_page_snapshots` system ([api/_lib/supabase.ts](../../api/_lib/supabase.ts) `readPublishedSnapshot`) | 🟡 **À DOMESTIQUER** | Utile comme cache page-level, mais doit n'être lu **que** s'il est marqué `published` ET que le mode `live` accepte explicitement les snapshots seedés. Fallback automatique en cas de DB vide = interdit. |
| Frontend ([src/](../../src/)) | ✅ **À CONSERVER** | Aucun impact détecté côté frontend. La data layer demo/live reste valide. |

## 2. Pivot stratégique acté 2026-05-27

L'utilisateur a posé deux invariants nouveaux qui modifient le modèle décrit dans la version initiale de [[PRODUCT_RULES]] §11 :

1. **Pas de comptes utilisateurs**, jamais — déjà aligné, pas de changement.
2. **Pas de validation humaine routinière** avant publication — **change le modèle**.

### Ce qui ne change pas

- IA jamais éditrice autonome (PRODUCT_RULES §8).
- Diff brut privé par défaut, jamais exposé sans filtrage (SECURITY_PRIVACY §5).
- Pas de score / drama / war / burst côté public.
- Aucune écriture publique anonyme.
- Langue ≠ pays. Carte = sujet, pas contributeur. Chronologie ≠ causalité.

### Ce qui change

| Modèle initial | Modèle 2026-05-27 |
| -------------- | ----------------- |
| `trace → candidate → editorial_review humaine → published_story` | `trace → proposition extraite → comparaison cross-langue → publication via template borné` |
| L'IA assiste un humain qui décide | L'IA extrait une proposition normalisée ; un **moteur de règles** décide |
| Desk privé = workflow obligatoire de chaque story | Desk privé devient **kill switch admin** (retract en urgence) + outil de correction rare |
| Texte public écrit par l'éditeur | Texte public **généré par template** (champ figé, IA ne touche pas le rendu final) |
| `safe_to_publish` posé par revue humaine (`reviewed_at` + `reviewed_by`) | `safe_to_publish` posé par le moteur de templates si **tous les filtres de sécurité passent** ; `reviewed_at` est soit retiré du schéma, soit renommé `published_at_automatic` |

### Les 5 types de stories acceptés en publication automatique contrainte

| Type | Conditions automatiques requises | Template public exemple |
| ---- | -------------------------------- | ----------------------- |
| `article_instability` | Sur le **même** article : séquence ajout → retrait → restauration observée sur passage comparable | *« Sur l'article EN de [sujet], une mention de [proposition] a été ajoutée, retirée puis restaurée entre [t1] et [t2]. »* |
| `language_convergence` | Même fait normalisé observé dans ≥N éditions linguistiques surveillées dans une fenêtre temporelle | *« Le résultat [X] apparaît dans [N] éditions linguistiques observées après la rencontre. »* |
| `under_radar` | Ajout substantiel dans une édition + absence d'ajout équivalent dans les éditions comparées à `t` | *« L'édition japonaise documente [proposition]. Aucun ajout équivalent n'est détecté dans EN et FR observés à [t]. »* |
| `language_divergence` | Propositions comparables présentes dans ≥2 éditions mais lexicalement distinctes, validées par règle | *« L'édition anglaise mentionne [propA]. L'édition espagnole mentionne [propB]. Aucune mention équivalente détectée dans l'édition française. »* |
| `match_recap` | Après `match.status='completed'` + N traces qualifiées rattachées | Génération par template à partir des stories ci-dessus liées au match |

**Tout ce qui ne tombe pas dans un template ne se publie pas.** Pas de free-form IA.

## 3. Détails techniques à retirer immédiatement

### 3.1. [worker/src/ingest.ts:297-362](../../worker/src/ingest.ts#L297-L362) — boucle auto-publish IA

**Le code** (résumé) :
```ts
for (const item of batch) {
  // ...
  const aiRes = await runAutomatedAIAnalysis(title, lang, type, added, removed);
  if (aiRes.allowed && aiRes.result) {
    const res = aiRes.result;

    // 1. Insert in public_trace_excerpts — AVEC safe_to_publish:true automatique
    await supabase.from("public_trace_excerpts").upsert({
      trace_id: traceId,
      public_added_excerpt: res.translated_excerpt ? added : null,  // ❌ texte brut Wikipedia
      translated_excerpt: res.translated_excerpt,
      source_attribution_label: `…`,
      safe_to_publish: true,                                          // ❌ posé sans review
      reviewed_at: new Date().toISOString(),                          // ❌ forgé
    }, { onConflict: "trace_id" });

    // 2. Update revision_traces public_status from AI output
    await supabase.from("revision_traces").update({
      public_status: res.public_status,                               // ❌ IA décide la publication
      change_kind: res.change_kind,
      ingest_status: "published_evidence",
    }).eq("id", traceId);
  }
}
```

**Violations cumulées** :
1. [[PRODUCT_RULES]] §8 — l'IA décide seule la publication ;
2. [[PRODUCT_RULES]] §11 — publication automatique non validée ;
3. [[SECURITY_PRIVACY_RULES]] §5 — `public_added_excerpt: res.translated_excerpt ? added : null` expose le **texte brut** Wikipedia (potentiellement vandalisme/insulte/PII) dès que l'IA a fourni une traduction ;
4. [[SECURITY_PRIVACY_RULES]] §8 — `safe_to_publish=true` sans filtre indépendant ;
5. **Falsification du journal de revue** : `reviewed_at: now()` est posé alors qu'aucune review n'a eu lieu ;
6. **Couplage collecte/analyse** : l'IA tourne dans la boucle de traitement du worker, avant `flushState()`. Latence ou coût IA dégrade l'ingestion.

**Action correctrice** : supprimer la boucle entière. Le worker doit s'arrêter après l'upsert dans `revision_traces` + `trace_private_content` (ce qui est la séparation correcte déjà documentée dans [[TARGET_ARCHITECTURE]] §6).

### 3.2. [worker/src/ai.ts](../../worker/src/ai.ts) — à conserver mais déplacer + redéfinir

Le code est techniquement propre (cap budget journalier, OpenAI primary + Gemini fallback, JSON schema enforcement, prompt qui interdit explicitement de nommer un contributeur). **Mais son rôle de "classificateur public_substantive vs public_minor + traducteur" est incompatible avec le modèle V2.**

**Action correctrice** :
- déplacer le fichier dans `analyzer/src/ai.ts` (nouveau service séparé du worker) ;
- supprimer la sortie `public_status` (ce n'est pas à l'IA de décider) ;
- supprimer `change_kind` (à dériver de la proposition extraite) ;
- garder uniquement : extraction d'une `proposition` normalisée (un fait structuré, ex : `{type:"match_result", winner:"FR", score:"2-1"}`) + traduction de l'extrait privé.

### 3.3. Fallback démo dans les APIs live

| Fichier | Ligne | Problème |
| ------- | ----- | -------- |
| [api/public/v1/home.ts](../../api/public/v1/home.ts) | L.20-27 | Si `published_stories` vide → renvoie le snapshot `home` (contenu fictif) sans badge demo |
| [api/public/v1/stories/index.ts](../../api/public/v1/stories/index.ts) | L.19-26 | Idem |
| [api/public/v1/stories/[slug].ts](../../api/public/v1/stories/%5Bslug%5D.ts) | L.56-61 | Fallback snapshot `story:${slug}` si rien en relation |
| Multiple endpoints | — | `isDemo: false` posé sur tous les payloads, y compris ceux issus de snapshots fictifs |

**Action correctrice** : en mode `live`, **empty state honnête** si la DB est vide. Le système de snapshots peut rester comme cache page-level, mais alors :
- soit `page_key` distingue clairement les snapshots de démo (`page_key='home:demo:v1'`) qui ne sont lus QUE si `VITE_DATA_MODE='demo'` ;
- soit le snapshot porte explicitement `isDemo: true` dans son payload.

### 3.4. Labels publics "IA"

| Fichier | Ligne | Texte fautif |
| ------- | ----- | ----------- |
| [api/public/v1/home.ts](../../api/public/v1/home.ts) | L.57, L.73 | `label: "HISTOIRE IA"` par défaut |
| [api/public/v1/stories/index.ts](../../api/public/v1/stories/index.ts) | L.57, L.77 | `categoryLabel: "HISTOIRE IA"`, description *« qualifiés par l'IA en temps réel »* |
| [api/public/v1/stories/[slug].ts](../../api/public/v1/stories/%5Bslug%5D.ts) | L.32 | `categoryLabel: "HISTOIRE IA"` |

**Action correctrice** : remplacer par les libellés alignés sur les `story_type` réels (`DIVERGENCE ENTRE ÉDITIONS`, `ARTICLE INSTABLE`, `SOUS LE RADAR`, etc.). L'IA reste un outil interne, jamais un argument éditorial public.

### 3.5. [api/public/v1/observatory/traces.ts:239-248](../../api/public/v1/observatory/traces.ts#L239-L248) — `featuredSourceChain` hardcodée

```ts
const featuredSourceChain = {
  storyId: "demo-divergence-001",
  storyTitle: "Un même carton rouge. Trois traitements Wikipédia.",
  storyRoute: "/story/demo-divergence",
  categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
  traceIds: [],
  observation: "L'Observatoire compare les révisions en direct. […]",
  limitation: "[…]",
  isDemo: false                                                       // ❌ FAUX
};
```

**Action correctrice** : retirer entièrement le bloc. En mode `live`, si aucune `featuredSourceChain` réelle n'est calculable depuis la DB, le frontend doit afficher la section dans son **empty state** ou la masquer.

### 3.6. Empty state placeholders trompeurs

[api/public/v1/home.ts:90-99](../../api/public/v1/home.ts#L90-L99) :
```ts
const nextMatch = matchData ? { … } : {
  id: "no-match",
  teams: ["AUCUN MATCH INCRUSTÉ"],
  stage: "CALENDRIER",
  dateLabel: "À CONNECTER",
  timeLabel: "--:--",
  status: "upcoming",
  trackedPagesLabel: "Aucun match actif",
  isDemo: false,                                                      // ❌ pseudo-réel
};
```

**Action correctrice** : si pas de match en base, renvoyer `nextMatch: null` et laisser le frontend gérer l'empty state proprement.

## 4. Architecture corrective cible

```
                Wikimedia EventStreams
                          │
                          ▼
                   ┌──────────────────┐
                   │  WORKER (Render)  │
                   │  - filtre, dédup  │
                   │  - INSERT trace   │
                   │  - INSERT private │
                   │  - ADVANCE ckp    │
                   │  STOP. C'est tout. │
                   └──────────────────┘
                          │
                          ▼  (file d'analyse / cron / pg_notify)
                   ┌──────────────────┐
                   │ ANALYZER (job)    │
                   │  - lit traces     │
                   │  - extrait        │
                   │    proposition    │
                   │    normalisée     │
                   │    (IA en option) │
                   │  - écrit          │
                   │    trace_         │
                   │    propositions   │
                   └──────────────────┘
                          │
                          ▼
                   ┌──────────────────┐
                   │ PATTERN MATCHER   │
                   │  - article_inst.  │
                   │  - lang_converge  │
                   │  - lang_diverge   │
                   │  - under_radar    │
                   │  - match_recap    │
                   └──────────────────┘
                          │   (si pattern matché ET filtres sécu OK)
                          ▼
                   ┌──────────────────┐
                   │ TEMPLATE PUBLISH  │
                   │  - remplit champs │
                   │  - vérifie longue,│
                   │    PII, vandalism │
                   │  - INSÉRE         │
                   │    published_     │
                   │    stories OK     │
                   │  - story_evidence │
                   └──────────────────┘
                          │
                          ▼
                   ┌──────────────────┐
                   │ API publique      │
                   │ (Vercel)          │
                   │  - lit v_public_* │
                   │  - JAMAIS snapshot│
                   │    fallback en    │
                   │    mode live      │
                   └──────────────────┘
                          │
                          ▼
                       Frontend
                          ▲
                          │
              POST /api/admin/stories/:id/retract
              (kill switch admin, auth admin)
```

### Tables additionnelles à introduire

```sql
-- Couche proposition / claim (entre trace privée et publication)
create table public.trace_propositions (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null references public.revision_traces(id) on delete cascade,
  proposition_type text not null check (proposition_type in (
    'match_result', 'goal_scored', 'red_card', 'yellow_card', 'substitution',
    'sanction', 'lineup_change', 'transfer', 'qualification', 'performance',
    'biographical_fact', 'other'
  )),
  normalized_payload jsonb not null,  -- ex: {winner:"FR", score:"2-1", minute:90}
  extraction_provider text,           -- 'openai' | 'gemini' | 'regex'
  extraction_confidence numeric(3,2), -- 0..1
  language_code text not null,
  created_at timestamptz not null default now()
);

-- Patterns détectés (avant publication)
create table public.detected_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_type text not null check (pattern_type in (
    'article_instability', 'language_convergence', 'language_divergence', 'under_radar', 'match_recap'
  )),
  trace_proposition_ids uuid[] not null,
  match_id uuid references public.matches(id),
  entity_id uuid references public.entities(id),
  detected_at timestamptz not null default now(),
  published_story_id uuid references public.published_stories(id),
  -- safety
  safety_checks_passed boolean not null default false,
  safety_checks_payload jsonb not null default '{}'::jsonb,
  -- killswitch
  retracted_at timestamptz,
  retracted_reason text
);
```

### Filtres de sécurité automatiques (avant publication)

À implémenter dans le module Template Publish, pas dans le worker :

1. **PII regex** : email, téléphone, NIR, adresses postales partielles, dates de naissance.
2. **Profanity / vandalism heuristics** : listes multilingues (réutilisables depuis libs publiques type `bad-words`, ou compilation maison).
3. **Length bounds** : proposition normalisée < N caractères.
4. **Anti-causalité** : pattern matcher rejette toute formulation qui n'est pas littéralement dans le template.
5. **Anti-tension nationale** : tout template contenant le pattern "le [pays]" est rejeté ; n'autoriser que "l'édition [code linguistique]".

## 5. Plan de reprise en 4 jalons

### Jalon A — Stop the bleeding (immédiat, ~1h)

But : neutraliser tout chemin de publication automatique non contrainte. Aucune perte de schéma.

1. [worker/src/ingest.ts](../../worker/src/ingest.ts) : retirer la boucle L.297-362. Le worker ne fait plus que `revision_traces` + `trace_private_content`.
2. Supprimer l'import `runAutomatedAIAnalysis` ([worker/src/ingest.ts L.20](../../worker/src/ingest.ts#L20)).
3. [api/public/v1/home.ts](../../api/public/v1/home.ts) L.20-27, 90-99, 57, 73 : retirer fallback snapshot + supprimer "HISTOIRE IA" + retourner `nextMatch: null` si pas de match.
4. [api/public/v1/stories/index.ts](../../api/public/v1/stories/index.ts) L.19-26, 57, 77 : retirer fallback snapshot + supprimer "HISTOIRE IA" + supprimer description "qualifiés par l'IA".
5. [api/public/v1/stories/[slug].ts](../../api/public/v1/stories/%5Bslug%5D.ts) L.32, 56-61 : retirer fallback snapshot + supprimer "HISTOIRE IA".
6. [api/public/v1/observatory/traces.ts](../../api/public/v1/observatory/traces.ts) L.239-248 : retirer `featuredSourceChain` hardcodée.
7. Garder le code IA dans `worker/src/ai.ts` mais ne plus l'appeler. Marquer le fichier comme **suspendu** avec un commentaire en tête : *"Ne pas réintégrer dans le worker. Sera déplacé dans `analyzer/` au jalon B."*

### Jalon B — Analyzer + propositions (3-5 jours)

But : créer le service séparé d'extraction de propositions normalisées.

1. `supabase/migrations/202605270001_trace_propositions.sql` : tables `trace_propositions` + `detected_patterns`.
2. Nouveau dossier `analyzer/` (déploiement Render séparé du worker) qui :
   - lit `revision_traces.ingest_status='observed'` ;
   - récupère `trace_private_content` ;
   - appelle l'IA (anciennement `worker/src/ai.ts`, redéfinie pour extraire une `proposition`, pas un `public_status`) ;
   - insère `trace_propositions` ;
   - marque la trace `ingest_status='classified'`.
3. Pas encore de publication automatique. Les propositions s'accumulent silencieusement.

### Jalon C — Pattern matcher + templates (5-7 jours)

But : publier automatiquement uniquement via templates bornés et filtres sécu passés.

1. Module `analyzer/src/patterns/` : un fichier par `pattern_type` (article_instability, language_convergence, etc.).
2. Module `analyzer/src/templates/` : un template figé par pattern_type, génère `published_stories.title / excerpt / observation_text / interpretation_text / limitation_text` SANS appel IA.
3. Module `analyzer/src/safety/` : filtres PII, vandalism, length, anti-causalité, anti-tension nationale.
4. Publication uniquement si **tous** les filtres passent. Sinon `detected_patterns.safety_checks_passed=false` (privé).
5. À ce jalon : on peut allumer le mode `live` sur un environnement staging et observer.

### Jalon D — Kill switch admin + monitoring (2-3 jours)

But : pouvoir retirer une story problématique en urgence.

1. Endpoint `POST /api/admin/stories/:id/retract` protégé par un bearer admin (variable env `ADMIN_TOKEN`).
2. Met `publication_status='retracted'` + log dans `story_corrections`.
3. Dashboard simple (1 page Next ou page React privée derrière auth) listant les 50 dernières stories publiées avec un bouton retract.
4. Alerting Render / Supabase si `ingest_failures` > seuil ou si `analyzer` n'a pas tourné depuis 1h.

## 6. Décisions attendues avant que je commence le jalon A

| # | Décision | Mon vote |
| - | -------- | -------- |
| 1 | Tu valides le pivot 2026-05-27 documenté en §2 (pas de Desk routinier, publication automatique par templates) | — à confirmer |
| 2 | Le worker doit-il s'arrêter au jalon A jusqu'à ce que le jalon B-C soit prêt, ou continuer à collecter en silence ? | Reco : continuer à collecter (pas d'effet public, juste de la donnée à analyser plus tard) |
| 3 | On retire les commits `d69f831` et `55e15f2` via `git revert` propres, ou on fait des fix-up commits sur la branche actuelle ? | Reco : `git revert` ciblés pour traçabilité + fix-up commits seulement pour les bugs identifiés |
| 4 | Le champ `reviewed_at` / `reviewed_by` de `public_trace_excerpts` est-il conservé ou retiré ? | Reco : conservé pour traçabilité interne, mais **renommé** ou **commentaire** clarifiant que `reviewed_at` peut être posé par le template publisher automatique |
| 5 | Le système `public_page_snapshots` reste utilisable comme cache, oui ou non ? | Reco : oui, mais uniquement avec `page_key` préfixé `live:` ou `demo:` pour empêcher tout mélange |
| 6 | Le label public utilisé en remplacement de "HISTOIRE IA" | Reco : utiliser directement `story_type` (`DIVERGENCE ENTRE ÉDITIONS`, `ARTICLE INSTABLE`, etc.) déjà prévu dans [[DATA_MODEL_PROPOSAL]] §9 et [src/types.ts](../../src/types.ts) |

## 7. Effet de bord sur le frontend

Aucune action requise côté frontend pour le jalon A. La couche `PublicDataProvider` continue de fonctionner :
- `DemoPublicDataProvider` : reste alimenté par les fixtures `src/mock*Data.ts`, inchangé ;
- `LivePublicDataProvider` : appelle les endpoints corrigés, qui retourneront désormais des données réelles (vides au début) au lieu de snapshots fictifs maquillés en `isDemo:false`.

**À surveiller** : si la DB live est vide, le frontend doit afficher des **empty states honnêtes** sur chaque route. À vérifier ([src/pages/](../../src/pages/) - chaque page a un block `state.status !== "ready"` qui actuellement ne distingue pas "loading" vs "no data"). Probablement à raffiner en jalon B ou C.
