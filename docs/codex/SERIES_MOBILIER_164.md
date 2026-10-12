# Passe 164 — séries de mobilier et clôture du contrôle Cité

Base de développement vérifiée : `2c505a418d68c939d0dd48a1aff5c7ae8d094e0f`, PR #2. Les révisions précédentes, les sprites, les parcours d'accès, les sources auteur et les budgets de fouille sont conservés. Cette passe ne modifie ni main ni la production.

## Remplir d'après les quantités source

La révision optionnelle **4** complète des séries de **lits, canapés, armoires, rayonnages, bureaux, établis, comptoirs et armoires de soins** quand la fiche de la pièce contient une quantité et un gabarit exploitables. Le tirage reproductible utilise la graine, le lieu, l'étage, la pièce et le type. Il compte d'abord les meubles déjà présents et ne les déplace, remplace ou supprime jamais.

Le placement réutilise les vrais segments de mur et poursuit les rangées existantes lorsque l'espace le permet. Les dimensions proviennent du meuble source. L'écart au mur reste de 4 cm ; les orientations sont cardinales dans la parcelle, puis suivent sa rotation dans le monde. Les faces de service des meubles nouveaux **et anciens** sont réservées. Murs, escaliers, meubles, décoration existante et points d'accès joignables sont conservés. Les éléments refusés restent identifiés dans `detail.quantities164.requests`, avec quantité déjà présente, objectif tiré, compléments posés et reste non placé.

Limites de génération, et non promesses de présence : **24 compléments par étage, 6 par pièce et 8 par type demandé**. Les quantités excessives sont signalées comme plafonnées. Une largeur de service source supérieure à 1,8 m n'est pas rétrécie : le module refuse cette prescription. Les équipements sans quantité/gabarit exploitable, les réseaux techniques et les pièces extérieures ne reçoivent pas de répétition inventée.

Dans le catalogue courant, **1 449 programmes** ont au moins une prescription de meuble répétable prise en charge. Les **1 551 autres** conservent leurs kits et aménagements précédents : ce n'est pas une suppression de contenu. Les 6 042 références répétables comptées sont des occurrences héritées dans les programmes, pas des sprites indépendants.

## Activation et sauvegardes

Au dépôt D-17, dans **Monde & relais**, choisir **COMPLÉTER LES SÉRIES DE MOBILIER**. Le même contrôle transactionnel que les révisions 2/3 vérifie l'état du commandant, ses actions, les possessions régionales et le véhicule. Une restauration refusée ne peut pas annoncer de succès. La révision est sauvegardée, l'action répétée est refusée. Les campagnes existantes restent sur leur révision 0/1/2/3 tant que l'utilisateur n'active pas cette option.

Les meubles ajoutés sont des volumes visibles et solides, intégrés aux collisions piétonnes, véhicules et lignes de vue via la couche existante. **Aucun champ `amount` ou `resource`, aucune ressource produite et aucun deuxième budget de butin.** Les tableaux de lieux, routes, plans historiques et contenants conservent leurs données. L'Atlas expose l'activation et ses limites à l'ouverture de la fiche, sans modifier la sauvegarde.

## Vérification des 20 modèles de Cité

Le dernier échec du parcours Cité provenait de son filtre sur les quatre atlas historiques : des bâtiments bien dessinés avec une variante 157 n'étaient pas comptés. Le nouveau contrôle vérifie le **modèle vivant exact**, son atlas choisi, son rectangle source et sa destination métrique. Un autre bâtiment, une découpe erronée, une position décalée, un dessin absent ou refusé ne peut pas satisfaire le contrôle. Les fonctions enveloppées et la caméra sont restaurées même en cas d'exception. Les paiements, travaux réels, formation de 90 secondes et sauvegardes du parcours complet ne sont pas supprimés ni accélérés.

## Tests terminés localement

Les **10 nouveaux tests de code passent** : intervalles de quantité, six rayonnages d'une prescription préparée, refus de poses incompatibles, inspection des 3 000 fiches, conservation géométrique, activation transactionnelle et preuve de rendu négative/positive.

Le parcours d'aménagement couvre **124 lieux / 182 étages** (les 62 types sur deux graines), avec **69 compléments posés**. Le contrôle en monde G8 échantillonne **78 sites** et vérifie **22 nouveaux volumes physiques**, tout en comparant exactement les anciens plans et stocks. Ce sont des échantillons, pas une preuve de tous les trajets continus possibles.

L'essai Chromium local a été refusé par la politique réseau du navigateur sur l'adresse locale avant de charger le jeu. Il n'est pas compté comme une réussite navigateur. La commande `npm run check` a réellement lancé syntaxe, build et tests ; elle a été interrompue après des erreurs d’import de `@napi-rs/canvas`, non installé dans cet environnement. Aucun succès global local n’est revendiqué. Les 7 tests existants des contrats QA 163 et des défenses passent séparément. Les parcours complets avec les versions verrouillées des dépendances s’exécutent dans GitHub Actions ; seuls les résultats terminés y sont rapportés comme réussis.

```sh
npm run check
node --test --test-concurrency=1 tests/city-proof164.test.cjs tests/codex-quantities164.test.cjs
npm run test:city
```

## Chantiers restant distincts

Cette passe ajoute une densification physique de meubles et corrige la mesure du rendu Cité. Elle ne livre pas de nouvelles architectures natives de ports, tunnels, échangeurs, quartiers complets ni de nouveaux réseaux fonctionnels. Les grands plans G8 restent simplifiés ; les prescriptions non prises en charge restent explicitement séparées du contenu matérialisé.
