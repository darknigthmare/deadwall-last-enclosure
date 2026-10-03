# Commandes — 1.37

Le zoom tactile et la molette ne changeaient que la caméra locale, même lorsque la région était affichée avec une échelle distincte. Le scénario `tests/zoom137.test.cjs`, chargé dans l’ordre HTML livré, reproduit ce défaut avant correction puis vérifie le rapprochement régional, le retour au niveau initial, les bornes 12–44, la préservation de la caméra locale et le verrou modal.

`Game.zoomView(factor)` fournit maintenant une commande commune aux deux entrées. Il conserve les limites locales 0,52–1,65 et régionales historiques. Les données de campagne ne sont pas modifiées. Vérification d’événements avec DOM simulé, pas de test tactile matériel.
