# Occupation et composition du monde — 1.31

Le générateur de sites lointains G5 consomme `DeadwallWorldSpawns131.roll`. Le codex fournit **24 profils territoriaux**, **72 lignes de probabilité**, **24 contrats métriques** et **96 nouvelles compositions détaillées**. Quatre fiches courtes décrivent les règles réellement utilisées. Les compositions restent des projets : leur présence dans le guide ne signifie pas que leurs programmes architecturaux sont construits.

## Unité de tirage

Un tirage concerne **un site admissible**, identifié de manière stable par la graine et son ID. Il n’est renouvelé ni à chaque image, ni en entrant dans un secteur, ni en ouvrant une carte. Un site refusé par la géométrie ne reçoit pas une succession de tentatives d’occupation pour obtenir une meilleure récompense.

Les bandes sont mesurées en mètres depuis D-17 : `near` < 2 000 ; `middle` de 2 000 à moins de 6 000 ; `far` à partir de 6 000. À 250 mètres ou moins, le profil est entièrement vide. Cette protection concerne le tirage, pas la simulation d’une horde qui peut ensuite traverser cet endroit. Les nouvelles zones G5 sont au-delà du carré régional historique : elles utilisent essentiellement les bandes intermédiaire et lointaine. Les anciens sites ne sont ni déplacés ni retirés au sort.

| Milieu utilisé par G5 | Distance | Vide effectif | Infecté | Relais allié | Hostile effectif |
| --- | --- | ---: | ---: | ---: | ---: |
| rural → prairie | 2 à < 6 km | 68 % | 25 % | 7 % | 0 % |
| rural → prairie | ≥ 6 km | 59 % | 33 % | 8 % | 0 % |
| forest → forêt profonde | 2 à < 6 km | 68 % | 25 % | 7 % | 0 % |
| forest → forêt profonde | ≥ 6 km | 59 % | 33 % | 8 % | 0 % |
| industrial → industrie | 2 à < 6 km | 49 % | 46 % | 5 % | 0 % |
| industrial → industrie | ≥ 6 km | 41 % | 53 % | 6 % | 0 % |
| suburban → quartier pavillonnaire | 2 à < 6 km | 54 % | 38 % | 8 % | 0 % |
| suburban → quartier pavillonnaire | ≥ 6 km | 45 % | 46 % | 9 % | 0 % |

La table CSV complète distingue le poids de conception des camps hostiles de sa probabilité effective, actuellement nulle. Le poids désactivé est transféré au vide. Il ne gonfle pas les autres occupations. Un appel explicite `enabled:{hostile:true}` est réservé à une future intégration disposant d’un comportement réel ; le générateur livré ne l’utilise pas. De même, désactiver les relais transfère leur poids au vide.

**Ces pourcentages ne décrivent pas la proportion de toute la surface du monde.** Ils sont conditionnels à l’existence d’un site valide, son milieu, sa distance et ses exclusions. Pour un ensemble de lieux, l’espérance des sites infectés est la somme de leurs probabilités individuelles ; une graine donnée peut s’en écarter. La densité des sites par secteur, l’admissibilité des parcelles et la répartition des milieux déterminent ensuite les fréquences globales. Une même graine n’est pas un nouveau tirage statistique quand on recharge.

## Sens des occupations

- `empty` : aucun résident ajouté par cette occupation. Ce n’est pas une promesse de sécurité.
- `infected` : des infectés résidents utilisent la simulation de contacts réelle. Leur effectif appartient au générateur/runtime, pas au texte du codex.
- `allied` : point logistique physique ravitaillable. Cela ne crée ni cité humaine, ni garnison, ni nouveau logement de D-17.
- `hostile` : catégorie de conception **désactivée**. Aucun ennemi humain, combat de faction ou camp armé autonome n’est inventé.

Le type économique d’un lieu reste distinct de son occupation. Un bâtiment infecté n’obtient pas de deuxième budget de butin et un relais ne rend pas son stock infini. La santé des infectés n’augmente pas arbitrairement avec la distance.

