# Contrat de l’extension Services essentiels

## Source de vérité

Les 12 programmes sont dans `essential-content.js`. Les règles d’équilibrage sont centralisées dans `core.js` puis injectées au registre `essential-state.js`. Les missions ne reconstruisent pas le monde : elles sélectionnent un bâtiment existant, une pièce et un meuble de la génération courante. Les douze sources sont distinctes et stables sur une graine. Les trois générations sont couvertes ; les bâtiments récents ont des types de repli plus anciens.

## Machine d’état

Une mission n’existe pas encore dans le registre avant le relevé. Après quatre secondes actives à portée du meuble : `surveyed`. Après la dépose et le paiement des outils : `player`. Transfert dans le râtelier du véhicule : `car`, avec identifiant du véhicule. Perte au sol : `ground`, avec domaine, coordonnées, niveau et intérieur. Livraison : `delivered`, état final unique.

Le commandant et le break disposent chacun d’une seule place technique. Cette place ne doit jamais être présentée comme le sac de ressources habituel. Le module au dos réduit la vitesse à 78 % et empêche le sprint. La livraison produit deux kits finis issus du lot, et ouvre la recette ; aucun butin générique n’est reconstitué. Le meuble source continue d’exister et ses ressources ordinaires restent indépendantes.

Les tâches temporaires mémorisent origine, santé et temps actif. Elles sont annulées sur déplacement, rechargement, tir, dégâts ou condition devenue fausse. Les coûts sont prélevés au dernier contrôle, pas au clic. La progression n’est pas reprise après chargement, sans remboursement puisqu’il n’y avait pas de prélèvement initial.

## Inventaires et appareils

Stock : au plus 32 kits par famille. Ceinture : au plus huit au total. Seules les clés light, aid, brace et decoy sont acceptées. Les dispositifs déployés ont un identifiant unique, une position, un domaine et un niveau, un temps restant et une pulsation. Maximum six actifs. Le rendu n’avance pas leur durée ; la simulation active le fait.

Lampe : 60 s, rayon de 10 m en région ; même conversion ×32 dans D-17. Les murs occultent sa lumière et les défenses utilisent cette source au cours des nuits noires. Elle n’augmente pas la production électrique.

Relève : au maximum 40 points de vie par personne et 120 par utilisation dans la cité, avec distance et ligne de vue. En région, seul le commandant est éligible. La trousse ne ranime pas et ne dépasse pas la santé maximale.

Étai : jusqu’à 160 points d’intégrité sur une défense murale ou une porte achevée, endommagée, vivante et atteignable. Ne fonctionne que dans D-17 ; ne change pas le maximum ni le passage physique.

Diversion : point sonore régional fixe, durée 18 s, rayon 38 m, atténuation par la géométrie existante. Les infectés peuvent abandonner cette recherche s’ils revoient le joueur. Pas d’effet sur la horde globale de D-17.

## Sauvegarde

Le format v19 ajoute `essentials`. Les versions v1–v18 migrent avec un registre vide. La reprise de l’atlas accepte toutes les versions à partir de la v18 jusqu’à la version courante, pour ne pas jeter silencieusement ses données. Les relais sont préservés par leur validation existante. Les points et quantités non finis, objets hors étage, doubles modules, familles non acquises et faux identifiants sont refusés avant remplacement du monde.

## Validation et preuves

Les tests incluent toutes les étapes des 12 missions, les trois générations de monde, le portage, les pertes, les reprises, les kits, la lumière opaque aux murs, la perception sonore et les refus économiques. Les scènes avancées sont préparées pour isoler ces mécanismes. Le test navigateur nocturne fixe explicitement l’opacité et prépare les équipements pour mesurer la visibilité ; il ne représente pas une campagne gagnée sans assistance.
