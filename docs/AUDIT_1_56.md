# Audit et corrections 1.56.0 — DEADWALL

Base : version 1.55.0, commit `4a402dd811c80e2992a6cec4ef6ee13e47ba2e03`. Les preuves de travail sont conservées sous `/workspace/deadwall-cloud/audit156/`. Cette documentation est figée avant les contrôles finaux ; le compte rendu externe `DELIVERY_156.md` consigne ensuite les résultats réels du contrôle global, des navigateurs, des mesures finales, du commit et des fichiers HTTPS.

## Défauts reproduits et corrections

| Chantier | Avant | Après |
| --- | --- | --- |
| Portes et cadavres | À 30 unités de l'extrémité d'une porte, mais 62 du centre, un Engorgé n'ajoute aucune pression. Le filet payé ne travaille pas et le déblaiement conserve le corps visible. | Distance à l'emprise physique, rotations comprises, utilisée pour la pression, le filet et son nettoyage. Rayon 52, charges et débits conservés ; sélection historique des crises inchangée. |
| Annexes régionales | Une fondation bloque la marche et la conduite, mais pas certains tirs et rayons de menace ou de visibilité. | Géométrie vivante commune exposée par le monde régional. La vue d'une tour ignore son seul identifiant de fondation et reste coupée par les autres. Générateurs et empreintes inchangés. |
| Armurerie | Une blessure suivie d'un soin dans le même pas laisse l'assemblage actif. | Interruption au moment de la perte de santé, avant un éventuel soin. Matériaux conservés ; invulnérabilité sans blessure respectée. |
| Soins | La clinique soigne avec zéro médicament. Un hôpital peut soigner le commandant parti en région depuis son ancienne position locale. | Coût centralisé de 0,025 médicament/PV, débit historique conservé et prorata du stock. Présence réelle, accès, courant, santé et arrêts vérifiés. |
| Camp temporaire | Onze secondes restantes autorisent un travail dépendant de douze secondes. | Devis revalidé pour toutes les opérations concernées, avant démarrage et paiement. Aucun allongement ou changement de coût. |
| Commandes du monde | Rafraîchir pendant un appui souris ou Espace détache AFFECTER et perd l'action. | Nœuds conservés et callbacks courants : affectation réelle, coût de deux rations, puis retrait sans deuxième affectation. Le tactile avant correction pouvait réussir par retargeting Chromium ; cette nuance est conservée. |

## Preuves ciblées terminées

- Combat : **130/130, code 0**. Référence propre : six échecs reproduits parmi sept nouveaux cas, code 1. Les premiers essais mal calibrés et leur correction de fixture sont conservés.
- Exploration : **23/23, 17/17 et 7/7, codes 0**, soit 41 cas distincts avec six répétitions. Contrôles G1–G7, étages, géométrie, stocks, vraie balle et coût de tir, compagnon, fondation achevée et reprise.
- Progression : premier lot **81/82, code 1**, avec un seul hôpital de fixture placé derrière un obstacle. L'accès du fixture est corrigé et prouvé par un soin natif préalable ; les **9 nouveaux cas passent ensuite, code 0**, sans modification du runtime entre les deux lots. Les 82 cas sont couverts entre ces runs ; la première commande conserve son code 1.
- Interface : **21/21**, puis **14/14 après adaptation du contrat UI140**, codes 0. Le test historique exigeant un bouton détaché conserve ses contrôles de coût, état, sauvegarde, pause et focus ; il exige désormais le même bouton attaché, désactivé et sans second paiement. Les 37 autres contrôles visuels historiques ont passé ; le lot initial 37/38, code 1, reste conservé.
- Chromium ciblé interface : **25/25 dans six contextes**. Appuis souris, Espace et tactiles ; affectation et retrait exécutés par leurs vrais contrôleurs. Captures avant/après inspectées. L'inventaire statique classe 91 bâtiments avec une source d'image présente pour chacun, parfois une famille partagée ; aucun nouveau PNG n'est nécessaire dans les familles examinées.

