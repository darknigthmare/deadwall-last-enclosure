# Audit et corrections 1.55.0 — DEADWALL

Base de cette passe : **1.54.0**, commit `1ab157d8e7aed9a680f9f9cf59a339a9de2ba830`. La référence de performance a été exécutée avec les sources inchangées avant les mutations. Les reproductions de gameplay, les comparaisons Canvas et les observations navigateur sont distinguées ci-dessous. Les rapports historiques conservent leur propre portée.

## Défauts reproduits et corrections

| Domaine | Avant correction | Comportement corrigé |
| --- | --- | --- |
| Pause et combat | Le handler natif O ouvrait le devis pendant `Game.update`, puis le même update continuait : santé 100 à l'ouverture, 84 à la fin, sauvegarde toujours à 100. Le délai d'assaut et le cooldown adverse avançaient également derrière le dossier. | Contrôle immédiat après les actions ponctuelles ; arrêt avant directeur, électricité, combat et entretien si une pause ou une modale s'est ouverte. Reprise des dégâts et Continue vérifiés. |
| Mains occupées au relais | Déposer était accepté pendant une vraie recharge régionale. | Boutons et transaction partagent un devis qui attend la fin de recharge, vérifie accès, activité, menace, stock et capacité, puis recalcule les quantités lors du transfert. |
| Sécurité du relais | Une dépouille réanimée proche de l'entrée n'empêchait pas le relevé. | Les réanimés vivants participent au danger sur le même niveau avec une ligne physique libre. Une apparition pendant le travail interrompt avant paiement ou révélation ; une menace séparée par un mur réel ne bloque pas le relais extérieur. |
| Consommation logistique | Le bilan omettait les centrales avancées et comptait encore certains générateurs hors ligne. | Lecture de `generatorFuel` et des arrêts réellement appliqués. Le débit du moteur est conservé. |
| Production logistique | Une manufacture avec réserve protégée annonçait 54 munitions/min alors que les ticks produisaient zéro ; un demi-tick restait annoncé à plein débit. | Le bilan soustrait la réserve d'intrants propre au support équipé et reflète sa fraction de production disponible, sans toucher au stock ou au fitting. |
| Activation des escaliers | Le rafraîchissement remplaçait MONTER entre pointerdown/Space et pointerup/keyup ; une pression de 650 ms pouvait se terminer sans clic. | Nœuds conservés tant que leur action existe ; les disponibilités restent actualisées. Les invalidations reviennent au focus Carte. |
| Annexes régionales | Six fonctions d'annexe partageaient un rectangle uniforme. | Six silhouettes originales existantes, à ratio conservé, pied ancré à la fondation 20×9 m et hauteur visuelle maximale 13 m. Profondeur physique et chantier restent inchangés. |
| Libellés compacts | MATÉRIEL et VÉHICULE se terminaient par une lettre isolée. | Libellés sur une ligne dans des cibles de 44 px de haut, mesurés et observés dans le navigateur à 390×844. |
| Occlusions lumineuses | Remplacer le plan G4 ou changer l'ouverture d'un projecteur pouvait réutiliser un ancien polygone. | Plan synchronisé avant le raster, ouverture incluse dans la clé du polygone ; comparaison à une installation neuve. |

La sauvegarde générale reste **v20**. Aucun prix, délai d'activité, rayon économique, débit, génération, seuil d'âge ou nombre de vagues n'est changé par ces corrections. Les connaissances acquises restent mémorisées ; les capacités physiques exigent toujours des supports vivants et opérationnels.

## Optimisations acceptées et pixels

Le masque nocturne local est conservé pendant un rendu strictement inchangé. Sa signature inclut monde, plan, navigation, cache d'occlusion, opacité, dimensions, caméra, zoom, tremblement et sources ordonnées. Les fournisseurs restent consultés à chaque rendu et les teintes gardent leur état courant. Les mises à jour, reprises et évictions invalident le bitmap. Les rayons calculent une seule fois leur sinus et cosinus ; les lumières régionales entièrement hors écran évitent leur balayage sans modifier le fournisseur ou les collisions visibles.

