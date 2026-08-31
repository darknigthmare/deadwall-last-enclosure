# Extension de contenu — 31 août 2026

Ce lot enrichit DEADWALL 1.0.0 sans changer son moteur, son format de sauvegarde v2 ou sa boucle stratégique.

## Contenu livré

- Trois profils ennemis : Briseur contre les structures, Traqueur contre les survivants isolés, Engorgé qui alourdit les amas. Huit profils au total, sans augmenter l’effectif prévu des hordes.
- Deux métiers recrutables : Secouriste et Ingénieur. Logements, rations, coûts, déplacements, murs, repli, blessures et mort s’appliquent réellement.
- Six quartiers déterministes et 48 décors récupérables, couvrant seize types. Les anciens gisements et leurs identifiants ne sont pas déplacés.
- Dossiers : contre-mesures, coûts et recrutement, personnel nommé de façon stable, état de service, carte des réserves et repère temporaire.
- Trois atlas OpenAI supplémentaires, soit 64 nouvelles poses de déplacement et seize décors. Les assets sont embarqués, sans service distant nécessaire au jeu.

Les nouvelles conditions, coûts et limites sont décrits dans [ENEMY_CONTENT.md](ENEMY_CONTENT.md), [SPECIALISTS.md](SPECIALISTS.md) et [WORLD_CONTENT.md](WORLD_CONTENT.md). Les prompts exacts et fichiers retenus sont dans [CONTENT_ART_PROVENANCE.md](CONTENT_ART_PROVENANCE.md).

## Corrections trouvées pendant l’intégration

- Les noms de difficulté inconnus ou hérités d’Object ne peuvent plus démarrer une campagne avec des valeurs non numériques.
- La vitesse de chaque spécialiste est conservée après un tick économique, y compris lorsque le moral change.
- Le budget de détection des Traqueurs est réparti équitablement même avec 720 profils identiques importés.
- Le contact d’attaque vérifie les angles de murs et les structures intermédiaires.
- Le bestiaire utilise les vrais seuils de déblocage. Le texte de logements complets suit la capacité réelle.
- La carte réactualise la position du joueur à la réouverture ; le bouton de repère conserve le focus.
- Le poste de commandement reste utilisable si le module complémentaire de dossiers n’a pas encore chargé.
- Les soins et réparations n’affichent leur contour actif qu’après restauration de PV et paiement.

## Vérification reproductible

`npm run check` reconstruit tous les fichiers publics déclarés et le standalone, vérifie la syntaxe et exécute les tests Node. Avec `DEADWALL_SOAK=1`, les deux campagnes d’endurance logique sont incluses. Le nombre de fichiers évolue avec les modules ; les tests de distribution le comparent aux dépendances réellement déclarées.

La suite `tests/browser-content.mjs` couvre six formats : 1440×900, 1280×720, 390×844, 320×640, 1024×768 et 844×390. Elle contrôle le recrutement par les boutons, le coût exact, la sauvegarde/reprise, les portraits décodés, les dossiers, les repères, le contraste, le focus et le cache PWA hors connexion (révision r9 depuis l'ajout des modules narratifs). Une attente mise à jour n'est pas, à elle seule, une preuve de nouvelle exécution navigateur.

Les placements de bâtiments, déplacements de caméra, visites de secteurs et présentations des huit infectés utilisent des fixtures explicitement nommées : ils prouvent l’intégration et le rendu, pas une progression humaine complète. Les tests antérieurs de commandement et d’UX sont conservés. Le contrôle natif lance réellement deux processus Electron et vérifie l’état sauvegardé entre eux.

## Limites explicites

- Les nouveaux véhicules sont récupérables, pas pilotables. Les ruines traversables ne remplacent pas une enceinte construite.
- Les noms du personnel sont un habillage stable de survivants fonctionnels, pas un système de dialogues ou de quêtes.
- Le repère de secteur est temporaire et ne déplace personne.
- Les nouvelles ressources représentent au maximum 6,72 % des réserves historiques sur l’échantillon de 133 graines testé ; ce n’est pas une preuve exhaustive sur toutes les graines.
- Les mesures de rendu sont locales. L’équilibrage commercial de longue durée requiert encore des parties humaines variées.
- L’application Windows reste non signée. Ne pas désactiver les protections Windows pour l’exécuter.
