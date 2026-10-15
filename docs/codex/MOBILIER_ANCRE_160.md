# Codex 3000 — Mobilier appuyé aux murs (révision d’aménagement 3)

## Portée de cette passe

Cette suite conserve la version 1.57, les programmes détaillés de la PR #2 et les détails cosmétiques du commit `3ed438f6105d69298af98a0678db591008e81844`. Elle complète les pièces compatibles avec du mobilier fixe raccordé aux murs réels, et améliore la recherche des 3 000 fiches. Elle ne remplace ni les plans G7/G8 ni les ressources finies existantes.

Le catalogue reste composé de 1 000 programmes parents et 2 000 compositions. La présente passe ne transforme pas les programmes de ports, tunnels ou quartiers entiers en architectures natives achevées. Les prescriptions non prises en charge restent des prescriptions.

## Activation en jeu

Au dépôt de D-17, dans **Monde & relais**, choisir **COMPLÉTER LE MOBILIER ANCRÉ**. L’action enregistre explicitement `frontier.detailVersion = 3`. Les versions 0, 1 et 2 conservent leurs dispositions ; aucune ancienne sauvegarde n’est densifiée silencieusement. L’action d’aménagement 159 reste disponible pour la révision 2.

L’activation conserve les contrôles de disponibilité, de rechargement, de position au dépôt, des bivouacs, véhicules, équipements et positions régionales sauvegardées. En cas de refus du chargement de sauvegarde, l’opération renvoie maintenant un échec plutôt qu’un faux message de réussite. Aucune ressource, munition, énergie ou récolte n’est ajoutée.

## Organisation et placement

Le module `src/codex-anchors160.js` propose jusqu’à 12 meubles supplémentaires par plan, sous réserve de place réellement compatible. Ce plafond n’est pas un objectif obligatoire.

Types reconnus : lit, canapé, armoire, étagère, réfrigérateur, évier, bureau, établi, comptoir, équipement médical, four, lave-linge, armoire électrique et rack de tuyaux. Les propositions reprennent les types et dimensions auteur lorsqu’ils sont supportés ; les kits fonctionnels complètent les pièces correspondantes. Un meuble de même type déjà présent dans la pièce n’est pas dupliqué.

Le support est un segment du tableau des murs du plan, pas une bordure visuelle inventée. Chaque meuble conserve son indice de mur, son côté et un recul de 0,04 m depuis la face intérieure. Les appuis nord, est, sud et ouest tournent aussi le sprite et l’emprise physique. Les ouvertures entre deux segments ne sont pas traitées comme une paroi continue.

Un rectangle de service est réservé devant chaque meuble, d’après le dégagement source ou le kit, borné entre 0,8 et 1,8 m. Le placement refuse les murs, escaliers, objets historiques, décor existant, autres meubles et espaces de service déjà réservés. Le centre de la zone de service doit être accessible depuis le parcours de référence.

Après placement, le contrôle raster conservateur vérifie les points d’accès initialement joignables et les nouvelles faces de service. Les ajouts qui coupent ces accès sont retirés dans un ordre déterministe. Une entrée de référence déjà inaccessible n’est pas déclarée validée et ne reçoit aucun nouveau meuble solide de cette passe. Cette vérification discrète n’est pas une preuve exhaustive de navigation continue pour toutes les tailles de véhicules.

## Identités, rendu et compatibilité

L’ordre est important : objets historiques, aménagement 159, détails cosmétiques 160 existants, puis nouveau mobilier ancré. Cela préserve les identifiants des détails déjà produits par la passe cosmétique. Les nouveaux identifiants possèdent le préfixe local `:anchor160:` et n’entrent pas dans la liste des contenants fouillables.

Le rendu réutilise les sprites de mobilier et les atlas existants. La rotation est effectuée autour du centre, avec découpe au rectangle du collider. Les replis procéduraux restent dessinables sans chargement d’image. Aucun nouveau lot de textures PNG n’est revendiqué.

Le cache des colliders introduit par la passe cosmétique est conservé : les requêtes de collision ne parcourent pas les seuls petits objets décoratifs non solides. L’export du catalogue généré contient également le nouveau module, sans ajouter de requête de script publique. Le build sans dépendances installées et les contrats web/PWA/PC restent testés.

## Recherche et lecture du codex

La recherche examine aussi le contenu détaillé du programme parent : pièces, usages, inventaire des kits, noms du mobilier auteur et variantes de jardin. Exemples testés : `miroir`, `canape` et `DW-1001 réfrigérateur`. Le texte parent normalisé est conservé en cache et partagé entre les compositions, sans calculer 3 000 fois les mêmes données.

La fiche ouverte affiche désormais les quantités, dimensions longueur × largeur × hauteur, et dégagements auteur. Les filtres de statut continuent à distinguer les recettes du contenu effectivement présent sur le terrain. La consultation n’altère ni les stocks, ni la graine, ni la sauvegarde.

## Vérifications terminées sur cette passe

**69 tests ciblés réussis, zéro échec, annulation ou skip.** Le groupe comprend les nouveaux tests d’ancrage, les détails cosmétiques 160 conservés, les recettes 159, l’activation, le runtime 3000, les aménagements 157, les migrations G8, le vrai build sans node_modules, le dessin des détails, le guide, le serveur et la PWA.

Les nouveaux tests parcourent les 62 modèles historiques et tous leurs niveaux sur deux graines. Ils vérifient le support à 0,04 m, les quatre orientations, les zones de service, les collisions, les accès, l’absence de butin ajouté, l’append-only des révisions et le refus atomique d’activation. Les tests de pixels contrôlent que les meubles tournés restent dans leur emprise.

**Chromium/Linux : parcours réussi en 1440 × 900 et 390 × 844**, sans erreur JavaScript de page. Recherche du contenu, lecture des dimensions exactes, sauvegarde inchangée et rendu du mobilier ont passé. La scène de mobilier est une clinique préparée par le générateur : trois meubles ancrés ajoutés, dessinés et contrôlés. Ce n’est pas une preuve d’acquisition organique en campagne, de matériel mobile physique ou de validation Windows.

Scripts reproductibles :

```sh
node scripts/check-syntax134.mjs
npm run build
node --test --test-concurrency=1 tests/codex-anchors160.test.cjs tests/codex-dressing160.test.cjs tests/codex-recipes159.test.cjs tests/recipe-activation159.test.cjs tests/codex3000-runtime.test.cjs tests/seed-detail157.test.cjs tests/g8-migration157.test.cjs tests/distribution.test.cjs tests/seed-detail-art157.test.cjs tests/world-codex.test.cjs tests/server.test.cjs
node scripts/browser-anchors160.mjs
DEADWALL_ENDURANCE=1 npm run check
```

Les 14 fichiers de code et tests transférés ont été comparés par empreinte Git aux fichiers exécutés : aucune différence. Les validations générales et Windows du nouveau commit sont à lire séparément dans GitHub Actions ; les 69 tests ciblés ne sont pas présentés comme une validation intégrale du jeu.
