# DEADWALL 1.64 — Biomes et lieux cohérents

Les nouvelles campagnes utilisent une écologie versionnée : les sols, arbres, roches, petits décors, lieux et profils régionaux lisent le même territoire déterministe. Continuer une partie conserve son écologie et ses prélèvements ; les anciennes cartes ne sont pas redistribuées.

## Régions et contenu

Quatre milieux tempérés complètent les douze existants : terrasses alluviales, plateaux agricoles, pinèdes sur sols sableux, fonds tourbeux et bois clairs. Température, humidité, altitude écologique, drainage et substrat déterminent leur répartition. Les palettes se mélangent aux lisières ; les communautés locales composent clairières, bosquets, roselières et sols minéraux. Les friches suivent les implantations humaines plutôt qu’un tirage climatique isolé.

La sélection des essences refuse les poids écologiques négligeables. Les familles de petit décor apportées par un habitat peuvent maintenant apparaître même si elles étaient absentes du biome principal. Les arbres, roches et contenants gardent des réserves finies ; les fleurs, roseaux et branches décoratives n’offrent pas de ressources cachées.

Les contextes forestiers, agricoles et d’extraction vérifient leur milieu avant l’attribution d’un lieu. Les 626 références territoriales restent dans le catalogue, mais l’espace, les accès et les essais bornés peuvent empêcher une implantation. Aucun emplacement incompatible n’est forcé pour remplir un compteur. Les quatre nouveaux milieux et leur fonctionnement ont cinq fiches dans le Guide.

Le drainage et l’altitude sont des indices écologiques : cet ajout ne crée ni réseau fluvial physique, ni falaises, ni relief 3D. Les bassins et autres eaux effectivement présentes dans les plans gardent leurs collisions et travaux propres. Le monde reste borné.

## Sanitaires et équipements de soins

Dans une campagne G9 ou G10, au dépôt de D17, activer d’abord la composition des pièces et ouvrages, puis **COMPLÉTER SANITAIRES ET ÉQUIPEMENTS MÉDICAUX** dans **Monde & relais**. Cette révision facultative 13 conserve les révisions 0–12 et utilise les mêmes contrôles transactionnels des personnages, lampes, camps et véhicules.

Les vrais sanitaires personnels peuvent recevoir un WC ou une latrine, avec emprise et dégagement physique vérifiés. Les réserves de modules sanitaires, stocks, chambres noires et usages ambigus ne deviennent pas des toilettes. Ces compléments ne créent ni plomberie alimentée, ni stock, ni nouveau service d’hygiène simulé.

Les 55 supports des opérations de soins territoriales reçoivent un équipement visuel adapté à leur meuble : lit, étagère, établi, bureau ou banc. Ils gardent leurs identifiants, emprises, contenants et interactions payées. Les WC, latrines et quatre familles de supports ont des variantes déterministes. L’aperçu du Guide permet de consulter la révision 13 et les quantités effectivement posées sans écrire dans la campagne.

## Vérification et limites

```sh
DEADWALL_SOAK=1 npm run check
node scripts/browser-ecology164.mjs
```

Les audits ciblés, contrôles globaux et publication doivent être liés à leurs reçus exacts. Les chiffres d’échantillonnage sont détaillés dans [AUDIT_1_64.md](AUDIT_1_64.md) ; ils ne certifient pas toutes les graines ni chaque sprite du jeu.

Les campagnes historiques gardent leur terrain ; la nouvelle écologie se découvre dans une nouvelle campagne. Les enveloppes historiques adaptées et les réseaux automobiles, ferroviaires et hydrauliques complets restent des chantiers distincts. Le coût CPU du nouvel échantillonnage est supérieur à l’ancien ; les caches et le préchargement restent bornés. Les FPS sur téléphone physique, la durée humaine Standard de 6 à 10 heures et la qualification commerciale restent à mesurer.
