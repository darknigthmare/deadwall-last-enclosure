# DEADWALL — Art230 : extérieurs des types natifs

Ce pack conserve **7 PNG finaux** et **9 sortie(s) remplacée(s)**, leurs prompts exacts, leurs références et leurs empreintes. Chaque image est identifiée par `native:<type>` et par un nom de fichier sans identifiant DW.

| Identité artistique | Nom natif | Emprise native documentée | Niveaux natifs |
|---|---|---:|---|
| native:cottageSmall | Petite maison ouvrière | 10 × 10 m | 0 |
| native:rowhouse | Maison étroite | 11 × 18 m | 0, 1 |
| native:bungalow | Pavillon | 20 × 14 m | 0 |
| native:familyHouse | Maison familiale | 22 × 19 m | 0, 1 |
| native:farmhouse | Corps de ferme | 32 × 17 m | 0, 1 |
| native:villa | Grande villa | 28 × 23 m | 0, 1 |
| native:duplexWide | Maison double | 30 × 19 m | 0, 1 |

## Identité et périmètre

Les pilotes possèdent déjà leurs plans, identités et programmes hérités. Les façades sont des propositions artistiques pour leur enveloppe fermée. Les props extérieurs, cours, véhicules et terrains restent documentés dans les sources et exclus de ces images.

Les références Codex déclarées par les presets sont contradictoires. Elles sont conservées uniquement comme preuves dans `provenance.declaredCodexId` et les fiches de `references/conflicting-codex/`, avec le statut `contradictory_unresolved`. Ce lot ne reconstruit pas ces fiches auteur et n’effectue aucun remapping. Le retrait de métadonnées Codex dans une fixture de lecture ne change aucune identité, sauvegarde, ressource ou propriété du jeu.

`references/SOURCE_MAP.json` relie les identités natives aux presets, plans évalués, programmes hérités, propriétaires et contradictions. L’évaluation est une fixture canonique synthétique G7, non une campagne réellement jouée. Le contrat source est conservé dans `references/source-only-contract.md`.

## Contenu et contrôle

- `assets/art230/native/` : les PNG finaux, copiés sans changer un octet.
- `references/iterations/` : toutes les sorties remplacées enregistrées.
- `references/` : sources hashées, atlas réel, plans évalués et sélection initiale.
- `generation-history.json`, `generation-prompts.json`, `records/` : prompts effectivement envoyés, références exactes, versions et entrées d’assemblage.
- `qa/` : RGBA, alpha, marges visibles, SHA256 et revue visuelle liée aux finales.
- `PROVENANCE.json`, `REPRISE.json` : état et limites de reprise.
- `SHA256SUMS.txt` : empreintes de tous les autres fichiers du pack.

L’atlas de référence est vérifié par ses octets, même si le chemin local de génération diffère de la copie préparée. Les prompts de sélection restent des propositions historiques ; les enregistrements effectifs font autorité sur les appels réalisés. Les itérations non retenues restent disponibles.

Les signatures PNG, le décodage, les dimensions, le canal alpha et les empreintes sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Les couleurs RGB sous alpha zéro sont invisibles ; le bruit de très faible alpha est recensé séparément. **La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée.** Projection, mètres par pixel, ancrages et accès restent à calibrer avant un raccord au moteur.

## Reprise

L’inventaire exact Art221 reste incomplet ; aucune déduplication historique exhaustive n’est revendiquée. Les anciens packs restent inchangés. Les éventuels lots compagnons de cette branche ne sont pas déclarés publiés par cet assembleur.

**Source art uniquement : aucune intégration au moteur.** Le pack ne modifie ni sources, ni génération, ni sauvegardes, ni tests, ni dépendances, ni listes publiques. Les contrôles d’images ne remplacent pas les vérifications du jeu et ne démontrent pas une CI réussie.

La base des sources est `f3ba02a5b73a55120c02c21d5703902ea3e901d9` ; ce n’est pas le commit de publication de ce pack. Pour vérifier les fichiers depuis ce dossier :

```sh
sha256sum -c SHA256SUMS.txt
```

L’outil local conservé dans `tools/` ne génère et ne retouche aucune image. Les chemins d’entrée originaux et leur relocalisation dans ce pack sont explicités par `records/preparation-paths.json` ; les manifestes d’entrée restent des preuves historiques distinctes du manifeste final.

## Publications précédentes

- Art222 : [PR #27](https://github.com/darknigthmare/deadwall-last-enclosure/pull/27), tête `f76b216a9b98c1d4ebd5a6c53dc1fc07142c9114`, 8 finales et 2 sorties remplacées.
- Art223 : [PR #28](https://github.com/darknigthmare/deadwall-last-enclosure/pull/28), tête `e16e501e3ad18ea5f1088ffd4ba8cbab38f0e149`, 6 finales et 9 sorties remplacées.
- Art224 : [PR #29](https://github.com/darknigthmare/deadwall-last-enclosure/pull/29), tête `384f6ebaa5c573dfdedf5621a85f2a36be95b046`, 6 finales et 1 sorties remplacées.
- Art225 : [PR #30](https://github.com/darknigthmare/deadwall-last-enclosure/pull/30), tête `bb14d13aae1619e79fab6b5c4b8d2329aff1c2c6`, 6 finales et 1 sorties remplacées.
- Art226 : [PR #30](https://github.com/darknigthmare/deadwall-last-enclosure/pull/30), tête `bb14d13aae1619e79fab6b5c4b8d2329aff1c2c6`, 6 finales et 6 sorties remplacées.
- Art227 : [PR #31](https://github.com/darknigthmare/deadwall-last-enclosure/pull/31), tête `5cc184d4cfeb6d62ddf4f5ae043c1dd6b852ffaf`, 7 finales et 0 sorties remplacées.
- Art228 : [PR #31](https://github.com/darknigthmare/deadwall-last-enclosure/pull/31), tête `5cc184d4cfeb6d62ddf4f5ae043c1dd6b852ffaf`, 7 finales et 1 sorties remplacées.
- Art229 : [PR #31](https://github.com/darknigthmare/deadwall-last-enclosure/pull/31), tête `5cc184d4cfeb6d62ddf4f5ae043c1dd6b852ffaf`, 3 finales et 0 sorties remplacées.
