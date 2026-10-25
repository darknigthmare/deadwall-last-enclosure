# Audit de livraison 1.73

## Problème traité

Les quatre familles résidentielles G11 introduites en 1.72 possèdent des plans, du mobilier, du butin fini et les opérations d’entrée existantes. Leurs fours, couchettes et outils n’étaient pas raccordés à leurs usages de terrain. Ce lot réemploie les propriétaires de survie, de soins et d’éclairage pour ces interactions physiques.

## Constats et contraintes

- Les 200 plans possèdent fours, couchettes et outillage ; les établis concernent150 modèles et les supports médicaux ciblés50 modèles T047.
- Les relais, caches, sécurisations et repos aux entrées existaient déjà. Ils conservent leurs coûts et propriétaires.
- La classification auteur du local «atelier entretien» T045 conserve sa composition historique. Une correction globale modifierait les meubles et identifiants d’anciennes cartes ; ce lot expose uniquement les fonctions portées par les vrais outils présents.
- Les notes génériques du classeur doivent distinguer les raccords de campagne livrés en 1.72 et les qualifications encore ouvertes.

## Réceptions locales

- Le rapport auteur régénéré relit 29 sources : les 4 000 enregistrements restent identiques à 1.72, avec 162 460 pièces meublées, 588 378 équipements posés et aucun refus. Il ne qualifie pas les services en campagne.
- L'éligibilité G11 est régénérée sur huit graines : 200 modèles éligibles, 63 implantations de 58 modèles distincts, sans garantie de quantité par graine.
- L'audit des services relit 243 sources stables : 2 905 poses de travail acceptées sur les 200 modèles isolés, puis 360 poses dans 23 sites de trois mondes réellement générés. Plans, détails, meubles, identifiants et stocks correspondent au golden publié. Ces poses ne sont pas comptées comme transactions.
- L'art préparé couvre quatre modèles V01, treize supports et les quatre actions. Les 1 392 images au repos comparées à 1.72 sont identiques ; cet échantillon ne vaut pas inspection visuelle des 200 variantes.
- Les tests natifs ciblés passent : six tests du résolveur, neuf de survie, cinq médicaux et dix-huit régressions de survie. La reprise finale de l'art, des gestes et du monde passe 29 tests sans échec, annulation, test ignoré ou TODO.
- La régression Chromium des sites G11 passe 65 contrôles sur ordinateur et format tactile, sur la distribution finale. Le parcours des quatre nouveaux services et les régressions générales sont reçus séparément.

Deux contre-exemples ont été corrigés : une lanterne posée demande un accès physique réel, et la perte d'un support retire sa présentation immédiatement, même pendant une pause. Cette lecture ne paie ni n'annule le travail ; la reprise du propriétaire l'interrompt normalement.

## Limite de déplacement mesurée

Les premières tentatives du parcours automatisé sont conservées. Le guide insistait contre le coin d'un égouttoir alors que le déplacement natif refusait bien cette direction et autorisait une sortie vers le nord. Son guidage et sa marge de planification ont été corrigés sans modifier la géométrie ni le déplacement du jeu.

Une contre-expertise distincte mesure une limite historique du déplacement par points : un sous-pas peut frôler un coin convexe de 1 à 7 mm entre deux positions libres. Aucune traversée de cloison ou exploitation des services n'est établie. La résolution des nouveaux gestes conserve sa vérification de segment physique ; ce lot ne modifie pas le déplacement global ni ne lui attribue une précision continue exhaustive.

## Réceptions à compléter

Les résultats de 1.72 restent liés à leur livraison publiée et ne sont pas réattribués à ce code. Les preuves 1.73 doivent couvrir les 200 modèles et les vrais points de travail, les refus physiques, les transactions payées une fois, l’annulation, les effets après Save/Menu/Continue, la pureté et les pauses du rendu, puis les contrôles complets du commit final.

Le golden géométrique est produit depuis les sources isolées du commit publié1.72 `8780075f305e405e5aa94e593a70d11391b16e20`. Les nouveaux rapports devront vérifier les sources avant/après et conserver les tentatives négatives. Aucune pose de travail refusée ne doit devenir un succès de façade.

La publication sera reçue séparément : commit de fusion et arbre vérifiés, dernier déploiement Vercel Production exact, puis comparaison de chaque fichier public et de la racine avec le build reconstruit, suivie d’une confirmation du même déploiement.
