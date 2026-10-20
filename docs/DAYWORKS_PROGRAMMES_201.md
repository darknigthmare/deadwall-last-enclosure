# Six programmes physiques de chantier — contenu 201

Ces six compositions complètent les quinze plans historiques sans modifier leurs IDs, fondations ou prix. Elles utilisent uniquement des bâtiments existants et le contrôleur natif Aube & Bastions. Le catalogue contient ainsi 21 plans, dont les six nouveaux ci-dessous.

| ID | Programme et usage | Premier âge | Emprise, en cases | Fondations | Prix intégral des fondations |
| --- | --- | --- | --- | --- | --- |
| `returnService201` | Relais de service : stockage, halte, citerne et éclairage | 2 | 10 × 8 | 4 | 117 bois, 147 ferraille, 40 pierre, 8 carburant, 10 nourriture |
| `craftCourt201` | Cour d’entretien : atelier, génération, stockage et citerne | 3 | 12 × 10 | 4 | 110 bois, 260 ferraille, 65 pierre, 28 carburant |
| `staggeredLines201` | Lignes de repli décalées : deux fronts béton et soutien arrière | 4 | 14 × 13 | 31 | 192 bois, 368 ferraille, 439 pierre, 12 médicaments |
| `powerCourt201` | Cour électrique : centrale, solaire, réserve et protection incendie | 6 | 16 × 12 | 5 | 187 bois, 837 ferraille, 540 pierre, 78 carburant |
| `medicalRecovery201` | Cour de médecine et secours : triage, stérilisation et incendie | 10 | 14 × 11 | 5 | 395 bois, 1 050 ferraille, 735 pierre, 63 médicaments, 20 carburant |
| `siegeSupply201` | Cour de ravitaillement de siège : arsenal, batterie, solaire et dépôt | 11 | 17 × 15 | 5 | 595 bois, 2 560 ferraille, 1 955 pierre, 160 munitions, 55 carburant |

L’âge affiché est le premier âge autorisant toutes les fondations. Il ne garantit ni les ressources, ni les prérequis déjà construits, ni une place libre sur le terrain. Le bureau de planification achevé est requis pour tous les programmes. Les prérequis de leurs bâtiments sont conservés : clinique pour le poste de secours et les deux supports médicaux, atelier pour la caserne incendie et le parc solaire, générateur pour la centrale, usine de munitions pour l’arsenal, centrale pour l’accumulateur et entrepôt pour le dépôt de rempart. Les chaînes de construction de ces prérequis restent celles du jeu.

## Placement et accès

Dans Commandement → Journée & Bastions, choisir le programme, poser l’aperçu sur un terrain valide puis financer. L’aperçu ne coûte rien. Le financement vérifie à nouveau le terrain, les technologies, les prérequis et la totalité du prix avant de poser les fondations. Un échec intermédiaire annule toute la transaction. Il faut ensuite réaliser les chantiers ordinaires.

Les six compositions laissent des passages extérieurs et des accès aux bâtiments. Les lignes de repli comptent deux rangées de douze murs béton, deux portes simples décalées, deux Hérissons, un poste de secours, un entrepôt et un lampadaire. Elles gardent volontairement les côtés ouverts et une liaison transversale ; ce programme ne prétend pas former une enceinte fermée. Les portes blindées restent des améliorations de portes achevées. Le test de circulation considère les deux portes comme fermées et vérifie que chaque support reste approchable par les côtés.

Le contrôleur prend en charge l’orientation de chaque fondation. La citerne est tournée dans les relais de service, d’entretien et électrique ; le poste de secours est tourné dans les lignes de repli. Il n’existe pas de sélecteur natif de rotation globale ou de variante d’un plan : aucun sélecteur fictif n’est ajouté. Chaque programme utilise les sprites, orientations et animations de ses bâtiments existants.

## Économie et services

Chaque prix est exactement la somme des fondations, sans remise ni ressource créée. Le financement ne termine aucun bâtiment et ne débloque pas immédiatement stockage, logement, score ou production électrique. Il ne soigne pas le joueur et ne recrute aucune unité. La batterie de siège commence vide ; sa charge dépend du surplus électrique réel.

Après construction, les services conservent leurs règles : carburant et courant, eau de citerne, médicaments et autres intrants, stocks de munitions et consommation des recettes. Les Hérissons n’obtiennent aucun montage gratuit. Aucun mur supplémentaire, fermeture automatique ou réserve de ravitaillement n’accompagne un programme.

## Vérification reproductible

Commande ciblée :

```sh
node --test --test-concurrency=1 tests/dayworks-programmes201.test.cjs
```

Résultat ciblé du 20 octobre 2026 : **14 tests réussis, aucun échec, aucun ignoré**, en 27,5 secondes. L’exécution a utilisé le rapporteur TAP et un contexte autorisant les sous-processus Node ; la tentative initiale dans le bac à sable, sans sous-cas détaillés, n’est pas comptée comme qualification.

Le fichier vérifie la conservation exacte des quinze plans historiques, les coûts, âges et prérequis, l’absence de chevauchement, les emprises tournées, l’exposition dans le catalogue et la connexion de tous les passages libres. Il exerce ensuite chaque programme sur une carte native : choix, aperçu gratuit, paiement unique, fondations inachevées, sauvegarde et Continuer exacts, absence de capacités ou de batterie gratuites. Une seconde fixture termine explicitement ces fondations pour contrôler les collisions, chemins et faces de travail natifs, portes fermées. Elle ne constitue pas une preuve de progression naturelle ou de durée de partie. Un dernier scénario force un manque de ressources puis un échec au troisième placement pour vérifier la revalidation et le retour intégral à l’état antérieur.

Les fixtures avancées fournissent explicitement connaissance, stockage, prérequis et fonds avant le scénario. Les résultats de qualification générale et navigateur sont consignés séparément dans la livraison ; ce document décrit la portée du test ciblé, sans prétendre à une recette humaine complète.
