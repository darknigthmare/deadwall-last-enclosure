# DEADWALL — Art229 : dispensaire, abri communal et station-service

Ce pack conserve **trois sprites extérieurs dédiés**, issus de l’atlas réel et des fiches natives du Codex, avec **0 sortie(s) intermédiaire(s)** et leurs prompts exacts.

## Contenu documenté

| Fiche | Bâtiment | Emprise bâtie du pilote | Niveaux du pilote | Parcelles auteur proposées |
|---|---|---:|---|---|
| DW-0123 | Dispensaire rural | 23 × 17 m | 0 | 20 × 16 à 150 × 100 m |
| DW-0201 | Abri communal souterrain | 26 × 21 m | -1, 0 | 16 × 12 à 95 × 70 m |
| DW-0247 | Station-service | 19 × 14 m | 0 | 22 × 18 à 100 × 85 m |

Les emprises des pilotes décrivent les bâtiments présents dans le moteur. Les plages de parcelles auteur décrivent d’autres propositions. L’abri communal DW-0201 possède les niveaux −1 et 0, avec un seul niveau visible en surface. La station-service DW-0247 comprend une boutique de 19 × 14 m et trois petits objets latéraux natifs : pompe, conteneur de carburant et pneus. Son PNG ne représente pas une immense parcelle à pompes. Le dispensaire DW-0123 conserve son programme rural compact. `references/SOURCE_MAP.json` conserve les distinctions et les pièces natives.

## Fichiers et références

- `assets/art229/regional/` : trois PNG retenus, copiés dans leurs octets natifs.
- `references/iterations/` : générations remplacées, si présentes.
- `references/` : dix références techniques, sélection initiale, mapping et empreintes.
- `generation-prompts.json`, `generation-history.json`, `records/` : prompts exacts, relations d’entrée et sorties natives.
- `PROVENANCE.json`, `REPRISE.json` : périmètre, limites et point de reprise.
- `qa/` : mesures PNG/alpha et revue visuelle liée aux empreintes finales.
- `coverage/` : couverture agrégée des 49 identifiants et PNG finaux, avec distinction des 42 pilotes directs et des 20 liaisons dérivées non traitées ; le rapport ne contient pas l’empreinte de ce manifeste.
- `SHA256SUMS.txt` : empreintes de tous les autres fichiers du pack.

Les sources principales proviennent de `f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Le module de classification `remarkable217.js` provient de la révision distincte précisée dans `references/sources.json`. Les références sont comparées à la base de publication `f3ba02a5b73a55120c02c21d5703902ea3e901d9` ; aucune de ces révisions n’est présentée comme le commit de livraison du pack.

## Vérification et fidélité

Signatures PNG, décodage, dimensions, RGBA, alpha, marges visibles et empreintes sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Les couleurs RGB cachées sous alpha zéro ne constituent pas un fond opaque ; les pixels de très faible alpha sont recensés séparément.

Les programmes, niveaux et proportions demandés suivent les pilotes et l’atlas. **La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée.** Les façades sont des propositions artistiques fondées sur les usages, sans photographie canonique fournie. Ancres, mètres par pixel, portes, collisions, intérieurs et profondeur restent à calibrer dans le moteur.

La sélection initiale reste conservée comme historique. Les prompts effectivement envoyés, consignés mot pour mot, précisent ensuite une caméra à environ 15° de la verticale. Pour la station-service, l’affirmation initiale concernant l’ordre avant/arrière des deux objets de gauche est retirée : la correspondance de l’axe local `y` avec l’image n’est pas établie. Les coordonnées natives, la pompe et le conteneur de gauche, les pneus de droite et leur nombre restent documentés sans prétendre certifier la transformation vers les pixels.

## Historique Art221

Ces trois sprites ont été demandés pour les pilotes natifs exacts DW-0123, DW-0201 et DW-0247. La recherche bornée n’a pas retrouvé l’inventaire exact des neuf anciennes illustrations Art221. Aucun reçu ne relie précisément ces trois identifiants à une image Art221 déjà produite. Cela ne prouve pas qu’aucune ancienne image apparentée n’a existé.

Le matcher `remarkable217` classe seulement des usages : les noms natifs « Dispensaire rural » et « Abri communal souterrain » ne correspondent pas à ses expressions ; « Station-service » correspond à `fuel`. Une telle correspondance ne constitue pas une preuve de production graphique. Le rapport conservé explicite les sources inspectées et les limites de la recherche. Ce lot ne prétend ni reconstituer Art221 ni dédupliquer intégralement son inventaire perdu.

## État d’intégration

**Pack de préparation artistique : intégration au moteur non effectuée.** Ces lieux possèdent déjà des plans, props, intérieurs et toitures génériques. Les PNG apportent des extérieurs dédiés ; ils ne créent pas trois nouveaux lieux jouables.

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

Les PR référencées conservent **32 sprites finaux**. Art229 apporte trois sprites supplémentaires, avec 0 sortie(s) remplacée(s) propre(s) à ce lot. Les lots compagnons Art227 et Art228 sont suivis séparément dans leurs propres manifestes. Ces nombres décrivent la production artistique ; ils ne signifient pas que ces images sont chargées ou intégrées au rendu du jeu.
