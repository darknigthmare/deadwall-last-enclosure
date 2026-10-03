# DEADWALL 1.48 — Bastions & ateliers

Cette extension ajoute neuf choix jouables : deux ensembles de chantiers pour D-17, deux montages de pièges, deux profils d’infectés et trois recettes d’armurerie. Les ressources restent dans leurs propriétaires existants : dépôt, sac, râtelier, harnais et réserves de support. Les générations G1–G7, la vision physique des cartes et la sauvegarde générale v20 sont conservées.

## Préparer les accès de D-17

Depuis Commandement → Dossiers → Journée & Bastions, un bureau de chantier achevé permet de choisir l’ensemble, poser son aperçu au sol puis confirmer son financement. L’aperçu ne dépense rien ; le financement paie chaque construction au tarif complet du catalogue. Toutes les fondations demandent ensuite le travail habituel du joueur et des ouvriers.

| Ensemble | Fondations | Coût complet au dépôt | Palier |
| --- | ---: | --- | --- |
| Avant-porte hérissée | 17 | 255 bois, 119 ferrailles, 40 munitions | Camp fortifié |
| Redoute de maintenance | 27 | 270 bois, 520 ferrailles, 105 pierres, 40 munitions, 20 carburants | Avant-poste |

L’avant-porte dispose quatre Hérissons sur les approches latérales, dix palissades et une porte, puis deux miradors en retrait. L’axe central reste libre jusqu’à la porte : les ennemis ne sont pas forcés à traverser les pièges. La redoute dispose deux lignes de dix murs d’acier, deux portes décalées, deux miradors, un générateur, un atelier et un entrepôt. Une allée transversale relie les portes. Ses 520 ferrailles exigent une capacité de stockage déjà suffisante avant l’achat.

Les côtés de ces deux ensembles restent ouverts. Ils ne constituent pas une enceinte fermée et ne règlent pas automatiquement les portes ou les sections. Aucun montage de piège, caisson ou équipier n’est fourni. Les munitions du coût des miradors restent leur coût de construction habituel ; aucun chargeur supplémentaire n’est créé. Les structures n’offrent ni score, ni stockage, ni observation avant leur achèvement.

## Monter des pièges finis

Sélectionnez un Hérisson anti-horde achevé, approchez-le par un accès physique libre puis ouvrez Dossiers → Défenses & ateliers. Le raccourci de placement utilise le chantier de Hérisson ordinaire, avec son coût et son temps habituels. Les montages sont préparés au contact depuis le sac.

| Montage | Coût dans le sac | Travail actif | Déclenchements | Effet |
| --- | --- | ---: | ---: | --- |
| Entrave de cheville | 6 bois, 10 ferrailles | 8 s | 6 | 12 dégâts, ralentissement et délai d’attaque pendant 2,5 s |
| Lames de contact | 6 bois, 18 ferrailles | 12 s | 6 | 28 dégâts par impact |

L’entrave demande le Camp fortifié. Les lames demandent l’Avant-poste et un atelier achevé. Un support ne reçoit qu’un montage à la fois. Les contacts utilisent la distance réelle au bord du Hérisson, une ligne physique libre et un délai global entre impacts : une seconde pour l’entrave, 0,7 seconde pour les lames. Une cible déjà entravée ne consomme pas une seconde charge. Ces dégâts mécaniques ne sont pas réduits par le bouclier d’un infecté.

Le devis capture le support exact, la recette et le point de travail. Menace, blessure, déplacement, tir, recharge, outils occupés, support disparu ou autre activité incompatible interrompent le travail. Le paiement unique a lieu à l’achèvement après revalidation, sans prélever le dépôt. Pause et menus suspendent le temps. Un travail inachevé est annulé au chargement sans débit ; un montage terminé garde ses charges, son délai et ses entraves en cours.

