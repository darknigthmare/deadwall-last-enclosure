# DEADWALL — Codex Exploration / Level Design 1.25.2

## Intention générale

La génération 1.25.2 doit donner l'impression d'un territoire post-effondrement réellement structuré, et non d'une surface remplie de props. Chaque élément doit remplir au moins une fonction : orienter, ralentir, raconter, offrir du loot, créer un choix de trajectoire ou soutenir une silhouette de quartier. Les routes ne servent donc pas de simple décor, les maisons ne flottent pas seules, les clôtures possèdent de vraies ouvertures et un véhicule déjà fouillé reste lisible comme tel.

La couche est **cumulative** : elle reprend les corrections D-17, intersections, profondeur, véhicules, HUD/carte/inventaire et ajoute les demandes plus anciennes encore absentes (variantes de routes, villages/habitations, hordes sauvages, postures et surfaces).

## 1. Frontières D-17 : zéro porte invisible

- Nord, sud, est et ouest sont des coutures de secteur, jamais des murs invisibles.
- Chaque face doit pouvoir être franchie à n'importe quelle abscisse/ordonnée praticable ; une route peut guider sans devenir le seul passage.
- La génération G4 emprunte la région native de la 1.23 : la position latérale se projette au même endroit en coordonnées régionales. Le retour dans D-17 recherche une arrivée praticable proche si le point est obstrué.
- La caméra se recale immédiatement pour supprimer l'interpolation à travers toute la carte.
- Les campagnes historiques G3 conservent leur comportement et leur géométrie afin d'éviter de charger une sauvegarde au milieu d'un nouvel obstacle.

**QA :** cinq positions par face sont testées automatiquement, dont des positions sans route.

## 2. Réseau routier : hiérarchie avant remplissage

Le réseau G4 comporte huit axes : artères 4 voies, collectrices 2 voies et diagonales 3 voies. Les neuf intersections principales ne sont plus toutes le même carrefour en croix ; deux utilisent une lecture angulaire.

Règles :
1. 4 voies = axe structurant et fort contraste de marquage ;
2. 3 voies = diagonale/liaison, silhouette différente ;
3. 2 voies = desserte résidentielle ou secondaire ;
4. cœurs de carrefour dégagés : aucune épave n'occupe la zone de décision ;
5. marquages/lignes d'arrêt sont non bloquants ;
6. les props hauts sont repoussés hors des cônes de visibilité des carrefours ;
7. les scènes de route sont groupées par événement, jamais distribuées uniformément.

## 3. Micro-événements routiers

Familles authorées :
- **accident** : épave + débris + cônes/panneau ;
- **barrage** : barrières + plots + véhicule de contrôle ;
- **abandon** : véhicule + bagages + objets laissés ;
- **maintenance** : caisse/outillage/palette/signalétique ;
- **évacuation** : ambulance/bus + bagages/tarp/plots ;
- **travaux** : barrières + cônes + palettes/débris.

Chaque événement comporte plusieurs éléments liés. Une zone locale ne doit pas cumuler plus de trois familles dominantes : la densité ne remplace pas la lisibilité.

## 4. Stations-service visitables et utiles

Quatre stations utilisent un vrai footprint de POI et quatre archétypes distincts : **mini-market**, **garage-service**, **station rurale** et **aire-service**. Dimensions, largeur de porte, nombre de pompes et familles de mobilier varient. Les murs et gros meubles bloquent, mais jamais le vide de l'entrée.

Chaque station contient trois ressources persistantes (carburant, nourriture, médicaments). Ces nœuds ont des identifiants déterministes et passent par le système de récolte/sauvegarde existant. Une station n'est donc plus seulement « visitable » visuellement : elle constitue un objectif de récupération cohérent.

La construction du joueur réserve le footprint entier du POI, pas seulement ses murs, afin qu'une tourelle ou un rempart ne puisse pas condamner l'accès.

## 5. Backyards rattachés à de vraies maisons

Les huit arrière-cours possèdent chacune :
- une maison associée parmi plusieurs silhouettes ;
- une vraie ouverture de palissade de 58–80 unités ;
- des segments de clôture séparés autour de ce vide ;
- un petit mélange cohérent de shed, tonneaux, tas de bois, boîte aux lettres ou accessoires de cour.

La maison est solide, le portail est un vide réel. L'arrière-cour ne doit jamais flotter au milieu d'une route ni se confondre avec un simple rectangle fermé.

