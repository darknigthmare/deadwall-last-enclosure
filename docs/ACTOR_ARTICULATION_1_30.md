# Commandant — correction d’anatomie et de marche 1.30

Le rig 1.29 mélangeait deux perspectives. Ses jambes de trois quarts étaient tournées arbitrairement de −60 degrés et réduites à 72 % pour rejoindre le torse. Dès que le bassin tournait, les jambes paraissaient couchées ou sortaient du côté du corps. Les tests de bornes angulaires ne pouvaient pas garantir une anatomie lisible.

`commander-rig130.png` remplace l’atlas actif par huit pièces originales vues strictement du dessus : quatre torses (armes et recul) et quatre étapes des jambes. Les pixels sources ne sont pas modifiés. Chaque pièce tourne autour d’un raccord bassin mesuré ; aucune rotation correctrice ou échelle indépendante des jambes n’est appliquée. La phase neutre est employée à l’arrêt et avec le mouvement réduit. Les coordonnées du joueur et son point de tri de profondeur restent inchangés. La région conserve la conversion 32 unités pour un mètre.

Le torse suit désormais exactement la direction du tir. Le bassin pivote progressivement, avec un rattrapage minimal si un mouvement brusque de souris dépasserait 65 degrés de torsion. Le recul et les pas latéraux restent pilotés par le déplacement effectivement effectué après collision.

Un deuxième défaut concernait le cycle local : le callback de travail appelé dans la mise à jour du joueur remettait l’articulation à zéro. La phase et le bassin reprennent maintenant leur valeur d’avant la mise à jour, même si une interaction interne relève les mouvements. Les quatre étapes de marche fonctionnent donc à D-17 comme en région.

Les animations historiques accroupies, allongées, de rechargement et de travail sont conservées avec leur perspective de trois quarts. Elles ne constituent pas de nouveaux cycles orthographiques. Les anciennes images et leur provenance restent archivées. Aucune règle de déplacement, de tir, de collision ou de sauvegarde n’est modifiée.

Preuves : `reports/1.30.0/captures/motion130-directions.png`, `motion130-scales.png` et `motion130-pixels.json`. La vérification combine les mouvements réels du moteur, la continuité alpha de 640 assemblages et l’inspection visuelle des huit directions. Le test de continuité seul passe aussi avec le rig précédent : il prouve l’absence de morceaux isolés, pas le naturel de l’anatomie. Le rendu est effectué par le moteur Canvas sous DOM simulé ; ce n’est pas une certification de navigateur, de FPS ou de périphérique physique.
