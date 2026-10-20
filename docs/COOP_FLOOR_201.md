# Présence coopérative et étages de D-17

Une montée réelle de l’escalier local portait le commandant à 6 m, mais le client coopératif lisait encore l’altitude régionale stationnée à 0 m. La reproduction utilise le document complet et un support payé par le contrôleur natif ; âge, ressources et prérequis sont préparés explicitement. Il ne s’agit pas d’une progression humaine naturelle.

En ville, le paquet de présence utilise désormais les coordonnées physiques du commandant, l’altitude du contrôleur vertical et l’identité du support `D17:<id>`. Les expéditions conservent leurs coordonnées régionales. Deux supports à la même altitude restent deux surfaces distinctes. Descendre, changer de support ou perdre l’identité de la carte masque immédiatement les anciens contacts ; une carte redevenue disponible exige un nouvel accusé de réception du relais.

Les échanges restent limités aux positions et aux repères. Ce changement n’ajoute aucune synchronisation autoritaire des ressources, des combats ou des constructions. Aucun nouveau champ de sauvegarde ni coût n’est introduit.

Vérification ciblée : `coop-floor201`, `undercovered200-coop`, `coop-relay154`, `audit185-coop`, `undercovered200-relay` et `coop-ui154` : 25 tests réussis, aucun échec, ignoré, annulé ou todo. Les tests 201 utilisent une socket simulée et vérifient les transactions natives d’escalier ainsi que la conservation intégrale de la sauvegarde. Les tests de relais existants exercent leurs sockets réelles. Ces résultats ne remplacent pas la qualification du commit final.
