# Audit 1.74 — récupération d’eau sur le mobilier G11

Cette passe rend utilisables les tonneaux extérieurs existants des quatre familles résidentielles T045–T048. La préparation, le puisage et le reversement passent par un propriétaire unique ; le transport utilise le seau déjà partagé avec les incendies et les animaux. Les limites et coûts sont centralisés dans `CampaignWater214Rules`.

## Comportement et corrections

- Préparation de 12 secondes, puis paiement unique de 4 bois et 4 ferrailles du sac. Le collecteur commence vide. Une annulation ou une sauvegarde pendant le chantier ne prépaie rien.
- Collecte exclusivement sous la pluie, pendant le jeu actif, dans une réserve bornée à 24. Pas de gain hors ligne ou pendant les menus. L’eau reste non potable.
- Puisage et reversement de 4 secondes, par lots d’au plus 2, avec débit égal au volume réellement accepté par l’autre contenant. Le seau natif reste borné à 8.
- Identité vérifiée dans les deux représentations du même support. Une autorité de destruction indisponible refuse l’usage. Les permissions et destructions ne sont pas mises en cache avec la géométrie.
- Une blessure régionale interrompt immédiatement le travail, même si un soin allié suit dans la même image. Un coup bloqué par l’invulnérabilité n’est pas traité comme une blessure.
- Couvercle, crépine, outil, robinet, jauge, seau et écoulement sont dessinés séparément sur trois variantes. Les gestes du personnage suivent le temps du travail. Les lectures d’art ne changent pas les stocks ni la sauvegarde.

La nouvelle sauvegarde conserve uniquement les collecteurs installés et leur réserve, avec validation de l’identité physique dans le monde chargé. Les tâches transitoires sont abandonnées au chargement. Les anciennes sauvegardes sans ce module restent acceptées.

## Réceptions distinctes

Le lot initial de tests natifs ciblés passe **69/69**, sans échec, annulation, test ignoré ou TODO. Il couvre le propriétaire, les accès physiques, le rendu, les gestes, les lecteurs de rapports, le Guide et le manifeste public. Cette réception utilise les sous-tests réels de Node, pas le seul succès des fichiers enveloppes.

L’audit de supports accepte **200 modèles et 628 tonneaux accessibles**, dont 157 dans chacune des quatre familles. Sur trois graines témoins, il contrôle **23 sites et 72 poses canoniques**. Il conserve les empreintes des plans, détails, routes et couvertures historiques. Il ne qualifie aucune transaction à lui seul : son tableau `transactions` reste vide.

L’audit des services précédents est réexécuté : **2 905 supports accessibles sur 200 modèles**, avec ses contrôles de poses et d’art propres. Ces résultats ne sont pas attribués aux transactions d’eau.

Le build produit **370 fichiers publics**, avec 186 scripts et 26 feuilles de style. Les plans compilés gardent leur empreinte `aaa29ca45da71facea8379614897d858847af783bf08676572e4fd310008080c`.

Les **4 000 plans ont été réinspectés** sur les 29 sources actuelles : leurs enregistrements et agrégats restent strictement identiques à 1.73. Les 162 460 pièces sont meublées ; les 588 378 équipements demandés sont posés, sans refus.

La régression Chromium existante passe 42 contrôles sur ordinateur et 47 en tactile émulé. Le scénario PWA passe 21 contrôles par format, avec reprise hors ligne. Ces scénarios déclarent une campagne historique G8 préparée ; ils ne qualifient pas l’interface des collecteurs. Le [reçu local](codex/suivi-monde2026/validation-locale-1_74.json) lie les journaux compressés à leurs empreintes.

Les parcours Chromium bureau/tactile, le contrôle global, le classeur et les réceptions GitHub/Vercel doivent être lus dans les reçus de la livraison effective. Les essais diagnostiques et interrompus sont conservés séparément ; ils ne sont pas promus en qualification finale.

