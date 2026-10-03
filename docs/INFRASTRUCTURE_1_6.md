# DEADWALL 1.6 — Artères & Reconstruction

Candidat cumulatif basé sur le commit c1db812e2ddf81b3f9a9926362a7ba13b32dbb65 et le kit 1.5 intact.
Ce pack ne contient pas le moteur original complet ni les atlas. Les tests de navigateur utilisent un hôte explicitement simulé. Aucun push ou déploiement n'est effectué par les outils du pack.

## Le jour : financer puis travailler
Le Bureau de chantier terminé autorise des pistes stabilisées de 1 à 64 cellules cardinales par confirmation. Le tracé rejoint d'abord X puis Y. Chaque cellule neuve coûte 2 pierre + 1 ferraille, débitées en une transaction après revalidation des stocks et de l'emprise. Une cellule déjà financée n'est jamais payée à nouveau. Maximum technique : 2 048 cellules.
Les pistes sont une couche de sol indépendante : elles ne sont ni des murs ni des producteurs, ne modifient pas les stocks et ne possèdent pas de santé. Elles ne suppriment aucune ressource ni structure. Les portes peuvent les recouvrir ; les autres bâtiments neutralisent leur avantage sous leur emprise.
Chaque cellule exige 3 unités de travail. Avec les outils de voirie, le commandant fournit 1,4 unité par seconde, à proximité accessible et hors danger, pendant le calme. Le tir, la crosse et le rechargement sont suspendus pendant l'utilisation de ces outils. Les autres outils et commandes restent accessibles.
L'Atelier de voirie (45 bois, 55 ferraille, 35 pierre ; 850 intégrité ; 26 unités de chantier ; emprise 3×3 ; palier Camp fortifié ; Bureau requis ; 1 électricité ; score 6) permet d'affecter deux ouvriers existants, maximum huit. Chaque ouvrier fournit 1 unité de travail par seconde après avoir déposé sa cargaison. Les tâches des quartiers, des secours et des escortes sont mutuellement exclusives. La nourriture et les logements restent à la charge de la colonie.
Les ouvriers rejoignent les travaux par le système de navigation existant. Les portes peuvent les bloquer. Crépuscule, danger local, perte d'alimentation ou repli général déclenchent un retour physique au centre ; ils restent affectés jusqu'à leur arrivée et au dépôt de leur sac. Aucun téléportage ni unité nouvelle.

## Le réseau : un avantage qui n'est pas une défense
Une cellule achevée donne +18 % de vitesse aux déplacements alliés et +30 % aux fourgons. Les infectés bénéficient aussi de +10 % lorsqu'ils la traversent. Ni total de vague, ni cadence des armes, ni dégâts, ni santé ennemie ne sont modifiés.
La recherche cardinale de trajet alliée et celle des fourgons utilisent le coût de déplacement correspondant, avec une heuristique minorante et un budget d'expansions borné. L'achèvement et le retrait d'une piste invalident les trajets existants. Les pas physiques des fourgons restent limités à sept unités et respectent les collisions. Les alliés conservent l’optimisation historique qui prend un trajet direct lorsqu’il est entièrement libre ; ils ne font donc pas systématiquement un détour pour rejoindre la voirie. Les infectés gardent leur champ de flux historique : ils ne recalculent pas leur itinéraire en fonction des pistes.
Retirer une cellule exige confirmation et ne rembourse rien. Les revêtements sont non destructibles dans cette version. La carte schématique du réseau n'est pas un diagnostic d'enceinte fermée.

## Après le siège : retrouver les implantations
Les 96 dernières empreintes de structures détruites par dégâts sont conservées (type, cellule d'origine, rotation, instant). Le centre est exclu. Les pertes antérieures à l'installation ne sont pas inventées ; le démontage volontaire ne produit pas d'empreinte. Aucune ruine physique ni butin n'est créé.
Reconstruction : coût intégral et contrôles de placement du jeu, nouveaux chantier et identifiant, même position et rotation. Aucun héritage d'intégrité, contenu de stock, eau, travailleurs ou réserves locales. Il faut rétablir les dépendances technologiques et libérer les emprises.
Un repère peut être marqué visuellement sans déplacer le joueur. Oublier un repère demande confirmation et ne modifie ni terrain ni ressources. L'interface conserve huit fiches par page. Le registre est limité aux 96 plus récentes ; son compteur d'éviction est conservé.

## Interface et sauvegardes
Commandement → Terrain → Pistes & Reconstruction. Coordonnées utilisables au clavier, tracé en deux clics ou deux touches au sol, validation explicite. Une mauvaise trace refuse l'ensemble. Échap et clic droit annulent les aperçus sans dépense.
Les cartes HUD des extensions sont regroupées dans le volet repliable « Opérations » ; leurs identifiants et boutons sont conservés. Une urgence incendie est affichée dans le titre même volet fermé. La fermeture du volet rend le focus à son titre.
La sauvegarde v8 ajoute `infrastructure` ; les versions v1 à v7 sont migrées sans nouvelle route, ouvrier ou récompense. Les registres `fieldOps`, `territories`, `siege`, `dayworks` et `citadel` sont conservés. Les affectations croisées et les références de reconstruction sont validées avant changement de monde. Une sauvegarde v8 n'est pas lisible par les anciennes versions du jeu.
