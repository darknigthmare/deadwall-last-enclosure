# 1.9.0-rc.1 — Les chemins du jour

Cette passe part du **jeu complet 1.8**, pas d'un pack de correctifs. Les systèmes précédents et les 14 fichiers d'assets sont conservés. Le format de sauvegarde reste v8.

## Cartographie et parcours

`M`, le bouton près de la minicarte ou **Terrain → Carte & exploration** ouvrent une vue du commandement. La consultation suspend la simulation comme les autres dossiers. La carte propose zoom, déplacement par glisser, boutons de recentrage, flèches du clavier et touche Début. Sur écran tactile, les boutons de zoom et le glisser à un doigt sont utilisés ; aucun zoom à deux doigts n'est annoncé.

Les six quartiers étaient déjà connus dans la version précédente. En revanche, les dix-huit découvertes et les appels n'apparaissent qu'après leur repérage par les systèmes existants. La carte montre les structures de la cité, pistes financées ou achevées, dépôts opérationnels, alliés et fourgons. Elle ne dessine pas la position des infectés. Pendant l'alerte et l'assaut, elle reprend les fronts déjà annoncés.

Un parcours prépare jusqu'à quatre lieux connus : découvertes non épuisées, appels actifs et dépôts. Les étapes sont ajoutées, réordonnées et retirées manuellement. Le trajet calculé vise uniquement la première étape. **Aucun déplacement automatique, aucune téléportation, aucun prélèvement ou dépôt à distance.**

Le calcul vérifie les accès actuels avec le rayon du commandant. Les portes verrouillées et les murs bloquent les passages, les portes automatiques sont utilisables par les alliés. Une recherche par cellules prend les pistes en compte ; un passage direct libre peut être conservé. La recherche est bornée et ne promet ni chemin optimal absolu ni sécurité face aux infectés. Un échec est affiché comme « trajet non établi », pas comme la preuve qu'aucun chemin n'existe.

La distance à vol d'oiseau et la distance de trajet sont identifiées séparément. Aucun temps de trajet garanti n'est affiché. Le parcours est temporaire : une nouvelle campagne ou une reprise le remet à zéro. Les découvertes, réserves restantes, relevés et cargaisons restent dans la sauvegarde existante.

## Dix-huit silhouettes de terrain

Chaque découverte existante a un peintre Canvas distinct : jardin, bois de menuiserie, toit effondré, tiroirs, rideau métallique, conserves, brancard, réchaud, couvertures, table à gabarits, traverses, pièces, consigne, petit matériel roulant d'entretien, ballast, casier à cartouches, croquis de sas et barrière couchée.

Il ne s'agit pas de dix-huit nouveaux sites, de nouvelles cartes, de portraits générés ou de véhicules pilotables. Ce sont des représentations séparées des dix-huit lieux déjà jouables, sans collision ou couvert supplémentaires. Les formes épuisées peuvent rester en trace discrète, mais sont masquées si une construction couvre l'emplacement. Le rendu est déterministe, ne consomme pas le générateur aléatoire de la campagne et écarte les lieux hors caméra. Aucun nouvel atlas raster externe n'est nécessaire.

## Intégration

- `src/recon.js` : points connus, parcours temporaire, vérification de trajet, affichage au sol et minicarte.
- `src/recon-ui.js` : carte, liste filtrable, sélection, clavier et tactile.
- `src/recon-art.js` : les dix-huit peintres de lieux.
- `RECON_RULES` dans `src/core.js` : limites de recherche et de rafraîchissement.
- Liste publique, build autonome et cache PWA incluent les trois modules.

Le raccourci M ne s'active pas pendant la saisie dans un champ ou depuis une autre modale. Les panneaux précédents sont préservés ; la navigation compte treize dossiers exclusifs. Une capture de pointeur invalide ou annulée est relâchée sans exception ni glisser résiduel.

## QA et limites

Les nouveaux tests Chromium exécutent le vrai moteur, le DOM et les dix atlas/textures. Quatre contextes sont lancés en parallèle : cartographe, éclaireur, portes/nuit et tactile/reprises. Leur temps est piloté et les scènes avancées sont explicitement préparées. Le test de route déplace le commandant le long des segments par ses collisions ordinaires ; il ne présente pas une partie humaine.

Le premier test d'enceinte plaçait involontairement un mur sur le commandant initial : la fixture a été corrigée, le calcul de trajet n'a pas été assoupli. Un test d'interruption tactile a révélé une capture de pointeur invalide non protégée ; le gestionnaire a été corrigé puis revérifié. Les premières traces sont conservées.

La suite Node historique conserve un DOM minimal pour ses tests logiques. L'endurance utilise une assistance synthétique décrite dans ses journaux. Ces tests ne certifient pas l'équilibrage humain ou une cadence d'images sur le matériel du joueur. Les tests de distribution exercent aussi le service worker et le HTML autonome hors ligne. Aucun test complet Safari/iOS, Firefox ou Electron empaqueté, ni campagne de plusieurs heures, n'est revendiqué. Aucun push ni déploiement n'a été effectué.
