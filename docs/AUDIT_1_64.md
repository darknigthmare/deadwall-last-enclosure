# Audit de cohérence — 1.64

## Écologie effectivement générée

Le générateur conserve les générationsG1–G10 et ajoute un champ de campagne `frontier.ecologyVersion`. Son absence signifie0 ; la version1 est explicitement choisie à la création d’une nouvelle campagneG8 puis conservée lors des extensions. Un chargement historique, même vide de découvertes, ne l’active pas. Le détail des pièces reste une révision indépendante.

Les lectures du sol de D17, de la région, des espèces, des surfaces de déplacement, de la survie et des preuves de collecte utilisent le fournisseur du monde courant. Les caches distinguent identité du monde, écologie, détail et fournisseur selon leur propriétaire. Douze validateurs qui reconstruisaient auparavant une référence sans ces révisions ont été raccordés aux deux valeurs.

Sur trois vrais mondesG10, graines0,17117 et84329, chacun avec34localités, un échantillonnage tous les128m retrouve les16milieux. Les régions contiguës atteignent25km² dans cet échantillon. Deux voisins ont la même dominante dans90,1–91,1% des cas, contre6,8–10,3% pour des points éloignés. Les milieux rares ne sont pas imposés par quota.

Les7275coutures de chunks échantillonnées à0,2m de chaque côté montrent des écarts de champs inférieurs à0,00001 et de palette d’au plus1unitéRGB. Les frontières techniques ne forment pas les limites des biomes. Les cartes de diagnostic ne sont pas des captures de relief ou de rivières physiques.

Un défaut ancien empêchait une communauté d’apporter un décor absent de la liste du biome dominant. La nouvelle écologie combine les deux listes pondérées ; les identités historiques et le scatter0 restent inchangés. Les comparaisons de sortiesG6–G10 protègent cette conservation.

L’audit de quatre grainesG10 en écologie1, avec détail13, place570 à604contextes sur626décrits. Les96programmes naturels concernés sont filtrés avant allocation d’ID ; aucun contexte admis dans un milieu incompatible n’a été trouvé dans cet échantillon. Les omissions sont comptées et expliquées selon les candidats et emprises disponibles. Les ports et lacs restent des plans à eau locale, sans réseau littoral ou fluvial continu nouvellement créé.

## Sanitaires et soins

Un audit de54parents contenant de vrais sanitaires et des faux amis, sur3graines et189étages, reconnaît104demandes et place99WC. Aucun chevauchement, accès ancien perdu, face de service bloquée, mutation de source ou nouveau loot n’a été détecté. Le maximum observé est29audits de grille pour une borne de48. L’ajout reste un complément d’usage et ne remplace pas une prescription auteur absente.

Les55supports réels de soins sont25étagères,11lits,9établis,4bureaux,4meubles médicaux et2bancs. Leur annotation visuelle conserve leurs paramètres physiques et leur opération. Les montées, tâches, paiements et stocks gardent leurs propriétaires existants.

## Portée des preuves

Les cas ciblés ne s’ajoutent pas au total d’un contrôle global. Une exécution négative ou un bundle compilé obsolète ne qualifie pas la version finale. Les contrôles navigateur doivent couvrir le vrai menu, l’écologie conservée lors des extensions, l’action13 au dépôt, les aperçus et Save/menu/Continue ; toute fixture avancée est explicitement déclarée.

Sur la machine Node d’audit, l’échantillonneur coûte environ1,84–1,93fois l’ancien, et les chunks réels environ1,43–1,47fois. Ce sont des mesures CPU ciblées, sans promesse de FPS. Les limites de cache et de génération restent bornées. Les appareils physiques et campagnes humaines de6 à10heures ne sont pas qualifiés par ces mesures.

Les usages auteur indéterminés, enveloppes adaptées et variantes graphiques non inspectées restent signalés ; cette passe ne déclare pas le jeu intégralement conforme ou commercialement certifié.
