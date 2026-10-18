# Cueillette et ramassage — extension 193

La cueillette complète les sorties dans la région : repérer un petit lot, s’en approcher à pied, rester exposé pendant le ramassage, puis rapporter son contenu au dépôt. Les gains entrent dans le sac du commandant. Aucun ouvrier, entrepôt ou bâtiment ne reçoit de ressources à distance.

## Accès au carnet

Les nouvelles campagnes commencent avec le carnet actif. Une sauvegarde antérieure, dépourvue du registre, le garde inactif : elle ne reçoit aucun lot déjà récolté ni redistribution de ses anciens gisements.

Pour activer le carnet dans une ancienne campagne compatible, rejoindre le centre de D-17 à pied, par un accès libre, et transporter **4 rations dans le sac**. La préparation consomme ces quatre rations une seule fois ; le dépôt ne paie pas. Il faut un commandant vivant, les mains libres et aucun infecté local menaçant le dépôt par une ligne libre dans le rayon de service. Il n’existe pas de commande pour désactiver puis réactiver le carnet afin de renouveler les lots.

Le système exige une région G8, G9 ou G10, avec écologie 1 et hydrologie 1. Il accepte le paysage classique ainsi que les profils Régions naturelles, Grands biomes et Mosaïque naturelle. Il n’ajoute pas de cueillette aux anciennes géographies ou aux étages.

## Les seize ramassages

Les quantités ci-dessous sont des unités abstraites du jeu, pas des kilogrammes ni un nombre exact de fruits dessinés. Le lot entier doit tenir dans le sac.

| Ramassage | Ressource | Lot fini | Travail actif | Milieux caractéristiques |
| --- | --- | ---: | ---: | --- |
| Ronce à mûres | Nourriture | 3–6 | 5 s | Bocage, lisières, friches et terrasses |
| Prunellier | Nourriture | 2–4 | 5 s | Haies, prairies, collines calcaires |
| Églantier à cynorrhodons | Nourriture | 2–4 | 6 s | Haies, landes sèches, friches et plateaux |
| Noisettes au sol | Nourriture | 3–5 | 6 s | Bocage, feuillus et forêt mixte |
| Noix au sol | Nourriture | 4–7 | 7 s | Vergers, bocage et terres agricoles |
| Châtaignes au sol | Nourriture | 4–7 | 7 s | Feuillus, forêt mixte et certaines pinèdes |
| Pommes tombées | Nourriture | 4–7 | 6 s | Vergers, bocage et plateaux agricoles |
| Poires tombées | Nourriture | 3–6 | 6 s | Vergers, bocage et terrasses |
| Prunes tombées | Nourriture | 3–6 | 6 s | Vergers et haies agricoles |
| Framboisier de lisière | Nourriture | 2–4 | 5 s | Lisières, forêt mixte et fonds frais |
| Myrtillier | Nourriture | 2–4 | 6 s | Conifères, pinèdes, landes et fonds tourbeux |
| Fraisier des bois | Nourriture | 1–3 | 5 s | Feuillus, lisières, bocage et prairies |
| Girolles identifiées | Nourriture | 1–3 | 7 s | Feuillus, forêt mixte et conifères |
| Cèpes identifiés | Nourriture | 2–4 | 7 s | Milieux forestiers compatibles |
| Branches sèches ramassables | Bois | 2–4 | 4 s | Les seize milieux, surtout boisés |
| Silex de surface | Pierre | 1–3 | 4 s | Calcaire et certains sols agricoles ou alluviaux |

Les poids exacts et les autres milieux admissibles se trouvent dans `Forage193Rules.species`, dans `src/core.js`. Ces ramassages ne produisent ni eau potable, ni médicament, ni viande, ni objet d’arsenal. Les champignons sont déjà identifiés par le jeu ; il n’existe pas de mécanique de reconnaissance botanique, d’intoxication ou de cuisson propre à cette extension.

## Placement et épuisement

Chaque cellule régionale de 256 m porte au maximum seize candidats potentiels, numérotés de 0 à 15. La graine, le profil de paysage et l’identifiant `F193_cx_cy_slot` déterminent présence, position, espèce, quantité, orientation et variante. La présence reste probabiliste : aucun secteur ne garantit les seize espèces ou un nombre minimal de lots. Le générateur ne consomme pas le hasard des combats.

L’eau naturelle, les tabliers de pont, l’emprise complète du petit lot sur une berge, les chaussées publiques et le dégagement de D-17 refusent un candidat. Les réserves des lieux, leurs dessertes et les obstacles physiques courants refusent ensuite son apparition. Un refus ne déplace pas le lot ailleurs. Les réserves et obstacles ajoutés par une extension de lieu peuvent le masquer ; ils ne changent pas l’identité d’un ancien prélèvement.

