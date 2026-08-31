# Équilibrage de référence

## Ressources initiales — Standard

| Bois | Ferraille | Pierre | Nourriture | Carburant | Munitions | Médicaments |
|---:|---:|---:|---:|---:|---:|---:|
| 180 | 120 | 70 | 130 | 45 | 180 | 12 |

Le mode Survivant ajoute 50 bois, 35 ferraille, 50 nourriture et 50 munitions. Le mode Brutal conserve la réserve initiale, mais réduit le rendement de collecte et renforce les attaques.

## Formule des vagues

```text
base = 10 + vague × 5 + vague^1,62 × 2,35
attraction = 1 + clamp(signature / 360, 0, 0,8)
total = max(8, floor(base × multiplicateur_difficulté × attraction))
```

Le nombre de fronts augmente d'un tous les trois niveaux et atteint quatre fronts. L'intervalle vaut `clamp(0,52 − vague × 0,012 ; 0,07 ; 0,52)` seconde. Le plafond simultané est de **720 infectés** ; les autres contacts restent dans huit compteurs et un tampon de 64 apparitions maximum.

Les profils apparaissent aux vagues : Errant 1, Infecté récent 2, Briseur 3, Protégé 4, Rampant 5, Traqueur 6, Hurleur 7 et Engorgé 8. Les poids exacts sont dans `ENEMY_RULES.waveWeights` ; les profils spéciaux partagent au plus 82 % du total, puis les arrondis laissent le solde aux Errants. Les nouveaux profils ne gonflent pas le nombre total d'une vague.

La santé suit `santé_base × difficulté.enemyHealth × (1 + clamp(log2(max(1, vague)) × 0,055 ; 0 ; 0,34))` : hausse liée aux vagues plafonnée à 34 %, sans boss à santé infinie.

Le premier calme dure `82 × difficulté.calmTime` secondes. Après une vague, le calme vaut `max(38, 84 − prochaine_vague × 1,15) × difficulté.calmTime`. L'alerte dure 10 secondes, ou 15 avec reconnaissance ; la sécurisation dure 8 secondes.

## Difficultés

| Mode | Nombre | Santé | Dégâts | Rendement | Temps calme |
|---|---:|---:|---:|---:|---:|
| Survivant | 0,72 | 0,85 | 0,75 | 1,30 | 1,20 |
| Standard | 1,00 | 1,00 | 1,00 | 1,00 | 1,00 |
| Brutal | 1,35 | 1,15 | 1,30 | 0,85 | 0,82 |

## Signature

```text
signature = score_bâtiments
          + population × 2
          + consommation_électrique × 2
          + nombre_de_structures × 0,35
```

La signature influe uniquement sur la quantité des contacts ; elle ne renforce pas artificiellement chaque ennemi.

## Paliers

| Palier | Score requis |
|---|---:|
| Refuge | 0 |
| Camp fortifié | 10 |
| Avant-poste | 24 |
| Forteresse | 48 |
| Cité | 85 |
| Citadelle | 135 |
| Mégacité | 210 |

Les segments de mur rapportent un faible score afin qu’une enceinte aide à progresser sans permettre de débloquer toute la technologie en construisant uniquement des palissades.

## Énergie

```text
ratio = production / demande, borné entre 0 et 1
```

Ce ratio décrit le réseau global, pas le rendement uniforme de tous les bâtiments. La distribution réelle sert d'abord les défenses, puis la clinique, les industries et les autres consommateurs ; la priorité choisie départage les bâtiments d'une même catégorie. Les défenses ont besoin de leur allocation complète pour tirer. Une industrie incomplètement alimentée utilise `part_reçue × 0,35`, ou `× 0,7` avec Réseau prioritaire ; elle ne produit pas si ce facteur est inférieur ou égal à 0,05. À pleine allocation, son facteur est 1.