Le cache de sprites mémorise la clé des rectangles gelés dans une WeakMap. Chaque rectangle ne conserve que son dernier couple atlas/niveau. Les rectangles mutables, les changements de source, le LRU, les budgets de 8 Mio/384 entrées et les exclusions des quatre atlas historiques d'acteurs gardent leurs contrats.

Les comparaisons Canvas natives établissent une égalité exacte des pixels sur leurs scénarios déclarés. Pour 50 images nocturnes stationnaires, le masque actuel est reconstruit une fois contre 50 auparavant ; cela prouve le chemin de réutilisation, pas une hausse FPS réelle. Une proposition d'extraction des sprites 1:1 a échoué à conserver exactement les pixels et a été écartée. Aucun PNG original n'est modifié ou nouvel atlas d'acteur rééchantillonné.

Le cache accepté des façades/toits procéduraux vise uniquement le peintre local opaque, sans découpe. Son opt-in exige le contexte principal opaque (`alpha:false`), hors région. Le changement de monde libère les anciennes surfaces ; identité, variante et matériau de secours invalident leur image. Il conserve au plus 8 Mio et 96 surfaces, avec 1 Mio par surface ; les déplacements fractionnaires gardent le dessin natif tant que leur phase de pixels ne se répète pas. Projections régionales, transparence et découpe restent sur le chemin original. Les sept tests natifs ciblés terminent avec code 0. Sur 45 cas opaques et trois fonds, le regroupement de composition est vérifié avec un écart RGB maximal de **3/255**, distinct de l'égalité exacte des autres contrôles Canvas. Les replis régional/alpha/découpe sont exacts. Cette tolérance bornée ne constitue pas une certification des GPU physiques.

## Preuves terminées et portée

Les artefacts de travail sont dans `/workspace/deadwall-cloud/audit155/` ; ils sont externes au dépôt et ne sont pas présumés présents dans une archive du jeu.

| Chantier | Preuves de travail | Portée établie |
| --- | --- | --- |
| Combat | `combat.md`, `modal-combat-before.json`, `modal-combat-regressions-before.log`, `modal-combat-targeted.log` | Handler clavier, devis et moteur natifs sous le DOM de démarrage ; poses physiques préparées. Tests avant échoués, lot ciblé après terminé avec code 0. |
| Relais | `exploration.md`, `relay-before-reproduced.log`, `relay-final.log`, `relay-targeted.log` | Recharge, relais financé, mort/relève/réanimation et reprise natives ; scènes régionales préparées, géométrie G7 réelle, contrats G5 historiques. |
| Logistique | `progression.md`, `progression-final.log`, `progression-existing.log`, `progression-verification.json` | Chiffres confrontés à `economyTick`, commande de régulateur réellement payée et panneau Logistique livré sous DOM simulé. |
| Lumières | `lighting155.md`, `lighting-validation155.json` | Canvas natif, pixels du masque et du rendu, transitions de sources/portes/plans/caméra, niveaux/intérieurs ; tests historiques de propriétaires. |
| Métadonnées art | `art-cache-results.md`, `render-metadata-targeted-actual.log`, `native-crop/report.json` | Comparaisons Canvas exactes et contrats de cache ; extraction 1:1 refusée. Aucun profil FPS lancé par ce chantier. |
| Façades/toits locaux | `building-shell-final-targeted.log`, `shell-diagnostic.json` | Six tests natifs terminés ; composition opaque à écart RGB borné, invalidations et budgets, replis exacts hors du peintre local autorisé. |
| Escaliers et compact | `browser-audit.md`, dossiers `dock-native-before-*`, `dock-native-after-*`, `annex-browser-*` | Événements souris et clavier natifs, toucher Chromium émulé, captures et géométries de cibles. Scènes préparées via sauvegarde valide. |

