# Éclairage de terrain — 1.26

Cette extension utilise les nuits déjà simulées. Elle ne crée ni calendrier concurrent, ni bonus permanent, ni seconde monnaie. Les projecteurs alimentés, la lampe personnelle commandée par **L**, les phares et les kits de secours des services essentiels continuent de fonctionner.

## Parcours jouable

Le tiroir **ÉCLAIRAGE** est disponible pendant la partie, au clavier comme au tactile. Il reste non modal : assembler prend réellement du temps. Échap referme ce tiroir. La carte et les autres fenêtres modales suspendent son utilisation et l’usure des dispositifs.

1. Rejoindre le dépôt à pied et assembler avec les stocks, pendant une accalmie. Bois embrasé, torche et foyer peuvent aussi se préparer sur le terrain avec le sac, même de nuit si aucun infecté proche ne menace le commandant.
2. Équiper un objet du dépôt. La ceinture possède huit emplacements **communs** avec les kits de soins, d’étai, d’éclairage et de diversion.
3. Allumer une source portative ou poser un appareil devant soi, sur un sol dégagé. Une seule source allumée peut être portée à la fois. Poser la première permet d’en allumer une autre.
4. Reprendre les lampes déposées à portée et par un accès libre. Éteindre un projecteur sur pied avant de le replier. Un foyer reste sur place : on l’éteint, le ravitaille ou le démonte.
5. Ravitailler les appareils réutilisables éteints. Le foyer consomme le bois du sac sur place, ou celui du dépôt à proximité ; les autres appareils se rechargent au dépôt.

L’assemblage dure trois secondes au dépôt et cinq sur le terrain. Bouger, être blessé ou perdre les conditions nécessaires l’annule sans dépense. La sécurité contrôle les infectés proches et l’emprise des hordes sauvages régionales, sans se limiter aux infectés isolés des bâtiments. Les murs et les étages séparent les menaces régionales selon leur accès réel. Le paiement intervient une seule fois, à la fin. Le matériel d’atelier avancé demande la livraison d’un module d’éclairage des **services essentiels** : la progression existante reste utile.

## Équipements et contreparties

Les coûts et autonomies sont centralisés dans `DeadwallCore.NightGearRules`, dans `src/core.js`. Les durées sont des secondes de simulation active et les rayons sont des mètres.

| Équipement | Coût | Rayon | Autonomie | Emploi et recharge |
| --- | --- | ---: | ---: | --- |
| Bois embrasé | 2 bois, 1 carburant | 4 m | 75 s | Improvisation portée ou posée ; consumé définitivement. |
| Torche de résine | 4 bois, 2 carburant | 7 m | 180 s | Portée ou plantée ; consumée définitivement. |
| Feu de camp | 12 bois, 4 pierre, 1 carburant | 11 m | 300 s | Extérieur seulement, loin des véhicules ; 8 bois pour refaire le foyer. |
| Fusée éclairante | 3 ferraille, 2 carburant | 16 m | 55 s | Recette récupérée ; portée ou posée, lumière rouge et signal sonore régional. |
| Bâton lumineux | 2 ferraille, 1 carburant | 3,6 m | 360 s | Recette récupérée ; faible balisage vert, silencieux et étanche. |
| Lanterne à carburant | 8 ferraille, 3 carburant | 8,5 m | 360 s | Portée ou posée ; plein de 3 carburant au dépôt. |
| Lampe de chantier | 14 ferraille, 3 carburant | 14 m | 240 s | Recette récupérée ; sur pied, lumière froide ; recharge 2 carburant et 1 ferraille. |
| Balise de route | 8 ferraille, 2 carburant | 6 m | 480 s | Recette récupérée ; posée ; recharge 1 carburant et 1 ferraille. |

Les fusées et bâtons chimiques activés ne s’éteignent pas : leur réaction se termine seule. Les objets consumables épuisés disparaissent ; les appareils rechargeables restent au sol ou dans la ceinture avec leur autonomie à zéro. Démonter un appareil ne rembourse pas ses matériaux : cette commande sert à enlever un dispositif inutile.

La pluie accélère la combustion des flammes à découvert jusqu’à 2,6 fois leur usure normale. Le foyer et la fusée posés produisent un signal que les infectés régionaux peuvent investiguer ; ils ne détournent pas magiquement la horde de siège. Les autres lampes améliorent la visibilité sans fabriquer de cible sonore. Monter dans un véhicule éteint les lampes portées réversibles ; les réactions chimiques déjà déclenchées continuent.

