# Modules nature — Codex territorial 1.26

Source structurée : `src/world-codex-nature.js`. Les statuts indiquent la portée réelle : jouable, plan pilote partiel, ou conception. Ces fiches ne peuplent pas automatiquement le monde.

## Petit bois et lisière — `bois-lisiere`

**Statut : pilote.**

**Intention.** Un couvert boisé proche des routes sert à récolter et à contourner un groupe, sans être une zone sûre.

**Composition.** Grouper les troncs en îlots séparés de clairières ; raccorder une lisière ouverte à la desserte, puis un cœur plus dense.

**Accès et traversée.** Réserver un passage piéton entre troncs et rochers. Une trouée doit mener à une issue identifiable, jamais à une collision masquée par la canopée.

**Ressources.** Bois dans les arbres ; pierre dans les rochers. Un abri forestier peut contenir des réserves finies, pas des munitions dans chaque arbre.

**Risques et limites.** La canopée masque les silhouettes et le détour allonge le retour au dépôt. Le terrain forestier régional ralentit la marche.

**Nuit.** Baliser seulement un chemin ou un abri occupé. Le reste reste sombre ; le feu révèle une petite zone, pas tout le bois.

**Variantes.** Bosquet routier ; bois de ferme ; coupe récente ; lisière derrière un lotissement.

**Raccords de systèmes.** Collecte, mobilité, contournement, accès au véhicule resté sur la route.

**Vérification.** Vérifier un trajet entrée–ressource–sortie et le même masque de collision pour les contacts proches.

**Présence / source.** src/frontier-world.js ; src/world-evolution.js

## Forêt immense — `foret-profonde`

**Statut : plan.**

**Intention.** Un massif doit se reconnaître par ses vallons, trouées et dessertes ; sa taille ne se résume pas à davantage de troncs.

**Composition.** Composer lisière, futaie, sous-bois, coupe, clairière et service forestier en grands ensembles. Garder une route de débardage et plusieurs embranchements.

**Accès et traversée.** Chaque secteur possède un retour lisible vers un axe. Les sentiers restent piétons tant que leur largeur ne permet pas réellement les véhicules.

**Ressources.** Le bois domine ; outils et carburant proviennent des dépôts de chantier. Nourriture seulement dans cabanes, véhicules ou installations identifiables.

**Risques et limites.** Long trajet, repères répétitifs et ligne de vue courte ; les clairières attirantes doivent conserver une sortie de secours.

**Nuit.** Des lampes autonomes ponctuelles peuvent marquer un poste. Ni arbres lumineux ni lampadaires alignés sans réseau ou ancienne activité.

**Variantes.** Forêt exploitée ; massif abandonné ; pinède ; feuillus ; forêt reconquise autour d’un motel.

**Raccords de systèmes.** Logistique du coffre, réserves de lumière, orientation et pauses de collecte.

**Vérification.** Tester les coutures entre parcelles et le budget de végétation visible, sans tirer un nouveau loot à chaque chargement.

**Présence / source.** Conception ; les arbres régionaux actuels ne forment pas encore ce système de massif.

## Clairière et coupe forestière — `clairiere`

**Statut : plan.**

**Intention.** Une ouverture naturelle ou exploitée offre de la visibilité contre l’exposition aux contacts venant des lisières.

**Composition.** Distinguer souches, grumes rangées, piste de service et bord de sous-bois. L’aire de travail laisse une manœuvre pour le porteur.

**Accès et traversée.** Deux lisières rejoignables à pied et une piste carrossable clairement terminée ou raccordée.

**Ressources.** Bois dans les grumes, ferraille dans les équipements abandonnés ; aucun réapprovisionnement lié à une sortie de caméra.

**Risques et limites.** Grande visibilité mais couverture rare. Les tas de grumes ne doivent pas créer un labyrinthe étanche.

**Nuit.** Un feu de chantier se place sur le sol dégagé ; le balisage vise la piste et le stockage.

**Variantes.** Coupe active avant effondrement ; petite clairière de chasse ; aire de débardage.

**Raccords de systèmes.** Récupération lourde, accès camion, éclairage posé et approche de horde.

**Vérification.** Contrôler rayons de braquage, accès aux deux faces des tas et origine des contenants.

**Présence / source.** Conception ; réutilise les grumes et ateliers de scierie.

## Montagne et col — `montagne`

**Statut : plan.**

**Intention.** Le relief doit dicter routes et passages, avec des transitions visibles entre fond de vallée, versant et col.

