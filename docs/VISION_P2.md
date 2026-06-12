# Vision P2 — « De la carte qu'on regarde au monde qu'on habite »

> Référence produit post-P1. Complète SPEC_ATLAS_MONDIAL_v2.md (qui reste la
> loi pour les règles du jeu et le moteur). Aucune création de compte, jamais :
> l'URL et le localStorage sont nos identités.

## Les trois actifs qui rendent tout possible

1. **Moteur pur et rejouable** — `lib/engine`, `hex_events` : chaque hexagone a un historique complet.
2. **Simulateur déterministe en TS pur** — `lib/sim` : tourne dans le worker Render ET dans le navigateur.
3. **Mémoire totale** — `snapshots` quotidiens + `resolutions` + récits horodatés.

## Piliers (par ordre de construction)

### A. La Machine à Futurs — `/multivers` ★ EN COURS
- Sim Monte-Carlo dans un Web Worker client : l'utilisateur force V/N/D sur
  les matchs à venir → classements, probabilités et statuts recalculés en direct.
- Scénario encodé dans l'URL (`?s=12:H,14:D`) → partage sans compte.
- Statuts exacts (qualifié/éliminé) via `groupOutlook` (énumération, pas du Monte-Carlo).
- Scores représentatifs des issues forcées : 1-0 / 0-0 / 0-1 (affiché honnêtement).

### B. Le Temps
- `/replay` : scrubber 11 juin → aujourd'hui, morphing entre snapshots, récits en surimpression.
- Mémoire des lieux : clic sur un hex → biographie générée depuis `hex_events` (templates fermés).
- `/fin` : carte finale, superlatifs calculés, poster téléchargeable (SVG→PNG), replay complet.

### C. Le Rituel
- Gazette de l'Atlas : une de journal générée chaque matin 7h30 (job recap), 39 unes archivées,
  image OG via satori/resvg.
- Mon Royaume : nation choisie en localStorage → lentille personnalisée + Web Push opt-in.
- Homepage drama-driven : le match au drama max prend la home avec compte à rebours.

### D. La Diffusion
- `/embed/map` : iframe légère (journalistes, forums, Discord).
- OG images par état du monde (la carte du moment, pas une image statique).

## Garde-fous (hérités de la spec v2)
- Tous les textes générés = templates fermés + liste de mots interdits testée.
- Tout est déterministe et rejouable (seeds stockées).
- Aucun write Supabase côté client ; le client ne fait que lire et simuler localement.
- Pas de paris, pas d'argent, pas de comptes.

## Ordre de bataille
1. `/multivers` (différenciateur absolu — fenêtre : phase de groupes)
2. Mémoire des lieux (tooltip enrichi + page hex)
3. Gazette + OG images
4. `/replay` scrubber
5. Mon Royaume + Web Push
6. `/fin` + poster (prêt avant le 28 juin)
