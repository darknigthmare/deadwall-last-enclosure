# Monde sans bord — plan technique

Besoin et inventaire : [spec.md](spec.md). Tâches : [tasks.md](tasks.md).

## 1. Principe

Une **génération 12**, réservée aux nouvelles campagnes, à côté des générations 1 à 11 qui
restent ce qu'elles sont. On n'élargit pas la région finie : on écrit un second monde derrière
la même interface (`world.roads`, `nearPOI`, `chunk`, `blocked`, …), et `frontier-world.create`
aiguille selon la génération. Aucun code de G1–G11 n'est réécrit ; aucun de leurs flux ne
reçoit de tirage.

```
                 frontier-world.create(seed, generation, effects)
                      │ generation ≤ 11            │ generation = 12
                      ▼                            ▼
              monde fini (inchangé)      world-open217 (façade même interface)
                                                   │
                         world-cantons217 (adressage, sous-graines, anneau, cache)  ← livré
                                                   │
          macro217 (fonctions de champ)   canton217 (routes, lieux, eau d'un canton)
```

## 2. Adressage — livré (tranche T0)

`src/world-cantons217.js`, règles `C.WorldCantons217Rules` (`src/core.js`) :

- canton de **1 024 m** (taille du secteur actuel), morceaux de décor de 256 m inchangés ;
- coordonnées entières signées, `|c| ≤ 1 048 575` (mètres exacts en flottant) ;
- identifiants : canton `K12_-3`, objet `K12_-3:site:7`, couture `Kv13_-3` / `Kh12_-3` —
  forme canonique unique, refusée par toutes les expressions historiques (`P\d{4}`, `S…`,
  `[TR]…`, `N165_…`, `T131_…`, `T135_…`) et réciproquement ;
- sous-graines `subSeed(graine, cx, cy, flux)`, `edgeSeed(…, côté, flux)`,
  `cornerSeed(…)` : fonctions pures, flux **nouveaux** (aucun recoupement avec `G.hash` /
  `G.rng`), vecteurs de référence figés dans le test ;
- anneau de chargement ordonné du plus proche au plus lointain, plan `load / drop` avec
  hystérésis (charge à 1 canton, lâche au-delà de 2), cache borné à 36 cantons qui n'évince
  jamais l'anneau protégé.

Non chargé par `index.html` ; lu par aucun autre fichier.

## 3. Génération d'un canton (tranches T1–T3)

### 3.1 Trois étages, du plus large au plus fin

1. **Champs macro** (`macro217`) : fonctions pures de (graine, x, y) sans mémoire — climat et
   biome (les 16 milieux existants, `biomes164` échantillonné sans emprise globale), densité
   d'habitat, bande de distance à D-17. Coût : quelques bruits par échantillon.
2. **Sommets et coutures** : chaque sommet de la grille tire (par `cornerSeed`) s'il porte un
   carrefour ou une agglomération ; chaque couture tire (par `edgeSeed`) ses **points de
   raccord** : 0 à 2 passages de route (position le long de la couture, largeur, classe) et
   0 ou 1 passage d'eau. Les deux cantons qui partagent la couture lisent la même graine,
   donc les mêmes points — sans se connaître.
3. **Intérieur du canton** : relie ses points de raccord et ses carrefours (arbre couvrant
   local, courbes du `region-roadkit` existant), puis pose rues, lieux et décor avec
   `stream(graine, cx, cy, flux)`. Tout ce qui est posé reste à une marge de la couture
   (aucune parcelle à cheval), sauf les routes et l'eau qui la franchissent aux points tirés.

Conséquence : un canton se calcule **seul**, avec ses quatre coutures et ses quatre sommets.
Pas de passe globale, pas d'arbre couvrant de région, pas de compteur partagé.

### 3.2 Ce qui était global et sa traduction locale

| Aujourd'hui | En G12 |
|---|---|
| 34 agglomérations tirées en séquence (`geography135.js:15-25`) | Agglomération portée par un sommet : présence et taille = fonction du sommet et de la densité macro ; nom par hachage de l'identifiant. Chevauchement de 2 × 2 cantons au plus. |
| Arbre couvrant de toutes les villes (`:34-41`) | Connexité par construction : chaque couture porte au moins un passage sur une trame régulière (une couture sur n, tirée par `edgeSeed`), plus les passages aléatoires. À prouver par test de connexité sur 31 × 31 cantons. |
| Côte sur un bord, cinq rivières bord-à-côte (`hydrology165.js:18-39`) | Champ d'altitude macro : l'eau suit le gradient de couture en couture ; la mer est un champ (altitude < seuil), pas un bord. Tranche à part (T3) : c'est la plus risquée. |
| D-17 en fraction de la taille (`geography135.js:8`) | D-17 dans le canton `K0_0`, décalage tiré par la graine. Les coordonnées négatives existent dès le départ. |
| Lieux `P0000…P9999` | `K<cx>_<cy>:site:<n>`, n = rang de pose dans le canton. |
| Migrations : route `% w.roads.length` (`world-evolution.js:5-6`) | Tirage parmi les routes des cantons **chargés**, ordonnées par identifiant ; l'état des groupes est déjà sauvegardé, donc pas d'exigence de reproductibilité hors sauvegarde. À trancher (D5). |
| Itinéraire : Dijkstra global (`frontier-routing.js:44`) | Graphe des cantons chargés + graphe **macro** des coutures (un nœud par point de raccord) pour les trajets longs. |

