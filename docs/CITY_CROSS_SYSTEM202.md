# Emprises partagées : services, véhicules, débris et volumes

La campagne `cityGeometry202:1` utilise les gabarits de `CityGeometry202.definition`. Les campagnes sans ce champ gardent leurs dimensions, positions et contrats historiques. Les coûts, stocks initiaux, rendements et conditions d'âge ne changent pas.

## Services et destinations

Le service du dépôt métrique mesure sa portée depuis le bord du bâtiment de dix mètres. La portée historique mesurée depuis le centre reste celle des anciennes campagnes. Les diagnostics de retour emploient le même bord et le rayon du véhicule courant ; leurs recherches ne déplacent aucun acteur.

`Expeditions.sitesFor({cityGeometry202:1})`, `siteFor` et `g.expeditions.sites()` partagent les destinations physiques. Seuls deux repères sortent du terrain réservé au développement urbain : `clinique` à `(3904,1152)` et `poste` à `(3904,2784)`, dans la bande extérieure Est. Leurs identifiants, réserves finies, seuils de renseignement et durées restent identiques. Les tableaux historiques `SITES` et `BY_ID` sont conservés. Moteur, carte des expéditions, décors physiques et signature de navigation lisent ces fournisseurs communs.

## Véhicules et reprise

Un véhicule acheté dans une campagne métrique commence avec `metric174:1`, son profil réel et un réservoir/coffre vides. Le prix reste celui du profil choisi. Le contrôleur cherche une aire libre à l'extérieur du corps du dépôt, vérifie le véhicule orienté, puis refuse les poses qui recouvriraient le joueur, les alliés, les infectés ou un fourgon. Les anciennes campagnes conservent l'achat compact et leur activation métrique facultative.

La validation d'un chantier teste toute son emprise orientée contre le véhicule, même lorsque l'appelant fournit encore la définition historique. Le paiement reste refusé avant tout prélèvement lorsqu'une pose est impossible.

Le démarrage est une transaction commune à tous les contrôleurs synchrones. Les demandes de sauvegarde intermédiaires renvoient `false` et n'écrivent rien ; une seule sauvegarde termine le départ après initialisation des registres. Le profil actuel dispose alors de G10, détails13 et géométrie locale R4 ; les profils historiques conservent leurs révisions. Les wrappers d'interface installés ensuite restent dans cette transaction. Une exception conserve les anciens fichiers et interdit aussi les autosauvegardes ultérieures du monde interrompu, jusqu'à une restauration ou un nouveau départ complet. Une panne de stockage sur l'écriture finale conserve les règles de récupération existantes.

Les débris de destruction gardent la largeur et la profondeur réelles du support perdu. Leur validation et leur restauration utilisent la révision de campagne ; elles ne convertissent pas une ruine historique en grande ruine. Le plafond récupérable reste dérivé du coût d'origine et du facteur historique. Les reprises répétées ne recréent ni support ni matériaux.

## Volumes verticaux

Les tactiques, volumes de tir et réserves de passerelles reprennent les mêmes emprises tournées que les bâtiments. Pour la nouvelle campagne, `CityGeometry202.structureHeight` reprend les trois mètres par niveau représentés : la tour de vingt niveaux mesure soixante mètres dans le volume de tir. Les supports verticaux conservent leurs hauteurs explicites, les murs leurs trois mètres et les bâtiments ordinaires historiques leur volume de quatre mètres. Une passerelle peut ainsi surplomber une maison basse mais refuse une tour qui traverse son corridor.

## Vérification

`tests/city-cross-system202.test.cjs` couvre les quatre rotations, les débris et plafonds de récupération, la transaction refusée autour d'un véhicule, la validation des passerelles, le tir réel à trente mètres d'altitude, le contrat des douze destinations, l'achat/ravitaillement/conduite/reprise et la recherche d'accès au dépôt.

Les préparations avancées sont explicites : bâtiments de service achevés et connaissances historiques pour l'achat ; déblaiement de ressources finies sans crédit de stock pour la fixture de tour. Routes, murs naturels, volumes et exclusions restent actifs. Les tests historiques de supports verticaux essaient d'abord leurs anciens emplacements, puis la grille complète et les rotations légales ; ils financent toujours les vrais supports et les vrais ponts. Ces fixtures ne mesurent ni une campagne humaine ni une cadence d'images.

`tests/campaign-start202.test.cjs` observe les vraies écritures du stockage sur l'ensemble du départ natif : une seule écriture finale, reprise avec collisions R4 actives, réaffectation tardive du wrapper, exception d'initialisation, paramètres refusés et panne de quota suivie d'une récupération.
