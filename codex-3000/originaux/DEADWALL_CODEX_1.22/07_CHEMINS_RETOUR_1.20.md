# DEADWALL 1.20 — Les chemins du retour

Guide externe de continuation • Codex 500 lieux

## Relier le dehors au dépôt

La 1.20 poursuit l’atlas de la 1.19. Elle ne régénère ni D-17 ni la région et n’ajoute pas de types de lieux. Son objet est de distinguer une arrivée libre d’un chemin réellement trouvé à travers les enceintes jusqu’au dépôt. Un point libre devant un mur n’est pas une preuve de retour possible.
Le contrôle est une lecture des données de la campagne. Il ne déplace pas le commandant, ne pilote pas le break et ne finance aucun chantier. La carte continue d’utiliser 32 unités locales par mètre régional : l’emprise historique de D-17 reste de 128 × 128 mètres. Les gabarits locaux anciens sont conservés, y compris celui du véhicule. Ce travail ne rend pas toute la région constructible.

## Utiliser le contrôle

Ouvrir Carte & exploration, puis D-17 : emprise et jonctions. Dans Jusqu’au dépôt, choisir À pied ou Break et lancer Vérifier les quatre accès. Le contrôle propose un chemin pour chaque jonction où il en trouve un. Afficher sélectionne une jonction et trace son parcours local ; Masquer le trajet efface le diagnostic transitoire.
Le trait plein vert d’eau est le segment contrôlé dans D-17. Les pointillés sont une suggestion routière extérieure. Ils n’attestent ni l’absence d’infectés ni la praticabilité de chaque raccordement. Un repère d’exploration existant reste indépendant : ce panneau calcule un retour seul, sans passage imposé par ce repère.
À l’extérieur, un rappel dans le HUD indique la jonction sélectionnée. À l’intérieur, un tracé au sol peut guider le déplacement manuel. Aucun acteur ne suit le tracé automatiquement.

## Comment un chemin est vérifié

Le moteur vérifie les bâtiments achevés, les portes selon leur mode actuel et les décors de récupération encore solides. Il applique le contrôle de déplacement du piéton ou celui du break, et ne suppose pas que les deux gabarits passent aux mêmes endroits.
La recherche emploie des grilles d’un mètre, décalées de 0, 0,25, 0,5 ou 0,75 m sur les deux axes. Les décalages sont essayés lorsque la première grille manque un passage. Chaque segment proposé est rééchantillonné au plus tous les quatre unités locales, soit 0,125 m. La simplification du tracé doit repasser le même contrôle, sans couper un coin solide.
Une recherche sans solution ne prouve pas mathématiquement l’inexistence de tout passage manuel. Les grilles ont une résolution finie et une limite d’expansion. Les statuts Chemin non trouvé et Limite de recherche doivent rester distincts d’un chemin contrôlé. Le système ne garantit pas un optimum continu de longueur.
La destination est un point de service extérieur du centre, accessible avec le gabarit choisi et suffisamment proche pour les interactions existantes. Il est interdit de terminer le chemin dans le volume solide du bâtiment.

## Cinq approches par jonction

Les quatre jonctions conservent leurs positions historiques et leurs marges de transfert. Le contrôle essaie la ligne centrale, puis des décalages tangentiels de −28, +28, −56 et +56 unités locales. Une approche latérale peut rester libre quand le milieu du passage est bouché.
Le point de retour central n’est pas remplacé silencieusement : les coordonnées proposées utilisent le même contrat de transfert que le déplacement réel. Le joueur doit rejoindre cette approche à pied ou en voiture. Les collisions restent réévaluées lors du franchissement.
Pour le trajet extérieur, le réseau de lecture est découpé autour de l’emprise de D-17. Une suggestion vers la jonction opposée ne peut donc plus utiliser la croix centrale du domaine local comme raccourci régional fictif. Cette découpe ne modifie pas les routes enregistrées ni la génération du monde.

## Ne jamais conserver un faux feu vert

