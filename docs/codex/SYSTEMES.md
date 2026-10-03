# Modules systemes — Codex territorial 1.27

Source structurée : `src/world-codex-systemes.js`. Les statuts indiquent la portée réelle : jouable, plan pilote partiel, ou conception. Ces fiches ne peuplent pas automatiquement le monde.

## Récolte, sac et dépôt — `retour-depot`

**Statut : jouable.**

**Intention.** Une ressource n’est disponible pour la cité qu’après son dépôt ; le trajet de retour fait partie de la décision.

**Composition.** Positionner ressource et contenant dans leur lieu d’usage. Garder un accès physique et une distance de récupération cohérente.

**Accès et traversée.** Le joueur s’approche pour récolter puis rejoint le dépôt ; les ouvriers transportent eux aussi une charge.

**Ressources.** Sac limité et stocks plafonnés par ressource. L’inventaire affiche les quantités réellement portées.

**Risques et limites.** Charge immobilisée loin du dépôt, sortie obstruée ou stock saturé ; l’excédent n’est pas une récompense cachée.

**Nuit.** Préparer lumière et trajet avant une sortie ; ouvrir le guide ne remplit pas le sac.

**Variantes.** Collecte manuelle ; ouvriers ; véhicule ; récupération spécialisée.

**Raccords de systèmes.** Construction, capacité, travailleurs, risque et durée de sortie.

**Vérification.** Vérifier conservation des quantités entre gisement, sac, coffre et stock, y compris après reprise.

**Présence / source.** src/game.js ; src/frontier.js ; src/exploration-125.js

## Routes et coutures territoriales — `routes-coutures`

**Statut : jouable.**

**Intention.** La route guide le déplacement ; les nouvelles campagnes G4 rejoignent la région depuis les quatre bords de D-17.

**Composition.** Hiérarchiser artères, collectrices, dessertes et passages locaux ; dégager le centre des carrefours.

**Accès et traversée.** Un bord praticable de D-17 reste franchissable même sans route. Les campagnes G3 conservent leur géométrie historique.

**Ressources.** Arrêts utiles sur les marges : station, atelier, abri ou épave, sans répartition uniforme.

**Risques et limites.** Accident, barrage et abandon se distinguent par leur composition ; aucun ne doit condamner toutes les voies sans autre passage.

**Nuit.** Baliser une décision de route ou un lieu actif ; les traits peints ne sont pas des sources lumineuses.

**Variantes.** Croix ; T ; diagonale ; voie de service ; raccord de village.

**Raccords de systèmes.** Carte, conduite, navigation IA, retour et génération de sauvegarde.

**Vérification.** Franchir chaque face à plusieurs positions ; contrôler latéralité, caméra et absence de duplication du monde.

**Présence / source.** src/frontier.js ; src/exploration-125.js ; src/region-roadkit.js

## Postures et surfaces — `postures`

**Statut : jouable.**

**Intention.** La posture et le sol changent la mobilité ; la silhouette et l’interface doivent montrer ce changement.

**Composition.** Associer le sol visible à sa catégorie réelle : route, cour, terrain, boue ou forêt selon la zone.

**Accès et traversée.** Debout permet le sprint ; accroupi et allongé réduisent la vitesse. Les contrôles de région et de D-17 gardent leur contexte.

**Ressources.** Aucune ressource créée ; l’économie porte sur le temps, l’endurance et l’exposition.

**Risques et limites.** Une posture basse ne signifie pas invisibilité absolue ni passage automatique sous une clôture.

**Nuit.** Le faisceau suit le joueur dans son domaine et son étage, sans rallumer une région absente.

**Variantes.** Marche ; sprint ; accroupi ; allongé ; conduite avec règles propres.

**Raccords de systèmes.** Endurance, surface, collisions, animation et visibilité.

**Vérification.** Comparer déplacement réel et information affichée ; interdire sprint en posture basse.

**Présence / source.** src/exploration-125.js ; src/world-evolution.js

