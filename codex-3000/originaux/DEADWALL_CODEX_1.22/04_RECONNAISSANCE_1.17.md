# Reconnaissance de proximité — intégration 1.17

Cette édition accompagne les huit plans `basementHouse`, `pharmacy`, `centralKitchen`, `dental`, `reuse`, `freight`, `joinery` et `generatorRoom`. Le jeu possède 42 plans pilotes ; les 458 autres fiches restent des conceptions. Les régions de générations 1 et 2 sont reproduites à l’identique. Seule une nouvelle région de génération 3 ajoute les huit types, sans repeupler les contenants anciens.

## Lire l’action sans inventer de récompense

Le contenant visé doit être accessible depuis le joueur jusqu’à son bord réel : une courte distance à travers un mur ne suffit pas. Lorsqu’il existe plusieurs cibles accessibles, T permet de les parcourir. L’anneau et la quantité affichée correspondent à cette cible. Le stock est prélevé vers le sac, pas vers le dépôt. Les machines dessinées dans les nouveaux lieux restent arrêtées : un four, un groupe électrogène ou un stérilisateur n’ajoute pas un système de production implicite.

Une armoire de médicaments appartient à un espace de soins ou de réserve ; un stock de planches à la menuiserie ; une caisse de denrées au circuit alimentaire. La ressource est attachée à un identifiant stable. La posture prudente, une reprise, l’affichage du plan ou l’éviction du cache ne doit pas modifier ces quantités.

## Bruit, vision et dernier emplacement connu

En région, C active une marche prudente de 1,65 m/s. Le maintien de la course ne la transforme pas en course silencieuse. Les pas prudents produisent un rayon d’audition de 1,8 m contre 7 m pour la marche, 18 m pour la course et 36 m pour la voiture en mouvement. Une fouille active produit 11 m ; les tirs vont de 42 à 62 m selon l’arme. Ces valeurs sont des paramètres de gameplay, pas des mesures acoustiques réelles.

Le bruit est un signal d’IA : aucun nouvel enregistrement sonore de pas ou de moteur n’est livré avec cette passe. Les obstacles réduisent le rayon d’audition à 45 % dans ce modèle simplifié. Un bruit n’alerte pas les ennemis d’un autre étage. Il révèle son point d’émission à l’infecté concerné, pas le déplacement futur du joueur.

La vision demande une ligne dégagée. Sa portée est de 22 m en marche ordinaire et 10 m en posture prudente, avec détection rapprochée à 2,4 m. Une poursuite entretient sa direction ; perdre la cible laisse une mémoire de 12 secondes, puis une recherche brève près de la dernière position. La posture n’est donc pas de l’invisibilité.

## Accès et coût de recherche

Les ennemis suivent la même géométrie que les déplacements : les chemins à travers les cloisons sont refusés. Le contournement local utilise une grille de 0,75 m, un budget de 950 nœuds par recherche et deux nouvelles recherches maximum par pas de simulation. Ces limites peuvent faire attendre un infecté dans un plan très complexe ; ce n’est pas une garantie de chemin optimal ou de navigation de tous les ennemis à travers toute la région.

Les positions, l’état de recherche et la cible mémorisée sont conservés. Les groupes éloignés ne sont pas simulés en continu : l’état est sauvegardé puis repris à proximité. Il est interdit de recréer un ennemi mort, de rétablir sa santé ou d’effacer une poursuite simplement en ouvrant un menu.

## Contrôles à conserver

Vérifier le fonctionnement à pied, au volant et sur plusieurs niveaux ; la portée au bord des objets ; l’absence de récolte à travers un mur ; le cycle de cible sans prélèvement ; l’arrêt de progression lorsque le sac est plein ; la persistance des prélèvements et des ennemis ; le refus d’identifiants et niveaux impossibles avant remplacement du monde ; les emprises des nouveaux props ; la lecture sur écran étroit ; et l’absence de boutons de développement dans le jeu.

Le chantier de la cité et le siège restent dans D-17. La présence d’une menuiserie ou d’un local technique en région ne rend pas la parcelle constructible. Le codex décrit davantage de possibilités que cette implémentation ; ne pas présenter ces possibilités comme des systèmes terminés.
