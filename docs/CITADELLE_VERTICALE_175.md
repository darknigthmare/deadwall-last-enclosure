# DEADWALL — CITADELLES : LES VILLES HAUTES

## État de livraison

**Extension en développement, première tranche intégrée 0.1.0. Ce document ne constitue pas une certification de version finale.** Les sections « présent dans le code » et « extension complète à produire » sont volontairement séparées. Une définition de catalogue ou une intention de design n'est pas une fonctionnalité jouable.

Audit effectué le **14 octobre 2026**, depuis `main` au commit `5b8f0ade7f7e93d3fc3ea23f762cac93ded43d90`, version 1.60.0 / génération G10. Branche dédiée `feat/vertical-citadel-175`. La PR de corrections d'échelles et d'accès routiers reste indépendante ; aucune fusion automatique et aucun changement de la production.

## 1. Résultat de la vérification de l'existant

| Sujet demandé | État de la base auditée |
|---|---|
| Cité protégée par des enceintes monumentales | Ambition explicitement inscrite dans ORIGINAL_BRIEF ; murs bois, acier et béton constructibles dans core.js. |
| Déblocage par âge | Onze âges avec connaissances persistantes et conditions de campagne ; pas de nouvel âge inventé. |
| Remparts habités de plusieurs dizaines de mètres | Le rempart en béton historique est un objet d'occupation 2D ; pas de chaîne complète « accès intérieur → étage → promenade → emplacement d'arme » pour ces murs. |
| Bâtiments hauts | Des silhouettes à nombreux étages existent ; elles ne signifient pas que chaque étage constitue un sol de cité constructible et parcourable. Les intérieurs régionaux G10 ne sont pas le même système. |
| Hordes de très grande taille | Vagues avec comptes en attente et fronts ; plafond de 720 infectés actifs. Une immense vague est étalée dans le temps, pas intégralement présente et calculée simultanément. |
| Cadavres contre les remparts | Charge et déblaiement déjà présents ; les récents et rampants peuvent franchir certains murs sur accumulation. |
| Mutants géants | Dix profils historiques, mais pas les trois géants originaux de cette extension. |
| Poste de tir avec FPS 3D | Moteur principal Canvas 2D/2,5D, pas une représentation 3D complète du monde. |
| Cité réellement superposée | Pas de construction native générale par sol, charge et altitude pour les bâtiments de D-17. |

Références : `docs/ORIGINAL_BRIEF.txt`, `GAME_DESIGN.md`, `ARCHITECTURE.md`, `BALANCING.md`, `src/core.js`, `src/game.js`, `src/urban.js`, `src/expansion-kit.js`. Les règles antérieures refusant les boss géants purement décoratifs ne remplacent pas la nouvelle demande explicite : les géants ajoutés ici sont une évolution de fiction originale, non une prétention biologique réelle.

## 2. Présent dans le code de cette tranche

### 2.1 Six ouvrages constructibles dans la campagne

Les coûts, âges et dimensions sont centralisés dans `DeadwallCore.VerticalRules175`. Une case de D-17 correspond ici à un mètre, soit 32 unités natives. Les coûts restent des valeurs de jeu, pas des métrés de génie civil.

| Ouvrage | Âge minimal | Emprise | Hauteur | Niveaux disponibles | Coût de base : pierre / ferraille / bois |
|---|---|---|---|---|---|
| Bastion habitable | Forteresse, 3 | 8 × 6 m | 12 m | 6 / 12 m | 260 / 140 / 60 |
| Rempart de citadelle | Grande ville, 5 | 10 × 8 m | 24 m | 6 / 12 / 18 / 24 m | 580 / 300 / 90 |
| Grande enceinte | Grande métropole, 7 | 12 × 10 m | 40 m | 8 / 16 / 24 / 32 / 40 m | 1 100 / 620 / 150 |
| Enceinte monumentale | Mégaville II, 9 | 16 × 12 m | 60 m | 10 / 20 / 30 / 40 / 50 / 60 m | 1 850 / 1 100 / 240 |
| Porte de citadelle | Grande ville, 5 | 10 × 8 m | 24 m | 6 / 12 / 18 / 24 m | 420 / 390 / 80 |
| Fondation de quartier | Forteresse, 3 | 12 × 12 m | 6 m initialement | Dalles ajoutées par pas de 6 m | 320 / 200 / 100 |

Ces nouveaux ouvrages utilisent le placement, les ressources, le chantier et la destruction du jeu. Aucune nouvelle partie ne reçoit un rempart achevé ou une réserve gratuite. Ils ne remplacent pas rétroactivement les palissades ou les murs en béton historiques.

