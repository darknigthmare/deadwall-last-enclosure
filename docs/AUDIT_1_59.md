# DEADWALL 1.59 — Sprites, actions et Codex

Cette passe part du commit `4c8cb64` (1.58). L’inventaire distingue les images absentes, les dessins déjà raccordés, les animations manquantes et les géométries volontairement procédurales. Il ne transforme pas les fiches théoriques en systèmes simulés.

## Résultat de l’inventaire

La base comporte 111 images/matières enregistrées, 91 types de bâtiments D-17, 62 plans régionaux, 35 props physiques et 47 détails de parcelle déjà raccordés. Le Codex contient 4 000 fiches pour 2 000 parents. Parmi ces fiches, 300 n’ont pas de parcelle native et 626 exigent un contexte complet encore absent ; les lieux partiels effectivement découverts restent accessibles.

La livraison porte le registre à 143 images avec 32 PNG originaux supplémentaires et 496 dessins réellement utilisés : 256 poses (32 cycles, 28 apparences), 130 équipements/dépouilles, 60 pièces de pièges, 32 pièces de postes, 12 équipements de sites et six escaliers/cloisons. Huit dessins sources supplémentaires ne sont pas utilisés et ne sont pas comptés comme animés. Les 32 PNG correspondent exactement à leurs originaux ImageGen et à leur provenance. Le Guide comporte 4 615 fiches, dont les 180 choix D-17.

Les portes, les neuf véhicules et les huit canons D-17 avaient déjà des visuels fonctionnels : passage ouvert/fermé, rotation, visée, flash et états de carrosserie. Les charnières continues, roues séparées et cycles de chute seraient des extensions supplémentaires. Les sols, ombres et effets procéduraux intentionnels ne sont pas présentés comme des sprites absents. Les 626 programmes exclus comprennent les 300 sans preset et 326 autres dont les modules de contexte ne sont pas implémentés.

## Changements

- Les six montages de Hérisson disposent de bases et pièces mobiles séparées, deux formes par montage. Déclenchement, retenue, retour et épuisement suivent les charges, cooldowns et entraves des vrais propriétaires. Filets, caisses et Hérisson nu observent également leurs événements utiles.
- Les quatre postes déployables ont des supports fixes, pièces orientables, recul/réarmement et états vide/épave. Aucun cycle fictif de recharge n’a été ajouté : leur maintenance conserve son fonctionnement existant.
- Les 36 équipements portables ont deux illustrations chacun ; les armes à feu ont des silhouettes distinctes en main. Dix profils de dépouilles ont deux positions couchées et conservent leur disparition existante.
- Les escaliers et cloisons utilisent trois matériaux. Les ouvertures, collisions, dimensions et changements d’étage restent issus des plans. Les grumes et débris réutilisent leurs variantes déjà présentes.
- Les douze anciens sites d’expédition ont leurs dessins ; les noms longs restent complets sur plusieurs lignes bornées.
- Les actions des acteurs utilisent des événements réellement produits par la simulation. Les poses sont contrôlées face aux apparences de marche pour conserver costume, perspective et contact au sol. Le héros garde ses actions et postures existantes.
- Le guide ajoute les 180 choix du catalogue D-17 existant et relie les fiches aux lieux du carnet via les vrais contrôleurs de carte et de repère. Coûts, âges et conditions proviennent des propriétaires existants. Il ne révèle aucun lieu inconnu.

## Corrections de cohérence

Un Hérisson ne blesse plus un infecté lorsque le véritable accès est refusé par un obstacle. Les coups au corps-à-corps respectent aussi les coins des bâtiments ordinaires, pour les infectés, le commandant, les soldats et les postes de contact. La production ne présente une activité qu’après un travail effectivement réalisé avec intrants, place de stockage et allocation disponibles ; jardins et serres n’émettent pas de fumée industrielle. La production régulée participe au même constat.

Les informations du Codex cessent de se rafraîchir lorsque leur panneau ou le commandement est fermé. Cela évite de rescanner les lieux pendant la partie sans que le guide soit visible.

Le contrôle navigateur des défenses présentait deux défauts de fixture : une capture tardive supposait encore une entrave presque intacte, et une scène d’épuisement demandait des informations sur un piège réellement détruit. L’observateur mesure désormais la première frame effective et les contacts successifs conservent un support vivant. Les règles, points de vie et prix du jeu n’ont pas été augmentés.