## Véhicules et accès — `vehicules`

**Statut : jouable.**

**Intention.** Un véhicule donne une capacité de transport contre carburant, encombrement et contraintes de passage.

**Composition.** Réserver stationnement, accès de service et demi-tour à l’échelle du véhicule réel.

**Accès et traversée.** Les profils utilisent leur géométrie de conduite ; une ouverture pour piéton n’est pas une entrée de garage.

**Ressources.** Carburant et coffre avec quantités effectives ; distinguer épave fouillable et véhicule de campagne.

**Risques et limites.** Coincement et trajet hors route ; un véhicule vide reste un objet, pas une réserve réinitialisée.

**Nuit.** Phares ou portable posé doivent respecter position et état du véhicule ; la conduite ne duplique pas la lampe du piéton.

**Variantes.** Flotte de campagne ; véhicule abandonné ; ambulance ; citerne ; bus.

**Raccords de systèmes.** Logistique, surfaces, visibilité et sauvegarde du déplacement.

**Vérification.** Charger, conduire, franchir un raccord puis reprendre ; vérifier coffre, carburant et absence de double joueur.

**Présence / source.** src/expeditions.js ; src/frontier.js ; src/world-evolution.js

## Enceintes, portes et repli — `fortifications`

**Statut : jouable.**

**Intention.** Plusieurs enceintes et voies de repli rendent la défense durable ; une grande muraille unique ne supprime pas la pression.

**Composition.** Enceinte externe pour production, intermédiaire pour quartiers, interne pour commandement ; portes couvertes par les défenses.

**Accès et traversée.** Préserver accès aux chantiers et déblaiement extérieur. Une fermeture occupée doit être refusée.

**Ressources.** Construction et réparation consomment matériaux ; les postes armés consomment munitions.

**Risques et limites.** Portes faibles, brèches et accumulation de cadavres. La perte d’un quartier ne termine pas à elle seule la campagne.

**Nuit.** Éclairer portes et zones de travail en fonction de l’énergie disponible ; conserver un itinéraire de repli lisible.

**Variantes.** Palissade ; acier ; béton ; porte automatique, ouverte ou verrouillée.

**Raccords de systèmes.** Pathfinding, pression des corps, énergie, spécialistes et logistique.

**Vérification.** Tester enceinte réellement fermée, ouverture occupée, brèche puis repli sans traverser de mur.

**Présence / source.** src/tactics.js ; src/core.js ; src/linecare.js

## Infectés, hordes et progression — `hordes`

**Statut : jouable.**

**Intention.** La menace grandit par effectif, fronts et durée ; les profils conservent des faiblesses compréhensibles.

**Composition.** Réserver des zones d’apparition hors du contact immédiat et des axes de migration cohérents.

**Accès et traversée.** Les infectés respectent les obstacles et cherchent les accès ; les groupes régionaux et l’assaut de la cité ont des modèles distincts.

**Ressources.** Aucun butin inventé pour justifier leur présence. La défense dépense temps, matériaux et munitions.

**Risques et limites.** Bandes errantes entre les vagues, fronts multiples et pression des cadavres ; profils avancés après leurs seuils.

**Nuit.** La visibilité varie avec la nuit, sans transformer les infectés en silhouettes fluorescentes ou monstres lumineux.

**Variantes.** Errants ; récents ; protégés ; rampants ; briseurs ; traqueurs ; hurleurs ; engorgés.

**Raccords de systèmes.** Signature, fortifications, bruit régional et phases de campagne.

**Vérification.** Contrôler seuils, plafonds simultanés et absence d’injection de bande D-17 pendant l’assaut principal.

**Présence / source.** src/core.js ; src/world-evolution.js ; src/exploration-125.js

## Nuit et choix d’éclairage — `nuit-lumiere`

**Statut : jouable.**

**Intention.** Une source crée une zone utile dans la nuit ; son domaine, son état et sa durée doivent rester lisibles.

