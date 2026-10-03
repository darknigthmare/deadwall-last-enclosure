# Sprites des opérations — 1.27

`assets/operations-atlas.png` est un atlas original généré avec l’outil intégré OpenAI imagegen. Le PNG RGBA de 1536 × 1024 est copié sans modification des pixels. Le prompt complet, les rectangles, ancrages et SHA-256 sont conservés dans `assets/operations-atlas.json`.

Huit silhouettes accompagnent les objets physiques des extensions : cache de provisions, ballot arrimé, piquet de retour, couchage, bâche tendue, coffre de munitions, trousse de soutien et blessé sur brancard. La palette terre/olive/acier, l’usure des matières et la vue depuis le dessus reprennent la direction artistique existante. Ces sprites ne créent ni collisions ni nouvelles ressources.

`src/operations-art.js` installe `g.operationsArt`. Son appel `draw(ctx, type, x, y, size)` renvoie vrai uniquement si la texture est disponible ; le peintre géométrique existant reste le secours. `size` correspond à la plus grande dimension, avec ratio conservé. `x/y` est le point d’ancrage au sol : pied du piquet, bas des volumes et centre d’emprise des couchages. Le contexte conserve ses transformations, son alpha et son découpage. Le rendu régional utilise le mètre, D-17 utilise 32 unités par mètre.

Les rectangles utilisent les gouttières transparentes mesurées, pas une grille théorique. La corde de la bâche dépasse sa première colonne nominale ; sa découpe complète évite de couper la corde ou de la faire apparaître près du coffre voisin. Aucun nouveau chargement d’image, calcul de pixels, canvas temporaire ou état de simulation n’est produit pendant une frame.

Vérification dédiée : `node --test tests/operations-art.test.cjs`. Elle contrôle le format, l’empreinte, les huit découpes non superposées, la conservation des proportions entre région et D-17, les paramètres invalides, le secours sans image, l’idempotence et le respect de l’alpha. Les captures de jeu emploient les peintres Canvas réels ; elles ne valent pas un test de fluidité dans un navigateur natif.
