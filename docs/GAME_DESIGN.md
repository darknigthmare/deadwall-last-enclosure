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
- recruter ouvriers, fusiliers et spécialistes accessibles au palier atteint ;
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

Le joueur collecte personnellement dans un sac limité. Les ouvriers créent ensuite une boucle collecte → transport → stockage, conservent tout reliquat si le dépôt est plein et évitent les ressources saturées. Les industries produisent dans la limite du stockage sans gaspiller leurs intrants. Le plafond de stockage s'applique séparément à chaque ressource.

La carte ajoute six sites abandonnés, 48 vestiges et seize silhouettes de ruines, véhicules et équipements. Ces éléments sont des ressources récupérables passables, pas des bâtiments à occuper, un couvert physique ou des véhicules pilotables. Les ambulances offrent notamment quelques médicaments.

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

Le poste de commandement met la simulation en pause pour préparer les ordres. Les portes proposent automatique (alliés uniquement), ouverte (tous) et verrouillée (personne) ; une fermeture occupée est refusée. Un diagnostic topologique distingue un périmètre effectivement fermé d'un simple nombre de murs, sans inventer un compteur d'enceintes complètes.

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

### Briseur

Ancien ouvrier en veste ocre, lent. Inflige 80 % de dégâts supplémentaires aux structures au contact, sans bonus contre les survivants. Apparaît à partir de la vague 3.

### Traqueur

Infecté mobile qui dévie vers un survivant proche, isolé et visible. Les groupes et les enceintes fermées contrent cette chasse ; il ne traverse pas les murs. Apparaît à partir de la vague 6.

### Engorgé

Infecté massif et très lent dont la dépouille augmente davantage la pression des corps. Aucune explosion, capacité surnaturelle ou santé de boss. Apparaît à partir de la vague 8.

## 8. Navigation des hordes

Le monde utilise un champ de flux calculé depuis le centre de commandement. Chaque cellule reçoit un coût :

- terrain libre : faible ;
- porte ouverte : passage libre ; porte automatique ou verrouillée : accès à détruire ;
- palissade : élevé ;
- acier : très élevé ;
- béton : extrêmement élevé ;
- bâtiment : coût important mais traversable après destruction.

Les hordes suivent les accès les moins coûteux selon ce modèle, qui équilibre détour et destruction des structures. Ce n'est pas une garantie de chemin optimal continu dans toutes les configurations. Les alliés utilisent leurs propres routes cardinales et respectent les modes de portes.

## 9. Pression des cadavres

Un infecté tué près d'un rempart augmente sa charge de corps. Une faible érosion passive la réduit avec le temps. L'ordre Déblaiement affecte des ouvriers à la face extérieure accessible du mur : ils doivent réellement s'y rendre et interrompent la collecte pendant ce travail. Seuls les Infectés récents et Rampants utilisent une accumulation suffisante comme rampe.

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

Les secouristes rejoignent les blessés vivants et dépensent des médicaments ; les ingénieurs rejoignent les structures endommagées et dépensent les matériaux de réparation. Leur recrutement exige clinique ou atelier au palier Avant-poste. Les quatre rôles occupent un logement et consomment des rations ; les spécialistes ne ressuscitent pas une unité ou un bâtiment détruit.

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

Ce tableau décrit les usages visés, pas des conditions exclusives : plusieurs enceintes sont constructibles avant Citadelle. Huit objectifs introduisent les systèmes ; six doctrines apportent des bonus déterminés et achetables une seule fois. Quatre crises présentent deux décisions avec coûts, effets et délai sauvegardés.

## 13. Conditions de réussite et d’échec

Il n’existe pas de victoire finale obligatoire dans le mode infini. Les objectifs sont :

- franchir les paliers ;
- survivre davantage ;
- bâtir plusieurs enceintes ;
- augmenter la population sans effondrer la logistique ;
- battre ses records de vagues, de population et d’échelle urbaine.

La défaite est la destruction du centre de commandement.

Le registre de D-17 ajoute un arc facultatif : six traces relevées sur place, une décision au dépôt par secteur et quatre chapitres persistants. Il relie exploration, ressources, recherche et moral sans suspendre le jeu par une scène obligatoire. Son épilogue ne termine pas la simulation. Le sort des auteurs des documents reste inconnu ; ils ne sont pas des PNJ présents. Voir [NARRATIVE.md](NARRATIVE.md).

Les records locaux distinguent vagues réellement survécues, éliminations, durée, pic de population et pic de structures, pour chacune des trois difficultés. Les dix campagnes récentes sont conservées sans transformer chaque sauvegarde en nouvelle partie. Réutiliser une graine recrée la carte ; cela ne garantit pas une simulation compétitive déterministe. Aucun bonus permanent ni classement en ligne n'est attribué.

## 14. Ton et direction artistique

- palette terre, acier, béton, végétation sale et éclairages sodium ;
- silhouettes immédiatement lisibles malgré le nombre ;
- bâtiments assemblés et réparés, jamais futuristes ou impeccables ;
- pluie, nuit, fumée, étincelles, impacts et corps persistants ;
- aucun zombie fluorescent ni mutation spectaculaire incohérente ;
- musique discrète, sons mécaniques et sirènes procédurales.

Le rendu actuel utilise des textures et atlas originaux OpenAI, complétés par des effets et dessins procéduraux de secours. Les dix textures/atlas couvrent terrain, structures, décors, personnages et effets ; les seize cycles de huit poses incluent trois variantes cosmétiques. Leur provenance est conservée dans [GAME_ART_PROVENANCE.md](GAME_ART_PROVENANCE.md) et [CONTENT_ART_PROVENANCE.md](CONTENT_ART_PROVENANCE.md). La livraison et les points commerciaux encore ouverts sont documentés dans [DESKTOP.md](DESKTOP.md) et [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
