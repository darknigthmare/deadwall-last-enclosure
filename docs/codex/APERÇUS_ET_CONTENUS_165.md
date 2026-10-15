# Passe 165 — Plans inspectables et contenu des meubles ajoutés

Base vérifiée : `351562d4f2e94e5339646424640bee94c9609882`, PR #2. Les corrections 163, les séries de mobilier 164 et les révisions sauvegardées 0–4 sont conservées. Aucun changement de main ni publication de production.

## Petits ensembles posés sur le mobilier supplémentaire

Le décor de petits objets était généré avant l'ajout des meubles ancrés et des séries auteur. Ceux-ci pouvaient donc rester sans contenu. Le peintre complète désormais ces supports au moment du dessin : documents, linge, outils, étiquettes, flacons ou matériel de soins, selon le type et l'usage du meuble.

Chaque ensemble est dessiné après son meuble, dans son repère local non tourné, sous la même rotation et le même découpage graphique. Il reste à l'intérieur du support et ne chevauche pas les autres ensembles. Jusqu'à trois ensembles par support, cache borné à 128 entrées, choix déterministe par graine et identité. Les appels invalides ne créent aucun décor.

Cette couche est uniquement graphique : elle n'est injectée ni dans les objets du plan, ni dans les colliders, ni dans les contenants de fouille. Aucun nouveau stock, passage, volume physique ou numéro de révision de sauvegarde. Les sprites existants restent utilisés ; aucun nouveau lot d'images n'est annoncé.

## Inspecteur de recette dans ATLAS & GUIDE

Dans **Les 3 000 programmes**, ouvrir une fiche, puis utiliser **AFFICHER LE PLAN**. La graine de prévisualisation et l'étage sont modifiables. Le plan est calculé à la demande par les générateurs existants et dessiné par le véritable peintre `DeadwallFrontierArt.lot`, sur une parcelle temporaire non enregistrée.

L'interface annonce clairement une recette simplifiée, pas un bâtiment découvert dans la partie. Elle indique les pièces, objets sources, détails solides, ensembles décoratifs et demandes de mobilier non posées. Les dimensions adaptées et les espaces extérieurs sources encore représentés dans une coque simplifiée sont signalés. Les niveaux non prévus et les graines invalides sont refusés, avec disparition de l'ancienne image plutôt qu'un résultat périmé.

La classification porte sur les **3 000 programmes** : **2 700** disposent d'une famille de recette compatible avec cet inspecteur ; **300** nécessitent des familles spécialisées. Cela ne signifie ni 2 700 lieux présents dans une graine ni 2 700 architectures natives différentes. Ports, réseaux d'eau, rail, ouvrages et quartiers sans gabarit ne reçoivent pas un immeuble générique inventé pour rendre le compteur vert.

Le panneau est créé seulement à l'ouverture de la fiche ; l'image n'est générée qu'après le bouton. Réouverture sans doublon, contrôles tactiles et clavier, texte d'état accessible, largeur limitée à la fiche. Le bundle existant inclut ce module ; le nombre de dépendances publiques reste **278**. Le cache PWA devient `deadwall-v1.57.0-codex-plan165`.

## Contrôles locaux effectués

- **33/33 tests ciblés**, aucun échec, annulation ou skip : nouvelles règles d'aperçu et de surface, séries 164, contrats de rendu/version 163–164, préparation physique des défenses et vraie distribution sans node_modules.
- Classification exacte des 3 000 programmes. Inspection déterministe de **28 familles compatibles / 42 plans d'étage** dans l'échantillon ; données de référence inchangées.
- Surfaces : **228 cas de support / 360 ensembles** testés sur trois graines et quatre orientations. Ces nombres désignent des cas de test, pas des assets indépendants.
- Le vrai build termine avec **278 fichiers publics** et un autonome intégré. Les données JSON du compilateur ont été comparées à celles de la version source avant ajout du module : identiques.
- Trois rendus exploratoires du véritable peintre ont été produits avec le moteur Skia local, sans les atlases d'images chargés. Ils ne sont pas présentés comme des captures Chromium avec les dépendances verrouillées.

`npm run check` a été lancé : syntaxe et build ont terminé, mais la suite complète est bloquée localement par l'absence de `@napi-rs/canvas`. L'exécution incomplète a été arrêtée ; aucune réussite globale n'en est déduite. Chromium et les dépendances graphiques verrouillées doivent être vérifiés par la CI.

## Vérifications graphiques livrées, résultats à consulter dans la PR

`tests/codex-surface165-raster.test.cjs` utilise le moteur canvas verrouillé du projet pour comparer les pixels avec/sans contenu, sur cinq meubles et quatre orientations, sans débordement du collider.

`scripts/browser-plan165.mjs` pilote la vraie interface sur ordinateur, mobile et paysage : chargement tardif, sélection d'étage, graine, pixels reproductibles, refus, absence de duplication ou débordement et sauvegarde inchangée. Il ne téléporte pas le personnage ni ne crée une région dans la partie.

Ces nouveaux contrôles et le parcours des séries 164 sont ajoutés au workflow indépendant de revue du Codex. La validation CI du commit publié doit être rapportée séparément des essais locaux ; les anciens résultats de Défenses et D-17 ne sont pas requalifiés en résultats de cette révision.

```sh
npm run build
node --test --test-concurrency=1 tests/codex-plan165.test.cjs tests/codex-surface165.test.cjs tests/codex-surface165-raster.test.cjs
node scripts/browser-plan165.mjs
node scripts/browser-quantities164.mjs
npm run check
```

## Chantiers non clôturés

Architecture native complète des familles spécialisées ; remplacement des coques simplifiées par des répartitions extérieures et intérieures exhaustives ; eau et portillons interactifs ; progression Cité complète et autres parcours de la CI courante. Cette passe ne transforme pas les contraintes de conception en capacités de simulation déjà livrées.
