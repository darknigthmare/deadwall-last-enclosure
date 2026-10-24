# Aéroports et ferroviaire — plans auteur 2026

Cette famille produit **400 plans métriques**, soit cinquante variantes de chacun des huit types `EXT-MONDE-T069` à `EXT-MONDE-T076`. Elle complète l’inspection auteur. Aucun aéroport, train, avion, service de transport, contenant ou stock n’est ajouté à une campagne par consultation du Guide.

| Type | Programme distinct | Dimensions de composition auteur |
| --- | --- | --- |
| T069 | Aérodrome régional, une piste, terminal et fret léger | Piste de 1 200 à 1 600 m, largeur de 30 m |
| T070 | Aéroport international, deux pistes parallèles et grand terminal | Chaque piste mesure 2 600 à 3 400 m, largeur de 45 m |
| T071 | Aéroport de fret, réception et stockage agrandis | Piste de 2 200 à 3 000 m, largeur de 45 m |
| T072 | Aérodrome insulaire, terminal et hangar plus petits | Piste de 900 à 1 300 m, largeur de 24 m |
| T073 | Gare de passage, deux voies avec destinations aux deux extrémités | Deux voies, deux quais, une liaison d’aiguilles |
| T074 | Gare terminus, quatre voies terminées par des butoirs | Quatre voies et quatre quais ; chaque entrée ferroviaire est explicite |
| T075 | Gare de triage, faisceau de six voies relié à une entrée principale | Six voies et quais de service, cinq liaisons d’aiguilles |
| T076 | Dépôt ferroviaire, faisceau de maintenance de cinq voies | Cinq voies et quais de service, quatre liaisons d’aiguilles |

Les cotes sont des **choix auteur originaux**, pas les relevés d’ouvrages existants ni une certification de sécurité. Les références de longueur, hauteur et emprise ne sont pas interchangeables. L’écartement ferroviaire choisi est de 1,435 m ; la largeur de 4,5 m des arêtes du graphe désigne leur corridor réservé, pas l’écartement des rails. Les courbures, portances, girations, signalisation et procédures de transport restent à qualifier avant une intégration opérationnelle.

## Géométrie et accès

Les pistes conservent toute leur longueur en mètres. Chaque piste possède deux segments continus, trois sorties vers son taxiway, puis une liaison vers l’aire de stationnement. Pour l’aéroport international, les deux taxiways sont reliés par une desserte à l’ouest des extrémités des pistes : aucune ligne ne traverse arbitrairement la seconde piste. Les parkings d’avions, le hangar et la tour ont leurs propres emprises. Les bâtiments et voies piétonnes restent hors des réservations de piste et de taxiway.

L’inspection piétonne des aéroports reste **côté terre**, derrière une clôture continue. Les tours et hangars sont des volumes fermés avec collisions ; aucun escalier ni étage public fictif ne leur est attribué. Le graphe aéronautique dessine les connexions prévues, mais il est distinct du graphe de marche et marqué `operational:false`, `inspectionAccess:'closed'`.

Le ferroviaire distingue les gares de passage, les terminus et les faisceaux de triage ou de maintenance. Chaque voie aboutit à une destination externe déclarée non raccordée, ou à un butoir réellement matérialisé. Les aiguilles sont des connexions géométriques explicites. Les croisements non déclarés, branches isolées, faux changements de niveau et superpositions d’arêtes sont refusés par l’audit.

Les quais se rejoignent à travers un passage piéton de plain-pied explicitement marqué, **sans circulation de train**. Chaque intersection partage les mêmes coordonnées au niveau zéro dans les graphes ferroviaire et piéton. La réserve de voie s’interrompt sur la largeur de cette traversée ; le rail du graphe reste continu. Les clôtures ont une vraie ouverture à cet endroit. Cela ne constitue ni une simulation de barrières, ni une preuve de sécurité d’un passage à niveau en fonctionnement.

## Bâtiments et mobilier

Chaque plan possède sept bâtiments distincts : terminal ou hall, fret, atelier, locaux du personnel, administration, énergie/communications, secours/sécurité. Les pièces sont reliées à un couloir et à leurs véritables ouvertures. Les variantes combinent cinq groupes dimensionnels et dix répartitions des bâtiments ; leur différence géométrique est vérifiée sans compter les seuls identifiants.

Les **14 400 pièces d’usage** sont composées avec le catalogue de mobilier existant, à ses dimensions réelles. Les 2 800 couloirs supplémentaires restent libres. Les refus éventuels d’équipement restent comptés ; une prescription ne provoque aucune réduction d’objet, création de butin ou activation de service. Les accès, faces de travail et déplacements de l’inspecteur sont vérifiés avec le mobilier posé.

## Validation et limites

Les tests de `tests/codex-transport-sites2026.test.cjs` parcourent les 400 variantes, leurs audits, leur mobilier et leur géométrie physique. Ils vérifient notamment les pistes non comprimées, les sorties vers taxiways, les butoirs, les croisements déclarés, les volumes fermés et la parité du cœur JavaScript compilable dans le navigateur. Des contre-exemples retirent des segments et butoirs, déplacent une traversée, ouvrent le graphe de transport, inventent un stock ou altèrent les dimensions : ces documents doivent être refusés.

L’implantation dans les seeds, la continuité avec le terrain et le rivage insulaire, les transports exécutables, le budget fini des ressources, les rencontres, les graphismes définitifs, les animations et la sauvegarde de campagne restent des tâches distinctes. Cette validation d’inspection ne mesure pas une campagne jouée naturellement ni la fluidité sur un appareil physique.
