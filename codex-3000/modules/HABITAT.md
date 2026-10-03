# Modules habitat — Codex territorial 1.26

Source structurée : `src/world-codex-habitat.js`. Les statuts indiquent la portée réelle : jouable, plan pilote partiel, ou conception. Ces fiches ne peuplent pas automatiquement le monde.

## Hameau — `hameau`

**Statut : pilote.**

**Intention.** Quelques logements partagent une desserte et un service local ; cette petite échelle doit se lire sans texte.

**Composition.** Courte rue ou carrefour, maisons espacées, atelier et épicerie. Les annexes occupent le fond de parcelle.

**Accès et traversée.** Une voie principale raccordée et une échappée piétonne ; les clôtures annoncent leurs portillons.

**Ressources.** Réserves domestiques dans les logements, outils à l’atelier, nourriture au commerce.

**Risques et limites.** Peu d’itinéraires alternatifs et retour rapide des contacts dans l’axe de rue.

**Nuit.** Éclairage ponctuel des seuils occupés et de l’atelier ; grands intervalles sombres cohérents.

**Variantes.** Rue unique ; carrefour rural ; hameau forestier ; groupe de fermes.

**Raccords de systèmes.** Collecte courte, voisinage, stationnement et migration des hordes.

**Vérification.** Vérifier façade–rue–cour et taille réelle des passages autour des bâtiments.

**Présence / source.** src/region-settlements.js ; src/exploration-125.js

## Village et bourg — `village`

**Statut : pilote.**

**Intention.** Le village s’organise autour de services et d’une place, avec une transition progressive vers la campagne.

**Composition.** Centre compact, mairie ou salle commune, commerces, école et rues résidentielles ; ateliers en bordure accessible.

**Accès et traversée.** Une traversée principale et des boucles secondaires évitent que toute circulation passe par une seule cour.

**Ressources.** Répartition selon fonctions : soins au dispensaire, nourriture aux commerces, matériaux aux ateliers.

**Risques et limites.** Rues étroites et carrefours fréquentés ; ne pas répartir tous les services sur le même côté sans accès arrière.

**Nuit.** Points lumineux au centre et aux entrées de service ; chaque réseau actif a une raison.

**Variantes.** Village-rue ; bourg de carrefour ; village d’extraction ; petite commune agricole.

**Raccords de systèmes.** Orientation, lieux visitables, logistique et repli vers D-17.

**Vérification.** Confirmer les services essentiels présents et atteignables ; les objectifs de densité ne garantissent pas chaque parcelle.

**Présence / source.** src/region-settlements.js

## Ville moyenne — `ville`

**Statut : pilote.**

**Intention.** Une ville combine centre, habitat et activité avec une hiérarchie de voies lisible.

**Composition.** Artère, collectrices, rues locales puis parcelles. Grouper les commerces et équipements publics, laisser de l’espace aux livraisons.

**Accès et traversée.** Des voies de contournement et accès arrière évitent que les grands bâtiments coupent un quartier entier.

**Ressources.** Programmes complémentaires : logements, commerces, soins, ateliers, entrepôts et bureaux.

**Risques et limites.** Plus d’angles morts et de fronts ; les hordes exploitent les axes sans bonus de santé lié au quartier.

**Nuit.** Éclairage discontinu par bâtiment et réseau alimenté ; rues éteintes entre poches actives.

**Variantes.** Ville de carrefour ; ville de vallée ; cité industrielle ; ville résidentielle.

**Raccords de systèmes.** Découverte, coffre de véhicule, menaces, services et annexe de cité.

**Vérification.** Mesurer chevauchements, connectivité et temps de retour ; garder des espaces de combat ouverts.

**Présence / source.** src/region-settlements.js ; src/region-roadkit.js

## Grande ville et métropole — `metropole`

**Statut : pilote.**

**Intention.** La grande ville présente actuellement un tissu plus dense ; la métropole multi-quartiers complète reste un programme de conception.

**Composition.** Assembler plusieurs centres secondaires, habitats variés, pôles d’activité et artères. Distinguer parcelle, îlot et district.

**Accès et traversée.** Réseau de boucles ; passages sous ou entre bâtiments seulement s’ils existent dans la géométrie. Les grands axes gardent une largeur visible.

