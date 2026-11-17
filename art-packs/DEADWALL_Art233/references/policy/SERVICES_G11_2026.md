# Usages du mobilier des haltes G11

Les quatre familles résidentielles ajoutées en 1.72 possèdent déjà une implantation de campagne, une géométrie physique, du mobilier, du butin fini et les opérations d’entrée existantes. Le présent lot raccorde certains équipements à des usages payés sur place. L’inspection des 4 000 plans auteur, l’éligibilité des 200 modèles résidentiels, les implantations observées et la réception des services restent des étapes distinctes.

## Supports et usages

| Action | Mobilier existant | Présence dans les modèles | Propriétaire et paiement |
|---|---|---|---|
| Repas chaud | Four | Quatre familles | Survie : 8 s, 4 nourriture + 1 bois + 1 carburant apportés ; effet temporaire historique |
| Relève abritée | Couchette | Quatre familles | Survie : 20 s, 6 nourriture + 1 médicament ; au plus 30 PV utiles |
| Entretien portable | Établi ou caisse à outils | Établis dans 150 modèles ; outillage dans les quatre familles | Survie et éclairage : 8 s, 4 carburants + 2 ferrailles ; vraie lanterne éteinte, capacité conservée |
| Soins au poste | Équipement médical | 50 modèles des camps de travailleurs T047 | Opérations contextuelles : 10 s, 1 médicament ; au plus 20 PV utiles |

Le local d’entretien T045 conserve son mobilier historique : son outillage permet l’entretien portable, sans création d’un établi ou accès à l’armurerie de D-17. Les fournitures viennent du sac. Les vérifications relisent le support exact, la découverte, l’étage, l’abri si requis, les obstacles, la portée, les menaces et les mains du commandant avant le paiement final unique.

## Géométrie et sauvegarde

Le golden est calculé depuis une copie isolée du commit 1.72 publié `8780075f305e405e5aa94e593a70d11391b16e20`. Il couvre les 200 modèles et trois graines G11 distinctes, avec plans, détails, meubles, identifiants et stocks. Le lot conserve les routes, les parcelles et leurs budgets finis.

L’audit distingue les poses canoniques des 200 modèles isolés et les témoins dans les trois régions réellement générées. Il ne transforme pas un modèle en instance placée, ni une pose accessible en trajet complet ou transaction payée. Chaque refus reste explicite dans les rapports. Les tests de transaction et les parcours navigateur sont reçus séparément.

Les effets achevés restent dans les registres de survie et d’éclairage existants. Les travaux inachevés sont transitoires : déplacement, blessure, combat, manipulation incompatible ou support perdu interrompent l’opération. Pause et modale suspendent l’avancement. Save/Menu/Continue ne reprend pas une intervention inachevée et n’attribue pas de fourniture à l’import.

<a id="presentation-preparee"></a>
## Présentation préparée

Les pièces mobiles du four, de la couchette, de l’outillage et du meuble médical lisent l’action et l’avancement du propriétaire. Le commandant utilise ses gestes existants ; ses postures restent prioritaires. Le rendu conserve les dimensions physiques et les apparences historiques au repos, sans créer d’occupant, d’éclairage de simulation ou de quantité d’inventaire.

Les témoins artistiques préparés concernent quatre modèles V01 et treize supports. Les images au repos sont comparées à la version publiée. Ces échantillons ne constituent pas une inspection visuelle exhaustive de chaque variante des 200 modèles.

## Preuves et suivi

Les rapports source liés à cette couche sont `campagne208-services.json` et `campagne208-art.json`. Le producteur de services distingue modèles, supports proposés, poses valides, refus, témoins de monde et transactions. Le rapport artistique conserve son échantillon réel. Le validateur refuse un rapport incomplet, modifié ou lié à d’anciennes sources ; l’absence d’une preuve n’accorde aucun avancement.

Les étapes globales du classeur conservent leurs conditions de réception. Cette couche ne déclare pas les 4 000 plans entièrement jouables et ne clôture pas les autres services, rencontres ou familles encore à produire. La CI du commit final, les parcours Chromium sur ordinateur et en format tactile, les formules du classeur et la publication Vercel sont des réceptions distinctes. Aucune campagne humaine complète de 6 à 10 heures ni performance de téléphone physique n’est déduite de ces contrôles.
