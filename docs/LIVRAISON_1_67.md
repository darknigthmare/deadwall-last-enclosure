# DEADWALL 1.67 — Sorties et lignes de défense

## Contenu jouable

La cueillette ajoute **16 espèces et ramassages finis**, avec quatre variantes visuelles chacun : baies et fruits identifiés, noix au sol, champignons identifiés, bois mort et silex. Le biome, la graine et le profil du paysage choisissent les emplacements ; eau, routes, parcelles et obstacles refusent les poses incompatibles. Un lot entier est ramassé sur place, prend de l’endurance et remplit le vrai sac. Il ne repousse pas au rechargement. Les fruits au sol ne créent pas de grands arbres sans collision. Voir [FORAGE193.md](FORAGE193.md).

**Six fronts météo** et un bulletin indiquent pluie observée, tendance et précautions pour les flammes et le terrain. Les nouvelles campagnes débutent par quatre minutes sèches, puis utilisent une météo déterminée par graine et temps actif. La tendance suivante paraît dans les 90 dernières secondes du front. Les anciennes campagnes gardent leur météo jusqu’à activation explicite au dépôt. La pluie conserve ses propriétaires existants ; aucune navigation, crue, saison ou visibilité supplémentaire n’est annoncée. Voir [WEATHER193.md](WEATHER193.md).

**Huit opérations supplémentaires** relient les lieux découverts à D-17 : écarts ruraux, ravitaillement agricole, carburant conditionné, archives, réserve maraîchère, extraction sanitaire, reconstruction et permanence de défense. Coûts au dépôt, consommables sur chaque accès, colis, intégrité, échéances et logement sont réellement contrôlés. Chaque nouvelle opération n’a qu’une tentative par campagne. Le menu explique pourquoi une opération ne peut pas encore être engagée. Voir [CAMPAIGN_CONTRACTS_194.md](CAMPAIGN_CONTRACTS_194.md).

**Six montages spécialisés de Hérisson** distinguent cibles rapides, protections, briseurs, endurance et fenêtres d’entrave. Ils utilisent des charges finies et des coûts qui tiennent dans le sac standard de 36 unités. Le réarmement partiel demande un travail physique et paie les charges manquantes au prorata, sans effacer le cooldown ou une entrave en cours. Voir [DEFENSES_193.md](DEFENSES_193.md).

Le Guide ajoute **30 fiches de cueillette, météo et missions**, et les **six cartes opérationnelles** des mécanismes. Aucun doublon documentaire de piège n’est ajouté : le catalogue de D-17 conserve son lien vers les vrais Préparatifs. Le jeu complet avec catalogue vertical compte **4 748 fiches**, dont 225 choix de D-17 ; une lecture Node sans enregistrement des ouvrages verticaux a un inventaire différent, vérifié séparément.

## Corrections démontrées

- La cible de pluie est conservée à la sauvegarde : Continuer n’efface plus un front en formation.
- Les circuits électriques reconnaissent les modules et ascenseurs verticaux réellement achevés. Leurs consignes survivent à la restauration de tous les propriétaires.
- Une explosion au sol utilise la distance incluant l’altitude. Les cibles proches au sol ou sur un palier très bas restent exposées.
- Les centres de hordes sauvages respectent les berges infranchissables des cartes avec hydrologie, sans supprimer ni téléporter les groupes.
- Une blessure réelle interrompt les gestes et endommage immédiatement le colis de mission, même si un soin suit avant la mise à jour suivante.
- Monter dans le véhicule refuse une recharge ou une intervention en cours, sans supprimer leur coût ou leur progression.
- Refuser un profil de nouvelle carte conserve le monde et les opérations payées de la campagne active.
- Les ouvriers terminent leur approche physique du point de service, même lorsque les deux derniers pixels sont nécessaires pour entrer dans la portée de récolte.
- Les notifications de dégâts conservent le contrat figé dès la défaite ; les blessures et seuils non fatals restent pris en compte immédiatement.
- Le ruban tactile de ressources affiche des cartes entières et un indice de balayage ; un nombre coupé ne se présente plus comme une quantité différente.

Les raccourcis du tiroir régional **Terrain & trajet** ouvrent directement météo, cueillette et missions dans le commandement existant. Ils ne créent pas de modale ou de simulation parallèle.

## Vérification et portée

La commande complète reste `DEADWALL_SOAK=1 npm run check`. Les tests natifs locaux utilisent quatre processus simultanés sur le cloud à quatre cœurs ; chaque partition CI conserve ses deux processus. Tous les fichiers restent exécutés. Le nouveau groupe navigateur vérifie météo, cueillette et mécanismes avec les vrais contrôles ; les autres groupes, Windows, le service worker et le HTML autonome restent nécessaires.

L’[audit 1.67](AUDIT_1_67.md) décrit les observations, les négatifs et les hypothèses écartées. Les parcours avancés déclarent leurs préparations de matériel, de position ou d’horloge. Les résultats de qualification doivent être associés au commit et aux rapports de leur propre exécution. Plusieurs agents et sessions Chromium ne constituent pas des participants humains indépendants, une certification sur téléphone physique ou une campagne de 6 à 10 heures. Cette durée reste une cible à mesurer par jeu humain complet.
