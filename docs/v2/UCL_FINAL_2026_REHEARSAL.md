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

## 4. Ordre d'exécution

> [!CAUTION]
> **Ne pas exécuter ces commandes avant que la branche soit mergée dans `main` et que les migrations SQL nécessaires aient été appliquées dans Supabase.**

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

### Étape 3 — Seed la watchlist Wikipedia

```bash
npm run seed:rehearsal:watchlist
```

> [!WARNING]
> Le script `seed-worker-watchlist.ts` **écrit directement en base** et ne possède pas de mode dry-run. Ne l'exécuter qu'après :
> - avoir validé le contenu du fichier `worker/seeds/ucl-final-2026-rehearsal.watchlist.json`
> - avoir explicitement accepté l'écriture en base
> - toutes les insertions sont des upserts idempotents : relancer est safe

### Étape 4 — Rattacher les articles au match en dry-run

```bash
npm run build:rehearsal:watchlist
```

> [!NOTE]
> Ce script **nécessite une connexion Supabase** même en dry-run (il lit `matches`, `entities` et `wiki_articles`). Sans variables d'environnement configurées, il échouera.
>
> Le script valide désormais qu'il trouve exactement 12 articles (4 entités × 3 langues) avant d'autoriser l'upsert.

### Étape 5 — Rattacher les articles au match (après validation)

```bash
npm run build:rehearsal:watchlist -- --apply
```

---

## 5. Variables Render pendant le match

| Variable | Valeur | Effet |
|----------|--------|-------|
| `WORKER_DRY_RUN` | `false` | Le worker collecte les traces réelles |
| `ANALYZER_DRY_RUN` | `false` | L'analyzer écrit les propositions réelles |
| `PATTERNS_DRY_RUN` | `true` | Le pattern matcher simule et logue les candidats |
| `AUTO_PUBLICATION_ENABLED` | `false` | **Verrou absolu** — aucune publication publique |

---

## 6. Critères de succès

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

## 7. Fichiers du dispositif

| Fichier | Rôle |
|---------|------|
| [`ucl-final-2026-psg-arsenal.match.json`](../../data/live/rehearsals/ucl-final-2026-psg-arsenal.match.json) | Définition du match |
| [`ucl-final-2026-rehearsal.watchlist.json`](../../worker/seeds/ucl-final-2026-rehearsal.watchlist.json) | Watchlist Wikipedia (4 entités, 12 articles) |
| [`import-rehearsal-match.ts`](../../scripts/import-rehearsal-match.ts) | Import match + équipes |
| [`build-rehearsal-match-watchlist.ts`](../../scripts/build-rehearsal-match-watchlist.ts) | Rattachement articles ↔ match |
