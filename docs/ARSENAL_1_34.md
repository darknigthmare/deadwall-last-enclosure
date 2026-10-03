# Armurerie et défenses de terrain — 1.34

L’armurerie contient **37 profils jouables** : 18 armes à feu, 6 armes de mêlée, 4 armes de fortune, 5 outils et 4 postes déployables. Les trois armes historiques font partie de ces 37 profils ; les 34 autres sont nouvelles. Les valeurs sont des valeurs de jeu, sans vocation de référence technique réelle.

## Accès et progression

Ouvrir Opérations → Armurerie & défenses → Ouvrir l’armurerie. Les onglets distinguent Harnais, Râtelier, Atelier et Postes déployés. Les cartes montrent portée, impact, cadence, masse, chargeur, recharge et usure. Les illustrations SVG sont originales et schématiques. Elles identifient les familles ; il ne s’agit pas de 37 sprites photoréalistes propres à chaque arme.

La préparation s’effectue physiquement près du dépôt accessible de D-17. Le palier de campagne, les matériaux disponibles, l’absence de danger et la liberté des mains sont contrôlés au début et à la fin du travail. Le joueur ferme l’interface et reste sur place pendant l’assemblage. Déplacement, dégâts et décès interrompent sans prélever les matériaux. Les coûts sont payés une seule fois à l’achèvement. Les armes sont ajoutées vides au râtelier. Les outils et postes peuvent ensuite être pris dans le harnais, limité à 22 kg. Ce portage est affiché dans l’inventaire existant.

## Tir et contact

Chaque exemplaire garde son identifiant, son état et ses cartouches. Le moteur conserve les trois emplacements historiques uniquement comme interface technique pour le tir existant ; ils ne constituent pas des possessions supplémentaires. Équiper une arme échange son chargeur exact sans conversion, duplication ni recharge gratuite. Les armes utilisent les munitions transportées, ou le dépôt lorsqu’il est physiquement accessible, suivant les règles déjà installées. Les cartouches de certaines armes consomment deux ou trois unités abstraites de munition.

Les armes de contact prennent en compte portée, arc, angle du personnage, obstacle, étage, nombre limité de cibles, endurance et délai entre frappes. Clic ou Espace déclenche la frappe. Une arme usée à zéro refuse de tirer ou de frapper. Les impacts usent les armes à feu par tir ; les gestes de mêlée s’usent même s’ils manquent leur cible. La réparation au dépôt paie des pièces et restaure l’état sans ajouter de cartouches. Le nettoyage de mécanisme historique aide seulement huit rechargements et reste distinct de cette réparation.

Les outils restent compatibles avec les systèmes existants : hachette sur bois, pioche sur pierre, pied-de-biche sur ferraille ; le marteau accélère les barricades, et le pied-de-biche leur démontage. Leur efficacité exige l’outil fonctionnel en main et entraîne une usure supplémentaire. La pelle de l’armurerie n’active pas un deuxième mode K : le mode déblaiement historique conserve sa commande et ses règles.

## Postes défensifs

Les quatre postes se déploient **à D-17** devant le personnage, sur un sol et un accès libres. Ils sont dessinés dans le tri de profondeur du terrain, y compris depuis la projection régionale du bastion. Les trépieds sont des petites installations passables ; ils ne créent pas de collision invisible. Les trois postes de tir consomment exclusivement les cartouches préalablement chargées au contact depuis le sac. Les armes lourdes demandent davantage d’unités de munitions par cartouche. Le chevalet à pointes agit au contact sans munitions.

Les postes subissent l’attaque des infectés proches, l’usure de leurs actions, et respectent la ligne de vue. Les postes de tir respectent aussi la visibilité des nuits noires ; le chevalet peut réagir au contact dans l’obscurité. Un poste vide, cassé ou détruit cesse d’agir. Le ramassage conserve les cartouches et reporte l’intégrité perdue sur l’état de l’objet afin d’empêcher une réparation gratuite par redéploiement. Une épave se déblaye au contact pour libérer l’un des 32 emplacements. Il n’existe pas de remboursement automatique à distance.

## Mort, relève et sauvegarde

Les armes, outils et défenses encore portés sont déplacés une fois dans le sac de la dépouille. L’état et les cartouches restent identiques. La relève arrive sans ces possessions. La récupération exige le même lieu, le même étage, un accès physique et la sécurité déjà définis par la succession ; le reliquat trop lourd reste au sol. Les postes installés et les équipements rangés au dépôt restent attachés à leur lieu.

Les anciennes sauvegardes migrent leurs trois armes réellement détenues. Les anciens sacs de dépouille sont convertis au moment de leur récupération. Les cartouches seules, sans arme correspondante, deviennent des unités de munitions dans le sac de la dépouille avec leur coût historique. Les contrôles refusent doublons d’exemplaire, surpoids, état invalide, références à une dépouille absente, incohérence du chargeur actif et armes portées par un joueur déclaré mort.

## Fichiers et ordre d’intégration

Les valeurs sont centralisées dans `DeadwallCore.Arsenal134Rules`. Charger `arsenal134.js` après `succession133.js` et les opérations ; charger `arsenal-ui134.js` après le contrôleur. Inclure `arsenal134.css` dans le build, le standalone et le cache. La nouvelle persistance appartient au module versionné `expansions127.modules.arsenal134`.

Le travail ne remplace pas une campagne humaine longue d’équilibrage : les rôles et coûts ont été contrôlés par tests ciblés et intégration, avec les limites visuelles précisées dans le rapport de livraison.
