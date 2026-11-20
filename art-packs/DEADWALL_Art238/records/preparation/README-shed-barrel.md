# Art238 — sous-lot abri et tonneau

Deux appels distincts au générateur intégré `image_gen.imagegen` ont produit deux propositions source. Les prompts préparés dans `selection-and-prompts.json` ont été employés sans modification, avec les deux références exactes prévues pour chaque cible. Les trois fichiers image de référence ont été inspectés avec `view_image` avant génération. Leurs empreintes ont été vérifiées avant clôture.

| Cible | Identité graphique | Source existante | Sortie native |
| --- | --- | --- | --- |
| Abri fermé | `prop:garden-shed:v0` | `EXT-MONDE-T045-V01:parcel:0:shed` | `outputs-shed-barrel/garden-shed-iteration-01.png` |
| Tonneau inactif | `prop:rain-barrel:v0` | `EXT-MONDE-T045-V01:parcel:0:water-barrel` | `outputs-shed-barrel/rain-barrel-iteration-01.png` |

La révision de dépôt est `12e0aa4aa77b9901bd53eb7a8771382a5f753593`. Les formes canoniques proviennent du painter `structural205`, variante 0. Les branches correspondantes de `src/campaign-site-art205.js` ont été relues : l’abri porte une arête verticale et cinq paires de traits ; le tonneau comporte deux bandes transversales, une bonde et un petit embout. L’atlas Art153 sert uniquement aux matières et au style. Les images analogues préexistantes ne sont pas présentées comme absentes.

L’abri retenu montre son toit complet en plan, sans façade élevée ni intérieur accessible. Le tonneau conserve un dessus fermé en bois, sans surface d’eau bleue ni écoulement. Ces images n’attribuent ni stock, ni butin, ni service actif. Les dimensions d’enveloppe 3,4 × 3,3 m et 0,7 × 0,7 m, ainsi que les hauteurs séparées 2,4 m et 1 m, viennent de l’auteur du plan ; elles ne sont pas des mesures certifiées par le PNG.

Les deux images sont des PNG natifs RGBA avec alpha de 0 à 255. Au seuil alpha 16, les marges de l’abri dépassent 18 % sur chaque côté ; celles du tonneau dépassent également 18 %. Tous les bords ont un alpha maximum de 1/255 : le faible bruit natif est conservé et des bords strictement tous nuls ne sont pas revendiqués. `alpha-shed-barrel.json` contient les valeurs exactes, histogrammes, boîtes et coins mesurés en lecture seule.

Chaque cible est acceptée côté auteur comme `accepted_source_art_proposal`, sous réserve de la revue indépendante de l’agent principal. Aucun besoin de correction n’a été identifié. Les PNG n’ont subi aucune retouche, découpe, recomposition, recoloration, mise à l’échelle ni réencodage. Leur placement, pivot et échelle dans le moteur ne sont pas validés par cette préparation.

`results-shed-barrel.json` contient les deux sélections ; `history-shed-barrel.json` conserve les deux générations ; `review-shed-barrel.json` relie chaque décision au SHA-256 natif. Les arguments exacts et réponses de chemin sont dans `inputs-shed-barrel/` et `responses-shed-barrel/`. Le reçu `delivery-shed-barrel.json` couvre seulement les fichiers de ce sous-lot ; il ne gèle pas les fichiers communs que les autres agents complètent.
