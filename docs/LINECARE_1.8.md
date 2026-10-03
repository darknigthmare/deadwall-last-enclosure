# 1.8 — Tenir les remparts

Projet complet dérivé de la livraison 1.7 vérifiée. Pas de réinitialisation des extensions ni de nouvelle carte. Le format de sauvegarde **v8** est conservé : les états modifiés sont l’intégrité, la pression de corps et les ressources déjà présentes. La pelle, le tracé, la sélection et les devis sont transitoires et ne sont pas sérialisés.

## Déblaiement manuel

Pendant le calme et la sécurisation, K ou le bouton du dossier équipe une pelle. Le commandant doit rejoindre la face extérieure d’un rempart, définie comme la face opposée au centre (même règle que les ouvriers). Maintenir ACTION / E retire **1,2 unité de pression par seconde active**. Pas de ressource créée, pas de soin du mur, pas de nouvelle réserve ou de faux PNJ. La pelle est disponible dès le départ, sans achat ni coût de matériau : ses contreparties sont le temps passé à l’extérieur et l’impossibilité de tirer, recharger ou utiliser la crosse pendant son emploi.

Un accès physique dans les 48 unités du point de travail est nécessaire. Un infecté vivant à moins de 110 unités, avec une ligne dégagée vers le joueur ou le point de travail, bloque l’action. Aucune action pendant la pause, un dialogue, la mort du joueur ou un pas de temps invalide. Le pas manuel est limité à 0,25 seconde. La pression ne descend pas sous zéro. Les cadavres visuels sont retirés par le mécanisme natif ; les dépouilles visuelles et les unités de pression n’ont pas toutes un poids identique.

K et Échap rangent la pelle ; sélectionner un bâtiment à construire ou un outil concurrent rend également la main. L’alerte range automatiquement la pelle, libère les entrées et rend les armes disponibles. L’extinction, les relevés, la voirie et le déblaiement n’opèrent pas simultanément sur E.

Les ordres des ouvriers dans le dossier appellent les commandes existantes `clear`, `retreat` et `auto`. Aucun recrutement ni affectation persistante supplémentaire n’est créé. L’ancien déblaiement des ouvriers refuse désormais aussi les pas non finis et les références absentes, au lieu d’effacer immédiatement un amas avec un pas infini.

## Diagnostic structurel

Une recherche cardinale bornée à la grille 128 × 128 cherche un accès ouvert depuis le bord vers l’emprise du centre. Les murs achevés et les portes automatiques ou verrouillées bloquent le diagnostic ; une porte ouverte à tous le laisse passer. Le résultat est recalculé lorsque la version de navigation change, pas à chaque image.

Ce diagnostic a volontairement le même sens que l’analyse historique des enceintes. Il ne compte pas des « enceintes garanties », ne prédit pas les combats et n’utilise pas le coût de navigation des infectés. Les bâtiments non muraux et les rampes de corps ne sont pas des obstacles de cette recherche. Le tracé est **un accès structurel**, pas le chemin exact de la horde. Le commentaire est affiché dans l’interface.

Deux anneaux fermés restent protecteurs si l’anneau extérieur seul est ouvert. Retirer uniquement un coin ne crée pas un passage cardinal entre deux murs adjacents. Ce dernier point a corrigé une hypothèse du premier test, pas un bug du jeu.

La carte propose un cadrage cité ou carte entière. Un affichage facultatif au sol montre le tracé et les états de remparts : rouge pour une intégrité au plus 30 %, ocre pour une pression strictement supérieure à 15, cyan pour une porte ouverte. Au-delà de 32 unités de pression, le seuil de tous les infectés récents et rampants est dépassé. Aucun autre type de zombie n’est déclaré capable de franchir un amas.

## Réparations choisies

Le dossier classe les remparts par risque, avec filtres de front et d’état, dix lignes par page et jusqu’à 32 structures sélectionnées. Le devis est la somme des coûts **individuels historiques**. Il ne remplace pas la réparation d’urgence globale ni ses tarifs.

Calculer ne dépense rien. La confirmation recalcule les coûts et vérifie les identifiants, l’implantation, le type, la rotation, l’avancement et l’intégrité de chaque mur. Une différence, une cible absente ou des réserves insuffisantes refusent l’ensemble sans prélèvement. L’API ne prend pas un coût proposé par l’appelant : elle conserve une empreinte privée et recalcule depuis le jeu.

Après paiement unique, les remparts sélectionnés sont réparés instantanément, comme avec les réparations individuelles existantes. Les corps, feux, portes et autres structures restent inchangés. Le devis expire lorsqu’on ferme le commandement, annule, change de campagne, importe ou retourne au menu. Un défaut de stockage après une réparation est signalé ; l’action reste en mémoire.

## Sources et vérification

- `src/core.js` : constantes.
- `src/linecare.js` : recherche, tri, devis, transactions et raccordements au moteur.
- `src/linecare-ui.js`, `finish.css` : dossier, carte, contrôles, pagination et accessibilité.
- `tests/linecare.test.cjs` : logique et vrais objets de simulation avec DOM minimal.
- `tests/browser-linecare.mjs` : quatre contextes Chromium indépendants sur le vrai moteur et les atlas.

Les anciennes suites Node, les quatre parcours d’intégration 1.7 et les essais de distribution ont été rejoués sur la 1.8. Les situations avancées sont préparées par les scripts : les captures ne sont pas présentées comme les résultats d’une campagne humaine. Pas de validation Safari/iOS, Firefox ou Electron empaqueté, ni garantie de FPS ou d’équilibrage de plusieurs heures.
