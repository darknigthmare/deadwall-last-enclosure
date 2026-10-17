# Maintenance 184 — mises à jour PWA, rendu et lecture de campagne

Suite de la PR #8, depuis `d24dadd43b46fc176defa564193f02ffa27ce3d6`. Le suffixe 184 est un repère de maintenance, pas une version commerciale 1.84. Les coûts, dégâts, âges, cartes et propriétaires de sauvegarde restent ceux de la campagne.

## Cache de livraison

Le worker source conserve un repère explicite `deadwall-v1.65.0-audit184`. Le build ajoute une empreinte SHA-256 dérivée de la liste triée des fichiers publics, de leurs longueurs et de leurs octets, y compris les images facultatives et le worker source. Ainsi une correction de code, de CSS ou de données renouvelle le worker distribué, même lorsque `package.version` ne change pas. Le calcul est reproductible, sans date ni chemin de checkout, et n’écrit pas dans le worker source. Les scripts serveur et fichiers de pilotage ne deviennent pas des ressources publiques.

L’installation atomique, le cache des fichiers installés et l’activation existante du worker sont conservés. Une installation incomplète n’est pas présentée comme réussie. Ce changement n’efface pas localStorage, n’altère aucune sauvegarde et ne régénère pas une carte héritée. Il ne force pas le rechargement d’une partie en cours. Le serveur de développement des sources utilise le repère manuel ; l’empreinte automatique concerne `dist` et les distributions qui l’emploient.

## Vue FPS et commandes

Un dessin FPS réussi ne redessine plus préalablement le terrain 2D intégral qui est masqué par cette vue. La boucle de simulation n’est pas suspendue ; le rafraîchissement auxiliaire de terrain reste raccordé. Si WebGL manque, échoue au dessin ou est perdu, la vue classique est redessinée dans le même appel et les propriétaires du tir sont relâchés. Les compteurs `classicPaints` et `fpsPaints` sont des diagnostics de chemin de rendu, pas une mesure de fluidité sur téléphone.

Le déclencheur explicite distingue maintenant Space, Enter et Entrée du pavé numérique : relâcher l’une ne libère pas une autre touche maintenue. Il suit aussi le masque des boutons pour les combinaisons de souris. Relâcher le bouton principal coupe le tir même si le bouton droit reste enfoncé. Cela utilise les Pointer Events, pas les événements souris de compatibilité qui peuvent être supprimés. Le canvas de visée utilisait déjà ce masque ; ce comportement est conservé et testé. Les pertes de focus, captures annulées, modales, décès, document masqué et départ en région conservent leurs barrières de sécurité.

## HUD et carte sauvegardée

En paysage compact, Actions à proximité participe à l’exclusivité des tiroirs Situation, Carte et Matériel. Les vraies commandes restent présentes ; une pause ferme les tiroirs et restaure l’ouverture précédente sans mutation de la campagne. La disposition haute conserve son fonctionnement.

Le menu Pause ajoute le dossier repliable **CARTE DE CETTE CAMPAGNE** : graine, génération régionale, révision de détail, écologie et hydrologie sont lues dans la campagne en cours. Les révisions historiques absentes s’affichent à zéro. Un texte distingue le terrain hérité d’une nouvelle campagne avec hydrographie et rappelle où consulter les compléments compatibles. Lire ou replier ce dossier ne déclenche ni migration, ni extension, ni distribution de butin.

## Vérifications

Les tests `audit184-pwa`, `audit184-ui` et `audit184-hud` s’ajoutent aux contrôles 183. La distribution isolée reconstruit le worker attendu depuis les sources et compare ses octets. Les parcours navigateur sont exécutés sur le vrai `dist`, avec revue du dossier sur trois formats et contrôles des commandes WebGL. Le scénario avancé de citadelle conserve sa fixture déclarée ; ce n’est pas une campagne naturelle.

`browser-pwa184.mjs` emploie les handlers du worker réel et le calcul d’empreinte, sur une fixture minimale explicitement déclarée : installation A, installation B volontairement incomplète, préservation de A, installation B complète puis reprise hors ligne. Il contrôle la conservation d’un témoin de sauvegarde et d’un cache d’une autre application ; ce n’est ni un téléchargement complet du jeu ni un test des quotas d’un appareil physique.

Les résultats, versions et empreintes sont consignés dans la PR et ses artefacts, après exécution. Le contrôle global reste `DEADWALL_SOAK=1 npm run check`. Une suite ciblée verte ne qualifie pas à elle seule ce contrôle global. Les capsules de sources du workflow en lecture seule incluent la fixture historique G5 requise par les tests ; les assets sont identifiés par leurs blobs Git sans duplication.

Restent à poursuivre : allègement artistique et général du HUD, dessin FPS détaillé, réduction du poids du Codex, intérieurs libres des accès verticaux, vie civile individualisée, économie aquatique et chasse, multijoueur partagé et campagnes humaines longues. Aucune fusion ni publication production n’est effectuée par cette maintenance.
