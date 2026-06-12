# ATLAS MONDIAL 2026 — Spécification complète v2.1 ("Atlas")

> **CHANGELOG**
> - **v2.1 (12 juin 2026)** — corrections documentaires, AUCUN changement de règle (engine_version inchangé : `atlas_engine_v1`) :
>   1. vocabulaire : « annexe »/« annexables » remplacés par « prend »/« récupérables » — la spec doit respecter son propre §22.3 (le code, lui, était déjà conforme) ;
>   2. infra : worker déployé sur **Render** (Background Worker, `render.yaml`), pas Railway ;
>   3. carte réelle générée : **682 hexes** (480 nationaux + 202 neutres), pas ≈ 630 ;
>   4. la route `/tiers` n'existe pas : le ThirdsTable vit dans `/groupes` (le tableau §12 fait foi) ;
>   5. constat payload réel (12/06) : stage API `LAST_32` confirmé ; score décisif dans `score.fullTime` avec `duration` (`REGULAR`/…), conforme à `lib/providers/extract-score.ts`.
> - **v2.0** — spécification initiale.

> **Document autonome.** Il remplace toute spec antérieure. L'agent de code qui lit ceci n'a comme autre contexte que le repo existant `Wikimatch`. Tout ce qui n'est pas dans ce document ou dans le repo n'existe pas.
> Langue produit : français. Code, tables, variables : anglais.
> Nom de code : `atlas`. Nom public provisoire : **« L'Atlas du Mondial »** (à confirmer avant mise en ligne du domaine).

---

## 0. Mission, contexte et règles de travail pour l'agent

### 0.1 Ce que tu construis

Un **site spectacle, sans aucun compte utilisateur**, qui suit la Coupe du Monde 2026 (11 juin → 19 juillet 2026) sous la forme d'une **carte hexagonale mondiale vivante** : les vrais résultats des matchs redessinent les frontières comme dans un Risk ("le Maroc prend Madrid"). Autour de cette carte : un moteur de scénarios de qualification (Monte-Carlo), un recap de nuit automatique, un drama-mètre par match, un replay du tournoi, et une machine à images partageables. Le produit est à la fois **fun visuellement** et **utile** (il répond à de vraies douleurs : matchs en pleine nuit européenne, format à 48 équipes incompréhensible).

### 0.2 Le repo de départ : `Wikimatch`