**Composition.** Associer chaque lumière à un appareil, un foyer ou une infrastructure. Éclairer tâche, entrée et retour plutôt que couvrir toute la carte.

**Accès et traversée.** Une lampe portable suit son porteur ; une lampe posée reste à sa position et à son étage.

**Ressources.** Coût, combustible, durée et récupération se lisent dans le panneau d’éclairage lorsque l’extension est disponible.

**Risques et limites.** Une lumière n’est ni un mur ni une preuve de sécurité. La lecture du combat doit rester possible sans blanc uniforme.

**Nuit.** Varier teinte et portée par usage ; conserver l’occlusion des murs et la séparation entre D-17 et région.

**Variantes.** Lampe ; torche ; branche enflammée ; feu de camp ; flare ; chem-light ; lanterne posée.

**Raccords de systèmes.** Énergie, ressources, équipement, perception et sauvegarde.

**Vérification.** Allumer, déplacer ou poser, changer de domaine puis recharger ; vérifier durée et position uniques.

**Présence / source.** src/nightwatch.js ; src/essential-ops.js ; extension nocturne 1.26

## Éclairage fixe cohérent — `lumiere-infrastructure`

**Statut : plan.**

**Intention.** Un lieu éclairé doit expliquer sa source et ses priorités ; une enseigne ne justifie pas un quartier sous tension.

**Composition.** Définir source, circuit, points lumineux et zones de travail avant le halo. Les points importants sont portail, atelier et issue.

**Accès et traversée.** Le joueur rejoint l’appareil ou le coffret par une voie de maintenance réelle.

**Ressources.** Carburant, batterie ou réseau selon le système implanté ; aucun gain d’énergie par consultation du guide.

**Risques et limites.** Panne, délestage et contraste excessif. Un appareil éteint doit rester reconnaissable.

**Nuit.** Baisser la densité hors des lieux occupés ; garder des secteurs sombres et des ruptures plausibles.

**Variantes.** Sodium de cour ; lampe de seuil ; projecteur ; balise ; éclairage de secours.

**Raccords de systèmes.** Énergie, orientation, statut du lieu et réparation.

**Vérification.** Éteindre source puis vérifier tous les points dépendants ; sauvegarder cet état avant toute activation de ce modèle.

**Présence / source.** Contrat de conception ; les éclairages de cité existants gardent leurs règles propres.

## Foyers, fumée et feu — `feu-coherence`

**Statut : plan.**

**Intention.** Un foyer portable ou posé doit avoir un usage et une empreinte ; l’effet visuel ne doit pas prétendre simuler un incendie complet.

**Composition.** Placer le foyer sur une surface dégagée et laisser place aux acteurs. La fumée ne masque pas durablement l’issue.

**Accès et traversée.** Approche possible pour poser, utiliser ou éteindre selon les actions réellement proposées.

**Ressources.** Combustible fini ; le bois décoratif voisin ne recharge pas automatiquement le feu.

**Risques et limites.** L’éclairage, les dégâts et la propagation sont des systèmes séparés. Ne promettre aucun incendie de bâtiment sans règle explicite.

**Nuit.** Couleur chaude, variation limitée et lumière locale ; ne pas accumuler les halos jusqu’à effacer la nuit.

**Variantes.** Feu de camp ; brasero ; torche ; branche embrasée ; feu de signalement.

**Raccords de systèmes.** Bois, visibilité, équipement, ambiance et état persistant.

**Vérification.** Tester coût une fois, extinction, durée et changement de zone ; séparer animation et résultat de simulation.

**Présence / source.** Contrat de conception à appliquer aux dispositifs nocturnes.

## Kits et services essentiels — `kits-services`

**Statut : jouable.**

**Intention.** Les modules récupérés débloquent des préparations utiles ; leur récit reste lié à une action matérielle.

**Composition.** Chaque mission de service vise un meuble compatible dans un lieu réel, avec une position de récupération.

