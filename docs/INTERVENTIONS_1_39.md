# Interventions et barricades — relève 1.39

## Défaut reproduit

Les nouveaux propriétaires `interventions134` et `barricades134` manquaient au nettoyage central du décès. Les anciens modules étaient déjà annulés par `succession133.cleanup()` ; l’arsenal effectuait lui-même son annulation lors du transfert de ses possessions vers la dépouille.

Dans le document livré, ouvrir l’établi, engager une révision puis déclencher un dommage létal ouvrait la vraie modale de relève et suspendait le temps tout en conservant la session et l’établi ouverts. La confirmation du nouveau commandant laissait encore cette session active jusqu’au prochain pas de simulation. Un chantier de barricade inachevé gardait également son ancien verrou de travail. Une action de ressources lancée immédiatement après la relève pouvait donc rester refusée par une occupation appartenant au commandant mort.

La boucle de simulation annulait ces travaux en fin d’une mise à jour normale. Le raccord central manquant restait observable pour les méthodes de dommage immédiates, localement comme en région, avant cette prochaine mise à jour. Il ne s’agissait pas d’un résultat de réparation gratuit : les contrôles de position et de coût protégeaient encore l’achèvement.

## Correction

Le nettoyage central appelle maintenant `cancel()` des deux propriétaires avant l’ouverture de la relève. Aucun état parallèle, remboursement ou nouveau format de sauvegarde n’est ajouté. L’établi se ferme avant que la modale de relève prenne le focus. Les consommables de diagnostic, prélevés au début, restent consommés. Les matériaux d’une barricade inachevée, payables seulement à la fin, restent dans le sac laissé au décès.

Les contrats de pause demeurent distincts : un diagnostic interactif engagé s’interrompt lors d’une pause ou d’une modale ; une barricade chronométrée suspend son travail dans les menus. La mort et le chargement annulent les travaux transitoires. Aucun défaut n’a été reproduit dans la simple suspension de barricade, qui respecte le contrat existant.

## Preuves

`tests/interventions139.test.cjs` utilise `bootDocument134()` et charge tous les scripts selon `index.html`. Les scènes préparées emploient de véritables placements ou accès physiques. Les commandes de l’établi et de confirmation de relève sont les boutons réellement montés dans le DOM simulé.

- Révision locale : groupe de 350 PV, sac de 18 ferrailles, engagement de 6 ; décès par `Game.damagePlayer`, annulation immédiate sans réparation, 12 ferrailles dans la dépouille.
- Révision régionale : engagement de 5 ferrailles ; décès par `frontier.damage`, annulation immédiate, aucune installation réparée, 13 ferrailles et position régionale exacte conservées dans la dépouille.
- Barricade locale : chantier commencé et avancé sans prélèvement ; décès avant achèvement, aucun renfort créé, sac de 12 bois et 4 ferrailles entièrement laissé sur place.

Dans les trois parcours, la sélection et confirmation du manutentionnaire se font par le contrôleur et le bouton de relève. Le transfert dépôt → sac de 6 ferrailles doit réussir immédiatement, avant tout nouveau tick ; il paie exactement le dépôt et n’utilise aucun objet de l’ancien sac. La sauvegarde/reprise conserve les dépouilles et le nouvel inventaire sans duplication.

Le même fichier exécuté contre les sources immuables de la version 1.38 échoue sur les trois occupations conservées. Journal : `reports/1.39.0/interventions139-baseline138.tap`. Après correction, les 45 contrôles ciblés de décès, crochetage, groupes, tableaux, barricades et interfaces réussissent sans échec ni saut dans `reports/1.39.0/interventions139-targeted.tap`.

Ces contrôles vérifient les propriétaires de simulation et les handlers DOM ; ils ne certifient pas le rendu CSS d’un navigateur, le tactile matériel ou une campagne humaine. Aucun coût, durée, statistique, générateur, identité d’ouverture ou registre sauvegardé ne change. Aucun besoin d’image supplémentaire n’a été identifié dans ce lot.
