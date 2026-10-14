# Cohérence métrique et dessertes — passe 174

Base : main `5b8f0ade7f7e93d3fc3ea23f762cac93ded43d90`, DEADWALL 1.60.0 / G10.
Cette passe ne fusionne pas l'ancienne branche Codex ni les prototypes non intégrés.

## Convention de mesure

La région est en mètres. D-17 est en unités locales, à raison de 32 unités par mètre.
La référence utilisée par l'audit est le diamètre physique du piéton régional,
0,64 m, **pas la hauteur complète du personnage** : une vue du dessus ne compare
pas une largeur de bus à une taille humaine verticale. Les dimensions citées sont
celles des propriétaires du jeu, pas une homologation de modèles réels.

`metric-contract174.js` distingue domaine, emprise, support au sol, objet vertical,
surface et couronne végétale. Une dimension absente est signalée ; elle n'est pas
inventée à partir de la taille d'une icône. Un assemblage refuse les identités en
double, le mélange d'unités et les enfants sortant de sa réserve après rotation.

## Véhicules : image et corps

Les neuf profils existants gardent leurs dimensions, leur prix, leur vitesse,
leur capacité et leurs stocks. Les images de véhicules revues sont des vues en
plan : la découpe transparente est explicitement normalisée sur la longueur et
la largeur de leur propriétaire. Ce choix peut employer deux facteurs distincts
sur X et Y. Il n'est pas appliqué aux façades, acteurs ou meubles verticaux.

Exemple : le bus conserve **10,4 × 2,55 m**. La variante lourde n'est plus raccourcie
par un ajustement proportionnel dans la largeur. Les versions légères et lourdes,
les deux variantes et le rendu de secours utilisent les mêmes dimensions cibles.
Les helpers de présentation proportionnelle restent disponibles hors du peintre
métrique ; une icône n'est pas automatiquement agrandie à la taille du monde.

### D-17 : migration volontaire

Les véhicules locaux hérités utilisaient 44 / 4,6 unités par mètre. Les agrandir
silencieusement pourrait recouvrir une porte, un survivant ou un appareil posé.
Au dépôt : **Monde & relais → CALIBRER LE VÉHICULE EN MÈTRES**.

L'activation ajoute seulement `expeditions.vehicle.metric174 = 1`. Elle conserve
position, identité, orientation, carburant, cargaison, ressources et carte. Elle
requiert un véhicule acheté, vivant, proche du dépôt, le joueur à pied et libre,
et une aire physiquement dégagée. Les personnages et équipements locaux déjà
sauvegardés refusent une activation qui les recouvrirait. Une restauration refusée
ne produit pas de réussite. Aucun véhicule n'est offert ni téléporté.

Le dessin local prend alors 32 unités par mètre. La collision locale conserve le
moteur circulaire historique, mais avec un disque **circonscrit à tout le corps** :
elle est sûre et conservatrice, pas une collision rectangulaire précise. Les
portes, retours, entrées régionales et points de descente utilisent ce rayon.
La région conserve ses collisions rectangulaires orientées. Un véhicule neuf de
remplacement n'hérite pas automatiquement de ce choix propre à l'ancien véhicule.

## Dessertes : ne plus traverser une route pour en rejoindre une autre

Le `p.drive` historique reste intact afin de conserver parcelles, IDs, budgets de
fouille et clairières de végétation. `frontage174.js` calcule une desserte dérivée :

- chercher la **première chaussée rencontrée depuis la porte**, pas une voie plus
  éloignée de l'autre côté ;
- refuser un accès direct contrôlé, un raccord trop tangent, une entrée déjà dans
  la chaussée ou un corridor qui touche une autre route ;
- tester toute la largeur de l'allée contre les capsules des routes, y compris
  les voies parallèles, obliques et les bouts arrondis ;
- conserver les niveaux explicites : un segment à un autre niveau n'est pas la
  desserte d'une entrée au sol ;
- conserver les véhicules stationnés, clôtures et réserves des autres parcelles.

Le lien de navigation rejoint l'axe de la desserte. Le dessin s'arrête au bord
proche de la chaussée, avec un bout plat ; le réseau public est peint par-dessus.
La vue régionale, l'atlas, le GPS, le guidage et la lecture de surface emploient
le même résultat. Un accès refusé n'est pas présenté comme un itinéraire valide.
Le bâtiment et ses stocks restent en place. Le résolveur ne réécrit pas la
navigation globale de tous les ponts et tunnels : cette topologie conserve ses
propres contrats G10.

## Vérifications reproductibles

```sh
npm ci
npm run build
node --test tests/metric174.test.cjs tests/frontage174.test.cjs tests/metric-migration174.test.cjs
node scripts/audit-metric174.mjs --baseline /chemin/vers/la/base_verifiee
node scripts/browser-metric174.mjs
npm run check
```

L'audit exporte `definitions.json`, `frontages.json`, `historical-fingerprints.json`
et `summary.json` dans `artifacts/qa/metric174`. La base facultative doit posséder
les sources originales : la comparaison s'exécute dans deux processus distincts.
Elle compare tous les POIs, routes, plans, détails et quatre secteurs de ressources
sur chacune des trois graines. Elle ne renomme ni ne recharge aucun stock.

## Résultats locaux de cette passe

L'inventaire couvre **4 000 programmes**, **5 081 plans d'étage**, **29 370 occurrences
d'objets**, les neuf profils de véhicule, 62 gabarits régionaux et les 91 définitions
de construction locales. Les dimensions de source sont vérifiées séparément de
la calibration artistique : la hauteur et l'ancrage des sprites verticaux ne sont
**pas certifiés exhaustivement** par un test de rectangle positif.

Sur trois graines (0, 42, 17117), 9 734 dessertes sont examinées : 9 727 restent
acceptées, dont **66 corrigées vers la première desserte**, et **7 refusées** pour
conflit de corridor. Ces sept cas restent dans le rapport ; aucun accès n'est
forcé ou masqué comme une réussite. Les empreintes de tous les plans et détails
comparés sont identiques à la base ; les prélèvements restent donc attachés à
leurs conteneurs historiques.

La page navigateur de vérification utilise des fixtures explicites (garage
achevé, connaissances héritées, stock fini, pose de parking physiquement libre).
L'achat et le clic de calibration sont natifs. Ce n'est pas un parcours humain
complet. Les screenshots de peintres isolés ne remplacent pas les essais de
campagne, de PWA ou de portable Windows ; les reçus CI doivent être consultés
pour savoir lesquels sont effectivement terminés.
