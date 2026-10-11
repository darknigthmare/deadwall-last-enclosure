# DEADWALL — Addendum de codex : génération dense par graine (1.57)

## Couverture réelle

Cette extension enrichit les **62 gabarits régionaux effectivement visitables** de la génération G7 : cours, jardins, équipements et petits détails intérieurs. Elle ajoute **62 fiches consultables dans ATLAS & GUIDE**, réparties en **17 familles fonctionnelles** et **86 variantes de composition**.

Les **3 000 programmes du Codex sont également compilés dans le runtime et consultables dans le guide** : 1 000 programmes auteur conservés et 2 000 variantes liées à leur parent, leur contexte et leur état. Ils fournissent des plans métriques exécutables pour les nouveaux sites G8. Leur implantation est filtrée par la graine, le biome, l'agglomération, les routes, les accès et l'emprise libre ; **une région ne garantit pas 3 000 implantations**. Un programme consultable reste distinct d'un lieu réellement construit. Les programmes exigeant un littoral, de l'eau, un relief ou un ouvrage absent du terrain ne sont pas forcés sur un sol incompatible.

La sélection dépend exclusivement de la graine, de l'identifiant stable de parcelle, de son type, de son programme et de son étage ; ni les images ni l'ouverture d'une carte ne relancent le tirage. Les nouveaux éléments n'ont aucun butin gratuit.

## Architecture de la parcelle

Ordre impératif : route et accès → emprise réservée → bâtiment et escaliers → parking et meubles existants → couches complémentaires. Le nouvel objet est refusé en cas de collision ou débordement, en particulier au droit de la porte d'entrée, de la desserte automobile ou du couloir piéton central de **3,6 mètres** traversant le jardin arrière.

La couche extérieure varie de 5 à 11 éléments selon la largeur disponible, plus des fragments de clôtures qui ménagent un portillon arrière ouvert. Le programme ne promet pas qu'une parcelle étroite accueille toutes les options simultanément.

## Programme : tous les types de bâtiments

| Famille | Gabarits intégrés | Variantes et détails possibles |
|---|---|---|
| Maisons | house, duplex, cabin, basementHouse, cottageSmall, rowhouse, bungalow, familyHouse, farmhouse, villa, duplexWide | Jardin fleuri, potager, verger, terrasse, pelouse, jeux, piscine, cour d'atelier, fleurs, compost, haies, récupérateur d'eau, cabanon, barbecue, banc |
| Collectifs | apartments, studioBlock, longBlock, residence | Jardin et cour partagés, vélos, zone déchets, parking, bancs, aire de jeux, accès personnel |
| Alimentation | grocer, market, bakery, centralKitchen, cornerShop, superstore | Quai, palette, chariot, enseigne, cartons, comptoir, rayons, arrière-boutique |
| Restauration | diner, cafe, inn | Terrasse, enseigne, tables, menus, cuisine, livraison, mobilier de salle |
| Hôtels | hotel, motel | Parking, terrasse, bancs, lingerie et, si la taille le permet, piscine d'hôtel |
| Magasins spécialisés | mall, hardware, garden | Rayonnages, chariots, plants, auvents, palettes, quais et panneaux |
| Santé | clinic, medicalCentre, dental, veterinary, pharmacy | Paravents, plateaux, équipement léger de soin, attente, archives, cour sanitaire |
| Administration | townhall, bank, postoffice, library, chapel | Parvis, banc, signalétique, courrier, dossiers, archives, entretien |
| Éducation / bureaux | school, officeBlock | Cour, jeux, panneaux, rangement, classes, bureaux, accès personnel |
| Loisirs | gym, laundry | Vestiaires, petit mobilier, vélos, linge, machine et cour technique |
| Artisanat | garage, joinery, smallWorkshop, reuse | Pneus, établi, caisses, matériaux, ferraille, entretien |
| Logistique | warehouse, freight, selfstorage, logisticsHall | Palettes, conteneurs, quai, caisse, stockage et circulation conservée |
| Industrie | sawmill, mine, quarry, scrapyard | Bois, roche, déchets, stockage, machines arrêtées, outillage |
| Agriculture | marketgarden | Potager, plates-bandes, compost, réserve d'eau, zone de culture |
| Réseaux | fuel, generatorRoom, waterStation | Potelets, tonneaux, entretien, signaux de sécurité, matériel technique |
| Sécurité et secours | bunker, firestation | Réserve et cour de matériel, caisses, barrières, signalétique |
| Ruines | ruin | Végétation envahissante, débris, déchets, vestiges de mobilier |

### Exemples de correspondances strictes

- Le tirage « piscine privée » force **une seule piscine** et privilégie une terrasse. Les petites maisons n'ont pas cette variante.
- « Jardin fleuri » privilégie massifs et plantes ; « potager » privilégie cultures et compost ; « verger » privilégie arbres et stockage d'eau.
- « Cour de livraison » privilégie palettes et chariots ; « zone de conteneurs » privilégie conteneurs et palettes ; « zone de maintenance » privilégie établis et tonneaux.
- « Aire de jeux » privilégie portique et bancs ; « cour de récréation » privilégie jeux accessibles.
- Les objets complémentaires sont tous dépendants de l'emprise réellement libre : pas de piscine sur une voiture, pas de cabanon sur un quai, pas de clôture barrant systématiquement la sortie.

## Intérieurs et progression

Chaque pièce déjà programmée peut recevoir de petits éléments correspondant à son nom réel : chambre, buanderie, cuisine, réception, atelier, pharmacie, classe, réserve, bureau, etc. Deux opportunités de placement sont testées par pièce ; le générateur refuse les meubles qui coupent les murs, escaliers ou objets d'origine. Une décoration ne duplique ni loot ni inventaire.

