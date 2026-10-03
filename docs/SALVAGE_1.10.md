# DEADWALL 1.10 — Les équipes du jour

Candidat local 1.10.0-rc.1, développé depuis le jeu complet 1.9. Aucun push ni déploiement distant. Les anciennes fonctionnalités et les quatorze fichiers d’assets sont conservés.

## Récupérer après le relevé

Dans **Carte & exploration**, sélectionnez une découverte dont le relevé a été terminé par le commandant. Le bouton d’affectation utilise un ouvrier vivant déjà présent, libre de toute affectation spéciale. Il faut un Bureau de chantier et un Entrepôt achevés, la phase calme, un commandant debout, l’absence de repli général et quatre rations. Chaque entrepôt ouvre deux places, dans la limite de quatre équipes. Un lieu ne reçoit qu’une équipe à la fois.

Les quatre rations sont consommées à l’affectation, sans remboursement après rappel ou perte. Le même ouvrier conserve sa santé, son logement et sa consommation alimentaire ordinaire. Son éventuel sac de collecte précédent est rapporté au centre avant la récupération. Il rejoint ensuite physiquement le lieu, par les déplacements et collisions existants.

Le chargement exige un accès libre à moins de 48 unités, un relevé terminé et des abords sans infecté visible dans un rayon de 115 unités. Le rythme est de 1,5 ressource par seconde active, contre 4 pour le commandant dans le système de relevés. Le sac ordinaire de l’ouvrier contient au plus dix ressources. Le débit est une nouvelle règle explicite : il ne reçoit pas un multiplicateur caché de difficulté ou de recherche.

**Une affectation correspond à un seul aller-retour**, pas à une chaîne infinie de navettes. Sac plein, réserve épuisée, danger, crépuscule, ordre de rappel ou perte des infrastructures nécessaires provoquent le retour. Après une livraison complète au centre, l’ouvrier redevient disponible. Pour un nouveau chargement il faut une nouvelle affectation et ses rations.

Les matériaux sont retirés de la véritable réserve Dayworks et placés dans `Unit.carry`. Il n’existe ni second stock ni récompense séparée. Un joueur et son ouvrier peuvent récupérer le même lieu sans créer de ressources. La livraison crédite seulement ce qui entre effectivement dans la réserve centrale. Si elle est pleine, le reliquat reste dans le sac ; une livraison partielle est possible. Une porte verrouillée peut bloquer l’aller comme le retour.

Une mort fait perdre la cargaison déjà prélevée. Le lieu ne se remplit pas de nouveau. Les équipes ne sont ni armées par cette fonctionnalité ni téléportées. Les autres affectations (quartier, incendie, voirie, escorte) sont exclues des deux côtés ; le validateur refuse aussi une double affectation importée.

## Quatre ensembles supplémentaires

Les modèles utilisent uniquement les bâtiments déjà disponibles. Aucun nouveau type de structure, palier gratuit ou propriété artificielle n’est ajouté.

| Ensemble | Emprise | Contenu | Coût total existant |
|---|---|---|---|
| Relais de retour | 8 × 7 cellules | Entrepôt, dortoir, halte | 175 bois, 85 ferraille, 10 nourriture |
| Cour nourricière | 10 × 8 | Deux fermes, dortoir, entrepôt | 235 bois, 65 ferraille, 50 pierre |
| Cour des matériaux | 10 × 10 | Scierie, recyclage, concasseur, générateur | 125 bois, 195 ferraille, 20 pierre, 20 carburant |
| Entrée à tirs croisés | 9 × 7 | 19 palissades, une porte, deux miradors | 287 bois, 95 ferraille, 40 munitions |

Le Bureau de chantier reste nécessaire pour planifier. Les paliers et dépendances de chaque construction sont contrôlés avant de financer. L’aperçu ne prélève rien et la confirmation engage tous les chantiers ou aucun. Chaque bâtiment doit ensuite être construit. La production, la capacité et les tirs restent inactifs avant l’achèvement.

