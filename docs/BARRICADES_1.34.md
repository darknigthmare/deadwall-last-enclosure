# Ouvertures et barricades — 1.34

Les barricades renforcent les ouvertures réellement présentes dans la géométrie. Elles ne remplacent pas les enceintes constructibles ni les caissons et filets existants.

## Utilisation

Approchez d'une ouverture avec les fournitures dans le sac, puis ouvrez **Opérations → D-17 → Ouvertures**. Le panneau identifie la cible et sa largeur physique. « Autre ouverture proche » change de cible si plusieurs sont accessibles.

| Renfort | Bois | Ferraille | Intégrité | Pose |
| --- | ---: | ---: | ---: | ---: |
| Planches croisées | 6 | 1 | 120 | 5 s |
| Bois contreventé | 10 | 4 | 240 | 9 s |
| Tôle rivetée | 2 | 12 | 360 | 13 s |

La réparation rend au plus 70 points pour 2 bois et 1 ferraille en 4 secondes. Le démontage dure 3 secondes, fonctionne sans outil depuis les deux faces, et restitue jusqu'à 35 % des composants selon l'intégrité. Le sac plein ne bloque pas la sortie : le surplus du démontage est perdu. Un marteau équipé facilite pose et réparation ; un pied-de-biche facilite le démontage. Ces outils s'usent via l'armurerie.

Les coûts sont débités seulement à la fin du travail. Déplacement, tir, rechargement, blessure, décès, changement de domaine ou autre tâche annulent le travail sans créer ni perdre de composants. Pause et menus suspendent le travail. La proximité d'un infecté empêche pose/réparation ; le démontage d'urgence reste possible jusqu'à une blessure, pour préserver une possibilité de sortie.

## Supports physiques

- D-17 : portes des quatre stations, fenêtres brisées des stations sur le plan révision 3, et portails de cour.
- Région : portes extérieures et passages intérieurs reconnus dans les espaces entre les murs du plan partagé, y compris aux étages.
- Les maisons D-17 représentées comme volumes pleins n'ont pas de fausses ouvertures interactives.
- Les fenêtres D-17 sont déjà brisées et leurs seuils bas sont traversables. Il ne s'agit pas d'un système de saut par-dessus des fenêtres vitrées.

La portée d'intervention est de 2,4 m depuis une face accessible. La fermeture d'un passage occupé est refusée. Les renforts bloquent les survivants, infectés, véhicules, lignes de vue et projectiles. Les tirs locaux frappant les renforts réduisent leur intégrité. Les tirs régionaux rencontrent la même collision et endommagent le renfort avant de s'arrêter. Les infectés au contact frappent selon leur cadence normale ; les groupes régionaux ne sont pas autorisés à frapper à chaque image.

## Persistance, rendu et performance

`expansions127.modules.barricades134` contient uniquement `{target,type,hp}`. La position n'est jamais recopiée : elle est dérivée des portes, fenêtres, portails et murs existants. La validation vérifie les supports dans la graine et le niveau de la sauvegarde avant remplacement de la campagne. Une ancienne sauvegarde reçoit un registre vide. Une nouvelle campagne retire toutes les barricades. Le décès du commandant conserve les renforts.

Les collisions utilisent des rectangles orientés. Des cellules spatiales limitent les recherches aux barricades proches ; aucun monde régional n'est généré pour ouvrir le panneau depuis D-17. Les poses ont leur propre entrée dans la file de profondeur, avec un pied ancré sur le plan physique. La hauteur reste orientée vers le haut de l'écran, même sur une fenêtre latérale.

Les travaux ne sont pas sauvegardés en cours : leur coût reste dans le sac jusqu'à l'achèvement. Le chargement ne duplique donc ni une pose ni un remboursement. Les barricades ne confèrent pas de protection invincible : elles ne couvrent que l'ouverture choisie, une porte arrière libre reste un passage possible.

## Vérification ciblée

`tests/barricades134.test.cjs` vérifie les coûts et délais, les vraies fenêtres, les collisions alliés/infectés et tirs, les étages, les reprises transactionnelles, le démontage depuis l'intérieur, les limites du sac et les interruptions. Ces contrôles portent sur le moteur exécuté, pas sur une campagne humaine de plusieurs heures.
