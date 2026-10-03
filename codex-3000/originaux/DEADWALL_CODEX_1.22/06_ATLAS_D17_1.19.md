# DEADWALL 1.19 — Atlas vivant
## Contrat de projection et règles pour les prochaines générations

Ce guide accompagne le jeu complet 1.19. Il décrit la représentation de D-17 dans la région, le fonctionnement de la carte et les limites à préserver. Il ne transforme pas les 500 fiches du codex en 500 lieux jouables et n’ajoute pas une génération de terrain.

### 1. Un seul repère géographique

Le moteur historique conserve un domaine de 4 096 × 4 096 unités, subdivisé en 128 × 128 cellules de 32 unités. L’exploration régionale conserve un domaine de 8 192 × 8 192 mètres. La convention déjà utilisée pour le passage entre ces domaines est **32 unités locales pour un mètre régional**. Une cellule de la grille historique représente donc un mètre dans cette projection.

D-17 occupe les coordonnées régionales **[4 032 ; 4 160]** sur les deux axes : une emprise de **128 × 128 mètres**, centrée sur (4 096 ; 4 096). Le centre administratif n’est pas nécessairement au centre exact du terrain : son emplacement provient de la construction réelle. Le personnage local doit être projeté à partir de sa position, pas remplacé par un point fixé arbitrairement au centre.

Conversions :

```text
region.x = 4032 + local.x / 32
region.y = 4032 + local.y / 32
local.x  = (region.x - 4032) × 32
local.y  = (region.y - 4032) × 32
```

**Ne pas confondre emprise physique et symbole cartographique.** Une étiquette ou un pictogramme peut garder une taille lisible en pixels. Une maison, un mur, une route ou une parcelle doit rester dimensionné en unités du monde, puis être transformé par l’échelle de la caméra.

Cette convention conserve la compatibilité du monde existant. Elle n’affirme pas que les modèles historiques du refuge ont tous des dimensions architecturales réalistes. Transformer réellement D-17 en une ville kilométrique demanderait une modification explicite de son domaine de simulation, des passages, de la génération environnante et des sauvegardes. Agrandir uniquement son symbole serait une fausse correction.

### 2. La cité affichée est la cité du joueur

Le modèle cartographique lit les constructions de `game.world.buildings`. Les emprises proviennent des propriétés `left`, `top`, `w`, `h`, de la taille de cellule et de la rotation appliquée par le moteur. Elles ne sont pas déduites du rectangle visible de l’image, qui peut inclure toit, ombre, fumée et débordement décoratif.

Une structure en chantier doit apparaître inachevée. Un bâtiment détruit ne doit pas demeurer dans une copie de carte. Une réimplantation doit déplacer la même structure, avec sa même identité, et une rotation doit échanger ses dimensions si le moteur le prévoit. La santé, la progression, le mode de porte et l’alimentation sont des lectures du bâtiment réel, jamais des valeurs inventées pour remplir l’inspecteur.

La vue régionale proche de D-17 réutilise le dessin local du sol, des ressources restantes, des constructions et des alliés visibles dans l’emprise. Elle ne génère pas une seconde ville. Le rendu est découpé à la frontière du secteur et transformé par le même facteur 1/32. La carte et la minicarte utilisent des représentations simplifiées des mêmes coordonnées.

Les routes centrales historiques ont une largeur graphique de 132 unités, soit 4,125 m projetés. Les raccords visuels vers les voies régionales de 7 m sont des transitions progressives sur les abords. Ce dessin n’élargit pas une porte construite et n’ajoute pas un chemin automatiquement praticable.

### 3. Les quatre jonctions

| Jonction | Point régional de frontière | Point local de retour central |
|---|---|---|
| Est | (4160 ; 4096) | (4036 ; 2048) |
| Ouest | (4032 ; 4096) | (60 ; 2048) |
| Nord | (4096 ; 4032) | (2048 ; 60) |
| Sud | (4096 ; 4160) | (2048 ; 4036) |

La coordonnée tangentielle est conservée : le décalage sur la largeur de la route est converti dans le repère d’arrivée. Les positions de retour et la petite marge extérieure de quatre mètres sont conservées pour éviter les allers-retours immédiats entre domaines. Il reste une transition de domaine ; ce n’est pas une simulation unique sans seuil.

L’état indiqué sur la carte contrôle séparément le point central d’arrivée pour un piéton et pour le break, avec les collisions locales existantes. **Libre au point testé ne signifie pas trajet intégralement sûr.** Un mur, une porte ou un prop peut encore imposer un détour. La traversée réévalue sa propre position et ne se contente pas d’un résultat mis en cache dans le menu.

En 1.19, le centre de la représentation régionale de D-17 n’est plus une croix traversable. Lorsque l’accès local est refusé, le joueur reste dans le petit vestibule de jonction et doit trouver un autre passage. Il ne doit pas pouvoir contourner le transfert en roulant dans une copie non simulée du refuge.

