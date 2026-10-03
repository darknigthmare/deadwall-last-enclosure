# DEADWALL 1.51 — Campagne, équilibrage et exploration

La cible de progression en Standard est de 6 à 10 heures jusqu’à Mégaville III. Cette cible ne constitue pas une durée de campagne humaine déjà mesurée. Les âges demandent une croissance utile, de l’exploration physique et de la survie, avec un premier Camp accessible avant la première horde.

Les règles autoritaires de progression sont dans `src/core.js`. Le score physique, le stockage réel, les dépenses, la population et la signature gardent leur sens. Les duplications ont un crédit de développement limité par modèle ; elles continuent de produire, consommer et attirer les ennemis. Les âges réellement qualifiés sont mémorisés dans `urban.progression151`. Les sauvegardes héritées conservent leurs connaissances déjà acquises sans obtenir de bâtiments ni de ressources.

Préparatifs affiche chaque condition acquise ou manquante pour l’âge suivant. Le score de développement compte les trois premiers exemplaires entièrement, les deux suivants à 25 %, puis zéro ; les capacités physiques et la signature continuent à compter. Chaque modèle de mur a une allocation propre de 160 exemplaires pleins, puis 80 à 25 %, pour préserver les enceintes multiples. La diversité compte les modèles hors centre et murs.

Les relevés demandent une reconnaissance de terrain achevée. Un lieu régional compte après au moins 12 unités effectivement récoltées sur ce lieu, toutes ressources confondues ; un marqueur découvert, une note ou un rapport préparé ne suffit pas. Les biomes sont ceux des lieux récoltés. Les campagnes G1–G5 gardent leurs cartes et sont dispensées uniquement du critère de biomes.

| Âge | Développement | Hordes survécues | Population vivante | Modèles distincts | Relevés | Lieux récoltés | Biomes |
|---|---:|---:|---:|---:|---:|---:|---:|
| REFUGE | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| CAMP FORTIFIÉ | 10 | 0 | 1 | 1 | 0 | 0 | 0 |
| AVANT-POSTE | 24 | 2 | 8 | 6 | 1 | 0 | 0 |
| FORTERESSE | 48 | 5 | 14 | 10 | 2 | 1 | 0 |
| VILLE | 85 | 9 | 22 | 14 | 3 | 2 | 0 |
| GRANDE VILLE | 135 | 14 | 34 | 18 | 4 | 4 | 2 |
| MÉTROPOLE | 210 | 21 | 50 | 22 | 5 | 6 | 2 |
| GRANDE MÉTROPOLE | 420 | 30 | 72 | 26 | 6 | 9 | 3 |
| MÉGAVILLE I | 750 | 40 | 100 | 30 | 6 | 12 | 3 |
| MÉGAVILLE II | 1200 | 50 | 140 | 34 | 6 | 16 | 4 |
| MÉGAVILLE III | 1850 | 60 | 190 | 38 | 6 | 20 | 4 |

| Âge | Logements | Stockage par ressource | Ouvriers | Fusiliers | Secouristes/ingénieurs | Électricité |
|---|---:|---:|---:|---:|---:|---:|
| REFUGE | 1 | 100 | 0 | 0 | 0 | 0 |
| CAMP FORTIFIÉ | 8 | 500 | 0 | 0 | 0 | 0 |
| AVANT-POSTE | 14 | 1100 | 3 | 2 | 0 | 24 |
| FORTERESSE | 22 | 1700 | 4 | 3 | 1 | 40 |
| VILLE | 36 | 2300 | 6 | 5 | 2 | 60 |
| GRANDE VILLE | 54 | 2900 | 8 | 7 | 3 | 90 |
| MÉTROPOLE | 76 | 3900 | 12 | 10 | 4 | 120 |
| GRANDE MÉTROPOLE | 110 | 6100 | 16 | 14 | 6 | 170 |
| MÉGAVILLE I | 150 | 8500 | 22 | 20 | 8 | 220 |
| MÉGAVILLE II | 200 | 12000 | 28 | 26 | 10 | 280 |
| MÉGAVILLE III | 240 | 18000 | 36 | 34 | 12 | 360 |

