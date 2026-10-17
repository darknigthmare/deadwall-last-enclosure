# Récoltes sauvages 190 — suite de la PR fusionnée #8

## Base et publication

Base distante lue le 17 octobre 2026 : `main` au commit `667de8bcf8a9d6252483aa82f6f13ce42f136458`, arbre `b0381a3d8e751fae7e19209f95e5482838c14beb`. La PR #8 a été fusionnée : cette passe est destinée à une nouvelle PR, pas à rouvrir l’ancienne. Le repère 190 est technique ; le numéro commercial reste 1.65.0.

La connexion GitHub disponible pendant cette passe n’expose pas les actions d’écriture. Le correctif est donc fourni localement avec les sources, un patch basé sur cet arbre exact et ses reçus. Aucun push, nouvelle PR, fusion ou déploiement n’est annoncé.

## Boucles raccordées

### Chasse et préparation du gibier

Les armes, projectiles et dégâts existants restent responsables de la chasse. Aucun animal factice n’est créé par l’opération. Une dépouille réellement enregistrée peut être préparée à pied et à portée, avec un couteau ou une machette porté et équipé. Ces outils sont ceux de l’armurerie existante, fabriqués contre ses coûts habituels ; le travail les use à son taux normal.

La récupération se fait par portions plafonnées à quatre unités et par la place réellement libre dans le sac. La part restante demeure sur la dépouille. La nourriture n’est jamais ajoutée directement au dépôt distant. Il faut utiliser le transport et le dépôt ordinaires du jeu. Les carcasses épuisées ne redeviennent pas des ressources au rechargement.

### Pêche depuis la berge

L’action cible un poisson vivant et effectivement chargé par le générateur de la campagne. Le commandant doit être sur un sol praticable, hors de l’eau, avec une ligne libre de sept mètres au maximum. Les murs et les solides restent bloquants. Le joueur n’acquiert aucune capacité de nage. Un poisson déjà mort ne peut pas utiliser gratuitement cette portée de lancer : sa récupération est limitée à la portée courte de 2,2 mètres, toujours depuis une berge avec accès libre.

Une ligne de fortune consomme immédiatement **1 bois, 1 ferraille et 0,5 nourriture** depuis le sac. Le matériel engagé n’est pas remboursé lors d’une interruption. Pendant les dix secondes de l’action, ce seul poisson est retenu à sa position réelle ; il n’est pas téléporté au bord. La canne simplifiée, la ligne et le flotteur sont dessinés dans le monde. La prise réussie tue ce poisson et transfère une quantité finie dans le sac. Une reprise interrompt la tâche et libère son accroche sans rembourser les dépenses déjà sauvegardées.

Les quantités sont des unités abstraites de **provisions**, pas des kilogrammes ou un nouvel inventaire de viande crue. Cette passe n’ajoute pas de recettes de cuisson, de peau ou de cuir.

### Quantités de jeu

| Espèce | Maximum de provisions |
|---|---:|
| Chevreuil | 16 |
| Sanglier | 14 |
| Lièvre | 3 |
| Canard | 2 |
| Lapin | 2 |
| Écureuil | 1 |
| Chamois | 12 |
| Mouflon | 12 |
| Cerf élaphe | 22 |
| Pigeon | 1 |
| Faisan | 2 |
| Perdrix | 1 |
| Truite | 3 |
| Carpe | 4 |
| Mulet | 3 |

Les onze autres espèces ont un rendement nul explicite. Le Guide indique « Observation seulement » plutôt que de promettre une récolte qui n’existe pas. Ce sont des choix d’équilibrage du jeu, pas une recommandation zoologique ou alimentaire.

## Actions, interruptions et visibilité

**FAUNE & RÉCOLTES** rejoint les commandes régionales et ouvre le panneau d’opérations existant. Il n’y a pas de deuxième système de fenêtres. Le panneau expose les prises proches, leurs prérequis, leur quantité restante et les motifs de refus. Les opérations partagent l’exclusion mutuelle avec les autres travaux.

Un mouvement, un tir, une blessure, un changement d’outil, une menace proche, une ligne obstruée ou la perte du commandant interrompt l’opération. La pause et les fenêtres modales n’avancent pas le travail. Les valeurs de temps non finies sont refusées et les pas trop grands bornés. De brefs sons de travail utilisent l’audio existant ; il ne s’agit pas encore de cris propres aux espèces.

