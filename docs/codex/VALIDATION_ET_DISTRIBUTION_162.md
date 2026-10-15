# Passe 162 — Commandes tactiles, collisions et distribution

Base initiale : `7ff395e43617e5f9714eaa1b97564b3aec63c37a`, puis intégration de `7aad40d9764911f1e0d9491476c8ce6c1726bb24` (extérieurs et accès conservés), PR #2, paquet 1.57.0. Aucun changement de main, aucune fusion ni publication de production.

## Blocage précédent identifié

Le run GitHub Actions 38217913342 a terminé ses **3 223 tests de code avec endurance**, sans échec, annulation ni skip. Windows a également passé la fabrication, l’extraction et les deux lancements. Le job web a ensuite échoué sur le bouton de torche en paysage : la capture Ubuntu montre le texte réparti et coupé dans une cible de 44 × 44 pixels. Le contrôle du pointeur passait, celui du texte échouait. Le PWA passait ses deux profils. Ces résultats sont ceux de la base, pas une certification du nouveau commit.

Le premier essai local avec les polices natives du sandbox ne reproduisait pas ce débordement. Le diagnostic repose sur le rapport et la capture réels de la CI, puis sur des tests de polices de remplacement explicites.

## Torche lisible dans sa vraie cible

En écran tactile court et large (au moins 560 pixels), la torche occupe deux cellules, soit **91 × 44 pixels**, sur la même étagère de deux rangées. Les directions conservent leur croix ; action et tir occupent la colonne de droite. Le texte complet ÉTEINTE/ALLUMÉE, le raccourci [L], le bouton d’origine et son état accessible restent conservés. La taille du texte n’est pas diminuée. Les règles des petits portraits restent inchangées.

Le nouveau parcours Chromium vérifie **88 contrôles** sur 844×390, 667×375, 568×320 et 390×844 : trois polices (native, DejaVu Sans et serif), allumage/extinction par vrais taps, limites du texte, pointeur, absence de chevauchement et touches utilisables après rotation aller-retour. Ce sont des vues émulées, pas des téléphones physiques.

Le job tactile est indépendant de la longue suite de code pour signaler ce défaut plus tôt. Les étapes de CI existantes sont conservées. Le cache PWA devient `deadwall-v1.57.0-touch-layout162`, avec les mêmes 278 fichiers publics.

## Audit des objets réellement placés

`tests/codex-world162.test.cjs` contrôle les 62 familles natives et 16 sites de programme répartis dans le catalogue, sur chacune des graines 42, 17117, 17118, 135135 et 271828. Résultat terminé : **390 lieux, 546 niveaux et 1 212 meubles ancrés**. Les quatre faces murales sont représentées ; aucun centre d’espace de service n’est bloqué dans cet échantillon, avant ou après enrichissement.

Le test utilise les coordonnées monde et les vraies fonctions `blocked` et `line`, pas uniquement le quadrillage du prescripteur. Il vérifie la rotation local/monde, le blocage des meubles et des rayons traversants, les plans et quantités sources inchangés, les anciens détails conservés, ainsi que la stabilité après éviction du cache. Aucun meuble ajouté ne reçoit de stock ni de ressource.

Cet audit ne certifie pas chaque trajet continu, chaque véhicule ou les 3 000 architectures. Il ne modifie aucun placement sauvegardé, rayon de collision, coût, stock, ennemi ou sprite. Les révisions de détail 0 à 3 et les anciennes sauvegardes sont conservées. Une première exploration non bornée a été interrompue ; elle n’est pas revendiquée comme une réussite. Le test livré borne le coût de la CI tout en couvrant les 62 familles natives.

## Génération autonome en une passe

Le générateur remplaçait chaque image dans des chaînes croissantes, puis réécrivait le HTML pour chaque inclusion. Un build concurrent a réellement été tué (code 137) dans le sandbox ; cela ne prouve pas à lui seul un défaut sur tous les hôtes.

La nouvelle fonction de build remplace les références originales en une passe et assemble les inclusions du document en une passe. Elle conserve l’ordre, les caractères de remplacement littéraux, les références inconnues pour la validation finale, et les erreurs de fichiers absents. Le helper est une dépendance de build, jamais un nouveau fichier public.

Quatre tests comparent l’algorithme aux sources et inclusions actuelles avec des charges d’images de test, puis couvrent les chemins spéciaux et les erreurs. Le vrai build termine avec 278 fichiers publics et un HTML autonome intégré. Les tests de distribution reconstruisent également le vrai paquet sans node_modules, à partir des sources auteur. Aucune réduction de taille de l’archive ni mesure de FPS n’est revendiquée.

## Contrôles locaux terminés avant publication

- 17/17 tests ciblés : ancrages existants, distribution réelle sans dépendances et nouvel inliner. Aucun échec, annulation ou skip.
- 1/1 audit monde décrit ci-dessus, distinct des 17 tests.
- 88/88 contrôles du nouveau parcours tactile, sans erreur navigateur.
- 244 fichiers passent la vérification de syntaxe.
- Parcours navigateur général : 171 contrôles, puis 30 PWA, terminés avec code 0 sur le correctif tactile avant le changement d’identifiant de cache.
- Campagne, repli tactique, terrain, voyage régional, échelons d’assaut, reconstruction et visibilité terminent avec code 0. Les derniers parcours et la CI du commit publié sont attestés séparément dans la PR, sans extrapolation.

Les répétitions ne sont pas additionnées comme des tests distincts. Ces validations automatiques ne remplacent pas des campagnes humaines longues ni une recette commerciale.

```sh
node --test tests/standalone-inline162.test.cjs tests/distribution.test.cjs tests/codex-anchors160.test.cjs tests/codex-world162.test.cjs
npm run build
node scripts/browser-touch-layout162.mjs
npm run test:browser
DEADWALL_SOAK=1 npm run check
```

## Dernières reprises et blocages encore ouverts

Après intégration de `7aad40d`, le build réel termine de nouveau, le parcours tactile repasse ses **88 contrôles** et le parcours des extérieurs `browser-sites162.mjs` réussit sur desktop et mobile : prescriptions, consultation sans mutation, scènes résidence/agriculture/logistique et connexions déclarées conservées.

Le balayage navigateur a aussi terminé Préparatifs avec succès (trois formats, 14 contrôles natifs et 87 avancés par format). Le HTML autonome a passé son ouverture réelle depuis le disque : **8 contrôles**, code 0. Ces répétitions ne sont pas des tests distincts supplémentaires des contrôles déjà cités.

Trois suites restent en échec et ne sont pas masquées :
- Défenses : le profil desktop réussit ; le mobile perd la référence du mécanisme après la préparation de départ des contacts retenus. Le maintien d'autres infectés libres près du support est une piste à isoler, pas une cause déclarée certaine.
- Progression D-17 : la vérification du centre attend encore l'atlas de base de 149, alors que le rendu peut choisir une variante 157. Le contrat doit vérifier le sprite réellement sélectionné et dessiné, sans accepter arbitrairement n'importe quel atlas.
- Cité : le parcours exige littéralement une version `1.53.*` alors que le paquet est en 1.57.0. Ce contrôle obsolète doit être remplacé par une comparaison exacte avec la version du paquet, puis le reste du parcours rejoué.

Aucune de ces trois assertions n'est supprimée ou affaiblie dans cette passe. La CI globale n'est pas annoncée verte ; la PR doit rester en brouillon. Les résultats CI du nouveau commit sont consignés séparément dans la conversation de PR.
