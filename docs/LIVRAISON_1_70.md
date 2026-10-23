# DEADWALL 1.70 — Rives et réseaux

Cette reprise réunit la PR #16 et la correction de transport de la PR #17 sur la base 1.69 déjà intégrée. Elle ajoute 750 plans auteur aux 1 200 existants, corrige les 30 pièces de navires sans mobilier et actualise le classeur depuis les sources vérifiées.

Le Guide auteur propose 39 typologies et 1 950 plans : 57 990 pièces, 57 990 meublées, 205 763 équipements et 4 670 prescriptions refusées. Les nouvelles familles sont les sites lacustres, le littoral, l’eau et l’énergie. Les eaux et équipements fermés ont des collisions ; le clic affiche leurs dimensions. Les hauteurs d’une réservation d’eau ne sont jamais présentées comme une profondeur réelle.

Le déchargement d’un colis peut être interrompu en le posant au sol. La quantité reste dans son propriétaire physique, la livraison ne crédite pas sa destination et la récupération conserve son vieillissement. Les refus de contrôle, la mort et les domaines incompatibles restent vérifiés. Le scénario navigateur utilise un couteau réellement fabriqué, payé, retiré et équipé.

Le suivi conserve 80 typologies, 4 000 objectifs de variantes et 800 tâches : **3 validées, 192 en cours, 605 à faire**. Il reste **41 typologies / 2 050 plans à produire**. Les 1 950 plans inspectables ne sont pas implantés dans les campagnes : seed, butin, rencontres, services, graphismes définitifs et persistance de campagne restent ouverts. Les dimensions auteur ne sont pas des relevés de bâtiments réels.

Les contrôles exhaustifs des plans sont dans [le rapport](codex/suivi-monde2026/inspection-20261023.json). Le [classeur](codex/suivi-monde2026/DEADWALL_CODEX_MONDE_SUIVI.xlsx) distingue les dix étapes de chaque type et préserve les identifiants, formules, styles et critères des feuilles existantes. Sa source publique initiale est conservée comme baseline et n’est pas remplacée sans accès Drive en écriture.

Les validations ciblées locales ont passé : 83 tests élevage/transport, 32 tests moteur d’inspection, 27 tests mobilier, 20 tests des nouvelles familles et 8 tests des gardes du suivi. Elles sont distinctes du contrôle littéral complet, des parcours navigateur sur le commit livré et du déploiement. Ces derniers sont à qualifier sur le head final de la PR avant fusion ; leurs résultats sont publiés dans la PR et les reçus de CI. Aucune mesure de campagne humaine complète de 6 à 10 heures ni de cadence sur téléphone physique n’est déduite des scènes automatisées.

L’installation Chromium des deux jobs qui avaient été annulés est désormais bornée, mise en cache et vérifiée par un véritable lancement. Les phases opt-in, sauvegarde et Continuer sont journalisées pour attribuer un éventuel échec ; aucun test n’est désactivé.
