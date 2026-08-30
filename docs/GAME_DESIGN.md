# Game Design — DEADWALL

## 1. Vision

DEADWALL est un mélange d’action-survie, de construction, de gestion de colonie et de tower defense. La promesse n’est pas seulement « tuer beaucoup de zombies », mais **voir une poignée de survivants transformer physiquement un refuge en cité fortifiée**, puis défendre cette cité à travers plusieurs lignes de repli.

Le jeu doit toujours opposer deux courbes :

- la puissance et le confort grandissants de la colonie ;
- la signature grandissante qui attire des migrations toujours plus importantes.

## 2. Fantaisie du joueur

La progression comporte trois identités successives, sans coupure :

1. **Survivant** : récolter, porter, tirer, construire soi-même.
2. **Commandant** : placer les bâtiments, automatiser les ouvriers, former des unités, sécuriser les routes.
3. **Gouverneur de citadelle** : répartir l’énergie, les munitions et les renforts entre plusieurs enceintes pendant un siège.

Le personnage reste jouable à toutes les étapes. Le joueur peut toujours revenir au sol pour réparer un secteur, transporter des munitions ou participer à une contre-attaque.

## 3. Boucle principale

### Phase calme

- explorer la carte ;
- récolter les gisements ;
- déposer les ressources ;
- tracer les futures enceintes ;
- construire et réparer ;
- recruter ouvriers et fusiliers ;
- équilibrer nourriture, logements, stockage et énergie ;
- repositionner le point de ralliement.

### Alerte

- estimation du nombre de contacts ;
- annonce du ou des fronts ;
- fin des chantiers urgents ;
- remplissage des chargeurs et dépôts ;
- concentration des soldats ;
- choix des secteurs sacrifiables.

### Assaut

- tir direct du joueur ;
- engagement automatique des fusiliers et tourelles ;
- pression progressive sur les portes et murs ;
- accumulation des corps ;
- ouverture éventuelle d’une brèche ;
- repli vers une enceinte intérieure.

### Sécurisation

- destruction des derniers infectés ;
- réparation ;
- déblaiement progressif de la pression des corps ;
- récompenses de vague ;
- accueil occasionnel de survivants ;
- extension de la cité.

## 4. Ressources

| Ressource | Usage principal |
|---|---|
| Bois | logements, palissades, bâtiments précoces |
| Ferraille | machines, armes, murs métalliques, réparations |
| Pierre | remparts en béton et bâtiments lourds |
| Nourriture | entretien de la population et recrutement |
| Carburant | générateurs, raffineries, défenses avancées |
| Munitions | joueur, fusiliers, miradors et tourelles |
| Médicaments | clinique et infrastructures sanitaires |

Le joueur collecte personnellement dans un sac limité. Les ouvriers créent ensuite une boucle collecte → transport → stockage. Les industries transforment l’économie d’un système de récupération en système de production.

## 5. Construction

Chaque structure commence comme un chantier visible. Les ressources sont engagées lors de la planification. Le chantier avance grâce :

- au joueur maintenant E à proximité ;
- aux ouvriers disponibles ;
- à une progression minimale très lente évitant un blocage définitif.

Les murs se tracent en ligne par cliquer-glisser. Les trois générations sont :

1. palissade en bois ;
2. mur d’acier ;
3. rempart en béton armé.

Les murs existants peuvent être améliorés sans perdre leur position ni leur pourcentage d’intégrité.

## 6. Enceintes concentriques

Une bonne cité n’est pas un carré unique. Elle comporte :

- une enceinte extérieure couvrant agriculture et production ;
- une enceinte intermédiaire protégeant logements et industries ;
- une enceinte intérieure autour du centre de commandement ;
- des portes contrôlées et couvertes par des tirs croisés ;
- des secteurs pouvant être abandonnés sans perdre immédiatement la partie.

La chute d’une structure ordinaire ou d’un rempart ne termine pas la partie. La défaite survient uniquement lorsque le centre de commandement est détruit.

## 7. Infectés

### Errant

Lent, faible individuellement, dangereux par la masse.

### Infecté récent

Rapide, peu résistant, capable d’exploiter les rampes de corps.

### Infecté protégé

Ancien policier, pompier ou militaire portant encore des protections. Sa résistance vient de l’équipement, pas d’une mutation fantastique.

### Rampant

Profil bas et rapide, efficace autour des débris et contre les positions mal fermées.

### Hurleur

Agite les infectés proches et augmente temporairement leur vitesse d’assaut.

## 8. Navigation des hordes

Le monde utilise un champ de flux calculé depuis le centre de commandement. Chaque cellule reçoit un coût :

- terrain libre : faible ;
- porte : moyen ;
- palissade : élevé ;
- acier : très élevé ;
- béton : extrêmement élevé ;
- bâtiment : coût important mais traversable après destruction.

Les hordes suivent donc naturellement les accès les moins coûteux. Elles n’effectuent pas un contournement absurde si détruire un mur est finalement plus rapide.

## 9. Pression des cadavres

Un infecté tué près d’un rempart augmente sa charge de corps. Les ouvriers et le temps réduisent lentement cette charge. Au-delà d’un seuil, certains profils rapides ou rampants peuvent utiliser l’accumulation comme rampe et franchir la structure sans qu’elle soit encore détruite.

Ce système empêche une stratégie fondée uniquement sur un mur gigantesque et des armes automatiques sans gestion du terrain.

## 10. Économie urbaine

La cité suit :

- population active ;
- capacité de logement ;
- consommation de nourriture ;
- capacité de stockage ;
- production et demande électriques ;
- moral ;
- signature globale.

Une pénurie de nourriture fait baisser le moral et réduit la vitesse des unités. Un déficit énergétique ralentit ou coupe les équipements dépendants de l’électricité.

## 11. Signature

La signature augmente avec :

- le score des bâtiments ;
- la population ;
- la consommation électrique ;
- le nombre total de structures.

La taille des vagues reçoit un multiplicateur d’attraction pouvant atteindre +80 %. Une mégacité ne peut donc pas devenir définitivement sûre par simple accumulation de production.

## 12. Progression

| Palier | Fonction |
|---|---|
| Refuge | survie et premières constructions |
| Camp fortifié | caserne, générateur, automatisation fiable |
| Avant-poste | acier, atelier, clinique et industrie avancée |
| Forteresse | béton, manufacture de munitions, portes blindées |
| Cité | tourelles lourdes et défense multi-secteurs |
| Citadelle | plusieurs enceintes permanentes |
| Mégacité | survie infinie à très grande signature |

## 13. Conditions de réussite et d’échec

Il n’existe pas de victoire finale obligatoire dans le mode infini. Les objectifs sont :

- franchir les paliers ;
- survivre davantage ;
- bâtir plusieurs enceintes ;
- augmenter la population sans effondrer la logistique ;
- battre ses records de vagues, de population et d’échelle urbaine.

La défaite est la destruction du centre de commandement.

## 14. Ton et direction artistique

- palette terre, acier, béton, végétation sale et éclairages sodium ;
- silhouettes immédiatement lisibles malgré le nombre ;
- bâtiments assemblés et réparés, jamais futuristes ou impeccables ;
- pluie, nuit, fumée, étincelles, impacts et corps persistants ;
- aucun zombie fluorescent ni mutation spectaculaire incohérente ;
- musique discrète, sons mécaniques et sirènes procédurales.