Les pièges terminés restent autonomes si le commandant quitte D-17 ou meurt. Ils ne gagnent ni santé ni recharge automatique. La destruction du support supprime son montage et termine les entraves qu’il maintient. Le reconditionnement demande un nouveau paiement après épuisement et fin des effets actifs ; le retrait ne rembourse pas les matériaux. Les caissons, filets, appoints de terrain et entretien antérieurs restent disponibles.

## Reconnaître les nouvelles menaces

Les deux nouveaux profils redistribuent le budget existant des futures vagues de D-17. Les contacts régionaux conservent leurs profils historiques. Les ajouts n’augmentent pas le total des vagues, ne modifient pas le plafond simultané de 720 ou le tampon de 64 et ne remplacent pas les huit infectés précédents. Leur seuil les rend éligibles, sans garantir leur apparition dans chaque petite vague après arrondi.

| Infecté | Éligibilité | Santé de base | Contrepartie physique |
| --- | ---: | ---: | --- |
| Porte-bouclier | Vague 9 | 90 | Ancien agent avec un bouclier ; lent, flancs et dos exposés |
| Fonceur | Vague 11 | 64 | Prépare une ruée droite, puis doit récupérer ; peu résistant |

Le Porte-bouclier réduit à 35 % les dégâts des balles venant de son arc frontal de ±55°. La direction réelle du projectile ou du poste de tir détermine ce côté. Les tirs de flanc et de dos, la mêlée et les pièges conservent leurs dégâts normaux. Il n’acquiert aucun bonus contre les murs ni charge de corps supplémentaire. Le bouclier est rendu avec son orientation physique.

Le Fonceur reste immobile pendant une préparation de 0,65 seconde, rue tout droit pendant 0,7 seconde à 2,2 fois sa vitesse, puis récupère trois secondes à 55 % de sa vitesse. Il ne tourne pas vers une proie pendant cette ruée. Un obstacle ou une entrave coupe son élan ; portes et murs gardent leurs collisions. Aucun choc ne multiplie ses dégâts ou ne téléporte l’infecté. Sa préparation et sa récupération donnent le temps de se décaler ou de replier une section.

Les constantes, poids et statistiques résident dans `src/core.js`. Le Porte-bouclier part d’un poids de 0,02 à la vague 9, augmente de 0,001 par vague et plafonne à 0,045. Le Fonceur part de 0,025 à la vague 11, augmente de 0,0015 et plafonne à 0,05. Les profils spéciaux partagent toujours au plus 82 % du total. Les multiplicateurs de difficulté et la hausse de santé plafonnée liée aux vagues restent ceux du jeu existant.

## Fabriquer du matériel spécialisé

Dans l’Armurerie, onglet Atelier, choisissez une recette puis laissez le travail avancer dans la simulation près de son support. Les coûts sont prélevés au dépôt une seule fois à l’achèvement. L’objet prêt rejoint le râtelier ; le prendre au dépôt le transfère au harnais sans second paiement et reste limité par la masse portée. Aucun chargeur rempli n’est offert avec une arme.

| Recette | Coût au dépôt | Travail actif | Masse | Condition et usage |
| --- | --- | ---: | ---: | --- |
| Marteau d’assemblage | 4 bois, 12 ferrailles | 7 s | 2,1 kg | Avant-poste, atelier opérationnel ; travaux de barricade ×1,45 |
| Arrache-clous de chantier | 3 bois, 18 ferrailles | 8 s | 3,7 kg | Avant-poste, atelier opérationnel ; démontage des barricades ×1,5 |
| Carabine monocoup récupérée | 6 bois, 18 ferrailles | 7 s | 2,4 kg | Camp fortifié, dépôt accessible ; un coup avant recharge |

Les deux outils exigent le même atelier achevé, alimenté et physiquement accessible durant leur fabrication. Les porter sans les tenir ne donne aucun bonus. Ils s’usent pendant le travail, à 0,18 et 0,22 point par seconde respectivement, et leurs attaques de mêlée sont moins favorables que celles des outils historiques. L’arrache-clous augmente la vitesse du démontage, jamais le remboursement. Les anciennes recettes conservent leur accès au dépôt ; retrait et réparation utilisent également ce service historique.

