# Passe 169 — Réunir les deux compléments source sans collision de version

Base inspectée : `f98b3643bdda21592053ea1b8cd1864fe2d1224b`, branche `feat/codex3000-detailed-programmes-159`, PR #2. Source téléchargée et ses 4 214 empreintes SHA-256 vérifiées. Le correctif local168 n'est pas appliqué directement : ses modifications sont intégrées une à une après les changements publiés.

## Implémentation
La révision 6 (`codex-fill168`) reste inchangée et conserve tous ses anciens résultats. La révision 7 y ajoute les silhouettes et placements source `codex-infill169` : bin, locker, cabinet, stretcher, fuel_can, bench, sign. Leurs dimensions et dégagements sont lus dans la source. Les brancards conservent deux faces d'accès ; les autres objets disposent du support réel prévu par cette couche. Ni stocks, ni courant, ni soins ou interaction d'assise gratuits.

Le placement conserve les anciennes structures, fonds de pièce, contenants, tables/assises, faces de service, parkings tournés et voies de retour. Les cours reçoivent au maximum deux enveloppes de placement disjointes, liées aux espaces sources admissibles et à leurs surfaces minimales. Ni toit-jardin, ponton, quai, voie routière ou ferroviaire n'est remplacé par une cour générique.

Les anciennes révisions 0 à 6 ne sont pas activées ou réécrites automatiquement. Au dépôt D-17 : **Monde & relais → COMPLÉTER LES PIÈCES ET LES COURS**, révision7. Le contrôleur de migration existant protège possessions, véhicules, bivouacs, équipements et personnages ; la répétition, les mains occupées et un refus de restauration échouent sans fausse réussite.

Dans l'inspecteur, les contrôles distincts permettent de comparer 5, 6 et 7. Cocher 7 inclut 6 et rend son contrôle inactif, sans supprimer son état précédent. La valeur initiale reste5. Le diagnostic affiche les anciennes demandes, les compléments présents et les refus. Les limites de jardins dans les coques et d'architectures manquantes restent visibles.

## Capacités centralisées
`DeadwallCore.CodexInfill169Rules` : 24 objets par étage,6 par espace,3 par prescription,2 zones extérieures,28 essais par objet. Tout dépassement, dimension invalide ou passage coupé est refusé. Les colliders et le dessin utilisent le même rectangle orienté.

## Vérification reproductible
```
npm ci
npm run build
node --test --test-concurrency=1 tests/codex-infill*.test.cjs tests/codex-fill168.test.cjs tests/codex-coverage*.test.cjs tests/distribution.test.cjs
node scripts/audit-infill169.mjs
node scripts/browser-infill169.mjs
npm run check
```
Les preuves locales et distantes sont recensées dans le compte rendu de livraison, avec leur révision exacte. Une réussite du moteur raster alternatif n'est pas présentée comme celle de la dépendance verrouillée. Le test navigateur de fixture est un DOM isolé avec images du projet, pas une campagne ou une PWA certifiée.

## Limites conservées
Les pièces et niveaux absents, la vraie séparation native jardin/bâtiment, l'ensemble des ouvrages routiers/nautiques, les réseaux et les interactions du mobilier ne sont pas livrés par cette fusion. Aucun compteur d'objets n'est un nombre d'architectures originales. Les programmes hors du modèle restent explicitement hors du modèle.