La première passe complète a donné 3 361/3 364 tests, trois échecs, zéro annulation/skip/TODO et aucune modification des 4 252 sources. Deux assertions signalaient la valeur de coordination encore en 1.58.0 ; la troisième incluait les 180 nouvelles fiches dans un compte historique de 215. La version est synchronisée. Le test conserve les 215 historiques après exclusion des 180 IDs exacts, et vérifie aussi leur unicité et leur identité dans le Guide. Les 39 tests du script d’installation et les 34 tests ciblés Guide/routes/distribution réussissent au code réel 0 sur les sources corrigées ; ils ne s’ajoutent pas au compte du contrôle complet.

Le build autonome remplace désormais les références de scripts, de styles et d’images en une passe, au lieu de rescanner les centaines de Mo déjà incorporés. La comparaison avant/après confirme l’identité exacte des 328 fichiers publics et du HTML autonome de 415 985 671 octets (SHA-256 `81ebdc57f719c105ca9700fddc38edc8055e0c0c0e6513ec2912f78feb7e66a8`). Deux mesures successives du build donnent 32,18 puis 20,22 secondes ; ces mesures cloud ne certifient pas la fluidité du jeu. Le script de préparation a été exécuté trois fois avec succès, en réutilisant les dépendances conformes, sans attester une installation fraîche.

## Validation et portée

Les reçus distinguent les résultats natifs, les captures de scènes préparées, les parcours navigateur, les archives et la publication. Les tentatives négatives sont conservées. Les galeries de pièces ne constituent pas une campagne humaine ni une mesure de fluidité sur un téléphone physique.

Les premiers résultats de quatre callbacks de présentation ne montraient qu’un PASS au niveau du fichier ; ils ne valident pas les callbacks. Les contrôles finaux exigent les sous-tests nommés. Leur cause initiale n’a pas été reproduite sur le runtime corrigé ; elle n’est pas attribuée artificiellement au harnais.

La cible Standard de 6 à 10 heures attend des campagnes humaines complètes. Les terrains, ouvrages et réseaux non simulés du Codex restent explicitement signalés. Le statut commercial, la certification matérielle et la publication HTTPS ne sont pas déduits des tests logiciels.

La relance complète `check-final-2` réussit au code réel 0 : **3 364/3 364 tests**, quatre suites, endurance active, zéro échec/annulation/skip/TODO, 4 252 fichiers source identiques avant/après. Durée native : 2 391 803 ms. Les essais ciblés restent des diagnostics séparés, sans gonfler ce total.

Le serveur final vérifie les 328 fichiers publics : HTTP 200, MIME correct et SHA conformes, sources stables. Les parcours Chromium finaux réussissent les contrôles ci-dessous, sans erreur runtime/console/HTTP ni requête échouée.

| Parcours | Contrôles réussis | Contextes |
| --- | ---: | ---: |
| Sprites et pièces mobiles | 156 | 3 |
| Guide et vrais liens Codex | 44 | 2 |
| Défenses et crafting | 300 | 3 |
| Interface générale | 179 | 4 |
| PWA, cache et reprise hors ligne | 34 | 2 |
| Arrivée, pause et Continue | 50 | 2 |
| Campagne, chantiers et première horde | 196 | 4 |
| Visibilité, murs, noir électrique et étages | 267 | 3 |
| HTML autonome servi en HTTP | 9 | 1 |
| Total navigateur, sans recopier les sous-rapports | **1 235** | **24** |

Chaque profil Sprite charge les 143 images à leurs dimensions exactes et compare les 317 fichiers runtime servis à leurs sources. Leurs réponses HTTP ne sont pas additionnées aux 156 assertions. Les galeries hors écran et scènes de camp préparées sont explicitement distinguées des parcours de campagne ; elles ne prouvent pas une progression naturelle jusqu’au neuvième âge.

Le premier lancement autonome `file://` a réellement échoué avant chargement : `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Zéro contrôle du document n’a alors été exécuté. La politique Chromium n’a pas été contournée ; les mêmes 415 985 671 octets réussissent ensuite les neuf contrôles en HTTP, décodage des images, G8, sauvegarde et export compris. Le transport fichier local et Windows ne sont pas déduits de ce résultat. La CI du prochain commit doit qualifier ses propres exécutables.

Reçus externes : `/workspace/deadwall-cloud/audit159/check-final-2.receipt.json`, `browser-final159-summary.json`, `startup-final-1.startup.json` et `build-optim-image-identity159.json`. Les deux documents de résultats sont les seules différences autorisées après le gel natif ; aucune différence de code, d’image ou de runtime n’est admise pour les archives. Git, CI et publication HTTPS doivent être liés au commit propre final par leurs propres reçus.