## 6. Hameaux, lotissements et diversité d'habitations

Trois ensembles habités donnent une logique territoriale à D-17 :
- **Hameau des Pins Gris** ;
- **Lotissement des Trois Citernes** ;
- **Bourg de la Rocade Sud**.

Ils regroupent 21 bâtiments avec silhouettes variées : petite maison, maison large, commerce, atelier, clinique et diner. Chaque rue locale possède aussi un connecteur réel vers la hiérarchie routière principale : aucun hameau ne reste posé comme une île sans accès. Les bâtiments sont réservés dans la collision et la construction ; leur composition reste à distance du cœur D-17 et ne chevauche pas les stations ni les voies.

Principe : un « village » n'est pas une collection de rectangles. Il faut une relation façade → desserte → arrière-cour/annexe → espace de circulation, tout en gardant des respirations pour les combats et la lecture des hordes.

## 7. Épaves et état de fouille lisible

Quatre familles de véhicules de décor/récupération sont explicitement traitées : ambulance, bus, camion utilitaire et citerne. Quand leur ressource tombe à zéro, le châssis ne disparaît plus : coffre/hayon ou accès arrière reste ouvert et le compartiment est visuellement vide.

Les épaves de route `car/van/pickup` restent des obstacles limités : elles ne doivent ni fermer un carrefour, ni bloquer l'entrée d'une station ou d'un backyard.

## 8. Profondeur : le pied de l'objet décide

Le rendu G4 regroupe bâtiments, gros décors, survivants, infectés et joueur dans une même file de profondeur, triée par la base visuelle de chaque élément. Cela corrige le personnage qui se retrouvait sous une couche alors qu'il marchait dehors.

Les sols de station/cour sont rendus avant cette file. Les effets, projectiles, repères et textes flottants restent après. Une maison, une palissade ou un gros véhicule peut donc masquer correctement la partie haute d'un acteur sans le placer entièrement « sous la carte ».

## 9. Navigation cohérente joueur / alliés / infectés

Tout obstacle G4 significatif est exposé :
- à `friendlyPositionClear` pour le joueur et les déplacements directs ;
- à `world.solidForFriendly` pour le pathfinding allié ;
- à `hostilePositionClear` pour les infectés ;
- à `world.movementCost` avec un coût élevé pour que le flow field des hordes évite ces volumes.

Le but est d'interdire la situation « décor visible et bloquant pour le joueur, mais IA essayant constamment de traverser dedans ». La 1.25.2 indexe spatialement les solides et marque toute cellule de navigation touchée par un obstacle, y compris les palissades minces. Le placement joueur utilise le vrai `BUILDINGS.size` (rotation comprise), ce qui corrige un défaut runtime de la première 1.25.1.

## 10. Minimap et carte routière dépliante

La minimap compacte montre les axes structurants, POI, constructions, contacts et joueur. La grande carte `M` est un plan de D-17 : fond papier, plis, hiérarchie de voies, stations, hameaux, sites, épaves et quatre sorties continues. En région, elle indique clairement qu'il s'agit du plan de la cité ; l'atlas régional natif conserve ses propres coordonnées.

Accès : touche `M`, clic/Entrée sur minimap, pause, menu principal et codex. La simulation est suspendue pendant la lecture puis revient à son état de pause précédent.

## 11. Inventaire façon Jigsaw, sans falsifier la simulation

La touche `I` ouvre équipement + sac. La grille reste 8×5 mais les ressources sont maintenant découpées en **piles physiques**, selon leurs limites de pile. Les formes peuvent être tournées lors du placement first-fit. Les quantités affichées sont exactement celles de `player.carry` ; aucun item fantôme n'est créé.

L'interface expose aussi : arme active, chargeurs, santé, posture, surface actuelle et capacité totale du sac. Un dépassement théorique de grille est signalé au lieu d'être silencieusement perdu.

## 12. Postures et surfaces

- `C` : debout ↔ accroupi ; multiplicateur posture ~0,68.
- `X` : debout ↔ allongé ; multiplicateur posture ~0,38.
- Le sprint est réservé à la posture debout.
- Asphalte : ~1,05 ; rue locale ~0,98 ; béton 1,00 ; cour ~0,90 ; terrain ~0,92 ; boue humide ~0,78.

