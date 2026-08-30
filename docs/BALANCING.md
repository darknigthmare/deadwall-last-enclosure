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
total = floor(base × multiplicateur_difficulté × attraction)
```

Le nombre de fronts augmente d’un tous les trois niveaux et atteint quatre fronts. L’intervalle d’apparition décroît jusqu’à 0,07 seconde, tandis que le nombre simultané reste limité à 650 pour préserver les performances.

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

Les industries et défenses électriques appliquent ce ratio à leur rendement. En dessous de 5 %, elles sont considérées hors tension.

## Population et nourriture

```text
consommation = population × 0,0065 nourriture / seconde
```

À nourriture nulle, le moral chute. Sous 20 % de moral, la vitesse des unités tombe à 82 %.

## Pression des corps

- mort normale près d’un mur : +1 ;
- infecté protégé : +2,2 ;
- réduction lente par le temps et les ouvriers ;
- seuil de franchissement variable : environ 15 à 33 ;
- seuls les infectés récents et rampants exploitent les rampes.

## Philosophie de réglage

- rendre chaque nouvelle enceinte utile sans la rendre absolue ;
- augmenter surtout le nombre, les fronts et la durée ;
- conserver des ennemis lisibles et vulnérables ;
- créer des choix entre croissance, énergie, munitions et signature ;
- empêcher les blocages définitifs grâce à une production minimale et aux récompenses de vague ;
- garder un début actif, puis déplacer progressivement l’attention vers le commandement.