**Accès et traversée.** Relever sur place, transporter le colis puis le déposer ; ne pas délivrer la recette à distance.

**Ressources.** Kits lumière, soin, étai et diversion avec stock et ceinture bornés ; un colis suit son porteur ou son véhicule.

**Risques et limites.** Transport perdu ou interrompu, effet temporaire et ressources limitées. Un étai n’augmente pas la résistance maximale.

**Nuit.** Les kits lumineux existants posent des effets temporaires ; l’état restant suit la sauvegarde.

**Variantes.** Électricité ; balisage ; soin ; menuiserie ; fret ; avertisseur.

**Raccords de systèmes.** Narration, collecte, coffre, ceinture et soutien de défense.

**Vérification.** Vérifier recette après livraison unique, limite de ceinture et absence de colis doublé.

**Présence / source.** src/essential-content.js ; src/essential-state.js ; src/essential-ops.js

## Abandon et états de fouille — `abandon-etats`

**Statut : jouable.**

**Intention.** Un lieu garde les traces de ce qui a été pris ; changer de secteur ne répare pas son histoire.

**Composition.** Distinguer intact, ouvert, fouillé, épuisé et détruit si ces états existent ; conserver le volume utile à l’orientation.

**Accès et traversée.** Un objet épuisé ne devient pas soudain une nouvelle entrée si sa collision devait rester.

**Ressources.** Quantités finies attachées à l’identifiant de contenant ; jamais au nombre d’ouvertures de l’interface.

**Risques et limites.** Confusion entre disparition de ressource et disparition de bâtiment ; prévenir toute récupération infinie.

**Nuit.** Une lampe épuisée reste distincte d’une lampe allumée ; les halos ne révèlent pas de faux nouveaux stocks.

**Variantes.** Coffre ouvert ; rayon vide ; épave dépouillée ; atelier abandonné.

**Raccords de systèmes.** Loot, collision, rendu, cache et sauvegarde.

**Vérification.** Épuiser, sortir, revenir, sauvegarder et recharger ; comparer état et quantités.

**Présence / source.** src/frontier-state.js ; src/exploration-125.js

## Intérieurs, niveaux et mobilier — `interieurs`

**Statut : jouable.**

**Intention.** Les pièces suivent un programme d’usage et les niveaux se relient par des accès réels.

**Composition.** Parcelle, volume, étage, pièce, usage, mobilier puis contenant. Laisser couloirs et zones d’interaction avant les détails.

**Accès et traversée.** Entrée, escalier, meuble et sortie doivent former un trajet continu ; l’acteur ne récupère pas à travers mur ou plafond.

**Ressources.** Ressources par meuble et métier du lieu ; les objets d’un étage ont leurs IDs propres.

**Risques et limites.** Encombrement, collision d’escalier et changement de niveau incorrect ; un plafond ne doit pas cacher le joueur actif.

**Nuit.** Les sources restent au niveau et dans le domaine d’origine ; occlusion par les parois conservées.

**Variantes.** Rez-de-chaussée ; sous-sol ; étages ; annexe ; cour.

**Raccords de systèmes.** Fouille, visibilité, navigation, séparation verticale et rendu.

**Vérification.** Vérifier chaque salle utile et chaque niveau autorisé sans franchissement de mur.

**Présence / source.** src/frontier-geometry.js ; src/frontier-world.js ; src/frontier-art.js

## Carte, connaissance et guide — `carte-guide`

**Statut : jouable.**

**Intention.** Le plan de D-17, l’atlas régional et le guide ont des rôles différents et doivent annoncer ce qu’ils montrent.

**Composition.** Hiérarchie de routes, lieux, repères et position active ; les fiches de conception sont séparées des fonctions jouables.

**Accès et traversée.** M ouvre le plan local ou l’atlas régional selon le contexte ; le guide se lit depuis les dossiers de terrain.

**Ressources.** Aucune découverte, ressource ou récompense n’est déclenchée par la simple consultation.