Les suites ciblées se recoupent et ne doivent pas être additionnées pour annoncer un total de livraison. Les premières erreurs de préparation des relais et les essais rejetés restent dans les journaux ; ils ne sont pas présentés comme des validations réussies. Les comptes globaux et codes de sortie finaux seront consignés par l'intégrateur après leur exécution.

La piste d'un ciblage de relais par le centre d'un voisin n'est pas reproduite sur les graines 17117, 84329, 0 et 903145 ; ciblage, routes et transitions D17 sont conservés. L'analyse des évolutions économiques confirme leurs contreparties déjà livrées, notamment courant supplémentaire ou changement de filière ; aucun bonus compensatoire n'est ajouté. Ces sondages ne couvrent pas toutes les graines ou configurations de cité.

## Référence de performance et contrôles restants

Les rapports `performance-before/reference155-kswWnG/report.json` et `performance-after/candidate155-FBOoFy/report.json` ont terminé avec code 0. Ils mesurent Chromium 151/Linux cloud/SwiftShader à 1280×720, DPR 2, vrai RAF, deux secondes de chauffe puis au moins six secondes d'échantillonnage par scène. Les chiffres ci-dessous utilisent **le nombre de frames divisé par le temps mural effectivement mesuré**, sans déduire la cadence du seul intervalle RAF moyen.

| Qualité et scène préparée | Frames/s avant | Frames/s candidat | Rendu moyen avant → candidat |
| --- | ---: | ---: | ---: |
| Automatique, calme | 53,03 | 51,16 | 13,48 → 14,31 ms |
| Automatique, enceinte à 720 infectés | 8,32 | 9,27 | 67,07 → 47,51 ms |
| Basse, calme | 59,34 | 58,63 | 12,59 → 13,07 ms |
| Basse, enceinte à 720 infectés | 5,31 | 10,59 | 86,30 → 29,74 ms |

Dans le stress automatique, le rendu moyen diminue de **29,2 %** sur cet essai. Le résultat basse qualité ne démontre pas un gain causal de deux fois : sa référence comporte des interruptions de 833 à 2 000 ms, et l'intervalle RAF médian reste **83,4 ms** avant/après. Les scènes calmes sont légèrement moins rapides ; variabilité du runner et petite régression possible restent à distinguer sur des répétitions ciblées. Les temps inclusifs se recouvrent et ne s'additionnent pas. Ces scènes injectées et ce GPU logiciel ne définissent ni un débit GPU de présentation, ni une configuration minimale joueur, ni 60 FPS garantis.

Les sources exécutables sont restées inchangées pendant le profil candidat. Les trois ajouts documentaires de cette passe ont été écrits pendant la mesure : le reçu ne certifie donc pas un arbre complet identique. Cette qualification distingue l'état du code mesuré de celui de toute la documentation.

Cet audit ciblé est rédigé avant le contrôle global et la publication. Les résultats finaux de `npm run check`, des parcours généraux de campagne/web-PWA/autonome et de la publication sont consignés séparément dans le compte rendu de livraison. Aucun succès futur, budget FPS atteint ou identité HTTPS du candidat n'est anticipé. Les captures ciblées du candidat annonçant encore 1.54.0 pendant leur production ne sont pas des preuves d'une 1.55.0 publiée.

La cible de **6 à 10 heures jusqu'au onzième âge** reste à confronter à des campagnes humaines complètes. Les scènes préparées ne chronomètrent pas acquisition, financement, déplacements, assauts et pertes. Le nombre de sprites raccordés et les tests de pixels ne prouvent pas la complétude de toutes les animations. La planche des callbacks réels des six annexes a été inspectée et acceptée ; elle est distincte de la vue régionale partiellement couverte par le HUD, qui n'atteste pas seule l'inspection de chaque silhouette.

Windows natif, tactile physique, audio, accessibilité complète, boutiques et fluidité sur le matériel des joueurs restent hors de la certification de cette passe. Le relais coopératif conserve son périmètre de présence/repères ; inventaires, combats et sauvegardes restent locaux.
