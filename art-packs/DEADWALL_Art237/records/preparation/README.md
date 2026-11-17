# Art237 — sources des montages spécialisés D-17

## Résultat et périmètre

**Cinq propositions de sprites sources sont retenues, sur six mécanismes sélectionnés.** Les sept sorties PNG natives réellement reçues sont conservées : cinq premières versions et deux corrections. Deux appels supplémentaires ont été refusés par le service de génération pour `runnerCable193`, sans image livrée. Le lot reste donc explicitement partiel.

Ces mécanismes **possèdent déjà un rendu composite Art159 + quincaillerie Canvas193 et un fonctionnement jouable**. Le manque identifié est celui d’un bitmap dédié représentant le montage entier. Art237 ne corrige pas des objets invisibles et n’ajoute aucune règle, charge, cible ou arme.

| Type runtime existant | Montage | Version retenue | PNG natif | État |
|---|---|---:|---|---|
| `runnerCable193` | Câble anti-coureurs | — | Aucun | Bloqué après deux refus du service ; référence canonique conservée |
| `breachClamp193` | Mâchoire anti-briseurs | 1 | 1254 × 1254 RGBA | Proposition source acceptée |
| `enduranceRack193` | Râtelier de dents de relève | 2 | 1254 × 1254 RGBA | Traverse remise devant la lame par correction ImageGen |
| `shieldTongs193` | Pinces anti-protections | 1 | 1254 × 1254 RGBA | Proposition source acceptée |
| `quickCable193` | Bobines de couverture rapide | 2 | 1536 × 1024 RGBA | Proposition source acceptée ; marge horizontale mesurée de 9,18 % |
| `siegeBrake193` | Frein à chaîne de siège | 1 | 1254 × 1254 RGBA | Proposition source acceptée |

Chaque image montre le montage complet immobile, posé sur son support Hérisson existant. Ce sont des **illustrations statiques de source**, sans remplacement d’animation articulée, sans intégration au moteur et sans publication par cet agent.

## Révision et références

Source vérifiée : `darknigthmare/deadwall-last-enclosure`, commit `12e0aa4aa77b9901bd53eb7a8771382a5f753593`, arbre `663ad5750e49ae401fc0b46bfdebc28942ad1617`, checkout `deadwall-art236`.

`source-evidence.json` atteste les 21 fichiers relus ou utilisés, avec chemin d’origine, révision, Git blob, SHA-256, taille et vérification des octets contre ce commit. Les copies exactes sont dans `references/repository/`. Cela comprend les consignes, les sept documents requis dont `GAME_BIBLE.md`, les propriétaires de code, les tests, le verrou de dépendances et les deux atlas A effectivement utilisés par le renderer de la variante 0.

L’audit antérieur `next-art233-audit/actors-and-equipment` est conservé dans `prior-audit/` comme historique de sélection. Ses chemins et ses affirmations de version ne sont pas présentés comme une vérification actuelle. La preuve actuelle est celle du commit indiqué ci-dessus.

Le skill `imagegen` et le guide gamedev `create-game-assets`, avec sa référence `raster-pipeline`, ont été lus. Les reçus du guide externe figé à `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` sont archivés dans `external-guide-receipts.json`. Leur méthode est adaptée au renderer existant ; elle ne justifie ni migration ni normalisation des PNG natifs.

## Construction des six canoniques

`prepare-references.cjs` appelle les exports **inchangés** de `src/trap-art159.js` avec le Canvas installé depuis le verrou du dépôt (`@napi-rs/canvas` 0.1.100). L’ordre est celui des couches matérielles du jeu :

1. `drawSpikes` : base du Hérisson et poutre hérissée mobile, figée au repos.
2. `drawMechanism` : base du mécanisme, première pièce mobile, seconde pièce mobile, puis quincaillerie spécialisée Canvas193.

Le wrapper d’interface n’est pas invoqué : pastilles de charges, bordure de statut et flash sont exclus. Aucun filet ni réserve supplémentaire n’est présent dans cette fixture. Les poses et quantités sont explicitement définies ; aucune partie de campagne n’est simulée.

