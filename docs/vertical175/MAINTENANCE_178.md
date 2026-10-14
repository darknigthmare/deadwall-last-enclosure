# Les Enceintes du Ciel — reconfiguration et entretien structurel 178

## Base et périmètre

Suite de la PR #6, `feat/vertical-citadel-175`, sur la source 177 `c97ab5abe898cf444dd919c9136345924b1f02c4`. Le commit `68ebe6c5f50b8e2e19d044d0cf02959458441b25` ajoute uniquement la conservation des sources de test. Aucune fusion dans main, aucune fusion avec la variante #7.

La couverture 177 des onze âges est conservée : **39 supports et 31 équipements**, depuis la plateforme de récupération à 2 m jusqu'aux ouvrages de Mégaville III à 72 m. Cette passe ne gonfle pas ce catalogue par des doublons : elle complète les opérations applicables à ces constructions.

## Commandes réellement raccordées

Depuis le dossier **Citadelle verticale → Entretien et soins**, approcher le module pour le déplacer, ou rejoindre le palier central pour entretenir une dalle ou l'ascenseur.

| Opération | Conditions | Travail actif et économie |
|---|---|---|
| Déplacer un équipement | Achevé, même palier, autre emplacement libre, emprise entièrement portée | 8 s + 0,12 s par unité de charge ; 8 % de son bois/ferraille/pierre d'origine, arrondi supérieur par ressource, payé à la fin |
| Déposer un chantier de module | Inachevé, joueur à proximité, confirmation exacte | 8 s ; récupération à 35 % × progression × intégrité, arrondie inférieure et plafonnée au stockage |
| Déposer la dalle supérieure | Dernière dalle additionnelle, vide de modules et chantiers ; joueur sur le palier immédiatement inférieur ; aucun infecté occupant la dalle | Confirmation, puis 20 s ; matériaux à 35 % × progression × intégrité ; dalle de base et chemin de ronde indissociables du support |
| Déposer l'ascenseur | Ascenseur présent ou chantier commencé ; aucun trajet en cours ; palier central | Confirmation, puis 18 s ; récupération de 35 % × progression ; les escaliers et les paliers restent présents |
| Réparer une dalle additionnelle | Dalle achevée, endommagée ; joueur sur son palier central | 12 s ; au plus 300 PV ; coût à 40 % des matériaux de dalle au prorata des PV rendus, arrondi supérieur |

Les coefficients sont dans `src/core.js`, `VerticalMaintenance178`, et réutilisent les valeurs de récupération/réparation 177. Les contrôleurs ne possèdent pas un second stock.

## Garanties de simulation

Le déplacement conserve **le même objet, identifiant, santé, munitions et avancement**. Il réorganise les quatre emplacements du même palier à l'issue d'un travail temporisé. Il ne constitue pas une animation de manutention physique ni du fret entre étages. Pendant les travaux, l'arme déplacée n'effectue aucun tir automatique et un atelier concerné suspend sa production. Le logement et la capacité de stockage restent conservés : il n'y a pas de perte transitoire des biens existants.

Une destination chevauchant un équipement, un chantier, le commandant ou un infecté est refusée avant paiement. La même vérification protège désormais la construction initiale d'un équipement : le joueur ne peut plus financer un volume autour de ses propres pieds. La géométrie est revalidée pendant le travail, pas seulement à l'ouverture du dossier.

Déplacement du joueur, blessure, dommage sur le support ou la cible, tir, rechargement, changement de monde ou disparition de cible interrompent les travaux sans déplacement ni prélèvement partiel. La pause suspend l'avancement. Une confirmation de dépose devient périmée si l'état contrôlé ou les stocks changent. Le deuxième clic n'autorise pas une autre cible silencieusement.

On ne dépose pas une dalle sous le joueur ni un étage intermédiaire portant d'autres niveaux. Une dalle contenant un équipement, même inachevé, doit d'abord être vidée. Une dépose d'ascenseur retire sa demande électrique, sans supprimer l'escalier de secours. Reconstruire ensuite reste soumis au coût, à la charge et au plafond de l'âge courant ; aucune connaissance ni hauteur supplémentaire n'est offerte.

Toutes les récupérations sont arrondies vers le bas, plafonnées à l'espace disponible par ressource et réalisées une seule fois à la fin. La destruction hostile n'est pas une dépose et n'accorde pas ces remboursements.

## Sauvegardes

Le format vertical reste **version 2**. Le résultat est conservé dans les champs déjà validés : emplacement de module, liste de dalles, progression d'ascenseur, intégrité. La migration 175/176 reste intacte. Les travaux et confirmations sont transitoires : sauvegarder ne termine pas une intervention et reprendre ne la paie pas automatiquement.

## Vérification

```sh
node --test --test-concurrency=2 tests/vertical-*.test.cjs
node --test --test-concurrency=2 tests/core.test.cjs tests/urban-night.test.cjs tests/power-grid.test.cjs
npm run check
node scripts/qa-vertical175.mjs
node scripts/qa-vertical176.mjs
node scripts/qa-vertical177.mjs
node scripts/qa-vertical178.mjs
```

La suite 178 ajoute **29 tests**, dont un scénario de déplacement payé pour chacun des onze âges. Le total vertical local est de **104 tests réussis**, sans échec ni test ignoré ; les 75 tests 175–177 sont inclus, pas additionnés à nouveau. La régression ciblée séparée du moteur, de l'urbanisation et de l'électricité passe ses **75 tests**. Ces scénarios ne constituent pas une campagne humaine complète.

Le test navigateur 178 manipule les vrais boutons du dossier, puis vérifie déplacement, paiement final, pause, onze pages de catalogue consultatives, dépose d'une dalle depuis le dessous, dépose d'ascenseur, maintien des escaliers et sauvegarde. Il prépare explicitement les âges avancés, l'achèvement du support de départ et les stocks, puis avance les contrôleurs natifs. Les équipements et services sont financés par leurs vraies commandes. La vue 390 × 844 est une émulation de viewport, pas un téléphone physique.

Le navigateur local a refusé la navigation sur le serveur par politique d'administration ; aucun contrôle visuel local réussi n'est revendiqué. Les preuves GitHub du commit effectivement testé font foi pour le navigateur et la suite générale. Les résultats détaillés sont consignés dans le rapport de validation associé, sans attribuer le vert d'une révision précédente à celle-ci.

## Encore ouvert

Restent les escaliers et cabines librement parcourables, le déplacement entre étages et supports distincts, les passerelles suspendues, la navigation générale verticale des PNJ et du fret, le placement arbitraire des bâtiments historiques sur dalles, les effondrements progressifs par piliers, les corps individuels et grandes foules avec niveaux de détail, ainsi que les modèles, textures, animations et sons finaux. Les limites de 720 infectés natifs et 24 occupants/grimpeurs détaillés ne changent pas. Les fonctions d'entretien ci-dessus ne doivent pas être présentées comme l'achèvement de ces chantiers.
