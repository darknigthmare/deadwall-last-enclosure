# Modules activites — Codex territorial 1.26

Source structurée : `src/world-codex-activites.js`. Les statuts indiquent la portée réelle : jouable, plan pilote partiel, ou conception. Ces fiches ne peuplent pas automatiquement le monde.

## Zone industrielle — `industrie`

**Statut : pilote.**

**Intention.** Les flux de matière relient atelier, entrepôt, énergie et quais ; chaque bâtiment conserve son usage.

**Composition.** Grandes parcelles, cour de manœuvre, stockage extérieur et locaux techniques. Séparer piétons et service là où la place l’exige.

**Accès et traversée.** Une voie de poids lourds continue, un accès personnel et des chemins aux réserves.

**Ressources.** Ferraille, bois de conditionnement, carburant et pièces dans leurs zones ; machines de décor non productives.

**Risques et limites.** Angles morts derrière piles et hangars, grands trajets de collecte et exposition aux cours ouvertes.

**Nuit.** Lampes de tâche dans les ateliers ; projecteurs de cour seulement avec alimentation ou dispositif temporaire.

**Variantes.** Petites activités ; cité industrielle ; friche ; parc logistique.

**Raccords de systèmes.** Production de cité distincte, récupération, véhicule et énergie.

**Vérification.** Prouver l’accès aux deux côtés des quais et le demi-tour sans chevaucher les parcelles.

**Présence / source.** src/region-settlements.js ; src/frontier-geometry.js

## Port marchand — `port`

**Statut : plan.**

**Intention.** Le port articule terre et quai : arrivée du fret, stockage, contrôle, entretien et départ.

**Composition.** Quais, voies de service, entrepôts, parc à conteneurs, atelier et clôture avec accès. Réserver la bande d’eau avant les volumes.

**Accès et traversée.** Voie lourde en boucle, passages piétons, sorties des rangées de conteneurs ; grues et navires ne sont pas automatiquement pilotables.

**Ressources.** Bois de palette, ferraille, matériel et réserves logistiques ; cargaisons finies attribuées à un contenant.

**Risques et limites.** Culs-de-sac entre conteneurs, quai sans échappée et fronts venant des portes. Pas de chute ou baignade implicite.

**Nuit.** Mâts aux zones de service actives, balises de quai et éclairage portatif dans les hangars ; grandes zones éteintes.

**Variantes.** Port cargo ; petit port de pêche ; terminal passagers ; port industriel abandonné.

**Raccords de systèmes.** Réseau routier, eau future, logistique, récupération lourde et éclairage.

**Vérification.** Tester chaque allée de conteneurs, les bords et la cohérence du plan routier jusqu’aux portes.

**Présence / source.** Conception ; aucun biome portuaire généré actuellement.

## Mine à galerie — `mine`

**Statut : pilote.**

**Intention.** Le plan de mine actuel fournit un lieu visitable ; une exploitation souterraine complète exige ventilation et accès cohérents.

**Composition.** Entrée, zone de tri, atelier et espace d’extraction identifiable. Une extension de galeries suit les niveaux réellement accessibles.

**Accès et traversée.** Conserver retour vers l’entrée ; les galeries étroites ne doivent pas devenir un raccourci à travers les murs.

**Ressources.** Pierre et ferraille dans les contenants d’extraction, carburant et outillage en zone technique.

**Risques et limites.** Angles morts et sortie limitée. Gaz, effondrement et oxygène ne sont pas encore des mécaniques jouables.

**Nuit.** Balises près des sorties et lampes de travail ; l’obscurité ne doit pas rendre introuvable l’escalier.

**Variantes.** Petite mine ; galerie ancienne ; exploitation mécanisée ; entrée condamnée visible.

**Raccords de systèmes.** Niveaux, réserve d’éclairage, charge de transport et visibilité.

**Vérification.** Vérifier accès et retour de chaque niveau ; exclure les flammes des futures zones dangereuses seulement avec règle explicite.

**Présence / source.** src/frontier-geometry.js : mine ; dangers industriels en conception.

## Carrière — `carriere`

**Statut : pilote.**

**Intention.** Une carrière se distingue par extraction ouverte, stockage et chargement ; le plan pilote est une étape de ce programme.