Les carcasses récupérables sont rendues immobiles et atténuées, dans la même chaîne de profondeur que les animaux. Leur révélation utilise les observateurs, les lumières, les murs et les étages existants. La nouvelle lecture de visibilité de point n’assouplit pas la sélection des ennemis vivants. Les poses graphiques et consultations n’écrivent pas dans les propriétaires de sauvegarde.

## Persistance et refus atomiques

Le registre versionné est `expansions127.modules.wildlife190 = {version: 1, harvested: {id: quantité}}`. Son absence migre vers un registre vide. Les cartes anciennes ne sont pas regénérées ; les profils, routes, eaux et biomes existants ne sont pas modifiés. Les six espèces historiques peuvent utiliser la préparation lorsque leur campagne contient déjà la faune et l’hydrologie.

Le validateur vérifie les identifiants canoniques, les nombres, le plafond de records, le profil de monde, l’existence réelle de l’espèce et un enregistrement de mort. Une quantité supérieure au rendement de cette espèce, un animal vivant, une fausse origine ou un profil incompatible sont refusés avant le remplacement de la campagne. Le carnet de prélèvement ne stocke pas les tâches temporaires. Les bornes du sac et les parts dépensées sont recontrôlées à l’achèvement.

Les outils conservent leur usure et le matériel de pêche ses dépenses lors de la sauvegarde. Aucun bonus de morts de zombies, duplication de munitions, aliment à distance ou remboursement implicite n’est introduit.

## Régressions héritées de 189 corrigées

Deux tests comptaient encore le Guide avant les 43 entrées écologiques. Ils vérifient maintenant ces 43 identifiants et leur contenu séparément, tout en conservant le contrôle des collections historiques. Les fiches de peuplements et de profils reçoivent le champ d’interactions attendu. Les descriptions distinguent également les espèces récoltables de celles qui n’accordent pas de nourriture.

Les deux nouveaux scripts publics figurent exactement une fois dans le manifeste HTML et le précache du worker. Le build, le serveur, le standalone et l’empreinte PWA utilisent leurs entrées ordinaires. Le bundle du Codex est recompilé à partir des sources modifiées ; aucun double chargement n’est ajouté.

## Validation et portée des reçus

Les tests `audit190-contracts` et `audit190-harvest` comprennent la validation négative, les portions partielles, les commandes du panneau dans le DOM de test, les outils payés et leur usure, la pêche de vrais descripteurs générés, les interruptions et les reprises. Un scénario tire de vrais projectiles, débite leurs munitions, abat un animal généré et rejoint sa dépouille avec les commandes de déplacement avant la préparation. Les dommages directs des autres scénarios sont des préparations déclarées, pas des chasses humaines présentées comme jouées.

Les tests de rendu raster utilisent le moteur Canvas installé et des silhouettes originales. Ce sont des bancs de rendu, pas des captures d’une session navigateur. Les compteurs et résultats exacts sont dans les journaux joints ; les groupes se recouvrent et ne doivent pas être additionnés.

Le parcours Playwright `scripts/browser-wildlife190.mjs` et le workflow `Finite hunting and shore fishing 190` sont fournis pour trois formats d’écran. Ils utilisent `dist` et les commandes d’interface. La navigation du navigateur local est refusée par `ERR_BLOCKED_BY_ADMINISTRATOR` ; cette passe ne contourne pas cette règle et ne déclare pas ce parcours réussi sans exécution.

`DEADWALL_SOAK=1 npm run check` reste le contrôle natif global. Une affinité de trois processeurs borne sa concurrence, sans filtrer les fichiers ni les cas. Son résultat ou son interruption est enregistré distinctement des suites ciblées. La CI distante, les parcours navigateur, Windows et les conditions normales de revue restent nécessaires avant de qualifier une nouvelle PR pour la fusion.

## Non terminés par cette passe

Capture vivante, cages et élevage, reproduction, prédation, migrations longues, audio propre à chaque espèce, nouvelles animations spécifiques de dépeçage et art définitif. La préparation donne des provisions abstraites, pas un nouveau système complet de boucherie/cuisson. Les prédateurs ne deviennent pas agressifs. Les intérieurs librement parcourables, la vie civile exhaustive et la campagne multijoueur restent séparés. Aucune ancienne version exécutable n’est annoncée capable de lire les nouveaux registres.
