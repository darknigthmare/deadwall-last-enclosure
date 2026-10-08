# DEADWALL 1.52 — D17, visibilité et animations

Cette livraison poursuit la campagne existante avec des corrections reproduites dans ses contrôleurs et de nouveaux dessins originaux. Le contenu des onze âges, les ressources, les coûts, les générations de carte G1–G7 et le format général de sauvegarde restent compatibles.

## Visibilité et exploration

Les contacts du HUD régional et du dossier passent par le même service de vision physique que les cartes. Un groupe découvert dans le passé ne fournit plus son effectif global ni sa position courante à distance. Le nombre affiché compte uniquement ses individus observés ; la distance utilise le plus proche. La mort de l'observateur retire les informations à la prochaine actualisation. La consultation ne marque aucun groupe comme découvert et ne modifie ni sauvegarde ni générateur aléatoire.

La récolte régionale reconnaît aussi les individus des migrations et les survivants réanimés proches, au même étage et à portée de vue. Les incendies réels continuent d'éclairer lorsque le support électrique est hors service ; une flamme ne devient pas un observateur allié. Le registre des incendies est lu au plus une fois pour la validation de chaque frame de visibilité.

## Travaux et survie

Une opération payée réserve les mains du commandant avant les interactions ordinaires de dépôt, récolte ou construction. L'annulation libère correctement ces interactions. Les travaux propres à l'opération et ceux des ouvriers continuent selon leurs contrôleurs. Les opérations médicales détectent les réanimés et cessent de progresser après la défaite du centre. Les consommables de terrain ne sont pas versés à une opération interrompue.

La touche E conserve son interruption volontaire historique pendant une pose de barricade : le contrôleur annule d'abord la pose sans dépense, puis la même frame peut fouiller le contenant réel avec les mains libérées. Une formation ou une autre opération payée conserve son propre mode d'annulation.

Le HUD des formations utilise la durée de l'exercice réel : l'escorte de 60 secondes et le triage de 90 secondes ne démarrent plus avec un pourcentage négatif calculé sur 45 secondes.

## Animations

La marche inférée des unités et infectés utilise le temps de simulation entre déplacements. Les petits déplacements d'un acteur ralenti restent animés à 144 ou 240 rafraîchissements par seconde ; un déplacement nul, une téléportation ou un retour en arrière du temps ne produit pas une fausse marche. Les options de mouvement réduit restent prioritaires.

Un clic de tir sans munition n'efface plus un véritable geste de récolte. Le rechargement, le coup de contact et le tir réussi restent prioritaires. Le recul est lié à un coup effectivement comptabilisé, à son arme et à son équipement ; une temporisation d'équipement ne produit pas de recul fictif. Ces états visuels sont transitoires et ne changent pas les statistiques sauvegardées.

Le rendu G7 conserve l'espèce déterministe d'un arbre ou rocher entre deux dessins, avec invalidation du monde, de la seed, de la génération et des coordonnées régionales effectives. La quantité restante, le rayon et le flash restent immédiats. Les tests comparent les pixels au peintre sans cache et vérifient que la consultation ne consomme aucun aléa.

## Illustrations de D17 et du terrain

Quatre atlas PNG transparents fournissent les silhouettes de 28 bâtiments existants : sept services, sept installations logistiques, sept équipements énergétiques et sept éclairages/protections. Le rendu respecte l'emprise physique dans les quatre rotations. Les batteries affichent la charge lue dans leur propriétaire, la citerne son niveau d’eau, les éclairages leur alimentation et leur orientation, et le poste de secteur son état de contrôle. La serre garde son arrêt nocturne et la redoute son canon réellement orienté. Les fondations, dégâts et incendies gardent leurs couches existantes. Le peintre procédural reste disponible si une image ne charge pas.

Les sources générées sont conservées sans retouche ; prompts, empreintes et découpes mesurées sont dans [assets/art152/PROVENANCE.json](../assets/art152/PROVENANCE.json) et [PROMPTS.md](../assets/art152/PROMPTS.md). Les ajouts aux véhicules utilisent leurs profils physiques existants. Le mobilier intérieur, les routes, certains objets de terrain et les effets gardent leurs dessins procéduraux, contrôlés séparément : un dessin procédural présent n'est pas une image manquante.

## Progression et validation

Les conditions autoritaires des onze âges restent dans `Balance151` de `src/core.js` ; les matrices de [LIVRAISON_1_51.md](LIVRAISON_1_51.md) restent valables. La cible de 6 à 10 heures en Standard décrit le rythme normal visé. Les bornes de directeur à attraction maximale ne mesurent pas une campagne humaine complète et la fin anticipée des jours raccourcit ce rythme.

Les contrôles ciblés couvrent les défauts reproduits, la lecture sans mutation, les reprises de sauvegarde et plusieurs seeds. `npm run check` reste obligatoire avant livraison. Les parcours navigateur finaux doivent partir du payload exact extrait de l'archive ; les scènes préparées et les vrais parcours par commandes sont identifiés dans leurs rapports. Les galeries vérifient chargement, découpe et présence de dessin, puis inspection visuelle. Les mesures de fluidité utilisent de vrais frames RAF dans Chromium, en scènes explicitement préparées, sans autre test ou build concurrent.

Les 24 mesures du rendu G7 répètent trois fois les modes auto/économique et les scènes calme/720 ennemis enfermés, sur le même Chromium cloud à moteur graphique logiciel SwiftShader. Elles précèdent la correction d'interruption E des barricades, sans modifier ensuite les peintres mesurés ; ces scènes n'engagent aucun travail de barricade. Chaque mesure utilise 5 secondes de chauffe et 10 secondes de frames RAF réels. Voici les médianes des trois statistiques par scénario en mode économique ; le mobile est un viewport tactile émulé de 390 × 844, le desktop 1280 × 720.

| Scénario économique | Intervalle RAF médian | Intervalle RAF p95 | Simulation / temps réel |
| --- | ---: | ---: | ---: |
| Desktop calme | 16,7 ms | 16,8 ms | 1,00 |
| Desktop 720 ennemis | 33,4 ms | 50,1 ms | 0,87 |
| Mobile calme | 16,7 ms | 16,7 ms | 1,00 |
| Mobile 720 ennemis | 33,3 ms | 50,0 ms | 0,95 |

L'observation desktop économique antérieure au cache donnait 49,9 ms de médiane et 83,3 ms de p95 avec cette horde. Cette comparaison décrit un essai antérieur et trois répétitions finales, sans constituer un benchmark matériel contrôlé. Le desktop auto/DPR2 reste limité dans la scène dense : médiane RAF de 100 ms, p95 de 116,7 ms et ratio de simulation de 0,41. Les images, erreurs et interventions de chaque scène sont consignées dans les rapports de performance. Le prototype de changement de support des atlas n'apportait aucun gain confirmé et a été retiré. Ces résultats ne garantissent pas 60 FPS ni une durée de campagne en temps réel sur toute machine.

Les appareils physiques, Windows natif, le son en conditions réelles et une campagne humaine complète nécessitent leurs essais propres. Les mesures cloud ne définissent pas de configuration matérielle minimale. La publication Vercel est confirmée séparément par comparaison HTTPS des fichiers publics à l'archive exacte ; le succès d'un push seul ne suffit pas.

```sh
DEADWALL_SOAK=1 npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:quality
npm run package:web
npm run package:source
```
