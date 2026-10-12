# Passe 168 — combler les minima de mobilier

Cette passe ajoute une couche physique après les cinq révisions existantes. Elle ne remplace aucune pièce, route, ressource ou position enregistrée.

## Portée

Quinze types déjà dessinables : lit, canapé, armoire, rayonnage, bureau, établi, comptoir, armoire de soins, réfrigérateur, évier, four, lave-linge, banc, baie électrique et support de tuyaux. Ils sont posés uniquement lorsqu'une prescription auteur correspond à une pièce intérieure identifiée, au bon étage, et que son minimum n'est pas atteint. Aucun îlot, plafond ou équipement suspendu n'est ramené arbitrairement contre un mur.

Les minima passent avant les options. Un objet présent ne satisfait pas deux prescriptions ; une réserve ne consomme pas seule tout le budget avant que les autres pièces aient leur tour. Maximum de 24 objets par plan, 8 par pièce et 8 par prescription. Une quantité plafonnée reste signalée comme manquante.

Les dimensions au sol auteur sont conservées. Les faces de service du mobilier antérieur, y compris les accès des sièges de la révision 5, sont préservées. Les contrôles utilisent la grille de navigation existante ; cette preuve raster n'est pas une certification de tout déplacement continu. Les nouveaux meubles entrent dans les mêmes listes de collision et de dessin que les autres aménagements.

## Activation

Après intégration : au dépôt D-17, Monde & relais → **COMPLÉTER LES ÉQUIPEMENTS MANQUANTS**, révision 6. Anciennes parties : aucune activation silencieuse. Le contrôleur existant vérifie disponibilités, possessions et restauration. Les détails ne contiennent aucun montant ni ressource et ne créent ni eau, ni courant, ni production.

L'inspecteur conserve par défaut la révision 5. Une case permet de comparer la révision 6 sans toucher à la partie. L'audit 167 reste reproductible sur son ancienne révision ; les comparaisons 5/6 doivent être distinguées.

## Vérifications

Les tests de cette passe couvrent placement exact, quinze présentations, refus de prescriptions, quantités dupliquées, anciens accès, tous les gabarits natifs sur deux graines, de vrais sites G8, éviction du cache et activation avec sauvegarde. Les résultats exécutés seront inscrits dans le bilan de la PR ; la présence de tests ne signifie pas qu'ils ont réussi.

## Intégration ponctuelle

L'environnement local de cette reprise ne permettait plus d'exécuter les modifications. Le helper `integrate-fill168.cjs` prépare des remplacements exacts, atomiquement, et écrit leurs empreintes. Un workflow temporaire borné à la PR 2 applique ces modifications, reconstruit et teste avant un push normal sur la branche de cette PR. Il refuse si la branche a changé entre-temps et n'expose le jeton que dans l'étape de push. Ce workflow d'écriture doit être retiré après intégration. Les contrôles normaux de la PR restent présents ; aucun main, forfait Vercel ou déploiement de production n'est modifié.

## Toujours manquants

Zones extérieures natives, répétitions et niveaux non construits, signes muraux, machines sans présentation, ports, tunnels, échangeurs, réseaux et interactions de chaque équipement. Cette couche comble des meubles précis, pas ces architectures.