Le centre fournit 8 unités d'énergie ; chaque générateur ajoute 24 tant qu'il reste du carburant. Un générateur consomme 0,018 carburant/seconde, ou 0,0135 avec Réseau prioritaire. Un délestage choisi lors de Noir électrique réduit encore de moitié la production des industries électriques pendant sa durée.

Le stockage est un plafond par ressource : 500 au centre, +600 par entrepôt terminé. Une industrie dont la sortie est saturée ne consomme pas ses intrants ; à capacité partielle, production et consommation diminuent dans la même proportion. Les ouvriers conservent la cargaison non déposée. Les fermes produisent 0,42 nourriture/seconde à plein rendement ; les autres débits restent centralisés dans `BUILDINGS`.

## Population et nourriture

```text
consommation = population × 0,0065 nourriture / seconde
```

La population comprend le commandant et les unités vivantes. À nourriture au plus 0,01, le moral perd 0,7 point/seconde ; sinon il regagne 0,08 point/seconde, dans [0 ; 100]. Sous 20 % de moral, la vitesse des unités tombe à 82 %.

Les recrutements consomment une place de logement et les coûts de `SURVIVORS` : ouvrier 25 nourriture ; fusilier 15 nourriture, 20 munitions, 10 ferraille (caserne, palier 1) ; secouriste 35 nourriture, 8 médicaments (clinique, palier 2) ; ingénieur 35 nourriture, 35 ferraille (atelier, palier 2). Les soins et réparations des spécialistes consomment ensuite les stocks, à l'inverse d'un bonus gratuit permanent.

## Pression des corps

- mort normale près d’un mur : +1 ;
- infecté protégé : +2,2 ;
- Engorgé : +3,4 ;
- avec Brigades sanitaires : +0,65 pour chaque profil ;
- érosion passive de 0,012 unité/seconde ; un ouvrier au contact déblaye 0,9 unité/seconde ;
- franchissement quand la charge est strictement supérieure à `15 + (id_infecté % 18)`, soit un seuil de 15 à 32 ;
- seuls les infectés récents et rampants exploitent les rampes.

Les 48 décors de quartiers ajoutent de petites réserves éloignées du centre ; leurs valeurs sont dans `SCENERY_DEFS`. Le plafond observé de 6,72 % des réserves historiques provient d'un échantillon de 133 graines, pas d'une preuve exhaustive. Voir [WORLD_CONTENT.md](WORLD_CONTENT.md).

Les six doctrines s'achètent instantanément une seule fois, contre ressources et points d'analyse, sans branche exclusive. Les points gagnés à la fin d'une vague valent 1, plus 1 aux multiples de cinq. Les quatre crises utilisent les coûts et effets explicites de `CRISIS_CHOICES` ; leur décision expire après 45 secondes sur le choix B sans dépense préalable. Voir [AUDIT_COMMERCIAL.md](AUDIT_COMMERCIAL.md).

## Philosophie de réglage

Les six opérations narratives facultatives donnent chacune soit 1 insight contre un coût sectoriel, soit au plus 4 moral contre 8 nourriture et la présence d’un équipier vivant. Un relevé demande 8 secondes actives à moins de 90 unités du centre du secteur ; une décision demande le retour accessible à moins de 180 unités du dépôt. Chaque choix est unique et ne crée aucune ressource. Les règles exactes sont centralisées dans `NARRATIVE_RULES` / `NARRATIVE_OPERATIONS` ; la borne technique d’insight est `RESEARCH_INSIGHT_MAX`. Voir [NARRATIVE.md](NARRATIVE.md).

- rendre chaque nouvelle enceinte utile sans la rendre absolue ;
- augmenter surtout le nombre, les fronts et la durée ;
- conserver des ennemis lisibles et vulnérables ;
- créer des choix entre croissance, énergie, munitions et signature ;
- empêcher les blocages définitifs grâce à une production minimale et aux récompenses de vague ;
- garder un début actif, puis déplacer progressivement l’attention vers le commandement.
