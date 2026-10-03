# DEADWALL 1.14 — Au contact de la cité

Candidat complet local **1.14.0-rc.1**, construit depuis le jeu complet 1.13. Aucun push GitHub ni déploiement Vercel. Les 71 types de constructions, onze âges, douze haltes automobiles et tous les systèmes antérieurs restent présents.

## Espace physique

Les constructions debout ont une emprise solide pour le commandant, les survivants et les véhicules. Les portes gardent leurs modes : automatique et ouverte autorisent les alliés ; verrouillée les bloque. Les pieux au sol restent traversables, ainsi que les pistes et les corps ; les chantiers non achevés restent accessibles et ne deviennent pas solides sur un acteur. Les étages des tours restent une représentation 2.5D, pas des intérieurs visitables.

Les décors récoltables et les silhouettes des douze haltes automobiles possèdent des empreintes physiques. Les rectangles des props sont volontairement conservateurs, dimensionnés d'après leur taille de rendu, et non des contours pixel par pixel. Les petites marques d'enquête diurne et les repères de carte ne deviennent pas des murs. Les ressources, leur identité et leur quantité sont préservées.

Le placement des décors est repassé de manière déterministe : aucun chevauchement entre props actifs, aucune intersection avec les bâtiments, dégagement de la chaussée centrale et des lieux d'enquête. Les objets trop proches sont repositionnés sans consommer le générateur aléatoire de la partie et sans offrir ou retirer de butin. Les emprises peuvent être voisines ; une petite marge de lisibilité est conservée. Les quatre haltes auparavant centrées sur les axes routiers ont été déplacées sur les bas-côtés : station, garage de la Roseraie, relais du kilomètre 17 et plateforme de tri.

La récolte, le dépôt et le travail sont possibles depuis l'extérieur, sur une face accessible. L'IA vise ces points de service, pas le milieu du bâtiment. Les convois territoriaux utilisent également des points extérieurs au départ, au chargement et au retour. Le centre n'est plus un raccourci traversable. Les camions et le break doivent contourner la cité et passer par les ouvertures existantes.

Les collisions du break vérifient maintenant le cercle complet, notamment aux coins. Le déplacement est toujours une conduite 2D, pas une simulation automobile avancée. Les projectiles conservent le modèle balistique du jeu précédent ; cette passe ne crée pas un nouveau système de couvert balistique pixel par pixel.

## Migration des positions

Le format de sauvegarde passe en **v13**. Les positions des décors sont enregistrées par identifiant, ainsi que la progression de la transition lumineuse et l'essai de rechargement actif. Les anciens formats migrent. Les personnes et véhicules chargés dans une emprise devenue solide sont replacés sur un accès libre voisin, sans perte de santé ou de cargaison. La recherche de sortie ne traverse pas les autres murs entourant cette emprise. Cette correction ponctuelle de chargement ne constitue pas un déplacement automatique du joueur pendant une partie.

Les opérations de déplacement et le contrôle manuel ne persistent pas comme ordres actifs au chargement. Les autres registres (sorties, quartiers, ressources, batteries, véhicule, analyste, etc.) sont conservés. Un ancien jeu ne sait pas relire une v13 : garder l'export précédent.

## Commandes locales

Près d'un bâtiment accessible, **O** prépare un quart de tour, **P** prépare une nouvelle cellule, et **I** ouvre la gestion. Les commandes sont également disponibles par boutons contextuels. Elles sont refusées pendant la conduite, hors de portée, et lorsqu'une modale étrangère empêche l'action.

La rotation coûte 5 % des matériaux de construction bois/ferraille/pierre, arrondis vers le haut. Le déplacement coûte 20 % de ces matériaux. Les objets sans matériau de ce type demandent une ferraille. Un aperçu est suivi d'un devis : rien n'est débité avant confirmation. Le coût est intégralement revérifié avec l'emprise, les acteurs présents, l'état et la position d'origine. Un devis périmé ou annulé ne prélève rien.

Le centre et les postes territoriaux sont ancrés. Les réimplantations ne sont possibles qu'au calme, pour une structure achevée, sans attaque ou incendie. Une confirmation déplace la même structure : identifiant, intégrité, priorité et réserves restent conservés. Il n'y a pas de réparation ou de batterie pleine gratuite. Le déplacement est instantané après paiement, sans animation de grue ni transport physique du bâtiment.

La gestion locale expose l'état, les coordonnées, les capacités et les fonctions existantes : réparation, amélioration quand disponible, priorité et circuit électrique. Un mirador ou une défense à tir dispose d'un contrôle manuel. Le commandant utilise le poste depuis son accès extérieur ; aucun intérieur ou escalier jouable n'est ajouté. Viser et cliquer tire avec la cadence, les dégâts et les munitions ordinaires de la défense. Son tir automatique est suspendu pendant le contrôle. **I, Échap ou un déplacement** rendent la main à l'IA. Le joueur n'est pas rendu invulnérable.

## Rechargement actif

Un premier **R** démarre le rechargement normal. Un second appui peut caler le chargeur dans une fenêtre visible de la jauge : réussite entre 44 et 70 %, parfaite entre 53 et 60 %. La réussite réduit le temps restant à 0,18 seconde ; la parfaite à 0,04 seconde. Un essai manqué ajoute 0,8 seconde. Il n'y a qu'un essai par rechargement, même après une reprise.

Ne pas tenter le second appui conserve le rechargement ordinaire. Il n'existe aucun bonus de dégâts, munitions infinies ou munition gratuite. Le débit de la réserve reste celui du système historique à la fin du rechargement. Le bouton tactile applique exactement la même règle. Les indications de réussite restent brièvement visibles.