**Composition.** Front de taille, plate-forme de tri, atelier et stockage. Les gradins futurs doivent être des niveaux reliés, pas des lignes de texture.

**Accès et traversée.** Accès de service large et espace de demi-tour ; séparer itinéraire piéton et voie des engins si nécessaire.

**Ressources.** Pierre dominante, ferraille d’entretien et carburant technique ; stocks visibles et finis.

**Risques et limites.** Grandes zones découvertes et goulots aux sorties. Poussière et chutes restent des extensions non simulées.

**Nuit.** Éclairage de chargement localisé, balises sur les accès ; un front entier ne brille pas sans infrastructure.

**Variantes.** Petite carrière ; gravière ; carrière profonde ; chantier désaffecté.

**Raccords de systèmes.** Matériaux lourds, véhicule, relief futur et production distincte de la cité.

**Vérification.** Tester chargement, rayon de véhicule et continuité des rampes avant d’ajouter du relief.

**Présence / source.** src/frontier-geometry.js : quarry

## Scierie et dépôt de bois — `scierie`

**Statut : pilote.**

**Intention.** Les billes arrivent, sont transformées puis stockées : le mobilier doit suivre cette chaîne ancienne.

**Composition.** Entrée des grumes, halle de coupe, atelier, stockage sec et départ des palettes.

**Accès et traversée.** Voie de service traversante et passages latéraux pour atteindre chaque pile.

**Ressources.** Bois dans grumes et palettes, ferraille à l’entretien ; les machines abandonnées ne produisent rien seules.

**Risques et limites.** Couloirs entre piles et faible visibilité autour du hangar ; le feu est un repère placé sur sol dégagé.

**Nuit.** Lampes de travail au banc et balisage de cour ; préserver une sortie lisible en panne.

**Variantes.** Scierie rurale ; dépôt forestier ; atelier de débit ; friche boisée.

**Raccords de systèmes.** Bois, construction, logistique et lumière temporaire.

**Vérification.** Contrôler accès aux stocks, absence de collision dans les entrées et état fouillé persistant.

**Présence / source.** src/frontier-geometry.js : sawmill

## Entrepôt et plateforme logistique — `entrepot`

**Statut : pilote.**

**Intention.** La récupération s’explique par réception, stockage et expédition ; chaque zone a son mobilier.

**Composition.** Quais, allées, rayonnages, bureau et cour. Les allées structurent le déplacement avant la densité des caisses.

**Accès et traversée.** Entrée de service et issue piétonne ; rayonnages espacés pour le rayon réel des personnages.

**Ressources.** Caisses finies, palettes et matériel de manutention ; le stock global du lieu ne se renouvelle pas après sortie.

**Risques et limites.** Faible visibilité dans les rangées et possibilité d’être coincé contre un quai.

**Nuit.** Une lampe posée éclaire l’allée utile, avec occlusion par les murs ; l’éclairage de plafond exige une source.

**Variantes.** Petite messagerie ; entrepôt régional ; garde-meubles ; grande halle.

**Raccords de systèmes.** Inventaire, coffre, prise de risque et délivrance de modules de service.

**Vérification.** Contrôler entrée–rayon–conteneur–sortie et le même ID après éviction du cache.

**Présence / source.** src/frontier-geometry.js ; src/frontier-places.js ; src/settlement-plans.js

## Atelier et artisanat — `atelier`

**Statut : pilote.**

**Intention.** Un atelier rassemble postes de travail, pièces et rangement autour d’un accès réel de livraison.

**Composition.** Accueil éventuel, banc, machine, réserve, vestiaire et porte de service ; garder le centre praticable.

**Accès et traversée.** Accéder à la face utile du banc sans traverser la machine ; rendre lisible une porte trop petite pour le véhicule.

**Ressources.** Ferraille, bois et pièces ; les kits de service dépendent d’une récupération et d’une recette réellement débloquée.

**Risques et limites.** Angles morts derrière machines et couloirs encombrés ; un outil dessiné n’est pas une nouvelle capacité automatique.

**Nuit.** Lampe de banc et portable posé ; éviter l’éclairage diffus d’un lieu déconnecté.

