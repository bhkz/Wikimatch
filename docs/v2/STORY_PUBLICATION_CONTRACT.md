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

1. La taxonomie des sorties : **trace** → **signal** → **candidat** → **story**.
2. Les patterns rejetés comme stories publiques autonomes, même détectables.
3. La checklist universelle qu'une story doit passer pour être publiable.
4. Le contrat de rendu public minimal.
5. Les critères d'échec du test PSG — Arsenal.
6. Les écarts critiques entre le pipeline actuel et ce contrat.

Le document ne décrit pas comment l'implémenter. Il sert à dire **non** à une
story médiocre, même si elle a passé tous les filtres techniques.

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

## 4. Les quatre niveaux

### Niveau 0 — Trace brute

> Une révision Wikimedia a été observée sur l'article EN de la finale UCL à 22:14 UTC.

* Représentation DB : `revision_traces` + `trace_private_content`.
* Usage : observatoire technique interne, debug, métrique de collecte.
* Public : **jamais publiée comme story**. Peut au mieux être citée comme
  source à l'appui d'une story validée, via `story_evidence`.

### Niveau 1 — Signal interne

> Plusieurs éditions ont modifié des pages liées au match dans une fenêtre courte.

* Représentation DB : agrégats internes (volume d'éditions, écarts entre langues,
  patterns sans claim strict).
* Usage : aide à examiner les diffs ; priorité de revue.
* Public : **jamais publié comme histoire autonome**. N'apparaît dans aucun
  endpoint `/api/public/v1/*`.

### Niveau 2 — Candidat éditorial

> Le résultat final semble avoir été ajouté dans EN, FR et ES à quelques minutes d'intervalle.

* Représentation DB : `detected_patterns` (toutes lignes non liées à
  `published_story_id`), `story_candidates`.
* Conditions pour devenir candidat :
  * `match_id` résolu de façon non ambiguë (`resolveUniqueMatchIdForRows`
    retourne un id) ;
  * `strictConvergenceClaimKey` rempli (pas `match_result` seul) ;
  * `safety_checks_passed=true` ;
  * `manual_review_reason=null`.
* Usage : revue humaine (Desk). Doit exposer les diffs et les traces sources.
* Public : **non public tant que non validé**. Visible uniquement côté Desk.

### Niveau 3 — Story publiable

