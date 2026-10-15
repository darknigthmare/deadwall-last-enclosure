# Validation des jardins composés — passe 171

Le code intégré dans `d6da60d33db971535bd2f36984630ce53a2ca86a` a été publié seulement après validation des 25 fichiers de source par empreintes, construction, tests, navigateur et audit exhaustif. La livraison suivante retire le transfert ponctuel et ajoute un workflow de régression en lecture seule, sans changement du code du jeu.

## Résultats confirmés dans GitHub Actions

Run : https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/38325758368

Archive : https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/38325758368/artifacts/11781077418

SHA-256 de l'archive récupérée : `4aca3e2cf9fa6b1771c01e79e6306dd26c5b8124799b49eefc4badf245e46947`.

- **43 tests ciblés réussis**, zéro échec, annulation ou test ignoré : jardins, surfaces, rendu, rapprochement source/modèle, protections de possessions, ancienne migration G8, postes et distribution.
- **168 rendus raster** : 21 types, quatre orientations, atlas et secours ; 26 atlas décodés et 68 appels réels de sprites, avec le backend verrouillé `@napi-rs/canvas`.
- **39 contrôles navigateur réussis**, 13 par format (1440×900, 390×844, 844×390), Chromium 151.0.7922.34. Une activation issue d'un clic de confiance, une seule restauration, révision persistée 9, Continuer, seconde activation refusée, comparaison d'aperçu et pixels exacts au retour en révision 8.
- Les listes de différences avant clic, avant restauration, dans les données soumises, après restauration et dans le stockage sont vides après normalisation du seul numéro de révision attendu et du timestamp.
- Aucune erreur JavaScript de page, de console ou HTTP dans les trois parcours. Mobiles émulés ; le point de service au dépôt est une fixture explicite physiquement libre, pas un trajet naturel simulé.
- Six images supplémentaires du vrai peintre de recettes ont été générées, révisions 8 et 9, avec 26 atlas décodés, sans mutation du modèle. Ce rendu en mémoire est une preuve distincte, pas une campagne.

## Audit complet, graine 17117

3 000 programmes classés, 2 374 recettes compatibles, 2 951 plans d'étage comparés.

**114 nouveaux équipements** complètent **101 kits de jardin**, en réutilisant **189 occurrences déjà présentes** dans les zones correspondantes. Les douze profils sont représentés : fleurs, potager, terrasse, jeux, verger, piscine, serre, atelier, linge, friche, partage et repos. Chaque kit retenu possède ses trois composants dans cet échantillon ; les contraintes restent prioritaires sur les autres graines.

Les ajouts comprennent 21 bacs plantés, 19 bancs, 18 abris toilés, 17 massifs, 8 jouets, 7 récupérateurs d'eau, 5 barbecues, 5 potagers, 5 composteurs, 3 range-vélos, une haie, une serre, un étendoir, une piscine, un arbre et un outillage. Ce sont des instances de recettes incluant les variantes héritées, pas des nouveaux assets ou des implantations garanties dans chaque campagne.

Zéro nouveau stock dans les détails. Les plans, anciennes parcelles, objets et couches intérieures/extérieures sont vérifiés identiques avant/après. Les compléments du jardin ne diminuent pas artificiellement les minima de mobilier auteur.

## Protections et portée

Activation volontaire au dépôt : **Monde & relais → COMPOSER LES JARDINS ET COURS**. Révision d'aménagement 9, distincte de la génération régionale G8.

Les anciennes clôtures, chemins, corps de bâtiment, véhicules stationnés, dégagements et possessions sont préservés. Le refus d'activation couvre aussi une lampe sauvegardée sous un futur aménagement traversable : une surface non solide ne doit pas pouvoir la recouvrir. Aucun circuit électrique, fonctionnement de piscine, production potagère ou butin n'est ajouté.

Les 2 716 unités intérieures encore sous les minima, pièces et niveaux manquants, extérieurs encore simplifiés dans les anciennes coques, ports, tunnels, échangeurs et systèmes spécialisés ne sont pas déclarés terminés par cette passe.

## Limites locales et validation générale

Le `npm run check` local a réussi syntaxe (274 fichiers) et build (278 fichiers publics), puis rencontré trois fichiers de test sans `@napi-rs/canvas` installé, avant la limite de 120 secondes. Il ne constitue pas une réussite globale. L'ouverture HTTP du jeu est bloquée par la politique du navigateur local ; la validation de campagne ci-dessus provient des vrais parcours GitHub Actions avec les dépendances verrouillées, pas du rendu local isolé.

Les anciens échecs de la suite générale ne sont pas tous revendiqués corrigés. La PR demeure en brouillon ; aucune fusion vers main ni publication de production n'est réalisée par cette passe.
