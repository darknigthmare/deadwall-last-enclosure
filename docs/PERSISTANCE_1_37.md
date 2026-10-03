# Persistance, bagages et véhicules — 1.37

## Défaut reproduit et corrigé

La construction d'un véhicule vérifiait sa place avec le profil de la flotte
**avant** l'achat. En choisissant le bus, la recherche d'une aire utilisait donc
encore le rayon du break. Dans l'ordre HTML livré et avec la graine `17117`, le
bus apparaissait en `(2048, 2138)`, mais `carClear` refusait immédiatement cette
position une fois son vrai profil activé.

La conduite demandait un rayon local de `49,73913` pour le bus, tandis que
l'entité consultée par les portes et les chantiers annonçait encore `22`.
Le placement des constructions et le dégagement des véhicules à la reprise
utilisaient eux aussi le rayon historique du break.

`expeditions.js` calcule maintenant ce gabarit depuis un profil passé
explicitement, ou depuis le véhicule actif. La recherche avant achat utilise le
profil sélectionné et tient compte de l'espace des ouvriers voisins. Les
lecteurs de l'entité, les portes et les placements reçoivent le même rayon que la
conduite. `fieldcraft.js` reprend cette valeur pour dégager un véhicule chargé
dans une emprise devenue invalide.

Dans le cas reproduit, le bus neuf apparaît en `(2178, 2048)`, dans une aire
réellement libre. Une ancienne sauvegarde avec le point bloqué est dégagée par
le mécanisme physique déjà présent. Son identifiant, son coffre et son carburant
sont conservés ; les reprises suivantes gardent sa nouvelle position stable.

## Compatibilité

- Aucun changement des dimensions du catalogue, des coûts, de la vitesse, de la
  santé ou de la consommation des véhicules.
- Aucun changement de format de sauvegarde ni des coordonnées du monde.
- Le coffre reste celui du véhicule existant ; aucun stock de remplacement.
- Le rayon du piéton après descente reste celui de la fabrique du joueur.
- Les campagnes G5 et G6 restent dans leur génération d'origine.

## Vérification

Les trois régressions de `tests/persistence137.test.cjs` chargent les scripts
dans l'ordre réel de `index.html`, avec un DOM simulé. Elles couvrent l'achat du
bus à son coût existant, son aire libre, le refus d'un chantier sur son gabarit,
le transfert fractionnaire de nourriture du dépôt au sac puis au coffre, la
conduite, la sauvegarde/reprise, la descente et le dégagement d'une ancienne
livraison bloquée. Les deux parcours courants utilisent G6 puis une vraie
sauvegarde G5 issue de la livraison précédente.

Les fixtures préparent un garage achevé dans une emprise valide, rendent le
palier tardif disponible et fournissent les stocks nécessaires à l'achat. Elles
ne prétendent pas avoir joué la progression économique jusqu'au bus.

L'audit a aussi exécuté trois décès successifs avec reprise pendante, choix de
relève, récupération physique du sac et nouvelle reprise, puis le même passage
sur une ancienne G5. Aucun problème supplémentaire de duplication ou de perte
n'a été reproduit dans ces parcours. Les transferts des sacs et de la relève
restent inchangés.

## Impacts sur les dépouilles réanimées

Le raccord avec l'audit du combat a révélé un deuxième défaut. Deux dépouilles
réanimées à dix centimètres l'une de l'autre étaient sélectionnées correctement
dans l'arc de mêlée, mais l'application de chaque impact retrouvait ensuite le
premier corps proche par sa position. Deux corps à 65 PV recevaient ainsi
respectivement 36 et 0 dégâts pour deux impacts de 18 attendus.

`succession133.hit` accepte maintenant l'identifiant exact du contact déjà
sélectionné. La mêlée et le tir du compagnon le transmettent, tout en conservant
les vérifications de position, d'étage et de corps encore vivant. Un identifiant
périmé ou inconnu ne reporte pas l'impact sur un voisin. Les appels historiques
sans identifiant continuent de fonctionner.

`tests/succession-target137.test.cjs` reproduit les corps adjacents dans le moteur
chargé en ordre HTML, vérifie la répartition des dégâts, la neutralisation unique,
le choix de cible du compagnon, la sauvegarde/reprise et la conservation des sacs.
Les journaux avant et après correction sont conservés dans les rapports 1.37.

Les logs de tests ciblés se trouvent dans `reports/1.37.0/state137-tests.log` et
`reports/1.37.0/persistence137-tests.log`. Ce contrôle ne mesure ni le rendu CSS
du HUD ni la fréquence d'images en navigateur. La vérification complète du
projet est réalisée par la passe de livraison après intégration des autres lots.
