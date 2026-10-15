# Les Enceintes du Ciel — personnel et ravitaillement 181

## Périmètre

Suite de la PR #6, branche `feat/vertical-citadel-175`, sur `d874f8c5dc3777645306dedbb49d11e2b504b417`. Les onze âges, les 39 supports, 31 équipements, ponts, portage manuel, sièges et sauvegardes précédents restent en place. Aucun changement de main et aucune fusion de la variante #7.

Cette passe affecte des **survivants natifs déjà présents** à un palier construit. Elle n'ajoute pas de population gratuite, de double visuel ni de stock artificiel. Les rôles admis sont ouvriers, soldats, ingénieurs et secouristes. Les autres habitants décoratifs ne deviennent pas automatiquement des agents navigants.

## Ordres utilisables

Sélectionner un support au sol, ou rejoindre le palier voulu, puis ouvrir **Citadelle verticale → Personnel et ravitaillement**. Au sol, les affectations sont aussi proposées directement pour le premier palier du support sélectionné. Le dossier propose le premier survivant disponible de chaque rôle, son identifiant, un ordre de rappel et, lorsque pertinent, le transfert de son affectation vers le palier consulté.

Un ordre ne déplace pas instantanément le survivant et ne débite rien à distance. Un survivant avec une récolte dans son sac, en expédition, dans une équipe de récupération, une opération de siège/infrastructure/territoire ou une escorte ne peut pas être pris simultanément par ce service. Les systèmes natifs concernés excluent à leur tour le personnel affecté.

| Âge | Affectations simultanées maximales |
|---|---:|
| Refuge | 1 |
| Camp fortifié | 2 |
| Avant-poste | 3 |
| Forteresse | 4 |
| Ville | 6 |
| Grande ville | 8 |
| Métropole | 10 |
| Grande métropole | 12 |
| Mégaville I | 16 |
| Mégaville II | 20 |
| Mégaville III | 24 |

Ce sont des limites d'affectation, pas des recrutements accordés au passage d'âge. Les conditions natives d'acquisition des survivants et des âges ne changent pas.

## Parcours et sacs réels

Le survivant rejoint le centre de dépôt par le pathfinding au sol existant. Une fois physiquement à portée, il retire au plus **10 cartouches** pour l'ouvrier ou le garde, **10 ferrailles** pour l'ingénieur, **2 médicaments** pour le secouriste. Ces fournitures sont inscrites dans son sac natif `carry/carryType` et retirées du stock commun une seule fois. Un dépôt vide laisse le survivant en attente, sans créer de fournitures.

Il rejoint ensuite une entrée praticable du réseau connecté, emprunte l'escalier, les passerelles achevées et les autres paliers nécessaires. Les entrées obstruées sont exclues. Les tronçons de marche utilisent le même contrôle géométrique que les intrus 180 ; les équipements, vides et réservations de passage restent bloquants. La vitesse chargée est réduite à 75 %.

Une seule unité de ce service s'engage à la fois dans une cage d'escalier ou sur une passerelle. Des positions d'attente libèrent autant que possible les sorties. Ce contrôle ne constitue pas une simulation générale de congestion : le joueur et les infectés ne participent pas à un ordonnanceur commun, et des blocages peuvent exiger de dégager le passage ou de rappeler une affectation.

Les trajets d'escalier restent contraints et temporisés. Les PNJ de cette passe utilisent les **escaliers**, pas encore les cabines d'ascenseur ni un monte-charge. Les ascenseurs du joueur sont conservés.

## Travail au palier

**Ouvrier de ravitaillement.** Il approche un affût incomplet en munitions sur son palier, travaille trois secondes actives, puis transfère uniquement les cartouches de son sac dans la capacité disponible. Aucun atelier fictif ne produit des cartouches pendant la livraison. Un sac vide déclenche le retour pour se réapprovisionner. Les stocks de l'affût restent ceux utilisés par la possession classique/FPS.

**Garde.** Il surveille son palier avec une portée de 24 mètres et engage des infectés réellement visibles à travers le système de rayons en altitude. Chaque tir consomme une cartouche de son sac. Les dégâts et la cadence suivent les règles natives du soldat, avec la recherche balistique déjà acquise. Le garde ne tire pas à travers une dalle sur une cible superposée en 2D. Cette première affectation ne pilote pas un affût et ne remplace pas toute la logique d'escouade par une patrouille de quartier.

