# Quartiers récupérables

`DeadwallWorldContent` est un module UMD pur. Son unique fonction `generate(seed)` accepte une graine numérique uint32, de `0` à `4294967295`, et renvoie :

```js
{
  sites: [{ id, name, theme, x, y }], // six quartiers
  props: [{ sceneryKind, siteId, x, y, type, amount, radius, renderSize }] // 48 gisements
}
```

Les six noms originaux sont Les Maisons sans voix, Les Arcades muettes, Le Camp des veilleurs, La Cour des citernes, Le Terminus des cendres et Le Passage du dernier feu. Chaque quartier regroupe huit décors. Des types garantis conservent les seize silhouettes sur chaque carte, tandis que les autres emplacements, les rotations de groupe et la composition thématique dépendent de la graine.

Le générateur utilise son propre flux `Random(seed ^ 0xd17c0de5)`, sans lire ni avancer le hasard de la génération historique ou de la simulation. Les sites sont placés dans six secteurs radiaux : leurs centres sont espacés de plus de 450 unités, à l'intérieur de `[256,3840]` sur chaque axe. Les décors, rayon de récupération inclus, restent hors du cercle central de rayon 650. Aucune téléportation, récompense automatique ni apparition d'ennemi n'est ajoutée par ce module.

## Nature des décors

Ce sont des **décors récupérables passables**, pas des couvertures physiques, des bâtiments constructibles ou des unités pilotables. Ils gardent les mêmes règles qu'un `ResourceNode` : collecte à proximité, quantité finie, puis épuisement. Ils n'ajoutent aucune case d'occupation, aucun blocage des alliés ou des infectés, ni nouveau calcul de chemin. Un chantier ne peut pas être placé sur un gisement non déblayé, comme pour les ressources historiques.

`C.SCENERY_DEFS` contient les valeurs d'économie et de présentation, dans l'ordre des cellules 4 × 4 de l'atlas `districtProps` :

| Type | Ressource | Quantité |
|---|---|---:|
| ruinedHouse | pierre | 45 |
| ruinedShop | ferraille | 45 |
| warehouseShell | ferraille | 55 |
| guardBooth | bois | 35 |
| ambulance | médicaments | 4 |
| bus | ferraille | 70 |
| utilityTruck | ferraille | 55 |
| tanker | carburant | 45 |
| tent | nourriture | 35 |
| container | ferraille | 55 |
| waterTank | ferraille | 40 |
| powerPylon | ferraille | 45 |
| concreteBarricade | pierre | 45 |
| burntTree | bois | 35 |
| rubble | pierre | 35 |
| streetLamp | ferraille | 35 |

Le budget cible est inférieur à 10 % des quantités générées par les gisements historiques du monde, **pas du sac de départ du joueur**. Le test compare cette proportion sur 133 graines, dont les bornes uint32. Il ne constitue pas une preuve exhaustive sur toutes les graines ni une validation d'équilibrage d'une campagne réelle. L'éloignement impose le trajet et le risque de collecte. L'ambulance garantie fournit quatre médicaments, sans soin instantané ni réapparition après épuisement.

## Intégration et sauvegardes

Le script doit être chargé après `core.js` et avant `game.js`. Le constructeur de `WorldMap` appelle le générateur **après** `generateNodes()`, copie `sites` dans `world.sites`, puis ajoute 48 `ResourceNode`. Leurs identifiants commencent au prochain `nodeId` historique. Aucun identifiant, emplacement ou montant des gisements préexistants n'est modifié ; `maxAmount` reste la quantité initiale du nouveau nœud.

Les propriétés `sceneryKind`, `siteId` et `renderSize` sont enrichies sur les nouveaux nœuds. Elles se régénèrent avec la carte et ne requièrent aucun changement de format. Les sauvegardes existantes associent toujours `[nodeId, quantité]`. Une récolte partielle ou un épuisement est donc restauré sur le bon décor. Les anciens fichiers sans ces 48 IDs obtiennent les quartiers neufs ; les constructions sauvegardées sont réappliquées ensuite, et `WorldMap.add` épuise tout décor superposé afin de ne pas recouvrir un ancien logement.

Sans module global, `WorldMap` conserve son comportement historique avec `sites: []`, pour les harness et intégrations antérieures. Ce repli technique ne constitue pas une validation du contenu livré : les tests de build et de navigateur doivent également confirmer la présence du script et de son atlas.

## Vérification

```powershell
node --test tests/world-content.test.cjs
npm run check
```

Le lot teste le déterminisme, la variation des cartes, la couverture des seize types, les bornes et distances, le budget de ressources, les IDs historiques, la passabilité, la reprise d'une collecte et la coexistence avec une ancienne sauvegarde bâtie. Le rendu, les captures et les textes d'interface sont intégrés et vérifiés séparément : générer un nœud ne prouve pas à lui seul que son visuel est affiché.