Dans une nouvelle campagne, les obstacles solides (clôture, abri, piscine, gros objet) participent aux **collisions piétonnes, lignes de vision et gabarits automobiles**. Les revêtements de sol et décorations fines sont traversables. Les anciennes sauvegardes gardent leurs collisions historiques, selon le champ régional décrit ci-dessous. Le rendu 2D de ces éléments utilise le même espace métrique et la même profondeur que le reste du monde. Les états lumineux et l'énergie restent ceux de la simulation existante.

Le codex en jeu distingue les profils G7 « pilote », les programmes consultables et les lieux effectivement implantés. Aucune nouvelle ressource ou technologie n'est acquise en consultant une fiche. Les nouveaux lieux G8 ont leurs propres contenants finis ; les détails complémentaires ne dupliquent pas le butin.

Les emprises et les niveaux des sources auteur sont conservés dans la provenance. Le plan jouable adapte les dimensions aux contraintes du générateur et conserve **au plus trois niveaux jouables** pour les programmes actuels. Une tour auteur de neuf niveaux est ainsi représentée par trois niveaux [0, 1, 2] ; une référence auteur ne rend pas ses autres étages accessibles. Le runtime expose les niveaux de référence et signale séparément l'adaptation d'emprise et celle des niveaux.

## Activation volontaire de G8

Depuis une région **G7**, le commandant rejoint le **dépôt de D-17** et choisit l'extension aux 3 000 programmes. Il doit être disponible, avoir terminé son rechargement et ne pas avoir de travail en cours. Le catalogue complet doit être chargé. Le bouton indique les mêmes restrictions que l'action effective.

L'activation est refusée si un nouveau site recouvrirait un **bivouac, un éclairage posé ou la voiture régionale**. Le message demande de démonter ou récupérer l'équipement sur place, ou de déplacer la voiture vers un accès dégagé. Le refus ne supprime aucun support, ne le téléporte pas et ne prélève aucune ressource. Après avoir dégagé l'emplacement, l'extension peut être relancée.

Les anciens lieux, leurs plans, les stocks et les prélèvements restent conservés. Les secteurs déjà relevés et payés gardent leur couverture : leurs nouveaux sites deviennent connus sans nouveau paiement, mais leurs ressources ne sont pas offertes. Les autres secteurs restent à découvrir.

## Routes, rues et chaussées

Les vrais tronçons régionaux reçoivent un décor déterministe de **rustines, traces d'usure, regards et reprises**. Ces détails n'altèrent ni la chaussée, ni son tracé, ni les raccords existants. La peinture est limitée au voisinage visible et dépend des coordonnées mondiales, pas de l'ordre de chargement des secteurs.

Les 51 profils et 204 formes de routes du codex 1.33 restent distingués : les autoroutes avec voies séparées, ponts dénivelés, échangeurs et tunnels ne sont **pas** générés simplement parce qu'une fiche les décrit. Leur vraie intégration devra apporter altitude, raccords, accès et collisions spécifiques.

## Sauvegardes, invariants, performances

La couche de détail est calculée à la demande et conservée dans un petit cache de 64 programmes. Elle n'est pas injectée dans le tableau des anciens bâtiments, leurs étages, leur parking ou leurs nœuds de butin. G8 ajoute ses propres sites sans déplacer les lieux G7. Les générations G1–G7 conservent leurs empreintes, plans et stocks historiques avec les options par défaut.

Le champ régional optionnel **`frontier.detailVersion`** protège les reprises : une sauvegarde ancienne sans champ est normalisée à **0** et conserve les collisions historiques de ses anciens lieux ; une nouvelle campagne utilise **1** et active les collisions des détails ajoutés. Les détails des anciens lieux restent visibles à 0. Les **nouveaux sites G8 ont leurs détails solides dès leur création**, y compris dans une campagne reprise à 0. Le champ accepte uniquement les nombres 0 et 1 et ne change pas le format global de sauvegarde.

G8 reproduit les identités et les quantités du scatter G7 avant d'enlever les arbres ou rochers couverts par ses nouvelles réservations. Ces objets retirés restent dans un registre fini de validation (`chunk.cleared`), sans être récoltables : un prélèvement ancien reste valide, sans ressource de remplacement ni réapparition après éviction du cache ou reprise. Les prélèvements dépassant la quantité d'origine restent refusés.

Contrôles : exhaustivité des 62 types, stabilité sur une même graine, variété entre graines, piscine unique, dégagement des portes et parkings, objets intérieurs compatibles avec les murs, absence de loot nouveau, collision et rendu, empreintes des plans et POI inchangées, absence de surcharge des routes et caches.

## Chantiers restant ouverts

Portillons manœuvrables, comportement de l'eau (baignade/risques), état électrique individuel de chaque fenêtre ou lampe, mobilier interactif très détaillé des immenses centres commerciaux, étages au-delà de l'adaptation actuelle et ascenseurs, nouvelles géométries routières réelles, supports de terrain nécessaires aux programmes encore exclus. Ces capacités ne sont pas annoncées comme livrées.

Modules : src/seed-detail157.js ; src/seed-detail-art157.js ; src/world-codex-seed157.js ; src/codex3000-runtime.js ; src/codex3000-live-data.js ; src/frontier-world.js ; src/frontier-state.js ; src/frontier.js ; src/world-pack131.js ; src/frontier-art.js ; scripts/compile-codex3000.mjs ; tests/seed-detail157.test.cjs ; tests/codex3000-runtime.test.cjs ; tests/g8-migration157.test.cjs.
