# Campagnes, relève et reprise — corrections 1.36

## Défauts reproduits et corrections

**Empreinte de véhicule conservée après descente.** Lors d’une reprise au volant,
les lecteurs d’interface pouvaient réconcilier la voiture avant la fin de
`restoreSave`. Le contrôleur d’expédition mémorisait alors son rayon de 22 comme
rayon du personnage à pied. Descendre, subir la destruction du véhicule ou
refuser un nouveau départ pouvait entretenir cette empreinte excessive, donnant
l’impression de collisions invisibles. Le rayon à pied provient désormais du
constructeur du personnage avec un identifiant explicite 0 ; aucune nouvelle
identité n’est consommée. La largeur du véhicule reste appliquée uniquement en
conduite. Ni les coordonnées ni les possessions sauvegardées ne sont changées.

**Ancienne réquisition de relève désynchronisée de l’armurerie.** Le petit panneau
de relève annonçait un retrait immédiat alors que son action lançait désormais
l’assemblage temporisé de l’arsenal 1.34. Il n’offrait pas ensuite le retrait du
râtelier. Ses trois familles d’armes utilisent maintenant les coûts, conditions
et durées du catalogue vivant. `ASSEMBLER` engage le travail existant ; une arme
prête donne `PRENDRE`, qui déplace puis équipe cet objet précis sans paiement
supplémentaire. Une arme déjà chargée conserve son chargeur. Les menaces, actions
en cours, paliers et poids du harnais continuent de s’appliquer. Le parcours
historique sans module d’arsenal est maintenu pour les anciennes compositions
techniques, sans deuxième fabrication active dans le jeu livré.

**Dégâts de crosse alors que les mains sont libres.** Le calcul historique testait
la possession d’une famille d’armes ; une arme pouvait être portée sans être en
main. Le bonus de crosse dépend maintenant de l’équipement réellement en main,
via le même état que le rendu et le combat. Les poings conservent leur valeur
existante ; les armes de mêlée utilisent le contrôleur de l’arsenal.

## Vérification

Les nouvelles scènes de `tests/campaign-state136.test.cjs` chargent tous les
scripts de `index.html`, dans l’ordre livré, avec un DOM simulé. Elles vérifient
la mort et le choix via les contrôles existants, l’assemblage puis le retrait,
la conservation des chargeurs, l’indisponibilité de l’atelier sous menace,
l’absence de mutation lors d’un départ refusé et les dégâts mains libres.

Une sauvegarde réelle 1.34 de génération G5 est restaurée, sauvegardée puis
reprise par sa copie de secours après corruption volontaire de la copie
principale. Sa graine, son identité, ses prélèvements et ses registres
d’extensions sont comparés. Un registre de relève invalide est rejeté sans
remplacer le monde. Les tests historiques de succession, graines et expéditions
complètent ces scènes, notamment la récupération des sacs, les étages, les
réanimations et les formats antérieurs.

Le parcours `node scripts/qa136-integration.cjs vehicle` vérifie aussi une voiture
construite et ravitaillée depuis les stocks, le passage réel vers la région et
le retour par commandes de déplacement, les sauvegardes au volant/à pied, le
coffre et la descente après reprise. La fixture prépare un garage achevé et
positionne la voiture sur une approche physiquement libre avant le trajet.

Ces contrôles ne constituent pas une certification graphique CSS, une mesure de
fréquence d’images ni une campagne entière jouée manuellement. Aucun nouveau
schéma de sauvegarde ni changement d’identité de carte G1–G6 n’est introduit par
ces corrections. Le contrôle global de livraison reste distinct des suites
ciblées.
