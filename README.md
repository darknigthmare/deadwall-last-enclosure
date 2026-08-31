# DEADWALL — La Dernière Enceinte

Jeu autonome de **survie, construction de cité et défense contre des hordes zombies infinies**. Le joueur commence comme récupérateur armé autour d’un dépôt abandonné, puis automatise la collecte, recrute des ouvriers, des fusiliers et des spécialistes, développe des industries et ferme plusieurs enceintes concentriques.

Le moteur **2D/2.5D top-down Canvas** est distribué en application Windows autonome et en version navigateur/PWA. Les assets originaux OpenAI sont embarqués ; aucun compte ni service distant n'est nécessaire pour jouer. Le shell PC utilise Electron : ce n'est pas une réécriture Unreal ou un moteur 3D natif.

## Lancer le jeu

### Application Windows autonome — recommandée sur PC

Extraire entièrement l'archive **DEADWALL-1.0.0-Windows-x64-portable.zip**, puis lancer **DEADWALL.exe**. Aucun Node.js, navigateur installé ou serveur local n'est requis. F11 / Alt+Entrée basculent en plein écran. Les sauvegardes persistent dans AppData, indépendamment du dossier du jeu.

La distribution locale est non signée ; ne pas désactiver SmartScreen. Construction, vérification du vrai exécutable et limites de distribution : [docs/DESKTOP.md](docs/DESKTOP.md).

### Fichier autonome et édition navigateur

Ouvrir **DEADWALL_Standalone.html** pour la version monofichier contenant tous les scripts, styles et images, y compris sans connexion. Pour le développement sous Windows :

Double-cliquer sur `start_windows.bat`, puis ouvrir l’adresse indiquée :

```text
http://127.0.0.1:4173
```

### Linux / macOS

```bash
./start_linux.sh
```

### Node.js

```bash
npm start
```

Aucune installation de dépendances n'est nécessaire pour le serveur local ni les tests Node. Le packaging PC requiert les outils décrits dans le guide Windows.

## Commandes

| Action | Commande |
|---|---|
| Déplacement | ZQSD, WASD ou flèches |
| Sprint | Maj gauche |
| Viser | Souris |
| Tirer | Clic gauche |
| Récolter, déposer, construire | Maintenir E |
| Coup de crosse | Espace |
| Recharger | R |
| Changer d’arme | 1, 2, 3 |
| Sélectionner Alpha / Bravo / Charlie | 4, 5, 6 |
| Placer le point de la section / repli au centre | G / T |
| Catalogue de construction | B |
| Poser un bâtiment | Clic gauche |
| Tracer une ligne de murs | Cliquer, tirer, relâcher |
| Tourner une structure | R en mode construction |
| Annuler / sélectionner une structure | Clic droit |
| Zoom | Molette |
| Pause | Échap |

## Systèmes jouables

- Personnage contrôlé directement avec santé, endurance, portage, armes, chargeurs et réanimation.
- Récolte physique de bois, ferraille, pierre, nourriture, carburant et médicaments trouvés dans les ambulances.
- Six secteurs déterministes, 48 vestiges récupérables et seize types de ruines, véhicules et équipements ; le dépôt initial et les anciens gisements restent inchangés.
- Dépôt des ressources au centre de commandement ou dans les entrepôts.
- Ouvriers autonomes capables de récolter, transporter et construire.
- Poste de commandement en pause tactique : ordres collectifs, contrôle des portes, doctrines et archives.
- Déblaiement physique des corps au pied extérieur des remparts, repli et conservation des cargaisons.
- Portes automatiques, ouvertes ou verrouillées ; diagnostic réel de fermeture du périmètre.
- Quatre départs à contreparties : classique, convoi de civils, dépôt à reconstruire et arrière-garde. Graines réutilisables et records séparés par départ et difficulté, sans bonus permanent.
- Trois sections de fusiliers avec ralliements indépendants, repli physique, raccourcis et commandes tactiles dans ÉQUIPES.
- Situation par front : contacts vivants, proximité du centre et remparts fragiles ; alerte visuelle avec signal sonore ponctuel.
- Bilan de défaite avec six mesures de campagne et conseils fondés sur l’état final ; relance sur la même carte ou une nouvelle carte dans les mêmes conditions.
- Secouristes et ingénieurs recrutables au palier Avant-poste après construction de la clinique ou de l’atelier : soins et réparations de terrain payés sur les stocks, trajets physiques et repli.
- Dossiers de terrain : huit fiches d’infectés et leurs contres, recrutement, personnel nommé, carte des secteurs et repère de navigation sans téléportation.
- Registre de D-17 : six traces originales à relever physiquement, douze décisions possibles (une par secteur), quatre chapitres persistants et un épilogue qui laisse les hordes continuer.
- Vingt-deux structures avec coûts, chantier, intégrité, réparation, démolition et amélioration.
- Palissades, murs d’acier, remparts en béton, portes, pièges, miradors et tourelles.
- Tracé rapide de longues lignes de murs pour créer plusieurs enceintes concentriques.
- Population, logements, nourriture, moral, capacité de stockage et réseau électrique.
- Fermes, scieries, centres de recyclage, concasseurs, raffineries et manufactures de munitions.
- Cycle jour/nuit, éclairages alimentés, pluie et visibilité dégradée.
- Hordes infinies provenant de plusieurs fronts, avec huit profils d’infectés : Errant, Coureur, Protégé, Rampant, Hurleur, Briseur, Traqueur et Engorgé.
- Champ de flux pondéré : les zombies privilégient les portes et points faibles, mais attaquent un mur lorsque le détour coûte trop cher.
- Accumulation de cadavres au pied des remparts, augmentant la pression et créant des possibilités de franchissement.
- Signature de la cité : population, bâtiments, production et consommation électrique attirent davantage d’infectés.
- Repli progressif : perdre un mur ou un quartier n’entraîne pas une défaite immédiate ; seule la chute du centre termine la partie.
- Sauvegarde automatique toutes les trente secondes et sauvegarde manuelle depuis la pause.
- Confirmation avant remplacement d’une campagne depuis le menu ; export libre pour conserver une autre cité.
- Trois difficultés : Survivant, Standard et Brutal.
- Objectifs d’introduction, récompenses, paliers de cité et mode infini.
- Son généré procéduralement avec Web Audio, sans fichiers audio externes.
- Dix textures/atlas OpenAI intégrés au terrain, aux 22 structures, aux props et épaves, aux personnages et aux effets ; 128 poses réparties en seize cycles de déplacement, dont trois variantes cosmétiques stables.
- Navigation alliée par les portes de plusieurs enceintes ; cargaisons partielles conservées et industrie arrêtée à stock plein.
- Quatre crises à deux choix avec coûts et effets réels ; six doctrines de recherche et progression de cité.
- Paramètres persistants : volume, contraste, mouvements réduits, qualité légère ; export/import JSON avec validation et confirmation.

