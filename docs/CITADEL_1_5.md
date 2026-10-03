# La Cité coordonnée — spécification livrée 1.5

## Intention
Compléter la journée et le commandement sans remplacer le combat ou les systèmes historiques. L’extension relie unités, logements, stocks, exploration, navigation, chantiers, tirs automatiques et journal de campagne. Elle ne modifie ni la taille des vagues, ni la santé des infectés, ni les dégâts d’armes.

## Contenu et équilibrage
Les règles sont dans `DeadwallCitadel.RULES`, chargé avec `core.js` et exposé par `DeadwallCore.CITADEL_RULES`. Les bâtiments sont installés dans le catalogue historique et leurs coûts restent utilisés par la construction ordinaire.

| Appel / secteur | Métier | Conditions | Coût unique |
|---|---|---|---|
| Élise Morel / housing | Ouvrier | Refuge | 8 nourriture, 1 médicament |
| Rachid Bensaïd / market | Ouvrier | Refuge | 8 nourriture, 1 médicament |
| Léa Vasseur / aid | Secouriste | Avant-poste + clinique | 12 nourriture, 4 médicaments |
| Pavel Costa / industry | Ingénieur | Avant-poste + atelier | 12 nourriture, 12 ferraille |
| Aïcha Laurent / transit | Ouvrier | Camp fortifié | 10 nourriture, 2 carburant |
| Gabriel Klein / checkpoint | Fusilier | Camp fortifié + caserne | 10 nourriture, 15 munitions |

La distinction littéraire entre les trois ouvriers n’ajoute pas de capacité mécanique cachée. Aucun camion n’est attribué à Aïcha. La fabrique utilise les quatre classes d’unités existantes et leurs paramètres. Chaque appel est unique, non répétable après succès ou perte.

Découverte personnelle : 280 unités, avec ligne libre. Relais : 720 unités, terminé, alimenté et non neutralisé par l’incendie. Contact : 105 unités, au calme, commandant vivant, accès physique libre et aucune menace visible à moins de 125 unités du signal ou du joueur. Escorte : distance de suivi 65 ; arrivée sécurisée à moins de 72 unités du centre avec accès libre. Un infecté visible à moins de 90 unités déclenche un retour. Les mises à jour d’escorte bornent le pas à 0,25 seconde ; les appels sont réexaminés toutes les 0,5 seconde de simulation.

| Structure | Coût | Intégrité / chantier | Fonction |
|---|---|---|---|
| Maison d’accueil | 100 bois, 40 ferraille, 20 nourriture | 850 / 30 unités de travail | 4×3 cases, 10 logements, Camp fortifié, score 6 |
| Relais radio | 35 bois, 80 ferraille, 5 carburant | 620 / 24 unités de travail | 2×2 cases, 2 unités électriques, générateur terminé, Camp fortifié, score 5 |

Les deux sont combustibles selon leur matériau. Leur destruction passe par le moteur ordinaire. Pas de ressources gratuites, de soin automatique ou de remise en état à l’achèvement.

## États et responsabilités
Appel `waiting` non repéré → repéré → `follow`, `hold` ou `return` → `delivered` ou `lost`. Les trois états d’escorte retiennent un `unitId` réel. Après arrivée, `citizenId` retient l’identité historique et `unitId` est vidé. Un décès ultérieur n’efface pas l’arrivée passée, mais la fiche ne présente plus ce résident comme actif.

Les escorts sont évaluées avant les tâches ordinaires, les secours incendie et les détachements de quartier. Un ordre général de repli ou le commandant à terre prévaut sur attendre/suivre. Les voies bloquées ne sont jamais remplacées par une téléportation. Les réserves de nourriture, logements et santé sont celles du jeu, pas des variables parallèles au sauvetage.

## Chantiers
128 suspensions maximum. Suspension/reprise ne financent ni ne remboursent le chantier. La méthode `work` est bloquée et `WorldMap.incomplete` ne retourne plus les chantiers suspendus. Les ouvriers déjà occupés sont libérés de la cible. Les bâtiments restent présents dans la grille, endommagés et destructibles. Le centre ou un bâtiment terminé ne sont pas suspendables. Priorité haute utilise la valeur historique 3. L’interface affiche 12 dossiers par page et des unités de travail, pas une durée prétendument garantie.

## Défense
Réserve : entier 0–200, zéro par défaut. Le prochain tir automatique n’est autorisé que si `stock - coût >= réserve`. Le coût normal reste ensuite débité par le moteur original. Le joueur peut recharger/utiliser cette réserve, et les commandes de construction/recrutement restent libres de la consommer. Il ne s’agit pas d’un second stock physique.

Trois consignes de section : `mobile` ou `hold`, indépendamment pour ALPHA/BRAVO/CHARLIE. Au-delà de la distance de tir d’avance historique, `hold` rejoint son point de formation au lieu de poursuivre la cible. Le repli de section reste prioritaire. Les tirs et le combat rapproché à portée conservent leurs règles antérieures.

## Registre nocturne
Observation à l’alerte, ou partielle lorsqu’elle commence dans un assaut importé. Fin à la sécurisation ou à la chute du centre. Dix nuits maximum. Deltas de kills, unitsLost, buildingsLost, shots, rescued, escortLosses, ignitions, extinguished. Une reprise ne double pas les compteurs. Aucun paiement au chargement, à la consultation ou à la fermeture du bilan. Les morts après retour sont des pertes d’équipiers, pas de nouvelles pertes d’escorte.

## Architecture et migration
`citadel.js` : données, machine d’états, compteurs et validation pure. `citadel-save.js` : références croisées avant restauration. `citadel-runtime.js` : adaptateurs du jeu, tracés procéduraux et appels aux méthodes de navigation/construction. `citadel-ui.js` : panneaux, clavier, boutons tactiles et réinitialisation des fiches lors d’une autre campagne. `upgrade.js` : ancrages exacts et uniques dans les sources historiques ; refus sur base divergente.

Save v7 ; migrations des formats 1 à 6 via les validateurs précédents. Aucun registre d’extension antérieure n’est perdu. Les IDs d’unités actives et d’anciens résidents ne peuvent être réutilisés entre appels. Les références à une unité morte/absente ou simultanément affectée à un quartier/secours sont refusées pour les escortes actives. Une identité historique arrivée peut ne plus figurer dans l’effectif, puisqu’elle peut avoir été perdue plus tard.

Les bilans futurs, un début de nuit postérieur à l’horloge et les chantiers suspendus achevés/absents sont refusés. Fichier maximal : 8 Mio UTF-8. L’extension respecte la limite historique de 10 000 unités et la borne des identifiants.

## Éléments non livrés
Pas de cartes supplémentaires, pas de dialogues à embranchements, pas de PNJ errants indépendants avant contact, pas de portraits peints, pas de simulation acoustique radio, pas de nouveau métier, pas de synchronisation multijoueur. Pas de preuve d’équilibrage long terme ou de fluidité de la mégacité tant que le vrai moteur complet n’a pas été exécuté avec cette pile.