## Monde et lisibilité

Les dispositifs peuvent être portés ou posés dans D-17 et dans la région. Le registre distingue les coordonnées locales en pixels, les coordonnées régionales en mètres et l’étage. Une lampe posée ne suit pas le joueur lors d’un passage entre domaines ou entre étages.

De rares petites balises solaires subsistent devant des infrastructures publiques cohérentes : stations-service, casernes de pompiers, bunkers, locaux électriques, quais logistiques et mairies. Leur présence est déterministe ; elles ne révèlent pas les lieux sur la carte et ne donnent aucun objet. Les quatre stations G4 de D-17 disposent aussi d’une balise de bordure. Elles n’allument pas toute une ville abandonnée. En journée leur appareil reste visible et leur éclairage s’éteint automatiquement.

Les sources produisent un halo doux de la couleur du matériel. Le masque et le halo coloré utilisent le même polygone d’occlusion. Dans D-17, les murs des stations, maisons, bâtiments de hameaux et palissades G4 arrêtent les rayons ; une ouverture reste traversable par la lumière. Les portes et murs construits continuent d’utiliser les règles historiques du moteur. Dans la région, murs et niveaux sont testés avec la géométrie régionale. L’animation de flamme devient fixe lorsque les mouvements réduits sont activés.

Les lumières locales sont également utilisées pour le ciblage des défenses pendant les nuits noires. Le plafond graphique historique ne retire pas des sources de la liste de détection des défenses.

## Sauvegarde et limites

Le champ additionnel `nightGear`, sous-version 1, contient les appareils, leurs identifiants, leur emplacement, leur autonomie et leur état. Un ancien enregistrement sans ce champ reprend avec un registre vide, sans cadeau ni dépense. Les recettes avancées exigent toujours la livraison de leur module. Une reprise ne recharge rien et ne termine pas un assemblage interrompu.

Les contrôles rejettent les doublons, identifiants incompatibles avec le compteur, valeurs non finies, autonomie supérieure à la capacité, allumage impossible, ceinture surchargée et positions régionales dans un bâtiment/étage inexistant. La validation précède la restauration du monde.

Le total est borné à 64 appareils et le placement volontaire à 24 dispositifs au sol. À la mort, tout le matériel porté tombe à la position du personnage ; cette opération peut dépasser le plafond de placement volontaire sans perdre de matériel ni rendre la sauvegarde invalide. Des morts successives restent bornées par le plafond total de 64.

## Modules et vérifications

- `src/night-gear.js` : registre, transactions, temporalité, interactions, interface et silhouettes Canvas.
- `night-gear.css` : tiroir responsive, focus visible et commandes tactiles.
- `src/nightwatch.js` : sources locales, détection défensive, ombres G4 et halos colorés.
- `src/frontier-art.js` : lampes régionales, niveaux, halos et silhouettes.
- `src/essential-ui.js` : compteur de ceinture commun aux deux familles de matériel.
- `tests/night-gear.test.cjs` : fabrication, paiement, pause, recharge, pluie, reprise, domaines, terrain, recettes et occultation.
- `tests/qa-night-persistence.test.cjs` : contre-audit indépendant des étages, données invalides, migrations et morts répétées.

Les tests automatiques utilisent le moteur réel dans le harnais DOM. Ils ne constituent pas une certification des navigateurs ou de l’interface tactile sur un appareil physique.

## Correctifs de cohérence — 1.28

La pose contrôle désormais tout l’accès jusqu’au point visé, dans D-17 comme dans la région. Récupération, allumage au contact et interactions des bivouacs respectent aussi les murs et meubles G4 ; les vraies portes restent utilisables. Les stations et maisons G4 abritent les flammes de la pluie, uniquement lorsque cette génération est réellement active.

Une mise à terre régionale dépose immédiatement la ceinture à la position de l’accident, avant le retour sanitaire : domaine, étage et bâtiment sont conservés. Une reprise juste avant la réanimation dépose également le matériel avant tout déplacement du personnage. Un rechargement interrompt l’assemblage sans dépense. Pause et fenêtres modales suspendent aussi l’appel direct au pas de simulation des appareils.

La validation des positions à l’étage réutilise au plus trois géométries indépendantes du monde courant, indexées par graine et génération. Les identités, étages et coordonnées sont contrôlés à chaque import ; ce cache n’introduit aucun état de jeu partagé. Les lectures de position utilisent l’API régionale légère pour éviter de reconstruire une vue détaillée lorsque seul l’emplacement du joueur est nécessaire.