Un ramassage achevé épuise définitivement son identifiant dans cette campagne. Quitter le secteur, sauvegarder, reprendre ou ajouter des détails au monde ne le fait pas repousser. Le plafond de 18 432 identifiants borne l’historique des prélèvements ; il n’est égal ni au nombre de candidats potentiels, ni au nombre de lots accessibles ou visibles. Une nouvelle campagne commence avec son propre historique.

## Faire le travail sur place

Le dossier **Cueillette & ramassage** présente jusqu’à huit lots proches parmi ceux actuellement visibles. Le rayon de recherche est de 22 m ; la vision alliée et les obstacles peuvent réduire ce qui apparaît. Les refus indiquent notamment la distance, le sac plein ou une menace.

Il faut être à moins de **1,8 m du point du ramassage**, au sol, à pied, sans rechargement, placement ou autre manipulation en cours. Le commandant et le lot doivent rester physiquement accessibles avec une ligne de mouvement dégagée. Un infecté vivant en ligne libre à moins de **12 m** empêche le travail. Les contacts ordinaires, membres des hordes sauvages et réanimés utilisent ce même contrôle.

Le début du ramassage émet un petit bruit régional. Après les 4 à 7 secondes de travail actif, un seul engagement final ajoute le lot au sac, retire **4 points d’endurance** et marque le site épuisé. L’endurance et la place du sac sont revérifiées avant ce paiement. Le compteur de récolte observe ce gain personnel ; il ne constitue pas un second stock.

Bouger de plus de 12 cm, tirer, lancer une interaction concurrente, subir une blessure ou perdre le domaine régional interrompt le travail. Les commandes de déplacement interrompent aussi l’action, même lorsque le personnage ne franchit pas un obstacle. Une interruption ne donne aucun lot et ne prélève pas les quatre points d’endurance de fin. Pause et modales suspendent l’avancement. Une tâche inachevée est abandonnée à la reprise d’une sauvegarde ou au retour au menu.

## Petits décors et animation

Les seize éléments ont des dessins procéduraux originaux et quatre variantes cosmétiques chacun. Noix et fruits d’arbres sont représentés **au sol**. Les baies utilisent de petites touffes ou des buissons bas ; aucun pommier, poirier ou noyer de plusieurs mètres n’est ajouté sans collision correspondante. Ces petits décors restent passables et ne constituent pas un couvert, un tronc à abattre ou une construction.

Les dimensions métriques viennent du même catalogue que le générateur. Les dessins partagent la profondeur et la visibilité du monde régional. Pendant un vrai travail, un geste de mains séparé et une petite animation du ramassage lisent la tâche courante. Un lot au repos ne mime pas une récolte. Le réglage de mouvement réduit supprime les oscillations ; il ne change ni durée ni rendement. Les variantes ne changent pas les quantités.

## Sauvegarde et portée des vérifications

Le propriétaire est le module `forage193` du registre d’extensions existant. Il conserve sa version 1, l’activation et les identifiants épuisés. La validation refuse doublons, formats étrangers, dépassements et identifiants absents du monde de la sauvegarde avant de remplacer la campagne. La tâche et les poses de mains restent transitoires. Aucun nouveau propriétaire de nourriture, bois ou pierre n’est créé.

Le générateur garde au plus 1 024 origines statiques par monde, avec éviction des moins récemment consultées. Un changement de règles, de graine, de profil ou de fournisseur géographique invalide ce cache. Les collisions et accès courants ne sont jamais accordés depuis ce cache : ils sont recontrôlés au moment du travail.

`tests/forage193-generation.test.cjs` couvre notamment les seize milieux, le hasard indépendant, les dimensions, les refus physiques, l’éviction du cache et la stabilité réelle des identités entre G8, G9 et G10. Ses neuf cas natifs ont été exécutés avec succès avec les seize candidats par cellule. Les neuf cas natifs de `tests/forage193-runtime.test.cjs` et `tests/forage193-art.test.cjs` ont également réussi avec cette configuration : paiement, interruption, reprise et vrais pixels des variantes. Ces résultats sont distincts des parcours navigateur et de la validation globale de la livraison.

Cette documentation décrit les fonctions raccordées et leurs règles. Elle ne mesure pas une campagne humaine de 6 à 10 heures, la fréquence d’images sur un téléphone physique ou une recette botanique réaliste. Le contrôle global du dépôt et de la distribution reste celui de `npm run check` et des parcours navigateur de la livraison.
