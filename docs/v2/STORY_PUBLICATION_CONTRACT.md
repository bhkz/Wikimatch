# STORY_PUBLICATION_CONTRACT — v1

> Contrat strict d'une story publiable par WikiMatch.
>
> Objet : verrouiller, avant toute réactivation de contenu public, ce qui peut
> légitimement devenir une story autonome dans WikiMatch, ce qui doit rester un
> signal interne, et ce qui ne doit jamais être publié, même si techniquement
> détectable.
>
> Statut : règle de vérité éditoriale et produit. Toute implémentation ultérieure
> (Prompt 3B, rehearsal PSG — Arsenal, mode live public) doit s'aligner sur ce
> document ou en référer explicitement.
>
> Branche : `docs/product-p2-story-publication-contract`.
> Audit en lecture seule : aucun code, aucune migration, aucune story, aucun
> seed, aucune collecte, aucune publication ne sont modifiés par ce document.

---

## 1. Pourquoi ce contrat existe

WikiMatch est techniquement capable de produire un flux continu d'évènements à
partir de Wikipédia : modifications, ajouts, retraits, restaurations, etc. Le
pipeline actuel sait déjà émettre des candidats automatiques (`detected_patterns`,
`DRY_RUN_CANDIDATE`) qui peuvent être convertis en `published_stories` dès que
`AUTO_PUBLICATION_ENABLED=true` est positionné.

Cette capacité technique n'est pas une raison suffisante pour publier. La
question n'est pas « peut-on détecter quelque chose ? », mais :

> Avec les modifications réelles de Wikipédia, est-ce que WikiMatch peut sortir
> quelque chose qu'un fan de football, un lecteur Wikipédia ou un lecteur data
> aurait réellement envie de lire ?

Les patterns existants — en particulier `under_radar` et `article_instability` —
peuvent être déclenchés par des évènements qui n'ont aucun intérêt éditorial :
une page modifiée dans une langue mais pas dans une autre, un passage ajouté
puis raccourci, un volume d'éditions élevé sans contenu nouveau. Sans contrat
strict, le moteur publierait des récits génériques, sans matière, et abîmerait
durablement la crédibilité du produit.

Ce document définit donc :

1. La taxonomie à cinq niveaux : **trace** → **signal interne** →
   **observation automatique publiable** → **candidat éditorial
   interprétatif** → **story éditoriale validée**.
2. La whitelist stricte des faits autorisés à devenir publics automatiquement.
3. Les patterns rejetés comme stories publiques autonomes, même détectables.
4. La checklist universelle qu'une publication doit passer.
5. Le contrat de rendu public minimal (mobile-first).
6. Les critères de succès et d'échec du test PSG — Arsenal du samedi 30 mai 2026.
7. Les écarts critiques entre le pipeline actuel et ce contrat.

Le document ne décrit pas comment l'implémenter. Il sert à dire **non** à une
story médiocre, même si elle a passé tous les filtres techniques — **et à
dire oui**, automatiquement et sans validation humaine préalable, à une
observation factuelle simple, multi-sources et sourcée.

### Contrainte opérationnelle du rehearsal PSG — Arsenal

Le match test a lieu le **samedi 30 mai 2026**. Le propriétaire du produit
ne sera pas devant un ordinateur pendant le match : il consultera le site
depuis son téléphone, comme un lecteur extérieur. Il ne pourra donc pas
effectuer une validation humaine de chaque candidat avant publication.

L'objectif du rehearsal est précisément de vérifier qu'une **publication
publique automatique, prudente, sourcée** peut fonctionner en situation
réelle. La règle correcte n'est pas « tout doit être manuel ». Elle est :

> **publier automatiquement uniquement ce qui est mécaniquement prouvable,
> sobre et sourcé ; bloquer automatiquement tout ce qui demande une
> interprétation.**

---

## 2. Ce que WikiMatch observe réellement

Le pipeline réel, audité dans cette branche, est composé de quatre étages.

### 2.1 Worker — `worker/src/ingest.ts`

* S'abonne au stream Wikimedia `recentchange`.
* Filtre `preFilter` : edit/new, namespace 0, non-bot, wikipedia uniquement.
* Clé d'index : `wiki_code::page_title`, chargée depuis `wiki_articles` où
  `monitoring_enabled = true`.
* Pour chaque match, insère une ligne dans `revision_traces` (avec
  `wikimedia_event_id`, `revision_id`, `revision_timestamp`,
  `source_revision_url`, `source_diff_url`, `size_delta`,
  `revision_comment_sanitized`, `public_status='private_raw'`,
  `ingest_status='observed'`).
* Optionnellement (si `FETCH_DIFF_CONTENT=true`), persiste le diff ajouté/retiré
  dans `trace_private_content` (`raw_added_text`, `raw_removed_text`), en
  privé, statut `moderation_status='unreviewed'`.
* Aucune décision éditoriale. Aucun appel IA. Aucune publication.

### 2.2 Analyzer — `analyzer/src/extractor.ts` + `analyzer/src/index.ts`

* Lit `revision_traces` où `ingest_status='observed'` join
  `trace_private_content`.
* Appel IA borné (OpenAI `gpt-4o-mini` → fallback Gemini → fallback regex
  offline) avec un prompt très strict (`buildPrompt`) qui retourne UN seul JSON
  : `proposition_type`, `payload`, `confidence`.
* Liste close de 13 `proposition_type` : `match_result`, `goal_scored`,
  `red_card`, `yellow_card`, `substitution`, `sanction`, `lineup_change`,
  `transfer`, `qualification`, `performance`, `biographical_fact`, `noise`,
  `other`.
* Insère dans `trace_propositions` (privé, RLS), met à jour
  `revision_traces.ingest_status='classified'`.
* L'IA n'écrit jamais de texte public, ne traduit pas pour publication, ne
  nomme jamais un contributeur, ne décide pas du `public_status`.
* Budget journalier `AI_DAILY_EUR_CAP` ; en dépassement, fallback regex
  uniquement.

### 2.3 Pattern matcher — `patterns/src/matchers.ts`

Trois patterns actuellement implémentés :

* `article_instability` : ≥3 traces sur un même `article_id` dans la fenêtre,
  dont au moins une avec `size_delta>0` et une avec `size_delta<0`.
* `language_convergence` : ≥2 éditions linguistiques distinctes pour une même
  `entity_id` ET une `strictConvergenceClaimKey` identique (un score brut sans
  équipes nominées ne suffit jamais ; `goal_scored` exige `scorer+minute`,
  `red_card` `player+minute`, `substitution` `player_in+player_out+minute`,
  `qualification` `team+stage`, `sanction` `target+kind`). De plus, seuls les
  articles `article_type='match'` sont éligibles.
* `under_radar` : 1 proposition substantielle dans une seule édition
  linguistique, alors qu'au moins 2 autres éditions de la même entity sont
  `monitoring_enabled=true` et n'ont pas produit de proposition substantielle
  dans la fenêtre.

Deux patterns documentés mais non implémentés : `language_divergence`,
`match_recap` (`templates.ts:140-144` retourne `null`).