**Composition.** Composer vallée, route en lacets, replat, col et rochers. Définir d’abord les niveaux de traversée ; ne pas simuler une falaise avec une simple ombre.

**Accès et traversée.** La route transporte les véhicules ; les chemins secondaires restent piétons. Les impasses et barrières de relief sont annoncées à distance.

**Ressources.** Pierre dans les zones rocheuses accessibles ; ressources manufacturées dans refuge, entretien routier ou véhicule abandonné.

**Risques et limites.** Couloirs étroits, visibilité réduite au virage et longs retours. Chutes, froid et altitude sont des systèmes futurs, sans dégâts inventés ici.

**Nuit.** Baliser les refuges et virages de service. Une lumière en contrebas n’indique pas un passage accessible depuis le versant.

**Variantes.** Col routier ; gorge ; plateau ; versant forestier ; ancienne route coupée.

**Raccords de systèmes.** Navigation verticale future, autonomie, rayon de véhicule et points de repli.

**Vérification.** Prouver les chemins entre niveaux et ne jamais autoriser un déplacement direct à travers une paroi.

**Présence / source.** Conception ; le monde actuel reste un terrain essentiellement plan.

## Prairie et friche ouverte — `prairie`

**Statut : pilote.**

**Intention.** Les respirations entre villes donnent une place aux déplacements et aux rencontres lisibles.

**Composition.** Alterner terrain ouvert, quelques arbres, rochers et accotements. Les bâtiments isolés conservent un chemin de service.

**Accès et traversée.** La route demeure l’axe rapide ; les approches hors route restent traversables avec leur surface annoncée.

**Ressources.** Peu de réserves hors objets réels. Ne pas transformer l’herbe en nourriture automatique.

**Risques et limites.** Exposition aux groupes en migration ; éloignement des stocks et absence de couvert.

**Nuit.** Une source portée éclaire le trajet proche. Les lumières éloignées doivent correspondre à un lieu, une annexe ou un dispositif actif.

**Variantes.** Jachère ; terrain vague ; prairie boisée ; friche périurbaine.

**Raccords de systèmes.** Vitesse de surface, ligne de vue, carburant et exploration régionale.

**Vérification.** Veiller à ce que les marqueurs lointains ne prétendent pas révéler des contenants non découverts.

**Présence / source.** src/frontier-world.js ; src/world-evolution.js

## Marais et terrain inondable — `marais`

**Statut : plan.**

**Intention.** L’eau peu profonde, les sols mous et les berges exigent un réseau de passages explicitement praticables.

**Composition.** Séparer eau, îlots secs, digue, ponton et chaussée. Les transitions portent une texture nette, avec une limite de collision cohérente.

**Accès et traversée.** Prévoir une chaussée continue et des traversées piétonnes contrôlées. N’ajouter un gué que s’il est simulé.

**Ressources.** Réserves dans abri de pompage, cabane et matériel échoué ; pas de pêche ou d’eau potable gratuite sans système.

**Risques et limites.** Choix de trajets limité, visibilité au ras des roseaux. Noyade et enlisement ne sont pas des mécaniques existantes.

**Nuit.** Balises sur les pontons et la station ; aucune lueur surnaturelle dispersée dans la vase.

**Variantes.** Marais rural ; bassin de rétention ; plaine inondée ; roselière.

**Raccords de systèmes.** Ponts, niveaux d’eau futurs, mobilité lente et retour au véhicule.

**Vérification.** Contrôler les bords, les diagonales et la continuité des passages étroits avec toutes les tailles d’acteur.

**Présence / source.** Conception ; la boue actuelle est seulement une surface de mobilité.

## Rivière, berges et gué — `riviere`

**Statut : plan.**

**Intention.** Une rivière organise les villes et les franchissements au lieu de couper arbitrairement la carte.

**Composition.** Dessiner courant, berges, plaines de rive et ouvrages avant les parcelles. Les accès au quai suivent la pente et les usages.

**Accès et traversée.** Au moins un pont pour chaque liaison routière annoncée. Les culées ne ferment pas le chemin longeant la rive sans signal visible.

**Ressources.** Récupération près d’un ancien usage : atelier de berge, embarcadère, route ou station.

**Risques et limites.** Points de passage concentrés et retour potentiellement long. Aucune nage ne doit être sous-entendue si elle n’est pas développée.

**Nuit.** Baliser ouvrage et rive praticable, sans éclairer uniformément l’eau. Une lampe posée respecte le côté du mur ou du quai.

