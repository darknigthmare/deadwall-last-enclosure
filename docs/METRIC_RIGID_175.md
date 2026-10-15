# Suite métrique 175 — corps orientés et dessertes strictes

Base de reprise : PR #5, `0288c7ad0b0c9f531723d19e463eb0d264141477` ; main 1.60.0/G10 `5b8f0ade7f7e93d3fc3ea23f762cac93ded43d90`. Les branches verticales 175–178 et le codex historique #2 restent indépendants.

## Ce qui change réellement

Les véhicules locaux déjà calibrés (`metric174=1`) utilisent leur rectangle orienté pour la conduite, les obstacles natifs de D-17, les props/réserves, les volumes d'exploration, les barricades, la pose et l'achèvement d'un bâtiment, les portes et le retour régional. Le bus reste 10,4 × 2,55 m, soit 332,8 × 81,6 unités locales. Le disque circonscrit est conservé comme rayon large de recherche/combat ; ce n'est plus le test fin de conduite. Les véhicules compressés hérités gardent leur comportement précédent et aucun marqueur de sauvegarde nouveau n'est imposé.

Une rotation doit être possible sur tout son trajet, pas seulement à son angle final. Le balayage borne le déplacement de chaque coin entre échantillons et utilise une marge conservatrice. Un obstacle fin entre deux positions sûres est donc testé. Une manœuvre refusée ne déplace rien et ne prélève aucun carburant ; le carburant de translation reste proportionnel à la distance réellement parcourue. Le plafond d'échantillons provoque un refus, pas une traversée forcée.

Le joueur au volant emprunte temporairement le corps du véhicule pour les contrôles de fermeture/achèvement. Cette liaison WeakMap n'est pas une donnée de sauvegarde. À pied, il retrouve son disque normal. Les candidats de descente se trouvent sur les flancs, puis près des extrémités, avec contrôle réel du terrain. Une sauvegarde dans un couloir valide ne doit pas être déplacée au rechargement par l'ancien correctif circulaire.

## Accès routiers

Le résolveur 174 est conservé. Pour une desserte refusée uniquement, une recherche bornée examine des raccords alternatifs sur les routes proches, même niveau, sans modifier la porte ni `p.drive`. Elle réutilise les tests de chaussée, angle, voisins et voitures. Une alternative n'est jamais acceptée sans le contrôle physique du propriétaire du monde : largeur complète, bâtiments, props, végétation et eau G10.

La surface peinte s'arrête au bord proche et seule la connexion logique rejoint l'axe. Les chemins déjà acceptés restent identiques. Cette passe n'ajoute pas de chemin à coudes, de terrassement, de portillon ou de coupe d'arbre. Sur 0, 42 et 17117, les sept refus historiques restent refusés après contrôle physique : aucune amélioration fictive du compteur n'est revendiquée.

## Contrats permanents

`MetricRules175` dans `core.js` porte les pas/limites. `metric-contract174.js` distingue toujours mètres régionaux, unités locales, empreinte au sol et image verticale. Les primitives ajoutées sont indépendantes du rendu. Les codes mal dimensionnés sont refusés ; aucun sprite manquant ne reçoit une taille arbitraire.

Tests : `metric-body175`, `metric-corridor175`, `frontage-followup175`. Les paires de corps sont comparées au SAT natif indépendant ; neuf profils et huit orientations sont couverts. La scène de couloir prépare explicitement des murs achevés sur des cellules libres, un garage/âge de test et un stock fini. L'achat, le transfert de carburant et la calibration utilisent les propriétaires natifs. Ce n'est pas une campagne humaine complète.

`browser-metric175.mjs` utilise le jeu complet, le clic natif du dépôt, les entrées clavier, Sauvegarder et Continuer. Les deux formats mobiles sont émulés et utilisent le clavier pour les directions ; aucune validation sur téléphone physique n'est annoncée. Le script ne remplace aucun contrôleur de mouvement. La sonde de restauration est restaurée aussitôt et compare tous les champs persistants hors timestamp.

## Réception et limites

La compilation publique conserve 338 fichiers. L'audit inventorie 4 244 définitions, dont 4 000 programmes, 5 081 plans d'étage et 29 370 occurrences de props. Les dimensions de 62 gabarits régionaux, 91 constructions D-17 et neuf véhicules sont répertoriées ; cela **ne certifie pas les hauteurs, façades ni chaque pixel de tous les meubles**.

Audit de cette copie : 9 734 lieux, 9 727 raccords acceptés, 66 corrigés depuis la base main et sept toujours refusés. La comparaison indépendante des anciens POIs/routes/plans/détails et ressources sur les trois graines est identique. Les états de déplacement ajoutés ne changent aucun programme de génération.

Localement : 175 tests réussis dans le contrôle élargi initial, deux suites non exécutables faute de `@napi-rs/canvas` verrouillé. `npm run check` a été lancé : syntaxe et build réussis, puis arrêt à 120 secondes après erreurs de dépendance. Le navigateur local refuse la navigation HTTP avec `ERR_BLOCKED_BY_ADMINISTRATOR` ; aucune preuve de campagne locale n'est inventée. Les reçus GitHub Actions de la source finale font foi pour la validation navigateur et les suites avec dépendances.

Restent à traiter : calibration artistique exhaustive des façades/meubles verticaux, taille physique des constructions historiques compactes D-17, voies alternatives à coudes pour les sept cas refusés, topologie générale multiniveaux, collisions fines de combat et manœuvres à grand nombre d'acteurs. Aucun déplacement arbitraire de bâtiment ni fusion des autres PR n'est effectué.
