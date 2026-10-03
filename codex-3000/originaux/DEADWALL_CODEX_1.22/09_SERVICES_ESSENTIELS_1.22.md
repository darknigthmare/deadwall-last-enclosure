# DEADWALL 1.22 — Les services essentiels

Extension du jeu complet 1.21. Ce guide accompagne le codex externe ; il n’ajoute pas de menu développeur au jeu.

## Périmètre

La 1.22 ajoute douze récupérations spécialisées, quatre familles de kits et leur chaîne physique de retour. Les trois générations régionales restent conservées. Les 42 plans pilotes et les 500 fiches de lieux ne sont pas remplacés. Les 458 autres conceptions ne sont toujours pas annoncées comme du contenu jouable.

L’emprise constructible de D-17 demeure 128 × 128 mètres projetés. La région de 8,192 km de côté reste un domaine d’exploration. Cet ajout ne transforme pas cette région entière en chantier de métropole.

## Jouer la chaîne complète

Dans Commandement → Terrain → Carte & exploration, ouvrir Les services essentiels. Sur tactile, utiliser ACTIONS. Un lieu exact ne s’affiche qu’après sa découverte physique ; le guide de spécialité indique seulement des types de bâtiment à chercher.

Approcher le meuble marqué et lancer Examiner : quatre secondes actives. La note devient lisible après le relevé. Déposer ensuite le module avec les consommables requis dans le sac. Le paiement se produit uniquement à la fin du travail. Bouger, tirer, subir des dégâts, recharger ou perdre l’accès l’interrompt sans débit ; le progrès temporaire est abandonné à la reprise.

Le commandant a un porte-module au dos, le break un râtelier. Une place par porteur, séparée des ressources ordinaires. Le portage au dos réduit la vitesse de 22 % et empêche le sprint. Charger ou reprendre exige le véhicule proche, au bon niveau et par un passage libre. Une mise à terre du commandant ou une destruction du véhicule laisse le module au sol, avec une position persistante.

La livraison demande de rejoindre le dépôt de D-17. Chaque module ne se livre qu’une fois. Le lot récupéré fournit deux kits finis de sa famille. La première livraison ouvre sa recette ; les suivantes ne créent pas des bonus permanents supplémentaires.

## Consommables et temps de dépose

| Famille | Coût dans le sac | Durée |
|---|---|---:|
| Éclairage | 3 ferrailles | 8 s |
| Soins | 1 médicament + 2 ferrailles | 7 s |
| Renforcement | 4 bois + 2 ferrailles | 10 s |
| Diversion | 4 ferrailles + 1 carburant | 9 s |

Le relevé et la dépose se font le jour, à portée du meuble et sans infecté visible à proximité immédiate. Les outils ne sont pas prélevés dans un dépôt éloigné.

## Douze programmes de récupération

### La lampe du dernier quart

Identifiant : `light-grid`. Spécialité : Éclairage. Source narrative : Émile, électricien.

Implantation : Local groupe électrogène ; garage ou entrepôt en repli.

Un ballast portable resté près du groupe arrêté. Le rapport ne remet pas le site sous tension.

### Les sorties balisées

Identifiant : `light-exit`. Spécialité : Éclairage. Source narrative : Mina, responsable des locaux.

Implantation : École, bibliothèque ou mairie.

Les balises laissées après l’évacuation servent à préparer le chemin de retour ; elles ne certifient pas la sûreté de la rue.

### La réserve des ampoules

Identifiant : `light-stores`. Spécialité : Éclairage. Source narrative : Louis, magasinier.

Implantation : Magasin de bricolage, supermarché ou centre commercial.

Les boîtiers d’atelier sont encombrants. Leur intérêt vient du retour au dépôt et du tri, pas d’une caisse récompensée à distance.

### Le plateau propre

Identifiant : `aid-clean`. Spécialité : Soins. Source narrative : Nora, soignante.

Implantation : Cabinet dentaire ou dispensaire.

Les plateaux propres doivent rester distincts du matériel utilisé. Aucun remède à la contamination n’est ajouté.

### La relève des soigneurs

Identifiant : `aid-shift`. Spécialité : Soins. Source narrative : Ada, assistante.

Implantation : Clinique vétérinaire, dispensaire ou hôtel.

Le nécessaire du personnel est récupérable. Les occupants absents et les animaux ne sont pas déclarés sauvés.

### Le casier des nuits longues

