# Bivouacs et survie — 1.27

Cinq systèmes de terrain prolongent les sorties à pied de D-17 et de la région. Ils se trouvent dans le carnet des opérations, sous **Bivouacs & survie**. Toutes les fournitures viennent du **sac du commandant**. Préparer une action demande de rester sur place ; la simulation et les menaces continuent. Un déplacement, un tir, une recharge, une blessure, une menace proche ou la perte des ingrédients interrompt le travail sans paiement.

| Système | Préparation et coût | Effet jouable et limite |
|---|---|---|
| Bivouac | 7 s ; 12 bois + 6 ferrailles | Une couchette et un paquet visibles, sur un sol extérieur libre devant le joueur. Quatre haltes au maximum, chacune dure 600 s de simulation. Une relève de 12 s au contact consomme 3 nourritures et restaure jusqu’à 16 vie. Le bivouac n’arrête ni les vagues ni la nuit. |
| Repas chaud | 8 s ; 4 nourritures + 1 bois ; vrai feu de camp allumé à proximité | Réduit de 25 % l’endurance réellement dépensée en courant pendant 120 s, avec un budget total de 60 points économisés. Aucun gain à l’arrêt et aucun cumul. Le feu doit rester disponible jusqu’à la fin de la préparation. |
| Pansement compressif | 5 s ; 2 médicaments | Rend progressivement jusqu’à 18 vie sur 30 s. Les dégâts ou la mise à terre interrompent le reste du soin. Le déplacement après la pose est permis. La santé maximale reste inchangée. |
| Bâche pare-pluie | 7 s ; 4 bois + 3 ferrailles + 1 carburant ; halte proche | Pendant 300 s, réduit de 90 % la **surconsommation due à la pluie** des flammes dans un rayon de 3,2 m, avec accès libre. La combustion normale continue. La toile visible ne constitue ni un mur ni une protection contre les infectés. |
| Entretien itinérant | 8 s ; 4 carburants + 2 ferrailles ; halte proche | Ajoute jusqu’à 240 s d’autonomie à une lanterne éteinte portée ou posée à proximité, sans dépasser son réservoir de 360 s. Cette réparation de fortune est moins économique que le ravitaillement au dépôt. |

Le feu de camp, les torches et les lanternes sont les appareils existants du tiroir **Éclairage**. Le bivouac ne duplique pas leur inventaire. Une bâche abrite la flamme sans créer de source lumineuse. Il faut reprendre ou déplacer soi-même une lanterne si elle est trop éloignée du camp. Démonter une halte ne rembourse pas ses fournitures usées.

Les bivouacs restent au sol dans leur domaine local/régional. Ils ne suivent pas le joueur dans une transition, n’occupent pas les étages et ne sont pas construits au milieu des maisons ou véhicules. Ce sont des équipements légers passables, pas des bâtiments fortifiés ni une nouvelle capacité de logement. Les camps perdus ou expirés n’effacent pas les appareils nocturnes installés autour.

La sauvegarde conserve les positions et le temps restant des camps, des bâches, du repas et du soin dans `expansions127.modules.survival`. Une préparation encore en cours est abandonnée à la reprise, sans dépense préalable. Une ancienne campagne commence sans camp ni consommable offert. Les minuteries du pack sont suspendues par la pause et les fenêtres modales.

Les chiffres de gameplay sont centralisés dans `DeadwallCore.SurvivalPackRules` de `src/core.js`. Les scans de camps sont bornés à quatre objets ; les horde régionales utilisent leur registre existant. Aucune recherche globale de chemin n’est ajoutée. Les couchettes et toiles de D-17 participent au tri commun de profondeur avec les bâtiments et personnages. Dans la région, elles sont dessinées avec les équipements au sol avant les acteurs.

## Validation

`node --test tests/survival-pack.test.cjs` couvre les coûts, annulations, menaces, pause, inventaire perdu pendant l’action, sauvegardes, seuils, domaine régional, course réelle et deux raccordements à l’éclairage. Les tests utilisent le moteur sous DOM simulé, et ne constituent pas une certification visuelle en navigateur. La vérification complète de distribution relève de la livraison intégrée.

## Correctifs de cohérence — 1.28

Les interactions locales avec les camps et feux contrôlent désormais les solides G4 sur tout le segment d’accès. On ne peut plus profiter d’un feu, entretenir une lanterne ou recevoir la protection d’une bâche à travers un mur de station. La préparation et le pansement sont interrompus avant une éventuelle réanimation dans la même mise à jour. Les coûts, soins, autonomies, limites de haltes et format sauvegardé restent identiques.

## Interruption au moment de l’impact — 1.54

Les vrais dégâts reçus à pied dans D-17 ou dans la région interrompent immédiatement le pansement et la préparation. Un kit de relève ou un autre service qui soigne ensuite dans la même image ne peut plus masquer la blessure et conserver le soin perdu. Un impact refusé par l’invulnérabilité conserve le pansement. Une pose inachevée ne consomme pas ses médicaments ; un pansement déjà payé ne les restitue pas. Le registre de sauvegarde reste inchangé. `tests/survival-damage154.test.cjs` couvre ces interactions et leur reprise avec les contrôleurs réellement installés.
