# PR #8 — Faune régionale et paysages reproductibles (189)

Base de travail immuable : `03b72fa1b95f7f11e57d5ee3348ae1ae21cbee5b`. Le 17 octobre 2026, les contrôles applicables de cette base ont été lus comme réussis, y compris `DEADWALL CI` (39000746142), `network180` (39000745915), la ville et l’audit (39000745956). Ce résultat appartient à la base, pas à la présente extension. Aucune fusion ou publication en production n’est réalisée ici.

## Génération

Le menu natif propose **Régions naturelles**, **Grands biomes** et **Mosaïque naturelle**, ainsi que **Paysage historique**. Les trois premiers combinent des champs continus de température, humidité et relief écologique, plusieurs octaves, une déformation spatiale, une orientation et une échelle propres à la graine. Les biomes voisins ont des poids de transition, et non un tirage indépendant à chaque case de chargement. Les voies, les implantations et les corps d’eau conservent leurs générateurs existants, pilotés par la même graine. Une autre taille de biome ne signifie pas une nouvelle topologie routière pour la même graine.

L’inspiration porte sur les principes de paysages cohérents décrits par la documentation Minecraft Creator (Microsoft, « World Generation Overview », https://learn.microsoft.com/en-us/minecraft/creator/documents/world-generation), pas sur une copie de son algorithme ou de ses données. DEADWALL reste une région finie de 24 576 mètres ; le relief climatique n’est pas une montagne voxel ou un terrain 3D libre.

**La graine ET le profil font partie de l’identité du monde.** Le bouton natif tire une nouvelle graine ; un champ vide garde ce comportement au départ. Les mêmes paramètres retrouvent le même paysage. Le choix est conservé dans `frontier.landscape189`. L’absence du champ signifie toujours le générateur historique, sans conversion. La version du format de sauvegarde n’est pas changée : il s’agit d’un champ optionnel strictement validé. Les anciens exécutables ne sont pas annoncés capables de lire ces nouvelles campagnes.

Le menu propose le profil équilibré par défaut. Les appels programmatiques existants à `startNew` sans quatrième argument restent historiques ; un nouveau profil doit leur être passé explicitement. Recommencer la même carte conserve celui de la campagne, et un profil invalide est refusé avant de remplacer la partie.

## Faune des seize biomes

Le catalogue passe de six à **26 espèces jouables**, dont les vingt ajouts suivants : renard, blaireau, lapin, écureuil, hérisson, chamois, mouflon, cerf, corneille, pigeon, faisan, perdrix, chouette, chauve-souris, loutre, castor, grenouille, truite, carpe et mulet. Les six espèces historiques restent inchangées dans les anciennes campagnes. Les dimensions et vitesses sont des profils de gameplay, pas une certification zoologique.

Chaque biome — prairie, verger, feuillus, forêt mixte, conifères, lande, ripisylve, zone humide, bocage, calcaire, relief rocheux, friche urbaine, terrasse alluviale, plateau agricole, pinède sableuse et tourbière — possède ses pondérations explicites. Elles sont complétées par des groupes d’eau douce ou salée quand un habitat réellement présent l’autorise. Un catalogue de possibilités ne garantit pas toutes les espèces dans chaque graine ni dans chaque zone.

Deux origines de groupe au maximum sont recherchées par secteur de population. La seconde privilégie un cours d’eau ou un bassin réellement intersecté, quand il existe. Les membres ont des origines voisines, des identifiants stables et quatre variantes de robe/plumage. Les routes, réservations de bâtiments, refuge et obstacles refusent les apparitions inadmissibles. Le plafond historique de **28 animaux actifs** est conservé ; il ne s’agit pas de charger toute la population mondiale.

### Comportements raccordés

- Terrestres : errance, repos, fuite et collisions physiques.
- Aquatiques : nage seulement dans une eau et une salinité compatibles, contrôles du corps et de la rive ; aucun passage terrestre ou sous un pont assimilé à un sol.
- Amphibies : eau douce et berge proche ; pas de migration vers une zone terrestre lointaine.
- Oiseaux et chauves-souris : vol bas animé en mouvement et traversée des eaux naturelles. Ils restent bloqués par les obstacles solides. C’est une représentation basse dans le monde 2D, pas une navigation au-dessus des toitures ou entre les étages.

Les profils diurnes, nocturnes ou crépusculaires et les pauses d’activité dépendent de l’heure simulée. Une alarme prend priorité sur le repos. Les silhouettes sont procédurales et originales ; le rendu distingue ailes, nageoires, bois/cornes et queues. L’animation dépend du déplacement observé et respecte la réduction des mouvements.

Blessures et morts utilisent le registre existant à six champs, sans nouveau butin. Charger, quitter un secteur ou consulter le Guide ne remet pas les morts à neuf. Les identifiants `A189` sont refusés dans une campagne historique. Les validations de nage gardent les murs et mobiliers bloquants ; seul l’obstacle naturel « eau » est levé pour les espèces autorisées, jamais pour le joueur ou sa voiture.

## Cohérence et compléments

Le profil fait partie des clés de cache du monde, des missions, contenants, équipements, barricades, corps et cartes. Treize contrats isolent les profils avec la même graine et la même génération. Les extensions territoriales tiennent également compte de la mobilité de l’animal au moment de protéger sa position. Le sélecteur est déplacé avec les véritables commandes du menu, sans duplication ni perte d’évènements.

Le Guide reçoit **43 entrées** : 26 espèces, 16 peuplements et les profils de génération. La fiche des six animaux initiaux porte explicitement sur les campagnes historiques. Elle n’annonce plus leurs anciennes limitations comme une description des nouvelles campagnes.

## Validation et limites

Les reçus détaillés sont attachés au commit effectivement testé. Commandes de cette passe : `node --test tests/audit189-*.test.cjs`, régressions historiques écologie/populations/hydrologie, syntaxe, build, et `node scripts/audit-ecology189.mjs`. Le recensement teste les habitats et l’admission physique sur des secteurs échantillonnés à travers toute la région et sur les trois profils ; il n’est pas une campagne jouée.

Le workflow `Seeded biomes and wildlife 189` reconstruit `dist`, exécute ces contrats puis les commandes natives de choix de profil, tirage de graine, sauvegarde/menu/Continuer. Son observation régionale utilise des coordonnées avancées déclarées sur la vraie carte générée, pas des animaux injectés. Le navigateur local a refusé la navigation avec `ERR_BLOCKED_BY_ADMINISTRATOR` ; aucune qualification graphique locale ni contournement n’est revendiqué. Un build local concurrent a été interrompu faute de ressources ; il reste un essai échoué, distinct du build séquentiel relancé.

**Non terminés :** chasse et pêche avec récolte, dépeçage, capture, élevage, reproduction, prédation, migration longue, audio propre à chaque espèce, collisions aériennes en véritable 3D et modèles artistiques définitifs. Aucun de ces systèmes n’est déduit d’une fiche de Guide. La faune reste non agressive. Les anciens chantiers d’intérieurs libres, de vie civile et de campagne multijoueur restent séparés. La CI exhaustive du nouveau commit demeure une condition de fusion.