Identifiant : `aid-shelter`. Spécialité : Soins. Source narrative : Samir, veilleur.

Implantation : Abri, caserne de pompiers ou hôtel.

La liste de relève rappelle qu’il faut vérifier les personnes avant le registre. Le matériel mobile complète les soins existants.

### Les bastaings secs

Identifiant : `brace-timber`. Spécialité : Renforcement. Source narrative : Jeanne, cheffe de chantier.

Implantation : Scierie ou entrepôt.

Ferrures et cales conservées sous couverture. Le kit répare une structure ; il ne change pas son intégrité maximale.

### Le gabarit de réparation

Identifiant : `brace-joinery`. Spécialité : Renforcement. Source narrative : Paul, menuisier.

Implantation : Menuiserie, bricolage ou maison.

Un gabarit et des attaches permettent de préparer une intervention plutôt que de chercher les outils sous la pression de la nuit.

### L’atelier du quai

Identifiant : `brace-freight`. Spécialité : Renforcement. Source narrative : Rosa, manutentionnaire.

Implantation : Halle de fret, entrepôt ou garage.

Les tendeurs intacts sont séparés des sangles usées. Le programme respecte la disposition fonctionnelle d’un atelier de manutention.

### La sirène muette

Identifiant : `decoy-alarm`. Spécialité : Diversion. Source narrative : Luc, mécanicien.

Implantation : Caserne de pompiers ou garage.

Le boîtier indépendant sert à préparer une diversion sonore. Il ne bloque pas les infectés qui voient le commandant.

### Le dernier appel

Identifiant : `decoy-post`. Spécialité : Diversion. Source narrative : Iris, agente du tri.

Implantation : Bureau postal, mairie ou école.

Le petit module d’annonce peut fonctionner sans le standard. Ce n’est pas une nouvelle radio de communication avec des PNJ.

### La ligne des poids lourds

Identifiant : `decoy-road`. Spécialité : Diversion. Source narrative : Malik, dépanneur.

Implantation : Garage, station-service ou entrepôt.

Un avertisseur permet de produire un bruit distinct du moteur. Le joueur doit s’éloigner du point où il l’a posé.

## Recettes et usages

Toutes les fabrications demandent cinq secondes au dépôt, pendant le jour et à pied. Les réserves centrales paient à l’achèvement ; une interruption ne prélève rien. Équiper ou ranger transfère exactement un kit. La ceinture est limitée à huit kits au total ; le dépôt accepte 32 kits par famille. Un kit ne peut pas être utilisé s’il n’est pas porté.

### Lampe de secours

Recette : 5 ferrailles + 2 carburants. Durée : 60 secondes.

Rayon de 10 m en région. Dans D-17, conversion en unités locales ; participe à la visibilité des défenses. Murs occultants, aucune production électrique.

### Trousse de relève

Recette : 6 médicaments + 2 rations. Durée : Utilisation ponctuelle.

Jusqu’à 40 vie par personne, 120 au total dans la cité, avec distance et ligne de vue. En région : commandant seulement. Aucune résurrection.

### Étai de brèche

Recette : 12 bois + 6 ferrailles. Durée : Utilisation ponctuelle.

Jusqu’à 160 intégrité sur un mur ou une porte achevé, endommagé et atteint physiquement. Maximum inchangé, D-17 uniquement.

### Avertisseur déporté

Recette : 8 ferrailles + 1 carburant. Durée : 18 secondes.

Signal régional fixe de 38 m, atténué par les obstacles. Pas un aimant sur la horde globale ; un infecté qui revoit le joueur peut le poursuivre.

Maximum six dispositifs temporaires actifs. Leur durée avance dans la simulation, pas lors du rendu ou pendant la pause. Les effets sont enregistrés avec le temps restant ; charger ne les remplit pas et n’en crée pas un second. Les signaux sonores utilisent l’IA existante, sans nouveau doublage ou enregistrement promis.

## Données et sauvegarde

Le format v19 ajoute un registre essentials. Les formats v1 à v18 migrent avec un registre vide : aucun objectif accompli, aucun kit et aucun dispositif offert. Conserver un export d’origine : la 1.21 ne relit pas la v19.

La reconnaissance régionale et les relais gardent leurs registres. Le chargement ne doit pas confondre la version d’introduction d’un module avec la seule version autorisée. Une position non finie, une famille inconnue, un niveau absent, une ceinture surchargée ou un deuxième module sur le même porteur sont refusés avant remplacement de la campagne.

