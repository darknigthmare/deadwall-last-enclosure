# Audit visuel — 1.37

Cette passe exécute le chargeur `Art.load` et les peintres de production sur Canvas natif. Les poses de la planche d'audit sont des situations préparées ; ce ne sont ni une capture de navigateur ni la preuve d'un parcours intégral. Le script reproductible est `scripts/qa137-visual.cjs`.

## État constaté

- Les 43 images déclarées au début de la passe se chargent, dont les 27 PNG de 1.36. Dimensions vérifiées, aucun fichier défaillant. Ces illustrations ne sont pas régénérées.
- Les neuf essences d'arbres et les quatre familles minérales disposent chacune d'une image distincte. Les sprites conservent leur ratio ; les contours transparents sont mesurés une fois au chargement. La récolte ne recrée pas d'image par frame.
- Les canopées proches du joueur utilisent une opacité réduite. Une roche épuisée est retirée en amont du dessin, et la souche restante est dessinée avec le même rayon maximal de 0,18 m que son emprise physique.
- Les deux textures de sol sont ancrées au monde, avec cache borné et raccords raster vérifiés. Leur chargement tardif invalide les anciennes tuiles. Aucune nouvelle génération de terrain ni modification des identifiants sauvegardés.

## Correction démontrée

Le rendu de secours du personnage associait encore toute la durée `shootCooldown` à une pose de tir. Avec un fusil à verrou, le retour en visée pouvait ainsi attendre le prochain tir, alors que le rig debout utilisait déjà la vraie fenêtre de recul. `heroPose` respecte désormais `visualRecoil` lorsqu'il est fourni par la présentation, et conserve l'ancien comportement pour les compositions historiques dépourvues de ce service. Rechargement, posture basse et travail gardent leur priorité.

## Poses manquantes complétées

La planche `reports/1.37.0/captures/qa137-before-actor-poses.png` montre le changement de perspective lors du rechargement debout et le torse géométrique ancien des mains nues/outils en posture basse. Deux PNG individuels ont donc été générés et intégrés : `assets/art137/survivor-crouch.png` et `survivor-prone.png`. Leur alpha original est conservé ; les contours et pivots de tête/mains mesurés se trouvent dans `HERO_LOW137`. Les fichiers sources ne sont ni déformés ni remontés dans un atlas.

Les mêmes postures basses sont utilisées par les mains nues, les quinze profils d'armes/outils de contact et les armes à feu. Les outils restent dessinés séparément et leur prise est décalée vers les gants. Pour les armes à feu, seuls les rectangles de l'arme peinte du rig historique sont superposés, sans recopier un autre torse. Les familles pistolet et arme longue restent distinctes ; ce ne sont pas trente-sept nouvelles silhouettes d'armes. Le dessin vectoriel reste disponible si les images ne chargent pas.

La recharge debout utilise maintenant le même rig zénithal que la visée : léger mouvement du torse et déplacement du chargeur dérivés de `reload/reloadTotal`. Les deux poses basses sont des sprites fixes accompagnés d'une oscillation légère pendant un déplacement réel ; ce ne sont pas des cycles complets de marche accroupie ou de reptation. Le mouvement réduit supprime ces oscillations. Aucune statistique, collision ou donnée sauvegardée n'est changée.

Le port d'un outil continue d'employer une silhouette vectorielle adaptée à l'arme réellement équipée. Les illustrations d'inventaire ne sont pas présentées comme des cycles animés.

## Validation ciblée

35 tests ciblés réussis, dont quatre nouveaux : recul, trente combinaisons outils/postures sans arme à feu parasite, armes basses/recharge et fichiers alpha/pivots. Suites associées : `assets136`, `actor-presentation`, `hero-art126`, `motion130`. Les nouvelles captures finales montrent les poses complètes et les zooms 0,7 / 1 / 2,4 avec visée tournée. Les situations impossibles de recharge d'une hache ou à mains nues sont signalées « Pas de rechargement » dans la planche finale.

Métadonnées : `reports/1.37.0/captures/qa137-final-actor-poses.json` ; 45 images chargées, aucun échec, dix dessins de chaque nouveau sprite dans les deux planches. La vérification générale de la version est exécutée lors de l'intégration finale. Aucun résultat CSS, tactile physique ou FPS GPU n'est déduit de ce contrôle Canvas.