**Risques et limites.** Position affichée dans un mauvais domaine, divulgation de lieux non découverts ou confusion entre projet et fonctionnalité.

**Nuit.** La lecture en pause conserve l’état du jeu ; elle ne fait pas disparaître les lampes ou le temps restant.

**Variantes.** Carte routière ; atlas régional ; journal ; guide filtrable.

**Raccords de systèmes.** Pause, focus clavier, découverte et navigation.

**Vérification.** Ouvrir et fermer depuis jeu, pause et menu ; restaurer focus et état sans input de déplacement maintenu.

**Présence / source.** src/exploration-125.js ; src/frontier-ui.js ; src/world-codex.js

## Population et vie de la cité — `population-vie`

**Statut : jouable.**

**Intention.** La croissance doit rester liée aux logements, rations, soins et travail réellement disponibles.

**Composition.** Séparer lieux de vie, production et défense, avec chemins vers les services et les accès de travail.

**Accès et traversée.** Les spécialistes doivent rejoindre leurs cibles ; un bâtiment au milieu d’une enceinte fermée exige une porte alliée.

**Ressources.** Chaque recrutement consomme ses coûts et une place ; les personnes mangent et les soins utilisent des médicaments.

**Risques et limites.** Pénurie, moral bas et poste de travail isolé ; les effets des bâtiments détruits ne restent pas acquis.

**Nuit.** Concentrer les lumières sur circulation et travail ; la cité éclairée attire visuellement l’attention sans inventer un bonus de sécurité.

**Variantes.** Ouvriers ; fusiliers ; secouristes ; ingénieurs ; compagnons régionaux.

**Raccords de systèmes.** Logement, nourriture, moral, énergie et voies alliées.

**Vérification.** Tester pénurie, logements pleins, soins d’une cible vivante et routes interrompues.

**Présence / source.** src/core.js ; src/game.js ; src/world-evolution.js

## Contrat de génération modulaire — `generation-modulaire`

**Statut : plan.**

**Intention.** Chaque composition se construit de la région au contenant, avec des contrats de raccord et des identifiants stables.

**Composition.** Ordre imposé : relief, réseau, quartier, parcelle, volume, niveau, pièce, usage, prop, contenant et lumière.

**Accès et traversée.** Réserver enveloppe et interfaces avant d’ajouter le mobilier. Chaque module annonce ses entrées et tailles acceptées.

**Ressources.** Budget fini par usage ; tirer les ressources depuis un flux déterministe séparé du combat.

**Risques et limites.** Chevauchement, portes obstruées, faux raccourcis et duplication au chargement ; rejeter la composition impossible.

**Nuit.** Les dispositifs appartiennent à un lieu, un niveau et une source. Le simple changement de vue ne réinitialise pas leur durée.

**Variantes.** Module isolé ; groupement ; district ; région ; variante climatique.

**Raccords de systèmes.** Génération, navigation, loot, rendu et migration.

**Vérification.** Valider géométrie et budget sur plusieurs graines ; contrôler les coutures et anciennes campagnes.

**Présence / source.** docs/codex/CONTRATS.md ; les futurs modules n’altèrent pas les cartes historiques.

## Identités et sauvegarde — `sauvegarde-identites`

**Statut : jouable.**

**Intention.** La sauvegarde conserve les conséquences d’une sortie et la version de génération qui a créé le monde.

**Composition.** Chaque lieu, étage, contenant et dispositif persistant possède une identité dans son domaine.

**Accès et traversée.** Restaurer une position praticable et le bon niveau ; recalculer les routes transitoires sans réinventer les lieux.

**Ressources.** Quantités, sac, coffre, effets et coûts engagés restent cohérents avant/après reprise.

**Risques et limites.** Changement silencieux de géométrie, identifiant recyclé et duplication ; une sauvegarde invalide doit être refusée avant mutation.

**Nuit.** Conserver source active, position et durée restante des dispositifs persistants.

**Variantes.** Ancienne G3 ; nouvelle G4 ; sauvegarde locale ; import ; copie de secours.

