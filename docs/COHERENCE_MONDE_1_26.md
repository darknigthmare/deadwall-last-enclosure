# Cohérence du monde et compagnons — 1.26

Cette passe complète les lieux régionaux et raccorde des mécanismes déjà annoncés. Elle garde la génération des mondes 1, 2 et 3. Sur G4, les lieux manquants sont ajoutés à la fin du registre : les identifiants, emprises, plans intérieurs et anciens contenants restent associés au même endroit. Certains raccords routiers dérivés sont rectifiés pour retirer les rues traversant des bâtiments. Les nouveaux contenants extérieurs sont des réserves finies, prises en compte par la même sauvegarde `frontier.taken` que les meubles historiques.

## Lieux et cours de service

Les 62 gabarits régionaux possèdent désormais une représentation dans G4 sur les graines vérifiées. La passe précédente garantissait surtout les plans de quartiers : onze types spécialisés pouvaient manquer. Les plans spécialisés sont réintroduits après les anciennes parcelles, avec les mêmes règles d'emprise, de réserve et d'accès routier.

| Contexte | Contenu physique raccordé |
|---|---|
| Menuiserie | Planches, palettes, bois empilé |
| Cuisine centrale | Denrées à réception, retour de plonge |
| Fret et recyclerie | Palettes et caisses de livraison |
| Groupe électrogène | Réserve d'entretien et baie électrique |
| Maison sur sous-sol | Jardin et remise |
| Mine | Déblais pierreux, bois de soutènement, carburant |
| Carrière | Déblais, palettes, carburant |
| École, mairie, gymnase | Bancs et caisses de service |
| Bibliothèque | Banc et réserve documentaire en bois |
| Hôtel et motel | Laverie, rangement et caisses de service |
| Restaurant | Réception alimentaire et plonge |
| Abri communal | Réserve alimentaire et soins |
| Ruine | Bois et déblais récupérables |
| Immeuble | Banc de cour et rangement |

Les courants de jeu restent identiques : approcher, maintenir E, remplir le sac, transférer au véhicule ou rentrer déposer. Le contenu vide ne se recharge pas après une reprise. Les collisions de pied, de véhicule et la sélection de butin utilisent les mêmes objets. L'extension utilise les formes et dessins existants ; elle ne prétend pas transformer ces cours en nouvelles infrastructures constructibles.

## Routes, ruines et étages

La trame routière ajoutée aux agglomérations pouvait couper des parcelles antérieures. Les seuls segments obstrués sont retirés après la génération ; les bras des carrefours sont mis à jour et une entrée éventuellement détachée est reconnectée à une rue accessible. Le graphe reste relié pour tous les lieux des trois graines d'audit.

Une structure détruite perd ses murs, sa toiture et l'accès à ses étages. Ses meubles au rez-de-chaussée, sa cour et ses voitures restent visibles, solides et récupérables. Le conducteur et le piéton rencontrent les mêmes débris : il n'existe plus de véhicule invisible ou de meuble fouillable sans rendu. Les collisions de district ne s'appliquent qu'à la surface. Un projectile tiré à l'étage ne peut plus toucher une horde extérieure située aux mêmes coordonnées.

Les hordes sont dessinées sur l'étendue physique correspondant à leur zone de contact, sans cercle abstrait dans la scène. Elles ne sont pas dessinées sous les sols des étages. Leur attaque vérifie la liaison physique vers le commandant. Un tir finissant une horde efface le surdommage résiduel afin que le registre reste sauvegardable.

## Fouilles après la tombée de la nuit

La fouille régionale fonctionne pendant toutes les phases, y compris un assaut au dépôt. Elle reste interrompue par le rechargement, une opération de terrain, un véhicule conduit, un sac plein ou des infectés proches en vue. La ville continue de vivre pendant la sortie : l'autorisation de fouiller ne fige pas la défense de D-17.

## Équipe de sortie

Les paramètres sont centralisés dans `DeadwallCore.WorldEvolution.RULES.companionRules`. L'affectation coûte deux nourritures, requiert une population de quatre et reste limitée à deux partenaires. Les postes restent ceux de la version précédente ; leur aide est maintenant reliée aux ressources réellement transportées.

| Partenaire | Aide | Consommation |
|---|---|---|
| Léa | Signale les hordes à moins de 700 m à la surface | Affectation uniquement |
| Samir | Soigne le commandant vivant, visible, à moins de 3 m, à 2 PV/s | 0,05 médicament porté par PV |
| Inès | Répare un véhicule encore vivant à moins de 4 m, à 3 PV/s | 0,05 ferraille portée par PV |
| Malik | Tire sur les infectés régionaux visibles à moins de 12 m, 12 dégâts par tir, délai 1,5 s | 1 munition portée par tir |

Les partenaires suivent les accès avec collisions et itinéraires locaux. Ils empruntent le changement d'étage avec le commandant et voyagent dans son véhicule ; leur silhouette n'est pas dessinée à travers un autre étage ou sur la carrosserie. Les positions de suivi sont transitoires et réinitialisées à la reprise près d'un point libre. Les identités et états sauvegardés ne changent pas de format.

Les aides s'arrêtent quand le matériel requis manque. Elles ne prélèvent pas dans l'entrepôt distant et ne concurrencent pas une opération de terrain déjà en cours. Inès ne reconstruit pas un véhicule détruit ; Samir ne ressuscite pas un commandant à terre ; Malik ne tire pas à travers les murs. Cette extension ne remplace pas les spécialistes recrutés de la colonie.

## Vérification

- `tests/world126.test.cjs` : identifiants historiques, 62 types, raccords routiers, cours solides, fouille nocturne persistante, ruines, surdommages, soins, tirs, réparation, suivi, étages et pause.
- `tests/fixtures/world1253-g4-fingerprints.json` : empreintes de la livraison 1.25.3, indépendantes des cours ajoutées et raccords routiers dérivés.
- `tests/world126-geometry-audit.cjs` : accessibilité intérieure par exploration de grille sur les graines 17117, 42 et 903145.
- `reports/1.26.0/QA_WORLD.md` : résultats et limites de cette passe. Ces contrôles ne constituent pas un essai navigateur humain ni une mesure de fluidité.