Rattachement au match : `resolveUniqueMatchIdForRows` consulte `match_watchlist`
et `matches.scheduled_at` dans une fenêtre `−6h / +48h`. Si plusieurs matchs
sont candidats, **aucun rattachement n'est effectué** (`match_id=null`).

### 2.4 Publisher — `patterns/src/publisher.ts` + `patterns/src/templates.ts`

* Si `PATTERNS_DRY_RUN=true` : log `[publisher] DRY_RUN_CANDIDATE {...}`, aucune
  écriture.
* Hors dry-run, `manualReviewReason()` bloque par construction trois cas :
  * `article_instability` → toujours `manual_review_required`.
  * `under_radar` → toujours `manual_review_required`.
  * `language_convergence` sans `match_id` unique → `manual_review_required`.
* Verrou final `AUTO_PUBLICATION_ENABLED=false` : même si tout le reste passe,
  la publication retourne `publication_disabled` et n'écrit rien.
* Si tous les verrous sont levés, le publisher exécute :
  * `runSafetyChecks` (longueur, PII, vandalisme/profanité, vocabulaire interdit
    `guerre|war|drama|burst|scandale|preuve que`, causalité `causé par|à cause
    de|provoque`, tension nationale `le|les <pays>`).
  * Insert `published_stories` (`publication_status='published'`,
    `published_by_pipeline='auto_template_v1'`).
  * Insert `detected_patterns` (lié à `published_story_id`).
  * Insert `story_evidence` (une ligne par `trace_id`).
  * Update `revision_traces.ingest_status='published_evidence'`,
    `public_status='linked_to_story'`.

### 2.5 Schéma public — `supabase/migrations/...`

* `published_stories.story_type` ∈ {`fact_entry`, `language_convergence`,
  `language_divergence`, `article_instability`, `under_radar`, `match_recap`}.
* Vue `v_public_stories` : `publication_status in ('published', 'corrected')
  AND retracted_at IS NULL` (anon SELECT autorisé via policy
  `public_read_published_stories`).
* `story_evidence` : 4 `evidence_type` autorisés (`trace`, `compared_absence`,
  `official_match_event`, `comparison_snapshot`).
* `comparison_snapshots` + `comparison_snapshot_items` : structure existe mais
  aucun pipeline ne la peuple aujourd'hui.
* `article_instability_cases` + `article_instability_evidence` : idem.
* `public_trace_excerpts` : RLS `safe_to_publish=true` requis pour anon ; aucun
  pipeline ne fait passer une trace à `safe_to_publish=true` aujourd'hui.

### 2.6 Garde-fous publics actuellement présents (Phase A)

* `AUTO_PUBLICATION_ENABLED=false` côté Render (`patterns/src/config.ts:9`).
* `manualReviewReason` côté publisher (`patterns/src/publisher.ts:51-92`).
* `strictConvergenceClaimKey` (`patterns/src/matchers.ts:77`) +
  filtre `article_type='match'` (`matchers.ts:333`).
* `DRY_RUN_CANDIDATE` logs (`patterns/src/publisher.ts:64`).
* `api/public/v1/stories/[slug].ts` retourne 404 strict (publication détail
  désactivée tant que pipeline non validé).
* Vues `/` (`Home.tsx:84`), `/stories` (`StoriesEditorialGrid.tsx:12`),
  `/explorer` (`Explorer.tsx:62`), `/match/...` (`MatchDetail.tsx:85,159`) :
  empty states honnêtes ; aucun mock ne fuit plus en public.
* `api/public/v1/matches/[slug].ts:261` : message no-stories explicite.

---

## 3. PIPELINE CAPABILITY AUDIT

### Étape : Worker — collecte brute

* **Données réellement disponibles** : timestamp, langue, page exacte,
  `revision_id`, `previous_revision_id`, `size_delta`, commentaire wikimedia
  sanitizé, URLs canoniques (revision + diff).
