# Compositions maritimes équipées — 1.72

Les 150 compositions de cargo, sous-marin et soutien offshore conservent leurs pièces, usages et **13 663 prescriptions de mobilier**. Les **2 851 refus** constatés en 1.71 sont corrigés par la disposition des volumes auteur et, dans quinze pièces, par une recherche complémentaire de placement. Aucun meuble n’est réduit et aucune demande n’est supprimée.

| Type | Variantes | Enveloppe publiée conservée | Demandes réellement placées | Refus avant → après |
| --- | ---: | --- | ---: | ---: |
| T005 — Cargo polyvalent | 50 | 86,6 × 15,2 m | 5 958 | 1 491 → 0 |
| T008 — Sous-marin en surface | 50 | 94,996 × 8,3058 m | 2 103 | 396 → 0 |
| T011 — Soutien offshore | 50 | 80 × 16,2 m | 5 602 | 964 → 0 |

Les dimensions de coque, tirants d’eau, cotes de cale et références proviennent toujours de [la même source métrique](references-metriques2026.json). Les locaux et leur répartition sont des compositions auteur originales à l’intérieur d’une enveloppe rectangulaire. Ils ne reconstituent ni les lignes de coque, ni les plans généraux, ni les aménagements réels des navires cités. Aucune conformité réglementaire n’est revendiquée.

## Volumes et accès

La cale fermée du cargo conserve ses **60,35 × 12,6 m et 9,59 m de hauteur libre**. Sa position longitudinale auteur passe de 17,753 à 22,516 m ; sa fin reste à 82,866 m dans la coque de 86,6 m, avec 3,734 m avant la limite de l’enveloppe. Les locaux sont réservés en amont de cette cale, avec un mur de séparation. Ce déplacement est un choix de composition, pas une correction des données publiées.

La superstructure auteur du cargo utilise les mètres disponibles avant la cale et la largeur de l’enveloppe. Les deux rangées reçoivent des travées différentes selon leurs usages. Le nombre, le nom et le niveau des pièces restent identiques pour chaque variante. Leurs profondeurs sont de 6,34 m ; leurs largeurs vont de 3,000 à 9,398 m. Les travées d’escalier de 5 à 6,2 m, les circulations de 1,8 m et les transitions entre ponts restent conservées.

Dans le sous-marin, la profondeur des compartiments passe à 2,994 m pour recevoir les machines de 2,6 × 1,6 m et leur face de service. Le couloir de 1,1 m, les portes de 0,85 m et l’échelle de 0,75 m restent inchangés. Le palier supérieur du panneau conserve sa portée d’inspection limitée : il ne rend pas le pont extérieur entier parcourable.

Sur le soutien offshore, les locaux commencent à 50 m, après le pont de travail fermé qui s’arrête à 49,8 m, et s’arrêtent à 79,5 m dans la coque de 80 m. Les compartiments ont une profondeur de 6,84 m. La travée d’escalier de 7 m, les circulations de 1,8 m et les quatre ponts conservent leurs caractéristiques.

## Recherche complémentaire de mobilier

Le marqueur auteur `furnishingLayout205:1` active le secours uniquement pour **T005, T008 et T011**, après les placements ordinaires. Les cent compositions de pétrolier et de croiseur gardent exactement leurs sorties auteur et mobilier de 1.71 ; les autres familles n’activent pas ce traitement.

La recherche prépare une pièce complète, avec au maximum **512 candidats par demande et 4 096 états explorés par pièce**. Elle essaie les positions aux murs, des alignements dérivés des dimensions réelles et une petite grille intérieure. Les dimensions et hauteurs du catalogue, marges, rectangles de service de 0,8 m, accès de porte protégés et rayon du piéton de 0,32 m restent les mêmes. Une disposition complète doit conserver le parcours vers chaque face de service avant de remplacer les placements provisoires. En cas de refus ou d’épuisement, les placements ordinaires et les manquants restent présents ; rien n’est effacé pour annoncer une réussite.

Le résultat `packing205` décrit séparément le travail complémentaire. Les tentatives ordinaires gardent leur sens historique. Sur les 150 compositions corrigées, le secours est utilisé dans **15 pièces**, pour **103 états explorés** au total. Il n’appelle pas le hasard de simulation et ne modifie pas le plan source.

## Contrôles et portée

Les [tests dédiés](../../../tests/codex-maritime-furnishing205.test.cjs) contrôlent les 150 compositions, les dimensions des équipements effectivement placés, leurs niveaux, les accès, les murs, les réserves fermées et toutes les faces de service. Une empreinte capturée avant correction impose la conservation de chaque pièce, usage et demande. Deux autres empreintes couvrent les cent plans et aménagements non modifiés du pétrolier et du croiseur.

Les deux fichiers natifs maritimes complets passent **18 tests** localement, sans échec, annulation, ignoré ou TODO. Les **27 cas existants de mobilier sélectionnés explicitement** passent aussi ; leur audit global des 4 000 plans reste une qualification distincte. Les cas négatifs gardent une géométrie volontairement trop étroite, afin de vérifier les refus réels et l’absence de miniature. Un autre cas confirme qu’un secours impossible conserve atomiquement le mobilier partiel et ses demandes manquantes. La version navigateur UMD reproduit le même résultat sans hasard.

Ces corrections concernent **l’inspection auteur**. Elles ne rendent pas les navires pilotables ou implantés en campagne, ne raccordent aucun embarquement au monde et ne créent ni butin, ni rencontre, ni électricité, ni eau ou service actif. La validation complète du commit et de sa publication conserve ses propres reçus.