**Variantes.** Menuiserie ; garage ; petit atelier ; recyclerie.

**Raccords de systèmes.** Réparation, services essentiels, construction et collecte spécialisée.

**Vérification.** Comparer zones d’usage, ressources et conditions des interactions.

**Présence / source.** src/frontier-specialists.js ; src/essential-content.js

## Production et distribution électrique — `energie`

**Statut : pilote.**

**Intention.** La lumière et la production dépendent d’une chaîne d’énergie, avec des priorités et une consommation lisibles.

**Composition.** Placer groupe, accès maintenance, combustible et distribution ; séparer bâtiment de décor et générateur construit.

**Accès et traversée.** Accès technique depuis une voie de service ; laisser un passage jusqu’au coffret et à la réserve.

**Ressources.** Carburant et pièces en contenants ; les bâtiments de cité consomment selon core.js.

**Risques et limites.** Pénurie et délestage ; le local groupe régional ne fournit pas à lui seul une alimentation gratuite à tout le monde.

**Nuit.** Lier les appareils fixes à l’état du réseau ou à une batterie explicitement définie.

**Variantes.** Local groupe ; centrale de quartier future ; poste de distribution ; groupe mobile.

**Raccords de systèmes.** Carburant, défense prioritaire, industrie et visibilité nocturne.

**Vérification.** Couper et rétablir la source ; vérifier lumière, production et état sauvegardé.

**Présence / source.** src/power-grid.js ; src/frontier-specialists.js ; src/urban.js

## Pompage et services techniques — `eau-services`

**Statut : pilote.**

**Intention.** Les infrastructures de service rendent un territoire crédible, même lorsqu’elles ne créent pas une nouvelle jauge.

**Composition.** Local technique, pompes, accès entretien et stockage ; séparer eau visuelle et zone praticable.

**Accès et traversée.** Desserte raccordée ; coffrets et contenants accessibles sans franchir un bassin.

**Ressources.** Pièces et outillage dans réserve ; ne pas annoncer eau potable ou production de nourriture sans système.

**Risques et limites.** Clôtures et machines limitent le déplacement ; contamination et pression sont des extensions futures.

**Nuit.** Lampe de maintenance à proximité du travail ; une balise suffit à annoncer une issue.

**Variantes.** Station de pompage ; réservoir futur ; traitement futur ; poste technique.

**Raccords de systèmes.** Énergie, maintenance, récupération et accès de service.

**Vérification.** Vérifier que chaque action affichée possède une contrepartie réelle et un état observable.

**Présence / source.** src/settlement-plans.js : waterStation

## Gare et fret — `gare-fret`

**Statut : pilote.**

**Intention.** La halle de fret existe ; un réseau ferroviaire complet nécessite voies, quais et franchissements cohérents.

**Composition.** Halle, quai, stockage, bureau et voie de service. Réserver les futurs rails avant les parcelles voisines.

**Accès et traversée.** Passages piétons aux endroits annoncés et accès camion sans traverser un bâtiment.

**Ressources.** Caisses, outils et palettes dans les zones de réception ; wagons seulement comme contenants si implémentés.

**Risques et limites.** Couloirs de quai et grandes zones ouvertes ; trains mobiles et voyage ferroviaire ne sont pas actifs.

**Nuit.** Balises de quai et lampes de halle ; signaux lumineux seulement s’ils expriment un état réel.

**Variantes.** Petite gare ; triage futur ; halle de fret ; terminus urbain futur.

**Raccords de systèmes.** Logistique, réseau routier, traversées et récupération lourde.

**Vérification.** Contrôler les accès au quai et interdire les promesses de déplacement par train absent.

**Présence / source.** src/frontier-specialists.js : freight

## Station-service et aire routière — `station-service`

**Statut : jouable.**

**Intention.** Un arrêt combine carburant, petite réserve et accès physique à la boutique.

**Composition.** Dalle, auvent, pompes, boutique et comptoir ; chaque station D-17 possède un emplacement réservé.

**Accès et traversée.** Entrée réelle dans les murs et contournement des pompes ; aucun stockage généré dans l’ouverture.

**Ressources.** D-17 : trois nœuds persistants de carburant, nourriture et médicaments ; la région utilise ses propres contenants.

