# DEADWALL Art239 — variantes structurelles choisies

Six propositions de source graphique sont retenues après revue d’auteur et revue indépendante du parent. Huit sorties natives sont archivées : les six premières générations et deux reprises de la clôture métallique. Sa troisième itération est retenue ; les deux premières restent disponibles avec leurs motifs d’écartement. Aucun PNG n’a été recadré, redimensionné, recomposé, nettoyé ou réencodé.

## Identité et portée

Le propriétaire reste `src/campaign-site-art205.js`, route `structural205`, API publique `drawProp`. Les clés `kind:vN` désignent une couverture graphique. Le `kind`, l’ID d’instance du monde et le plan auteur restent inchangés. Ces propositions étendent des variantes de forme et de matière déjà définies ; elles ne prouvent aucune absence de rendu Canvas et ne créent pas de type runtime.

Toutes les instances sont celles du plan `EXT-MONDE-T045-V01` utilisé pour Art238. Le numéro du plan est indépendant de la variante 1 ou 2 passée au peintre. Les enveloppes auteur sont : clôtures 3 × 0,15 m, hauteur 1,2 m ; abris 3,4 × 3,3 m, hauteur 2,4 m ; tonneaux 0,7 × 0,7 m, hauteur 1 m. Ces dimensions documentent les sources sans certifier l’échelle métrique des PNG.

| Clé | Construction native retenue | Itération finale |
| --- | --- | ---: |
| `fence:v1` | Deux diagonales bois de même pente, trois poteaux et deux rails. | 1 |
| `fence:v2` | Acier mat gris-olive, trois poteaux, deux rails séparés et deux croisillons fins. | 3 |
| `garden-shed:v1` | Toit métal, traverse horizontale centrale et six joints verticaux. | 1 |
| `garden-shed:v2` | Toit bois, grande plaque à deux fixations et petit panneau inférieur droit. | 1 |
| `rain-barrel:v1` | Couronne et disque métalliques, courte poignée et deux fixations latérales. | 1 |
| `rain-barrel:v2` | Couvercle métallique, traverse diagonale et deux bondes inégales. | 1 |

## Références et provenance

Le script historique `prepare.cjs` a extrait les références sur le HEAD local `e728993ee81f50b1bcc241ffe9503304a19e6ae0`, arbre `33d089eab2bb23f288e66d57c2794f6a38b3ba84`. Les 24 sources de base ont les mêmes blobs Git et les mêmes octets entre main `12e0aa4aa77b9901bd53eb7a8771382a5f753593` et ce checkout. Les sept documents obligatoires déjà lus lors de la préparation précédente sont inchangés et archivés avec leurs empreintes.

Le parent a ensuite récupéré et sélectionné le vrai commit distant `6ebd6707251e675a5b75ded23e91dd28339dfe38`, de même arbre. `references/provenance/late-direct-remote-commit-check.json` vérifie directement les 24 sources et les trois images de style Art238 à cette révision. Les reçus historiques conservent la révision réellement employée. Cet agent n’a modifié aucune référence Git.

Les canoniques passent par l’API publique inchangée avec Canvas 0.1.100, `seed:0`, `floor:0`, indice de variante explicite et `stateAlpha:false`. Aucun argument de jeu n’est fourni : aucun service ni overlay d’eau actif n’est incorporé. Les dimensions de canevas, l’origine et le facteur pixels/mètre sont ceux d’Art238. Les trois replays v0 sont identiques en octets aux anciens canoniques. `replay-canonicals.cjs` compare les buffers aux neuf fichiers archivés sans écrire de PNG ; le script d’extraction historique reste lié à son checkout initial.

Les neuf fichiers de référence distincts ont été inspectés avec `view_image` avant les premiers appels. Ceux-ci recevaient le canonique de la variante et l’image Art238 v0 du même objet pour sa finition seulement. La dernière génération de `fence:v2` reçoit **le canonique seul**. Les fichiers `calls/` et les champs de chaque résultat/historique enregistrent les références effectivement passées, dans leur ordre exact. Le champ `existingAnalogue` actuel distingue la variante choisie de l’audit v0 historique conservé sous `previousV0AnalogueAudit`.

## Reprises de la clôture métallique

L’itération 1 avait un bord entièrement transparent mais une matière trop proche du bois et des X peu lisibles. Son acceptation initiale d’auteur a été annulée par la revue indépendante ; le snapshot initial est conservé dans `pre-correction-records/`.

L’itération 2 a gardé des rails presque joints et des X peu distincts. Un large nuage gris apparaît dans l’aperçu. Le fichier comporte 502 668 pixels alpha1–7 autour de la silhouette ; son bord a un maximum de 1/255. Cette sortie est rejetée et conservée sans nettoyage. L’auteur voyait un aperçu `view_image` presque vide malgré des pixels RGB valides et 32 453 pixels alpha≥128 ; ce décalage observé n’est pas présenté comme une corruption du PNG.

L’itération 3, issue du canonique seul, a été retenue par le parent après inspection du fichier et de sa référence. Les rails séparés, trois poteaux et deux X sont lisibles, avec une matière gris-olive plus clairement métallique. Le grand nuage est absent de son aperçu. Elle garde 17 952 pixels alpha1–7 et quelques alpha1 diffus ; son bord est alpha0. L’auteur a encore observé le décalage de son aperçu `view_image`, tandis que le parent voyait l’objet natif. Aucune conversion de pixels n’a été utilisée pour masquer ce comportement d’affichage.

## Contrôles et limites

`results.json` contient les six finales, `history-results.json` les huit sorties et `iteration-review.json` les huit évaluations. `review.json` lie les six décisions aux SHA des images. `root-review.json` constitue la revue indépendante, conservée sans modification. `alpha-review.json` couvre les six finales et `alpha-history.json` les huit sorties. Chaque fichier retenu est identique en octets à sa sortie native originale et au SHA des deux revues.

Les faibles valeurs alpha restent natives. La silhouette visible demeure intérieure au canevas ; aucune transparence exactement nulle de tous les pixels extérieurs n’est revendiquée. Les marges mesurées sont publiées et ne sont pas présentées comme une conformité parfaite aux marges demandées dans les prompts.

Ces livrables restent des propositions de sources. Aucune intégration moteur, calibration de pivot, collision, lisibilité à toutes les échelles ou identité pixel/métrique 1:1 n’est certifiée. Les fines attaches devront être inspectées à taille moteur lors d’une intégration ultérieure. Les détails de matière, chanfreins et petits rivets sont interprétés.

Les 110 propositions précédentes et les fichiers du moteur sont inchangés. Aucun contrôle global supplémentaire n’a été lancé pour ce lot ; la validation de publication relève du parent. Aucun nouveau stock, objet de gameplay, faction, abomination ni nouvelle tentative du mécanisme bloqué n’a été introduit.
