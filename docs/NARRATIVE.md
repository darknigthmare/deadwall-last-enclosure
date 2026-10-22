# Registre de D-17

## Intention et canon

Le dépôt municipal D-17 devient le point de retour d’une communauté. Les six quartiers portent les traces de l’organisation civile avant leur abandon. Le joueur ne découvre ni cause certaine de la contamination, ni vaccin, ni évacuation garantie.

Les documents ont des auteurs fictionnels originaux, dont le sort reste inconnu. Ils ne correspondent pas aux survivants actuellement simulés. Les noms du personnel de terrain restent déterministes et leurs unités peuvent mourir. Il n’y a ni personnage immortel implicite, ni appel radio prétendument reçu d’un PNJ vivant, ni doublage enregistré.

Le texte immersif reste dans les traces et leurs conséquences. Les règles exactes, coûts et limites sont affichés séparément. Il n’y a pas d’interruption cinématique : le journal s’ouvre volontairement dans la pause tactique.

## Boucle jouable

1. Ouvrir le journal depuis le HUD ou l’onglet JOURNAL du poste.
2. Marquer l’un des six secteurs. Le repère ne téléporte personne et ne donne aucun ordre.
3. Rejoindre le point de relevé indiqué à moins de 90 unités, sur un sol physiquement libre, puis maintenir E / ACTION pendant huit secondes actives, hors récolte, dépôt ou chantier prioritaire.
4. Le relevé partiel est conservé. Pause, menu, mort et éloignement ne le font pas progresser. Une visite passive ne suffit pas.
5. Revenir à moins de 180 unités du centre de commandement, par un accès réellement libre.
6. Engager A ou B : coût atomique, un seul effet pour cette campagne, décision conservée au chargement. La lecture seule ne donne rien.

Les valeurs sont centralisées dans `src/core.js` : `NARRATIVE_RULES` et `NARRATIVE_OPERATIONS`. Les relevés n’accordent aucune ressource. Les décisions ne créent aucun stock ni amélioration permanente de combat.

Dans le quartier métrique R4, le point de relevé est résolu depuis les obstacles immuables du plan natif, l'emprise du dépôt initial et les stations physiques exposées par leur propriétaire `fieldcraft`. Le centre historique est conservé lorsqu'il est praticable et raccordé à l'accès initial ; sinon, la recherche déterministe est limitée à 360 unités, avec un pas de 16 et un dégagement de 16 unités. La résolution parcourt la grille cardinale native finie depuis l'accès initial, avec contrôle des segments physiques entre cellules, puis du segment reliant la cellule d'arrivée au point. Un disque libre dans une cellule obstruée ou une zone enclavée n'est donc pas admissible. Ce calcul ne dépend pas du budget heuristique d'une requête de déplacement. Deux zones de relevé ne se recouvrent pas. Sans candidat admissible, le point est annoncé indisponible et le relevé reste refusé. Le rayon d'action de 90 unités et les huit secondes de travail ne changent pas.

Cette résolution ne déplace ni le personnage, ni le secteur, ni les constructions, ni les ressources. Le repère au sol, le repère de carte et les coordonnées du journal utilisent le même point. Les centres géographiques non marqués continuent à situer les secteurs de récupération. Une construction ajoutée par le joueur ne déplace pas le point : la présence réelle dans la zone reste soumise aux collisions courantes. Les anciennes géométries R1–R3 conservent leur centre historique.

| Secteur | Trace | A : étude, +1 insight | B : partage, +4 moral maximum |
| --- | --- | --- | --- |
| Maisons sans voix | Les portes entrouvertes | 12 bois, 12 ferraille | 8 nourriture |
| Arcades muettes | Le registre des parts | 16 ferraille, 8 nourriture | 8 nourriture |
| Camp des veilleurs | La colonne des incertains | 12 ferraille, 2 médicaments | 8 nourriture |
| Cour des citernes | La lumière de service | 18 ferraille, 6 carburant | 8 nourriture |
| Terminus des cendres | Le trajet barré | 16 ferraille, 6 carburant | 8 nourriture |
| Passage du dernier feu | Deux ordres sur le même billet | 12 bois, 14 ferraille | 8 nourriture |

Le moral reste plafonné à 100 ; le gain réellement possible est affiché avant le choix. Le partage B demande au moins un survivant vivant dans l’équipe. Il empêche de récupérer ensuite l’insight A de ce dossier. Six décisions A donnent au maximum six insight, en échange d’expéditions et de réserves ; les doctrines gardent leurs coûts, leurs paliers et leurs propres conditions. À la borne technique d’insight, A est refusé avant paiement : la campagne reste exportable.

## Progression mémorisée

- I, Le point de retour : début de chaque campagne.
- II, Une place derrière les murs : les trois premiers objectifs d’introduction ont été accomplis.
- III, Ce qu’ils ont laissé : premier relevé terminé.
- IV, La dernière enceinte : six décisions consignées et au moins trois vagues repoussées.

Les chapitres déjà acquis restent lisibles après la perte d’un bâtiment. Le IV est un épilogue humain, pas une victoire qui arrêterait le directeur de horde. Aucune opération n’est nécessaire pour construire, rechercher ou continuer une campagne.

## Sauvegarde et sûreté

Le format global reste v2. Le champ additionnel `narrative` contient sa version 1, six entrées par thème, les secondes de relevé, le choix A/B/null, les identifiants de chapitres et de lectures en attente. Aucun texte libre ni code n’est importé.

Le thème, pas le numéro géographique site-1, identifie un dossier. Les thèmes changent de place avec la graine mais ne changent pas d’histoire. La normalisation refuse valeurs non finies, états incohérents, inconnus et listes dupliquées. Une ancienne sauvegarde sans ce champ reçoit un registre vierge, sans récompense rétroactive. Une importation invalide ne remplace pas le monde courant.

Le point métrique est une donnée dérivée du plan, pas un nouveau champ de sauvegarde. Charger une campagne R4 existante conserve les secondes, décisions et lectures par thème, ainsi que tous les stocks, identités, positions sauvegardées et l'état RNG. La résolution ne prélève aucun tirage aléatoire et ne donne aucun progrès automatique.

`tests/narrative.test.cjs` couvre les contraintes physiques et temporelles, coûts, pause, non-répétition des gains, migration, données corrompues, progression et maintien du mode infini. `tests/narrative-spatial202.test.cjs` ajoute la recherche bornée, les cellules obstruées, les segments coupés, les zones enclavées, les campagnes métriques 17117/42/4294967295, le relevé réel et partiel, les identités et le RNG inchangés, ainsi qu'un mur légalement payé puis achevé sur le point avant une reprise de sauvegarde. Le rendu navigateur et l’équilibre sur de longues parties humaines constituent des vérifications distinctes.