Les trois cours ne comportent pas d’enceinte : elles sont destinées à être protégées par les remparts du joueur. L’entrée à tirs croisés est ouverte à l’arrière ; elle ne garantit donc pas un centre ceinturé. Ses miradors tirent avec les munitions ordinaires après leur construction. Les schémas des sept modèles sont dessinés depuis leurs empreintes réelles, pas depuis une image fictive.

## Préparatifs et informations

Aucun quatorzième onglet n’est ajouté : les nouvelles commandes de récupération occupent un encart dans la carte existante. Le volet Opérations et le tableau Préparatifs signalent les récupérateurs affectés. L’avertissement de fin anticipée du calme tient compte des récupérateurs, des convois, des escortes et de la véritable sortie active ; une ancienne référence erronée à `fieldOps` est corrigée.

## Sauvegarde v9

Le registre `salvage` conserve au plus quatre affectations et leurs compteurs. Il référence les vrais IDs d’ouvriers et les vrais IDs de découvertes. Les cargaisons restent dans les unités et les réserves dans Dayworks. Le validateur refuse les équipes dupliquées, les références inexistantes, les sacs surchargés, les matériaux incompatibles, les relevés absents et les bilans incohérents avant de remplacer le monde.

Les formats historiques 1 à 8 migrent vers 9 avec un registre de récupération vide : ni rations ni ouvriers ni matériaux ne sont accordés. Une sauvegarde v9 ne peut pas être chargée par un ancien jeu 1.9. Exportez les anciennes campagnes avant le transfert. Les données locales du navigateur peuvent différer entre le site, un serveur local et le fichier HTML autonome.

## Implémentation

- Valeurs et normalisation : `src/core.js`, `Salvage` et `WORKER_RULES.carryCapacity`.
- Validation croisée et migration : `src/save.js`.
- Affectation et trajet : `src/salvage.js`, appelé dans la boucle des vrais ouvriers.
- Prélèvement borné dans le registre propriétaire : `dayworks.recoverForWorker` dans `src/game.js`.
- Interface intégrée et schémas : `src/salvage-ui.js`.
- Pas de dépendance de jeu réseau ou d’asset externe supplémentaire.

## Tests et honnêteté des preuves

Les tests nouveaux comprennent les règles, transactions, comportements de terrain, erreurs d’import et interactions avec les anciennes équipes. Quatre parcours Chromium distincts chargent le vrai moteur, le DOM et les atlas. Le temps est piloté et les scènes avancées préparent les infrastructures, relevés ou menaces nécessaires : elles ne sont pas présentées comme quatre campagnes humaines gagnées.

Un contrôle supplémentaire part réellement de zéro en Standard, graine 17117 : achat et construction du dortoir, du bureau et de l’entrepôt ; déplacement du commandant par les touches ordinaires ; découverte et relevé manuel ; affectation payée ; retour de dix ressources par le même ouvrier. Aucun stock, chantier achevé, relevé, soin ou travailleur n’est injecté. La destination est connue du contrôleur de test : ce n’est pas une exploration aveugle d’un humain. Il aboutit en 102,16 secondes simulées dans cette graine, avec une reprise au milieu du trajet.

Les premières itérations ont corrigé l’initialisation du registre lors d’une nouvelle campagne et l’état de travail transitoire d’un récupérateur à la reprise. Les coûts, réserves et identités n’ont pas été relâchés pour faire réussir les tests. Les journaux intermédiaires sont conservés.

La suite Node inclut aussi les anciens parcours de dix minutes et une endurance à assistance synthétique explicitement comptabilisée. Aucun résultat ne certifie la fluidité sur le matériel du joueur, Safari/iOS, Firefox, Electron empaqueté, ni l’équilibrage complet sur plusieurs heures. Les captures sont issues du rendu réel ; les contrôles de disposition sont automatisés, pas une revue artistique exhaustive. La CLI agent-browser perdait sa page entre commandes dans l’environnement ; la vérification effective utilise Playwright.
