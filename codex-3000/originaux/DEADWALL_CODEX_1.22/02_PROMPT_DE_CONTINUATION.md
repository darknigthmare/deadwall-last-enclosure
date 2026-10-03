# Consigne pour une prochaine génération / implémentation

Travaille sur les sources réellement fournies de DEADWALL. Lis AGENTS.md, le manifeste courant, le rapport QA et `00_LIRE_AVANT_GENERATION.md`. Choisis une fiche `DW-xxxx` et annonce son statut réel avant de modifier quoi que ce soit.

Implémente un lieu complet et cohérent, pas son seul nom : parcelle desservie, volumes, niveaux pris en charge, pièces, voies de service, colliders, ouvrants, escaliers, mobilier, contenants et états d’abandon. Les dimensions du catalogue sont des fourchettes de design : réalise un budget d’espace compatible et refuse une parcelle trop petite. Ne réduis ni voitures ni passages pour faire tenir le programme.

Utilise des graines séparées de celles du combat. Partage les transformations entre rendu, collision, sélection et interactions. Donne aux instances et contenants des identifiants stables. Préserve tous les prélèvements et toutes les données des anciennes campagnes ; une migration ne fournit pas de ressources gratuites. Si le nouveau plan ne conserve pas les emplacements anciens, écris et teste une migration explicite.

N’altère pas la boucle du refuge et les systèmes existants pour masquer un problème régional. Ne retire ni expéditions, ni batteries, ni contrôle de mirador, ni rechargement actif, ni journal, ni collisions pour faire passer un test. N’étends pas seulement une constante de taille si les caches, chemins, sauvegardes et coordonnées restent dimensionnés à l’ancien monde.

Teste au moins trois graines et quatre parcours distincts : exploration prudente ; récupération motorisée ; accès vertical et état dégradé ; tactile / import / reprise. Distingue les fixtures préparées des trajets réellement joués. Vérifie les murs et meubles, les stocks, le retour au dépôt, la nuit, les frontières de secteurs et l’absence d’action à distance. Exécute la suite générale et les régressions antérieures.

Livre le projet complet réellement reconstruit, un HTML jouable si la distribution le permet, un rapport avec captures du moteur et les limites de validation. Mets à jour la fiche avec un statut vérifiable, son plan source et la couverture exacte. Ne transforme jamais « conception » en « intégré » sur la seule base d’un tableau ou d’une capture de maquette.

Le codex demeure un outil de développement externe. Aucun bouton de debug, catalogue d’archétypes administrateur ou identifiant technique ne doit être ajouté à l’interface publique du jeu pour faciliter les tests.


## Complément 1.18

Lire `05_RELAIS_1.18.md` avant toute évolution des stocks, du coffre, des soins ou des aménagements de contenants. La 1.18 ne crée aucun nouveau plan : les 42 liaisons pilotes et les anciennes générations sont conservées.