**Ressources.** Fort potentiel réparti par usage ; aucun multiplicateur gratuit de butin sur chaque meuble parce que la ville est grande.

**Risques et limites.** Trajets longs, densité et fronts multiples. La densité visuelle doit respecter le budget d’objets.

**Nuit.** Quartiers aux états lumineux distincts ; le skyline ne prouve ni réseau vivant ni population alliée.

**Variantes.** Grand centre ; métropole polycentrique ; agglomération étalée ; ensemble reconquis.

**Raccords de systèmes.** Chargement par secteurs, reconnaissance, transport et échelle des hordes.

**Vérification.** Tester les coutures d’îlots, plafonds de rendu et parcours périphérie–centre–retour.

**Présence / source.** src/region-settlements.js : grande-ville ; métropole complète en conception.

## Quartier pavillonnaire — `quartier-pavillonnaire`

**Statut : pilote.**

**Intention.** Chaque maison possède une adresse spatiale : façade, accès, cour et limites parcellaires.

**Composition.** Aligner façades sur la desserte, varier retraits et gabarits, placer cabanon et réserves derrière la maison.

**Accès et traversée.** Portillon réellement ouvert ; allée de garage distincte ; éviter les rangées de clôtures sans passage latéral.

**Ressources.** Nourriture domestique, petit outillage, bois et meubles ; pas de dépôts militaires dans chaque logement.

**Risques et limites.** Cour fermée, sortie unique et vue coupée par les maisons. Une maison solide extérieure n’est pas annoncée visitable.

**Nuit.** Lumières de seuil ou portables justifiées ; fenêtres sombres par défaut si aucun occupant ou réseau actif.

**Variantes.** Pavillon ; maison double ; maison avec sous-sol ; lotissement à impasses.

**Raccords de systèmes.** Fouille, postures, portillons, profondeur et itinéraires courts.

**Vérification.** Distinguer maison visitable régionale et silhouette solide de D-17 dans les indications.

**Présence / source.** src/exploration-125.js ; src/settlement-plans.js

## Quartier collectif — `quartier-collectif`

**Statut : pilote.**

**Intention.** Les bâtiments collectifs partagent halls et circulations ; multiplier les étages ne suffit pas à créer un quartier.

**Composition.** Halls donnant sur rue ou cour, cages d’escalier, appartements et locaux techniques. Les barres laissent des traversées extérieures.

**Accès et traversée.** Escaliers reliés aux niveaux autorisés ; portes accessibles depuis un vrai palier, jamais directement depuis le toit.

**Ressources.** Réserves domestiques par pièce et maintenance en local technique ; tous les étages ne dupliquent pas le même coffre.

**Risques et limites.** Cul-de-sac d’étage et nombreux angles morts ; l’ennemi doit respecter étage et murs.

**Nuit.** Balises de palier et lampe portée ; aucune lueur copiée d’un étage à un autre.

**Variantes.** Petit collectif ; barre ; résidence ; cour partagée.

**Raccords de systèmes.** Niveaux, découverte, soins, sortie et charge de récupération.

**Vérification.** Verifier entrée–escalier–pièce–retour pour chaque niveau, et absence de loot à travers le plancher.

**Présence / source.** src/frontier-geometry.js ; src/settlement-plans.js

## Centre ancien — `centre-historique`

**Statut : plan.**

**Intention.** Un tissu ancien se lit par rues irrégulières, façades mitoyennes et cours ; il reste navigable et prévisible.

**Composition.** Composer îlots fermés avec percées prévues, place et arrière-cours. Les murs communs ne doivent pas doubler les collisions.

**Accès et traversée.** Ruelles piétonnes différenciées des voies carrossables ; au moins une liaison de service aux commerces.

**Ressources.** Réserves dans boutiques, ateliers, logements et bâtiments civiques, selon leur dernier usage.

**Risques et limites.** Visibilité courte et embouteillages ; éviter les passages plus étroits que le rayon des acteurs.

**Nuit.** Poches d’éclairage près des usages encore actifs ; zones d’ombre derrière les façades.

**Variantes.** Bourg ancien ; quartier de marché ; centre reconquis ; îlot partiellement détruit.

**Raccords de systèmes.** Réseau irrégulier, profondeur et circulation des groupes.

**Vérification.** Valider la connexité piétonne séparément de la connexité véhicule.