**Variantes.** Rivière étroite ; canal urbain ; berge industrielle ; confluent.

**Raccords de systèmes.** Ponts, logistique entre quartiers et lisibilité cartographique.

**Vérification.** Confronter eau visible, masque de collision, carte et trajectoires IA sur chaque franchissement.

**Présence / source.** Conception ; aucun réseau hydrographique annoncé comme livré.

## Plage et dune — `plage`

**Statut : plan.**

**Intention.** Le littoral associe espace ouvert, arrière-plage et accès de service ; il ne s’arrête pas à une bande de sable.

**Composition.** Composer eau, estran, dune, promenade et arrière-pays. Préserver la silhouette de la côte et les vues entre accès.

**Accès et traversée.** Les passerelles rejoignent route ou promenade ; un accès véhicule doit être assez large et relié au stationnement.

**Ressources.** Objets récupérables dans kiosque, poste de secours, local de plage ou bagages ; le sable reste un terrain.

**Risques et limites.** Peu de couvert et retrait forcé vers les accès. Marée, baignade et bateaux ne sont pas encore simulés.

**Nuit.** Poste de secours et promenade peuvent porter un éclairage explicable ; la dune reste sombre.

**Variantes.** Plage urbaine ; crique ; plage industrielle ; dune sauvage.

**Raccords de systèmes.** Orientation côtière, surface lente future, extraction des ressources et lisibilité du bord du monde.

**Vérification.** Tester la fermeture de la mer, les accès piétons et le retour par la même couture sans téléportation.

**Présence / source.** Conception de littoral.

## Côte rocheuse et falaise — `falaises`

**Statut : plan.**

**Intention.** La falaise impose des niveaux et des accès rares ; le décor doit annoncer les limites avant le contact.

**Composition.** Associer plateau, escarpement, chemin côtier, escalier et petite anse seulement si ces niveaux sont reliés.

**Accès et traversée.** Un escalier matérialise le changement de niveau. Ne pas aligner deux lieux en carte si aucun parcours réel ne les relie.

**Ressources.** Matériel de balisage, abri de maintenance et éventuel dépôt de pêche, chacun avec un contenant défini.

**Risques et limites.** Retour limité et angles morts sur le sentier. Le danger de chute demeure une proposition tant qu’il n’a pas de système.

**Nuit.** Une balise de hauteur sert d’orientation ; elle ne doit pas dévoiler ni éclairer le chemin derrière la roche.

**Variantes.** Cap ; corniche ; crique sous route ; ancien poste côtier.

**Raccords de systèmes.** Géométrie verticale, phares futurs et réseau de sentiers.

**Vérification.** Verrouiller collisions par niveau et vérifier le tri de profondeur aux escaliers.

**Présence / source.** Conception ; relief côtier absent du générateur actuel.

## Lac et base de loisirs — `lac`

**Statut : plan.**

**Intention.** Le rivage comporte des usages différents et des traversées longues ; il ne distribue pas un coffre à intervalle régulier.

**Composition.** Séparer rive naturelle, plage, local nautique, pontons et camping éventuel. Garder une promenade lisible.

**Accès et traversée.** Chaque jetée a une entrée et une issue ; l’accès terrestre reste le moyen de traversée tant que les bateaux ne sont pas jouables.

**Ressources.** Réserves dans atelier, buvette, poste de secours et véhicules ; la faune est une extension indépendante.

**Risques et limites.** Culs-de-sac des jetées et grande distance de contournement. Pas de raccourci direct sur l’eau.

**Nuit.** Balises rares au club et au ponton ; un chem-light marque un retour local sans illuminer la rive opposée.

**Variantes.** Lac rural ; gravière inondée ; retenue ; parc nautique.

**Raccords de systèmes.** Loisirs, campement, éclairage posé et carte des accès.

**Vérification.** Faire correspondre limite de l’eau, route de rive et parcours des compagnons.

**Présence / source.** Conception.

## Territoire enneigé — `neige`

**Statut : plan.**

**Intention.** La neige change la lecture du terrain ; elle ne doit pas effacer les portes, routes et objets nécessaires.

**Composition.** Définir zones déneigées, congères, abris et délaissés. Les toitures gardent leur pied de collision lisible.

**Accès et traversée.** Un chemin de service doit rester identifié. Les congères bloquantes exigent un volume réel et une alternative.

