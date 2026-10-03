# Déplacement et visée — 1.29

L’atlas `commander-rig129.png` apporte quatre pièces de torse (fusil, pistolet, recul du fusil et recul du pistolet) et quatre phases de jambes avec leur bassin. Ces pièces originales générées par OpenAI sont livrées sans modification des pixels. Les découpes et pivots sont mesurés dans `assets/commander-rig129.json` ; il ne s’agit pas d’une coupe des membres de l’ancien personnage.

Debout, les jambes sont peintes sous le torse autour d’un pivot commun à la ceinture. Une correction fixe d’angle et d’échelle compense la perspective peu plongeante de l’image source. Le recouvrement du torse masque l’ouverture supérieure du bassin. L’image reste un sprite en perspective, pas un squelette 3D avec des vues arrière dessinées séparément.

La marche suit la distance réellement parcourue. Reculer inverse le cycle sans retourner le torse avec les pieds. Un pas latéral peut tourner le bassin jusqu’à 65 degrés par rapport aux épaules. Au repos, les jambes restent ancrées tant que la visée ne dépasse pas 50 degrés, puis le corps pivote. Les angles sont interpolés sur les pas de simulation ; un demi-tour du curseur entraîne une courte transition visuelle. Les tirs gardent immédiatement leur direction de gameplay, qui n’est pas modifiée par cette présentation.

Le recul d’arme n’utilise sa pièce dédiée que pendant les 80 premières millisecondes du vrai délai de tir. Le pistolet utilise ses propres bras ; le fusil à pompe partage la silhouette d’arme longue. La course emploie les mêmes quatre appuis accélérés selon le déplacement, pas une cinquième animation de jambes annoncée.

Les postures accroupie et allongée, le rechargement, le travail et la représentation du personnage à terre gardent leurs atlas historiques complets. La pause suspend le cycle des appuis, le mouvement réduit choisit une phase fixe, et les téléportations / changements de scène réinitialisent le suivi. Aucun état visuel n’est écrit dans le joueur ni sauvegardé. Si le nouveau rig ne charge pas, le rendu historique reste disponible.

Le fichier `reports/1.29.0/captures/06-articulation-commandant.png` est une planche produite par le vrai peintre `DeadwallArt.drawActor` sur Canvas natif. Elle compare huit états debout et les quatre actions / postures conservées. Ce n’est pas une capture de navigateur ni une validation interactive de FPS.