## Retour visuel des actions

Un anneau et un pourcentage sont dessinés sur la ressource ou le chantier en cours d'utilisation. Ils sont reliés à une variation réelle de quantité ou de construction, pas à un simple maintien d'E près d'un objet. Les relevés et les fouilles des haltes automobiles disposent également de leur indication. Un sac plein, une action bloquée ou interrompue ne donne pas l'illusion d'un progrès.

Ce retour accompagne la récolte, la construction et les relevés/fouilles automobiles ; il n'est pas présenté comme une refonte de chaque animation des systèmes historiques.

## HUD et journal

Le panneau de construction replié est un bouton compact avec une clef mécanique dessinée, la lettre B et le libellé accessible Construction. Le poste de droite sépare Personnel et Défense & ordres. Les options et sauvegardes passent par une commande à engrenage près de Pause. Les boutons historiques conservent leurs identifiants et leurs actions ; les systèmes ne sont pas supprimés.

Le journal est un carnet papier à deux pages : chapitres et archives à gauche, observations et décisions à droite. Il utilise les vrais textes et boutons de la campagne, pas une image avec du faux texte. La pagination affiche les dossiers existants. Sur écran étroit, les deux pages sont empilées pour rester lisibles.

Le panneau local de bâtiment reste dans le commandement, sans ajouter un quatorzième onglet permanent. Le HUD contextuel n'apparaît que près d'une structure utilisable. La jauge de rechargement n'est pas confondue avec les options ou le recrutement.

## Jour et météo

L'opacité de la nuit évolue progressivement : huit secondes pour parcourir toute l'échelle 0–1, moins pour une variation partielle. L'aube, l'alerte et les nuits noires ne changent plus visuellement par un simple saut du masque. La logique des phases et l'annonce des hordes restent celles du jeu ; le fondu ne retarde pas l'assaut.

La météo aléatoire existait déjà. Ses changements d'objectif et son interpolation sont conservés, avec la pluie et les effets existants. Cette passe n'annonce pas de neige, de nouveaux orages ou de nouveau biome météo.

## Vérification

Les tests logiques historiques qui plaçaient volontairement un ouvrier au centre d'un bâtiment ont été adaptés pour utiliser les points de service extérieurs. Les règles de collision ne sont pas désactivées dans ces fixtures. Les nouvelles empreintes initiales reflètent le placement physique demandé ; les ressources, identifiants et flux aléatoires restent contrôlés.

Les contrôleurs scriptés de déplacement ont aussi dû contourner les obstacles. Un bot qui tente d'aller tout droit à travers un centre désormais solide n'est pas une preuve de défaut de collision. Les parcours utilisent des commandes ordinaires ; les scènes avancées de tour, de réseau ou de voiture restent déclarées comme des préparations techniques, pas des campagnes gagnées naturellement.

Les captures et résultats courants se trouvent dans `reports/1.14/` et dans `reports/RAPPORT_1.14.html`. Les résultats finaux doivent être lus dans ce rapport, pas dans les journaux d'itérations intermédiaires. Les sauvegardes, le jeu autonome, le cache hors ligne et la distribution web sont testés séparément.

Pas de certification Safari/iPhone physique, Firefox ou Electron empaqueté. Les tests automatisés de campagne ne remplacent pas plusieurs joueurs humains ou une vérification de plusieurs heures sur une mégaville peuplée. Aucune cadence d'images n'est garantie sur le matériel du joueur. Le monde conserve sa taille et le plafond de horde antérieurs.

### Résultats de la livraison

La validation Node complète, avec endurance, comprend 998 tests. Les quatre nouveaux parcours navigateur comprennent 43 contrôles ; les parcours historiques en comportent 340, auxquels s’ajoutent huit contrôles de distribution. Le cycle dirigé depuis une nouvelle partie finance ses trois bâtiments, effectue le relevé et fait revenir le récupérateur sans cadeau de ressources ; son contrôleur connaît la carte et suit des points de passage pour contourner les nouveaux obstacles. Les quatre politiques de dix minutes restent des tests scriptés de l’économie et de la sauvegarde, pas une estimation de difficulté humaine.

### Reprise et corrections finales du 23 septembre

Les résultats de livraison sont ceux de `37-final-node.log`, `36-resume-browser-full.log` et `37-final-distribution.log`. Une première relance de la reprise a révélé un infecté coincé à l’angle d’un prop et une place de parking variable non gérée par le pilote QA. Le moteur a été corrigé pour guider les infectés autour des angles des props, sans traversée et sans suppression d’ennemi. Les spawns et anciennes positions à l’intérieur d’un prop sont dégagés localement sans traverser les autres emprises.

Le contrôleur de conduite du test calcule maintenant un chemin de dégagement avec la taille réelle du véhicule, puis envoie ses commandes ordinaires. Ce calcul n’ajoute pas un pilote automatique au jeu. La fixture isolant l’usure d’un piège utilise un emplacement libre ; elle ne commence plus avec l’infecté dans un décor généré aléatoirement. Les validations ont conservé toutes leurs assertions fonctionnelles.

Deux contrôles logiques supplémentaires portent sur l’évacuation d’une ancienne position hostile et le contournement sans traversée. Après la suite complète, deux répétitions d’endurance et une répétition automobile sont également réussies. Les traces qui ont échoué restent conservées pour distinguer diagnostics intermédiaires et résultat final.
