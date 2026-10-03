# DEADWALL 1.4 — Aube & Bastions

Extension cumulative candidate. Le dépôt original complet et ses atlas ne sont pas inclus dans ce kit. Les captures et parcours livrés proviennent d’un hôte simulé explicitement marqué. Aucun push ni déploiement.

## Intention et périmètre

Développer en priorité la préparation diurne : exploration locale, récupération physique, construction d’ensembles et économie de chantier. Le volet nocturne ajoute l’étaiement des portes et trois échelons de contacts, en conservant les effectifs et les six profils de migration 1.3. La boucle récolter → déposer → financer → construire → fortifier → subir l’assaut → réparer reste centrale.

Les quatre modules sont incorporés aux fichiers historiques core.js, save.js et game.js par des points d’intégration uniques contrôlés. Aucun module ne remplace le monde, l’IA ou le rendu d’origine. Le fichier core.js porte DAYWORKS_RULES, les coûts et catalogues. La compatibilité avec les extensions Sorties, Quartiers et Siège est testée dans le banc ; une validation complète du dépôt assemblé reste nécessaire.

## 1. Journée et nuit

Une nouvelle campagne classique Standard reçoit 210 secondes de calme. La contrepartie temporelle de chaque scénario reste appliquée : Arrière-garde 192 secondes, Dépôt à reconstruire 240 secondes. Le multiplicateur de difficulté s’applique ensuite. Après une nuit, le calme vaut max(180 ; 240 − (vague − 1) × 1,25) × difficulté.calmTime. La vague 2 dispose donc de 238,75 secondes en Standard.

Une campagne importée conserve son délai restant : il n’est pas augmenté à chaque chargement. La durée de référence du jour est enregistrée. Une campagne sauvegardée pendant un ancien assaut continue celui-ci sans lui imposer rétroactivement de nouveaux échelons. La transition vers le rythme nouveau se fait aux phases suivantes.

La valeur dayClock est liée à la phase : journée au calme, crépuscule à l’alerte, nuit durant l’assaut, puis sécurisation avant l’aube suivante. Les services dépendants de l’éclairage lisent le même dayClock. Les hordes vivantes empêchent la fin de l’assaut, même quand le dernier contact a déjà été émis. Les incendies, convois et anciennes crises ne sont pas effacés au changement de phase.

La journée peut se terminer plus tôt, près du centre, après deux étapes de confirmation. Aucun bonus de temps, achèvement, soin, transport ni récompense n’est distribué par cette commande. Elle met le chronomètre à zéro ; l’alerte démarre à la reprise de la simulation.

## 2. Dix-huit découvertes de proximité

Trois petits lieux sont générés autour de chacun des six quartiers existants. Ce ne sont pas dix-huit cartes, intérieurs ou contrats supplémentaires. Leur génération utilise un flux pseudo-aléatoire indépendant. Les positions sont conservées dans la sauvegarde, sans renuméroter les anciens gisements.

À moins de 210 unités et sans paroi sur la ligne d’observation, le lieu devient connu. Le carnet prend explicitement possession de l’action E / ACTION ; il faut le ranger pour retrouver récolte, construction et interactions historiques. Les armes sont suspendues pendant son utilisation. Les outils diurnes et les aperçus non financés sont automatiquement rangés au passage du calme à l’alerte, sans annuler une construction ordinaire sélectionnée dans le catalogue historique. Le seau 1.3 a la priorité lorsqu’il est équipé.

Le relevé exige six secondes actives au calme, à moins de 54 unités et par un accès praticable, sans infecté dans un rayon de 120 unités. Aucun matériau n’est accordé au relevé. Maintenir l’action après celui-ci transfère quatre unités par seconde vers le vrai sac, sans dépasser sa capacité actuelle, y compris lorsqu’une cargaison 1.1 en occupe une partie. Le reliquat reste sur place ; aucun point n’est réapprovisionné à l’aube.

Quatre relevés ouvrent des possibilités : jardin derrière les volets → serre ; gabarits d’atelier → aire de préfabrication ; halte des brancardiers → ensemble Camp de halte ; croquis du sas → ensemble Sas à deux portes. Les plans ne distribuent aucun bâtiment gratuit et n’annulent pas les conditions de palier ou de bâtiment requis.

Les points non épuisés bloquent leur petite emprise à la construction. Sur une ancienne carte intégralement occupée, un point peut rester dans une position temporairement inaccessible : l’import ne démolit jamais une construction pour lui faire de la place. Il faut libérer un accès réel. La distribution des dix-huit sites n’est pas un streaming infini du monde.

## 3. Quatre bâtiments

| Structure | Palier / condition | Effet |
|---|---|---|
| Bureau de chantier | Camp fortifié | Permet les aperçus et le financement atomique des ensembles |
| Halte de récupération | Camp fortifié | Deux logements ; au calme et hors danger, +0,6 santé/s au commandant présent, contre 0,05 nourriture par point de santé, et +8 endurance/s |
| Serre de jour | Avant-poste, ferme et relevé du jardin | +0,72 nourriture/s contre 0,04 carburant/s et 2 électricité ; production coupée à l’alerte et la nuit |
| Aire de préfabrication | Avant-poste, atelier militaire et relevé des gabarits | +25 % au travail actif à moins de 210 unités, contre 0,10 ferraille et 0,04 carburant par seconde de travail bonus ; nécessite 3 électricité |