**Risques et limites.** Boutique étroite et exposition autour des pompes ; la station ne remplit pas automatiquement le réservoir du véhicule.

**Nuit.** La source doit correspondre à un dispositif ou état d’alimentation. Un auvent dessiné n’allume pas toute la station.

**Variantes.** Mini-market ; garage-service ; station rurale ; aire-service.

**Raccords de systèmes.** Collecte, capacité du sac, conduite, plan routier et éclairage de secours.

**Vérification.** Entrer, récupérer, sortir, sauvegarder et confirmer les quantités réduites après reprise.

**Présence / source.** src/exploration-125.js ; src/frontier-geometry.js

## Soins et secours — `hopital-soins`

**Statut : pilote.**

**Intention.** Les espaces de soin séparent accueil, consultation, rangement et nettoyage ; aucun lieu ne promet un remède absent.

**Composition.** Accueil accessible, pièces de soin, réserve de médicaments et local de service. Conserver les circulations autour des lits.

**Accès et traversée.** Portes et couloirs continus ; une salle fermée ne fournit pas de soins au travers du mur.

**Ressources.** Médicaments et matériel propre dans meubles adaptés ; nourriture et outils dans espaces secondaires.

**Risques et limites.** Angles morts et charge précieuse ; un lit décoratif ne restaure pas gratuitement la santé.

**Nuit.** Éclairage de travail localisé et balisage de sortie ; distinguer dispositif portable et réseau de clinique.

**Variantes.** Dispensaire ; dentaire ; pharmacie ; vétérinaire ; centre médical.

**Raccords de systèmes.** Secouristes, médicaments, kits de soin et escorte du retour.

**Vérification.** Verifier quantités, proximité des soins et impossibilité de ressusciter les morts.

**Présence / source.** src/frontier-places.js ; src/frontier-specialists.js ; src/frontier-care.js

## École, mairie et bâtiments civiques — `ecole-civique`

**Statut : pilote.**

**Intention.** Un bâtiment civique raconte son usage par ses pièces et peut héberger des traces, sans transformer celles-ci en PNJ présents.

**Composition.** Accueil, salles, bureaux, rangement et accès de service ; garder une séparation claire des étages.

**Accès et traversée.** Couloir principal relié aux issues, escalier atteignable et portes non recouvertes par le mobilier.

**Ressources.** Bois, réserves de service, documents et quelques soins selon usage réel.

**Risques et limites.** Longs couloirs et pièces sans autre issue ; le récit ne doit pas créditer une ressource à distance.

**Nuit.** Balisage de sortie et lampe d’entretien ; les tableaux lumineux doivent avoir une alimentation.

**Variantes.** École ; mairie ; bibliothèque ; bureau postal ; chapelle.

**Raccords de systèmes.** Narration, collecte, services essentiels et niveaux.

**Vérification.** Contrôler la cohérence pièce–meuble–ressource et le retour depuis chaque étage.

**Présence / source.** src/frontier-geometry.js ; src/frontier-places.js

## Chantier et travaux routiers — `chantier`

**Statut : plan.**

**Intention.** Un chantier montre une intervention interrompue, avec limites, accès et matériaux affectés.

**Composition.** Zone de travail, stockage, engins immobilisés et circulation temporaire ; les barrières indiquent la déviation.

**Accès et traversée.** Une déviation rejoint la route en aval. Les piétons conservent un passage distinct si la voie est fermée.

**Ressources.** Matériaux de chantier dans palettes et coffres ; machine décorative non pilotable.

**Risques et limites.** Goulot et visibilité réduite par les équipements ; aucune fosse invisible sous une simple texture.

**Nuit.** Balises ponctuelles aux extrémités, lampe de travail sur la tâche et zones éteintes si la batterie est vide.

**Variantes.** Réparation routière ; bâtiment inachevé ; démolition ; installation de réseau.

**Raccords de systèmes.** Routes, obstacles, récupération et signalisation lumineuse.

**Vérification.** Tester la continuité de la déviation à pied et selon la largeur du véhicule.

**Présence / source.** Conception territoriale ; micro-événements routiers déjà présents dans D-17.