**Ingénieur.** Il rejoint un module achevé endommagé et répare au maximum 10 PV par seconde active, contre une ferraille pour 30 PV réellement rendus, jusqu'à épuisement de sa charge. Il ne construit pas une nouvelle dalle et ne répare pas encore automatiquement les piliers, ponts ou ascenseurs. L'identité, les munitions et la capacité du module sont conservées.

**Secouriste.** Il rejoint un acteur vivant blessé à la même altitude et soigne à la cadence native, avec des médicaments de son propre sac. Les soins ne traversent pas les volumes opaques, ne ressuscitent personne et ne remplissent pas les médicaments par changement de caméra. Une menace visible à moins de quatre mètres fait se replier les personnels non combattants avec leur charge.

## Retour, interruption et intégrité

Le rappel conserve le sac et laisse finir la transition engagée vers une rive ou un palier sûr. L'unité descend puis retourne au centre. Les seules fournitures restantes sont restituées, dans la place disponible. Un dépôt plein maintient le sac sur son porteur ; il ne disparaît pas. Cette restitution ne donne pas de crédit de récolte ou d'objectif de dépôt. L'unité est libérée après ce retour physique. Le rappel général natif est respecté.

Les pauses, menus et expéditions hors D-17 suspendent la simulation du personnel. Une sauvegarde conserve les sacs et les trajets, mais ne termine pas gratuitement un travail de livraison en cours.

La présence d'une unité empêche une construction superposée, la dépose de la dalle occupée ou visée par son trajet, la dépose du pont occupé et la suppression au sol du support utilisé. Une destruction hostile n'est pas un démontage : elle provoque une chute résolue à proximité avec dégâts depuis l'altitude antérieure, et éventuellement la mort native. Il n'y a ni remboursement automatique ni deuxième survivant généré. Les infectés déjà sur les paliers peuvent attaquer ces véritables unités.

## Sauvegarde version 5

Les versions verticales 1 à 4 migrent avec une liste de personnel vide, sans stock, recrutement ou soin. Le nouveau sous-registre version 1 référence les identifiants natifs et contient la destination, le support, le palier, la passerelle, la transition d'escalier, la phase et le rappel.

Les contrôles transactionnels refusent les identifiants absents/doublons, sacs incompatibles, activités concurrentes, supports inachevés, destinations inexistantes, positions hors dalle ou dans un équipement, ponts incohérents et positions impossibles dans un escalier. Après validation, les positions élevées exactes sont conservées malgré la correction historique des collisions au sol lors d'une reprise.

Les deux vues représentent l'unité native à cette altitude. Le rendu procédural n'est pas une version artistique finale et ne livre pas de nouvelles animations de manutention. Les tests du serveur et les ressources de précache comprennent le script de personnel, avec une nouvelle clé de cache sans effacement des sauvegardes.

## Vérification

```sh
node --test --test-concurrency=2 tests/vertical-*.test.cjs
node --test --test-concurrency=2 tests/core.test.cjs tests/urban-night.test.cjs tests/power-grid.test.cjs tests/expeditions.test.cjs tests/expansion-kit.test.cjs
npm run check
node scripts/qa-vertical181.mjs
```

Les résultats de la révision réellement testée sont consignés dans le compte rendu QA. Le scénario 181 prépare des matériaux, déblaye et achève deux supports ; il utilise un ouvrier déjà présent au lancement et ne réinjecte pas sa position après création. Il contrôle la livraison, les sauvegardes en escalier et sur le pont, le rappel et les vrais boutons. Ce n'est pas une campagne naturelle jouée jusqu'au dernier âge.

## Toujours ouvert

L'ensemble de la population n'est pas encore simulé avec métiers résidentiels, logements individuels et changements de relève. Restent le fret de caisses/modules par PNJ, les stocks par quartier, les monte-charge, le partage complet des files d'attente, l'entretien structurel autonome, les cages/cabines libres, ponts complexes, grands bâtiments historiques sur dalles, piliers/effondrements physiques, corps individuels et foules lointaines avec niveaux de détail, art/sons/HUD finaux et qualification longue multi-appareils. Les plafonds de 720 infectés natifs, 24 infectés élevés et 64 passerelles ne sont pas augmentés.