Le repo contient un ancien projet (observatoire d'éditions Wikipédia liées au foot) **dont le concept est abandonné à 100 %**. Règles de chantier :

**À CONSERVER OBLIGATOIREMENT (étape 0, avant toute destruction) :**
1. **La direction artistique et l'UI.** Avant de supprimer quoi que ce soit, faire un audit complet de `src/` et `index.html` et produire deux fichiers versionnés :
   - `src/design/tokens.ts` : palette de couleurs exacte (hex), familles de polices + imports, échelle typographique, espacements, rayons de bordure, ombres, durées/courbes d'animation — extraits du code existant.
   - `DESIGN.md` : inventaire des composants UI existants réutilisables (boutons, cards, layout, header/nav, badges, états vides…), avec capture de leur usage, et la consigne : **tout nouveau composant doit utiliser ces tokens**. La nouvelle app doit être visuellement la fille du Wikimatch actuel.
2. La config de déploiement **Vercel** (`vercel.json`, projet déjà branché) et la structure `api/` (serverless functions Vercel).
3. Le projet **Supabase** existant (URL/clés dans les env vars Vercel) — on crée un nouveau schéma `atlas`, on ne touche pas aux anciennes tables (elles seront droppées à la main plus tard).
4. La toolchain : **Vite + React + TypeScript**. On ne migre PAS vers Next.js (voir §14 pour la stratégie SEO/OG compatible SPA).

**À SUPPRIMER (après l'étape 0) :** le worker SSE Wikimedia (`worker/`), `analyzer/`, `patterns/`, les routes `api/public/v1/*` liées à Wikipédia, `runtime/`, `.bmad-core/`, `awesome-design-md-main/`, `prompt.txt`, `data/live/`, `docs/v2/` — et toute dépendance npm devenue orpheline. Le README est réécrit pour décrire l'Atlas.

### 0.3 Règles de travail (normatives)

1. Ce document est la source de vérité. En cas de conflit avec du code existant : le document gagne.
2. Toutes les constantes de gameplay/affichage vivent dans `game_config` (§19), chargées au boot, surchargées en base. **Aucune constante magique en dur.**
3. Tout calcul d'état (résolution de match, simulation) est **déterministe, idempotent, rejouable** : la carte doit être reconstructible à l'identique en rejouant `hex_events` (§18.4). C'est la garantie anti-catastrophe n°1.
4. Le client ne calcule jamais l'état : il l'affiche. Tout l'état vient de l'API/DB.
5. Construire dans l'ordre des phases §20. Ne pas commencer une phase tant que les critères de la précédente ne sont pas verts.
6. Mobile-first : la majorité du trafic viendra de liens partagés ouverts sur téléphone.

---

## 1. Produit — pitch et principes

**Pitch (1 phrase) :** *La Coupe du Monde, racontée par une carte : chaque victoire réelle redessine les frontières du monde, et chaque matin tu découvres ce que la nuit a changé.*

**Principes (à respecter dans chaque décision) :**
- **P1 — Spectateur-first, zéro compte.** Aucune auth, aucun mur. Tout est public, tout est URL.
- **P2 — La carte vit toute seule.** Le moteur tourne sans aucun visiteur. Le site est intéressant pour une personne comme pour un million.
- **P3 — Fun ET utile.** Chaque module spectaculaire doit répondre à une douleur réelle (§1.1) ou être coupé.
- **P4 — Tout est screenshotable et linkable.** Chaque état intéressant a une URL stable et une OG image dédiée.
- **P5 — Fiction sportive, jamais géopolitique.** Vocabulaire ludique strict (§22). Aucun argent réel, aucun pari, jamais.
- **P6 — Déterminisme absolu.** Aucun aléatoire dans la résolution (le Monte-Carlo est seedé et hors état de carte).
- **P7 — Le produit finit le 19 juillet.** C'est un événement, pas un service. Assumer : la page finale est le feu d'artifice, pas un onboarding vers autre chose.

### 1.1 Les douleurs adressées (la raison d'exister au-delà du fun)

| Douleur réelle | Module qui y répond |
|---|---|
| Mondial aux USA/Mexique/Canada → la moitié des matchs entre 21h et 5h heure française : « j'ai tout raté » | **Le Recap de la Nuit** (§8) : la nuit résumée en 60 s, carte animée + faits saillants, publié à 07:30 |
| Nouveau format 48 équipes / 12 groupes / 8 meilleurs troisièmes : personne ne comprend qui se qualifie comment | **Le moteur de scénarios** (§6) : % de qualification en continu + conditions lisibles la dernière journée |
| « Il y a 4 matchs ce soir, lequel vaut le coup ? » | **Le Drama-mètre** (§7) : un score 0–100 d'enjeu par match |
| Suivre le tournoi = 15 onglets (calendrier, classements, tableau) | **L'Atlas** est le hub : carte + groupes + tableau + calendrier, une seule URL à retenir |
| Les contenus de recap existants sont du texte ennuyeux | La carte est le format : avant/après, replay, conquêtes nommées (« le Maroc prend Madrid ») |

---

## 2. Glossaire

| Terme | Définition |
|---|---|
| **Nation** | Une des 48 équipes qualifiées. États : `alive`, `eliminated`, `champion`. |
| **Hex** | Case de la carte. Propriété : une nation, `neutral`, `ruins`, `memorial`. |
| **Capitale (sportive)** | Hex de départ spécial. Imprenable tant que la nation est `alive`. Devient `memorial` (grisé, drapeau, intouchable à jamais) à l'élimination. |
| **Ruines** | Hexes d'une nation éliminée (hors capitale). Décor dramatique, partiellement récupérables (§5.8). |
| **Enclave** | Hexes d'une nation non contigus à son bloc principal. Voulu et célébré. |
| **Résolution** | Application déterministe d'un match terminé sur la carte. |
| **Frame** | État de la carte à un instant T, reconstruit depuis `hex_events` (pour le replay). |
| **La Grande Fracture** | La nuit du 27 juin : fin des groupes, 16 nations meurent d'un coup (24 qualifiées + 8 meilleurs troisièmes sur 48 → 16 éliminées). Événement produit majeur. |
| **Drama** | Score 0–100 d'enjeu d'un match à venir (§7). |

---

## 3. Données — tournoi et sources (TOUT ce qu'il faut savoir pour « chopper la data »)

### 3.1 Le tournoi (référence ; les dates exactes des matchs viennent de l'API, jamais d'ici)

- 48 équipes, 12 groupes de 4 (A–L), **104 matchs**, du 11 juin au 19 juillet 2026, aux USA/Canada/Mexique.
- Se qualifient pour la phase finale : les 2 premiers de chaque groupe + les **8 meilleurs troisièmes** → un tableau à **32** (16es de finale), puis 8es, quarts, demies, match pour la 3e place, finale le 19 juillet (MetLife Stadium).
- ⚠️ Les règles exactes de départage (tie-breakers de groupe et classement des troisièmes) doivent être **vérifiées dans le règlement officiel au moment du seed** et encodées en config (§6.4) — la spec donne l'ordre standard attendu, mais c'est `game_config` qui fait foi.

### 3.2 Source primaire : football-data.org v4

- Compétition Coupe du Monde : code **`WC`** (id 2000). Le free tier la couvre historiquement — **à confirmer au premier appel** ; limite ~10 requêtes/minute.
- Auth : header `X-Auth-Token: $FOOTBALL_DATA_TOKEN` (env var Vercel + worker). S'inscrire sur football-data.org pour obtenir le token (gratuit).
- Endpoints utilisés :
  - `GET https://api.football-data.org/v4/competitions/WC/teams` → seed des équipes (id, name, tla, crest — **ne pas utiliser `crest`**, voir §22).
  - `GET https://api.football-data.org/v4/competitions/WC/matches` → les 104 matchs (id, utcDate, stage, group, homeTeam, awayTeam, status, score).
  - `GET .../matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD` → polling quotidien (1 appel couvre la journée).
- Statuts rencontrés : `SCHEDULED`, `TIMED`, `IN_PLAY`, `PAUSED`, `FINISHED`, `POSTPONED`, `SUSPENDED`, `CANCELLED`.
- Score : objet `score` avec `winner` (`HOME_TEAM`/`AWAY_TEAM`/`DRAW`), `duration` (`REGULAR`/`EXTRA_TIME`/`PENALTY_SHOOTOUT`) et sous-objets par période. ⚠️ La sémantique exacte de `fullTime` vs `regularTime`/`extraTime`/`penalties` pour les matchs à prolongation doit être **vérifiée sur un payload réel** et figée dans `lib/providers/extract-score.ts`, couvert par des tests sur payloads enregistrés (fixtures JSON commitées).
- Stages attendus : `GROUP_STAGE`, `LAST_32` (à vérifier — nouveau format), `LAST_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE`, `FINAL`. Mapper vers notre enum interne (§15) avec une table de correspondance en config ; si un stage inconnu apparaît : alerte + refus de résoudre (jamais deviner).

### 3.3 Couche d'abstraction (NORMATIF — ne jamais coupler le moteur à l'API)

```ts
// lib/providers/types.ts
export interface NormalizedMatch {
  providerId: string;          // id football-data, ou "manual-<n>"
  stage: Stage;                // notre enum
  group: string | null;        // 'A'..'L'
  homeFifa: string; awayFifa: string;   // codes FIFA 3 lettres
  kickoffUtc: string;          // ISO
  status: MatchStatus;
  scoreHome: number | null; scoreAway: number | null;   // score "décisif" (prolongation incluse)
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT' | null;
  pensHome: number | null; pensAway: number | null;
}
export interface ResultProvider {
  name: string;
  fetchSchedule(): Promise<NormalizedMatch[]>;
  fetchWindow(fromIso: string, toIso: string): Promise<NormalizedMatch[]>;
}
```

Trois implémentations, lues dans cet ordre de priorité par le moteur :
1. **`ManualOverrideProvider`** : lit la table `match_overrides` (saisie admin, §12 route `/admin`). **Prime toujours.** C'est aussi l'outil de test : une journée entière doit pouvoir être jouée 100 % en manuel.
2. **`FootballDataProvider`** : implémentation par défaut.
3. **`CsvImportProvider`** : plan C. Format documenté dans `docs/csv-format.md` : `provider_id,stage,group,home_fifa,away_fifa,kickoff_utc,status,score_home,score_away,duration,pens_home,pens_away`. Import via la page admin.

### 3.4 Données seed (fichiers versionnés dans `data/`, vérifiés à la main avant lancement)

1. **`data/nations-seed.json`** — les 48 nations :
   ```json
   { "fifa": "MAR", "name_fr": "Maroc", "flag": "🇲🇦", "fd_team_id": 0,
     "fifa_rank": 0, "fifa_points": 0, "group": "?", "color": "#hex",
     "capital_q": 0, "capital_r": 0, "capital_name": "Rabat" }
   ```
   - `fd_team_id` : rempli par le script de seed (match par `tla`/nom, **vérification manuelle des 48 obligatoire** — c'est le risque d'erreur n°1).
   - `fifa_rank` / `fifa_points` : depuis le dernier classement FIFA publié avant le tournoi (saisie manuelle, source : page classement FIFA ; figé pour tout le tournoi).
   - `color` : couleur de nation sur la carte. Générer une palette de 48 couleurs distinctes **dérivée des tokens DA de Wikimatch** (même saturation/luminosité que la palette existante), contraste vérifié sur le fond de carte ; voisins géographiques = couleurs éloignées (graph coloring simple ou ajustement manuel).
2. **`data/city-names.json`** — ≥ 10 noms de villes par nation (la capitale réelle pour l'hex capitale, puis grandes villes). Source : liste rédigée à la main (ou générée par LLM puis **relue à la main** — orthographe FR). C'est le carburant des récits.
3. **`data/map-seed.json`** — coordonnées axiales `(q,r)` de la capitale de chaque nation sur le planisphère stylisé (§4.2), posées à la main pour ressembler à la géographie réelle.
4. **`data/tiebreakers.json`** — ordre des critères de départage (§6.4), vérifié contre le règlement officiel.

### 3.5 Pas de data « joueurs/effectifs » en v1

Aucun besoin d'API d'effectifs, de stats individuelles ou de cotes de bookmakers. Tout le produit tourne avec : calendrier + scores + classement FIFA seedé. (Si un jour on veut du trivia, le seed Wikidata de l'ancien projet `Revision90` existe — hors scope v1.)

---

## 4. La carte — génération et topologie

### 4.1 Géométrie

- Grille hexagonale **pointy-top**, coordonnées **axiales** `(q, r)`. Distance : `(|dq| + |dr| + |dq+dr|)/2`.
- Monde : silhouette de planisphère stylisé dans un rectangle axial ≈ **44 × 26**. Seuls les hexes « terre + zones tampons » existent en base (**682 dans la carte générée**) : **480 hexes nationaux** (48 × 10) + **202 hexes `neutral`** (zones tampons entre blocs continentaux). L'océan n'est pas stocké : c'est le fond du SVG.

### 4.2 Génération (script `scripts/generate-map.ts`)

1. Lire `map-seed.json` (capitales posées à la main).
2. Pour chaque nation, **flood-fill BFS** de 9 hexes autour de la capitale. En zone dense (Europe !), le BFS alterne entre nations par ordre alphabétique de code FIFA, un hex par tour, pour une répartition équitable.
3. Poser les ≈150 hexes `neutral` dans les interstices (règle : tout hex « terre » non attribué).
4. Nommer chaque hex national depuis `city-names.json` (capitale = vraie capitale ; le reste par distance croissante = villes par taille décroissante). Hexes neutres : noms d'océans/déserts/cols (« Atlantique Nord », « Sahara », « Pacifique »).
5. Sortie : `data/map-generated.json`, **versionné et audité visuellement à la main** (page de debug `/admin/map-preview`) avant lancement. La carte de départ est figée — jamais régénérée au runtime.

### 4.3 Égalité stricte et adjacence

- 10 hexes chacun, aucun bonus d'aucune sorte. La géographie est du flavor, pas de la mécanique.
- **Les conquêtes se font en place** (l'hex change de propriétaire là où il est) : aucune contrainte d'adjacence vainqueur/perdant → les **enclaves** émergent naturellement et font les meilleures histoires. L'adjacence ne sert que de tie-break de sélection (§5.6).

---

## 5. Le moteur de conquête (les matchs sont les dés)

### 5.1 Déclenchement

Un match passe à `FINISHED` (provider §3.3) → délai de confirmation de **5 minutes** → re-fetch → résolution (§18.1).

### 5.2 Vainqueur

- Score différent (prolongation incluse) → vainqueur, `goal_diff = |Δ|` (buts de prolongation comptés).
- Tirs au but → vainqueur des TAB, `goal_diff = 0`.
- Nul (groupes uniquement) → §5.5.

### 5.3 Gain de base

```
GROUP : 2 + min(max(goal_diff − 1, 0), 2)   → 2 à 4 hexes
R32 / R16 : 4 + idem                         → 4 à 6
QF : 5 + idem                                → 5 à 7
SF : 6 + idem                                → 6 à 8
THIRD : 3 (fixe)
FINAL : 10 (fixe), puis §5.9
```

### 5.4 Surextension impériale (gardée : elle maintient la carte disputée et lisible)

```
final_gain = clamp( round( base × clamp(median_alive / T_winner, 0.5, 2.0) ), 1, 12 )
```
`median_alive` = territoire médian des nations `alive` avant résolution ; `T_winner` = hexes du vainqueur avant résolution. Un empire 2× la médiane gagne moitié moins ; un poucet gagne double. Plancher 1 : toute victoire prend au moins un hex.

### 5.5 Match nul

Chaque équipe prend **1 hex `neutral`**, le plus proche de sa capitale (tie-break §5.6.4). Plus de neutres disponibles → aucun gain, event `draw_no_neutral`.

### 5.6 Sélection déterministe des hexes pris (NORMATIF)

Hexes éligibles du perdant = tous sauf capitale. Tri :
1. distance à la capitale du **perdant**, **décroissante** (l'empire perd ses marches, le cœur tient) ;
2. hexes `conquered=true` avant hexes d'origine (le territoire volé est moins enraciné) ;
3. adjacents au territoire du vainqueur d'abord ;
4. tie-break final : `(q, r)` lexicographique croissant.
Prendre les `final_gain` premiers. Si le perdant n'a pas assez d'hexes (réduit à sa capitale) : le surplus « déborde » sur les hexes `ruins` puis `neutral` les plus proches de la capitale du perdant ; s'il n'y a rien, surplus perdu (`gain_truncated` loggué).

### 5.7 Récits et événements

Chaque hex transféré → ligne `hex_events` (append-only). Chaque résolution → un event agrégé `match_resolved` avec un récit généré depuis des **templates fermés** (liste relue à la main, vocabulaire §22) :
`"{flag_w} {Nation_w} prend {n} territoires à {Nation_l}, dont {ville_1}{, ville_2}"` / variante enclave : `"{flag_w} {Nation_w} plante une enclave à {ville_1}"` (si aucun hex pris n'est adjacent au territoire du vainqueur). Le champ `narrative` est stocké, jamais regénéré.

### 5.8 Élimination, ruines, héritage

- **Phase KO** : le perdant passe `eliminated` à la résolution (cas demi-finales : après le match pour la 3e place, les deux perdants de demies passent `eliminated` à la résolution de ce match-là).
- **Phase de groupes** : éliminations constatées **uniquement** à la toute fin des poules par le job `finalize_group_stage` (§16.5) — jamais au fil de l'eau (zéro risque de calcul faux, et ça crée **la Grande Fracture** : 16 nations grisées d'un coup la nuit du 27 juin, l'image la plus partagée du mois, soigner l'animation).
- À l'élimination : la capitale devient `memorial` (intouchable, grisée, drapeau — le cimetière des nations est une feature). Le reste du territoire :
  - élimination **en KO** : le vainqueur du match **hérite immédiatement de la moitié** des hexes restants du perdant (`floor(n/2)`, sélection §5.6) — le geste dramatique du "vae victis" ; l'autre moitié devient `ruins` ;
  - élimination **de groupes** (Grande Fracture) : tout devient `ruins` (pas d'éliminateur unique).
- Les `ruins` restent ensuite décoratives (grisé sombre, nom conservé) **sauf** débordement §5.6 : elles sont la première réserve des débordements → elles se font grignoter au fil des KO. (Pas de mécanique de colonisation : c'était la couche jeu, supprimée.)

### 5.9 Champion

À la résolution de la finale : gain de 10 hexes, puis **`world_conquered`** : tous les hexes `ruins` et `neutral` restants passent au champion en une vague animée depuis sa capitale (ordre : distance croissante — l'animation de clôture du produit). Les `memorial` restent à jamais. Flag global `game_over=true` : plus aucune mutation.

---

## 6. Le moteur de scénarios (Monte-Carlo) — le module « utile » n°1

### 6.1 Objectif

Répondre en continu à : « quelles sont les chances de qualification de chaque nation, et de quoi ça dépend ? ». Sorties par nation : `p_qualify` (sortir des groupes), `p_top2`, `p_best_third`, `p_win_group`, et en KO : `p_reach[R16|QF|SF|FINAL]`, `p_champion`. Plus, pour la dernière journée de chaque groupe : des **conditions lisibles** (§6.5).

### 6.2 Modèle de probabilité d'un match (simple, assumé, documenté sur /methodo)

Soient `Pa`, `Pb` les points FIFA seedés (§3.4). Expected score Elo :
```
E = 1 / (1 + 10^(−(Pa − Pb) / 600))
p_draw (groupes) = clamp(0.26 − 0.20 × |2E − 1|, 0.10, 0.26)
p_a = E × (1 − p_draw) ; p_b = (1 − E) × (1 − p_draw)
```
En KO : pas de nul ; si le tirage des buts donne un nul, qualification au « TAB virtuel » : Bernoulli(E).

**Scores simulés** (nécessaires pour les départages à la différence de buts) :
```
μ_total = 2.6 ; λ_a = μ_total × (0.30 + 0.40 × E) ; λ_b = μ_total − λ_a
goals_a ~ Poisson(λ_a) ; goals_b ~ Poisson(λ_b)
// conditionner sur l'issue tirée (a gagne / nul / b gagne) :
// re-tirer jusqu'à cohérence, max 20 essais, sinon forcer le score minimal (1-0, 0-0, 0-1)
```
Constantes (`600`, `0.26`, `2.6`…) en `game_config` (§19) pour tuning sans deploy.

### 6.3 La simulation

- **N = 10 000 itérations** par run. RNG **seedé** (xorshift128+ maison, seed = `hash(run_date + engine_version)`) → résultats reproductibles, debuggables.
- Chaque itération : jouer tous les matchs restants (groupes puis tableau complet), appliquer les départages (§6.4), classer les troisièmes, construire le tableau des 32 (selon la grille d'appariements officielle des positions, **encodée en config** depuis le calendrier officiel — les appariements 1A vs 3CDF etc. sont dans le calendrier API : utiliser les placeholders du calendrier seedé comme source), dérouler jusqu'à la finale.
- Comptage des issues → probabilités. Stocker le run complet dans `sim_runs` (§15).
- Déclenchement : après **chaque résolution de match** + un run quotidien à 07:00 (avant le recap). Coût : 10 000 × ~100 matchs simulés = trivial en Node (< 5 s). Tourne dans le worker (§16).

### 6.4 Départages (encodés en `data/tiebreakers.json`, ⚠️ à vérifier contre le règlement officiel)

Ordre attendu en groupe : points → différence de buts → buts marqués → résultats entre équipes à égalité (mini-classement) → fair-play (non simulable : remplacé par tirage 50/50 dans la simu, et marqué « départage aléatoire » dans l'UI) → tirage au sort. Classement des 8 meilleurs troisièmes : points → différence → buts marqués → (fair-play→aléa). Le simulateur lit cet ordre depuis la config ; si le règlement réel diffère, on change le JSON, pas le code.

### 6.5 Conditions lisibles (la killer feature de la dernière journée)

Quand il reste **≤ 2 matchs** dans un groupe (donc à la journée 3, matchs simultanés) :
1. Énumérer les **9 combinaisons d'issues** (3 × 3 : V/N/D pour chaque match).
2. Pour chaque combinaison, calculer le classement *quand il est décidable par les seules issues* (points + confrontations). S'il dépend de la différence de buts → marquer la combinaison `GD_DEPENDENT`.
3. Générer le texte par nation, templates fermés :
   - « ✅ Qualifié quel que soit le résultat » / « ❌ Éliminé quoi qu'il arrive »
   - « Qualifié si victoire » / « … si victoire, ou si nul ET défaite du {X} »
   - cas `GD_DEPENDENT` : « Qualifié en cas de nul **selon la différence de buts** (actuellement {+2} contre {−1} pour {X}) » — honnête plutôt que faussement précis ; le % Monte-Carlo affiché à côté quantifie.
4. Pour la qualification via « meilleurs troisièmes » (qui dépend des 11 autres groupes) : pas d'énumération, uniquement le % simulé + la phrase « comme 3e : {p}% de chances d'être repêché ».
Stockage : table `qualification_conditions` régénérée à chaque run (§15).

---

## 7. Le Drama-mètre

Score 0–100 par match à venir, recalculé à chaque run de simulation. Répond à « lequel regarder ce soir ? ».

```
closeness   = 1 − |2E − 1|                                  // 0..1, équilibre des forces
swing       = max sur les 2 équipes de |p_qualify(si victoire) − p_qualify(si défaite)|
              // calculé par 2 sous-runs conditionnés (forcer l'issue, re-simuler 2000 itérations)
elim_flag   = 1 si une des 2 équipes peut être mathématiquement éliminée ce soir (KO: toujours 1)
stage_w     = GROUP_J1: 0.3 | J2: 0.6 | J3: 1.0 | R32/R16: 0.8 | QF: 0.9 | SF/FINAL: 1.0
upset_pot   = 1 − E_favori                                   // potentiel de surprise

drama = round( 100 × clamp( 0.35×swing + 0.25×closeness + 0.20×elim_flag×stage_w
                            + 0.10×stage_w + 0.10×upset_pot , 0, 1) )
```
Affichage : jauge + label (`0–39` « tranquille », `40–69` « à suivre », `70–89` « chaud », `90+` « immanquable »). Stocké dans `match_stakes` (§15). Le détail du calcul est expliqué sur `/methodo` (P3 : la transparence crée la confiance).

---

## 8. Le Recap de la Nuit (le module « utile » n°2, publié à 07:30 Europe/Paris)

Job quotidien `build_night_recap` (§16.4). Entrées : résolutions et events entre 18:00 (veille, Paris) et 07:00. Sorties → table `recaps` + page `/nuit/:date` + images.

**Contenu généré (algorithme de sélection, ordre fixe) :**
1. **La carte avant/après** de la nuit (deux frames §10 + composant slider).
2. **Le fait majeur** : la résolution au plus grand `final_gain` ; à égalité, celle au plus grand drama pré-match.
3. **La surprise** : la victoire à la plus petite probabilité pré-match (`p < 0.35` sinon section omise).
4. **Les mouvements** : liste par nation `Δ hexes` de la nuit (top 5 gains, top 5 pertes).
5. **Le basculement de qualif** : la nation dont `p_qualify` a le plus bougé (|Δ| max entre le run d'hier 07:00 et celui de 07:00).
6. **Ce soir** : les matchs du jour triés par drama décroissant, avec heure **locale du visiteur** (`Intl.DateTimeFormat`, défaut Europe/Paris).
Chaque section a son template texte fermé. Zéro LLM au runtime (déterminisme, coût, ton maîtrisé).

---

## 9. Le mode match live (spectacle pendant le match)

Pendant un match `IN_PLAY`/`PAUSED` : la page match (et un bandeau sur la home) affiche la **résolution provisoire** : « au score actuel, {Nation} prendrait {n} territoires : {villes} », avec les hexes concernés qui **pulsent** sur la carte.
- Calcul : endpoint `GET /api/v1/matches/:id/provisional` → exécute §5.3–5.6 à blanc (aucune écriture) sur le score courant. Le client re-fetch toutes les 60 s pendant le live.
- Si le poller passe à 2 min pendant les fenêtres de match (§16.2), la « minute » du score peut retarder : assumer, afficher « score il y a ~2 min ».
- C'est le seul module temps réel ; tout le reste est à la résolution. Pas de minute-par-minute des buts en v1 (§23).

## 10. Le Replay (la timeline du tournoi)

- `hex_events` est la source unique. Une **frame** = état complet de la carte à un instant T = replay des events jusqu'à T (mémoïsé par jour via `snapshots`).
- UI : un **scrubber** sous la carte (composant `TimeScrubber`) gradué par jour, avec marqueurs aux résolutions ; bouton ▶ qui rejoue à vitesse `1 jour ≈ 1,2 s`, les transferts animés par lots (par résolution, pas par hex).
- Implémentation client : charger `snapshots` (un état compact/jour, léger) + les events du jour scrubbé. Jamais recalculer côté client : interpoler entre états fournis.
- URL : `/?t=2026-06-21` (état de la carte ce jour-là, linkable/screenshotable) — important pour le partage rétrospectif.

## 11. La machine à contenu (publication sans humain)

1. **Snapshot quotidien** (07:30, avec le recap) : PNG 1200×630 (OG) + 1080×1920 (format story) de la carte annotée du delta de nuit. URL stable `/snapshot/:date`.
2. **Cartes d'événement** : à chaque `match_resolved`, image OG dédiée (zone avant/après + récit). URL `/m/:id`.
3. **OG images** : générées par fonctions Vercel `@vercel/og` (Satori) dans `api/og/*.tsx` : fond de carte pré-rendu en SVG statique + diff dessiné par-dessus ; cache `s-maxage=86400` ; styles depuis les tokens DA (§0.2).
4. **Widget embed** : route `/embed/map` — la carte seule, sans chrome, `postMessage` de hauteur, libre d'intégration (iframe). Un lien discret « ouvrir l'Atlas » en coin : le widget est le canal de distribution (blogs, Discord, Notion de groupes de potes).
5. **Flux** : `/feed.xml` (RSS des recaps quotidiens) — gratuit à faire, adore les agrégateurs.

---

## 12. Arborescence complète du site (routes, contenu, états)

> SPA Vite/React, routing client (`react-router`). Chaque route listée ici doit exister. Le shell visuel (header, footer, nav) réutilise celui de Wikimatch (§0.2).

| Route | Contenu | États particuliers |
|---|---|---|
| `/` | **La Carte** plein écran : HexMap interactive (pan/zoom/hover→tooltip ville+nation), sidebar repliable « classement territorial » (48 nations triées par hexes, sparkline 7 j), bandeau bas « ce soir » (matchs du jour triés par drama), FeedTicker des derniers récits, TimeScrubber. Param `?t=` (§10). | Avant le 11/06 : carte initiale + compte à rebours + explication 3 slides. Après la finale : état `world_conquered` + CTA `/fin`. |
| `/nuit/:date` | Le Recap de la Nuit (§8), sections dans l'ordre spec. `/nuit` → redirige vers la dernière. | Nuit sans match : « nuit calme » + ce soir. |
| `/m/:id` | Page match. Avant : équipes, heure locale, drama + son explication, enjeux de qualif des deux camps, « territoires en jeu » (provisoire à 1-0 fictif pour visualiser). Pendant : score, §9 live. Après : score final, récit, carte avant/après (slider), liste des hexes transférés, lien recap. | POSTPONED/CANCELLED : bandeau dédié. |
| `/n/:code` | Page nation : drapeau, statut, territoire actuel + sparkline depuis J1, `p_qualify`/`p_champion`, prochain match, historique complet de ses conquêtes/pertes (events filtrés), villes possédées. | `eliminated` : design « memorial » (grisé, dates « 11 juin – 27 juin 2026 », cause de la mort = lien `/m/:id`). |
| `/groupes` | Les 12 groupes : mini-classements vivants, `p_qualify` par équipe (barres), **tableau des troisièmes** (le classement des 12 troisièmes avec la ligne de coupe après le 8e — LA vue introuvable ailleurs). | Dernière journée : bascule en mode « conditions » (§6.5) mis en avant. |
| `/groupes/:letter` | Détail groupe : classement, matchs restants, matrice des 9 scénarios de la dernière journée (§6.5), conditions par équipe. | |
| `/tableau` | Le bracket des 32 : arbre complet, % de traversée par nation (heatmap des chemins), « qui peut croiser qui ». | Avant la fin des groupes : bracket en placeholders probabilistes (« 1A (🇫🇷 62%) »). |
| `/calendrier` | Les 104 matchs, groupés par jour, heure locale visiteur, drama, filtres par nation/groupe. | |
| `/memorial` | Le cimetière : les nations mortes, capitales-mémoriaux, date et cause, territoire au moment de la mort. S'étoffe tout le mois — page étrangement populaire à prévoir. | Vide avant le 27/06 (texte teaser). |
| `/snapshot/:date` | Page de partage du snapshot quotidien (image + deltas + liens). | |
| `/fin` | (post-finale) Le récap du tournoi : replay complet auto-play, podium, superlatifs (plus grand empire éphémère, plus grosse surprise, la Grande Fracture), partage final. | 404 avant la finale. |
| `/methodo` | Comment ça marche : règles de conquête vulgarisées, modèle de simulation, drama-mètre, sources de données, disclaimer « jeu de visualisation non officiel, aucune affiliation FIFA » (§22). | |
| `/embed/map` | Widget iframe (§11.4). | |
| `/feed.xml` | RSS des recaps. | |
| `/admin` | Protégé par `ADMIN_TOKEN` (query/header, pas d'auth user). Outils : saisie/édition `match_overrides`, forcer un poll, forcer une résolution, re-run simulation, régénérer recap/snapshot, `/admin/map-preview`, logs des derniers jobs, état `ingest_state`. | |

**Navigation principale (header)** : Carte · La Nuit · Groupes · Tableau · Calendrier · Memorial. Logo → `/`.

---

## 13. Composants UI (inventaire à construire, stylés via les tokens §0.2)

- **`HexMap`** : SVG (viewBox monde), 682 polygones, pan/zoom (wheel + pinch), hover tooltip, hexes cliquables → `/n/:code`, props `frame` (état), `highlights` (pulse §9), `animateDiff` (transferts animés). Si perfs mobiles < 30 fps : basculer le fond en canvas, garder le SVG pour l'interaction (décision mesurée, pas anticipée).
- **`TimeScrubber`** : slider jours + play/pause + marqueurs résolutions.
- **`FeedTicker`** : défilement des `narrative` récents, pausable.
- **`MatchCard`** : drapeaux emoji, heure locale, DramaGauge, statut ; variantes pre/live/post.
- **`DramaGauge`** : jauge 0–100 + label.
- **`QualifBar`** : barre de probabilité avec delta vs hier (▲▼).
- **`GroupTable`** : classement vivant ; mode « conditions » (badges ✅/❌/⚠️GD).
- **`ThirdsTable`** : les 12 troisièmes + ligne de coupe.
- **`Bracket`** : arbre 32, responsive (scroll horizontal mobile).
- **`BeforeAfterMap`** : slider avant/après (deux frames).
- **`NarrativeCard`** : un récit + mini-carte de zone (réutilisé partout, base des OG).
- **`Sparkline`**, **`CountdownHero`**, **`ShareBar`** (Web Share API + copie de lien), **`MemorialStone`**.

---

## 14. SEO, partage & perfs (contrainte : rester en SPA Vite)

- **Le problème** : les crawlers de WhatsApp/X/Discord ne lisent pas le JS → les OG dynamiques exigent du HTML serveur.
- **La solution (sans migrer de framework)** : `vercel.json` route `"/m/:id"`, `"/n/:code"`, `"/snapshot/:date"`, `"/nuit/:date"` vers une fonction serverless `api/meta.ts` qui renvoie un HTML minimal : balises `og:*`/`twitter:*` dynamiques (titre = le récit, image = `api/og/...`) + `<script>` de redirection/hydratation vers la SPA. Les humains ne voient rien, les crawlers ont tout.
- `sitemap.xml` généré (toutes les routes statiques + 104 matchs + 48 nations + dates).
- Budget perf home mobile : < 200 KB JS gzip initial (code-split par route), carte interactive < 3 s sur mobile moyen. Données carte : un seul JSON compact (~25 KB : id,owner,state par hex).
- Realtime : **pas de websocket en v1**. Polling `GET /api/v1/map/diff?since=` toutes les 60 s quand l'onglet est visible (`visibilitychange`). Suffisant : la carte ne bouge qu'aux résolutions.

---

## 15. Modèle de données (Supabase/Postgres, schéma `atlas`)

> RLS : **lecture publique (`anon`) sur tout**, écriture uniquement par le service role (worker/jobs/admin). Aucune écriture client. (Pas de RPC utilisateur : il n'y a pas d'utilisateurs.)

```sql
create schema if not exists atlas;

create table atlas.nations (
  code text primary key,                 -- FIFA 3 lettres
  name_fr text not null, flag text not null, color text not null,
  fifa_rank int not null, fifa_points numeric not null,
  fd_team_id int unique, group_letter text,
  status text not null default 'alive' check (status in ('alive','eliminated','champion')),
  eliminated_at timestamptz, eliminated_by_match int
);

create table atlas.hexes (
  id int primary key,                    -- stable, issu de map-generated.json
  q int not null, r int not null, unique(q,r),
  city_name text not null, is_capital bool not null default false,
  original_owner text references atlas.nations(code),  -- null = neutre d'origine
  owner text, state text not null default 'owned'
    check (state in ('owned','neutral','ruins','memorial')),
  conquered bool not null default false
);
create index on atlas.hexes(owner) where owner is not null;

create table atlas.matches (
  id int primary key,                    -- provider id
  stage text not null check (stage in ('GROUP','R32','R16','QF','SF','THIRD','FINAL')),
  group_letter text, matchday int,       -- 1..3 en groupes
  home text references atlas.nations(code), away text references atlas.nations(code),
  kickoff_utc timestamptz not null,
  status text not null default 'SCHEDULED',
  score_home int, score_away int, duration text, pens_home int, pens_away int,
  raw jsonb, updated_at timestamptz not null default now()
);

create table atlas.match_overrides (     -- saisie admin, prime sur l'API
  match_id int primary key references atlas.matches(id),
  score_home int not null, score_away int not null, duration text not null,
  pens_home int, pens_away int, note text, created_at timestamptz default now()
);

create table atlas.resolutions (
  match_id int primary key references atlas.matches(id),   -- PK = idempotence
  winner text, loser text, is_draw bool not null default false,
  goal_diff int not null default 0, base_gain int not null,
  m_overext numeric(4,2) not null, final_gain int not null,
  hexes_taken int[] not null default '{}', inherited_hexes int[] default '{}',
  narrative text not null, resolved_at timestamptz not null default now(),
  engine_version text not null
);

create table atlas.hex_events (          -- append-only, source du replay
  id bigint generated always as identity primary key,
  hex_id int references atlas.hexes(id), match_id int,
  type text not null check (type in ('captured','inherited','neutral_claimed',
    'ruined','memorial','world_conquered','admin_fix')),
  from_owner text, to_owner text, from_state text, to_state text,
  narrative text, created_at timestamptz not null default now()
);

create table atlas.snapshots (
  date date primary key,
  frame jsonb not null,                  -- [{id,owner,state}] compact
  deltas jsonb not null,                 -- par nation: ±hexes du jour
  og_image_url text, story_image_url text
);

create table atlas.sim_runs (
  id bigint generated always as identity primary key,
  run_at timestamptz not null default now(), seed text not null,
  iterations int not null, engine_version text not null,
  probs jsonb not null    -- par nation: {p_qualify,p_top2,p_third_rescued,p_win_group,
                          --              p_r16,p_qf,p_sf,p_final,p_champion}
);

create table atlas.match_stakes (
  match_id int primary key references atlas.matches(id),
  sim_run_id bigint references atlas.sim_runs(id),
  drama int not null check (drama between 0 and 100),
  components jsonb not null,             -- swing, closeness, elim_flag, stage_w, upset_pot
  computed_at timestamptz default now()
);

create table atlas.qualification_conditions (
  group_letter text not null, nation text not null, sim_run_id bigint,
  status text not null check (status in ('qualified','eliminated','contender')),
  conditions jsonb not null,             -- [{text, gd_dependent}]
  primary key (group_letter, nation)
);

create table atlas.recaps (
  date date primary key,
  sections jsonb not null,               -- contenu structuré §8
  published_at timestamptz
);

create table atlas.game_config (key text primary key, value jsonb not null,
                                updated_at timestamptz default now());
create table atlas.ingest_state (key text primary key, value jsonb not null);
create table atlas.job_log (
  id bigint generated always as identity primary key,
  job text not null, ok bool not null, detail jsonb, created_at timestamptz default now()
);
```

---

## 16. Jobs & workers (où tourne quoi)

**Topologie** : front + API lecture + OG = **Vercel** (existant). Jobs longs/cron = **un petit worker Node sur Render** (Background Worker, `render.yaml`, pattern robuste : reconnexion, backoff, state persisté dans `ingest_state`). Alternative acceptable : Vercel Cron + fonctions — mais le poller à la minute pendant les matchs est plus sain sur un worker. Décision : **worker Render**.

1. **`poll_matches`** — toutes les 2 min si un match est dans [kickoff−30 min, kickoff+180 min], sinon toutes les 30 min. `fetchWindow(jour)`, upsert `matches`. Détection `FINISHED` inédit → planifie `resolve(match_id)` à +5 min.
2. **`resolve(match_id)`** — §18.1. Idempotent (PK `resolutions`), verrou `pg_advisory_xact_lock(match_id)`.
3. **`simulate`** — §6, après chaque résolution + cron 07:00. Écrit `sim_runs`, `match_stakes`, `qualification_conditions`.
4. **`build_night_recap`** — cron 07:30 Europe/Paris : §8, écrit `recaps` + `snapshots` (frame du jour) + déclenche la génération des 2 images (appel des endpoints OG, stockage Supabase Storage, URLs en base).
5. **`finalize_group_stage`** — déclenché manuellement depuis `/admin` (bouton) après la dernière résolution de groupes (sécurité humaine voulue) : calcule les classements finaux + 8 meilleurs troisièmes (mêmes tiebreakers que la simu, mais sur résultats réels ; si un départage tombe sur le critère fair-play non disponible → choix admin demandé), passe 16 nations `eliminated`, exécute la Grande Fracture (memorials + ruins en masse, events), invalide les simulations de groupe.
6. **`healthcheck`** — toutes les 10 min : si un match aurait dû être `FINISHED` depuis > 30 min sans l'être, ou si `poll_matches` n'a pas tourné depuis > 10 min → webhook Discord (`ALERT_WEBHOOK_URL`).
Tous les jobs écrivent dans `job_log`.

---

## 17. API publique (fonctions Vercel `api/`, lecture seule, cache CDN)

```
GET /api/v1/map                  → frame courante compacte (cache 60 s)
GET /api/v1/map/diff?since=ts    → hex_events depuis ts
GET /api/v1/map/frame?date=      → frame historique (replay)
GET /api/v1/nations              → 48 nations + territoire + probas dernier run
GET /api/v1/nations/:code        → détail + historique events + sparkline
GET /api/v1/matches?date=        → matchs (avec drama, statut)
GET /api/v1/matches/:id          → détail + résolution éventuelle
GET /api/v1/matches/:id/provisional → §9 (cache 30 s, uniquement si IN_PLAY)
GET /api/v1/groups | /groups/:letter → classements + conditions
GET /api/v1/thirds               → classement des troisièmes
GET /api/v1/bracket              → arbre des 32 (réel + probabiliste)
GET /api/v1/recaps/:date         → recap structuré
GET /api/v1/feed?limit=50        → derniers récits
POST /api/admin/*                → outils admin, header X-Admin-Token (env ADMIN_TOKEN)
```
Headers cache : `s-maxage` 60 s (map, matches) à 1 j (frames historiques, recaps passés). CORS ouvert en lecture (pour l'embed et les curieux — l'API publique documentée sur /methodo est un mini-canal d'adoption).

---

## 18. Algorithmes normatifs (pseudocode)

### 18.1 `resolve(match_id)`

```
BEGIN; pg_advisory_xact_lock(match_id)
if exists resolutions[match_id]: ROLLBACK; return        -- idempotence
m = normalized match (ManualOverride > FootballData)
assert m.status == FINISHED and stage mappé
(winner, loser, gd, is_draw) = outcome(m)                -- §5.2
if is_draw:
    for side: hex = nearest neutral to capital(side); transfer(hex→side,'neutral_claimed')
    write resolution(is_draw); COMMIT; hooks(); return
base = base_gain(stage, gd)                              -- §5.3
gain = clamp(round(base × clamp(median_alive/T_winner, .5, 2)), 1, 12)
taken = select_hexes(loser, gain)                        -- §5.6 (+ débordement)
for h in taken: transfer(h→winner, conquered=true, 'captured')
if stage in KO:                                          -- élimination + héritage §5.8
    loser.status='eliminated' (sauf perdant de SF: différé au match THIRD)
    inherit = floor(remaining(loser)/2) hexes via §5.6 → winner, 'inherited'
    rest → 'ruins' ; capital → 'memorial'
narrative = render_template(...)                         -- §5.7
write resolution(...); COMMIT
hooks(): simulate(); regen OG /m/:id; touch snapshots du jour
```

### 18.2 `simulate(seed)` — §6.3 (boucle 10 000 itérations, tiebreakers config, écrit les 3 tables).
### 18.3 `provisional(match_id)` — exécute 18.1 « à blanc » (aucun write) sur le score courant ; retourne `{would_gain, hex_ids, narrative_preview}`.
### 18.4 `rebuild-map.ts` — **obligatoire en P0** : repart de `map-generated.json`, rejoue tous les `hex_events` ordonnés par id, compare à l'état `hexes` → diff vide exigé. Tourne en CI et via /admin. C'est le filet de sécurité du produit (carte corrompue = replay et on repart).
### 18.5 `enumerate_conditions(group)` — §6.5.

---

## 19. Constantes (`game_config`, valeurs initiales)

| Clé | Valeur | Réf |
|---|---|---|
| `gain_group/r32_r16/qf/sf/third/final` | 2/4/5/6/3/10 | §5.3 |
| `gain_goaldiff_cap` / `hard_cap` | 2 / 12 | §5.3–5.4 |
| `overext_min/max` | 0.5 / 2.0 | §5.4 |
| `inherit_ratio` | 0.5 | §5.8 |
| `resolution_confirm_delay_s` | 300 | §5.1 |
| `elo_divisor` / `draw_base` / `draw_slope` / `draw_min` | 600 / 0.26 / 0.20 / 0.10 | §6.2 |
| `mu_goals` / `sim_iterations` / `swing_iterations` | 2.6 / 10000 / 2000 | §6.2–§7 |
| `drama_weights` | {swing:.35, close:.25, elim:.20, stage:.10, upset:.10} | §7 |
| `stage_weights` | {GJ1:.3, GJ2:.6, GJ3:1, R32:.8, R16:.8, QF:.9, SF:1, FINAL:1} | §7 |
| `recap_time` / `snapshot_time` | 07:30 Europe/Paris | §8 |
| `poll_fast_s` / `poll_slow_s` | 120 / 1800 | §16.1 |
| `tiebreakers` | contenu de data/tiebreakers.json | §6.4 |
| `game_over` | false | §5.9 |

---

## 20. Plan de build (le tournoi a déjà commencé : prioriser sans pitié)

### P0 — « La carte vivante » (objectif : en ligne sous 3–4 jours)
0. Audit DA → `tokens.ts` + `DESIGN.md` (§0.2) ; purge du legacy.
1. Schéma SQL + RLS ; seeds (nations, villes, map, tiebreakers) ; `generate-map.ts` + audit visuel `/admin/map-preview`.
2. Providers (§3.3) + seed des 104 matchs + **vérification manuelle du mapping des 48 équipes**.
3. `resolve` complet + tests (issue, sélection §5.6, idempotence) + `rebuild-map` (§18.4).
4. Worker Render : `poll_matches` + `resolve` + `healthcheck`.
5. Front : `/` (HexMap + sidebar + ticker + matchs du soir sans drama), `/m/:id` (post-match), `/n/:code` minimal, `/calendrier`, `/methodo`, `/admin` (overrides + boutons).
6. `api/meta.ts` + OG basiques + `/snapshot/:date` manuel.
**Sortie P0 :** 10 matchs réels résolus sans intervention ; `rebuild-map` diff vide ; une journée jouée 100 % en manuel ; carte mobile < 3 s ; le snapshot d'un matin partagé en vrai dans un groupe WhatsApp (le test ultime).
**⚠️ Rattrapage :** si le déploiement arrive après les premiers matchs, `backfill` = seed + résolution chronologique des matchs déjà joués via le provider (l'idempotence rend ça trivial) — la carte « rattrape » l'histoire, et ce backfill est exactement le test du replay.

### P1 — « L'utile » (objectif : avant la dernière journée de groupes, ~23 juin)
7. Simulateur §6 + `/groupes`, `/groupes/:letter` (ThirdsTable intégré à `/groupes`), QualifBar partout.
8. Drama-mètre + intégration MatchCard/calendrier/home.
9. `enumerate_conditions` + mode « conditions » (le rendez-vous de la dernière journée).
10. Recap de la Nuit complet (job + `/nuit/:date` + images auto) + `/feed.xml`.
**Sortie P1 :** probas recalculées < 60 s après une résolution ; conditions correctes sur un groupe de test simulé à la main ; recap publié 3 matins de suite sans humain.

### P2 — « Le spectacle total » (avant le 27 juin pour la Fracture ; le reste en continu)
11. `finalize_group_stage` + animation **Grande Fracture** (16 morts simultanées) + `/memorial`.
12. Héritage KO + `/tableau` (bracket réel + probabiliste).
13. TimeScrubber + replay + `?t=` ; mode live §9 ; `BeforeAfterMap` partout.
14. `/embed/map` ; OG riches par type d'event ; `/fin` (préparée à l'avance, activée à la finale).
**Sortie P2 :** simulation complète de la fin des groupes sur données synthétiques (72 résultats fictifs) → Fracture correcte ; replay fluide sur mobile ; embed testé dans Notion et Discord.

---

## 21. Edge cases (checklist : chaque item = comportement codé ou log explicite)

1. Match `POSTPONED`/`CANCELLED` → bandeau, aucune résolution, drama gelé.
2. TAB → `gd=0` (§5.2). Prolongation → buts comptés normalement.
3. Score corrigé par l'API **avant** résolution → le délai de 5 min l'absorbe. **Après** → on ne rejoue pas ; correction admin par events compensatoires `admin_fix` (outil /admin « transférer un hex »), loggué.
4. API down un soir de match → healthcheck alerte → saisie `match_overrides` (2 min chrono).
5. L'API change un id de match / un stage inconnu apparaît → refus de résoudre + alerte (jamais deviner).
6. Noms d'équipes ≠ entre API et seed → seule la table de mapping `fd_team_id` fait foi (d'où la vérif manuelle).
7. Nation réduite à sa capitale qui perd → débordement ruins/neutral (§5.6).
8. Nul sans hex neutre → `draw_no_neutral`.
9. Perdants de demi-finales : `eliminated` seulement après le match de la 3e place (les deux à ce moment-là ; le vainqueur de THIRD a d'abord son gain de 3).
10. Égalité au classement des troisièmes sur critère non simulable (fair-play) → simu : 50/50 marqué « départage aléatoire » ; réel : décision admin dans `finalize_group_stage`.
11. Deux résolutions concurrentes → advisory lock + PK.
12. Fuseaux : tout en UTC en base ; affichage en heure locale visiteur ; jobs quotidiens pilotés en Europe/Paris ; attention au jour de « nuit » (§8 : fenêtre 18:00→07:00 Paris).
13. Visiteur pendant `IN_PLAY` avec poller lent → mention « il y a ~2 min » (§9).
14. `?t=` à une date hors tournoi → clamp [J1, aujourd'hui].
15. Replay demandé avant toute résolution → frame initiale.
16. `game_over=true` → tous les jobs de mutation no-op, bandeau « tournoi terminé » + lien `/fin`.
17. Backfill (§20 P0) rejoué deux fois → no-op (idempotence).
18. OG image qui échoue → fallback image statique générique (jamais de 500 sur une URL partagée).

---

## 22. Légal, branding & ton (NORMATIF)

1. **Aucune marque FIFA** : pas de « FIFA World Cup™ », logos, trophée, mascottes, photos. Wording : « le Mondial », « la Coupe du Monde » en usage descriptif. **Ne pas utiliser les `crest` (écussons) renvoyés par l'API** : drapeaux emoji Unicode uniquement.
2. Footer + `/methodo` : « Site indépendant de visualisation, non affilié à la FIFA ni à aucune fédération. Données : football-data.org. Aucun pari, aucun argent réel. »
3. **Ton anti-géopolitique** : vocabulaire exclusivement sportif-ludique (territoires, capitale sportive, conquête sportive, ruines, enclaves, memorial). **Mots interdits dans tout texte généré** : guerre, invasion, armée, troupes, occupation, annexion, frappe, ennemi, détruire. Templates fermés relus à la main. Aucun traitement éditorial spécial pour les affiches géopolitiquement sensibles (le traitement identique EST la neutralité) ; flag admin `narrative_muted` par match pour dégrader en texte minimal si nécessaire.
4. Pas de tracking tiers ; analytics = compteur privacy-friendly au choix (Vercel Analytics suffit).

## 23. Hors scope v1 (ne pas se laisser tenter)

Comptes utilisateurs, pronostics, monnaie, duels, mercenaires (toute la « couche jeu » : elle existe en spec v1.1 dans un tiroir, branchable plus tard par-dessus ce socle — ne pas en importer une miette maintenant) · minute-par-minute des buts · données joueurs/effectifs · i18n (FR only) · app native · websockets · LLM au runtime · mode sombre s'il n'existe pas déjà dans la DA Wikimatch.

---

*Fin de spec v2.0 « Atlas ». Toute modification de règle incrémente `engine_version` et s'ajoute au CHANGELOG en tête de fichier. Première action de l'agent : §0.2 étape 0 (audit DA), puis P0 ticket par ticket.*
