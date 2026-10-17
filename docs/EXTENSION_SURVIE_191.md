# Récoltes sauvages et enclos régionaux

Ces activités prolongent la boucle explorer → rapporter des provisions → financer et entretenir le refuge. Les nombres 189, 190 et 191 identifient les modules techniques. Ils ne désignent pas une certification commerciale ou une nouvelle génération de terrain.

Dans **Opérations → Expéditions**, ouvrir **Récoltes sauvages** ou **Enclos & transformation**. La chasse et la pêche exigent une région avec hydrologie et faune. Les enclos et les comportements naturels concernent les campagnes **Régions naturelles**, **Grands biomes** et **Mosaïque naturelle**. Une ancienne sauvegarde garde son terrain et son peuplement ; la consulter ne la convertit pas.

## Chasse et pêche

Le joueur chasse avec les armes existantes. Une dépouille visible, accessible et encore exploitable peut être préparée avec un couteau ou une machette équipé et en état. Le travail prend du temps, use l’outil et produit du bruit. Les provisions obtenues occupent le sac et doivent être rapportées au dépôt. Les rendements finis de chaque espèce sont ceux de `WildlifeHarvest190Rules.yields` ; toutes les espèces ne donnent pas de nourriture. Une dépouille épuisée ne se renouvelle pas au chargement.

La pêche vise un poisson vivant réellement présent dans une eau compatible, depuis la terre ferme et avec une ligne libre, à sept mètres au maximum. Préparez le volet **Terrain & trajet** avant l’approche : le poisson reste libre et peut fuir hors de portée avant l’engagement de la ligne. Chaque tentative engage du bois, de la ferraille et de la nourriture transportés. Bouger, se blesser, changer d’outil ou se retrouver menacé peut interrompre une intervention. Le matériel de pêche engagé reste consommé ; une interruption n’accorde pas de nourriture. La pêche ne permet ni de nager ni de traverser l’eau avec le commandant.

La préparation sauvage donne directement des unités abstraites de provisions. La filière de viande brute, peaux et cuir décrite ci-dessous appartient aux enclos ; une carcasse sauvage n’alimente pas automatiquement ces stocks.

## Installer et entretenir un enclos

Un enclos est construit sur le sol régional sec au nord du commandant, avec accès au sud. Ses matériaux viennent du sac. Routes, refuge, obstacles, occupants et véhicules garés doivent laisser son emprise libre. La clôture constitue un obstacle physique ; elle ne fournit pas un écran opaque aux tirs. Le nombre de sites, leurs capacités et leurs coûts sont centralisés dans `Husbandry191Rules`.

Le filet permet uniquement la capture du lapin de garenne, du canard colvert, du lièvre, du faisan et de la perdrix. L’animal doit être vivant, visible et accessible à proximité immédiate d’un enclos compatible. Une capture engage des fournitures et du temps sur place. Le transfert est une abstraction locale : aucun transport d’animaux en cage ou convoi n’est simulé. Un animal conserve son identité et sa proportion de santé ; il ne peut pas être simultanément libre, captif et récoltable.

Chaque site reçoit une seule espèce. Il faut lui apporter des rations et puiser de l’eau douce réellement accessible depuis son entrée. Aucun puisage à distance ni ravitaillement automatique par les ouvriers n’est fourni. L’entretien avance pendant le temps simulé, y compris après le retour du joueur à D-17 ; il s’arrête en pause et n’accorde pas de rattrapage hors ligne. Sans nourriture ou eau suffisantes, la santé baisse. Une mort de négligence ne donne pas de viande ou de peau.

Seuls les lapins et canards peuvent se reproduire : deux adultes de sexes différents, en bon état, nourris et abreuvés, attendent quinze minutes simulées éligibles. Une naissance consomme des réserves supplémentaires. Le jeune doit ensuite atteindre quinze minutes simulées pour devenir adulte. Lièvres, faisans et perdrix restent capturables sans reproduction. L’existence d’une fiche de faune pour une autre espèce ne la rend pas capturable.

Les infectés réellement au contact peuvent endommager la clôture. Une destruction libère les sujets issus du monde sauvage si leur ancienne position reste libre, avec leur santé conservée ; les descendants sont enregistrés comme dispersés hors de la simulation détaillée. Si une origine est occupée, le sujet reste sous votre garde dans la ruine : son entretien, son âge et sa santé continuent d’évoluer. Il peut être libéré après dégagement de cette origine, ou réinstallé par reconstruction. Une clôture détruite peut être reconstruite sur place après dégagement de son emprise, avec paiement et sans rajeunir les animaux. Les stocks périssables continuent de vieillir même dans un enclos détruit.

## Transformer les produits

La transformation d’un captif adulte exige un couteau ou une machette équipé, du temps et de la place dans le stock du site. Les quantités de `Husbandry191Rules.captive` sont :

| Espèce | Viande brute | Peaux brutes | Reproduction |
| --- | ---: | ---: | --- |
| Lapin | 2 | 1 | Oui |
| Canard | 2 | 0 | Oui |
| Lièvre | 3 | 1 | Non |
| Faisan | 2 | 0 | Non |
| Perdrix | 1 | 0 | Non |

La cuisson consomme le carburant transporté et transforme de la viande du site en provisions dans le sac, selon sa place restante. Le tannage consomme une peau, de l’eau du site et du carburant pour produire du cuir stocké sur place. Le cuir permet la réparation de la clôture ; il n’existe pas encore de garde-robe en cuir ou de vente de produits.

La viande brute se dégrade après quinze minutes simulées et les peaux après trente minutes. Ajouter des produits ne repousse pas l’échéance des anciens stocks. Ces produits bruts restent sur le site : aucun transfert dans un coffre ou sac spécialisé n’est proposé. Une opération interrompue ne rembourse pas les fournitures déjà engagées, et une reprise ne relance pas gratuitement un travail inachevé.

## Comportements naturels facultatifs

La prédation et la défense du sanglier sont **désactivées au départ**. Leur activation volontaire se trouve dans **Enclos & transformation**. Elle est conservée pour la campagne et ne change ni la graine ni les biomes.

Le renard et la chouette peuvent poursuivre certaines petites proies réellement actives à proximité. Les obstacles, distances, dégâts et délais entre attaques restent appliqués. Un sanglier blessé et alarmé peut riposter au contact du commandant. Il ne s’agit pas de prédateurs attaquant tous les habitants ou d’un nouveau directeur de hordes.

Les appels d’animaux sont des sons synthétiques stylisés, soumis au volume, à la distance, à l’heure et aux obstacles existants. Les poissons ne vocalisent pas. Les silhouettes procédurales proposent quatre variantes par espèce et respectent la réduction des animations. Aucune fidélité zoologique ou cadence sur téléphone physique n’est certifiée par ces descriptions.

## Persistance et limites

Blessures, morts, prises déjà récoltées, garde des captifs, descendants et stocks sont sauvegardés dans leurs registres existants. Une consultation du Guide n’offre ni animal ni ressource. Les 43 fiches d’écologie distinguent les espèces capturables, leurs produits et leurs limites de reproduction.

Les animaux issus du monde sauvage peuvent être libérés avec leur santé réduite par la captivité. Les jeunes nés en enclos ne sont pas encore réintroduits comme animaux sauvages détaillés. Migrations longues, prédation entre secteurs déchargés, PNJ éleveurs, transport de bétail, élevage hors ligne et navigation aérienne au-dessus des toitures restent à développer. Les résultats de validation de la révision livrée sont consignés séparément ; ce document décrit les règles et les limites du contenu.