**Ressources.** Bois sec sous abri ; ravitaillement dans bâtiments et véhicules ; chauffage seulement si une économie dédiée est ajoutée.

**Risques et limites.** Faible contraste et longues silhouettes. Froid, gel du moteur et traces persistantes sont des propositions.

**Nuit.** Limiter l’éblouissement ; les halos conservent les silhouettes sur fond clair. Un feu peut devenir un repère visible.

**Variantes.** Hameau hivernal ; route déneigée ; forêt neigeuse ; carrière gelée.

**Raccords de systèmes.** Palette, climat futur, combustibles et signalisation.

**Vérification.** Comparer contraste jour/nuit et ne pas ajouter de pénalité climatique sans retour dans le HUD.

**Présence / source.** Conception ; la météo actuelle ne simule pas la neige.

## Plateau sec et terrain aride — `terre-aride`

**Statut : plan.**

**Intention.** Un terrain sec conserve des causes à ses implantations : accès, eau ancienne, transport et extraction.

**Composition.** Composer relief bas, piste, broussailles clairsemées, hameau et installation de service. Éviter le semis de props sans histoire.

**Accès et traversée.** Pistes raccordées et zones de demi-tour visibles ; les ravines restent franchissables uniquement aux passages prévus.

**Ressources.** Ferraille et carburant dans ateliers ; pierre en extraction ; nourriture rare et liée à des réserves anciennes.

**Risques et limites.** Exposition et grandes distances. Soif et chaleur ne sont pas des statistiques déjà actives.

**Nuit.** Petits foyers et éclairages de dépôt ; aucune ville éclairée sans source identifiée.

**Variantes.** Plateau pierreux ; friche sèche ; piste d’extraction ; plaine semi-aride.

**Raccords de systèmes.** Autonomie de véhicule, points de repos et économie de récupération.

**Vérification.** Contrôler l’échelle des vides pour éviter des trajets longs dépourvus de décision.

**Présence / source.** Conception.

## Ferme, verger et pâtures — `ferme`

**Statut : pilote.**

**Intention.** Les bâtiments agricoles doivent former une exploitation avec cour, accès et réserves, pas une maison perdue dans les champs.

**Composition.** Rassembler logement, stockage, atelier et aire de livraison autour d’une cour. Les surfaces cultivées restent distinctes des productions de la cité.

**Accès et traversée.** Chemin agricole raccordé à la route ; seuils assez larges pour le matériel prévu ; portillon piéton séparé si nécessaire.

**Ressources.** Bois et nourriture dans contenants de travail ; carburant en réserve technique. Une plantation décorative ne produit pas automatiquement.

**Risques et limites.** Cour exposée et dépendances avec angles morts ; la distance au dépôt rend le chargement important.

**Nuit.** Lampe près de l’atelier ou du portail. Les champs n’ont pas besoin de lampadaires réguliers.

**Variantes.** Corps de ferme ; maraîchage ; verger ; hangar isolé.

**Raccords de systèmes.** Collecte régionale, dépôt, stockage et futurs champs productifs distincts.

**Vérification.** Verifier l’accès à chaque réserve et ne pas confondre contenu fini avec ferme construite productive.

**Présence / source.** src/settlement-plans.js ; src/frontier-places.js

## Ruine envahie et reprise végétale — `ruines-vegetales`

**Statut : pilote.**

**Intention.** La végétation doit montrer l’abandon sans condamner les passages que la façade annonce ouverts.

**Composition.** Conserver empreinte, pan de mur, ouverture et cour. Les arbustes occupent les marges et fissures, avec densité différente à l’intérieur.

**Accès et traversée.** Une brèche visible fournit un passage réel ; un mur visuellement intact ne devient pas franchissable seulement parce que le lieu est ruiné.

**Ressources.** Réserves réduites dans meubles survivants ; débris et matériaux avec identité stable après fouille.

**Risques et limites.** Angles morts et faible lisibilité des seuils. La ruine ne doit pas ressusciter lors du rechargement du chunk.

**Nuit.** Un halo intérieur ne traverse pas les murs encore présents ; l’obscurité garde lisible la sortie.

**Variantes.** Maison effondrée ; motel reconquis ; atelier brûlé ; jardin abandonné.

**Raccords de systèmes.** Destruction, collision, loot persistant et ordre de profondeur.

**Vérification.** Comparer état dessiné et état solide avant/après récupération ou destruction.

**Présence / source.** src/frontier-geometry.js ; src/world-evolution.js