**Présence / source.** Conception de composition ; les bâtiments individuels existent partiellement.

## Zone commerciale — `zone-commerciale`

**Statut : pilote.**

**Intention.** Les commerces s’organisent autour d’un accès public et d’un accès de livraison distincts.

**Composition.** Façades, parkings, traversées piétonnes et quais. Réserver la cour technique avant de placer les décors.

**Accès et traversée.** Entrée client lisible, sortie arrière et chemin de service ; conserver des accès entre véhicules garés.

**Ressources.** Ressources selon enseigne et contenant : alimentation en rayon, outillage en atelier, matériel dans réserves.

**Risques et limites.** Grand parking exposé et magasins aux angles morts. Une enseigne intacte ne promet pas un stock intact.

**Nuit.** Balises sur issues et quais actifs ; vitrines éteintes par défaut et groupe électrogène identifiable si allumées.

**Variantes.** Rue marchande ; centre commercial ; grande surface ; parc d’activités mixte.

**Raccords de systèmes.** Fouille, coffre, mobilité à pied et dispositifs portables.

**Vérification.** Tester les portes, rayons et accès aux réserves sans passer à travers le comptoir.

**Présence / source.** src/frontier-geometry.js ; src/settlement-plans.js

## Zone de loisirs — `zone-loisirs`

**Statut : pilote.**

**Intention.** Gymnase et lieux collectifs existent ; leur assemblage en grand quartier de loisirs constitue une extension de composition.

**Composition.** Bâtiment d’accueil, activité, vestiaires, stockage et espace extérieur. Conserver les usages pour expliquer le mobilier.

**Accès et traversée.** Accès public et service, issue large des salles, circuit de retour court depuis les vestiaires.

**Ressources.** Bois, ferraille, trousses et réserves alimentaires lorsqu’une buvette existe ; pas de récompense pour un équipement décoratif.

**Risques et limites.** Grands volumes visibles mais couloirs latéraux encombrés ; les salles vides restent utiles pour se déplacer.

**Nuit.** Balises de sortie et lumière d’entretien localisée ; éclairage de spectacle uniquement si un système alimenté le justifie.

**Variantes.** Gymnase ; stade de quartier ; parc municipal ; complexe de loisirs futur.

**Raccords de systèmes.** Occupation du bâtiment, réfugiés futurs, ressources de service et orientation.

**Vérification.** Verifier que le terrain central reste libre et que les sorties latérales ne sont pas couvertes par les gradins.

**Présence / source.** src/frontier-places.js : gym ; autres ensembles en conception.

## Camp de fortune — `camp-fortune`

**Statut : plan.**

**Intention.** Le camp traduit un arrêt improvisé : dormir, stocker, surveiller et repartir avec peu de moyens.

**Composition.** Petites tentes ou bâches autour d’un espace partagé, réserves à l’abri, feu à distance des matières combustibles.

**Accès et traversée.** Un chemin central et deux sorties à pied. Cordages et couvertures ne doivent pas devenir des murs invisibles.

**Ressources.** Peu de rations, bois sec, outils, médicaments ; chaque réserve appartient à un usage et reste finie.

**Risques et limites.** Protection faible, visibilité nocturne et rassemblement vulnérable. Aucun allié ou commerce automatique par le seul décor.

**Nuit.** Feu central modeste, lampes portatives et balises de sortie ; zones de couchage moins lumineuses.

**Variantes.** Bivouac ; camp routier ; camp forestier ; halte d’évacuation.

**Raccords de systèmes.** Lumière, repos futur, moral, récupération et route de fuite.

**Vérification.** Garantir des issues depuis chaque couchage et distinguer lieu abandonné d’un camp occupé.

**Présence / source.** Conception ; aucune faction nouvelle n’est activée par cette fiche.

## Grand camp allié — `camp-allie`

**Statut : plan.**

**Intention.** Un camp allié doit avoir une logistique et des responsabilités lisibles avant de proposer une aide au joueur.

**Composition.** Séparer accueil, contrôle, vie, soins, stockage, énergie et défense ; laisser un espace de circulation intérieure.

**Accès et traversée.** Portes publiques, service et repli clairement identifiées. Les autorisations futures doivent apparaître avant de bloquer le passage.

**Ressources.** Ressources réservées à des stocks réels ; commerce, dons et ravitaillement doivent consommer des quantités explicites.

