# Logistique et gestes concurrents — 1.38

Cette passe corrige les transactions matérielles accessibles depuis plusieurs interfaces, sans changer les coûts, les capacités, les rendements, les générations G1–G6 ni le format général v20 des sauvegardes.

## Défauts reproduits et corrections

| Parcours réel | Comportement reproduit en 1.37 | Correction 1.38 |
| --- | --- | --- |
| Recharge, puis inventaire et prélèvement au dépôt | Le sac recevait du matériel pendant la recharge. | `loadout.transfer` revérifie la recharge avant toute mutation des deux réserves. |
| Recharge, puis trousse ou assemblage essentiel | Le soin ou le chronomètre d'assemblage pouvait commencer avec les mains occupées. | Le contrôle commun de disponibilité des services essentiels refuse la recharge. |
| Devis de déplacement d'une maison, puis assemblage au dépôt | L'ancien devis pouvait encore déplacer la structure et payer les matériaux pendant le travail manuel. | La disponibilité du commandant est vérifiée lors de la proposition et de sa confirmation. |
| Blessé et commandant sur deux côtés accessibles d'une maison pleine | Une trousse soignait à travers le bâtiment, car le contrôle ne considérait que les enceintes. | Le soin local utilise le contrôle de ligne physique commun de l'équipement nocturne, incluant bâtiments et obstacles du monde. |
| Recharge, puis boutons du bureau d'expédition | `SAC → COFFRE` contournait le contrôle de l'inventaire ; les autres opérations matérielles partageaient la même omission. | Chargement, livraison, ravitaillement et réparation refusent recharge, intervention concurrente et conduite avant de toucher aux ressources. |

Les lectures et les devis restent sans prélèvement. Les gestes refusés conservent sac, coffre, réservoir, santé et stocks. Le montage d'un kit continue à vérifier les matériaux disponibles pendant le travail ; une pénurie interrompt l'assemblage sans créer le kit. Le travail ne fige pas la consommation de nourriture de la colonie.

## Vérification

`tests/logistics138.test.cjs` utilise `scripts/qa-startup134.cjs`, donc les scripts de l'HTML livré dans leur ordre réel. Les placements de structures et les points de service de test sont contrôlés par la géométrie de production. Les boutons `expCargo`, `expUnload`, `expRefuel` et `expRepair` sont réellement montés et activés dans le DOM simulé.

Les huit scénarios couvrent les défauts ci-dessus et vérifient aussi :

- une seule dose de soin en région, quantité annoncée exacte et persistance de la ceinture ;
- reprise d'un travail inachevé sans kit créé ni prélèvement anticipé ;
- assemblage terminé payé exactement une fois et interruption si une autre consommation épuise les médicaments ;
- capacité du coffre, dépôt partiel de 0,25 portion et conservation du reliquat ;
- perte réelle de la cargaison et du carburant à la destruction du véhicule, puis reprise sans restitution ;
- transfert fractionnaire après la fin réelle d'une recharge, avec progression de `Game.update` et consommation normale de la colonie.

Le soupçon initial de double soin régional n'est **pas** un défaut reproduit : `regionAbsent` exclut le joueur de la boucle locale, puis la branche régionale applique une dose. Cette logique reste inchangée ; le scénario la protège contre une régression.

Journaux conservés dans `reports/1.38.0/` :

- `logistics-before.log` : quatre échecs reproduits, un contrôle régional déjà conforme ;
- `logistics-extra-before.log` : contournement de coffre reproduit par le bouton existant ;
- `logistics-targeted.log` : 136 tests ciblés réussis, comprenant les suites historiques des modules modifiés ;
- `logistics-after.log` : huit scénarios définitifs réussis dans l'ordre HTML complet.

Cette preuve est une intégration sous DOM simulé. Elle ne certifie ni le rendu CSS dans un navigateur, ni une campagne jouée manuellement. La vérification globale `npm run check` relève de l'intégration finale de la livraison.