Le contrôle global a révélé une attente historique du Guide qui incluait la nouvelle fiche du récupérateur dans un total ancien de 36. Le contrat vérifie désormais séparément les 36 fiches conservées et cette seule nouvelle fiche, tout en conservant les 4 620 autres cartes et les filtres de disponibilité. Les [20 tests du Guide corrigé](codex/suivi-monde2026/validation-guide-1_74.json) passent. Cette correction de test ne change pas les sources publiques, les cinq rapports ni le classeur.

La même séparation est explicite dans les contrôles de routes et du navigateur : les 30 fiches de contenu historiques restent intactes, puis l’unique fiche du récupérateur complète le total de 4 755 cartes. Les [13 tests de routes et 80 contrôles Chromium](codex/suivi-monde2026/validation-inventaires-guide-1_74.json) passent, avec les recherches, filtres, accès aux catalogues et navigations existants conservés.

La [commande native exacte du workflow de chasse et pêche](codex/suivi-monde2026/validation-harvest-exact-1_74.json) est ensuite reçue : **100/100**, sans échec, annulation, test ignoré ou TODO. Elle inclut les deux contrats du Guide corrigés et les régressions de faune, armement, visibilité et navigation. Son résultat local ne remplace pas la nouvelle réception GitHub de la tête finale.

## Réception S2 — accès régional corrigé

La CI a trouvé une régression réelle : l’ajout des récupérateurs avant la météo dans le groupe Région changeait le dossier ouvert par défaut. La météo retrouve sa première place ; les récupérateurs sont accessibles juste après. Un parcours DOM vérifie les vrais boutons, les dossiers sélectionnés et l’absence de modification de sauvegarde, de ressources ou de hasard.

Les [tests ciblés S2](codex/suivi-monde2026/validation-S2-1_74.json) passent **70/70**. Le groupe navigateur inchangé météo, cueillette et défenses passe **114/114**, sur deux formats par scénario. Les [quatre rapports de campagne S2](codex/suivi-monde2026/validation-rapports-S2-1_74.json) sont régénérés puis reçus strictement : résultats, géométries, mondes et pixels identiques au point précédent. Le rapport auteur reste valide sur ses 29 sources inchangées ; aucune nouvelle exécution de ses 4 000 plans n’est attribuée au correctif d’interface.

Le [nouveau parcours des collecteurs S2](codex/suivi-monde2026/validation-eau-S2-1_74.json) passe **117/117** : 58 contrôles sur ordinateur et 59 en tactile émulé, avec dix reprises exactes et quatre transferts conservatifs de deux unités. Les 228 sources du parcours et les 370 fichiers publics sont identiques avant/après ; le nouveau SW est réellement servi par le serveur QA. Les [six captures fraîches](codex/suivi-monde2026/preuves214-S2/mobile-pour-live-game.png) gardent leur portée : jeu actif et placement cohérent à ce cadrage, HUD mobile dense et détails fins petits, sans certification de fluidité ou de téléphone physique.

Le [parcours mobile local corrigé](codex/suivi-monde2026/validation-eau-portable-1_74.json) passe **58/58** : appui tactile natif maintenu et annulation sans paiement, puis pluie, puisage, reversement et cinq reprises exactes. Les trois [captures actives](codex/suivi-monde2026/preuves214/mobile-pour-live-game.png) et le rapport sont archivés avec leurs empreintes. Les deux premiers essais et les probes restent diagnostiques ou négatifs. Le parcours eau a également réussi sur S1 dans GitHub ; la CI de la tête finale doit requalifier les deux formats. L’attente bornée du contrôleur ne constitue pas une garantie de durée totale de l’échange CDP.

## Travail restant

Les **800 tâches** conservent leurs statuts : 3 validées, 413 en cours et 384 à faire. Cette extension enrichit les quatre notes de services sans déclarer les 4 000 variantes jouables. Elle ne raccorde pas les réseaux domestiques, l’eau potable ni l’assainissement. Les plans lacustres nécessitent encore une adaptation physique spécifique avant admission au seed ; ils ne sont pas ajoutés par une simple substitution de décor.

Les inspections, fixtures déclarées et entrées tactiles émulées ne mesurent ni une campagne humaine de 6 à 10 heures ni les performances d’un téléphone physique.