La fondation peut atteindre 2 niveaux à Forteresse, 3 à Grande ville, 5 à Grande métropole et 8 à Mégaville II : jusqu'à **48 mètres de quartier superposé** dans cette tranche. Chaque ajout de dalle coûte 180 pierres, 120 ferrailles et 50 bois, et nécessite 60 secondes de travail actif. Le plafond de 8 niveaux est un choix de prototype borné, pas la limite imaginaire de la mégacité finale.

### 2.2 Parcours du commandant

L'accès extérieur et le palier intérieur sont ancrés à l'emprise et à la rotation de l'ouvrage. Le commandant doit rejoindre l'accès, choisir un niveau et effectuer un trajet temporisé. L'altitude varie pendant ce trajet : ce n'est pas un bouton donnant instantanément un bonus de portée.

Les escaliers restent utilisables sans courant. Un ascenseur se construit séparément contre 120 ferrailles, 35 pierres et 10 carburants ; il demande 4 unités électriques supplémentaires. Une coupure immobilise la cabine. Un trajet interrompu revient vers son palier initial ; une cabine sans courant ne peut pas revenir par magie. Le treuil de secours et le sauvetage d'un joueur bloqué restent à produire avant validation finale.

À l'étage, le déplacement respecte la surface supportée, les rebords et les équipements. Deux dalles adjacentes de même altitude peuvent être reliées par la marche ; un vide ou une différence de niveau ne devient pas un passage. Une marche importante est découpée en petits déplacements pour empêcher les sauts entre plateformes éloignées. Les interactions et soins au sol ne traversent plus automatiquement le plancher occupé.

**Limite :** les escaliers sont représentés par un accès et un trajet contraint ; pas encore par un escalier détaillé avec chacune de ses marches pilotable librement. Les PNJ civils, ouvriers et infectés ne disposent pas encore d'un réseau général de navigation verticale.

### 2.3 Sept installations, quatre emplacements par étage

| Installation | Fonction réellement raccordée |
|---|---|
| Dortoir de palier | +8 logements, charge structurelle et demande électrique. |
| Réserve de palier | +300 de stockage natif, charge structurelle. |
| Serre sur dalle | Production alimentaire native et consommation électrique. |
| Atelier de munitions | Production de munitions contre ferraille dans l'économie existante. |
| Batterie de rempart | Tir automatique ou possession, caisson de 120 cartouches, portée 80 m. |
| Batterie lourde | Tir automatique ou possession, caisson de 200 cartouches, portée 110 m. |
| Projecteur de crête | Éclairage raccordé au support alimenté. |

Les logements ne créent pas de population. Les réserves ne livrent pas leur capacité sous forme de ressources. Les ateliers ne fabriquent pas sans intrants. Les batteries sont initialement **vides** et se rechargent depuis les cartouches réellement portées par le commandant. Les modules du même ouvrage partagent pour l'instant son alimentation native ; chaque étage n'a pas encore son tableau électrique indépendant.

La préparation d'un travail ne prélève rien. Au terme du travail actif, le moteur revalide le support, le niveau, la proximité, les ressources et les mains du joueur, puis effectue une seule transaction. Déplacement, blessure, tir ou ressources devenues insuffisantes annulent ou refusent l'opération. Pause et fenêtre de commande suspendent sa progression.

Les batteries de rempart sont autorisées sur la crête ; les modules civils peuvent occuper les niveaux intérieurs. Ce catalogue ne permet pas encore de déplacer arbitrairement n'importe quel bâtiment historique sur une dalle.

### 2.4 Prise de contrôle et deux vues

Le joueur rejoint physiquement la batterie et prend le poste. **E** ouvre l'accès / les opérations à proximité, ou prend une batterie accessible ; **V** alterne les vues quand le poste est occupé ; **Échap** quitte d'abord le poste ou demande l'interruption du trajet/travail. La souris oriente le poste en FPS ; les flèches permettent également une visée clavier. Le tir reste soumis à l'état actif de la partie.

Vue classique et vue FPS utilisent le même opérateur, le même caisson, le même délai entre tirs, la même surchauffe, les mêmes ennemis et les mêmes récompenses. La possession exclut le tir automatique concurrent. Les tirs du poste utilisent un rayon en coordonnées XYZ : planchers, parois et obstacles rencontrés avant l'infecté interceptent le tir. Les armes portées depuis un étage conservent leur inventaire natif, avec une résolution géométrique adaptée à l'altitude.

