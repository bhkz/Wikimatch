# Répétition Générale — Finale UEFA Champions League 2025-26

**PSG — Arsenal · Samedi 30 mai 2026 · Puskás Aréna, Budapest**

---

## 1. Objectif

Ce dispositif est une **répétition générale du pipeline WikiMatch** avant la Coupe du monde 2026 :

- Valider la collecte de traces Wikimedia en conditions réelles de match
- Observer les propositions détectées par l'analyzer IA
- Inspecter les candidats story générés par le pattern matcher
- **Aucune publication publique automatique** pendant la répétition

Le périmètre est volontairement **réduit et contrôlable** : 4 entités, 12 articles Wikipedia, 3 langues.

---

## 2. Match suivi

| Champ | Valeur | Source |
|-------|--------|--------|
| Compétition | UEFA Champions League 2025/26 | UEFA |
| Stade | Finale | UEFA |
| Équipe A | Paris Saint-Germain | UEFA |
| Équipe B | Arsenal | UEFA |
| Date | Samedi 30 mai 2026 | UEFA |
| Heure | 18:00 CEST | UEFA officielle |
| Lieu | Puskás Aréna, Budapest, Hongrie | UEFA |
| Source officielle | [https://www.uefa.com/uefachampionsleague/news/02a5-2092f53360cc-8ee51562d99f-1000--when-is-the-champions-league-final-where-you-are-what-time-i/](https://www.uefa.com/uefachampionsleague/news/02a5-2092f53360cc-8ee51562d99f-1000--when-is-the-champions-league-final-where-you-are-what-time-i/) | Vérifié le 2026-05-27 |

> [!WARNING]
> **Home/Away :** L'ordre home/away n'est pas officiellement confirmé pour une finale en terrain neutre. PSG est listé en premier par convention. À vérifier avec la feuille de match officielle UEFA.

> [!WARNING]
> **Heure de coup d'envoi :** L'heure officielle est 18:00 CEST selon la page officielle UEFA. Le match est défini sur cette base dans le fichier de répétition.

---

## 3. Articles Wikipedia surveillés

Tous les titres ont été **vérifiés via l'API Wikipedia** le 2026-05-27.

### Articles retenus (12)

| Entité | Wiki | Titre canonique | page_id | Type |
|--------|------|----------------|---------|------|
| Finale UCL | enwiki | `2026 UEFA Champions League final` | 76987191 | match |
| Finale UCL | frwiki | `Finale de la Ligue des champions de l'UEFA 2025-2026` | 17334743 | match |
| Finale UCL | eswiki | `Final de la Liga de Campeones de la UEFA 2025-26` | 10983181 | match |
| PSG | enwiki | `Paris Saint-Germain FC` | 357488 | team |
| PSG | frwiki | `Paris Saint-Germain Football Club` | 2947004 | team |
| PSG | eswiki | `Paris Saint-Germain Football Club` | 211992 | team |
| Arsenal | enwiki | `Arsenal F.C.` | 2174 | team |
| Arsenal | frwiki | `Arsenal Football Club` | 3947896 | team |
| Arsenal | eswiki | `Arsenal Football Club` | 130048 | team |
| UCL 2025-26 | enwiki | `2025–26 UEFA Champions League` | 74127997 | tournament |
| UCL 2025-26 | frwiki | `Ligue des champions de l'UEFA 2025-2026` | 15614817 | tournament |
| UCL 2025-26 | eswiki | `Liga de Campeones de la UEFA 2025-26` | 11082364 | tournament |

### Articles recherchés mais non retenus

| Recherche | Wiki | Résultat |
|-----------|------|----------|
| `2025–26 UEFA Champions League final` | enwiki | `missing` (article inexistant sous ce titre — l'article EN utilise `2026 UEFA Champions League final`) |

### Périmètre volontairement exclu

- **Joueurs** : Non inclus dans la watchlist initiale. Seront ajoutés en extension si nécessaire après observation de l'activité sur les pages cœur.
- **Langues** : Limité à `en`, `fr`, `es` pour rester analysable.

---

## 4. Préparer la base sans armer la surveillance

> [!CAUTION]
> **Ne pas exécuter ces commandes avant que la branche soit mergée dans `main` et que les migrations SQL nécessaires aient été appliquées dans Supabase.**
>
> Les commandes sans `--apply` sont des vérifications. Les commandes avec `--apply` effectuent les écritures nécessaires.
>
> ```bash
> # 1. Vérifications locales sans écriture
> npm run import:rehearsal:match
> npm run seed:rehearsal:watchlist
>
> # 2. Écritures de préparation, sans activation implicite des nouveaux articles
> npm run import:rehearsal:match -- --apply
> npm run seed:rehearsal:watchlist -- --apply
>
> # 3. Réparer les références d'entités doublonnées (PSG / Arsenal)
> npm run repair:rehearsal:entities
> npm run repair:rehearsal:entities -- --apply
>
> # 4. Vérification du rattachement strict aux 12 articles
> npm run build:rehearsal:watchlist
>
> # 5. Écriture du rattachement après validation
> npm run build:rehearsal:watchlist -- --apply
> ```
>
> Le dry-run de `build:rehearsal:watchlist` intervient après les écritures et la réparation d'entités, car il valide la correspondance stricte des associations avec les entités canoniques ; il n'écrit rien sans `--apply`.

### Étape 1 — Vérifier le match en dry-run

```bash
npm run import:rehearsal:match
```

Le script lit `data/live/rehearsals/ucl-final-2026-psg-arsenal.match.json` et affiche les détails sans écrire en base.

### Étape 2 — Importer le match (après validation)

```bash
npm run import:rehearsal:match -- --apply
```

Upsert les deux équipes dans `entities` et le match dans `matches`.

### Étape 3 — Vérifier la watchlist Wikipédia en dry-run

```bash
npm run seed:rehearsal:watchlist
```

- Valide les 4 entités et les 12 articles de `worker/seeds/ucl-final-2026-rehearsal.watchlist.json`.
- N'utilise pas Supabase.
- N'écrit rien en base.

### Étape 4 — Seeder la watchlist Wikipédia après validation explicite

```bash
npm run seed:rehearsal:watchlist -- --apply
```

- Écrit les entités et les articles manquants dans Supabase.
- Les nouveaux articles sont insérés avec `monitoring_enabled=false` afin que les sept nouveaux articles n'activent pas la surveillance implicitement.
- Les entités et articles déjà existants ne sont pas modifiés par ce seed.
- **Important** : Le dry-run a montré que cinq articles de la répétition existaient déjà en base et étaient actifs avant préparation :
  - `frwiki:Paris Saint-Germain Football Club` active
  - `eswiki:Paris Saint-Germain Football Club` active
  - `enwiki:Arsenal F.C.` active
  - `frwiki:Arsenal Football Club` active
  - `eswiki:Arsenal Football Club` active
- Si le worker est déjà actif ou redémarre avant l'activation complète, ces cinq articles peuvent déjà produire des traces ; la préparation ne désactive pas cette couverture préexistante.
- Ne s'exécute qu'après revue du dry-run et accord explicite de Thomas.

### Étape 5 — Réparer les références d'entités doublonnées (PSG / Arsenal) et le QID d'Arsenal

L'audit pré-rattachement a révélé que les cinq articles historiques existants étaient déjà associés aux entités canoniques `paris-saint-germain-fc` et `arsenal-fc`. Afin de ne pas dupliquer ces entités et fragmenter les données analytiques, les entités de répétition `paris-saint-germain` et `arsenal` créées lors du premier seed ne doivent plus être utilisées.

**Incohérence de Métadonnée détectée (Arsenal QID)** :
L'audit a également mis en lumière que l'entité historique `arsenal-fc` porte actuellement le QID erroné `Q9610` (qui correspond à la langue bengalie / Bangla sur Wikidata), alors que la page officielle anglaise `Arsenal F.C.` est rattachée au QID `Q9617`.

Une étape de réparation contrôlée est donc nécessaire pour :
* réorienter le match PSG–Arsenal et l'article PSG en anglais (`enwiki:Paris Saint-Germain FC`) vers les entités canoniques historiques `paris-saint-germain-fc` et `arsenal-fc` ;
* corriger de manière sécurisée la métadonnée `wikidata_qid` de `arsenal-fc` de `Q9610` à `Q9617` dans la table `entities`.

Les entités doublonnées `paris-saint-germain` et `arsenal` ne seront pas supprimées de la base lors de cette étape de réparation pour permettre tout audit historique ultérieur.

1. Vérifier les changements de réalignement et de correction de métadonnée prévus en dry-run :
```bash
npm run repair:rehearsal:entities
```

Le script de réparation valide l'existence des entités canoniques, compare l'état actuel et l'état cible pour le match (les 2 équipes), le QID d'Arsenal et les 12 articles, puis affiche le diagnostic détaillé sans écrire en base.

2. Appliquer la réparation (après validation de Thomas) :
```bash
npm run repair:rehearsal:entities -- --apply
```

Cette commande met à jour de façon atomique et contrôlée le QID d'Arsenal dans la table `entities`, puis les liaisons du match dans la table `matches` ainsi que les articles concernés dans `wiki_articles` pour réutiliser les entités canoniques historiques. Une assertion vérifie le bon déroulement de l'opération après coup.

### Étape 6 — Rattacher les articles au match en dry-run

```bash
npm run build:rehearsal:watchlist
```

> [!NOTE]
> Ce script **nécessite une connexion Supabase** même en dry-run (il lit `matches`, `entities` et `wiki_articles`). Sans variables d'environnement configurées, il échouera.
>
> Le script valide désormais qu'il trouve exactement 12 articles (4 entités × 3 langues) associés de façon rigoureuse aux entités canoniques attendues avant d'autoriser l'upsert.

### Étape 7 — Rattacher les articles au match après validation

```bash
npm run build:rehearsal:watchlist -- --apply
```

## 5. Armer la surveillance au moment choisi

Avant d'activer la surveillance, vérifier que les variables Render de sécurité sont en place :

```bash
PATTERNS_DRY_RUN=true
AUTO_PUBLICATION_ENABLED=false
```

### Vérifier avant activation

```bash
npm run monitor:rehearsal:watchlist -- --enable
```

- Dry-run de lecture seule ; affiche l'état courant des 12 articles.
- Indique que `--enable --apply` capturera un snapshot local de l'état initial avant activation.

### Activer et capturer le snapshot

```bash
npm run monitor:rehearsal:watchlist -- --enable --apply
```

- Capture un snapshot local (ignoré par Git) de l'état `monitoring_enabled` actuel de chaque article.
- Active les 12 articles une fois le snapshot sauvegardé.
- Refuse de continuer si un snapshot existe déjà (protection contre écrasement accidentel).
- Après activation, démarrer ou redémarrer le worker pour qu'il recharge l'index des articles surveillés.

## 6. Arrêt et restauration après test

### Arrêter immédiatement la collecte

Arrêter le worker Render.

### Vérifier la restauration prévue de l'état initial

```bash
npm run monitor:rehearsal:watchlist -- --disable
```

- Dry-run de lecture seule ; exige le snapshot capturé lors de l'activation.
- Affiche pour chaque article l'état actuel et l'état cible de restauration enregistré.
- Ne modifie rien en base.

### Restaurer l'état initial en base

```bash
npm run monitor:rehearsal:watchlist -- --disable --apply
```

- Restaure exactement les états `monitoring_enabled` du snapshot :
  - Les cinq articles initialement actifs repassent à `true` ;
  - Les sept articles initialement inactifs repassent à `false`.
- Supprime le snapshot local uniquement après restauration réussie.
- Après restauration, ne redémarrer le worker que si l'on souhaite reprendre la surveillance correspondant à l'état restauré.

## 7. Variables Render pendant le test

| Variable | Valeur | Effet |
|----------|--------|-------|
| `WORKER_DRY_RUN` | `false` | Le worker collecte les traces réelles |
| `ANALYZER_DRY_RUN` | `false` | L'analyzer écrit les propositions réelles |
| `PATTERNS_DRY_RUN` | `true` | Le pattern matcher simule et logue les candidats |
| `AUTO_PUBLICATION_ENABLED` | `false` | **Verrou absolu** — aucune publication publique |

---

## 8. Critères de succès

- [ ] Traces reçues sur au moins un article surveillé (`revision_traces`)
- [ ] Propositions analysées par l'IA (`trace_propositions`)
- [ ] Candidats `DRY_RUN_CANDIDATE` inspectables dans les logs Render
- [ ] Aucune story publique automatique publiée
- [ ] Couverture multilingue : au moins 2 langues parmi en/fr/es avec des traces
- [ ] Coût IA maîtrisé sous le cap journalier

### Rattachement des candidats au match

Un candidat n'est rattaché à PSG — Arsenal que si :

- au moins un article du pattern appartient à la watchlist du match ;
- les traces observées entrent dans une fenêtre de 6 heures avant à 48 heures après le coup d'envoi ;
- un seul match reste plausible après filtrage.

Ce rattachement est une association opérationnelle de contexte, pas une preuve que le match a causé la modification.

Si plusieurs matchs surveillés sont compatibles, le système conserve `match_id: null` plutôt que de produire une association trompeuse.

Dans les logs `[publisher] DRY_RUN_CANDIDATE`, vérifier que les candidats pertinents au match affichent le `match_id` correspondant une fois le match et la watchlist présents en base.

---

### Règles de preuve des patterns

Les règles suivantes s'appliquent durant la répétition :

- `language_convergence` n'est candidate automatiquement éligible que si une proposition structurée équivalente est détectée sur des pages de `article_type === "match"` dans au moins deux éditions et si elle est rattachée à un `match_id` unique.
- Le même `proposition_type` seul ne suffit jamais pour établir une convergence publiable.
- `article_instability` est affiché en dry-run comme une activité à vérifier — la détection automatique ne prouve pas une séquence ajout/retrait/restauration.
- `under_radar` est affiché en dry-run comme un ajout isolé à vérifier — l'absence de nouvelle détection ne prouve pas l'absence du fait dans les autres articles.
- `article_instability`, `under_radar` et toute `language_convergence` non rattachée à un `match_id` unique sont exclus de toute publication automatique tant qu'une validation manuelle plus forte n'est pas mise en place.

- Remarque : le résultat brut d'un match (`match_result`) n'est **pas** utilisé pour une convergence automatiquement éligible dans cette version, car le payload ne prouve pas encore un ordre d'équipes comparable entre éditions.
- Remarque : les minutes de temps additionnel sont conservées distinctement (par ex. `90+1` ≠ `90+3`) pour éviter de rapprocher deux événements différents.


## 9. Fichiers du dispositif

| Fichier | Rôle |
|---------|------|
| [`ucl-final-2026-psg-arsenal.match.json`](../../data/live/rehearsals/ucl-final-2026-psg-arsenal.match.json) | Définition du match |
| [`ucl-final-2026-rehearsal.watchlist.json`](../../worker/seeds/ucl-final-2026-rehearsal.watchlist.json) | Watchlist Wikipedia (4 entités, 12 articles) |
| [`import-rehearsal-match.ts`](../../scripts/import-rehearsal-match.ts) | Import match + équipes |
| [`repair-rehearsal-team-entity-links.ts`](../../scripts/repair-rehearsal-team-entity-links.ts) | Réalignement entités dupliquées → canoniques |
| [`build-rehearsal-match-watchlist.ts`](../../scripts/build-rehearsal-match-watchlist.ts) | Rattachement articles ↔ match |