### 4. Une carte manipulable sans effets sur la campagne

L’atlas possède des cadrages Région, D-17 et Joueur, un zoom jusqu’à 256 fois le cadrage régional, un déplacement par glissement et un zoom ancré sous le curseur. Les deux doigts permettent le pincement sur écran tactile. Les flèches déplacent le cadre lorsque le canvas a le focus ; plus et moins zooment ; 1, 2 et 3 rappellent les trois cadrages.

Le mode de mesure place deux points temporaires. La distance est calculée dans le monde, pas dans le nombre de pixels de l’image. C’est une distance à vol d’oiseau, pas une recherche de chemin. La graduation utilise une longueur lisible parmi les pas 1, 2 et 5 multipliés par une puissance de dix. Elle reste dans le cadre, en mètres ou kilomètres selon le zoom.

Le clic inspecte une construction de D-17, une jonction ou une parcelle connue. Choisir un repère reste une action explicite. Il ne suffit pas de cliquer un lieu pour y être transporté. L’inspecteur ne remplace pas l’interface de gestion du bâtiment depuis la cité.

Les calques permettent de masquer la végétation, les routes, la cité, les lieux repérés, les noms, les jonctions, les relais, les alliés/caméra ou l’itinéraire. Le masquage ne supprime aucun objet. Le mode agrandi privilégie la carte tout en restant dans le commandement. Les commandes du carnet et des provisions sont conservées.

Le zoom, le glissement, les mesures et la sélection sont **transitoires**. Ils ne modifient pas la sauvegarde et ne donnent ni découverte ni ressource. Une nouvelle campagne réinitialise ces sélections pour éviter de montrer les références d’un autre monde.

### 5. Représenter le terrain sans inventer de gameplay

Les axes routiers sont issus du réseau existant. Les parcelles connues utilisent leur orientation réelle et, au zoom adéquat, leurs dimensions. Les lieux inconnus ne sont pas ajoutés sous prétexte que l’utilisateur zoome. Les noms d’agglomérations déjà présents sur la carte régionale restent des repères géographiques, pas une découverte automatique de toutes leurs parcelles.

La couche végétale reprend les champs déterministes de densité utilisés par le monde. À distance elle est indicative ; en vue rapprochée elle peut dessiner les arbres et roches du secteur généré. Ne pas ajouter des rivières, reliefs ou ponts décoratifs sur la carte si le terrain jouable ne les contient pas.

La carte ne révèle pas des positions ennemies cachées. Le mode de reconnaissance, le bruit et les règles des nuits noires restent ceux du jeu. La présence d’une ville sur l’atlas ne doit pas devenir un radar illimité.

### 6. Contrat technique

`src/atlas-projection.js` centralise conversions, emprises, jonctions, état de D-17, caméra et graduation. Les constantes sont dans `core.js` sous `AtlasRules`.

`src/atlas-render.js` dessine l’atlas et la projection de la cité. Il doit lire les sources existantes sans créer de construction ni consommer l’aléatoire de combat. Les caches de représentation peuvent varier ; la campagne ne le peut pas.

`src/atlas-view.js` gère les gestes, les calques, l’inspection et les mesures. Il s’intègre à `frontier-ui.js`, sans second carnet ni onglet permanent supplémentaire.

La version de sauvegarde reste **v17**. La 1.19 ne requiert pas de nouveau registre de monde. Les générations régionales 1, 2 et 3 restent identiques. Toute extension future qui modifie les emplacements ou le domaine de construction devra proposer une migration explicite, testée séparément.

### 7. Vérifications à reproduire

Vérifier les conversions aller-retour sur les bords, au centre, sur des coordonnées fractionnaires et sur les quatre axes de transfert. Une mesure d’un côté de D-17 doit rendre 128 m, quel que soit le zoom ou la densité de pixels.

Comparer les emprises avant et après rotation, déplacement, progression de chantier et destruction. Inspecter une structure doit lire son état courant. Les constructions ajoutées par une fixture QA doivent utiliser un emplacement libre avant d’exiger que leurs décors soient identiques après une reprise.

Vérifier le zoom sous le vrai pointeur du navigateur : les coordonnées des événements peuvent être arrondies aux pixels, contrairement aux coordonnées flottantes demandées par le pilote de test. Sur tactile, placer la carte dans la zone effectivement visible avant d’envoyer les gestes.

Comparer ressources, bâtiments, objets prélevés, relais et position avant/après consultation. Ne pas présenter la reconstruction d’un plan de vague ou d’un état graphique transitoire comme une perte de campagne. Ne pas masquer non plus un vrai changement d’emplacement derrière une comparaison partielle.

Tester les jonctions obstruées, la reprise et une nouvelle partie, le focus clavier, la largeur mobile, les assets du HTML autonome et le cache hors ligne. Les tests automatisés préparés ne remplacent pas une longue campagne humaine ; identifier leurs conditions dans chaque rapport.