La vue FPS est un **rendu en perspective de volumes 3D sur Canvas**, avec découpe au plan proche. Ce n'est pas une simple image de fond, mais **ce n'est pas non plus un port WebGL/3D complet** : les bâtiments historiques et infectés sont représentés par des volumes de contrôle simplifiés, certaines hauteurs héritées sont approximées, l'occultation est un tri de faces et pas un tampon de profondeur matériel. La caméra FPS est attachée au poste ; le déplacement libre à pied dans tout le monde en FPS n'est pas livré. La revue visuelle complète reste obligatoire.

### 2.5 Charges, dégâts, chute et sauvegarde

Chaque installation possède une masse abstraite. L'intégrité du support réduit sa capacité utile. Une surcharge persistante pendant 8 secondes actives retire les installations affectées ; une fondation peut perdre les dalles dépendantes au-dessus de la zone concernée. Un toit vide ne peut pas absorber indéfiniment la surcharge d'un étage inférieur. La perte n'offre pas de remboursement gratuit.

Le commandant est replacé sur un niveau inférieur valide ou à une sortie sûre, avec dégâts de chute. Ce traitement est un modèle discret de rupture, pas un simulateur physique de décombres. Les évacuations collectives, blessures et cadavres de civils aux différents étages ne sont pas encore implémentés.

Le registre optionnel versionné `expansions127.modules.vertical175` garde les ouvrages, niveaux, ascenseurs, installations, cartouches, chaleur, délais, charge et altitude stable du joueur. Un trajet sauvegardé reprend au dernier palier stable ; la vue revient en classique, le poste est libéré. Une donnée invalide est rejetée avant remplacement du monde. Les sauvegardes anciennes peuvent être ouvertes sans recevoir de constructions gratuites. Une nouvelle sauvegarde contenant les nouveaux types n'est pas garantie compatible avec un ancien exécutable : conserver une copie avant retour arrière.

### 2.6 Trois infectés géants originaux

| Profil | Hauteur | Âge minimal | Première vague éligible | Rôle de cette tranche |
|---|---|---|---|---|
| Fractureur hypertrophié | 5 m | Grande ville | 18 | Pression renforcée contre les ouvrages bas. |
| Bélier pathologique | 9 m | Grande métropole | 30 | Briseur lent et lourd, cible prioritaire aux portes. |
| Colosse de siège | 15 m | Mégaville II | 48 | Menace rare sur la première ligne et certaines positions basses. |

Un profil éligible remplace 1 à 3 places d'errants sur une vague sur trois : il ne crée pas un second budget caché. Les dix anciens profils et la conservation des contacts restent testés. Les géants utilisent les dégâts, morts, statistiques et sauvegardes natives ; leurs volumes ont la hauteur déclarée. La hauteur intervient pour certaines possibilités de toucher un commandant élevé.

**Limites :** leurs silhouettes sont procédurales, pas des sprites artistiquement finalisés. Leurs gestes spécifiques, membres destructibles et attaques télégraphiées complexes ne sont pas livrés. Leur navigation reste celle des infectés natifs au sol. La pression des corps sur les nouveaux murs dépend désormais de leur hauteur, mais les rampes ne sont pas encore des surfaces de foule physiques menant aux étages.

## 3. Extension complète : direction et contenu restant à produire

### 3.1 Croissance urbaine en trois dimensions

La ville finale doit devenir un ensemble de quartiers et de terrasses inégales : industries lourdes près du sol, réseaux sous les dalles, entrepôts et ateliers intermédiaires, logements au-dessus, jardins et réserves en toiture. Il doit rester possible de reconnaître l'ancien refuge sous les constructions successives.

Les nouvelles fondations se construisent à côté et au-dessus des emprises autorisées ; elles ne soulèvent pas instantanément toute la carte. Rehausser un quartier occupé exige étaiement, évacuation, transfert des réseaux, chantier de levage en étapes puis réouverture. Les bâtiments incompatibles restent au sol. Les dalles voisines peuvent présenter des hauteurs différentes, reliées par escaliers, rampes et ascenseurs, plutôt qu'une unique plateforme plate couvrant la cité.

Le graphe structurel doit relier dalle → poutres → piliers → semelles → terrain. Charges permanentes, activités, stockage et dégâts sont évalués sans cycles ni support flottant. Un pont doit avoir deux ancrages valides ; un porte-à-faux doit annoncer sa limite. L'aperçu de construction explique les refus : accès coupé, pile porteuse absente, charge excédentaire, conflit de volume, embrasure obstruée, hauteur insuffisante pour une route.

### 3.2 Familles de construction supplémentaires

