# PR #10 — Carnet joueur et qualification 196

Base de cette continuation : `76450f62348688689d219eb89a3b248b7fe5ca41`, sur `main` `ea77f11adde80b55a947a0c9119857670e0b9793` (1.67.0). Le suffixe 196 est un repère technique, pas une version commerciale. Aucune fusion ou publication de production n'est effectuée par cette passe.

## Parcours joueur conservé et précisé

Le départ natif inchangé de 194 crée G10/détail13, écologie et hydrologie actives, avec le profil Régions naturelles par défaut. Continuer et importer conservent les anciennes cartes. Cette continuation ne change ni graine, ni génération, ni coût, ni format de sauvegarde.

Dans le carnet, **Dossiers → Sur le terrain → Opérations** présente désormais un unique sélecteur **Fiche d'action**, classé par activité. Les deux rangées imbriquées de groupes et de familles sont conservées dans l'atelier auteur explicite, mais absentes du parcours joueur. Chaque module enregistré reste accessible, y compris un futur module sans groupe prédéfini. Les mêmes boutons, motifs de refus, coûts, callbacks et propriétaires de simulation restent utilisés. Les actions indisponibles restent consultables dans leur rubrique repliable.

Les archives portent le titre **Archives de campagne**, et la compatibilité le titre **Compatibilité des sauvegardes**, avec la mention **Système**. Ces pages ne sont pas présentées comme des ordres du commandant. Le sélecteur d'opérations n'est pas visible dans la page de compatibilité. Les raccourcis et retours de focus suivent le contrôle visible, jamais un ancien onglet masqué.

L'ordre aux équipes explique le retour exact : fermer le carnet reprend le terrain lorsqu'il était ouvert depuis le jeu ; lorsqu'une pause volontaire existait, le texte indique **retourner à la pause puis Reprendre**. La décision de pause elle-même n'est pas modifiée.

Il s'agit toujours d'une présentation papier semi-diégétique du panneau existant, pas d'un carnet 3D tenu en main. La refonte de chaque sous-menu métier et du HUD de combat reste distincte.

## Qualification : lectures et vrais ordres ne sont pas la même opération

Le parcours navigateur précédent vérifiait l'égalité intégrale de la sauvegarde après avoir envoyé Récolte puis Autonomie. Or `setWorkerOrder` réinitialise normalement la tâche des ouvriers : revenir à Autonomie ne recrée pas leur ancienne cible. Changer le moteur pour satisfaire cette assertion aurait supprimé un effet légitime de l'ordre.

La nouvelle preuve conserve deux assertions strictes :

1. Toutes les consultations de dossiers sont comparées **avant** de donner un ordre : aucun champ persistant ne peut changer.
2. Les deux vrais ordres sont ensuite comparés à leur résultat exact attendu : état et cibles des ouvriers sont réinitialisés, tous les autres champs, stocks, positions, RNG, horloge et carte restent identiques.

Les différences sont consignées par chemin dans le rapport ; aucun groupe de données n'est ignoré ou normalisé arbitrairement. La consultation de compatibilité est comparée au checkpoint pris après ces ordres.

## Régressions de qualification adjacentes

- Le test des inspecteurs de programmes ouvre explicitement `?tools=1&fixture=legacy`. Il garde toutes ses assertions sur les inspecteurs, les données et l'ancienne génération ; le Guide joueur conserve ses tests séparés d'absence d'outils auteur.
- Le vrai HTML autonome, lancé sans paramètres d'atelier, est vérifié en **G10/détail13**, avec eau, écologie et profil équilibré, jusque dans sa sauvegarde et son export. L'ancienne assertion G8 ne correspondait plus au départ joueur demandé. Aucun accès réseau, contrôle d'image ou contrôle de sauvegarde n'est retiré.
- Le montage différé du carnet annule la demande précédente lorsqu’un autre document est chargé avant son exécution. Il ne retient plus tous les anciens mondes jusqu’au prochain tour de boucle. Les tests de la cité restent synchrones et inchangés ; deux contrats protègent l’unicité de la demande et le rejet d’un callback périmé. Aucun pas de simulation, soin, ressource, appel au ramasse-miettes ou seuil de heap augmenté n’est ajouté.

## Preuves et limites

Les résultats finaux sont associés au SHA exact dans la conversation de PR et dans l'archive de livraison. Les tests locaux de la continuation couvrent le sélecteur, les raccourcis, les pages système, les ordres, les imports, la distribution et les anciennes commandes. Le navigateur local refuse la navigation avec `ERR_BLOCKED_BY_ADMINISTRATOR` : aucune validation visuelle locale ni contournement n'est revendiqué. Les vrais parcours Chromium sont exécutés dans GitHub Actions sur `dist` et sur le standalone.

Les échecs antérieurs restent des échecs. En particulier, le contrôle contextuel historique qui attend le rechargement natif après une préparation régionale et la CI exhaustive doivent être lus séparément ; ils ne sont pas déclarés réussis sur la seule base du carnet. Tous les contrôles de la tête actuelle, y compris Windows et les suites natives avec endurance, restent nécessaires avant fusion.


## Premier accès natif, corrigé après observation navigateur

La première qualification de5632f1b a exposé un défaut réel dans les trois formats : cliquer sur l’onglet Dossiers depuis Situation montrait le nouveau sélecteur vide. Les anciens tests ouvraient directement l’API Opérations, ce qui le remplissait. Le sélecteur était donc correctement construit, mais le propriétaire des onglets ne rafraîchissait pas son contenu lors de ce premier accès en pause.

Le propriétaire natif des onglets rafraîchit désormais le dossier effectivement affiché, sans faire avancer la simulation. Les titres et le masquage de l’onglet Archives suivent également la page sélectionnée ; quitter la compatibilité par un onglet normal ferme son mode système. Deux contrats reproduisent les défauts avant correction, puis vérifient le premier clic natif sans raccourci API ni pas de simulation, le retour aux titres du carnet et l’égalité intégrale de la sauvegarde. Les trois profils navigateur conservent leur sélecteur natif et toutes leurs assertions.
