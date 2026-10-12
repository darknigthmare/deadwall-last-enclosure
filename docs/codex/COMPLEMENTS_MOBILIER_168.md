# Passe 168 — combler les minima de mobilier

Une couche physique optionnelle après les cinq révisions existantes. Aucun remplacement de pièce, de route, de ressource ou de position sauvegardée. Code intégré dans `46fb47de29ce3fc8bb1e29d6d74f2418a2026349`.

## Mise en jeu

Au dépôt D-17 : **Monde & relais → COMPLÉTER LES ÉQUIPEMENTS MANQUANTS**. Cette action active la révision 6. Les anciennes parties restent dans leur révision jusqu'à cette activation volontaire. Le contrôleur existant conserve ses restrictions de disponibilité, mains occupées, possessions et restauration.

Quinze types déjà dessinables : lit, canapé, armoire, rayonnage, bureau, établi, comptoir, armoire de soins, réfrigérateur, évier, four, lave-linge, banc, baie électrique et support de tuyaux. Ils sont ajoutés uniquement lorsqu'une prescription auteur correspond à une pièce intérieure non ambiguë, au bon étage, et que son minimum n'est pas atteint. Aucun îlot, plafond ou objet suspendu n'est ramené arbitrairement contre un mur.

Les minima passent avant les options. Un meuble n'est pas crédité à deux prescriptions ; les pièces obtiennent chacune leur tour plutôt qu'une réserve consommant tout le budget. Maximum de 24 objets par plan, 8 par pièce et 8 par prescription. Le reliquat demeure déclaré manquant lorsqu'une demande dépasse cette capacité.

## Supports et accès

Les dimensions au sol auteur sont conservées. La recherche essaie les extrémités et intervalles libres le long de vrais murs, avec le recul historique de 4 cm. Les faces de service du mobilier antérieur, y compris les accès des sièges de la révision 5, ne sont pas occupées par les nouveaux meubles.

La grille de navigation existante contrôle les points auparavant accessibles, puis trois points de chaque nouvelle face de service. Cette preuve raster n'est pas une certification de chaque trajectoire continue. Les nouveaux objets utilisent les listes existantes de collision, de visibilité et de dessin, avec leur transformation locale/régionale. Le contenu décoratif déjà associé aux meubles ancrés suit leur rotation.

Les couches ajoutées ne possèdent ni `amount` ni `resource`. Les équipements n'apportent donc aucun stock, courant, eau ou production. Une armoire de soins dessinée n'est pas un nouveau dispensaire et un réfrigérateur n'est pas automatiquement branché.

## Comparaison dans l'inspecteur

L'aperçu conserve la révision 5 par défaut. La case **Compléter les minima auteur (révision 6)** active uniquement la comparaison de la recette affichée. La sauvegarde de campagne n'est pas sollicitée. Le bilan source/modèle sait lire la nouvelle couche. L'audit 167 reste reproductible sur la révision 5 : les nombres de ses manquants ne sont pas réécrits pour embellir le bilan.

## Vérifications d'intégration achevées

Le run `38283497568` a appliqué les raccords exacts, reconstruit le jeu puis terminé avec succès les 91 tests Codex/distribution avant publication du commit d'intégration. Les neuf nouveaux tests couvrent les quinze types, leur géométrie, les refus, les attributions minimales, les accès des sièges, les sauvegardes et les collisions du vrai monde.

Premiers échantillons exécutés :

- 16 plans de recettes : 33 objets ajoutés, déficit de mobilier mesuré de 65 à 41 unités ; ce ne sont pas 33 nouvelles architectures.
- 62 types natifs, deux graines, 182 niveaux : six ajouts supplémentaires, anciennes géométries et accès conservés.
- 45 sites G8 comparés : 140 nouveaux objets solides vérifiés dans les fonctions de collision et de ligne de vue ; cache régénéré sans redistribution.

La première exécution comptait 90 réussites et un échec : un vieux test déclarait encore la révision 4 invalide, bien qu'elle soit antérieure à cette passe. Il vérifie maintenant explicitement les versions 0 à 6 et refuse 7 et les valeurs malformées ; les assertions géométriques sont conservées.

Les tests raster avec vrais atlas, la comparaison exhaustive des 2 951 plans et les parcours navigateur sont ajoutés au workflow en lecture seule `codex-fill168.yml`. Leurs résultats doivent être lus dans les rapports du commit exécuté ; leur ajout seul ne constitue pas une réussite.

## Nettoyage et provenance

L'exécution locale était indisponible dans cette session et Vercel Sandbox refusait une nouvelle session pour dépassement de quota. Aucun forfait ni règle de sécurité n'a été changé. Le petit workflow d'intégration, restreint à la branche de cette PR et conditionné aux tests réussis, a effectué un push normal après comparaison de la tête distante. **Ce workflow d'écriture et son helper sont retirés après l'intégration.** Les workflows finaux de cette passe n'ont que `contents: read`.

Les résultats courants sont publiés dans le bilan de PR. Pas de fusion, modification directe de main ou déploiement de production.

## Toujours manquants

Les zones extérieures natives, répétitions et niveaux non construits, signes muraux, machines sans présentation, ports, tunnels, échangeurs, réseaux et interactions propres à chaque appareil ne sont pas créés par cette couche. Les minimums restant impossibles à placer sont explicitement conservés comme écarts.