Étapes autorisées : absence de registre → surveyed → player / car / ground → delivered. Le passage de player à car transporte l’identifiant du même module. Un module livré ne retourne pas au terrain. Le meuble et ses ressources ordinaires restent des objets indépendants ; il ne faut ni les recréer ni les créditer lors de la livraison technique.

## Contrat pour les prochaines générations

L’implantation sélectionne un lieu existant compatible, puis un meuble existant, sans consommer l’aléatoire du combat. Les douze lieux sont distincts et la sélection est déterministe pour une graine et une génération. Le dessin ne crée pas de collision supplémentaire au-dessus du meuble.

Les valeurs d’équilibrage restent dans core.js. Les règles d’état sont dans essential-state.js, les contenus dans essential-content.js, la simulation dans essential-ops.js, le rendu dans essential-art.js et l’interface dans essential-ui.js.

Préserver les distinctions entre regard et acquisition, stock et ceinture, véhicule et personnage, carte et déplacement, diagnostic et action, note narrative et PNJ présent. Les auteurs des notes sont des traces fictionnelles ; leur existence ne signifie pas qu’une mission de sauvetage a été jouée.

Une extension urbaine réelle devra définir de nouvelles limites constructibles, les flux de navigation, les coûts de simulation et une migration explicite. Elle ne doit pas simplement grossir D-17 sur l’atlas. Les soins ne guérissent pas la contamination. L’étai ne rend pas les murs invulnérables. La lampe ne crée pas de courant dans les industries.

## Audit des points faibles

### Des lieux intéressants à fouiller, mais peu d’objectifs propres à leur activité

Livré : 12 programmes rattachés à des meubles existants, notes, relevés et modules uniques.

Limite : Pas de nouveaux bâtiments, d’occupants vivants ou de 500 cartes intégrées.

### Peu de conséquences directes des expéditions sur la défense nocturne

Livré : Les modules ouvrent quatre recettes et fournissent un petit lot fini ; les kits servent pendant les interventions.

Limite : Pas de nouveau directeur de horde ni d’équilibrage général d’une mégacité.

### Des retours de collecte peu différenciés

Livré : Un module au dos ou sur le râtelier du break, vitesse réduite et perte récupérable au sol.

Limite : Pas d’inventaire volumétrique ; places techniques distinctes du sac.

### Manque de décisions de préparation entre lumière, soins et réparations

Livré : Quatre familles payantes, fabrication au dépôt, ceinture limitée et usage conditionnel.

Limite : Aucun bonus permanent gratuit ou invulnérabilité.

### Risques d’effets et récompenses répétés à la reprise

Livré : États persistants, livraison unique, durée restante, validation des positions et quantités.

Limite : La sauvegarde n’est pas un service anti-triche externe.

### Lecture des ajouts trop dispersée dans les menus

Livré : Une section optionnelle et filtrable dans la carte, matériel repliable, entrée tactile.

Limite : Les anciens menus ne sont pas entièrement refondus.

### D-17 trop petit pour le fantasme de métropole

Livré : Emprise honnêtement conservée et documentée ; aucune icône agrandie pour simuler une extension.

Limite : La croissance constructible sur des kilomètres reste un chantier architectural distinct.

## Qualification QA

Les tests du jeu doivent vérifier les douze récupérations et les trois générations, les accès bloqués, les paiements à terme, l’interruption, les reprises, la livraison unique, le portage et les pertes. Tester les deux domaines d’éclairage, leurs murs et leurs niveaux. Une source lumineuse distante ne doit pas éclairer une autre pièce superposée.

Les scènes avancées sont préparées et leur temps piloté dans quatre profils automatisés ; ce ne sont pas quatre humains. Les captures de jeu prouvent un rendu exécuté, pas une certification artistique exhaustive. Safari/iPhone physique, Firefox, Electron empaqueté, l’équilibrage humain des kits, de longues campagnes et les performances sur le matériel du joueur restent à qualifier. Les résultats exacts sont dans le rapport du jeu et son manifeste de livraison.

## Conservation du codex

Les 500 fiches, le catalogue JSON, les sources précédentes et le lecteur sont conservés à l’identique. L’édition 1.22 ajoute ce guide séparément. Elle ne renomme pas douze objectifs en douze nouveaux plans de bâtiment et n’augmente pas artificiellement la couverture des 42 plans pilotes.