> **EXEMPLE HYPOTHÉTIQUE.** Le but de Vitinha en première mi-temps est entré
> dans trois éditions de Wikipédia en moins de 12 minutes.
>
> L'article anglais du match a inscrit le but à la 23e minute du temps réel
> ([diff EN](https://example/diff?lang=en)), l'article français quatre minutes
> plus tard ([diff FR](https://example/diff?lang=fr)), l'article espagnol après
> sept minutes supplémentaires ([diff ES](https://example/diff?lang=es)).
>
> Observation : les trois pages ont enregistré le même couple
> `(buteur, minute)` après l'évènement réel du match.
>
> Limite : cet ordre d'apparition ne permet pas de conclure à une hiérarchie
> entre communautés linguistiques, ni à une qualité différente entre les
> rédactions. Les diffs ne sont pas comparés littéralement.
>
> Sources : trois diffs Wikipédia consultables ; aucune comparaison de passage
> textuelle n'est affichée tant qu'aucun extrait modéré n'a été publié.

* Représentation DB : `published_stories.publication_status='published'`,
  rattachée à `detected_patterns.published_story_id`, avec
  `story_evidence` non vide pointant vers les `revision_traces` sources.
* Conditions : toute la checklist universelle §6.
* Public : visible via `/api/public/v1/stories/*` et la home magazine.

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
* **Décision** : **ÉLIGIBLE À PUBLICATION APRÈS PREUVES**, c'est-à-dire :
  * `match_id` unique exigé (déjà imposé pour publication auto) ;
  * `strictConvergenceClaimKey` rempli (déjà imposé) ;
  * au moins une `goal_scored | red_card | substitution | qualification`
    (pas `match_result` seul, déjà bloqué) ;
  * `story_evidence` non vide avec un `source_revision_url` par langue ;
  * pendant le rehearsal PSG — Arsenal : `manual_review_required` malgré tout
    (cf. §8). C'est le seul pattern qui peut, à terme, justifier un
    automatisme contrôlé hors rehearsal.

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

VALIDATION
- pendant le rehearsal PSG — Arsenal, manual_review_required reste imposé
  pour tous les patterns sans exception ;
- AUTO_PUBLICATION_ENABLED reste à false sur Render pendant tout le rehearsal ;
- une story rejetée, incomplète ou non validée reste invisible publiquement
  (publication_status ∈ {'draft'}, ou rétractée via retracted_at) ;
- toute publication post-rehearsal exige un commit explicite côté patterns
  documenté dans docs/v2/RUNBOOK_GO_LIVE.md.
```

Cette checklist est cumulative avec les contrôles déjà codés. Elle ne se
substitue pas aux `runSafetyChecks` ni à `manualReviewReason` : elle s'y ajoute.

---

## 7. Types de stories autorisés pour le test PSG — Arsenal

### 7.1 Propagation d'un fait de match — `language_convergence`

* **Faits éligibles** :
  * `goal_scored` avec `scorer` + `minute` renseignés ;
  * `red_card` avec `player` (+ minute si disponible) ;
  * `substitution` avec `player_in` + `player_out` + `minute` ;
  * `qualification` (titre remporté) avec `team` + `stage`.
* **Faits non éligibles pour ce test** :
  * `match_result` (score brut) seul → bloqué par
    `strictConvergenceClaimKey` qui retourne `null` pour ce type.
* **Intérêt football** : élevé (chronologie réelle d'un fait du match).
* **Intérêt Wikipédia** : élevé (vitesse de propagation entre éditions).
* **Intérêt data** : élevé (timestamps + diffs vérifiables).
* **Preuve minimale** : ≥2 `revision_traces` dans des `language_code` distincts,
  `source_revision_url` consultables, claim structurée identique.
* **Automatisable actuellement** : **partiellement**. Le pipeline détecte. La
  publication doit rester `manual_review_required` pour le rehearsal.
* **Validation humaine obligatoire pendant le rehearsal** : **oui**.
* **Décision rehearsal** : **CANDIDAT MANUEL UNIQUEMENT** (revue Desk
  obligatoire). Pas de publication auto, même si tous les filtres passent.

### 7.2 Réécriture ou instabilité d'un passage — `article_instability`

* **Intérêt football** : faible sans inspection des passages réels.
* **Intérêt Wikipédia** : potentiellement élevé, mais conditionné à
  l'affichage de passages comparables (impossible sans
  `public_trace_excerpts.safe_to_publish=true`).
* **Intérêt data** : moyen.
* **Preuve minimale** : ≥3 traces dont signes de `size_delta` opposés, plus
  identification d'un passage commun (impossible automatiquement aujourd'hui).
* **Automatisable actuellement** : **non** pour publication. Détection oui.
* **Validation humaine obligatoire** : **oui, systématiquement**.
* **Décision rehearsal** : **CANDIDAT MANUEL UNIQUEMENT**. Sortie utilisée
  comme fiche de revue interne, jamais publiée telle quelle.

### 7.3 Formulation différente d'un même évènement — `language_divergence`

* **Intérêt football** : faible.
* **Intérêt Wikipédia** : très élevé si bien fait.
* **Intérêt data** : élevé si bien sourcé.
* **Preuve minimale** : passages comparables publiés en clair sous licence
  CC BY-SA 4.0 via `public_trace_excerpts`.
* **Automatisable actuellement** : **non**. Aucun pipeline ne peuple aujourd'hui
  `public_trace_excerpts` ; le template n'existe pas (`templates.ts:140-144`).
* **Validation humaine obligatoire** : **oui**.
* **Décision rehearsal** : **REJETÉ POUR LE TEST**. À reconsidérer uniquement
  une fois qu'un workflow de modération de passages est implémenté et testé.

### 7.4 Récap documentaire post-match — `match_recap`

* **Intérêt football** : moyen à élevé selon les faits captés.
* **Intérêt Wikipédia** : élevé (chronologie de la fabrique).
* **Intérêt data** : élevé.
* **Preuve minimale** : ≥3 propositions substantielles rattachées au même
  `match_id` après `scheduled_at`, chacune sourcée.
* **Automatisable actuellement** : **non** (template absent), mais le format
  est le plus robuste à implémenter au Prompt 3B en cas d'échec des autres
  patterns.
* **Validation humaine obligatoire pendant le rehearsal** : **oui**.
* **Décision rehearsal** : **CANDIDAT MANUEL UNIQUEMENT** si implémenté à
  temps ; sinon **REJETÉ POUR LE TEST**.

### 7.5 Signaux explicitement rejetés comme stories publiques

* Toute story bâtie sur `under_radar` seul.
* Toute story bâtie sur un seul `match_result` avec score brut (sans claim
  structurée vérifiable côté équipes / ordre / scénario).
* Toute story bâtie sur un volume d'éditions élevé sans claim structurée.
* Toute story bâtie sur une absence détectée par le pipeline (« cette page n'a
  pas été modifiée ») — l'absence d'edit ≠ absence de contenu.
* Toute story rattachée à un match avec `match_id=null` ou ambigu.
* Toute story dont les langues annoncées ne correspondent pas exactement aux
  traces fournies dans `story_evidence`.
* Toute story qui attribue une intention, une opinion, un biais ou un
  sentiment à une « communauté » linguistique ou nationale.

---

## 8. Contrat minimal de rendu public

Lorsque (et seulement lorsque) une story sera autorisée à être publique, la
page détail story doit afficher ces blocs et seulement ceux-ci :

```text
- Titre factuel (templates.ts, max 500 char, sans emoji marketing) ;
- Résumé compréhensible par un non-expert Wikipédia (excerpt) ;
- Match concerné (lien vers /match/{slug} canonique pinné) ;
- Type de story (story_type humain : convergence linguistique / récap / …) ;
- Moment ou fenêtre temporelle observée (observed_window_start →
  observed_window_end en UTC) ;
- Articles / éditions concernés : liste des wiki_articles sources avec
  page_title exact, language_code, canonical_url ;
- Observation (observation_text) ;
- Ce que l'on ne peut pas conclure (limitation_text) — bloc obligatoire ;
- Sources vérifiables : pour chaque story_evidence, afficher
  language_code + page_title + revision_timestamp + lien
  source_revision_url et/ou source_diff_url ;
- Comparaison ou timeline UNIQUEMENT si toutes les sources nécessaires
  existent réellement.
```

Interdictions explicites de rendu public :

```text
- CTA "Comparer les versions" sans public_trace_excerpts.safe_to_publish=true
  pour CHACUNE des langues comparées ;
- CTA "Voir les passages" si aucun extrait public modéré n'est rattaché à la
  story ;
- Carte chronologique avec cellules vides ou marquées "à confirmer" ;
- Liste de "sujets suivis" sans entrée correspondante dans match_watchlist ;
- Bandeau "Comparaison entre éditions" si comparison_snapshot_items est vide ;
- Texte de template générique non rattaché à des revision_traces réelles
  (le `auto_template_v1` doit toujours s'appuyer sur des story_evidence non
  nuls) ;
- Toute description impliquant une "communauté wikipédienne nationale" ou
  une "édition X est en retard / en avance".
```

L'API publique (`api/public/v1/stories/[slug].ts`) reste sur 404 strict tant
que ce contrat n'est pas testé sur au moins une story réelle convergence
validée manuellement post-rehearsal.

---

## 9. Critères d'échec du test PSG — Arsenal

Le test n'est pas « réussi par défaut ». Les critères suivants déclenchent une
décision produit explicite.

### 9.1 Indicateurs d'échec absolu

* Aucune modification substantielle sur les 12 pages sélectionnées dans la
  fenêtre `−6h / +48h` autour du coup d'envoi.
* Uniquement des `proposition_type='noise'` ou `'other'` à confidence < 0.4
  pendant tout le match.
* Aucun `language_convergence` détecté avec `strictConvergenceClaimKey` non
  null et `match_id` unique.
* Aucun `revision_traces` rattachable au `match_id` PSG — Arsenal via
  `match_watchlist`.
* Tous les `DRY_RUN_CANDIDATE` loggés concernent `under_radar` ou
  `article_instability`, qui sont déjà classés
  CANDIDAT MANUEL / REJETÉ.

### 9.2 Indicateurs d'échec qualitatif

* Une convergence est détectée mais la claim sous-jacente n'est pas un fait
  vérifiable (ex. `match_result` qui passerait sans équipes nominées — déjà
  bloqué, mais à surveiller en log).
* Les preuves Wikipédia sont consultables mais le contenu modifié n'est pas
  reconnaissable comme un fait du match (ex. ajout de wikilien, mise à jour
  de bandeau).
* Une story candidat est techniquement publiable mais reste indigeste, non
  lisible pour un fan non spécialiste.
* Le travail manuel nécessaire pour transformer un candidat en story
  publiable dépasse 30 minutes de revue par story (signe d'un produit qui
  n'apporte pas de valeur scalable).

### 9.3 Décision après répétition

```text
CONTINUER si :
- ≥1 language_convergence avec claim strict (goal_scored | red_card |
  substitution | qualification) détectée sur un article match avec match_id
  unique, sources consultables, et candidat lisible par un fan non
  technicien après ≤30 min de revue Desk ;
- les autres patterns restent silencieux ou clairement classés "signal
  interne" sans tentative de publication.

PIVOTER si :
- aucun convergence strict mais 1+ candidat de type match_recap
  documentaire utile, suggérant que le format chronologique sourcé est plus
  réaliste que la promesse "story live" ;
- alors : implémenter match_recap au Prompt 3B comme format prioritaire,
  rétrograder convergence en candidat documentaire.

ABANDONNER LA PROMESSE DE STORIES LIVE si :
- aucun pattern utile n'émerge ;
- ET les sorties les plus robustes se limitent à une chronologie technique
  d'éditions sans intérêt footballistique ;
- ET la friction manuelle pour publier une story dépasse durablement la
  valeur ajoutée pour le lecteur.
- alors : reconfigurer WikiMatch comme observatoire technique des éditions
  Wikipédia liées au sport, sans promesse de stories autonomes, et
  retravailler le positionnement public en conséquence.
```

---

## 10. Écarts critiques entre le pipeline actuel et ce contrat

| # | Constat | Écart | Statut |
| - | ------- | ----- | ------ |
| 1 | `language_convergence` peut publier auto si `AUTO_PUBLICATION_ENABLED=true` | Le contrat exige `manual_review_required` pour TOUS les patterns pendant le rehearsal, sans exception | **À durcir au Prompt 3B** : `manualReviewReason` doit retourner une raison non-null pour `language_convergence` tant que `REHEARSAL_MODE=true` ou tant que `AUTO_PUBLICATION_ENABLED=false` |
| 2 | `article_instability` template publie un texte « ACTIVITÉ À VÉRIFIER » | Le contrat classe ce pattern comme fiche interne | **À retraiter au Prompt 3B** : soit le template est explicitement marqué comme fiche Desk, soit il est retiré de `templates.ts` |
| 3 | `under_radar` template existe | Le contrat rejette ce pattern comme story publique autonome | **À retirer au Prompt 3B** ou conserver uniquement comme fiche de priorisation Desk |
| 4 | `public_trace_excerpts.safe_to_publish=true` n'est jamais produit | Le contrat exige cet état pour autoriser tout rendu « comparaison de passages » | **Bloquant** pour `language_divergence`, `article_instability` publics, et tout CTA « comparer » |
| 5 | `match_recap` template absent | Le contrat le désigne comme format de repli le plus robuste | **À évaluer au Prompt 3B** selon résultat rehearsal |
| 6 | `resolveUniqueMatchIdForRows` peut retourner `null` silencieusement | Le contrat impose `match_id` non-null pour publication | ✅ Déjà appliqué par `manualReviewReason` sur `language_convergence` |
| 7 | `story_evidence.public_label` est généré comme `Trace 1`, `Trace 2`… | Le contrat impose un label lisible : langue + page exacte + horodatage | **À durcir au Prompt 3B** côté publisher avant publication réelle |
| 8 | Aucun pipeline n'écrit dans `comparison_snapshots` / `article_instability_cases` | Le contrat interdit l'affichage de comparaison / instabilité publique sans ces données | **Cohérent** : ne pas afficher ces blocs tant que les pipelines correspondants n'existent pas |
| 9 | `api/public/v1/stories/[slug].ts` retourne 404 | Cohérent avec le contrat tant qu'aucune story n'a passé revue manuelle | **À conserver** jusqu'à ce qu'une première story convergence soit validée manuellement |
| 10 | `safety.ts` n'inclut pas d'interdiction explicite sur « édition X plus rapide que édition Y » | Le contrat interdit toute attribution de hiérarchie entre communautés linguistiques | **À envisager au Prompt 3B** : ajout d'un check de vocabulaire « plus rapide / en retard / en avance / silence de » sur les champs publics |

---

## 11. Recommandations pour le Prompt 3B (sans implémentation)

Le Prompt 3B ne doit pas réintroduire de templates publics génériques. Il doit
au contraire :

1. **Renforcer les verrous existants** plutôt que les desserrer :
   * `manualReviewReason` doit explicitement bloquer `language_convergence`
     tant que `REHEARSAL_MODE=true` (ou un flag équivalent) — pas seulement
     en cas de `match_id=null`.
   * `AUTO_PUBLICATION_ENABLED` doit rester `false` sur Render.

2. **Retraiter les patterns rejetés** :
   * `under_radar` : retirer le template public ou le marquer explicitement
     comme fiche Desk interne (renommer `internal_review_card`).
   * `article_instability` : même traitement.

3. **Préparer le format de repli** : prévoir un squelette `match_recap`
   uniquement comme **chronologie documentaire sourcée**, sans interprétation,
   à activer seulement si le test échoue qualitativement sur `convergence`.

4. **Durcir les labels de preuve** : `story_evidence.public_label` doit
   contenir le `language_code` + `page_title` exact + `revision_timestamp`.

5. **Ne pas implémenter `language_divergence`** tant qu'un workflow
   `public_trace_excerpts` modéré n'existe pas. Le mot « divergence »
   implique une obligation textuelle que le pipeline ne tient pas aujourd'hui.

6. **Ajouter à `safety.ts`** une liste d'expressions interdites sur le
   ranking entre éditions linguistiques (« plus rapide », « en retard »,
   « en avance », « silence », « ignore ») et tester via `runSafetyChecks`.

7. **Conserver l'API `/api/public/v1/stories/[slug].ts` en 404 strict**
   jusqu'à ce qu'une première story convergence ait été manuellement validée
   après rehearsal.

8. **Documenter le scénario d'abandon** : si le rehearsal échoue selon §9.3
   branche `ABANDONNER LA PROMESSE DE STORIES LIVE`, prévoir un Prompt 4
   « repositionnement en observatoire technique » au lieu d'un Prompt 3C
   « publication ».

---

## 12. Hors périmètre de ce document

Ce document n'implémente rien. Il ne modifie aucun code, aucune migration,
aucun seed, aucune route API, aucune story, aucune configuration de worker,
d'analyzer ou de pattern matcher. Il ne réactive aucun mode démo. Il ne
publie aucune story.

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
