# Passe 160 — contenu posé sur les vrais supports

Cette suite de la PR #2 enrichit visuellement les meubles et les cours déjà générés. Elle ne remplace aucune architecture, aucun sprite 1.57, aucun stock et aucune collision historique.

## Les dix familles de petits objets

Documents et courrier, livres/cahiers, petits outils, linge/coussins, vaisselle, plateaux de soins, flacons, semis/feuillage, appareillage mural éteint, étiquettes de stockage. Deux variantes sobres sont disponibles par famille. Le type de support et le nom réel de la pièce décident de l'apparence : une table de cuisine reçoit de la vaisselle, un établi des outils, une archive des livres.

Chaque élément possède `supportId`, `supportBounds`, un niveau et une identité déterministe. Il doit tenir dans le rectangle du meuble ou du segment de mur effectivement présent. Une ouverture de porte ne devient pas un support mural. Les prises et interrupteurs ne simulent pas une alimentation électrique : ils sont explicitement éteints.

Le rendu reprend la rotation du bâtiment. La profondeur est dérivée du support, avec un décalage minuscule, pour que les petits objets soient dessinés après le meuble plutôt que cachés dessous. Les marques murales sont omises lorsque leur bâtiment est détruit. Chaque peintre se découpe dans son propre rectangle, lui-même compris dans l'emprise du support.

## Contrat de sauvegarde et de simulation

Ces ajouts sont uniquement visuels (`solid:false`). Ils n'ont ni `resource` ni `amount` et ne sont pas exposés comme de nouveaux contenants. Aucune modification des coordonnées, dimensions, plans, routes, identités ou montants des objets sources. Aucun RNG de simulation consommé. Recharger une sauvegarde ou évincer le cache ne relance pas la composition.

Maximum : 90 petits ensembles sur meubles/cours, plus 6 marques murales, par plan. Ce plafond est un budget de rendu, pas une densité imposée. Les anciennes versions de détail 0/1 et l'option physique 2 conservent leurs obstacles respectifs. Un tableau de vrais solides mis en cache par plan évite de parcourir les décorations dans les boucles de collision, de ligne de vue et de véhicule.

## Recherche du codex

L'index recherche désormais les noms du mobilier auteur et les inventaires des kits, pas uniquement les noms de pièces. Exemples : `réfrigérateur`, `serre-joints`. Les termes sont compilés une seule fois par parent et réutilisés par ses compositions. Les programmes restent séparés du contenu actuellement jouable, et la pagination demeure à 36 fiches.

## Distribution

`src/codex-dressing160.js` est incorporé au bundle généré par `compile-codex3000.mjs`, avant les recettes et les données. Il n'exige pas un nouveau téléchargement public indépendant. Le bundle n'est pas suivi dans Git : `prestart`, `pretest` et `build` le reconstruisent. Le test de fabrication sans `node_modules` reçoit explicitement cette nouvelle source. Le cache PWA change de version sans changer la liste des fichiers publics.

## Vérifications reproductibles

- `node --test tests/codex-dressing160.test.cjs` : six tests, dont le parcours des 3 000 recettes et de leurs 3 606 plans d'étage. Le corpus seed42 produit 39 327 placements de petits ensembles, sans nouveaux colliders ni stocks. Ce n'est pas 39 327 sprites ou architectures indépendants.
- Contrôles d'immuabilité, d'idempotence, de supports, de niveaux, de profondeur sous cinq rotations et de pixels hors rectangle ; recherche du mobilier et séparation des projets.
- `node scripts/browser-dressing160.mjs` : recherche par les vrais contrôles de l'Atlas, lecture sans changement de sauvegarde, puis rendu complet d'une villa préparée seed17117. Parcours réussis en Chromium/Linux, 1440×900 et 390×844, aucune erreur JavaScript de page. La villa témoin a 24 petits ensembles de sept familles, tous supportés et ordonnés en profondeur.
- `node scripts/browser-recipes159.mjs` : les deux formats existants ont été rejoués avec succès pendant cette passe.

Les résultats détaillés du lot final et de la CI sont consignés dans la PR. Les captures produites automatiquement ne sont pas présentées comme une revue artistique manuelle ni comme une acquisition naturelle en campagne.

## Limites non masquées

Les géométries G8 simplifiées et les besoins de véritables architectures spécialisées demeurent. Pas de nouveaux ports, tunnels, ponts dénivelés ou commerces entièrement reconstruits dans cette passe. Les objets cosmétiques ne deviennent pas manipulables ou récupérables. Le dernier échec Windows de la PR n'est pas déclaré corrigé par une validation Chromium/Linux. La PR reste en brouillon tant que les validations générales et Windows ne sont pas acquises.