## Vérification du projet

```bash
npm test
npm run check
```

La suite couvre économie, doctrines, difficultés, crises, navigation concentrique, hordes compactées, sauvegardes corrompues et secours, audio, tactile, atlas, protocoles HTTP/PC, build et PWA. Le rendu simulé des tests Node est complété par des contrôles Chromium et de vrais lancements Electron : [audit commercial](docs/AUDIT_COMMERCIAL.md), [audit UX](docs/AUDIT_UX_RUNTIME.md), [provenance des visuels](docs/GAME_ART_PROVENANCE.md).

Extension de contenu : [infectés](docs/ENEMY_CONTENT.md), [spécialistes](docs/SPECIALISTS.md), [secteurs](docs/WORLD_CONTENT.md), [assets et prompts exacts](docs/CONTENT_ART_PROVENANCE.md). Les véhicules restent des épaves récupérables, pas des véhicules pilotables. Les secteurs ne sont pas des couvertures physiques ; les vrais remparts construits définissent l’enceinte.

Passe histoire et cohérence : [registre de D-17](docs/NARRATIVE.md), [audit de cette passe](docs/AUDIT_STORY_RELEASE.md). Les fragments sont des documents retrouvés, pas des dialogues de PNJ présents ni des voix enregistrées. La simulation reste jouable sans accomplir ces opérations facultatives.

Passe de clôture : [départs et compatibilité](docs/SCENARIOS.md), [sections et ordres](docs/SQUADS.md), [audit et mesures de charge](docs/COMPLETION_PASS.md). Les extensions spéculatives de la roadmap sont distinctes du contenu livré. La signature et la publication en boutique demandent une identité et un choix de distribution éditeur.

## Structure

```text
index.html                  Interface et écrans
styles.css                 Direction visuelle et responsive
src/core.js                Données, équilibrage et fonctions pures
src/game.js                Simulation, IA, rendu, interface et sauvegarde
src/art.js                 Atlas, import des mattes et cycles animés
src/save.js                Validation transactionnelle des sauvegardes
src/ui.js                  Paramètres, export et import confirmés
desktop/                   Application Windows isolée et vérification PC
scripts/server.mjs         Serveur local sans dépendance
tests/                     Tests automatiques Node.js
docs/GAME_DESIGN.md        Règles de conception complètes
docs/ARCHITECTURE.md       Architecture technique
docs/BALANCING.md          Formules et valeurs d’équilibrage
docs/CODEX_MASTER_PROMPT.md Prompt maître de continuation
docs/ROADMAP.md            Consolidation et options de production
docs/ORIGINAL_BRIEF.txt    Postulat initial conservé
```

## Sauvegarde

La sauvegarde utilise `localStorage` sous la clé `deadwall-save-v2` (avec migration et sauvegarde de secours depuis `deadwall-save-v1`). Elle contient la graine du monde, les gisements, le joueur, les unités, les structures, les zombies actifs, la vague, la météo, la progression, les statistiques et le registre narratif. Les anciens fichiers sans registre restent compatibles ; aucun choix ni gain ne leur est attribué rétroactivement.

Une seule campagne est active sur chaque profil. La chute du centre termine cette campagne et efface sa sauvegarde active et ses copies de secours ; les records locaux et les fichiers JSON exportés restent conservés. Exportez avant une nouvelle partie pour garder une cité. Ne jouez pas simultanément la même campagne dans plusieurs onglets.

## Principes à ne pas casser

1. Le gameplay réellement montré doit rester le gameplay réellement joué.
2. Le joueur doit sentir le passage du travail manuel à l’automatisation de masse.
3. La croissance des hordes repose d’abord sur le nombre, les fronts et la logistique, pas sur des sacs de points de vie.
4. Les murs successifs créent du temps et des possibilités de repli.
5. Chaque système de croissance de la cité augmente aussi sa signature et donc le danger.
6. Aucun achat payant, minuteur artificiel ou dépendance à un service externe.

## Crédit du projet

Conception et propriété du projet : **Darknigthmare**.
Moteur et édition PC livrés avec leurs limites documentées. Un arc narratif facultatif est intégré à la survie infinie ; ce n’est pas une campagne cinématique distincte. Les véhicules sont des épaves récupérables, pas des véhicules pilotables. Aucune métaprogression ni certification boutique n’est annoncée.
