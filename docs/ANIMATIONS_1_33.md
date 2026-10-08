# Gestes du survivant — 1.33

Deux planches PNG originales de 1 536 × 1 024 pixels ajoutent **64 poses**, soit huit poses pour chacun des huit gestes. Les sources sont conservées sans retouche dans `assets/hero-harvest133.png` et `assets/hero-actions133.png`. Leur provenance est consignée par la livraison.

| Geste | Déclenchement réel | Cycle visuel |
| --- | --- | --- |
| Hache | Bois retiré d’un gisement naturel | 0,96 s |
| Pioche | Pierre retirée d’un gisement naturel | 1,04 s |
| Levier | Ferraille, carburant ou décor/conteneur réellement fouillé | 0,88 s |
| Ramassage | Nourriture et autres objets ; dépôt effectivement transféré | 0,72 s |
| Marteau | Progression réelle d’un chantier au contact du joueur | 0,88 s |
| Pelle | Pression d’un amas effectivement retirée au rempart | 1,04 s |
| Pansement | Préparation du pansement en cours de progression | 1,20 s |
| Ouverture | Progression du retrait du scellé d’une réserve régionale | 0,96 s |

Les durées règlent uniquement le dessin. Elles ne changent aucun rendement, coût, délai de préparation, collision ni portée. Le dépôt est un geste bref ; les travaux prolongés bouclent tant qu’ils progressent. Aucun geste ne démarre pour E maintenu dans le vide, un sac plein, un chantier bloqué ou une opération refusée. Les ouvertures concernent les réserves scellées déjà présentes dans le jeu : les portes commandées à distance ne prétendent pas recevoir un geste manuel.

`hero-actions133.js` observe les transactions et les progressions existantes. Les accès `worldOps131.activity()` et `survivalPack.activity()` fournissent seulement le type/progrès transitoire et évitent les dossiers complets à chaque image. Les valeurs ne sont pas ajoutées aux sauvegardes. Une reprise et une nouvelle campagne repartent sans ancien geste.

`actor-presentation.js` raccorde cet observateur aux proxies local et régional. Les cibles régionales sont converties de mètres en unités du peintre. Les gestes à pieds plantés s’effacent dès que le joueur se déplace, conduit, tire, recharge ou meurt. La pause fige leur phase. Les postures accroupie et allongée gardent leur silhouette native ; les nouvelles planches ne représentent pas huit versions accroupies supplémentaires.

La marche, le recul, le pas latéral, le tir, le rechargement et les postures précédents sont conservés. Les torses et jambes du rig 1.30 restent séparés pendant la locomotion. Un successeur sans arme utilise les jambes du rig avec un torse à mains libres ; si les images manquent, le secours géométrique ne dessine pas d’arme imaginaire. Les actions ne changent ni la visée réelle ni la trajectoire des projectiles.

## Découpe et coût de rendu

Les silhouettes générées débordent parfois des cellules théoriques. `art.js` conserve des pivots mesurés puis isole les composantes alpha **une seule fois au chargement**. Deux racines supplémentaires séparent le contact entre le marteau d’une pose et le sac de la suivante. Les bords transparents conservent leur anticrénelage, les RGB cachés sous l’alpha nul sont ignorés et chaque pose est mise en cache. Le rendu d’un geste exige ensuite un seul dessin d’image ; aucun détourage ni analyse de pixels n’est exécuté dans la boucle de jeu.

Les poses partagent une échelle et un pivot sous la tête/bassin. Elles sont orientées par rotation dans le plan du jeu. Ce sont huit phases d’un geste vu de dessus, **pas huit directions photographiées distinctes**. Le réglage de mouvement réduit conserve la première pose et désactive les cycles.

## Vérification

La passe 1.52 observe les tirs effectivement comptés pour réserver le recul à l’arme qui vient de tirer et interrompre les gestes de travail. Un tir refusé ou un simple délai d’équipement ne masque plus une récolte réellement effectuée. Les acteurs lents et ralentis animent leurs pas selon les déplacements et le temps de simulation, indépendamment de la fréquence de peinture ; le premier pas de simulation immobile retrouve une pose neutre et les peintures répétées en pause gardent la même phase. Ces observations restent transitoires et ne modifient ni les sauvegardes, ni les rendements, ni la cadence des armes.

`tests/hero-actions133.test.cjs` couvre les transactions de récolte locales/régionales, dépôt unique, chantier, pelle, scellé, pansement, pause, interruption, reprise, huit phases, transparence, découpe des voisins et successeur sans arme. Les suites de locomotion 1.30 sont conservées pour la visée, le recul, les huit déplacements et le suivi des pieds.

- `scripts/capture-actions133.cjs` produit une planche du vrai peintre `Art.drawHeroAction133` sur fond neutre et les rectangles mesurés.
- `scripts/capture-actions133-loop.cjs` produit une boucle GIF des rendus natifs, avec une neuvième vignette de marche à mains libres. Il utilise `@napi-rs/canvas` et FFmpeg dans l’environnement de QA ; ces outils ne sont pas des dépendances du jeu distribué.
- Ces fichiers sont des **rendus Canvas natifs**, pas des captures d’une session navigateur ni une mesure de FPS sur matériel utilisateur.
