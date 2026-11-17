# Préparation des polices pour les tests Canvas natifs

Les jobs natifs installent désormais le paquet Ubuntu `fonts-dejavu-core`,
puis vérifient le dessin de vrais caractères latins dans `@napi-rs/canvas`.
Cette préparation précède les six partitions de `ci.yml` et la commande
complète de `fullcheck201.yml`. Les parcours navigateur et Windows gardent
leur environnement existant.

## Problème reproduit

Les runs des PR28 et PR29 échouent dans le test existant Art159, sur
`site labels fit their bounded world support` :

- [PR28, partition native 3](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/44050503433/job/133926823507).
- [PR29, partition native 3](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/44051304789/job/133929526350).

Le test et son peintre sont identiques à la base
`f3ba02a5b73a55120c02c21d5703902ea3e901d9`. Art223 et Art224 ajoutent leurs
packs source sans modifier ce code. Sur la base locale, le fichier Art159
réussit ses trois tests. Dans un processus où seule Noto Color Emoji est
enregistrée, il échoue à la même assertion : le mot « Roseraie » mesure
109,50px et ne produit aucun pixel, avec ou sans `maxWidth=108`.

Le [catalogue exact de l’image Ubuntu 26.04 utilisée](https://github.com/actions/runner-images/blob/ubuntu26/20261111.196/images/ubuntu/Ubuntu2604-Readme.md)
répertorie `fonts-noto-color-emoji`. Les runners en échec ne journalisent ni
leur police Canvas effective ni le mot fautif. Le scénario emoji seul
reproduit une condition défaillante ; il ne prouve pas leur sélection
historique de police. Le correctif élimine cette fragilité d’environnement,
sans assouplir le test Art159 ni changer le renderer.

## Préparation et contrôle

L’action partagée [setup-native-fonts](../../.github/actions/setup-native-fonts/action.yml)
installe le paquet libre fourni par Ubuntu, avec des durées bornées pour APT.
`fonts-dejavu-core` est [disponible dans Ubuntu 26.04/resolute](https://packages.ubuntu.com/resolute/fonts-dejavu-core) ;
sa [liste de fichiers](https://packages.ubuntu.com/resolute/all/fonts-dejavu-core/filelist)
contient DejaVu Sans normal et gras. Aucune police ni dépendance npm n’est
ajoutée à la distribution du jeu.

Le [précontrôle](../../scripts/ci-native-fonts.mjs) utilise un nouveau processus
Node, comme les tests qui suivent. Il ne charge, n’alias et ne remplace aucune
police : l’installation système est la source commune. Il contrôle :

- la présence de DejaVu Sans dans le registre natif ;
- le CSS effectif du peintre, `bold 11px sans-serif`, puis DejaVu Sans explicite ;
- 82 caractères latins distincts, dont les majuscules, minuscules et accents,
  avec des métriques finies, une largeur positive et des pixels visibles ;
- la différence avec le raster du caractère manquant témoin U+10FFFF,
  pour refuser un simple carré de substitution ;
- la présence de plusieurs rasters distincts, pour refuser un résultat uniforme.

Le JSON conserve les métriques, comptages de pixels, empreintes des rasters,
familles enregistrées et erreurs. L’inventaire ne prétend pas identifier la
famille effectivement résolue : `fc-match` peut différer du choix interne de
Canvas. Une image vide ne peut pas devenir un succès de contrôle des bornes.

Une erreur du précontrôle fait échouer l’action et empêche les tests coûteux
de démarrer. Même si APT échoue, la sonde tente de conserver un diagnostic ;
un succès éventuel de cette sonde n’efface pas l’échec de l’installation.
Le JSON rejoint les artefacts natifs déjà téléversés, y compris lors d’un échec.
Les commandes `ci-native186`, `full-check201 start/finish`, `npm run check`,
`DEADWALL_SOAK`, le checkout du head exact, les reçus et les agrégations
conservent leur comportement.

## Vérifications exécutées

Les empreintes des quatre fichiers de code/configuration vérifiés et les
résultats sont dans [verification.json](verification.json). La vérification
porte sur ces fichiers avant commit, avec Node 24.22.1 et Canvas 0.1.100.

| Contrôle ciblé | Résultat |
|---|---|
| Précontrôle dans l’environnement local existant | Accepté ; 164 glyphes sondés, aucune erreur |
| Précontrôle avec seulement DejaVu Sans normal et gras | Accepté ; 164 glyphes visibles, métriques finies |
| Précontrôle avec seulement Noto Color Emoji | Refusé, code 1 ; les 82 glyphes du CSS générique sont invisibles |
| Test Art159 original, registre DejaVu contrôlé | 3 tests réussis, aucun échec ni test ignoré |
| Syntaxe Node du précontrôle | Réussie |
| YAML des workflows et de l’action ; syntaxe Bash | Réussies |
| Comparaison structurée des workflows à la base | Une seule étape ajoutée dans chacun des deux jobs ; autres champs identiques |
| `git diff --check` | Réussi |

Les registres isolés utilisent `DISABLE_SYSTEM_FONTS_LOAD=1` et un preload de
diagnostic qui enregistre seulement les fichiers de police indiqués dans le
rapport. Ces options ne figurent pas dans les workflows et ne modifient pas
le système. Le scénario négatif vérifie le code de sortie réel du précontrôle.

Pour contrôler un environnement déjà préparé :

```sh
node scripts/ci-native-fonts.mjs artifacts/qa/native-fonts/manual.json
node --test tests/expedition-art159.test.cjs
```

Aucune installation système ou npm n’a été lancée pour la validation locale.
La commande exhaustive `npm run check` n’a pas été exécutée localement, selon
le périmètre demandé ; elle reste exigée par les workflows sur le futur commit.
L’installation APT et le comportement sur un nouveau runner GitHub restent à
observer. Ce rapport n’est ni une preuve de CI complète réussie ni une
validation du rendu dans un navigateur. Aucun pack artistique n’est modifié.