Les ciblés se recouvrent et ne s'ajoutent pas au futur total global. Les scènes avancées sont explicitement préparées ; leurs objets, poses et stocks ne prouvent pas une acquisition naturelle en campagne.

Une première tentative du contrôle général est interrompue volontairement après deux incompatibilités de tests d'interface : `insertBefore` manque au DOM simulé d'expansion-ui, et exploration-ui exige encore le remplacement du bouton au rafraîchissement. Son vrai résultat reste **code 1, 1 871 cas, 1 699 réussites, deux échecs et 170 annulations** ; il ne constitue pas un contrôle général réussi. Les deux tests conservent leurs assertions de disponibilité, focus et fréquence de rafraîchissement, avec l'API DOM et l'identité de bouton actuelles. Une nouvelle commande générale complète terminée au code 0 reste obligatoire. Ces adaptations de tests ne modifient pas le runtime déjà mesuré.

Après ces adaptations, le lot expansion-ui, exploration-ui, UI140 et visuals156-ui termine **49/49, code 0**, sans skip, annulation ni TODO, avec ses sources inchangées. Il vérifie notamment affectation réelle de Léa puis retrait, paiement unique, conservation du sac, du temps et de la pause. Ce ciblé ne remplace pas le contrôle général.

La deuxième commande générale termine réellement à **3 146/3 147, code 1**, sans annulation, skip ni TODO. Son seul échec est la préparation du scénario de bus près d'une annexe : quarante sondes parcourent 3,9 mètres alors que le nez commence à 0,8 mètre de la façade. Le service partagé refuse correctement leur entrée dans la fondation. Le départ est placé à 4,8 mètres, en conservant les quarante sondes et toutes les assertions de collision, rotation, carburant, recul et sauvegarde. Les onze scénarios world138 et les sept contrôles d'annexe passent ensuite **18/18, code 0**, sources inchangées. Seul ce script de préparation change ; aucune collision du moteur n'est désactivée. Cette commande générale négative est conservée et une nouvelle suite complète réussie reste exigée.

## Progression, performance et portée

Le catalogue réel comporte 90 modèles de construction hors centre, dont neuf chemins d'évolution, et 90 entrées dans les autres catégories. Il conserve les choix des onze âges ; les seuils de population, ravitaillement, exploration et hordes réellement survécues sont inchangés. Le tableau dérivé détaillé est dans `progression-catalogue.json`. Les connaissances acquises persistent ; les installations perdues ne fournissent pas leurs capacités.

La référence de performance utilise une copie immuable de la 1.55.0, Chromium/Linux/SwiftShader, 1280×720, DPR 2, deux secondes de chauffe et six secondes mesurées par scène. Les FPS valent frames divisées par temps mural ; les temps CPU/Canvas inclusifs se recouvrent et ne mesurent pas une présentation GPU terminée.

| Scène préparée | Automatique, FPS référence | Légère, FPS référence |
| --- | ---: | ---: |
| Calme | 55,06 | 59,97 |
| 120 infectés | 30,46 | 36,56 |
| 300 infectés | 23,60 | 25,83 |
| 720 infectés | 13,56 | 14,80 |

Les pauses de deux secondes du dernier essai 1.55 ne sont pas reproduites ici ; leur origine reste inconnue. Le profil CPU ne démontre pas une tempête de GC. Une piste supprimant save/restore au transfert du masque donne 28 comparaisons RGBA identiques, mais aucun gain global convaincant dans un essai possiblement concurrent avec des tests : elle est rejetée et n'est pas livrée. Les mesures de la vraie 1.56 figée et leurs limites sont consignées séparément après exécution.

Les cas de campagne préparés ne mesurent pas le temps nécessaire pour acquérir leurs ressources, équipements ou bâtiments. La cible Standard de 6 à 10 heures demande encore des essais humains. Les mesures du GPU logiciel cloud ne définissent ni un matériel minimum joueur ni une cadence garantie.