La vitesse effective combine posture × surface. Le HUD indique posture, surface et pourcentage de mobilité. Le rendu du joueur est aussi comprimé verticalement en accroupi/allongé pour fournir un feedback immédiat.

## 13. Hordes sauvages progressives

Les nouvelles campagnes G4 peuvent générer de petits groupes hors des grandes vagues, autour des secteurs habités et à distance du joueur. Leur taille progresse avec la vague, reste limitée à des infectés déjà déverrouillés et respecte le plafond global de performance.

Elles ne sont pas injectées pendant l'assaut principal afin de préserver la lisibilité du rythme. Leur prochain déclenchement et le compteur de hordes sont sauvegardés.

## 14. Sauvegarde et compatibilité générationnelle

La 1.25.2 ajoute une petite extension `exploration125` validée/sanitisée qui conserve : génération, posture, prochain déclenchement sauvage et nombre de hordes. Le champ ancien `regionOffset` est accepté pour la compatibilité, mais les coordonnées jouables sont celles de `frontier` dans la sauvegarde native. Le marqueur `:g4` dans `runId` sert aussi de filet de compatibilité.

- sauvegarde ancienne sans marqueur : G3 historique ;
- nouvelle campagne 1.25.2 : G4 ;
- loot de station : quantités stockées dans le tableau de nœuds existant via IDs stables.

Ainsi le contenu moderne n'est pas injecté au milieu d'une ancienne base, mais une nouvelle campagne profite de tout le level design 1.25.2.

## 15. Matrice QA obligatoire

1. Franchir les quatre faces à cinq positions chacune, dont des points sans route.
2. Entrer/sortir des quatre stations ; contourner comptoir et pompes ; récupérer le loot ; sauvegarder/recharger.
3. Traverser les huit ouvertures de backyards sans clipper clôture/maison.
4. Contrôler maisons, hameaux et stations contre routes/POI sur plusieurs graines.
5. Fouiller ambulance, bus, camion et citerne ; vérifier la conservation du véhicule ouvert.
6. Passer devant/derrière maison, bâtiment, palissade, station et véhicule pour valider la profondeur.
7. Comparer trajet du joueur, d'un allié et d'un infecté autour des mêmes obstacles.
8. Vérifier 2/3/4 voies et diagonales sur carte + monde.
9. Ouvrir/fermer `M` et `I` depuis tous les points d'accès et confirmer la restauration correcte de la pause.
10. Vérifier les piles Jigsaw sur sac vide, mono-ressource, distribution réaliste maximale et mélange complet.
11. Tester `C` et `X` sur asphalte, terrain, cour et boue ; confirmer le multiplicateur affiché et réel.
12. Laisser progresser plusieurs vagues : horde sauvage hors assaut, taille progressive, aucun dépassement du plafond d'entités.
13. Charger une ancienne sauvegarde et confirmer qu'elle reste G3 sans nouveaux obstacles ; lancer une nouvelle partie et confirmer G4.
14. Exécuter `node --test tests/exploration-125.test.cjs` puis `npm run check` dans la copie complète.

## 16. QA automatisé fourni

Le pack initial contient **31 tests ciblés**, complétés ici par un test géométrique de station et huit tests d'intégration runtime. Les tests reproductibles comprennent notamment :
- **250 graines** pour les relations hameaux / stations / maisons + backyards / routes ;
- **200 graines** pour empêcher les épaves de condamner les accès de POI ;
- **1 000 générations** en fuzz global (routes, diagonales, hameaux, stations, backyards, épaves) ;
- **20 000 compositions de sac** déterministes dans la capacité normale ;
- **300 graines / 3 600 loots** pour prouver un chemin entrée → ressource à l’intérieur des stations ;
- test direct du wrapper runtime de construction utilisant `BUILDINGS.size`, rotations comprises ;
- comparaison index spatial ↔ brute-force sur 20 000 requêtes aléatoires sans faux négatif ;
- test de coût de navigation sur palissades minces et test des quatre archétypes de stations ;
- **1 000 graines** pour garantir une réserve propre autour du dépôt D-17 ;
- **1 000 graines** pour garantir 16 épaves espacées, sans collision avec les micro-événements routiers.

Ces tests valident la logique et la géométrie générée. Les tests d'intégration de la copie complète et la validation du rendu sont consignés dans `reports/1.25.3/RAPPORT_QA_1.25.3.html`. Une passe visuelle en navigateur/desktop reste distincte de la capture Canvas en environnement Node.