La halte ne ressuscite pas le commandant et ne soigne pas un personnage hors de sa portée, à travers un mur ou entouré d’infectés. Sa consommation peut être masquée dans le solde global par la production d’une ferme : le journal des ressources consommées est distinct du solde net.

L’aire ne multiplie pas la progression passive du chantier. Elle facture uniquement le bonus réellement appliqué, sans facturer le travail excédentaire lors de l’achèvement. Sans intrants, les travaux ordinaires continuent. Plusieurs aires ne cumulent pas leur bonus.

La serre arrête sa production et sa consommation de carburant pendant la nuit ; son raccordement électrique reste présent dans la demande du réseau.

Les quatre constructions contribuent au score et à la signature, occupent leur emprise, peuvent être endommagées et sont intégrées à la table de combustibilité. Les dessins sont des éléments Canvas distincts, pas des images de bâtiments fondus dans un décor.

## 4. Trois ensembles à financer

- Enceinte de chantier : 11 × 9 cellules, 34 palissades et une porte, coût issu du catalogue (297 bois + 25 ferraille avec les tarifs historiques).
- Sas à deux portes : 7 × 7 cellules, 20 palissades et deux portes opposées. Aucun verrouillage automatique.
- Camp de halte : 13 × 11 cellules, 42 palissades, une porte, une halte et un entrepôt.

Le clic au sol pose uniquement un aperçu. La confirmation vérifie l’ensemble : emprises existantes, ressources, découvertes non vidées, palier, bâtiments requis et chevauchements internes. Tous les chantiers sont financés ou aucun. Un échec inattendu après plusieurs placements restaure ressources, nouvelles structures, identifiants, statistiques et données de gisements. Les bâtiments financés commencent comme des chantiers à réaliser par le jeu habituel ; les occupants continuent de bloquer l’achèvement d’un rempart.

Échap ou le clic droit annulent l’aperçu sans dépense. La sélection d’un autre placement le remplace.

Aucun ancien mur n’est automatiquement démonté pour raccorder un ensemble. Un empiétement est refusé et doit être corrigé par le joueur.

## 5. Préparation nocturne

Équiper les outils d’étaiement, sélectionner une porte achevée et rejoindre une face accessible permet de maintenir E pendant huit secondes au calme. La dépense de 12 bois + 8 ferraille intervient à l’achèvement, une fois seulement pour cette porte et cette vague. Les travaux partiels sont sauvegardés sans dépense préalable.

Un étai absorbe 20 % des coups d’infectés appliqués à cette porte, avec une réserve totale de 120 dégâts. Les tests de portée et d’obstacles du coup historique restent prioritaires. Un incendie, une explosion ou un dégât environnemental ne sont pas absorbés. La réserve est conservée aux reprises, retirée à la destruction de la porte et expire au passage à la vague suivante. Elle ne répare pas l’intégrité.

À partir de la vague 4, les nouveaux assauts répartissent leurs contacts en trois échelons. Les deux interruptions d’arrivée durent six secondes. Les infectés déjà présents continuent d’agir : ces interruptions ne sont pas des pauses du jeu. Les fronts utilisés appartiennent aux fronts annoncés ; s’il y en a quatre, les deux derniers sont utilisés dans le troisième échelon. Les profils 1.3, totaux, points de vie, stocks de contacts et plafond simultané restent en place. Les reprises conservent le nombre d’arrivées et les pauses déjà effectuées.

## 6. Sauvegarde v6

Les versions 1 à 5 migrent sans ressources nouvelles, sans remise à neuf des anciens bâtiments et sans réinitialisation des registres fieldOps, territories ou siege. Le registre dayworks enregistre les dix-huit points et leurs réserves, les relevés, la référence du jour, les étais et les échelons. Les outils équipés et aperçus non financés sont transitoires et se rangent à la reprise.

Les v6 sans registre, positions invalides, réserves impossibles, doublons, étais sans porte ou échelons incompatibles avec les contacts sauvegardés sont refusés avant remplacement du monde. Les octets UTF-8 sont contrôlés. Un ancien jeu ne sait pas relire la v6 : exporter une campagne avant toute mise à jour.

## 7. Vérification à terminer dans le jeu complet

Ce kit ne certifie pas une campagne intégrale, la fluidité sur matériel réel, l’équilibrage de plusieurs heures ni la lisibilité avec les atlas d’origine. Rejouer npm run check dans le dépôt assemblé, puis tester les anciennes sauvegardes, les grandes enceintes, la consommation sur la durée, la logistique territoriale, les sorties, le siège et les commandes clavier/tactiles. Les captures du kit sont celles du banc et portent cette mention.
