# Infectés — extension tactique crédible

Ce lot porte le bestiaire à huit profils sans changer la formule d'effectif total, les statistiques des cinq profils historiques, le plafond de santé ni la limite de 720 infectés actifs. Il ne transforme aucun infecté en boss et n'ajoute ni projectile, explosion organique, téléportation ou apparition de renforts.

## Trois rôles supplémentaires

| Profil | Première vague | Santé de base | Vitesse | Dégâts / attaques par seconde | Rôle vérifiable |
|---|---:|---:|---:|---:|---|
| Briseur | 3 | 140 | 30 | 18 / 0,65 | Ancien ouvrier en veste ocre. Dégâts ×1,8 contre les structures seulement. |
| Traqueur | 6 | 62 | 61 | 11 / 1,1 | Silhouette fine en sweat à capuche. Dévie vers un survivant isolé, proche et visible. |
| Engorgé | 8 | 145 | 23 | 20 / 0,65 | Manteau rouge-brun. Sa dépouille ajoute 3,4 unités de pression au rempart proche. |

La santé maximale de référence reste celle de l'infecté protégé : 175 avant difficulté et croissance logarithmique plafonnée à ×1,34. Les huit entrées `ENEMIES` exposent `description`, `weakness`, `unlockWave`, `structureDamage` et `corpseLoad` pour un bestiaire fondé sur les règles jouées.

## Budget de la horde

`wavePlan` conserve exactement la formule d'effectif antérieure, la signature de la cité, les fronts et la cadence d'apparition. Les nouveaux profils remplacent une part des autres infectés ; aucun second contingent n'est ajouté.

- Briseur : poids initial de 4 % en vague 3, puis +0,3 point par vague, plafond 10 %.
- Traqueur : 3,5 % en vague 6, puis +0,4 point par vague, plafond 9 %.
- Engorgé : 3 % en vague 8, puis +0,3 point par vague, plafond 7 %.
- Les poids de tous les profils autres que l'Errant sont renormalisés ensemble au-delà de 82 %. Les arrondis restants reviennent aux Errants.

Ces plafonds sont des poids avant renormalisation, pas une promesse de pourcentage final fixe. Les vagues 1 et 2 conservent exactement leur ancienne composition. Les trois nouvelles introductions produisent au moins un contact dès leur première vague dans chaque difficulté, même avec signature nulle.

## Ciblage et collisions

Le Traqueur recherche un joueur ou un survivant vivant à 210 pixels au plus. Une cible est isolée lorsqu'aucun autre allié vivant ne se trouve dans un rayon de 90 pixels. Tous les métiers alliés participent à cette règle ; être accompagné protège de la sélection opportuniste, pas du contact ordinaire d'une horde.

Les décisions sont espacées de 0,5 seconde, avec au plus huit recherches par actualisation de simulation. Les droits de recherche tournent entre les infectés pour éviter de priver les derniers du budget, même dans une sauvegarde artificielle contenant 720 Traqueurs. Un index spatial d'alliés est partagé par le lot de recherches. La vérification d'isolement est donc périodique ; les morts, la distance excessive et la perte de visibilité annulent immédiatement la cible mémorisée.

Une chasse ne commence que si la ligne de vue et tout le corridor direct sont libres, rayon de l'infecté compris. Les portes ouvertes laissent passer, les portes automatiques/verrouillées et les murs masquent la cible. Les autres structures bloquent aussi le raccourci physique. Une nouvelle obstruction au pas suivant annule la déviation et restitue le champ de flux collectif. Aucun A* supplémentaire n'est lancé par Traqueur.

Les attaques au corps-à-corps de tous les profils utilisent une intersection exacte segment/rectangle contre les barrières, y compris un mince angle de mur. Les attaques de structures vérifient la portée jusqu'au bord et l'absence d'une autre structure entre l'infecté et sa cible. Les portes ouvertes ne sont pas attaquées comme des obstacles.

Les nouveaux profils ne grimpent pas les amas : les franchissements historiques restent réservés aux Infectés récents et aux Rampants. Une porte verrouillée n'annule pas cette mécanique existante.

## Corps et sauvegardes

Un Engorgé mort près d'un rempart augmente sa charge de 3,4 au lieu de 1 pour la plupart des profils ou 2,2 pour les protégés. La doctrine sanitaire conserve sa règle existante : **0,65 pour tous les profils**. Aucun dégât de zone, particule d'explosion ou effet de mort secondaire n'est déclenché.

Le format de sauvegarde reste v2, extension additive. Les compteurs compacts ont huit clés ; les anciennes cinq clés et files de chaînes sont toujours reconnues, avec zéro pour les nouveaux profils absents. Les huit types actifs sont validés et restaurés. Les identifiants inconnus sont refusés à l'import et à l'apparition runtime. Une cible de chasse est transitoire et réévaluée après chargement, jamais sérialisée comme référence vers un ancien monde.

## Vérifications et limites

`tests/enemies-content.test.cjs` couvre les huit fiches, les valeurs historiques, les déblocages, l'effectif exact jusqu'à la vague 1 000 000, les plafonds de santé/parts, les migrations v1/v2, les sauvegardes à huit types, les profils inconnus, le bonus structurel, les angles de mur, le ciblage isolé/groupé, les portes et corridors, le budget de recherches, l'absence d'explosion et la compatibilité des rampes.

Un stress de 30 secondes simulées charge réellement 720 infectés avec les huit profils et le champ de flux normal, puis vérifie à chaque point de contrôle les compteurs par type, les limites de files/effets et la reprise de sauvegarde. Des éliminations synthétiques protègent le centre et exercent le recyclage : ce test n'est ni une partie humaine ni une mesure de FPS.

La commande ciblée `node --test tests/enemies-content.test.cjs tests/core.test.cjs tests/tactics.test.cjs tests/strategic.test.cjs` couvre le lot après intégration, dont la traversée physique d'une porte ouverte et l'équité du budget au plafond de 720 Traqueurs. Les contrôles visuels, atlas, bestiaire d'interface et distribution sont réalisés dans le lot d'intégration, pas attestés par ces tests de simulation.

La poursuite est volontairement locale et directe : ce n'est pas une IA de chasse globale capable de contourner seule plusieurs enceintes. Les chiffres sont bornés et testés, mais ne constituent pas une preuve d'équilibrage commercial à long terme ; des parties humaines prolongées sur plusieurs graines restent nécessaires.