**Risques et limites.** Pression des hordes sur les accès et dépendance au carburant ; pas de sécurité absolue par changement d’étiquette.

**Nuit.** Projecteurs aux portes, éclairage de soin et lampes de travail ; délestage lisible en cas de panne.

**Variantes.** Camp humanitaire ; base civile ; relais de convoi ; camp fortifié.

**Raccords de systèmes.** Population, alimentation, réseau, soins, permissions et défense.

**Vérification.** Tester arrivée, circulation, transactions et attaque avec états sauvegardés avant de déclarer les PNJ alliés jouables.

**Présence / source.** Conception ; la colonie D-17 reste le système allié actuellement simulé.

## Camp hostile — `camp-hostile`

**Statut : plan.**

**Intention.** Une occupation hostile crédible exige perception, avertissements et comportement ; une palette rouge ne suffit pas.

**Composition.** Postes de garde, stockage, vie et entretien autour d’une enceinte avec lignes de vue définies.

**Accès et traversée.** Entrée contrôlée, accès de service et voie de retrait ; aucune agression sans distance ou règle compréhensible.

**Ressources.** Les prises éventuelles proviennent de stocks et de contenants finis, sans récompense doublée au rechargement.

**Risques et limites.** La simulation actuelle porte sur les infectés ; combat humain, diplomatie et infiltration de faction sont futurs.

**Nuit.** Projecteurs orientés vers les accès et zones de travail ; les angles morts doivent correspondre à la géométrie.

**Variantes.** Barrage occupé ; dépôt retranché ; camp de pillards ; installation militarisée.

**Raccords de systèmes.** Factions futures, bruit, lignes de vue, réputation et siège.

**Vérification.** Exiger règles d’hostilité, neutralité, blessures, repli et sauvegarde avant tout label de camp ennemi jouable.

**Présence / source.** Conception ; aucune IA humaine hostile livrée ici.

## Centre d’évacuation abandonné — `camp-evacuation`

**Statut : plan.**

**Intention.** Un ancien point de rassemblement raconte une circulation interrompue, avec des traces d’attente et de tri.

**Composition.** Accueil, file d’attente, soins, repos, bagages et départ des bus. Les clôtures guident une foule sans créer une prison involontaire.

**Accès et traversée.** Parcours public vers l’embarquement, voie des secours et passage de repli.

**Ressources.** Médicaments au poste de soin, rations au ravitaillement et outils au service ; bagages partiellement vidés.

**Risques et limites.** Concentration plausible d’infectés et couloirs étroits ; raconter l’évacuation sans prétendre retrouver les disparus.

**Nuit.** Balisage de secours ponctuel et dispositifs épuisés ailleurs ; éviter la fête foraine lumineuse.

**Variantes.** Parking de gare ; gymnase ; école ; aire routière.

**Raccords de systèmes.** Narration environnementale, secours, hordes et éclairage d’urgence.

**Vérification.** Contrôler l’ordre des zones et la sortie de chaque file ou enclos.

**Présence / source.** Conception ; réutilise mobilier de soin, bus et bâtiments collectifs.

## Annexes de D-17 — `annexe-d17`

**Statut : jouable.**

**Intention.** Les annexes prolongent la cité régionale avec des constructions et des coûts propres.

**Composition.** Cinq emplacements accueillent des bâtiments dans des cases fixes. Les volumes occupés sont physiques et les effets dépendent de l’achèvement.

**Accès et traversée.** Approcher les ensembles par leur périphérie ; conserver les liaisons vers D-17 et la route.

**Ressources.** Logements, capacité de stockage et énergie selon le bâtiment achevé ; les coûts sont prélevés au lancement.

**Risques et limites.** Un chantier incomplet ne donne pas sa capacité. La perte et le repli ne doivent pas être masqués par des bonus décoratifs.

**Nuit.** Le guide renvoie aux sources actives : une annexe dessinée n’implique pas des lampes gratuites partout.

**Variantes.** Est ; ouest ; nord ; sud ; secteur extérieur.

**Raccords de systèmes.** Palier de cité, stocks, construction, métriques civiles et collision.

**Vérification.** Sauvegarder avant/après lancement et achèvement ; vérifier capacité et empreinte.

**Présence / source.** src/world-evolution.js ; src/world-evolution-state.js