## Interfaces de composition

`COMPOSITION_CONTRACTS` décrit pour chaque milieu une enveloppe minimale/maximale en mètres, des largeurs de passage piéton et véhicule, une surface admissible, les familles de ressources et les quatre modules associés. Ces dimensions sont des choix de conception ; elles ne sont pas des normes de bâtiments réels. Une enveloppe n’autorise pas à comprimer tous les modules maximaux dans la parcelle minimale.

L’ordre de résolution reste : relief et eau → réseau routier → emprises → entrées et retours → bâtiments/niveaux → mobilier → réserves → état d’abandon → lumières. Un module dépend d’une entrée, d’un parcours de retour et de sa desserte. Le stock d’un meuble ne peut pas exister au-delà de sa portée accessible. Une lumière ne justifie pas une énergie gratuite.

`placementAllowed` est un validateur conservateur d’enveloppes rectangulaires **de conception**, utile pour les nouveaux assembleurs. Il refuse limite extérieure, eau, pente excessive, voisin trop proche, route traversant l’emprise, passage trop étroit et absence de connexion. Il n’est pas un remplacement des colliders tournés, de la navigation ou de la vérification effective des ouvertures du moteur. Le générateur G5 emploie sa propre validation géométrique détaillée.

Pour les milieux sans système disponible (montagne, falaise, eau, galerie souterraine), le contrat mentionne cette dépendance et conserve le statut projet. Aucun spawn ne transforme un sol plan en véritable relief. Aucun programme de port ne débloque implicitement les bateaux.

## Ressources, répétition, longue partie

Fixer d’abord une enveloppe de ressources pour le site entier, puis répartir cette enveloppe entre ses contenants. Une variante « pillée » retire des réserves ; une variante « évacuée » déplace des objets dans des emprises admissibles. Aucun changement de décor ni de secteur ne recrée du butin déjà pris. Répéter un module de stockage ne répète pas son budget automatiquement.

Le plan de la région peut être reconstitué depuis sa graine et sa version. Les états fouillé, infecté tué, cargaison transférée et relais ravitaillé appartiennent aux registres persistants. Cache évincé ne signifie pas état oublié. Les IDs des lieux historiques restent distincts des nouveaux secteurs G5.

## Fichiers et responsabilités

| Fichier | Fonction |
| --- | --- |
| `src/core.js` → `Spawn131Rules` | Seule source runtime des poids, bandes et dégagements de référence |
| `src/world-spawns131.js` | Tirage pur, aliases, contrats et validateur d’enveloppes |
| `src/world-stream131.js` | Consommation réelle dans les secteurs lointains G5 |
| `src/world-codex-*.js` | 100 nouvelles fiches du guide, dont 96 programmes de conception |
| `SPAWNS_1_31.csv` / `SPAWN_PROFILES_1_31.json` | Export lisible des probabilités, contrôlé par test contre les règles |
| `PLACEMENT_CONTRACTS_1_31.json` | Export des 24 programmes métriques, contrôlé contre le module |
| `COMPOSITIONS_1_31.md` / `.json` | 96 compositions contextualisées, contrôlées contre les fiches |

Les 1 051 fichiers originaux suivis par empreinte dans le compagnon restent inchangés. L’addendum 1.31 est séparé des originaux et des 3 000 fiches historiques/composées.

## Couverture effective de cette livraison

Le monde G5 utilise exactement **quatre milieux de sélection** : rural, forestier, industriel et résidentiel. Ils réemploient des gabarits de bâtiments existants, choisis dans les listes de `world-stream131.js`. Les vingt autres profils sont une préparation de contenu documentée ; ils n’ajoutent pas de côte, montagne, port, marais ou métropole simulés. Le catalogue intégré compte maintenant **164 fiches** (64 antérieures + 100 nouvelles), et le filtre « Contenu présent » masque les 96 nouvelles compositions en projet.
