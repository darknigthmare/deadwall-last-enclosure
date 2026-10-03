# DEADWALL 1.42 — Consolidation

Cette livraison reprend la version complète 1.41 et consolide les trois supports : Windows, navigateur et mobile via PWA. Elle conserve la boucle récolte → dépôt → construction → automatisation → fortification → horde → reconstruction, les générations G1–G7 et le format de sauvegarde v20.

## Changements jouables

Le poste de commandement s’installe entièrement dans le vrai navigateur : la liste de classes ne transmet plus un token vide au DOM. Ses six onglets illustrés et sa carte sont accessibles. Le bandeau place explicitement le nom, les réserves et les commandes ; l’objectif courant apparaît sans ouvrir Situation. La pause comporte des cartes plus compactes et un seul accès visible aux paramètres. L’introduction rappelle les commandes au dernier tableau.

Les exports utilisent un JSON compact validé, réimportable dans la limite actuelle de 8 Mio. Si le stockage local refuse une écriture, une copie exportée de la campagne inchangée permet de poursuivre un remplacement avec une seconde confirmation explicite. Une modification de l’état, une fermeture ou une annulation invalide cette possibilité. Les écritures principale et de secours sont relues ; la réussite du fichier principal n’annonce plus une copie de secours réussie si celle-ci a échoué.

G7 réutilise les classements des routes, un index temporaire de parcelles et les pools de biomes pendant sa construction. Les mêmes prédicats, quantités et tirages restent appliqués. Sur quatre graines comparées sous Node, la construction seule passe de 1,23–1,67 s à 0,46–0,79 s. Les empreintes des routes, lieux, étages, ressources et menaces sont identiques. Cette mesure CPU ne décrit pas les FPS sur tous les appareils.

## Jouer et distribuer

| Support | Livrable et démarrage |
| --- | --- |
| Navigateur/PWA | Archive web, à extraire et servir intégralement sur un hébergement HTTPS ; première visite en ligne, puis fonctionnement hors ligne après remplissage du cache. |
| Mobile | Même PWA, avec commandes tactiles ; ajout à l’écran d’accueil depuis le navigateur. Aucun APK ou paquet App Store n’est fabriqué. |
| Autonome | Archive contenant `DEADWALL_Standalone.html`, à ouvrir après extraction. Ce fichier embarque images, styles et scripts. |
| Windows 10/11 x64 | `npm run package:desktop` sur Windows, puis contrôle du ZIP avec `npm run test:desktop -- --archive <zip>`. Extraire tout le dossier avant de lancer l’exécutable. |

`npm run package:web` fabrique des archives depuis une liste de fichiers explicite, avec manifeste SHA-256, notices, provenance des images et guide. Le staging contient les fichiers destinés au joueur ; il n’embarque pas les dépendances de développement ou les sauvegardes de test. Des builds successifs de la même source doivent produire les mêmes octets d’archive.

Les sauvegardes du navigateur dépendent de l’origine du site et de son profil. Exporter avant de changer d’adresse ou de navigateur. L’application Windows conserve son profil dans `%APPDATA%\DEADWALL` ; il est distinct du navigateur. La mise à jour du jeu doit préserver ce dossier.

## Vérifier les sources

```sh
npm ci
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:browser
npm run test:standalone
node scripts/benchmark-generation.cjs /chemin/vers/la/source/1.41
```

Le contrôle navigateur lance un serveur local si aucune URL n’est fournie. `DEADWALL_QA_URL` sélectionne une instance existante ; `CHROMIUM_EXECUTABLE_PATH` sélectionne un Chromium installé. Les rapports et captures vont dans `artifacts/qa/`. La CI Linux contrôle les sources, les parcours réels et la PWA ; la CI Windows fabrique et vérifie le portable dans deux processus successifs. Un workflow ajouté ne constitue pas un résultat d’exécution distant.

Validation de cette passe : 2 390 tests avec endurance, sans échec ni test ignoré ; 171 contrôles Chromium desktop/mobile/PWA sur les fichiers extraits des archives. Le navigateur administré du cloud bloque `file://`. Les mêmes octets autonomes passent huit contrôles via un serveur local ne servant que ce HTML : images embarquées, G7, sauvegarde et export. `npm run test:standalone -- --transport http` reproduit ce contrôle ; l’ouverture directe depuis le disque reste à vérifier sur un navigateur de PC.

## État commercial

Les archives web/autonome sont préparées et contrôlées dans cet environnement. La validation native Windows et les essais sur téléphones physiques demandent les machines correspondantes. Il reste à tester des sessions humaines longues, la lisibilité, l’audio, l’équilibrage et les performances sur le matériel cible, puis à finaliser signature éditeur, licence joueur, assistance, classification et fiche boutique. Les notices détaillent ces points dans `THIRD_PARTY_NOTICES.md`.

Cette version est un jalon technique vérifiable vers une livraison commerciale. Aucun déploiement, publication en boutique, signature Windows ou certification matérielle n’est annoncé.
