# DEADWALL 1.19 — Atlas vivant

**Jeu complet, candidat local 1.19.0-rc.1. Aucun push GitHub ni déploiement Vercel.**

Cette passe remplace la représentation uniforme de D-17 par la projection de la cité réelle. Elle développe la carte régionale, son zoom, ses gestes, ses calques, ses mesures et l’inspection de lieux connus. Les systèmes de la 1.18 restent présents.

## Jouer

Ouvrir **DEADWALL_Standalone.html**. Moteur et images intégrés, sans ancien préparateur d’extension. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

**Commandement → Terrain → Carte & exploration** contient l’atlas. Les boutons **Région**, **D-17** et **Joueur** cadrent ces trois échelles. Glisser pour déplacer la carte, molette ou deux doigts pour zoomer. Quand le canvas a le focus : flèches pour déplacer, plus/moins pour zoomer, 1/Région, 2/D-17, 3/Joueur. Le mode **Agrandir** donne plus de place à la carte sans ouvrir un dossier supplémentaire.

**Mesurer** place deux points et donne leur distance à vol d’oiseau, pas une recherche de chemin. Le clic inspecte une structure de D-17, une jonction ou une parcelle déjà repérée. Le choix de repère reste une action explicite ; cliquer ne téléporte pas le personnage.

## D-17 à l’échelle du moteur

La conversion existante est **32 unités locales = 1 m régional**. La grille locale compte 128 × 128 cellules de 32 unités ; son emprise projetée est donc **128 × 128 m**, dans [4032 ; 4160] sur chaque axe. Le centre de la région reste (4096 ; 4096).

La carte ne grossit pas un symbole pour faire croire à une ville kilométrique. Elle dessine les emprises des bâtiments, les chantiers, les enceintes, les chemins et les positions alliées réellement présents. Le personnage local est situé à ses coordonnées projetées, pas systématiquement au centre. Rotation, déplacement et destruction se répercutent dans la lecture de la carte.

La vue régionale proche de D-17 réutilise le sol et le rendu des structures locales, découpés à l’emprise. La minicarte projette également la cité. Les abords dessinent une transition de largeur entre la chaussée historique et les routes régionales. Les noms et pictogrammes restent lisibles en pixels, mais les volumes restent métriques.

**Limite conservée :** les anciens gabarits du refuge ne sont pas tous réalistes et ne sont pas redimensionnés dans cette passe. La construction et le siège restent dans D-17 ; la région n’est pas entièrement constructible et le chantier n’est pas agrandi à plusieurs kilomètres.

## Jonctions

Les quatre passages gardent les positions de transfert historiques, avec leur marge anti-rebond. Leurs conversions sont centralisées dans `atlas-projection.js`. La carte vérifie séparément le point central d’arrivée pour un piéton et le break ; cela ne garantit pas l’ensemble du chemin. La traversée réévalue ses propres collisions.

Une jonction bloquée ne permet plus de rouler au travers de la croix centrale d’une copie régionale non simulée de D-17. Il faut rejoindre un accès libre. Les lieux, stocks et régions ne sont pas régénérés.

## Carte et informations

Calques : végétation, routes, cité, lieux repérés, noms, jonctions, relais, alliés/caméra et itinéraire. Masquer un calque ne supprime aucun élément. Les parcelles repérées suivent leur orientation réelle ; les inconnues restent masquées. La végétation reprend la densité procédurale existante, sans inventer de relief ou de cours d’eau absents du jeu.

La règle graduée s’adapte au zoom. Le nord reste en haut. La vue D-17 permet d’inspecter emprise, grille, chantier, intégrité, alimentation et mode de porte. Les commandes de gestion demeurent dans la cité : l’atlas n’est pas une réparation à distance.

Le départ d’itinéraire et le budget de carburant utilisent désormais le même point local projeté au lieu d’un centre arbitraire. Le trajet reste indicatif et ne conduit pas la voiture.

## Sauvegardes

**Le format reste v17.** Aucune nouvelle migration obligatoire, aucun registre de carte ajouté à la campagne. Les générations régionales 1, 2 et 3 restent inchangées. Les zooms, sélections et mesures sont transitoires. Conserver néanmoins l’export original avant de changer de version.

## Codex externe

Le paquet **DEADWALL_CODEX_500_LIEUX_1.19.zip** conserve les 500 fiches, leurs sources et leur lecteur de la 1.18. Un nouveau guide **06_ATLAS_D17_1.19.md**, également fourni en HTML, explique les projections, jonctions, calques et règles de continuation. Il ne compte pas de nouveaux lieux : 42 plans pilotes, 458 conceptions non intégrées.

## Vérifier

```sh
npm run check
DEADWALL_SOAK=1 npm run check
npm run test:world
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Sous cmd.exe : `set DEADWALL_SOAK=1`, puis `npm run check`. Les scripts navigateur lancent leurs serveurs locaux. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` choisissent une installation d’outils existante.

Rapport : **reports/RAPPORT_1.19.html**. Résultats et captures : **reports/1.19/**. Les scènes avancées sont préparées et leur temps piloté, pas jouées par quatre humains. Safari/iPhone physique, Firefox, Electron empaqueté, longues campagnes, toutes les graines et fluidité sur le matériel du joueur restent à vérifier.