La carabine a un chargeur d’une cartouche, 68 dégâts de base, une portée de 28 mètres, une cadence nominale de 0,6 coup par seconde et une recharge de 1,9 seconde. Sa faible masse se paie par les recharges fréquentes. Les tirs consomment les munitions et l’usure habituelles. Les caractéristiques affichées viennent du même catalogue que le combat.

Une garde commune empêche désormais la fabrication avec le seau, la pelle ou un outil de chantier actif, pendant une recharge, depuis un poste manuel ou lors d’un travail incompatible. Une interruption ne paie pas une recette inachevée. Les identifiants d’équipement hérités du prototype JavaScript sont refusés avant toute mutation de la sauvegarde.

## Reprise et observation

Les anciennes compositions à huit clés reçoivent deux compteurs nuls ; elles ne retirent aucun nouveau type et n’ajoutent aucun ennemi. Le plan courant, le tampon déjà tiré, son ordre, le timer et la RNG restent enregistrés. Les champs optionnels des nouveaux infectés gardent l’orientation du bouclier et l’étape, la durée restante et l’angle d’une ruée. Les états corrompus sont rejetés avant remplacement du monde. Les recettes utilisent le registre d’armurerie existant et les montages le fitting de fortification existant ; absence de contenu dans une ancienne sauvegarde ne donne rien gratuitement.

Les nouveaux contacts respectent le service commun de visibilité : observateur vivant, portée cohérente, murs, portes, obscurité, étage et intérieur. Un Hérisson n’est pas un observateur. Un mirador financé sans construction ne voit rien. Les cartes ne gardent aucune position ennemie perdue de vue. La simulation des combats reste celle des contrôleurs historiques.

## Vérifier et livrer

```sh
npm ci
npm start
DEADWALL_SOAK=1 npm run check
npm run test:defenses
npm run test:preparations
npm run test:visibility
npm run test:campaign
npm run test:terrain
npm run test:tactics
npm run test:assault
npm run test:browser
npm run test:standalone -- --transport http
npm run package:web
npm run package:source
```

La nouvelle QA distingue le départ joué avec ses vrais stocks et les scènes avancées explicitement préparées pour les défenses, pièges, infectés et recettes. Les parcours natifs ne constituent pas une campagne avancée obtenue organiquement. Les quatre collecteurs d’erreurs, captures et résultats de chaque exécution sont conservés séparément. Les contrôles des outils de livraison ne s’ajoutent pas aux tests du jeu. Seuls les rapports datés de cette version et les contrôles des archives extraites attestent la livraison courante ; les preuves 1.47 restent historiques.

Web/PWA, HTML autonome et Sources disposent chacun d’un manifest SHA-256. La référence 1.47, ses trois ZIP et les références 1.41–1.46 sont préservés. Le HEAD Git historique reste distinct des sources locales cumulatives ; les manifests déclarent leur état modifié. Les silhouettes des outils sont des dessins vectoriels originaux ; aucun asset de tiers ni dépendance supplémentaire n’est ajouté.

La publication autorisée vise le projet existant `https://deadwall-last-enclosure.vercel.app/`. Le jeton se crée sur `https://vercel.com/account/tokens` puis s’ajoute exclusivement sous `VERCEL_TOKEN` dans les secrets de l’environnement. La configuration sauvegardée et le staging local ne prouvent pas un déploiement. Une publication nécessite les accès Vercel réellement appliqués, un résultat distant et la vérification de cette version sur l’origine existante.

Le cloud vérifie Chromium Linux et des formats tactiles simulés. Windows natif, appareils physiques, ouverture directe `file://`, signature, boutiques et campagnes humaines prolongées restent à tester. Les preuves d’HTTP autonome ou de fixtures ne constituent pas une certification commerciale.