**Raccords de systèmes.** Compatibilité, génération, inventaire et progression.

**Vérification.** Comparer sérialisation et reprise ; tester valeurs invalides et conservation de la campagne en cours.

**Présence / source.** src/save.js ; src/frontier-state.js ; src/exploration-125.js

## Rendu, silhouettes et animation — `rendu-lisibilite`

**Statut : jouable.**

**Intention.** La silhouette et le pied de l’objet doivent suffire à lire qui est devant, derrière ou au contact.

**Composition.** Sol avant volumes, volumes et acteurs triés par leur base, effets et repères après. Préserver le contraste à petite échelle.

**Accès et traversée.** Une animation ne déplace pas la collision hors du personnage ; les ouvertures visibles gardent leur largeur physique.

**Ressources.** Les variantes graphiques ne donnent pas de ressources ou bonus invisibles.

**Risques et limites.** Personnage sous le sol, halo écrasant, silhouette illisible ou animation contredisant posture et arme.

**Nuit.** Les matériaux sombres restent distinguables ; les lampes ne doivent pas cacher les infectés derrière un voile blanc.

**Variantes.** Marche ; attente ; tir ; récolte ; accroupi ; allongé ; blessure.

**Raccords de systèmes.** Profondeur, posture, combat, éclairage et performance.

**Vérification.** Contrôler devant/derrière un mur, une maison et un véhicule, puis les mêmes scènes de nuit.

**Présence / source.** src/art.js ; src/frontier-art.js ; src/exploration-125.js


## Prospection et retour chargé — `operations-prospection`

**Statut : jouable (1.27).**

**Intention.** Relevez un gisement, balisez votre trajet et ramenez un ballot issu de sa réserve finie.

**Composition.** Caches et piquets se posent sur un sol libre dans D-17 ; leur dessin reste passable.

**Accès et traversée.** Approchez le gisement pour travailler, puis le dépôt pour livrer. Les caches exigent un transfert sur place.

**Ressources.** Le relevé coûte 1 nourriture ; cache 6 bois et 3 ferraille ; piquet 2 bois et 1 ferraille. Le ballot retire jusqu’à 24 unités du gisement.

**Risques et limites.** Le dos accueille un seul colis. Le ballot ralentit à 72 % et interdit le sprint ; une sortie en région ou la chute le laisse dans D-17.

**Nuit.** Équipez une source lumineuse pour le trajet. Le fil entre piquets ne produit aucune lumière.

**Variantes.** Relevé ; cache ; piquets ; ballot ; récupération après abandon.

**Raccords de systèmes.** Stocks, sac, gisements, route de retour et colis essentiels partagent leurs limites.

**Vérification.** Comparer ressource extraite, portée, laissée puis livrée après une reprise.

**Présence / source.** src/exploration-pack.js

## Bivouac et préparations de survie — `operations-bivouac`

**Statut : jouable (1.27).**

**Intention.** Préparez une halte, un repas, des soins ou un abri temporaire avec les fournitures portées.

**Composition.** Le couchage occupe un terrain extérieur dégagé ; au plus quatre haltes, chacune valable dix minutes de simulation.

**Accès et traversée.** Restez à pied et hors de portée des infectés. Bouger ou subir un coup interrompt les préparations.

**Ressources.** Le bivouac coûte 12 bois et 6 ferraille. Repos, repas, pansement, bâche et entretien ont leurs propres coûts affichés.

**Risques et limites.** La halte ne repousse aucun infecté. Les effets expirent et le pansement cesse après une blessure.

**Nuit.** Un repas exige un vrai foyer allumé. La bâche protège les flammes proches de la pluie ; elle ne recharge pas leur combustible.

**Variantes.** Halte et repos ; repas chaud ; pansement progressif ; bâche ; lanterne entretenue.

**Raccords de systèmes.** Éclairage, pluie, santé, endurance et sac sont raccordés aux mêmes appareils et réserves.

