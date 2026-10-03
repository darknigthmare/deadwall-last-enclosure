# 1.21 — Reconnaissance et tournées

## Contrat

Le registre `fieldAtlas` est additif : version 1, cellules parcourues, signalements, dossier en cours, tournée. Il ne modifie pas la géométrie du monde, la table des contenants ou les prises sauvegardées. Les valeurs d’équilibrage sont configurées dans `core.js`.

Un dossier choisit de façon déterministe jusqu’à trois parcelles existantes, non découvertes et non signalées, dans la zone attribuée à l’agglomération la plus proche. Les cibles sont conservées dès le paiement de cinq rations. L’ouvrier est l’analyste déjà affecté au bureau d’expédition : aucune unité parallèle, aucune double production de renseignement générique. Quarante secondes effectives sont nécessaires au contact du bureau opérationnel. Pause, trajet, panne, menace et repli suspendent le progrès. L’abandon ne rembourse pas les rations.

Les indices publics présentent un usage probable et un centre décalé de 28 m, dans un cercle de 65 m. Avant confirmation, les fiches ne donnent ni nom exact, ni dimensions, ni état des contenants. L’approche utilise le mécanisme de découverte existant ; aucun butin n’est crédité lors de la confirmation.

La grille des passages compte 64 × 64 cellules de 128 m. Seule la cellule occupée pendant une mise à jour active au rez-de-chaussée est enregistrée. Ce registre signifie passage, pas fouille complète. Les déplacements historiques antérieurs à la migration ne sont pas inventés.

La tournée accepte six lieux confirmés ou indices uniques. Ordre modifiable au repos, étape suivante explicite, pause/reprise à la même position, redémarrage d’une tournée terminée. Aucune étape ne modifie les notes « fouillé » ou les stocks. La tournée active prend temporairement la priorité sur le guide du repère unique sans effacer ce dernier.

Le calcul est une boucle régionale depuis le point réel en région ou la jonction choisie à D-17, puis retour à cette jonction. Il utilise le graphe extérieur existant. Il ne comprend pas les déplacements locaux et ne remplace pas « Jusqu’au dépôt ». Consommation régionale et marges existantes, aucun effet économique de la consultation.

## Validation et compatibilité

Les identifiants, la zone d’un signalement, les temps finis, la limite des cellules, l’unicité et les six étapes sont validés avant remplacement de la campagne. Le passage v17 → v18 donne un registre vide, sans ressource ou indice offert. Le module de relais a été corrigé pour accepter sa donnée dans les versions prises en charge à partir de v17 ; auparavant le nouveau format pouvait écarter son registre lors de la reprise. Les tests hérités de stockage ont détecté ce défaut et restent inchangés sur leurs contrôles de conservation.

## Modules

`field-atlas-state.js` : structures, règles de validation, catégories, indices et rattachement des parcelles. `field-atlas.js` : travail, transactions, collecte des cellules et planification. `field-atlas-art.js` : marques de signalements et étapes. `field-atlas-ui.js` : dossier intégré à la carte, filtres, pagination et accès HUD. L’analyste reçoit le dossier depuis `expeditions.js`, après avoir rejoint son bureau.

## QA

Les tests couvrent rations, absence de double gain, déplacement au bureau, panne, danger, rappel, abandon, reprise partielle, indices uniques, confirmation physique, suivi de terrain, tours bornés, pause et reprise, validation atomique et nouveau départ. Les scènes navigateur avancées préparent les infrastructures et les positions. Le temps est piloté ; les tests n’équivalent pas à quatre joueurs humains. Les captures du moteur sont incluses sans revendication d’inspection artistique exhaustive à distance.