### 3.3 Monde de façade

`world-open217.create(seed, effects)` rend le même objet que `frontier-world.create`, avec :

- `size: Infinity` et `bounds: null` — **à ne pas faire** : trente fichiers comparent à
  `w.size`. À la place : `unbounded: true`, et un accesseur `world.contains(x, y)` introduit
  d'abord en G1–G11 (tranche T1, sans changement de valeur) puis lu partout à la place de
  `x < 0 || x > w.size` ;
- `roads`, `pois`, `towns`, `sectors` : vues sur les cantons chargés ; `pois.find(id)` est
  remplacé par `world.site(id)` qui charge le canton nommé par l'identifiant ;
- `chunk`, `plan`, `detailAt`, `nearPOI`, `nearestRoad`, `blocked` : inchangés de forme, la
  clé de morceau devient signée.

## 4. Sauvegarde (tranche T4)

- `frontier.generation = 12` accepté par `frontier-state.normalize` ; bornes de position
  remplacées par `|x|, |y| ≤ maxCoordinate × 1024` ; expressions d'identifiants étendues **pour
  G12 seulement** (une sauvegarde G≤11 contenant un identifiant `K…` est refusée, et
  l'inverse).
- Registres creux existants conservés : `taken`, `enemies`, `seen`, `notes`, `tracks`.
  Rien d'autre n'est écrit : un canton traversé sans y toucher ne pèse rien.
- Nouveau : `cantons` = identifiants des cantons **vus** (pour l'atlas), plafonné.
- Validation : ne régénère que les cantons nommés par les identifiants de la sauvegarde,
  sous un plafond de cantons par validation ; au-delà, contrôle de forme seul (point D4).
- Version de sauvegarde générale : montée d'un cran, migration vide pour les anciennes.
- `field-atlas-state` : cellules de reconnaissance indexées par canton (`K…:cell:n`) au lieu
  de l'indice dense.

## 5. Coût par image et mémoire

| Poste | Budget visé | Moyen |
|---|---|---|
| Création de campagne | < 2 s | 9 cantons (anneau de rayon 1) au lieu de 576 secteurs |
| Génération en jeu | 1 canton par image au plus, ≤ 8 ms en médiane, hors image | file ordonnée de `ring()`, tranchée par étapes (coutures → routes → lieux) si un canton dépasse le budget |
| Mémoire | 36 cantons, 25 morceaux, 48 plans, 64 détails | caches existants + `createCache` |
| Atlas | aucun tirage | lit les cantons chargés et les empreintes légères des cantons vus |

À mesurer en T2 avant d'aller plus loin : un secteur actuel coûte en moyenne 7 s / 576 ≈ 12 ms,
ce qui rend le budget plausible mais non acquis (les passes de codex 160/205 pèsent davantage).
En voiture à 18 m/s, on franchit une couture toutes les 57 s : trois cantons à produire par
minute, largement sous le budget.

## 6. Anciennes campagnes

Rien ne change : `sizeForGeneration`, `create` pour 1–11, validateurs, activations G8→G11
de `world-pack131.js`. G12 ne propose aucune activation depuis une campagne existante, et
les activations G9–G11 ne s'appliquent pas à G12 (leur contenu — codex 160, sites 205 — entre
dans la génération des cantons dès l'origine).

## 7. Tranches

Chaque tranche est livrable seule, laisse le jeu jouable et les mondes G1–G11 identiques.

| # | Tranche | Effet visible | Tests | Preuve | Parcours joueur |
|---|---|---|---|---|---|
| **T0** | Adressage des cantons (**livré**) | Aucun | `tests/world-cantons217.test.cjs` | Empreintes de monde inchangées (audit 205, 8 graines) | Aucun : brique non chargée |
| **T1** | Accesseurs de limite : `world.contains`, `world.clampInside`, `world.site(id)`, `world.extent()` en G1–G11, lus à la place des comparaisons à `w.size` | Aucun | Tests existants des 30 fichiers + test d'équivalence point par point | Empreintes inchangées | Sortie régionale ordinaire, atlas, sauvegarde |
| **T2** | Canton sec : champs macro, coutures, routes, biomes, décor — module pur + outil d'aperçu hors jeu | Aucun en jeu ; aperçu en page de QA | Ordre de visite, coutures, connexité 31 × 31, sonde de coût | Nouvelle preuve `monde-sans-bord-cantons.json` (empreintes de 8 graines × 49 cantons) | Aperçu : faire défiler la carte sans couture |
| **T3** | Eau sans bord : altitude macro, cours d'eau de couture en couture, mer en champ | Aperçu | Continuité des cours d'eau, aucun lac coupé, ponts | Preuve étendue | Aperçu |
| **T4** | Lieux, occupants et sauvegarde creuse G12 | Aucun en jeu | Sauvegarde/reprise, plafonds, refus croisés G≤11/G12 | Preuve d'aller-retour | Test de bout en bout sans interface |
| **T5** | Ouverture : G12 choisie par les nouvelles campagnes derrière un réglage « Monde sans bord (expérimental) », façade complète, déplacement, itinéraire | **Oui** | Suite régionale rejouée en G12, harnais navigateur | Preuves G12 ; scripts `browser-*` conservés pour G≤11 | Les cinq parcours de la spec |
| **T6** | Atlas et minicarte sans étendue fixe ; rayon d'action du véhicule | Oui | `atlas-*` | Captures | Parcours 4 |
| **T7** | Par défaut pour toute nouvelle campagne ; « plus loin, plus rare et plus dur » | Oui | Équilibrage | Relevé de butin par distance | Campagne longue |

Le relief par paliers s'insère entre T3 et T4 s'il doit partager la génération 12 (D2).

## 8. Risques

| Risque | Gravité | Parade |
|---|---|---|
| Un changement de `canton217` après T5 change les mondes des campagnes G12 en cours | Haute | Vecteurs figés dès T0 ; version de détail propre à G12 ; preuve d'empreintes dès T2 ; rester « expérimental » jusqu'à T7 |
| Trente fichiers lisent `w.size` et `w.pois` entiers | Haute | T1 avant tout, sans changement de valeur, vérifiée par les empreintes |
| Réseau routier non connexe ou monotone sans arbre couvrant global | Moyenne | Trame garantie + test de connexité ; aperçu visuel en T2 avant d'engager T4 |
| Hydrologie : la plus dépendante du bord | Haute | Tranche séparée ; repli acceptable : G12 sans grande rivière en T5, eau ajoutée par une version de détail avant T7 |
| Coût d'un canton au-dessus du budget (codex 160/205, plans d'intérieur) | Moyenne | Mesure en T2 ; plans d'intérieur déjà paresseux ; découpe par étapes |
| Validation de sauvegarde trop lente ou trop laxiste | Moyenne | Plafond de cantons régénérés, forme stricte des identifiants (D4) |
| Dérive flottante loin de l'origine | Faible | À 1 000 km, pas de 1,2 × 10⁻¹⁰ m ; adressage borné à ±1 073 741 km |
| Conflit avec le relief (deux nouvelles générations) | Moyenne | Décision D2 avant T4 |
| Preuves et scripts navigateur qui attendent `size === 24576` | Faible | Conservés pour G≤11 ; jumeaux G12 ajoutés |

## 9. Points de décision pour l'utilisateur

- **D1 — Canton de 1 024 m ?** Proposé : oui (taille du secteur actuel, 16 morceaux de décor).
  Plus grand (2 048 m) donnerait des villes moins contraintes mais quatre fois le coût par
  couture franchie.
- **D2 — Relief dans la même génération 12 ?** La bible dit « à mener avec ». Proposé : une
  seule génération, relief inséré avant T4, pour ne pas créer deux familles de campagnes.
  Coût : T5 recule d'autant.
- **D3 — Ouverture en « expérimental » (T5) avant le défaut (T7) ?** Proposé : oui ; cela
  autorise à corriger la génération sans promesse de stabilité, annoncée au joueur.
- **D4 — Validation de sauvegarde :** régénérer les cantons cités (strict, plus lent) ou
  vérifier la forme seule au-delà d'un plafond ? Proposé : strict jusqu'à 64 cantons, forme
  au-delà.
- **D5 — Migrations et épaves hors des cantons chargés :** simulées de loin (abstraites) ou
  seulement autour du joueur ? Proposé : autour du joueur en T5, abstraction avec §7.14.
- **D6 — Une mer existe-t-elle encore ?** Proposé : oui, comme champ d'altitude, rencontrée
  par hasard ; elle redevient une limite naturelle d'un côté sans être une clôture.
- **D7 — Numéro 12 :** réservé dans `WorldCantons217Rules.reservedGeneration`, accepté nulle
  part. À confirmer avant T4.