| Paramètre | Valeur de la référence |
|---|---|
| Support | `spikes`, Hérisson anti-horde achevé, vivant, rotation 0 |
| Emprise auteur | 1 × 1 m, selon `BUILDINGS.spikes` et `CityGeometry202` |
| Cadre natif | 32 × 32 unités ; intérieur de dessin 26 × 26 après retrait de 3 unités de chaque côté |
| Variante | 0, explicite pour le support et le montage |
| Mécanisme | `phase=armed`, `progress=0`, `motion=0`, `cooldown=0`, `caught=[]` |
| Support | `phase=idle`, `progress=0`, `motion=0` |
| Charges de fixture | Capacité réelle de la recette : 8 / 5 / 18 / 4 / 12 / 2 selon le type ; aucun stock dessiné à partir de ces nombres |
| Export canonique | 1024 × 1024 RGBA, centre (512, 512), échelle Canvas ×24 ; cadre propriétaire équivalant à 768 px par mètre |
| Hauteur | Aucune hauteur propre au mécanisme n’est déclarée ; la valeur reste `null` |

Les cadres contiennent des faces obliques déjà peintes dans Art159. Les propositions conservent cette projection de sprite et ses axes ; elles ne prétendent pas convertir ces images en plans d’ingénierie ni démontrer une fidélité métrique 1:1.

Les fixtures sont gelées récursivement. `Math.random` et le générateur du jeu sont gardés pendant les appels de dessin, avec **zéro appel observé**. Les entrées restent identiques. Transformation Canvas, alpha global et largeur de trait sont restaurés. Les getters de couleur du backend natif conservent la dernière couleur de quincaillerie après `save/restore` : une restauration complète des styles n’est donc pas affirmée. Chaque référence dispose de son propre Canvas isolé.

Le rejeu a donné les mêmes six SHA de PNG que la préparation initiale. `canonical-receipts.json` conserve les paramètres complets et `canonical-alpha-audit.json` les mesures sans retouche.

## Pièces et propriétaires

`assembly-contract.json` distingue les deux composants du **support** des trois composants du **mécanisme** et de sa quincaillerie spécialisée. Il conserve les rectangles d’atlas, pivots, poses natives au repos et formules de mouvement existantes.

| Type | Famille Art159 | Quincaillerie distinctive |
|---|---|---|
| `runnerCable193` | `guideRail` | Deux crochets latéraux et un câble transversal |
| `breachClamp193` | `clamp` | Quatre amortisseurs rectangulaires et deux membres en X |
| `enduranceRack193` | `ratchet` | Cadre supérieur et quatre dents rectangulaires de relève |
| `shieldTongs193` | `clamp` | Deux barres de pinces séparées, inclinées vers l’intérieur |
| `quickCable193` | `guideRail` | Deux anneaux de bobines et une barre/câble transversal bas |
| `siegeBrake193` | `counterweight` | Bloc de frein supérieur gauche et quatre sections de chaîne en V |

Les règles et le type sauvegardé appartiennent à `src/core.js#FortificationPackRules.mechanisms`. L’état et la présentation appartiennent à `src/fortification-pack.js`, notamment `mechanismPresentation`, `presentationFor` et `advanceVisuals`. Les phases restent `armed`, `trigger`, `action`, `held`, `return` et `exhausted`. Le support a sa propre impulsion de contact.

Une future intégration devra conserver la séparation base fixe / pièces mobiles, les pivots, les états du contrôleur et le support commun. Utiliser directement ces montages entiers comme remplacement ferait perdre l’articulation ou doublerait le Hérisson. **Aucun composant existant n’est remplacé par ce lot.** Les clés `mechanism:<kind>:v0:armed-mounted` sont des identifiants descriptifs du pack ; `runtimeIdentity` reste le vrai `kind` existant.

## Génération et historique

Tous les canoniques et les deux atlas originaux ont été inspectés avant génération. Les appels réussis de première version ont reçu le **seul canonique exact** de leur type. Les atlas ont servi à la lecture et à l’identification des matériaux ; ils n’ont été envoyés à l’outil que lors du premier appel refusé pour `runnerCable193`. Les références réellement envoyées sont listées dans chaque reçu, sans ajouter a posteriori de faux input.

`generation-prompts.json` recense les **neuf appels effectivement envoyés**, leurs arguments exacts, l’ordre des références, SHA, statut et reçu. `planned-prompts-initial.json` conserve le brouillon initial ; il ne prouve pas qu’un prompt a été envoyé. `calls/` conserve chaque requête, chaque sortie reçue et les deux erreurs de service structurées à partir des messages de l’outil.