Le catalogue final doit comporter des variantes fonctionnelles, pas seulement des couleurs : segments droits, angles intérieurs/extérieurs, jonctions, bastions avancés, créneaux, parapets pleins ou grillagés, galeries couvertes, coursives de maintenance, contre-murs, contreforts, redoutes et tours-relais. Chaque pièce conserve une emprise, un volume, un accès, des points d'accrochage, des états de chantier et de destruction.

Pour les accès : cages d'escalier protégées, escaliers droits et en retour, rampes de service, ascenseurs civils, monte-charges, treuils manuels, sorties de secours, portes coupe-feu, sas de quarantaine. Pour les fondations : piliers courts et renforcés, poutres, dalles légères et industrielles, joints, étaiements, échafaudages, grues et plateformes de chantier. Pour les liaisons : passerelles piétonnes, ponts logistiques, ponts couverts, rampes de véhicules et raccords étanches.

Pour les quartiers : logements, réfectoires, ateliers, dispensaires, postes de commandement secondaires, jardins, serres, réservoirs, centrales et ventilation. Pour les crêtes : affûts, mitrailleuses, canons de défense de fiction, mortiers à trajectoire visible, projecteurs, radars, points d'observation, dépôts sécurisés et dispositifs de déblaiement. Les armes lourdes devront avoir une zone de tir et une contrepartie, pas seulement des dégâts supérieurs.

### 3.3 Une logistique verticale tangible

Des monte-charges et porteurs déplacent les stocks entre niveaux. Un module peut posséder une réserve locale finie ; les cartouches et médicaments ne traversent pas automatiquement tous les étages. Le chantier mobilise des ouvriers réellement présents, un point de travail accessible et un itinéraire de livraison. Des escaliers bouchés ou un ascenseur hors service doivent affecter ravitaillement, production et évacuation.

Les réseaux passent par des gaines : électricité, eau, ventilation et drainage. Une coupure isole un tronçon défini. Les logements au-dessus d'un groupe électrogène ou d'un atelier polluant demandent une séparation. Les planchers coupe-feu limitent les pertes en chaîne. Les conduites, tableaux et gaines sont réparables depuis des points atteignables, pas depuis un clic à distance sans trajet.

### 3.4 Hordes immenses, avec conservation des individus

**Cette livraison ne relève pas le plafond de 720 infectés actifs.** Le système final doit distinguer migrations lointaines, cohortes d'approche, groupes proches et individus détaillés. La conversion entre niveaux de détail doit conserver effectifs, blessures agrégées, arrivées, morts et départs. Des silhouettes de foule ne sont pas autorisées à être présentées comme des milliers d'ennemis indépendamment simulés.

À proximité des murs, la pression devrait être calculée par faces et points faibles : portes, brèches, amas, angles morts, hauts talus et ruines adjacentes. Les corps forment une hauteur locale bornée, avec tassement et déblaiement. Un franchissement n'est permis que si un trajet réel relie le pied à une surface d'arrivée valide. La charge de corps ne doit pas simplement téléporter un infecté de l'autre côté d'un mur de 60 mètres.

Le directeur répartit plusieurs fronts et garde des réserves. Le joueur doit pouvoir détecter une migration avant son arrivée, concentrer des défenses, perdre une enceinte, évacuer un quartier et se replier vers un noyau autonome. Le dernier rempart ne doit pas supprimer la nécessité d'expéditions et de déblaiement.

### 3.5 Géants tactiques et contre-jeu

Chaque géant final doit avoir approche lisible, préparation d'attaque, attaque, récupération, interruption, blessure et mort cohérentes avec sa masse. Le Fractureur ouvre des défenses basses ; le Bélier prépare une charge dans un axe annoncé ; le Colosse menace les contreforts et les postes à sa hauteur. Le joueur doit pouvoir les ralentir, rompre leur attaque et privilégier certaines zones, sans obligatoirement vider une réserve gigantesque dans une simple barre de vie.

Les interactions doivent être testées contre portails fermés, doubles portes, tabliers, ponts, contre-murs, ruines et corps. Un géant n'entre pas dans une galerie de deux mètres. Sa mort doit modifier l'obstacle local et présenter un chantier de déblaiement. Pas de mutation surnaturelle gratuite ni de personnages, textures ou noms copiés d'une franchise de référence.

### 3.6 Caméras et représentation communes

À terme, vue tactique et FPS doivent lire une scène autoritaire commune : même hauteur, surface, ennemi, hitbox, collision, éclairage et horloge. Le changement de vue ne remet à zéro ni recul, ni rechargement, ni temps de rotation, ni surchauffe, ni menace. Quitter un poste laisse une vraie position d'opérateur et ne permet pas de se téléporter au sol.

