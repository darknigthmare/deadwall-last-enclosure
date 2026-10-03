# Interventions et barricades — corrections 1.37

## Défauts reproduits et corrigés

### Un moteur en cave ne produisait aucun appel sonore pour les infectés

Le groupe électrogène de la cave de `P0479` sur la graine G6 `17117` fonctionnait, consommait du carburant et affichait sa contrepartie sonore. Pourtant, l'infecté réellement généré `P0479:e2`, installé sur une position libre à un mètre du moteur dans la fixture de contrôle, restait au repos. Le transmetteur fournissait l'identifiant `poi`, alors que le lecteur auditif vérifie `inside` pour les niveaux différents de zéro.

`interventions134` fournit désormais le contexte intérieur de la source au lecteur existant. L'infecté passe en investigation et vise les coordonnées du moteur. Aucun nouveau système de bruit, rayon, dégât ou coût n'est introduit. Le contexte permet au lecteur existant de conserver sa séparation par bâtiment et par étage.

### Une fouille pouvait progresser pendant la pose d'une barricade

Sur la porte réelle de `P0002`, une position libre permet également d'atteindre le canapé du séjour. Demander la fouille avec E ajoutait 0,12 bois au sac pendant que la pose progressait de 0,04 seconde. Deux tâches manuelles avançaient donc simultanément.

E interrompt maintenant pose, réparation ou démontage de barricade. Les matériaux n'étant engagés qu'à l'achèvement, l'interruption ne prélève rien et ne rembourse rien. La fouille reste une action normale du moteur. Une nouvelle pose peut ensuite être lancée ; son coût est prélevé exactement une fois lorsqu'elle aboutit. Les collisions persistantes demeurent dérivées de l'ouverture existante.

## Raccords contrôlés

- Les 36 tableaux associés aux générateurs de la graine G6 `17117` disposent d'une approche physiquement libre et d'une ligne d'interaction valide. C'est un échantillon d'une graine, pas une preuve exhaustive de toutes les cartes.
- Révision et ravitaillement utilisent des fournitures transférées depuis le dépôt avant le déplacement de la fixture vers le site.
- Groupe et tableau de cave alimentent les lumières du niveau concerné. Le rez-de-chaussée reste éteint tant que son propre tableau n'est pas rétabli.
- Le lave-linge réel est sélectionné et fouillé avec E : son prélèvement est multiplié par 1,25 lorsque l'étage est alimenté. L'arrêt du moteur retire immédiatement lumières et bonus, puis conserve le carburant restant.
- Le carburant, le stock fini prélevé, la barricade construite et son blocage survivent à la sauvegarde/reprise.
- Les tests antérieurs gardent les vérifications de menace, panne, pause, cannibalisation, destruction du support, verrou réel, coûts, tirs et étages.

## Vérification et limites

`tests/energy137.test.cjs` ajoute trois scénarios en chargeant les scripts dans l'ordre réel de `index.html`. Les fixtures utilisent des lieux et objets générés, des positions physiquement libres et des sauvegardes validées. Elles préparent les positions et menaces nécessaires ; elles ne prétendent pas remplacer le trajet humain jusqu'au site.

La première passe ciblée a réussi ses 40 tests. La passe finale des trois nouveaux scénarios a réussi 3/3 ; deux scénarios étaient déjà compris dans les 40. Les journaux avant/après sont conservés dans `reports/1.37.0/`.

Ces contrôles exécutent la simulation avec le DOM de test. Ils ne certifient pas l'agencement CSS dans un navigateur réel ni une cadence d'images. Le contrôle global de livraison est effectué séparément par la passe d'intégration.

## Compatibilité

Aucun changement de version de sauvegarde, de schéma des registres, de coordonnées, d'identifiants G6, de ressources ni de constantes d'équilibrage. Les deux corrections s'appliquent aux campagnes reprises.
