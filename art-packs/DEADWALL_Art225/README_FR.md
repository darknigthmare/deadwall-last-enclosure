# DEADWALL — Art225 : commerces, atelier et services urbains

Ce pack conserve **six sprites extérieurs dédiés**, issus de l’atlas réel et des fiches natives du Codex, avec **1 sortie(s) intermédiaire(s)** et leurs prompts exacts.

## Contenu documenté

| Fiche | Bâtiment | Emprise bâtie du pilote | Niveaux du pilote | Parcelles auteur proposées |
|---|---|---:|---|---|
| DW-0053 | Pharmacie commerciale | 24 × 18 m | 0 | 25 × 20 à 180 × 120 m |
| DW-0045 | Magasin de bricolage | 38 × 28 m | 0 | 25 × 20 à 180 × 120 m |
| DW-0069 | Restaurant routier | 25 × 17 m | 0 | 18 × 14 à 90 × 60 m |
| DW-0241 | Garage automobile | 25 × 20 m | 0 | 22 × 18 à 100 × 85 m |
| DW-0142 | École primaire | 38 × 28 m | 0, 1 | 28 × 20 à 160 × 110 m |
| DW-0161 | Mairie | 28 × 20 m | 0, 1 | 25 × 20 à 120 × 80 m |

Les emprises des pilotes décrivent les bâtiments présents dans le moteur. Les plages de parcelles auteur décrivent d’autres propositions. L’école et la mairie ont deux niveaux natifs, sans étage de comble ni tour attestée ; les quatre autres pilotes sont de plain-pied. `references/SOURCE_MAP.json` conserve les distinctions et les pièces natives.

## Fichiers et références

- `assets/art225/regional/` : six PNG retenus, copiés dans leurs octets natifs.
- `references/iterations/` : générations remplacées, si présentes.
- `references/` : treize références, sélection initiale, mapping et empreintes.
- `generation-prompts.json`, `generation-history.json`, `records/` : prompts exacts, relations d’entrée et sorties natives.
- `PROVENANCE.json`, `REPRISE.json` : périmètre, limites et point de reprise.
- `qa/` : mesures PNG/alpha et revue visuelle liée aux empreintes finales.
- `backlog/` : inventaire borné aux 62 presets natifs, sources de contrôle et ambiguïtés de correspondance Codex.
- `tools/assemble_art225.py` : outil autonome d’assemblage, sans génération ni retouche.
- `SHA256SUMS.txt` : empreintes de tous les autres fichiers du pack.

Les sources principales proviennent de `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Le module de classification `remarkable217.js` provient de la révision distincte précisée dans `references/sources.json`. Les références sont comparées à la base de publication `f3ba02a5b73a55120c02c21d5703902ea3e901d9` ; aucune de ces révisions n’est présentée comme le commit de livraison du pack.

## Vérification et fidélité

Signatures PNG, décodage, dimensions, RGBA, alpha, marges visibles et empreintes sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Les couleurs RGB cachées sous alpha zéro ne constituent pas un fond opaque ; les pixels de très faible alpha sont recensés séparément.

Les programmes, niveaux et proportions demandés suivent les pilotes et l’atlas. **La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée.** Les façades sont des propositions artistiques fondées sur les usages, sans photographie canonique fournie. Ancres, mètres par pixel, portes, collisions, intérieurs et profondeur restent à calibrer dans le moteur.

## État d’intégration

**Pack de préparation artistique : intégration au moteur non effectuée.** Ces lieux possèdent déjà des plans, props, intérieurs et toitures génériques. Les PNG apportent des extérieurs dédiés ; ils ne créent pas six nouveaux lieux jouables.

Le pack ne modifie aucune source de jeu, règle de génération, sauvegarde, dépendance, test ni liste publique. Les contrôles d’images ne valent pas validation du jeu. Les résultats de `npm run check`, de CI, du navigateur et de Windows doivent être rapportés sur le commit réellement contrôlé dans la PR.

## Reprise et intégrité

Lire `REPRISE.json`, puis `PROVENANCE.json` avant de poursuivre. Pour vérifier les fichiers livrés depuis la racine de ce dossier :

```sh
sha256sum -c SHA256SUMS.txt
```

L’assemblage est réalisé par un outil local à arguments explicites ; les entrées et son empreinte sont consignées dans `records/assembly-inputs.json`. Il n’effectue aucune génération ni retouche. Les PNG et références nécessaires à la revue sont tous présents dans ce pack.

## Continuité des publications

- Art222 : [PR #27](https://github.com/darknigthmare/deadwall-last-enclosure/pull/27), tête `f76b216a9b98c1d4ebd5a6c53dc1fc07142c9114`, 8 sprites finaux et 2 sorties remplacées conservées.
- Art223 : [PR #28](https://github.com/darknigthmare/deadwall-last-enclosure/pull/28), tête `e16e501e3ad18ea5f1088ffd4ba8cbab38f0e149`, 6 sprites finaux et 9 sorties remplacées conservées.
- Art224 : [PR #29](https://github.com/darknigthmare/deadwall-last-enclosure/pull/29), tête `384f6ebaa5c573dfdedf5621a85f2a36be95b046`, 6 sprites finaux et 1 sorties remplacées conservées.

Avec les six sprites d’Art225, les quatre packs Art222–225 contiennent **26 finales distinctes**, accompagnées de 13 sorties remplacées. Ces nombres décrivent la production artistique ; ils ne signifient pas que ces images sont chargées ou intégrées au rendu du jeu.