| Âge | Bois/s | Ferraille/s | Pierre/s | Vivres/s | Carburant/s | Munitions/s | Médicaments/s |
|---|---:|---:|---:|---:|---:|---:|---:|
| REFUGE | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CAMP FORTIFIÉ | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| AVANT-POSTE | 0.3 | 0.3 | 0 | 0.3 | 0 | 0 | 0 |
| FORTERESSE | 0.4 | 0.4 | 0.2 | 0.4 | 0.1 | 0 | 0 |
| VILLE | 0.5 | 0.5 | 0.3 | 0.6 | 0.1 | 0.6 | 0 |
| GRANDE VILLE | 0.6 | 0.6 | 0.4 | 0.8 | 0.15 | 0.9 | 0 |
| MÉTROPOLE | 0.9 | 0.9 | 0.6 | 1.1 | 0.2 | 1.2 | 0.05 |
| GRANDE MÉTROPOLE | 1.2 | 1.2 | 0.8 | 1.4 | 0.25 | 1.8 | 0.08 |
| MÉGAVILLE I | 1.5 | 1.5 | 1.1 | 1.8 | 0.35 | 2.6 | 0.11 |
| MÉGAVILLE II | 2 | 2 | 1.7 | 2.3 | 0.45 | 3.6 | 0.15 |
| MÉGAVILLE III | 2.5 | 2.5 | 2.5 | 3 | 0.6 | 5.2 | 0.2 |

Les logements et dépôts comptent leurs capacités lorsqu’ils sont achevés et vivants. Les débits industriels et la génération électrique demandent des installations exploitables et alimentées, avec les intrants disponibles pour trente secondes de fonctionnement. Une batterie momentanément chargée ne remplace pas la génération ; un stockage de sortie plein ne supprime pas la capacité d’une usine. Les régulateurs gardent leurs 25 unités protégées par intrant. Les logements, dépôts et micro-réseaux des annexes achevées comptent selon leurs effets réels, sans attribuer de score ni de modèle supplémentaire à D17. Ces minima de capacités ne garantissent pas à eux seuls les réserves nécessaires à toute une horde : les productions peuvent être développées davantage.

L’audit de catalogue vérifie que chaque seuil peut être obtenu avec le contenu accessible avant le palier, même sans plans optionnels et sans le bonus de murs. Une route arithmétique de 220 fondations et 48 modèles atteint 1 862 points diversifiés, avec logements, stockage, alimentation nocturne et filières nettes positives. Elle coûte 13 715 bois, 21 480 ferraille, 13 015 pierre, 997 carburant, 96 médicaments, 600 munitions et 60 vivres, hors recrutements, défenses et voiries complémentaires, pertes et réparations. Cette preuve vérifie les dépendances et capacités, pas le placement complet, le financement organique ni la survie d’une campagne humaine.

La simulation du directeur à forte attraction et élimination immédiate des contacts atteint 60 hordes en **6,975 h** avec les jours normaux, **3,575 h** avec toutes les fins de jour anticipées. Elle omet déplacements, construction, financement et combat réel. La cible de 6 à 10 heures concerne donc une campagne Standard au rythme normal et reste à confronter à des parties humaines ; elle n’est pas un verrou horaire. Le jeu continue après le 11ᵉ âge.

Les scènes avancées des anciens tests importent explicitement des connaissances héritées : elles contrôlent les transactions et le contenu, sans mesurer une campagne 1.51. Les nouveaux tests contrôlent les conditions de campagne.

Les correctifs préservent les générations G1–G7 et leurs cartes sauvegardées : la sortie régionale vérifie le passage physique, et la recherche d’un point de travail essaie des candidats supplémentaires uniquement lorsque les candidats précédents échouent. Une horde saturée garde ses contacts en attente sans accumuler une dette d’apparitions. Les travaux payés gardent leur priorité devant une formation suspendue. La défaite arrête les systèmes du frame courant, y compris les incendies. Les installations explosives détruites par de vrais dégâts déclenchent correctement leur explosion une seule fois. La conduite locale respecte la marge historique de sauvegarde au bord du monde, tout en conservant la collision propre à chaque véhicule et un passage régional dégagé. Les équipements anciens déjà payés restent sauvegardables après leur migration ; les achats futurs suivent l’âge qualifié.

```sh
npm start
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:balance
npm run package:web
npm run package:source
```

Le jeu solo ne demande pas de secret. La publication sur le projet Vercel existant peut utiliser l’intégration Git après un push non forcé. La validation de production compare les fichiers publics à la livraison exacte, séparément du succès du push.

Les appareils physiques, Windows natif, la publication en boutique et une campagne humaine complète nécessitent leurs essais propres. L’ouverture directe du HTML autonome peut être interdite par le Chromium administré ; le transport HTTP ne certifie pas `file://`.
