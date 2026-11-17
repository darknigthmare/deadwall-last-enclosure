# DEADWALL — Art228 : commerces, services, motel et mine

Ce pack conserve **sept sprites extérieurs dédiés**, issus de l’atlas réel et des fiches natives du Codex, avec **1 sortie(s) intermédiaire(s)** et leurs prompts exacts.

## Contenu documenté

| Fiche | Bâtiment | Emprise bâtie du pilote | Niveaux du pilote | Parcelles auteur proposées |
|---|---|---:|---|---|
| DW-0041 | Centre commercial régional | 82 × 56 m | 0, 1 | 25 × 20 à 180 × 120 m |
| DW-0061 | Supérette de quartier | 19 × 15 m | 0 | 18 × 14 à 90 × 60 m |
| DW-0062 | Supermarché avec quai | 42 × 30 m | 0 | 18 × 14 à 90 × 60 m |
| DW-0498 | Motel gagné par la forêt | 44 × 19 m | 0, 1 | 20 × 16 à 180 × 120 m |
| DW-0181 | Caserne de pompiers | 36 × 28 m | 0, 1 | 24 × 18 à 85 × 65 m |
| DW-0126 | Cabinet dentaire | 25 × 20 m | 0 | 20 × 16 à 150 × 100 m |
| DW-0401 | Mine à galerie | 32 × 25 m | -1, 0 | 75 × 45 à 800 × 500 m |

Les emprises des pilotes décrivent les bâtiments présents dans le moteur. Les plages de parcelles auteur décrivent d’autres propositions. Le sprite de mine représente la halle de surface du pilote de 32 × 25 m : son sous-sol −1 reste caché, sans portail inventé dans une falaise. La caserne native DW-0181 possède deux niveaux et demeure distincte de la variante DW-0528 d’Art222. Le quai mentionné par le titre du supermarché ne justifie pas l’ajout d’une plateforme absente du plan natif. `references/SOURCE_MAP.json` conserve les distinctions et les pièces natives.

## Fichiers et références

- `assets/art228/regional/` : sept PNG retenus, copiés dans leurs octets natifs.
- `references/iterations/` : générations remplacées, si présentes.
- `references/` : quatorze références, sélection initiale, mapping et empreintes.
- `generation-prompts.json`, `generation-history.json`, `records/` : prompts exacts, relations d’entrée et sorties natives.
- `PROVENANCE.json`, `REPRISE.json` : périmètre, limites et point de reprise.
- `qa/` : mesures PNG/alpha et revue visuelle liée aux empreintes finales.
- `SHA256SUMS.txt` : empreintes de tous les autres fichiers du pack.

Les sources principales proviennent de `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Le module de classification `remarkable217.js` provient de la révision distincte précisée dans `references/sources.json`. Les références sont comparées à la base de publication `f3ba02a5b73a55120c02c21d5703902ea3e901d9` ; aucune de ces révisions n’est présentée comme le commit de livraison du pack.

## Vérification et fidélité

Signatures PNG, décodage, dimensions, RGBA, alpha, marges visibles et empreintes sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Les couleurs RGB cachées sous alpha zéro ne constituent pas un fond opaque ; les pixels de très faible alpha sont recensés séparément.

Les programmes, niveaux et proportions demandés suivent les pilotes et l’atlas. **La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée.** Les façades sont des propositions artistiques fondées sur les usages, sans photographie canonique fournie. Ancres, mètres par pixel, portes, collisions, intérieurs et profondeur restent à calibrer dans le moteur.

## État d’intégration

**Pack de préparation artistique : intégration au moteur non effectuée.** Ces lieux possèdent déjà des plans, props, intérieurs et toitures génériques. Les PNG apportent des extérieurs dédiés ; ils ne créent pas sept nouveaux lieux jouables.

Le pack ne modifie aucune source de jeu, règle de génération, sauvegarde, dépendance, test ni liste publique. Les contrôles d’images ne valent pas validation du jeu. Les résultats de `npm run check`, de CI, du navigateur et de Windows doivent être rapportés sur le commit réellement contrôlé dans la PR.

## Reprise et intégrité

Lire `REPRISE.json`, puis `PROVENANCE.json` avant de poursuivre. Le rapport `references/art221-bounded-evidence.json`, lorsqu’il est fourni, consigne la recherche bornée de l’historique Art221 : une catégorie du moteur ne prouve pas qu’une image précise a été produite. Pour vérifier les fichiers livrés depuis la racine de ce dossier :

```sh
sha256sum -c SHA256SUMS.txt
```

L’assemblage est réalisé par un outil local à arguments explicites ; les entrées et son empreinte sont consignées dans `records/assembly-inputs.json`. Il n’effectue aucune génération ni retouche. Les PNG et références nécessaires à la revue sont tous présents dans ce pack.

## Continuité des publications

- Art222 : [PR #27](https://github.com/darknigthmare/deadwall-last-enclosure/pull/27), tête `f76b216a9b98c1d4ebd5a6c53dc1fc07142c9114`, 8 sprites finaux et 2 sorties remplacées conservées.
- Art223 : [PR #28](https://github.com/darknigthmare/deadwall-last-enclosure/pull/28), tête `e16e501e3ad18ea5f1088ffd4ba8cbab38f0e149`, 6 sprites finaux et 9 sorties remplacées conservées.
- Art224 : [PR #29](https://github.com/darknigthmare/deadwall-last-enclosure/pull/29), tête `384f6ebaa5c573dfdedf5621a85f2a36be95b046`, 6 sprites finaux et 1 sorties remplacées conservées.
- Art225 : [PR #30](https://github.com/darknigthmare/deadwall-last-enclosure/pull/30), tête `bb14d13aae1619e79fab6b5c4b8d2329aff1c2c6`, 6 sprites finaux et 1 sorties remplacées conservées.
- Art226 : [PR #30](https://github.com/darknigthmare/deadwall-last-enclosure/pull/30), tête `bb14d13aae1619e79fab6b5c4b8d2329aff1c2c6`, 6 sprites finaux et 6 sorties remplacées conservées.

Les PR référencées conservent **32 sprites finaux**. Art228 apporte sept sprites supplémentaires, avec 1 sortie(s) remplacée(s) propre(s) à ce lot. Le lot compagnon Art227 est suivi séparément dans son propre manifeste. Ces nombres décrivent la production artistique ; ils ne signifient pas que ces images sont chargées ou intégrées au rendu du jeu.
