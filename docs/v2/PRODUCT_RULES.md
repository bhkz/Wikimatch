# PRODUCT_RULES — WikiMatch / Revision 90 V2

Règles produit non négociables. Toute décision frontend, backend, base de données, ingestion, IA ou modération doit s'y conformer.

## 1. Positionnement

WikiMatch est un **média data expérimental autour de la Coupe du monde 2026**.

- Promesse principale : *Le match se joue sur le terrain. Son histoire s'écrit sur Wikipédia.*
- Promesse secondaire : *Un même match. Plusieurs Wikipédias. Parfois plusieurs récits.*
- Ce que WikiMatch **n'est plus** : un dashboard temps réel, un cockpit de drama, un détecteur d'edit-wars, un compteur de buzz, un globe de langues, un flux brut de modifications.
- Ce que WikiMatch **devient** : un média qui publie uniquement les histoires que les traces Wikipédia permettent réellement de raconter, avec preuves et limites.

## 2. Trace ≠ Histoire

Une modification Wikipédia observée est une **trace**. Trois états possibles :

- **MINEURE** : ponctuation, lien, mise en page, sans changement narratif.
- **SUBSTANTIELLE** : ajout, retrait ou reformulation d'un contenu compréhensible lié à un match, joueur, équipe, événement suivi.
- **RELIÉE À UNE HISTOIRE PUBLIÉE** : trace utilisée comme preuve dans une story validée.

Une story ne doit **jamais** naître automatiquement, ni d'un volume d'edits, ni d'un seuil, ni d'un score, ni d'une suggestion IA.

## 3. Plusieurs langues ≠ Divergence

Trois éditions ajoutant la même information = mise à jour convergente, pas une tension.

Une divergence n'est formulable que si :

1. les articles comparés portent sur le même sujet/épisode,
2. les passages sont comparables,
3. les différences sont lisibles et vérifiables,
4. la formulation publique reste prudente.

**Formulation correcte** : *L'édition anglaise mentionne X. L'édition espagnole mentionne Y. Aucune mention équivalente n'est détectée dans l'édition française observée à cet instant.*

**Formulations interdites** : *Les Anglais accusent / La France ignore / L'Espagne minimise.*

## 4. Instabilité = même article

Une instabilité éditoriale est observable sur **un même article**, autour d'un passage comparable :

- contenu ajouté → retiré → restauré → reformulé, éventuellement sourcé.

**Vocabulaire admis** : `article instable`, `instabilité observable`, `passage ajouté, retiré puis restauré`.

**Vocabulaire interdit** : `guerre`, `bagarre`, `drama`, `edit-war`, `war burst`.

## 5. Langue ≠ Pays

Une édition linguistique est un ensemble d'articles dans une langue. Elle ne représente jamais un pays, une opinion publique, un groupe national, ni la localisation de ses contributeurs.

- Admis : `édition française`, `édition anglaise`, `article comparé`.
- Interdit : `la France pense`, `les Anglais racontent`, `les Japonais réagissent`.

## 6. Carte = sujet, jamais contributeur

La carte de l'Explorer situe :
- une sélection concernée par une histoire,
- un joueur associé à une sélection,
- un stade ou lieu de match pertinent,
- une entité footballistique géolocalisable.

Elle ne situe **jamais** :
- la provenance d'un edit, une IP, un lieu supposé de contributeur,
- une langue positionnée sur une zone géographique,
- l'origine supposée d'un récit.

Règle permanente : **`POSITION = SUJET DE L'HISTOIRE` / `JAMAIS LOCALISATION DU CONTRIBUTEUR`**.

## 7. Chronologie ≠ Causalité

Une modification observée après un événement de match peut être qualifiée *« observée après »*, jamais *« causée par »*. Toute causalité forte exige des preuves complémentaires et une validation éditoriale.

## 8. IA assistante, jamais éditrice autonome

Dans un futur Desk privé, l'IA peut : traduire un extrait, proposer qu'un passage concerne un événement, suggérer une comparaison, résumer une modification, détecter un candidat à analyser.

L'IA ne doit **jamais** automatiquement :
- publier une story publique,
- affirmer une causalité,
- qualifier une controverse,
- attribuer une intention à un contributeur,
- déduire une opinion nationale,
- exposer une traduction non vérifiée comme vérité.

## 9. Demo ≠ Live

Deux modes séparés, sans fuite :

- **demo** : fixtures de démonstration uniquement, avec badges visibles. Sert UX, présentation, snapshots.
- **live** : APIs publiques réelles uniquement, jamais de fixtures fictives. États vides honnêtes si rien n'est publié.

Voir [[TARGET_ARCHITECTURE]] §3 et [[PUBLIC_API_PROPOSAL]] §1.

## 10. Public ≠ Privé

- Le **public** voit : stories publiées, dossiers match, entités, traces publiques modérées, méthodologie, recherche dans les contenus publics.
- Le **privé** (Desk futur) gère : candidats, diffs bruts, sorties IA, revues éditoriales, logs.

Aucune écriture publique anonyme n'est jamais autorisée sur stories, traces, instabilités ou comparaisons. Voir [[SECURITY_PRIVACY_RULES]].

## 11. Aucune publication automatique non validée

Toute story publique passe par une revue humaine documentée. Tout extrait public est sanitisé et `safe_to_publish=true`. Toute donnée sportive (score, horaire, événement) provient d'une source officielle identifiée et vérifiée — séparée des traces Wikipédia. Voir [[DATA_MODEL_PROPOSAL]] §3 et §7.

## 12. Wikimedia : licence, attribution, User-Agent

Toute connexion à Wikimedia respecte :
- User-Agent identifié avec contact valide,
- attribution des sources publiques,
- politique de réutilisation et licence (CC BY-SA pour Wikipedia),
- limites de requêtes (politique de l'API MediaWiki),
- gestion responsable des diffs (privés par défaut, voir §10).

Voir [[SECURITY_PRIVACY_RULES]] §6.
