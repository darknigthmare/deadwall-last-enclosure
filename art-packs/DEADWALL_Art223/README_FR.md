# DEADWALL — Art223 : services civils

Ce pack réunit **six sprites extérieurs dédiés**, préparés depuis les fiches du Codex et l’atlas réel de DEADWALL. Les trois erreurs d’accès sur toiture ont été corrigées, puis les six projections ont été rapprochées de la caméra haute de l’atlas. Les **neuf PNG intermédiaires** restent conservés avec les prompts exacts.

## Contenu

| Fiche | Bâtiment | Emprise bâtie du pilote | Niveaux du pilote | Parcelles proposées par la fiche auteur |
|---|---|---:|---|---|
| DW-0065 | Boulangerie artisanale | 22 × 17 m | 0 | 18 × 14 à 90 × 60 m |
| DW-0153 | Bibliothèque municipale | 32 × 24 m | 0, 1 | 28 × 20 à 160 × 110 m |
| DW-0085 | Laverie automatique | 21 × 15 m | 0 | 12 × 10 à 40 × 26 m |
| DW-0082 | Bureau postal | 28 × 22 m | 0 | 12 × 10 à 40 × 26 m |
| DW-0444 | Gymnase municipal | 38 × 28 m | 0 | 40 × 28 à 300 × 200 m |
| DW-0224 | Garde-meubles | 36 × 26 m | 0 | 35 × 24 à 200 × 125 m |

Les emprises des pilotes et les plages de parcelles auteur décrivent des objets différents. Les plages auteur ne servent pas à agrandir ou remplacer implicitement les pilotes. Le mapping détaillé est dans `references/SOURCE_MAP.json`.

## Références et fichiers

- `assets/art223/regional/` : six PNG retenus, dans leurs dimensions et octets natifs.
- `references/iterations/` : six premières générations et trois corrections d’accès.
- `references/` : six fiches, atlas, instantanés des mappings et index avec empreintes SHA-256 et Git.
- `generation-history.json`, `generation-prompts.json`, `records/` : historique et prompts exacts.
- `PROVENANCE.json`, `REPRISE.json` : périmètre, limites et suite du chantier.
- `qa/image-audit.json`, `qa/visual-review.md` : contrôles techniques et observations visuelles.
- `SHA256SUMS.txt` : intégrité de tous les autres fichiers du pack.

Les références proviennent de `c9e60c28d8a4b831b94f64c64c766eb724a90d25`. Leur identité est comparée à la base de publication `f3ba02a5b73a55120c02c21d5703902ea3e901d9` dans `references/sources.json`. Ces deux révisions sont des sources, pas le commit de livraison du pack.

## Vérification réelle

Les signatures PNG, le décodage, les dimensions, le mode RGBA, le canal alpha, les marges visibles et les empreintes des six sorties finales sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Quelques pixels de très faible alpha peuvent subsister hors silhouette ; l’audit conserve plusieurs seuils et ne confond pas ces pixels avec une emprise physique.

Les corrections de caméra améliorent la cohérence de projection. **La fidélité métrique ou pixel pour pixel n’est pas certifiée.** Les ancres, dimensions dans le moteur, accès, collisions, ouverture des intérieurs et tri de profondeur restent à valider lors du raccord au jeu.

## Statut d’intégration

**Pack de préparation artistique : intégration au moteur non effectuée.** Le jeu possède déjà des plans, intérieurs, props et toitures génériques pour ces types. Ce lot apporte des extérieurs complets dédiés ; il ne prétend pas créer six nouveaux lieux jouables.

Les sources de jeu, les tests, le chargeur et le manifeste public ne sont pas modifiés. Le contrôle global antérieur est **interrompu, sans réussite finale**. Aucun résultat ancien ou contrôle d’image ne vaut validation de la suite complète, du navigateur, de Windows ou de la jouabilité.

## Reproduire le pack

L’assembleur est conservé dans `tools/assemble_art223.py`. Il utilise Python et Pillow, les fichiers sources et records exacts listés dans `records/assembly-inputs.json`, et une copie propre du dépôt à la base déclarée. Il copie les octets natifs sans générer ni retoucher d’image. Les empreintes de sortie sont reproductibles pour ces mêmes entrées et la même date explicite.

```sh
python tools/assemble_art223.py --historical-root /chemin/vers/la/reprise-historique --camera-records /chemin/vers/results.json --camera-prompts /chemin/vers/prompts.json /chemin/vers/next-prompts.json --repo /chemin/vers/deadwall-art223 --output /chemin/vers/deadwall-art223/art-packs/DEADWALL_Art223 --base-revision f3ba02a5b73a55120c02c21d5703902ea3e901d9 --date 2026-11-17
```

Lire `REPRISE.json` avant de continuer la sélection, l’intégration ou la publication.
