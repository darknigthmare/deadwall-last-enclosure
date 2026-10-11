# DEADWALL — Addendum de codex : génération dense par graine (1.57)

## Couverture réelle

Cette extension enrichit les **62 gabarits régionaux effectivement visitables** de la génération G7 : cours, jardins, équipements et petits détails intérieurs. Elle ajoute **62 fiches consultables dans ATLAS & GUIDE**, réparties en **17 familles fonctionnelles** et **86 variantes de composition**. Le catalogue historique de 3 000 propositions demeure un catalogue de conception, pas 3 000 nouveaux bâtiments intégrés.

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

Les obstacles solides (clôture, abri, piscine, gros objet) participent aux **collisions piétonnes, lignes de vision et gabarits automobiles**. Les revêtements de sol et décorations fines sont traversables. Le rendu 2D de ces éléments utilise le même espace métrique et la même profondeur que le reste du monde. Les états lumineux et l'énergie restent ceux de la simulation existante.

Le codex en jeu distingue ces profils G7 « pilote » des programmes seulement proposés. Aucune nouvelle ressource ou technologie n'est acquise en consultant une fiche.

## Routes, rues et chaussées

Les vrais tronçons régionaux reçoivent un décor déterministe de **rustines, traces d'usure, regards et reprises**. Ces détails n'altèrent ni la chaussée, ni son tracé, ni les raccords existants. La peinture est limitée au voisinage visible et dépend des coordonnées mondiales, pas de l'ordre de chargement des secteurs.

Les 51 profils et 204 formes de routes du codex 1.33 restent distingués : les autoroutes avec voies séparées, ponts dénivelés, échangeurs et tunnels ne sont **pas** générés simplement parce qu'une fiche les décrit. Leur vraie intégration devra apporter altitude, raccords, accès et collisions spécifiques.

## Sauvegardes, invariants, performances

La couche de détail est calculée à la demande et conservée dans un petit cache de 64 programmes. Elle n'est pas injectée dans le tableau de bâtiments, les anciens étages, le parking ou les nœuds de butin. Les empreintes des lieux G7, leurs niveaux et le générateur G1–G6 restent inchangés. Une vieille sauvegarde peut néanmoins découvrir davantage d'obstacles dans une cour auparavant vide : la vérification de reprise sur plusieurs graines reste nécessaire.

Contrôles : exhaustivité des 62 types, stabilité sur une même graine, variété entre graines, piscine unique, dégagement des portes et parkings, objets intérieurs compatibles avec les murs, absence de loot nouveau, collision et rendu, empreintes des plans et POI inchangées, absence de surcharge des routes et caches.

## Chantiers restant ouverts

Portillons manœuvrables, comportement de l'eau (baignade/risques), état électrique individuel de chaque fenêtre ou lampe, mobilier interactif très détaillé des immenses centres commerciaux, nouveaux étages et ascenseurs, nouvelles géométries routières réelles, génération des lieux de conception manquants. Ces capacités ne sont pas annoncées comme livrées.

Modules : src/seed-detail157.js ; src/seed-detail-art157.js ; src/world-codex-seed157.js ; src/frontier-world.js ; src/frontier-art.js ; tests/seed-detail157.test.cjs.
