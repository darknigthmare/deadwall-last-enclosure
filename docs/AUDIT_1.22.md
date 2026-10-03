# Audit et périmètre — 1.22 Les services essentiels

L’objectif n’est pas de déclarer tous les points faibles résolus. Cette passe se concentre sur le manque d’objectifs propres aux lieux, la faible conséquence des trouvailles sur la défense de nuit, et le manque de choix tactiques préparés pendant le jour.

| Point faible vérifié dans la base | Modification livrée | Ce qui reste ouvert |
|---|---|---|
| Les lieux régionaux proposent surtout des ressources génériques et le carnet de tournée | 12 récupérations, 12 notes d’anciens occupants, matériel et accès propres à chaque emplacement | Pas 12 nouveaux bâtiments ou PNJ ; 42 plans régionaux conservés |
| Une carte très grande manque de raisons d’effectuer plusieurs retours | Module à rapporter physiquement ; livraison unique ; première livraison ouvrant la recette correspondante | Pas de campagne scénarisée complète avec une fin, pas de passage au chantier régional |
| Exploration et défense de nuit restent faiblement liées | Éclairage temporaire, trousse de relève, étai et diversion fabriqués après récupération | Pas de refonte du directeur de horde ou des statistiques ennemies |
| Les grandes fouilles ont peu de cargaisons distinctives | Porte-module unique au dos et râtelier unique dans le break ; ralentissement ; récupération au sol après perte | Les places techniques sont séparées du sac de ressources ; pas un inventaire volumétrique |
| Manque d’interventions ponctuelles pendant une brèche | Étai au contact d’un mur/porte endommagé, soins de proximité, éclairage pour les défenseurs | Pas de nouvelles capacités gratuites permanentes ou résurrection |
| L’inventaire est partagé entre de nombreux panneaux | Une section optionnelle dans la carte, filtre de spécialité et panneau matériel repliable | L’architecture globale des anciens menus n’est pas entièrement refondue |
| La sauvegarde pourrait dupliquer les bénéfices d’une intervention | Étapes explicites, paiement au terme du travail, livraison unique, compteurs validés, effet restant sauvegardé | La sauvegarde n’est pas un mécanisme anti-triche contre un fichier modifié hors validation |
| La torche locale du joueur était encore présente pendant son absence régionale | Retrait de cette source fantôme et test dédié | Pas d’audit artistique exhaustif de chaque point lumineux du monde |

## Deux corrections détectées par les nouveaux tests

Le compteur de pulsation des lampes pouvait devenir négatif et rendre leur sauvegarde invalide. Il est maintenant borné. Les clés de familles de kits sont contrôlées par liste stricte : une propriété héritée d’objet JavaScript ne doit pas devenir une recette. Les tests vérifient ces cas plutôt que de relâcher les validateurs.

## Limites majeures non résolues

L’emprise de construction de D-17 reste de 128 × 128 mètres projetés. La région de 8,192 km de côté reste un domaine d’exploration distinct. Une véritable croissance urbaine sur plusieurs kilomètres nécessite une migration et une architecture de secteurs constructibles ; grossir la carte ou le symbole du refuge ne suffit pas.

Le contenu des 500 fiches du codex n’est pas entièrement instancié : 42 plans pilotes restent intégrés, les autres conceptions servent aux futures générations. Le peuple vivant des régions, des intérieurs très variés, des activités civiles complètes, la destruction structurelle, les partenaires d’expédition et une coopération réseau ne sont pas ajoutés ici.

Les identités graphiques des anciens bâtiments du refuge sont conservées. Les nouveaux marqueurs de matériel et dispositifs sont des dessins Canvas, pas une nouvelle collection de sprites animés. Les signaux de bruit emploient l’IA existante ; aucun enregistrement sonore nouveau, voix ou doublage n’est promis.

Les longues campagnes sur toutes les graines, l’équilibrage humain des kits et les performances sur des machines modestes restent des travaux à part entière. Les quatre profils QA sont automatisés et utilisent des scènes préparées, pas quatre personnes.
