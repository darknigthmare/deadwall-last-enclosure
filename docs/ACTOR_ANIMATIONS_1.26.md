# Présentation du commandant — 1.26

Deux atlas originaux sont intégrés : `commander-actions-atlas.png` pour les armes longues et `commander-pistol-atlas.png` pour le pistolet. Chacun contient **32 poses**, soit huit états de quatre images. Les angles de visée sont obtenus par rotation dans le rendu Canvas ; il ne s’agit pas de huit directions dessinées séparément.

| État | Déclenchement dans le jeu |
|---|---|
| Attente | Aucun déplacement ni action prioritaire |
| Marche | Déplacement réellement effectué, mesuré après collisions |
| Course | Déplacement effectif debout, sprint consommant de l’endurance et vitesse supérieure à la marche sur ce sol |
| Accroupi | Posture locale ou posture régionale native ; pose fixe à l’arrêt |
| Allongé / ramper | Posture native ; pose fixe à l’arrêt, cycle pendant le déplacement |
| Tir | Temporisation de tir de l’arme réellement utilisée |
| Rechargement | Avancement du rechargement en cours, y compris son accélération réussie |
| Travail | Récolte donnant réellement des ressources ou construction progressant grâce à l’action du joueur |

Le cycle de travail sert également au coup de crosse local. La posture accroupie/allongée reste prioritaire sur les gestes d’arme : ces atlas ne comprennent pas des combinaisons distinctes de chaque posture avec chaque arme et action. La pose allongée tient lieu de représentation du commandant à terre lorsqu’il est dessiné. Il n’y a pas de séquence dédiée de mort, d’entrée en véhicule ou de soin dans ces atlas.

## Raccordement aux scènes

`src/actor-presentation.js`, chargé après les extensions de gameplay, installe `game.actorPresentation.player(regionView?)`. Cette méthode retourne deux objets de présentation stables, un pour D-17 et un pour la région. Le joueur de simulation n’est pas modifié.

Dans D-17, `game.art.presentation(entity, kind)` reconnaît le commandant et fournit son objet de présentation. Les autres acteurs gardent leur rendu existant. Le rendu régional fournit directement sa vue à `player(view)` : les coordonnées en mètres sont converties en unités de dessin par le facteur 32 et l’angle vient de la direction régionale. Un objet déjà préparé reste le même lorsqu’il passe par le hook d’art.

L’adaptateur observe le déplacement et les transactions après exécution. Appuyer sur E à vide, déposer un sac, avoir un stockage saturé, ou courir contre un mur ne déclenche pas une animation de travail ou de course. Les travaux automatiques des ouvriers ne font pas travailler visuellement le commandant.

## Pause, reprises et accessibilité

- La pause suspend les indicateurs de mouvement et de travail ; le temps de simulation fige les autres cycles.
- Un changement de scène, d’étage, de monde, de joueur ou d’état de réanimation réinitialise le suivi visuel.
- Un déplacement de position sans pas de simulation observé est traité comme une téléportation, sans cycle de marche inventé.
- Aucun registre supplémentaire n’est sauvegardé ; le rendu est reconstruit depuis les états de gameplay existants.
- L’option de mouvement réduit sélectionne une pose fixe par état dans `art.js`.

La région ne proposant pas de coup de crosse, son objet de présentation ignore un éventuel reliquat du cooldown local. La donnée de simulation reste intacte.

## Vérification

`tests/actor-presentation.test.cjs` exerce le moteur sous fixture DOM : identité stable, absence de mutation, marche/course effectives, collision, récolte, chantier, dépôt, pause, rechargement, reprise, passage D-17/région et réanimation. `tests/art.test.cjs` et `tests/hero-art126.test.cjs` vérifient séparément les atlas et le sélecteur de pose. Ces tests ne certifient pas une session de navigateur interactif.
