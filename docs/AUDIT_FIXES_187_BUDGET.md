# Qualification 187 — Budget du contrôle exhaustif de mobilier

Le contrôle `DEADWALL authored furniture completion / contracts` du commit `cdb15cd203f435ed613e745a21692bd20bb35bf9` (run `38952039316`, job `117145547999`) a terminé ses **257 tests** avec zéro échec, annulation, test ignoré ou TODO. Il a ensuite lancé `audit-fill168.mjs`, mais le job a été annulé après vingt minutes, avant la fin du catalogue. Le reçu partiel n'est pas une qualification du catalogue complet.

Cette suite exécute maintenant beaucoup plus de contrats qu'au moment où la limite de vingt minutes a été fixée. Le budget du seul job `contracts` est porté à **45 minutes**. Les deux commandes restent intégrales, dans le même ordre, avec leur code de sortie conservé. Aucun profil n'est filtré, aucune comparaison supprimée, aucun `continue-on-error` ajouté. Le job navigateur garde son budget et ses scénarios.

Le contrôle supplémentaire `tests/audit187-furniture-budget.test.cjs` protège ce budget borné, les deux commandes intégrales, les contrôles de révision et la conservation des preuves. Il a refusé la configuration précédente puis accepté la nouvelle. Ce test de configuration ne remplace pas l'exécution réelle du catalogue.

Aucun fichier livré du jeu n'est changé : uniquement le workflow, un test et cette note. Le numéro de version commerciale et le format des sauvegardes restent inchangés. Les **4 935 tests** et les parcours navigateur réussis du commit parent demeurent des résultats du parent ; ils ne sont pas annoncés comme exécutés à nouveau tant que la nouvelle tête n'est pas qualifiée.

Le changement ne rend pas les calculs plus rapides : il empêche une interruption prématurée. Le test final global et les workflows spécialisés restent nécessaires avant fusion. Aucune fusion automatique ni contournement de protection n'est effectué.