La 3D finale demande des volumes artistiques, matériaux, animation, silhouettes de nuit, effets et niveaux de détail. Les armes ont butées d'élévation/dépression, limites de rotation, occultation du parapet et zones d'éjection. Les postes d'observation, projecteurs, grues et équipements de chantier pourront aussi être possédés. Un simple affichage FPS d'un modèle d'arme sur un décor fixe ne satisfait pas cette exigence.

### 3.7 Lisibilité et interface

La carte de ville doit proposer un filtre de niveau, une coupe, la visualisation des réseaux, charges et accès, et un mode « suivre le commandant ». Les étages au-dessus du joueur deviennent transparents ou sont masqués sans faire disparaître leurs collisions. Les dangers hors niveau sont signalés sans ajouter un troisième HUD permanent.

La construction propose une prévisualisation volumétrique avec hauteur, charges, appuis et coût cumulatif, puis une confirmation claire. Les trajets affichent étage de départ, destination, disponibilité et issue de secours. Les cartes routières de l'exploration restent distinctes des plans de circulation intérieurs ; les deux emploient la même position régionale réelle de D-17.

### 3.8 Narration, découverte et déblocages

Des plans d'ouvrages sont obtenus par reconnaissances de barrages, viaducs, fortifications et sites industriels. Des missions débloquent des capacités via des équipes et ressources : retrouver un spécialiste, récupérer des treuils, remettre une centrale en service, sécuriser une carrière, puis transporter une pièce lourde. Ces missions n'offrent pas automatiquement la cité finie.

Trois arcs de siège donnent un sens à la croissance : tenir la première galerie, évacuer sous une dalle endommagée, puis reconquérir une enceinte extérieure. Les choix portent sur les personnes et les ressources à sauver, les quartiers à délester et les accès à préserver. Il n'est pas nécessaire de copier l'histoire des œuvres de référence pour retrouver leur sentiment d'échelle et d'encerclement.

## 4. Critères de réception de la version complète

Une fonctionnalité verticale n'est terminée qu'après parcours physique, test de sauvegarde en situation, contrôle visuel dans les deux vues et mesure sous charge. Priorités de réception :

1. Construire deux quartiers à trois niveaux différents ; chaque service est rejoignable par joueur et PNJ, aucun étage flottant, aucun volume de route traversé.
2. Interrompre chaque type de chantier, endommager son support et recharger la sauvegarde : ni duplication, ni remboursement indu, ni équipement gratuit.
3. Couper un ascenseur en cours de trajet : procédure réelle de sauvetage, aucune immobilisation définitive du seul joueur.
4. Assiéger portes et murs depuis plusieurs fronts ; faire monter les infectés uniquement par un trajet validé et mesurer les conversions de foule sans perte d'effectif.
5. Alterner les vues pendant tir, surchauffe, rechargement et destruction : mêmes résultats de simulation ; aucun double tir et aucune immunité.
6. Détruire un support bas : chute et évacuation locales, réseaux recalculés, étages indépendants préservés, sauvegarde réouvrable.
7. Mesurer les appareils desktop, Windows, PWA et mobiles réellement ciblés. Aucun chiffre de fluidité universelle n'est promis par des tests unitaires.

## 5. Validation de cette tranche et limites assumées

- Build natif exécuté avec les **205 assets originaux vérifiés par leurs empreintes Git** : 338 fichiers publics produits et HTML autonome généré.
- Suite ciblée transversale : **216 / 216** tests réussis sur la révision précédant les deux derniers guards ; suite de l'extension finale : **31 / 31** réussis, incluant ces guards.
- Quatre assertions de taille de catalogue ont été adaptées pour les six ouvrages et trois infectés. Les empreintes des anciens profils et des anciens plans de vague restent contrôlées, sans remplacer ces tests par des validations triviales.
- `npm run check` a été lancé. Son résultat détaillé et ses éventuels blocages d'environnement doivent être lus dans les reçus joints, pas déduits du build.
- **Navigation Chromium locale bloquée par `ERR_BLOCKED_BY_ADMINISTRATOR`**, aussi bien sur le serveur local que sur le fichier local. Aucune capture d'écran de cette extension n'est présentée comme validée. La QA visuelle, le parcours humain et le contrôle multi-appareils restent ouverts.
- Pas de certification de campagne longue, de milliers d'infectés simultanés, de port 3D complet, de pathfinding civil vertical ou de catalogue final intégral.

La branche doit rester en brouillon tant que les blocages de validation et les limites prioritaires ci-dessus ne sont pas traités. La PR et le paquet de sources sont des livrables de travail vérifiables, pas une annonce que tous les chantiers de cette extension massive sont achevés.