* **Données perdues ou non exposées** : identifiants des contributeurs (correct,
  exigence privacy), section précise modifiée (`section_label=null` aujourd'hui).
* **Ce qui peut être prouvé au public** : qu'à un instant donné, telle page a
  été modifiée, avec quel delta brut, lien diff à l'appui.
* **Ce qui ne peut pas être prouvé au public** : la nature du changement, son
  intention, sa qualité, sa portée sémantique.
* **Conséquence pour les stories** : la collecte seule ne fonde **aucune**
  story autonome. Elle alimente toujours une étape ultérieure.

### Étape : Analyzer — proposition normalisée

* **Données réellement disponibles** : `proposition_type` (∈ liste close),
  `normalized_payload` (souvent partiel : scorer/minute parfois manquants),
  `confidence` 0-1, fournisseur + modèle + version prompt.
* **Données perdues ou non exposées** : le texte added/removed reste dans
  `trace_private_content`, jamais exporté tel quel. C'est volontaire et
  conforme.
* **Ce qui peut être prouvé au public** : indirectement, qu'un fait structuré
  (ex. « but de X à la 67e ») a été identifié dans une modification.
* **Ce qui ne peut pas être prouvé au public** : la véracité du fait. L'IA
  extrait ce que dit le diff Wikipédia ; elle ne valide pas si la mention
  Wikipédia elle-même est correcte. Une story doit toujours expliciter cette
  limite.
* **Conséquence pour les stories** : une seule proposition isolée n'est jamais
  une story. Elle peut au mieux être un signal interne.

### Étape : Pattern matcher

* **Données réellement disponibles** : trois patterns calculés sur des fenêtres
  conservatrices (`instability=30min`, `convergence=60min`,
  `under_radar=60min`), avec rattachement éventuel à `match_id`.
* **Données perdues ou non exposées** : aucune analyse sémantique du contenu ;
  uniquement co-occurrences structurelles.
* **Ce qui peut être prouvé au public** :
  * (`language_convergence`) plusieurs éditions ont enregistré la même
    proposition structurée (ex. même `goal_scored:scorer:minute`) dans une
    fenêtre courte, sur un article de match identifié.
* **Ce qui ne peut pas être prouvé au public** :
  * que les contributeurs des différentes langues ont consulté la même source ;
  * que la formulation est identique (l'analyzer ne compare pas les phrases) ;
  * qu'une absence dans d'autres langues est une absence intentionnelle.
* **Conséquence pour les stories** :
  * `article_instability` : sans inspection des diffs, le pattern ne distingue
    pas « réécriture éditoriale » de « ajustements de wikiliens ». Doit rester
    `manual_review_required`. ✅ déjà imposé par `publisher.ts:52-53`.
  * `under_radar` : par construction (absence ≠ démonstration), doit rester
    `manual_review_required`. ✅ déjà imposé par `publisher.ts:54-55`.
  * `language_convergence` : seul pattern automatisable, mais avec contraintes
    fortes (claim strict + article_type='match' + match_id unique).

### Étape : Publisher / templates / safety

* **Données réellement disponibles** : `title`, `excerpt`, `observation_text`,
  `interpretation_text`, `limitation_text` (tous générés à partir d'un
  `TemplateContext` borné, jamais d'une sortie IA libre).
* **Données perdues ou non exposées** : la séquence des `revision_traces` est
  bien attachée via `story_evidence`, mais le contenu textuel modifié n'est
  jamais affiché publiquement. C'est conforme à `SECURITY_PRIVACY_RULES`,
  mais cela limite la richesse du rendu.
* **Ce qui peut être prouvé au public** :
  * la liste des `revision_traces` ayant déclenché la story (langue, page,
    `source_revision_url`, `source_diff_url`, timestamp), via `story_evidence`.
* **Ce qui ne peut pas être prouvé au public** :
  * une « comparaison entre versions » avec extraits comparables, tant
    qu'aucun `public_trace_excerpts.safe_to_publish=true` n'a été produit
    (aujourd'hui : aucun).
* **Conséquence pour les stories** : tout CTA « Comparer les versions » /
  « Voir les passages comparés » est interdit tant que `public_trace_excerpts`
  modérés ne sont pas alimentés. ✅ confirmé par l'audit des composants
  publics.

---

## 4. Les cinq niveaux

La taxonomie sépare ce qui peut devenir public **automatiquement** de ce qui
exige une revue humaine. Les niveaux 0-1 ne sont jamais publics. Le niveau 2
est **publiable automatiquement** sous conditions strictes. Les niveaux 3-4
restent bloqués sans validation humaine.

### Niveau 0 — Trace brute

> Une révision Wikimedia a été observée sur l'article EN de la finale UCL à 22:14 UTC.

* Représentation DB : `revision_traces` + `trace_private_content`.
* Usage : observatoire technique interne, debug, métrique de collecte.
* Public : **jamais publiée comme story**. Peut au mieux être citée comme
  source à l'appui d'une observation ou story validée, via `story_evidence`.

### Niveau 1 — Signal interne

> Plusieurs éditions ont modifié des pages liées au match dans une fenêtre courte.
> Une page est modifiée plusieurs fois.
> Une langue mentionne quelque chose, les autres non.

* Représentation DB : agrégats internes (volume d'éditions, écarts entre
  langues, patterns sans claim strict), `detected_patterns` non liés à un
  `published_story_id`.
* Usage : aide à examiner les diffs ; priorité de revue interne.
* Public : **jamais publié comme histoire autonome**. N'apparaît dans aucun
  endpoint `/api/public/v1/*`.

### Niveau 2 — Observation automatique publiable

Définition canonique :

> Une observation automatique publiable décrit un fait documentaire simple,
> détecté dans les pages réellement rattachées au match canonique, attesté
> par plusieurs traces sources consultables, sans interprétation éditoriale.

Conditions cumulatives obligatoires :

* liée au match canonique `2026-ucl-final-psg-arsenal` ;
* issue **uniquement** des 12 articles sélectionnés via `match_watchlist`
  (`enabled=true`) pour ce `match_id` ;
* `match_id` unique et non ambigu (`resolveUniqueMatchIdForRows` retourne un
  id, pas `null`) ;
* événement appartenant à la **whitelist stricte** définie en §7.1 ;
* même claim structurée (`strictConvergenceClaimKey` non null) attestée dans
  **au moins 2 éditions linguistiques distinctes** parmi EN / FR / ES ;
* au moins un lien `source_revision_url` **ou** `source_diff_url` Wikimedia
  consultable pour **chaque** preuve annoncée ;
* titre et résumé descriptifs, sans interprétation, sans qualificatif
  émotionnel, sans classement entre langues ;
* bloc visible obligatoire `Ce que l'on ne peut pas conclure` ;
* badge public explicite : `OBSERVATION AUTOMATIQUE · SOURCES CONSULTABLES`.

Publication :

* **peut** être publique automatiquement pendant le rehearsal, uniquement
  après implémentation technique conforme au Prompt 3B et activation
  contrôlée du flag dédié ;
* ne nécessite **pas** de validation humaine avant affichage ;
* doit pouvoir être consultée depuis mobile pendant le match.

Représentation DB :

* `published_stories.publication_status='published'`,
  `published_by_pipeline='auto_template_v1'`, rattachée à
  `detected_patterns.published_story_id`, avec `story_evidence` non vide
  pointant vers les `revision_traces` sources (au moins une par langue
  annoncée).

Exemple hypothétique (texte attendu sur mobile) :

> **OBSERVATION AUTOMATIQUE · SOURCES CONSULTABLES**
>
> *Un but ajouté dans deux éditions Wikipédia suivies de PSG — Arsenal.*
>
> Le but attribué à Vitinha (23e minute) apparaît dans l'article anglais du
> match et dans l'article français dans une fenêtre de 6 minutes.
>
> Ce que l'on peut observer :
> - article anglais — diff `https://en.wikipedia.org/?diff=...` — 22:09 UTC ;
> - article français — diff `https://fr.wikipedia.org/?diff=...` — 22:15 UTC.
>
> Ce que l'on ne peut pas conclure :
> Cet ordre d'apparition décrit la mise à jour des articles, pas la
> réaction des publics. Les phrases exactes ne sont pas comparées.

### Niveau 3 — Candidat éditorial interprétatif

Exemples :

* différence de formulation entre langues sur le même évènement ;
* réécriture ou contestation d'un passage ;
* convergence complexe sur un fait non whitelisté ;
* instabilité d'article qui semble significative mais exige la lecture des
  diffs.

* Représentation DB : `detected_patterns` sans `published_story_id`,
  optionnellement `story_candidates`.
* Usage : peut être enregistré en interne, exposé au Desk.
* Public : **ne peut pas être publié automatiquement pendant le rehearsal.**
  Doit attendre une revue humaine explicite.

### Niveau 4 — Story éditoriale validée

* Récit enrichi, comparatif, ou narratif vérifié après lecture humaine des
  sources.
* Représentation DB : `published_stories` avec
  `published_by_pipeline='manual'` et trace de revue dans `editorial_reviews`.
* **Hors objectif opérationnel obligatoire du test live** : ce niveau n'est
  pas nécessaire pour valider le fonctionnement de samedi.

---

## 5. Audit des patterns existants

### 5.1 `article_instability`

* **Déclencheur technique actuel** : ≥3 traces sur le même `article_id` dans
  une fenêtre de 30 min, dont au moins un ajout (`size_delta>0`) et un retrait
  (`size_delta<0`).
* **Exemple de sortie actuelle** (template) :
  > `ACTIVITÉ À VÉRIFIER · 2026 UEFA CHAMPIONS LEAGUE FINAL (EN)`
  > Sur l'article anglais de 2026 UEFA Champions League Final, plusieurs
  > modifications comprenant des ajouts et des retraits ont été détectées
  > entre 22:04 UTC et 22:33 UTC. […]
* **Valeur potentielle fan football** : faible — un fan ne sait pas si c'est
  une réécriture importante ou des wikiliens.
* **Valeur potentielle lecteur Wikipédia** : moyenne, **uniquement** si on
  affiche les passages réellement ajoutés/retirés/restaurés. Sinon nulle.
* **Valeur potentielle lecteur data** : faible — la simple co-occurrence de
  size_delta opposés ne signale pas une réécriture sémantique.
* **Risque de surinterprétation** : élevé. Le mot « instabilité » suggère un
  conflit éditorial que les données ne démontrent pas.
* **Décision** : **CANDIDAT À REVUE HUMAINE**. ✅ déjà imposé par
  `manualReviewReason` (`publisher.ts:52-53`). Ne doit jamais être publié
  automatiquement, même hors rehearsal. Le template existant doit être
  considéré comme un **squelette de fiche de revue interne**, pas un texte
  publiable en l'état.

### 5.2 `language_convergence`

* **Déclencheur technique actuel** : ≥2 éditions linguistiques avec le même
  `strictConvergenceClaimKey` (claim structurée vérifiable) sur un article
  `article_type='match'` rattaché à un `match_id` unique dans la fenêtre.
* **Exemple de sortie actuelle** (template) :
  > `MISE À JOUR ÉQUIVALENTE DÉTECTÉE · 2026 UEFA CHAMPIONS LEAGUE FINAL`
  > Une proposition structurée équivalente (but inscrit) a été détectée dans
  > les modifications de 3 éditions linguistiques observées : EN, FR, ES.
* **Valeur potentielle fan football** : moyenne à bonne — montre la vitesse de
  propagation d'un fait du match à travers les éditions.
* **Valeur potentielle lecteur Wikipédia** : bonne — illustre la fabrique du
  récit en temps réel sans interprétation.
* **Valeur potentielle lecteur data** : bonne — chronologie sourcée vérifiable.
* **Risque de surinterprétation** : modéré. Le mot « équivalente » doit rester
  méthodologiquement strict (claim structurée identique, pas phrase identique).
  Le template actuel précise déjà cette limite (`templates.ts:88-91`).
* **Décision** : **AUTO-PUBLIABLE NIVEAU 2** pendant le rehearsal, à condition
  stricte cumulative :
  * `match_id` unique exigé (déjà imposé pour publication auto) ;
  * `strictConvergenceClaimKey` rempli (déjà imposé — interdit `match_result`
    seul) ;
  * `proposition_type` ∈ whitelist §7.1 (`goal_scored` ou `red_card` ;
    `qualification` si éligible — voir §7.1) ;
  * `story_evidence` non vide avec un `source_revision_url` (ou
    `source_diff_url`) par langue attestée ;
  * `safety_checks_passed=true` (PII, vocabulaire interdit, causalité,
    tension nationale).
* C'est le **seul** pattern autorisé à passer en publication automatique
  pendant le rehearsal. Tous les autres restent bloqués.

### 5.3 `under_radar`

* **Déclencheur technique actuel** : 1 proposition substantielle dans une seule
  langue, au moins 2 autres éditions surveillées de la même entity sans
  proposition substantielle dans la fenêtre.
* **Exemple de sortie actuelle** (template) :
  > `AJOUT ISOLÉ À VÉRIFIER · KYLIAN MBAPPÉ`
  > Dans la fenêtre observée, une proposition substantielle (transfert) a été
  > détectée dans l'édition italienne, sans détection d'un ajout substantiel
  > comparable dans les éditions française et anglaise observées.
* **Valeur potentielle fan football** : très faible — l'absence dans d'autres
  éditions ne prouve rien sur le fait. Le fan veut savoir si c'est vrai, pas
  qu'une édition italienne a été plus rapide.
* **Valeur potentielle lecteur Wikipédia** : faible. Une asymétrie entre
  langues nécessite contextualisation (qui a modifié, sur quelle base, sourcé
  ou non) que le pipeline actuel ne peut pas démontrer.
* **Valeur potentielle lecteur data** : faible — c'est une co-absence
  observée, pas une absence avérée.
* **Risque de surinterprétation** : très élevé. Risque immédiat de raconter
  « le silence des Wikipédias non italiennes », qui n'est pas une histoire.
* **Décision** : **REJETÉ COMME STORY PUBLIQUE AUTONOME**.
  * Conserver comme signal interne pour prioriser la revue.
  * Aucune publication automatique, même avec validation humaine, tant que
    le pipeline ne sait pas vérifier la présence/absence effective du fait
    dans le contenu courant des articles tiers (et non juste l'absence
    d'edit dans la fenêtre).
  * Le template `underRadarTemplate` doit être traité comme un message de
    revue, jamais comme texte publiable.

### 5.4 `language_divergence` (template non implémenté)

* **Déclencheur technique actuel** : non implémenté (`templates.ts:140-144`).
* **Évaluation conceptuelle** : une « divergence » nécessiterait que deux
  éditions parlent du **même** évènement avec des **formulations différentes**.
  Aucun composant n'effectue aujourd'hui de comparaison de passages.
* **Décision** : **REJETÉ POUR LE TEST PSG — Arsenal**, et globalement
  REJETÉ tant que :
  * `public_trace_excerpts.safe_to_publish=true` n'existe pas en pratique ;
  * une comparaison de phrases entre éditions n'est pas modérée
    manuellement avec garde-fou éditorial.
  Le terme « divergence » impose une obligation de preuve textuelle que le
  pipeline actuel ne tient pas.

### 5.5 `match_recap` (template non implémenté)

* **Déclencheur technique actuel** : non implémenté.
* **Évaluation conceptuelle** : chronologie des propositions substantielles
  rattachées à un `match_id` après le coup de sifflet final. Reste descriptif
  (« la page X a ajouté le score à 22:51, la page Y a ajouté le but de Z à
  22:53 »), borné, et n'attribue aucune intention.
* **Décision** : **CANDIDAT À REVUE HUMAINE**, format documentaire le plus
  robuste si aucun autre pattern n'émerge pendant le test. À implémenter au
  Prompt 3B uniquement si le rehearsal en valide l'utilité.

### 5.6 Volume seul / activité élevée

* **Décision** : **SIGNAL INTERNE UNIQUEMENT**. Un volume d'éditions élevé ne
  constitue jamais une story. Sert au mieux à hiérarchiser la revue.

---

## 6. Checklist universelle de publication

Une story ne peut être marquée `publication_status='published'` et visible
publiquement que si **tous** les critères suivants sont remplis. L'absence
d'un seul critère interdit la publication.

```text
IDENTITÉ
- liée à un match réel public non démo (entrée correspondante dans matches,
  scheduled_at renseigné, status ≠ 'cancelled') ;
- liée au match canonique pinned (pas à un doublon legacy résiduel) ;
- liée à un ou plusieurs articles réellement référencés dans match_watchlist
  (enabled=true) pour ce match_id ;
- story_type ∈ types autorisés par §7 pour la phase courante.

PERTINENCE
- décrit un fait ou une dynamique documentaire compréhensible pour un lecteur
  non technicien de Wikipédia ;
- possède une valeur au-delà de « une page a changé » ;
- ne repose pas uniquement sur une absence dans d'autres langues ;
- ne repose pas uniquement sur un volume d'éditions ou un nombre de traces ;
- ne tente pas d'attribuer une intention, un biais national, une « opinion »
  collective.

PREUVES
- au moins un story_evidence est rattaché à un revision_traces sourcé ;
- chaque trace publiée expose une URL Wikipédia (source_revision_url) ou diff
  (source_diff_url) réellement consultable ;
- les langues annoncées dans languages[] correspondent exactement aux langues
  des traces sources ;
- les titres d'articles affichés correspondent exactement aux page_title des
  wiki_articles sources (case + diacritiques préservés) ;
- aucune matrice ou timeline n'est affichée si ses éléments source manquent
  (pas de cellule "—" ou "à confirmer" qui prétendrait être une comparaison) ;
- toute affirmation introduite par "selon X éditions" doit correspondre à
  exactement X traces sourcées, pas X-1, pas X+1.

RÉDACTION
- distingue explicitement observation et limitation d'interprétation
  (templates.ts impose déjà cette séparation) ;
- ne déduit jamais l'opinion d'une population, d'un pays, d'une communauté ;
- ne prétend jamais qu'une absence de mention prouve un désintérêt ou un
  désaccord ;
- ne présente pas un signal automatique comme une histoire validée ;
- respecte les safety filters (PII, vocabulaire interdit, causalité interdite,
  tension nationale interdite) ; cf. patterns/src/safety.ts.

VALIDATION (rehearsal PSG — Arsenal, samedi 30 mai 2026)
- les observations automatiques de niveau 2 conformes à la whitelist §7.1 et
  aux exigences de preuve peuvent être publiées automatiquement, sans
  validation humaine préalable ;
- les candidats éditoriaux de niveau 3 (interprétatifs) restent bloqués sans
  validation humaine, même pendant le rehearsal ;
- les stories éditoriales enrichies de niveau 4 ne sont pas nécessaires pour
  valider le fonctionnement live ;
- aucune activation publique n'est autorisée avant que le Prompt 3B ait
  implémenté les garde-fous techniques, les preuves visibles et un test
  contrôlé avant match sur une fenêtre courte ;
- un interrupteur de sécurité (kill switch) doit permettre de désactiver la
  publication automatique sans supprimer les traces ;
- une story rétractée (`retracted_at IS NOT NULL`) reste invisible
  publiquement via la vue `v_public_stories`.
```

Cette checklist est cumulative avec les contrôles déjà codés. Elle ne se
substitue pas aux `runSafetyChecks` ni à `manualReviewReason` : elle s'y ajoute.

---

## 7. Publication automatique autorisée pendant le rehearsal

### 7.1 Whitelist stricte — faits auto-publiables

Un fait n'est auto-publiable comme **observation automatique de niveau 2** que
s'il appartient à la liste ci-dessous **et** s'il est attesté dans ≥2
éditions linguistiques distinctes (EN/FR/ES) sur un article
`article_type='match'` rattaché au `match_id` unique du match canonique.

Le statut de chaque type est évalué contre le code réel (`analyzer/src/
extractor.ts:38-52` pour la liste close des `proposition_type`, et
`patterns/src/matchers.ts:77-127` pour les claims structurées acceptées par
`strictConvergenceClaimKey`).

| `proposition_type` | Claim structurée exigée | Support code actuel | Décision rehearsal |
| --- | --- | --- | --- |
| `goal_scored` | `scorer` + `minute` | **SUPPORTÉ ACTUELLEMENT** (`matchers.ts:87-92`) | **AUTORISÉ** si attesté dans ≥2 éditions et sources consultables |
| `red_card` | `player` (+ `minute`) | **SUPPORTÉ ACTUELLEMENT** (`matchers.ts:93-98`) | **AUTORISÉ** si attesté dans ≥2 éditions et sources consultables |
| `qualification` | `team` + `stage_reached` | **SUPPORTÉ ACTUELLEMENT** (`matchers.ts:112-117`) | **AUTORISÉ** pour le titre/victoire finale, **À CONFIRMER en log** que l'extracteur produit réellement `team` + `stage_reached` non vides sur ce match |
| `sanction` | `target` + `kind` | **SUPPORTÉ ACTUELLEMENT** (`matchers.ts:118-123`) mais sémantique ambiguë | **REFUSÉ** pour le rehearsal : trop ouvert (suspension/avertissement/blessure ?) sans vérification humaine |
| `record` ou distinction | — | **NON SUPPORTÉ ACTUELLEMENT** : ni `record` ni `distinction` ne figurent dans la liste close ; le plus proche est `performance`, qui n'a **pas** de claim structurée dans `strictConvergenceClaimKey` | **REFUSÉ** pour le rehearsal |

### 7.2 Refusés automatiquement

Les signaux suivants ne peuvent jamais devenir publics pendant le rehearsal,
même s'ils sont techniquement détectés :

* `substitution` seule, même multi-sources : trop banale pour une publication
  live (claim techniquement supportée via `matchers.ts:105-111`, décision
  produit : **REFUSÉ**) ;
* `yellow_card` seul : trop fréquent, faible valeur éditoriale (claim
  supportée, décision produit : **REFUSÉ**) ;
* `match_result` brut : `strictConvergenceClaimKey` retourne déjà `null`
  (`matchers.ts:80-86`) ; **bloqué par construction** ;
* `lineup_change`, `transfer`, `biographical_fact`, `performance`, `other`,
  `noise` : aucune claim structurée dans `strictConvergenceClaimKey`,
  **bloqués par construction** ;
* `under_radar` (absence dans d'autres éditions) : **REJETÉ** — signal
  interne uniquement ;
* `article_instability` (réécriture / volume) : **REJETÉ** — fiche de revue
  interne uniquement, jamais publiée telle quelle ;
* `language_divergence` : **BLOQUÉ** — exige des extraits publics
  comparables (`public_trace_excerpts.safe_to_publish=true`), aucun pipeline
  ne les produit aujourd'hui ;
* volume d'éditions élevé sans claim structurée : **signal interne** ;
* absence dans une langue : **rejeté comme story** ;
* toute claim attestée par une seule édition : **rejeté** ;
* toute comparaison de formulation sans extraits publics sûrs : **bloqué**.

### 7.3 Récapitulatif par catégorie de story

#### 7.3.1 Propagation d'un fait de match (`language_convergence` + whitelist §7.1)

* **Niveau** : **2 — Observation automatique publiable**.
* **Intérêt football** : élevé.
* **Intérêt Wikipédia** : élevé.
* **Intérêt data** : élevé.
* **Preuve minimale** : ≥2 `revision_traces` dans des `language_code`
  distincts, `source_revision_url` ou `source_diff_url` consultables, claim
  structurée identique appartenant à la whitelist §7.1.
* **Décision rehearsal** : **AUTORISÉ EN PUBLICATION AUTOMATIQUE** sans
  validation humaine préalable, sous toutes les conditions du Niveau 2.

#### 7.3.2 Réécriture ou instabilité d'un passage (`article_instability`)

* **Niveau** : **3 — Candidat éditorial interprétatif**.
* **Preuve minimale** : ≥3 traces avec signes de `size_delta` opposés, plus
  identification d'un passage commun (impossible automatiquement aujourd'hui
  faute de `public_trace_excerpts.safe_to_publish=true`).
* **Décision rehearsal** : **REJETÉ EN PUBLICATION AUTOMATIQUE**. Conservé
  comme fiche de revue interne.

#### 7.3.3 Formulation différente d'un même évènement (`language_divergence`)

* **Niveau** : **3 — Candidat éditorial interprétatif** (et template absent).
* **Preuve minimale** : passages comparables publiés en clair sous licence
  CC BY-SA 4.0 via `public_trace_excerpts.safe_to_publish=true`.
* **Décision rehearsal** : **REJETÉ** — le pipeline ne peuple pas
  `public_trace_excerpts` aujourd'hui.

#### 7.3.4 Récap documentaire post-match (`match_recap`)

* **Niveau** : **3 — Candidat éditorial interprétatif** par défaut, ou
  **2 — Observation automatique** si tous les faits constitutifs du récap
  appartiennent à la whitelist §7.1 (`goal_scored`, `red_card`,
  `qualification`).
* **Preuve minimale** : ≥3 propositions substantielles whitelistées
  rattachées au même `match_id` après `scheduled_at`, chacune sourcée.
* **Automatisable actuellement** : **non** (template absent dans
  `patterns/src/templates.ts:140-144`).
* **Décision rehearsal** : **HORS PÉRIMÈTRE** — à évaluer après rehearsal
  comme format de repli si la convergence ne suffit pas.

### 7.4 Signaux explicitement rejetés comme stories publiques

* Toute story bâtie sur `under_radar` seul.
* Toute story bâtie sur un `match_result` brut (déjà bloqué par construction).
* Toute story bâtie sur un volume d'éditions élevé sans claim structurée.
* Toute story bâtie sur une absence détectée (« cette page n'a pas été
  modifiée ») — l'absence d'edit ≠ absence de contenu.
* Toute story rattachée à un match avec `match_id=null` ou ambigu.
* Toute story dont les langues annoncées ne correspondent pas exactement aux
  traces fournies dans `story_evidence`.
* Toute story qui attribue une intention, une opinion, un biais ou un
  sentiment à une « communauté » linguistique ou nationale.
* Toute story `substitution` ou `yellow_card` isolée.

---

## 8. Contrat minimal de rendu public (mobile-first)

Le rendu d'une **observation automatique de niveau 2** doit être lisible et
utile depuis un téléphone, en lecture seule, sans interaction complexe.

### 8.1 Bloc d'observation automatique — contenu obligatoire

```text
Badge supérieur (toujours visible) :
  OBSERVATION AUTOMATIQUE · SOURCES CONSULTABLES

Titre factuel (templates.ts, max 500 char, sans émotion, sans classement) :
  Exemple : "Un but apparaît dans deux éditions Wikipédia suivies"

Résumé descriptif (1 à 2 phrases) :
  - rappelle le fait whitelisté détecté (but, carton rouge, qualification) ;
  - indique le nombre d'éditions distinctes concernées ;
  - indique la fenêtre temporelle observée.

Métadonnées :
  - match concerné (lien /match/2026-ucl-final-psg-arsenal) ;
  - type de fait détecté (goal_scored | red_card | qualification) ;
  - éditions linguistiques attestées (EN, FR, ES — codes upper-case) ;
  - fenêtre temporelle (observed_window_start → observed_window_end UTC).

Bloc "Ce que l'on peut observer" (obligatoire) :
  Pour chaque story_evidence :
  - titre exact de page (page_title) ;
  - langue (language_code) ;
  - timestamp révision (revision_timestamp en UTC) ;
  - lien Wikimédia consultable (source_diff_url > source_revision_url).

Bloc "Ce que l'on ne peut pas conclure" (obligatoire, jamais vide) :
  Phrase descriptive issue de limitation_text, par exemple :
  "Cet ordre d'apparition décrit la mise à jour des articles, pas la réaction
  des publics. Les phrases exactes ne sont pas comparées."
```

### 8.2 Interdictions explicites de rendu public

```text
- Toute phrase du type "les Wikipédia réagissent" ou "l'édition X réagit" ;
- Tout classement implicite entre langues ("plus rapide", "en retard",
  "en avance", "ignore", "silence") ;
- Toute conclusion sur l'intérêt ou l'attention des publics ;
- Toute comparaison de passages si public_trace_excerpts.safe_to_publish=true
  n'existe pas pour CHACUNE des langues comparées ;
- CTA "Comparer les versions" si aucune comparaison textuelle n'est
  disponible ;
- Carte chronologique avec cellules vides ou marquées "à confirmer" ;
- Liste de "sujets suivis" sans entrée correspondante dans match_watchlist ;
- Bandeau "Comparaison entre éditions" si comparison_snapshot_items est vide ;
- Texte de template générique non rattaché à des revision_traces réelles ;
- Toute description impliquant une "communauté wikipédienne nationale".
```

### 8.3 États publics du match pendant le rehearsal

La surface mobile doit permettre de distinguer quatre états lisibles à froid :

* **Collecte non activée** : badge "COLLECTE NON ACTIVÉE" sur la page match ;
  aucune observation publiée ; comportement pré-rehearsal.
* **Collecte active, aucune observation publiable** : badge "COLLECTE EN
  COURS" ; bloc "Aucune observation conforme à ce stade" ; pas de candidat
  affiché.
* **Observation automatique publiée** : carte conforme §8.1, accessible depuis
  la page match **et** depuis la home magazine.
* **Erreur de pipeline** : indicateur explicite (`COLLECTE INTERROMPUE` ou
  équivalent), sans prétendre publier des observations.

Ces quatre états doivent être clairement distinguables en un coup d'œil
depuis un téléphone, même pour un lecteur qui n'a aucun contexte interne.

### 8.4 État de l'API publique stories pendant le rehearsal

La règle précédente « 404 strict jusqu'à validation manuelle d'une première
story » **ne s'applique plus**. La nouvelle règle est :

* `GET /api/public/v1/stories/{slug}` retourne 200 si et seulement si la
  story référencée satisfait toutes les conditions du Niveau 2 (§4) **et**
  appartient à la whitelist §7.1 **et** dispose de `story_evidence` non vides
  pour chaque langue annoncée ;
* dans tous les autres cas, l'endpoint retourne 404 (slug inexistant ou
  contenu non conforme) ;
* `GET /api/public/v1/stories` (liste) doit refléter strictement la vue
  `v_public_stories` filtrée sur les stories conformes au Niveau 2.

---

## 9. Critères de succès et d'échec du rehearsal PSG — Arsenal

Le rehearsal du samedi 30 mai 2026 a une vocation opérationnelle : vérifier,
depuis un téléphone, qu'une publication publique automatique prudente
fonctionne. Il n'exige pas qu'une story spectaculaire soit produite.

### 9.1 Succès technique minimum

Le test est techniquement réussi si, depuis un téléphone, le propriétaire
peut constater **tous** les points suivants :

* la page match `/match/2026-ucl-final-psg-arsenal` reste accessible ;
* l'état de collecte est correctement affiché (un des quatre états §8.3) ;
* **au moins une observation automatique conforme** est publiée si un
  événement whitelisté (§7.1) est effectivement détecté dans ≥2 éditions ;
* chaque publication expose ses sources consultables (liens diff/revision
  Wikimédia réellement cliquables) ;
* **aucun signal interdit** n'est publié (pas de `under_radar`, pas de
  `article_instability`, pas de `substitution` seule, pas de
  `match_result` brut, pas de claim mono-langue, pas d'attribution
  communautaire) ;
* le kill switch permet, si nécessaire, de désactiver la publication
  automatique sans supprimer les traces déjà collectées.

**Important** — l'absence de publication n'est **pas** automatiquement un
échec technique si aucun événement n'atteint les critères de preuve. Le site
doit dans ce cas afficher l'un des trois états lisibles :

* aucune trace collectée ;
* traces collectées mais aucun signal publiable (Niveau 1) ;
* erreur de pipeline.

### 9.2 Succès produit

Le test produit est encourageant si **au moins une** observation
automatique publiée paraît réellement intéressante à lire depuis mobile pour
un lecteur extérieur (pas seulement pour l'auteur du produit).

Critère subjectif assumé : la carte est lisible en 30 secondes sur
téléphone, les sources sont cliquables, le lecteur comprend ce qui s'est
passé sans nécessiter de contexte WikiMatch.

### 9.3 Indicateurs d'échec qualitatif

* Une observation est publiée mais le contenu modifié sous-jacent n'est pas
  reconnaissable comme un fait du match (ex. ajout de wikilien, mise à jour
  de bandeau de palmarès) → réglage de la whitelist ou du seuil de
  confiance.
* Un signal interdit (under_radar, instability, substitution, mono-langue)
  apparaît publiquement → **échec grave** : kill switch immédiat, rétraction,
  audit sécurité.
* Plusieurs observations doublonnées sur le même fait → réglage de la
  déduplication côté publisher (`isAlreadyPublished`).
* La surface mobile ne distingue pas correctement les quatre états §8.3.

### 9.4 Décision après répétition

```text
CONTINUER si :
- au moins une observation automatique de niveau 2 a été publiée
  conformément à la whitelist §7.1 ET au contrat de rendu §8 ;
- aucun signal interdit n'a fui publiquement ;
- la carte publiée est jugée lisible et intéressante depuis mobile.

PIVOTER vers un observatoire / récap documentaire si :
- le pipeline collecte correctement mais aucune observation automatique
  n'a assez d'intérêt live ;
- ET les traces accumulées permettent de construire, après match, un récap
  chronologique sourcé utile (`match_recap` documentaire).
  Alors : implémenter match_recap au Prompt suivant comme format prioritaire
  post-match, sans prétendre publier en direct.

ABANDONNER LA PROMESSE DE STORIES LIVE si :
- aucune sortie automatique intéressante n'émerge ;
- OU obtenir une publication intéressante exige systématiquement une
  interprétation humaine approfondie incompatible avec un test mobile ;
- OU plusieurs signaux interdits ont fui malgré les filtres.
  Alors : reconfigurer WikiMatch comme observatoire technique des éditions
  Wikipédia liées au sport, sans promesse de stories autonomes, et
  retravailler le positionnement public en conséquence.
```

---

## 10. Écarts critiques entre le pipeline actuel et ce contrat

| # | Constat | Écart | Statut |
| - | ------- | ----- | ------ |
| 1 | `manualReviewReason` bloque actuellement `article_instability` et `under_radar`, et `language_convergence` sans `match_id` unique (`publisher.ts:51-58`) | Le contrat exige un **mode rehearsal explicite** où `language_convergence` whitelisté (§7.1) passe en auto, et où tous les autres patterns restent bloqués par construction | **À durcir au Prompt 3B** : introduire un flag `REHEARSAL_AUTO_PUBLICATION_ENABLED` distinct de `AUTO_PUBLICATION_ENABLED`, et raffiner `manualReviewReason` pour bloquer aussi `language_convergence` dont la claim n'est pas dans la whitelist §7.1 (ex. `substitution`, `yellow_card`) |
| 2 | `article_instability` template publie un texte « ACTIVITÉ À VÉRIFIER » | Le contrat classe ce pattern comme fiche interne | **À retraiter au Prompt 3B** : soit le template est explicitement marqué comme fiche Desk, soit il est retiré de `templates.ts` |
| 3 | `under_radar` template existe | Le contrat rejette ce pattern comme story publique autonome | **À retirer au Prompt 3B** ou conserver uniquement comme fiche de priorisation Desk |
| 4 | `public_trace_excerpts.safe_to_publish=true` n'est jamais produit | Le contrat exige cet état pour autoriser tout rendu « comparaison de passages » | **Cohérent** : aucun CTA « comparer » n'est autorisé pendant le rehearsal ; `language_divergence` reste bloqué |
| 5 | `match_recap` template absent | Le contrat le désigne comme format de repli post-match, pas comme priorité du rehearsal | **À évaluer après rehearsal** selon le pivot §9.4 |
| 6 | `resolveUniqueMatchIdForRows` peut retourner `null` silencieusement | Le contrat impose `match_id` non-null pour publication automatique | ✅ Déjà appliqué par `manualReviewReason` sur `language_convergence` |
| 7 | `story_evidence.public_label` est généré comme `Trace 1`, `Trace 2`… (`publisher.ts:171`) | Le contrat impose un label lisible : langue + page exacte + horodatage | **À durcir au Prompt 3B** côté publisher avant publication réelle |
| 8 | Aucun pipeline n'écrit dans `comparison_snapshots` / `article_instability_cases` | Le contrat interdit l'affichage de comparaison / instabilité publique sans ces données | **Cohérent** : ne pas afficher ces blocs tant que les pipelines correspondants n'existent pas |
| 9 | `api/public/v1/stories/[slug].ts` retourne 404 systématique (`stories/[slug].ts:14-23`) | Le contrat exige 200 dès qu'une observation conforme au Niveau 2 et à la whitelist §7.1 existe | **À câbler au Prompt 3B** : remplacer le 404 strict par une lecture stricte de `v_public_stories` filtrée sur les stories whitelistées |
| 10 | `safety.ts` n'inclut pas d'interdiction explicite sur « édition X plus rapide » / « silence de » / « réaction de » | Le contrat interdit toute attribution de hiérarchie ou de réaction entre communautés linguistiques | **À ajouter au Prompt 3B** : nouvelle famille de regex dans `safety.ts` (`plus rapide|en retard|en avance|silence|ignore|réaction|réagit`) appliquée à tous les champs publics |
| 11 | Le frontend ne distingue pas explicitement les 4 états (collecte non activée / active sans signal / observation publiée / erreur) | Le contrat §8.3 exige ces 4 états lisibles sur mobile | **À câbler au Prompt 3B** : exposer un état structuré côté API matches/[slug] et côté surface mobile |
| 12 | Aucun kill switch « désactiver publication sans supprimer traces » exposé simplement | Le contrat §9.1 l'exige | **À câbler au Prompt 3B** : la valeur `REHEARSAL_AUTO_PUBLICATION_ENABLED=false` doit suffire à stopper toute nouvelle publication sans interrompre le worker |

---

## 11. Recommandations pour le Prompt 3B (sans implémentation)

Le Prompt 3B doit coder un **mode de répétition automatique sûr** : publication
automatique désactivée par défaut, activable explicitement pour le match
canonique uniquement, avec garde-fous mécaniques sur la whitelist §7.1.

1. **Flag dédié rehearsal**, distinct du flag global :
   * `REHEARSAL_AUTO_PUBLICATION_ENABLED=false` par défaut ;
   * activable uniquement pour le `match_id` canonique
     `2026-ucl-final-psg-arsenal` ;
   * `AUTO_PUBLICATION_ENABLED` global reste à `false` jusqu'à nouvel ordre.

2. **Whitelist de claims auto-publiables** appliquée à `language_convergence` :
   * `goal_scored` (avec `scorer` + `minute`) ;
   * `red_card` (avec `player`) ;
   * `qualification` (avec `team` + `stage_reached`) — à confirmer en log
     que l'extracteur produit des champs non vides ;
   * tout autre `proposition_type` : refus auto.

3. **Exigence de minimum deux langues distinctes** parmi les pages
   sélectionnées du match canonique (EN/FR/ES), avec `article_type='match'`.

4. **Preuve publique obligatoire** par observation :
   * langue (`language_code`) ;
   * `page_title` exact ;
   * `revision_timestamp` (UTC) ;
   * lien `source_diff_url` (ou `source_revision_url` à défaut) Wikimédia.
   `story_evidence.public_label` doit composer ces éléments lisiblement, pas
   « Trace 1 ».

5. **Blocage absolu par construction** dans `manualReviewReason` (ou
   équivalent) :
   * `under_radar` ;
   * `article_instability` ;
   * `language_divergence` ;
   * volume d'éditions / activité seule ;
   * `substitution` seule, `yellow_card` seul ;
   * événement attesté dans une seule langue ;
   * `language_convergence` dont la claim n'est pas dans la whitelist §7.1.

6. **Surface mobile** distinguant explicitement les quatre états §8.3 :
   * collecte non activée ;
   * collecte active mais aucune observation publiable ;
   * observation automatique publiée ;
   * erreur de pipeline.
   Le card pattern Niveau 2 (§8.1) doit être lisible en 30 secondes sur
   téléphone.

7. **Kill switch** : la valeur `REHEARSAL_AUTO_PUBLICATION_ENABLED=false`
   doit suffire à stopper toute nouvelle publication sans interrompre le
   worker, sans supprimer les traces déjà collectées.

8. **Protocole d'activation avant match** :
   * test contrôlé sur une fenêtre courte (par ex. une rencontre antérieure
     ou un match en cours non-canonique) ;
   * vérification que les filtres §7.2 bloquent bien les signaux interdits ;
   * vérification depuis mobile que les quatre états §8.3 sont lisibles ;
   * après validation, activation pour le match canonique sans intervention
     pendant le match.

9. **API publique stories** : remplacer le 404 strict de
   `api/public/v1/stories/[slug].ts` par une lecture stricte de
   `v_public_stories` filtrée sur les observations conformes au Niveau 2
   (whitelist §7.1, `match_id` non-null, `story_evidence` non vides).
   Slug inexistant ou non conforme : 404. Slug conforme : 200.

10. **`safety.ts`** : ajouter une famille de regex interdites sur le ranking
    et la réaction attribués aux éditions linguistiques
    (`plus rapide|en retard|en avance|silence|ignore|réaction|réagit`),
    appliquée à tous les champs publics, en plus des familles existantes.

11. **Ne pas implémenter `language_divergence`** tant qu'un workflow
    `public_trace_excerpts.safe_to_publish=true` n'existe pas.

12. **Scénario d'abandon** : si le rehearsal déclenche §9.4 branche
    `ABANDONNER LA PROMESSE DE STORIES LIVE`, prévoir un Prompt 4
    « repositionnement en observatoire technique » plutôt qu'un Prompt 3C
    « publication enrichie ».

---

## 12. Hors périmètre de ce document

Ce document n'implémente rien. Il ne modifie aucun code, aucune migration,
aucun seed, aucune route API, aucune story, aucune configuration de worker,
d'analyzer ou de pattern matcher. Il ne réactive aucun mode démo. Il ne
publie aucune story.

### Révision rehearsal (28 mai 2026)

La version initiale du contrat (commit `8d5a442`) imposait
`manual_review_required` pour tous les patterns pendant le rehearsal, et
l'API stories en 404 strict. Cette règle était incompatible avec la
contrainte opérationnelle réelle : le test du samedi 30 mai 2026 doit être
vérifiable depuis un téléphone, sans validation humaine pendant le match.

La révision actuelle introduit le Niveau 2 (observation automatique
publiable) avec une whitelist stricte (§7.1) et un contrat de rendu
mobile-first (§8). La règle gardienne reste la même : **publier
automatiquement uniquement ce qui est mécaniquement prouvable, sobre et
sourcé ; bloquer automatiquement tout ce qui demande une interprétation.**

Toute prochaine étape (Prompt 3B) doit citer explicitement la section de ce
contrat qu'elle implémente ou qu'elle modifie. Toute dérogation doit faire
l'objet d'une mise à jour explicite du contrat.

---

## Annexe — Références dans le code audité

* `worker/src/ingest.ts:191-253` — extraction `revision_traces` + `trace_private_content`.
* `analyzer/src/extractor.ts:38-95` — liste close `proposition_type`, prompt strict.
* `analyzer/src/index.ts:102-150` — persistance `trace_propositions`, transition `ingest_status`.
* `patterns/src/matchers.ts:77-127` — `strictConvergenceClaimKey`.
* `patterns/src/matchers.ts:134-198` — `resolveUniqueMatchIdForRows`.
* `patterns/src/matchers.ts:280-468` — détecteurs `article_instability`, `language_convergence`, `under_radar`.
* `patterns/src/publisher.ts:45-99` — séquence `template_missing → dry_run → manual_review_required → publication_disabled → safety → publish`.
* `patterns/src/safety.ts:14-144` — PII, vandalisme, vocabulaire interdit, causalité, tension nationale.
* `patterns/src/templates.ts:54-146` — templates `article_instability`, `language_convergence`, `under_radar` (avec `language_divergence` et `match_recap` non implémentés).
* `supabase/migrations/202605260001_v2_core_schema.sql` — schéma initial `revision_traces`, `published_stories`, `story_evidence`, `comparison_snapshots`, `public_trace_excerpts`, vues publiques, RLS.
* `supabase/migrations/202605270001_propositions_patterns_retract.sql` — `trace_propositions`, `detected_patterns`, retract log.
* `api/public/v1/stories/[slug].ts:14-23` — 404 strict.
* `api/public/v1/matches/[slug].ts:259-275` — message no-stories, no-comparison, no-instability.

Toutes les références ci-dessus sont citées en lecture seule. Aucune ligne
de code n'a été modifiée par ce document.
