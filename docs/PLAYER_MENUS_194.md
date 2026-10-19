# 194 — Départ actuel et carnet du commandant

Base : `ea77f11adde80b55a947a0c9119857670e0b9793`, version 1.67.0. Le suffixe 194 désigne ce chantier de maintenance, pas une version commerciale.

## Défaut de nouvelle partie

Le bouton natif sélectionnait bien un profil climatique naturel, mais le dernier propriétaire du nouveau monde (`world-pack131`) créait encore une région de génération 8 et de détail 1. Changer de profil n'activait pas le catalogue G10 ni ses aménagements. Ce n'était pas une ancienne sauvegarde chargée par le bouton.

Le parcours natif transmet désormais une intention explicite de contenu actuel : G10 et détail 13, avec les capacités eau/écologie existantes. Le défaut du sélecteur est `balanced`, même si sa valeur n'est pas disponible. Choisir « Paysage historique » ne désactive que le climat 189, pas le contenu courant. Les commandes natives de recommencement conservent ce choix de contenu. Les appels historiques à quatre arguments de `startNew` restent inchangés ; `Continuer` ne convertit aucune carte. Le cinquième argument invalide est refusé avant la remise à zéro des extensions.

## Parcours joueur

Le panneau de commandement existant devient un **carnet présenté à l'écran** : papier, classement par dossiers, boutons originaux et pause conservée. Ce n'est pas un objet 3D tenu physiquement par le personnage.

La page Situation commence par le prochain objectif provenant du propriétaire de jeu existant. Les cinq onglets joueurs sont Situation, Équipes, Doctrines, Dossiers et Journal. Les bilans de campagnes sont accessibles par Pause, hors du parcours d'ordres tactiques. Les dossiers sont regroupés en Terrain, Cité et Guide de survie ; un seul panneau de dossier est visible à la fois, y compris après un raccourci. Les commandes et cartes ne sont pas clonées.

Les opérations impossibles sont repliées dans un groupe « À préparer ou indisponible ici », avec leurs motifs et boutons toujours désactivés. Les commandes réalisables restent au premier niveau. Les callbacks, paiements, portées physiques, autorisations et propriétaires des opérations restent les mêmes.

Les conversions territoriales, le rattrapage du mobilier et la calibration métrique d'anciennes voitures ne sont plus des objectifs proposés au joueur. Elles sont accessibles volontairement par Paramètres et sauvegardes → Compatibilité des anciennes sauvegardes. L'ouverture ne lance aucune conversion, et le dossier rappelle d'exporter la campagne. Le retour conserve la pause antérieure.

Le Guide du joueur montre les connaissances jouables et pilotes, pas les 4 000 programmes auteur ni les laboratoires de plans. Les données et APIs du catalogue restent conservées. En mode joueur, ouvrir une fiche ne publie pas le marqueur qui montait automatiquement le laboratoire d'architecture.

## Outils auteur et tests historiques

`?tools=1` ouvre explicitement l'atelier auteur, signalé dans le titre. Ce paramètre est un choix de présentation, pas une barrière de sécurité ou d'authentification. Le jeu est local et les outils de conception restent disponibles aux développeurs.

Les scénarios anciens qui testent des plans auteur et des documents G8 utilisent explicitement `?tools=1&fixture=legacy`. Leur contrat historique n'est pas rebaptisé « nouveau parcours joueur ». Le harnais partagé et quatre pilotes auteur indépendants enregistrent/utilisent ce choix. Le nouveau pilote **browser-player-menus194.mjs** n'utilise pas ce harnais pour son URL : il vérifie le titre sans aucun paramètre, aucune modification de graine, aucun stock ou point avancé injecté, puis les commandes natives sur trois formats. Sa comparaison de reprise observe le document avant la première image sans le modifier.

Les tests historiques et les tests du nouveau parcours sont distincts. Aucun résultat historique ne suffit à qualifier les nouveaux menus. Le protocole PC autorise explicitement la nouvelle feuille de style, sans élargir l'accès à des fichiers arbitraires. Le build et le précache incluent le module et sa feuille exactement une fois.

## Vérification et limites

Les journaux de chaque tentative sont conservés. Les compteurs annoncés dans la PR correspondent aux exécutions terminées, pas au nombre de tests écrits. La navigation du navigateur local est refusée par `ERR_BLOCKED_BY_ADMINISTRATOR` ; aucune tentative de contournement. Les captures de qualification sont produites sur `dist` par GitHub Actions.

Cette passe ne refait pas chaque sous-écran métier et ne certifie pas l'absence universelle de chevauchement. Elle conserve les systèmes de faune, élevage, météo et missions de la 1.67. Les limites artistiques, la peinture intermittente de glyphes déjà documentée, les intérieurs libres et le multijoueur restent distincts. Les contrôles exhaustifs avec endurance, la distribution Windows et la revue du commit final restent nécessaires avant fusion.
