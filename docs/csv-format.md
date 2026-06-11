# Format CSV d'import des résultats (plan C — spec §3.3.3)

Import via la page `/admin`. Parseur : `lib/providers/csv-import.ts` (échoue fort
sur tout champ invalide — jamais deviner).

## En-tête obligatoire (exact)

```
provider_id,stage,group,home_fifa,away_fifa,kickoff_utc,status,score_home,score_away,duration,pens_home,pens_away
```

## Colonnes

| Colonne | Type | Valeurs |
|---|---|---|
| `provider_id` | texte | id football-data, ou `manual-<n>` |
| `stage` | enum | `GROUP` `R32` `R16` `QF` `SF` `THIRD` `FINAL` |
| `group` | texte ou vide | `A`..`L` (vide/`null` hors groupes) |
| `home_fifa` / `away_fifa` | texte | codes FIFA 3 lettres majuscules |
| `kickoff_utc` | ISO 8601 | ex. `2026-06-11T19:00:00Z` |
| `status` | enum | `SCHEDULED` `TIMED` `IN_PLAY` `PAUSED` `FINISHED` `POSTPONED` `SUSPENDED` `CANCELLED` |
| `score_home` / `score_away` | entier ou vide | score décisif, prolongation incluse, TAB exclus |
| `duration` | enum ou vide | `REGULAR` `EXTRA_TIME` `PENALTY_SHOOTOUT` |
| `pens_home` / `pens_away` | entier ou vide | buts de la séance de TAB uniquement |

Lignes vides et lignes commençant par `#` ignorées.

## Exemple

```csv
provider_id,stage,group,home_fifa,away_fifa,kickoff_utc,status,score_home,score_away,duration,pens_home,pens_away
500001,GROUP,A,MEX,RSA,2026-06-11T19:00:00Z,FINISHED,2,1,REGULAR,,
500050,R32,,FRA,MAR,2026-06-29T01:00:00Z,FINISHED,1,1,PENALTY_SHOOTOUT,4,2
```