Un diagnostic dépend de la géométrie courante : emplacement, rotation, achèvement ou disparition des bâtiments ; mode des portes ; position, gabarit et épuisement des décors. Un changement de ces données invalide le résultat. Le trait est alors masqué et le panneau demande un nouveau contrôle.
Une petite variation de santé qui ne change pas la solidité d’un bâtiment ne doit pas relancer tout le calcul. Inversement, la fermeture d’une porte doit être détectée même si aucun compteur général de navigation n’a changé. L’empreinte du diagnostic doit donc inclure les états utiles, pas seulement un numéro global.
Les personnages et véhicules mobiles, les tirs et les ennemis ne sont pas prédits par le tracé. Il s’agit d’un constat géométrique, pas d’un statut de sécurité. La pause du commandement permet de lire le résultat, mais les conditions peuvent changer à la reprise.

## Deux domaines, deux calculs de consommation

Le moteur hérité utilise deux débits : en région, 0,004 unité de carburant par mètre réellement parcouru ; dans D-17, 0,003 unité par unité locale parcourue, soit 0,096 par mètre projeté. Cette différence est conservée dans la 1.20 : le diagnostic ne prétend pas avoir harmonisé l’équilibrage historique.
Le nouveau budget additionne la consommation de la route régionale et celle du chemin local jusqu’au dépôt. Il applique ensuite les 25 % de marge et la réserve fixe déjà réglable dans les provisions. Une future harmonisation des débits devra être une décision d’équilibrage explicite, avec reprise des tests correspondants.
Le calcul automobile part de la position du break opérationnel lorsqu’il existe. Marcher loin d’un véhicule garé ne téléporte pas le point de départ de la voiture. En mode piéton, un personnage à l’étage doit d’abord rejoindre le rez-de-chaussée pour obtenir une estimation de retour.
Consulter le budget ne retire ni ne distribue de carburant. Le stock connu n’est pas nécessairement accessible au commandant à cet instant : il faut toujours rejoindre physiquement les bidons ou le véhicule.

## Campagnes et codex conservés

La sauvegarde reste au format v17. Les zooms, mesures, contrôles et trajets choisis ne deviennent pas des ressources persistantes. Un chargement ou une nouvelle campagne efface ce diagnostic ; les prélèvements, relais, bâtiments et stocks conservent leur logique existante.
Ce compagnon préserve les 500 fiches de la 1.19 ainsi que le catalogue, les gabarits et les sources. Il ajoute uniquement ce guide, ses données d’intégration et son propre manifeste. La couverture demeure de 42 plans pilotes et 458 conceptions non intégrées. Le lecteur historique des fiches n’est pas présenté comme entièrement refait.

## Contrôles à poursuivre

Tester une enceinte complètement fermée dont les cases d’arrivée restent libres : aucun trajet ne doit traverser les murs. Ouvrir une seule cellule puis deux cellules : les résultats piéton et break doivent tenir compte des largeurs et de la phase de grille.
Fermer une porte après un contrôle et vérifier immédiatement la péremption ; achever un chantier, déplacer une structure ou épuiser un prop ; confirmer que la lecture n’a modifié aucune sauvegarde. Vérifier aussi les résultats retournés à l’interface : ils doivent être copiés, pour qu’un appelant ne puisse pas altérer le cache de recherche.
Faire revenir une voiture par une approche décalée, suivre le chemin avec les commandes natives, puis décharger un coffre réel au centre. Vérifier séparément l’essence, les stocks et les quantités transférées. Un test ne doit pas déplacer directement le véhicule à la destination pour annoncer que le trajet fonctionne.
Exécuter les parcours desktop et tactile : boutons, focus, calques, ancien carnet, retour depuis l’étage, voiture laissée dehors, reprise et nouvelle campagne. Les scènes préparées doivent être déclarées. Un succès automatisé ne remplace pas des heures de jeu sur toutes les graines ou sur un iPhone physique.

## Consigne pour les prochaines générations

Repartir du projet complet 1.20, pas d’un extrait isolé. Lire AGENTS.md, le brief, le design, l’architecture et l’équilibrage avant modification. Conserver récolte, dépôt, construction, automatisation, défenses, horde et reconstruction.
Les règles du nouveau contrôle sont dans core.js. Le moteur de lecture est dans return-routes.js et le panneau dans return-routes-ui.js. Le rendu du tracé est raccordé à atlas-render.js et au dessin local. Les 500 descriptions de lieux sont un programme de développement, pas un décompte de niveaux jouables.
Toute promesse de monde intégralement continu, de chantier kilométrique ou de parcours garanti doit correspondre à une modification effective de la simulation et à ses tests. Ne pas grossir un symbole ou supprimer un contrôle de collision pour obtenir une capture convaincante.
