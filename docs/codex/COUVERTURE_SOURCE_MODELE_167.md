# Passe 167 — Reprendre les manquants du Codex sans les masquer

## Modification publiée

Cette passe termine les raccords interrompus du diagnostic source/modèle. Elle ne remplace ni les ensembles de mobilier de la révision 5, ni les plans G1–G8, ni les stocks, ni les anciens parcours de vérification.

Les 3 000 programmes disposent de dix axes de preuve indépendants : contexte, parcelle/niveaux, pièces/usages, mobilier auteur, jardins/annexes, accès/passages, ressources, nuit/alimentation, état du lieu et représentation du modèle. Les totaux globaux distinguent les 1 000 parents des 2 000 compositions héritées. Un nom de variante ou un équipement dans un kit ne compte pas comme une architecture construite.

Dans ATLAS & GUIDE, ouvrir une fiche puis AFFICHER LE PLAN affiche le bilan du modèle isolé : pièces rapprochées de la source, espaces absents à cet étage, extérieurs encore simplifiés dans la coque, meubles sous le minimum auteur et dimensions au sol différentes. Les accès décrits ne sont pas annoncés comme des portes matérialisées. Les décorations n'ont pas de nouveau stock.

## Attribution conservative

Un même objet ne satisfait jamais deux prescriptions. Les minima auteur sont attribués avant les surplus facultatifs. Les noms de pièce dupliqués restent ambigus et ne sont pas attribués arbitrairement. Un élément du bon type mais d'une autre dimension reste signalé. La hauteur et la fonctionnalité ne sont pas déduites d'une simple correspondance de type.

Un meuble dans une pièce source extérieure encore dessinée dans la coque ne valide pas ce jardin. Les objets de cour qui pourraient correspondre restent des candidats non attribués : il faut une zone extérieure explicitement reliée à la source pour les compter.

## Mémoire et compatibilité

Le diagnostic met en cache au plus 64 fiches. L'inspecteur n'alloue un vrai canevas que sur demande et libère sa mémoire à la fermeture. Les 278 chemins publics restent inchangés : le diagnostic est compilé dans le bundle du Codex existant. Le test de build sans node_modules vérifie le nouvel intrant source. Aucun format de sauvegarde ou générateur de carte n'est modifié par cette passe.

## Mesure des transactions

Le contrôle de la révision 4 compare désormais des instantanés à quatre frontières explicites : armement du contrôle, clic utilisateur réellement reçu, entrée de restoreSave, sortie de restoreSave et stockage persistant. Les différences avant clic sont enregistrées séparément ; toutes les données de l'action sont comparées, hors seul timestamp de sérialisation. Le contrôleur n'est pas remplacé : le wrapper appelle l'original, enregistre les résultats puis est retiré.

Il ne s'agit pas d'effacer un échec connu : les rapports contiennent les chemins des champs divergents, la confiance du clic, le nombre de restaurations et les comparaisons de toutes les valeurs. Un changement de stock, position ou toute autre donnée pendant l'action ou dans la sauvegarde persistante reste un échec.

## Vérification

Le workflow dédié exécute les contrats de couverture, les tests de transaction et la distribution reconstruite sans dépendances. Il exporte un rapport JSONL de toutes les sources et inspecte tous les étages de chaque recette compatible sur la graine 17117. Les cas géographiques spécialisés restent explicitement hors implantation.

Un second job lance le vrai navigateur avec les dépendances verrouillées, vérifie les dix axes, les buffers différés, trois réouvertures, la non-mutation des sauvegardes et les transactions de mobilier. Les autres workflows, leurs assertions, Windows et npm run check restent présents. Les résultats ne sont déclarés réussis qu'après lecture des sorties de GitHub Actions.

Commandes :

```sh
npm run build
node --test --test-concurrency=1 tests/codex-coverage167.test.cjs tests/qa-transaction167.test.cjs tests/distribution.test.cjs
node scripts/audit-codex167.mjs --all-models
node scripts/browser-coverage167.mjs
node scripts/browser-quantities164.mjs
npm run check
```

## Chantiers que le bilan ne prétend pas livrer

Ports, tunnels, échangeurs, réseaux d'eau natifs, grandes architectures, attribution physique des jardins aux zones source, ouvertures/fermetures de chaque accès, circuits électriques par luminaire et interactions d'assise. Ils restent dans le registre des manquants. Aucun score global de complétude ne transforme les descriptions en fonctionnalités.
