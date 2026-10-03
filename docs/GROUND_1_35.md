# Sols, végétation et cohérence visuelle — 1.35

Les campagnes de génération 6 emploient `ground135.js`. Les générations 1 à 5 conservent leur sol et leurs silhouettes historiques. Le peintre consomme les coordonnées absolues en mètres et le même échantillon de biome que le générateur ; déplacer la caméra, décharger un chunk ou reprendre la partie ne reroule pas le terrain.

## Sol continu

Les douze palettes écologiques se mélangent selon le climat partagé. Trois échelles de variation forment les zones de terre, les différences de couverture et le grain. Le détail apporte des touffes, petites pierres, litières, brindilles, zones humides et débris selon le biome. Ce détail bas est décoratif et passable ; arbres et rochers récoltables restent des objets de simulation distincts.

Les textures sont calculées sur une grille d’échantillonnage continue, avec une marge de filtrage. Les tuiles de cache ne sont pas des parcelles peintes : leurs bords ont les mêmes valeurs et les détails proviennent d’ancres globales. Aucun atlas de sol répétitif n’est pavé à l’infini. Les routes, accès privés, cours et planchers sont peints ensuite pour rester dégagés et lisibles.

Le cache LRU conserve au plus 64 rasters, soit environ 17 Mo au maximum lorsque toutes les entrées sont à la définition de proximité de 258 × 258 pixels, hors objets Canvas. Les palettes mélangées sont également bornées à 128 entrées. Le niveau de détail dépend de l’échelle : le jeu utilise une texture de 32 m à 256 pixels à proximité ; la carte générale représente les couleurs écologiques à plus grande maille pour éviter de calculer le détail des 604 km² à son ouverture.

## Silhouettes et collisions

Neuf essences utilisent des feuillages, écorces, tailles et silhouettes liés au catalogue écologique : chêne, hêtre, bouleau, pin, sapin, saule, peuplier, aulne et fruitier. Les conifères ont des branches radiales irrégulières ; le peuplier une couronne étroite, le saule des branches retombantes. L’éclairage procédural garde une lecture du dessus cohérente. La couronne devient transparente près du joueur ; le tronc est peint au rayon du véritable obstacle.

Les quatre familles minérales emploient le coloris et les dimensions du catalogue : calcaire, granite, schiste et amas de pierres. Le volume peint couvre le disque de collision. Une souche épuisée est réduite à 18 cm ou à son rayon initial s’il est inférieur ; les rochers épuisés disparaissent avec leur obstacle. La canopée et les ombres n’ajoutent aucune collision.

`frontier-art.js` utilise ces peintres dans la file de profondeur existante et peint les détails bas avant routes et bâtiments. Les marqueurs de retour et les raccords à D-17 utilisent les coordonnées de la campagne. Les infectés régionaux conservent désormais leur profil visuel réel (récent, protégé, rampant, briseur, traqueur), au lieu d’employer systématiquement l’atlas de l’errant.

## Vérifications et limites

`tests/ground135.test.cjs` contrôle déterminisme, changement de graine, continuité aux frontières 32/128/256/512/4096 m, maintien du rendu historique, rayon visible des troncs, absence de trous dans le raster, conservation exacte des pixels après déplacement de caméra, limite de cache et reconstruction après éviction. `tests/biome-presentation135.test.cjs` contrôle les profils infectés dans les deux chemins de rendu régionaux.

Les captures sont produites par les peintres réels avec Canvas natif sous DOM simulé. Elles ne valident ni le CSS du navigateur, ni le GPU, ni une cadence de jeu. La galerie de douze sols échantillonne des lieux réels de la graine 17117 ; ses spécimens d’arbres et de rochers sont mis en scène pour comparer les peintres. La capture régionale G6 montre le monde effectivement généré autour de P0002. Les fichiers JSON précisent coordonnées et provenance.

Le profilage isolé du sol de la carte entière a mis en évidence un premier calcul trop coûteux : 4 422 ms. L’échantillonnage cartographique adapté ramène la mesure suivante à 334 ms au premier calcul et 0,45 ms avec cache. Ces chiffres sont des durées CPU de cette machine et de ce scénario, pas une garantie de FPS. Les mesures du rendu global et du HUD sont consignées séparément par l’audit d’intégration.