**Vérification.** Vérifier consommation unique, interruption, position de la halte, expiration et pause.

**Présence / source.** src/survival-pack.js ; src/night-gear.js

## Postes préparés et industrie régulée — `operations-ateliers`

**Statut : jouable (1.27).**

**Intention.** Ajoutez des réserves finies aux postes, récupérez les ruines et préservez les intrants de la cité.

**Composition.** Chaque caisson, cassette, filet ou régulateur reste attaché à une structure compatible.

**Accès et traversée.** Rejoignez physiquement le support pour intervenir. Les réparations manuelles exigent une période calme.

**Ressources.** Le caisson contient 24 cartouches payées ; la cassette 200 points de réparation ; le filet retient 12 unités de corps.

**Risques et limites.** La destruction du support détruit son équipement. Les débris ont une réserve unique et doivent entrer dans le sac.

**Nuit.** Les caissons conservent les conditions de tir des défenses, leur cadence et leur visibilité.

**Variantes.** Caisson local ; cassette ; filet de corps ; tri des débris ; régulateur industriel.

**Raccords de systèmes.** Le régulateur conserve 25 unités de chaque intrant après les services ; il respecte énergie et coûts de production.

**Vérification.** Tester panne, destruction en chaîne, démontage, saturation du sac et reprise sans double récupération.

**Présence / source.** src/fortification-pack.js

## Équipe de terrain et sacoches — `operations-equipe`

**Statut : jouable (1.27).**

**Intention.** Donnez des ordres aux compagnons, adaptez leur formation et préparez leurs fournitures au dépôt.

**Composition.** Les partenaires régionaux conservent leur position et utilisent la navigation physique.

**Accès et traversée.** Suivre, tenir et regrouper s’appliquent à une sortie à pied ; les services du dépôt demandent un accès libre.

**Ressources.** Les sacoches contiennent des ressources prélevées dans les stocks. L’entraînement de spécialité est payé et temporisé.

**Risques et limites.** Une consigne silencieuse désactive le tir de Malik. Un partenaire éloigné ne transmet pas sa sacoche à distance.

**Nuit.** La discipline défensive limite la portée d’engagement. Les formations ne rendent pas le groupe invisible.

**Variantes.** Trois ordres ; trois formations ; trois disciplines ; spécialités entraînées ; sacoches.

**Raccords de systèmes.** Soins, réparation, reconnaissance et tir conservent leurs consommables et leurs collisions.

**Vérification.** Tester tenir puis reprendre loin du joueur, changement d’étage, pause, voiture et partage avec sac plein.

**Présence / source.** src/companions-pack.js ; src/world-evolution.js

## Contrats de sortie et défense — `operations-campagne`

**Statut : jouable (1.27).**

**Intention.** Engagez une opération facultative au dépôt, effectuez son travail sur place puis rendez compte.

**Composition.** Les sorties emploient des lieux déjà découverts et accessibles. Les opportunités engagées ne se réinitialisent pas.

**Accès et traversée.** Une seule opération est active ; chaque type permet une tentative par vague. Les objectifs de terrain ont un accès indiqué.

**Ressources.** Budget initial et consommables de terrain sont affichés. La récompense demande une livraison et une place dans les stocks ou les logements.

**Risques et limites.** Colis et blessé ralentissent le porteur et subissent les dégâts reçus. La chute peut faire perdre l’opération.

**Nuit.** Les travaux de terrain font du bruit ; une mission de défense n’est acquise qu’après une vague réellement repoussée.

**Variantes.** Patrouille ; aide humanitaire ; récupération industrielle ; évacuation ; engagement de défense.

**Raccords de systèmes.** Exploration, santé, portage, carburant, logement et progression partagent les conséquences de la mission.

**Vérification.** Vérifier compte rendu unique, sites finis, dégâts de transport, horde proche et maintien du centre au-dessus du seuil demandé.

**Présence / source.** src/campaign-pack.js