Les deux refus de `runnerCable193` portent le code HTTP 400 `moderation_blocked`, catégorie `violence` : une fois à l’entrée, puis à la sortie après clarification du contexte fictif statique. Aucun PNG n’a été livré. La cible reste bloquée, sans autre essai ni substitut fabriqué par code. `blocked-targets.json` lie les deux reçus à leurs SHA.

Corrections conservées :

- **Râtelier, version 2** : l’image initiale plaçait visuellement la lame devant la traverse basse du cadre. L’édition ImageGen a rétabli une traverse continue au premier plan, comme le dessin natif qui applique la quincaillerie en dernier. Les quatre plaques, le pivot, le ressort et le crochet sont conservés.
- **Bobines, version 2** : une demande ciblée a clarifié le fond et le cadrage après observation d’un halo brun dans la prévisualisation. Les échantillons du halo apparent de la version 1 avaient déjà tous un alpha nul ; un fond opaque n’avait donc pas été établi. La version 2 conserve également cet alpha transparent aux points examinés. Sa marge horizontale reste de 9,18 %, inférieure aux marges demandées dans les prompts, mais sans pièce coupée ni alpha non nul au bord.

`history-results.json` contient les sept sorties natives ; `results.json` ne contient que les cinq finales retenues. Les fichiers originaux de `generated_images/` et leurs copies dans `generated/iteration-N/` sont identiques octet par octet. Aucun recadrage, redimensionnement, détourage manuel, recompression ou traitement de pixel n’a été appliqué.

## Revue, alpha et limites

`review.json` lie chaque finale à son SHA et à celui du canonique. `iteration-review.json` conserve l’évaluation de chacune des sept sorties. `root-review.json` et `root-canonical-replay.json` sont les reçus de revue et de rejeu indépendants écrits par root. Cette revue a accepté les cinq finales : mâchoire v1, râtelier v2, pinces v1, bobines v2 et frein v1.

`alpha-review.json` mesure les canaux des sept PNG, sans générer de nouvelle image. Les images carrées possèdent parfois quelques pixels d’alpha 1 jusqu’au bord ; ces traces natives sont déclarées et conservées. Les silhouettes significatives disposent de marges claires. Pour les bobines, les échantillons RGBA figurent dans `quickCable-background-samples.json`. Le contrôle indépendant sur un fond clair a confirmé que le halo apparent disparaît quand l’alpha est respecté. Aucun critère RGB=0 n’est imposé aux pixels dont alpha=0.

Cette réception porte sur la cohérence visuelle d’une proposition source. Elle ne certifie ni superposition pixel à pixel, ni métrique 1:1, ni animation, ni comportement en jeu, ni performance, ni compatibilité d’un futur découpage. Les silhouettes, matériaux et détails sont illustrés ; les règles runtime demeurent celles du propriétaire existant.

## Vérifications exécutées

Les reçus sont dans `validation.json` :

- Extraction et rejeu des six canoniques avec les fichiers du commit exact : réussite, six SHA identiques, aucune mutation d’entrée ou consommation RNG.
- `node --test tests/audit193-trap-art.test.cjs` sur le checkout source : **2 tests réussis, aucun échec**. Ces tests existants vérifient les six rendus spécialisés et leur distinction des familles réutilisées.
- Vérification des copies natives, de leurs SHA, modes RGBA et alpha : réussite.
- Sélection exhaustive : cinq finales acceptées et une cible bloquée, sans doublon ni PNG fictif.

Le contrôle global `npm run check` n’a pas été exécuté par cet agent de préparation. Son éventuel reçu de livraison appartient à la préparation de la PR, séparément de ce lot source. Aucun fichier moteur, sauvegarde, registre de chargement, atlas original ou logique de jeu n’a été modifié ici.

## Relecture et gel

Les entrées du lot sont `selection-and-prompts.json`, `source-evidence.json`, `canonical-receipts.json`, `assembly-contract.json`, `results.json`, `history-results.json`, `review.json`, `iteration-review.json`, `alpha-review.json`, `blocked-targets.json` et `generation-prompts.json`. `freeze-manifest.json` fixe les octets remis à la revue et à l’assemblage.

La réexécution des scripts de préparation n’est pas nécessaire pour consulter ce lot. Un rejeu indépendant doit se faire dans une copie pour préserver le gel. Les scripts ne modifient pas le moteur ; ils écrivent leurs propres références et reçus.
