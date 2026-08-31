# Retours de récolte et de dépôt

Passe ciblée du 31 août 2026, après la livraison des quatre départs.

## Défauts reproduits et corrigés

- Le premier objectif affichait brièvement la récolte portée, puis revenait au total déposé à chaque recalcul des métriques. Son compteur suit désormais exclusivement les dépôts effectifs, manuels ou ouvriers. Récolter sans rapporter ne le fait plus osciller ; la récompense reste unique.
- Un sac contenant une ressource saturée déclenchait toujours « Déposer », même quand aucun transfert n'était possible. Cette action vide pouvait masquer un chantier, une autre ressource ou un relevé narratif accessible. Le dépôt garde maintenant la priorité seulement lorsqu'une quantité peut réellement entrer en réserve.
- Le libellé du dépôt tient compte de la place disponible pour chaque ressource, et non du volume total du sac. Les fractions inférieures à une unité restent transférables et sont annoncées explicitement. Un dépôt saturé affiche son état seulement si aucune autre interaction n'a la priorité.

Les reliquats restent dans le sac. Les coûts, rendements, capacités, distances, obstacles et récompenses ne changent pas. Aucun champ de sauvegarde n'est ajouté et aucune ressource n'est accordée au chargement.

## Vérification ciblée

`tests/interaction-feedback.test.cjs` couvre huit cas : compteur pendant une vraie succession de pas de simulation, dépôt et récompense unique, sauvegarde/reprise, sac mixte avec excédents, transfert fractionnaire, chantier proche d'un dépôt plein, récolte accessible, vrai relevé narratif près d'un entrepôt et priorité historique d'un dépôt utile.

Commande exécutée avec succès : `node --test tests/interaction-feedback.test.cjs tests/physical-interactions.test.cjs tests/progression.test.cjs tests/runtime.test.cjs tests/strategic.test.cjs` — 58 tests réussis.

Les tests spatiaux utilisent des positions, stocks et structures préparés en mémoire pour isoler les interactions. Ils ne constituent ni une évaluation de l'équilibrage humain, ni une vérification visuelle du navigateur. Les contrôles globaux de publication sont distincts.
