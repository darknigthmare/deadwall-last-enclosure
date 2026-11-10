# Bible du jeu — DEADWALL : La Dernière Enceinte

> Document de référence pour la cohérence du projet : univers, piliers,
> systèmes de jeu, liens entre systèmes et direction des prochaines évolutions.
> État du jeu décrit : **1.74.0**, sauvegarde générale **v20**.

## 0. Mode d'emploi

### 0.1 Place dans la documentation

1. `docs/ORIGINAL_BRIEF.txt` reste la source première.
2. **Cette bible** fixe l'intention, la cohérence et les décisions de direction.
3. `GAME_DESIGN.md`, `ARCHITECTURE.md`, `BALANCING.md` et les documents de
   livraison décrivent le détail de ce qui est livré.
4. Les valeurs chiffrées vivent dans `src/core.js` ; la bible ne les duplique
   que pour situer un ordre de grandeur. En cas d'écart, le code fait foi pour
   l'état livré et la bible fait foi pour la direction.

### 0.2 Trois niveaux de vérité

Chaque affirmation de ce document porte l'un de ces statuts :

| Marque | Sens |
|---|---|
| **[LIVRÉ]** | Présent dans le jeu 1.74.0 et vérifiable dans le code ou les docs. |
| **[DÉCISION]** | Tranché par l'auteur du projet (session de cadrage du 10 novembre 2026). À respecter, pas encore forcément implémenté. |
| **[PROPOSITION]** | Proposé par la bible pour combler un trou. À valider ou corriger avant implémentation. |

Une **[DÉCISION]** ou une **[PROPOSITION]** n'est jamais une fonctionnalité
livrée. Chaque chantier qui en découle suit les règles d'`AGENTS.md` : valeurs
dans `src/core.js`, sauvegarde versionnée, tests, `npm run check`, aucun
système supprimé.

### 0.3 Décisions de cadrage enregistrées

| Sujet | Décision |
|---|---|
| Piliers | Siège/enceintes **et** construction de la mégacité en priorité conjointe ; survie au sol et logistique restent présents et servent les deux premiers. |
| Fin de partie | Mode infini, avec l'arc facultatif de D-17 dont l'épilogue n'arrête pas la partie. |
| Origine de l'infection | Jamais expliquée. |
| Chantiers prioritaires | Clarté et prise en main, profondeur du siège, fin de jeu mégacité, exploration et monde. |
| Exploration | Unifiée en trois échelles lisibles, sans supprimer de couche existante. |
| Eau | Ressource de cité à part entière, sans jauge de soif individuelle. |
| Fin de jeu | Districts autonomes, sacrifice et reconquête, grands ouvrages, lois et rationnement. |
| Première heure | Systèmes révélés âge par âge. |
| Le joueur | Successeur de Luc : il reprend le quart d'un dépôt déjà tenu. |
| Autres humains | Communautés alliées discrètes **et** factions humaines hostiles ou ambiguës (pillards, cannibales, autres). |
| Récit | Registre et Chroniques racontent un seul groupe de personnes ; les auteurs sont reliés. |
| Compagnons | Un arc court par compagnon, déclenché par le jeu, sans cinématique. |

---

## 1. Identité

### 1.1 Phrase d'intention

Une poignée de survivants transforme physiquement un dépôt municipal en cité
fortifiée à plusieurs enceintes, puis la défend nuit après nuit contre des
hordes qui grossissent avec elle.

### 1.2 Les deux courbes

Tout le jeu oppose deux courbes qui montent ensemble **[LIVRÉ]** :

- la puissance et le confort de la cité ;
- la **signature** de la cité, qui attire des hordes plus nombreuses.

Aucun système ne doit permettre à la première courbe de s'échapper
définitivement de la seconde. C'est le test de cohérence le plus important de
cette bible.

### 1.3 Piliers et règle d'arbitrage **[DÉCISION]**

| Rang | Pilier | Ce que le joueur doit ressentir |
|---|---|---|
| 1 | **Tenir les enceintes** | Chaque nuit a une géographie : un front, une porte faible, une brèche, un repli, une reconquête. |
| 1 | **Bâtir la mégacité** | La cité grandit à vue d'œil, du refuge à la mégaville, et chaque âge change sa silhouette. |
| 2 | **Survivre au sol** | Le personnage reste utile jusqu'au bout : porter, tirer, réparer, sortir. |
| 2 | **Faire tenir la chaîne** | Munitions, nourriture, eau, énergie : on perd souvent par pénurie avant de perdre par brèche. |

Règle d'arbitrage quand deux systèmes se contredisent :

1. La décision qui rend le **siège plus lisible et plus géographique** ou la
   **croissance plus visible** l'emporte.
2. Un système de rang 2 n'est justifié que s'il **alimente** un pilier de
   rang 1 : une ressource qui ne finit ni dans un mur, ni dans une arme, ni
   dans un habitant est un système orphelin.
3. La difficulté monte par **le nombre, les fronts et la pression**, jamais
   d'abord par les points de vie.

### 1.4 Les trois identités du joueur **[LIVRÉ]**

| Identité | Âges | Geste dominant |
|---|---|---|
| Survivant | 1–2 | Récolter, porter, tirer, construire soi-même. |
| Commandant | 3–5 | Placer, automatiser, former, sécuriser les routes. |
| Gouverneur | 6–11 | Arbitrer énergie, munitions, renforts et secteurs entre plusieurs enceintes. |

Le personnage reste jouable à tous les âges. Une identité s'ajoute, elle ne
remplace pas la précédente.

### 1.5 Interdits

Ce que DEADWALL refuse, quel que soit le chantier :

- zombies fluorescents, mutations spectaculaires, explosions organiques,
  pouvoirs surnaturels, boss à très grande barre de vie ;
- renforts ennemis téléportés, IA de chasse omnisciente ;
- guérison, vaccin, résurrection, explication de l'origine ;
- sauvetage promis, auteur de document déclaré vivant ou sauvé ;
- stock, dégât ou tirage aléatoire créés par un effet visuel ou sonore ;
- récompense donnée pour une simple lecture ; cinématique non sautable ;
- suppression d'un système existant pour en simplifier un nouveau ;
- humains transformés en armée : voir §4.4.

---

## 2. Univers

### 2.1 Cadre **[LIVRÉ]**

- **Époque** : contemporaine, jamais datée. Les documents portent « date
  illisible » ou « non datée ».
- **Lieu** : une région tempérée francophone, sans nom de pays, finie
  (24 576 m de côté).
- **Villes fixes** : Les Verrières, Val-des-Ormes, Saint-Roch, La Briqueterie,
  Moulin-Neuf, Bois-Mort. Les autres agglomérations tirent leur nom d'une
  réserve (Les Aubiers, Montbrune, Les Granges, La Rive, Fontvieille…).
- **Six quartiers abandonnés** autour du dépôt : Maisons sans voix, Arcades
  muettes, Camp des veilleurs, Cour des citernes, Terminus des cendres,
  Passage du dernier feu.

### 2.2 D-17

- **[LIVRÉ]** Un ancien dépôt municipal de 128 × 128 m, entouré de cinq
  districts d'annexes. Ce n'est pas une frontière : « nous gardons un endroit
  où revenir ».
- **[PROPOSITION]** « D-17 » est le **Dépôt n° 17** des services techniques
  intercommunaux : une désignation administrative banale, peinte sur un
  portail. Le nom n'a aucune portée mystérieuse ; c'est ce qui le rend
  crédible.
- **[PROPOSITION]** « La Dernière Enceinte » n'est pas un lieu. C'est le nom
  que les habitants donnent à l'enceinte qu'il reste à tenir cette nuit-là,
  quelle qu'elle soit.
- **Écriture** : « D-17 » dans tout texte affiché. « D17 » est réservé aux
  identifiants internes et ne doit jamais apparaître à l'écran.

### 2.3 Chronologie commune **[DÉCISION : auteurs reliés]**

Les événements d'avant l'arrivée du joueur forment une seule suite :

1. Coupure d'eau et délestages électriques.
2. Ordre de verrouiller les locaux techniques.
3. Barrages fermés, puis ordre contraire : « laisser sortir les familles ».
4. Départ du dernier convoi.
5. Luc et ceux qui restent gardent le dépôt ouvert comme point de retour.
6. Le dépôt se vide. On ne sait pas comment.
7. **Le joueur arrive et reprend le quart.**

Le temps écoulé entre 5 et 7 n'est jamais chiffré. Les traces (poussière,
végétation, rouille) suggèrent des mois, pas des années.

### 2.4 L'infection : ce que l'on sait et ce que l'on ne saura pas

**[DÉCISION]** L'origine n'est jamais expliquée, ni par un document, ni par
un personnage, ni par l'épilogue. Les mots « virus », « épidémie » et
« origine » restent absents des textes joués.

Ce que les survivants ont appris à leurs dépens, et que le jeu applique :

| Fait observé | Règle de jeu |
|---|---|
| Une partie des morts se relève. | Risque de réanimation de 30 % après 75 à 150 s **[LIVRÉ]**. Règle fictionnelle d'équilibrage, pas une estimation médicale. |
| Une morsure n'est pas un diagnostic. | Aucune contagion simulée aujourd'hui **[LIVRÉ]**. Une chaîne de quarantaine reste une piste (§9.4). |
| Les infectés suivent le bruit, la lumière et la masse. | Signature et champ de flux **[LIVRÉ]**. |
| Ils ne guérissent pas. | Aucun soin, aucun retour **[LIVRÉ]**. |

Les rumeurs contradictoires sont permises dans les documents trouvés, à
condition qu'aucune ne soit confirmée et qu'elles se contredisent entre elles.

### 2.5 Le joueur **[DÉCISION]**

- Le **Commandant** n'a ni nom ni voix. Il arrive de la route, seul ou avec un
  petit groupe selon le départ choisi.
- Il n'est pas le premier occupant du dépôt : **il succède à Luc**, dont il
  trouve le registre ouvert. Il devient en revanche le **premier Commandant de
  la cité**, parce que personne avant lui n'a bâti d'enceinte.
- À sa mort, une **relève** reprend le poste : Éclaireuse, Manutentionnaire ou
  Bâtisseuse **[LIVRÉ]**. La fonction survit à la personne ; c'est le thème
  central du jeu.

Corrections de texte à prévoir :

- « premier responsable de D-17 » → « premier commandant de D-17 » ;
- « Trois ouvriers ont choisi d'y rester avec vous » doit suivre l'effectif
  réel du départ choisi ;
- accorder la fiche du Manutentionnaire (« un réfugié ») avec les deux autres
  relèves, ou assumer trois genres différents de façon explicite.

### 2.6 Ceux d'avant : les auteurs de documents **[DÉCISION]**

Le Registre (6 dossiers) et les Chroniques (8 dossiers) décrivent **les mêmes
personnes au même endroit**. Les scènes en double deviennent deux regards sur
un même événement.

| Personne | Rôle avant | Regard associé | Statut de la fusion |
|---|---|---|---|
| **Luc** | Agent municipal, dernier gardien du dépôt | Chroniques : le quart, la porte qu'on garde | [LIVRÉ] |
| **Émile R.** | Agent technique | « E.R. » du Registre et Émile des Chroniques sont la même personne : la lumière de service, le fusible absent | [PROPOSITION] |
| **Sami V.** | Répartiteur bénévole devenu conducteur | « Sami » et « Sami V. » du Registre sont la même personne | [PROPOSITION] |
| **Oumar** | Conducteur | Second conducteur du dernier convoi, avec Sami V. | [PROPOSITION] |
| **Nora** et **Héloïse** | Soignantes | Deux soignantes du même dispensaire : les soins sans diagnostic | [PROPOSITION] |
| **Lina** et **Solène** | Habitantes | Deux voisines de la même rue : la liste des voisins, le mot sous la porte | [PROPOSITION] |
| **Aline**, **Basile** | Habitants | Témoins du barrage et des ordres contradictoires | [PROPOSITION] |

Règles qui ne changent pas **[LIVRÉ]** :

- le sort de ces personnes reste **inconnu** ;
- ce ne sont pas des PNJ présents, et aucun ne revient ;
- aucun appel radio ne les déclare vivants.

### 2.7 Les quatre compagnons **[DÉCISION : arc court]**

Chaque compagnon reçoit une origine, un lien avec « ceux d'avant » et quatre
étapes d'arc. Une étape se déclenche par un **fait de jeu**, s'affiche comme un
entretien court et lisible plus tard dans le registre, et ne donne aucune
récompense de lecture.

| Compagnon | Rôle [LIVRÉ] | Origine et lien [PROPOSITION] | Question de l'arc |
|---|---|---|---|
| **Léa** | Éclaireuse, signale les hordes | Habitait la rue de Lina et Solène ; cherche leur liste de voisins. | Continuer à chercher, ou accepter de compter les vivants ? |
| **Samir** | Soins | Ancien aide-soignant du dispensaire de Nora et Héloïse. | Que vaut un soin sans diagnostic ? |
| **Inès** | Réparations | Apprentie d'Émile R. ; connaît le dépôt mieux que le Commandant. | Réparer ce qui était, ou bâtir autre chose ? |
| **Malik** | Tir | Réserviste affecté au barrage le jour des ordres contradictoires. | À qui obéit-on quand il n'y a plus d'ordre ? |

Déclencheurs proposés, identiques pour les quatre afin de rester lisibles :

1. **Rencontre** : première affectation du compagnon.
2. **Trace** : relevé sur place du document lié à son passé.
3. **Épreuve** : première nuit où son secteur subit une brèche ou une perte.
4. **Choix** : atteinte de l'âge Ville avec le compagnon vivant ; le
   Commandant lui confie un district (§8.2) ou le garde à ses côtés.

Pour lever la confusion de noms, **Samir** ne s'abrège jamais en « Sami ».

### 2.8 Vocabulaire canonique **[PROPOSITION]**

Un mot, un sens. Les textes affichés s'y conforment.

| Terme | Sens unique |
|---|---|
| **Migration** | Mouvement d'infectés dans le monde, avant qu'il atteigne la cité. |
| **Horde** | Le groupe d'infectés lui-même. |
| **Vague** | Le numéro d'ordre d'une attaque contre D-17 (vague 7). Terme de comptage. |
| **Assaut** | La phase de jeu où la horde frappe les enceintes. |
| **Siège** | Un assaut qui a franchi au moins une enceinte et dure. |
| **Front** | Une direction d'attaque annoncée. |
| **Enceinte** | Un périmètre réellement fermé autour du centre. |
| **Secteur** | La zone comprise entre deux enceintes, ou une portion d'enceinte. |
| **District** | Un secteur doté d'un responsable et de stocks propres (§8.2). |
| **Âge** | Le palier de la cité, **numéroté de 1 (Refuge) à 11 (Mégaville III)**. |
| **Contact** | Un infecté rencontré hors de la cité, à l'échelle régionale. |

« Palier » reste un synonyme toléré d'« âge » dans les anciens documents. La
numérotation à partir de 0 est abandonnée.

Difficultés affichées : **Survivant**, **Standard**, **Brutal**. L'identifiant
interne `story` désigne Survivant et ne s'affiche pas.

---

## 3. Les infectés

### 3.1 Principe **[LIVRÉ]**

Un infecté est une personne d'avant. Sa dangerosité vient de ce qu'elle
portait, de ce qu'elle faisait et de son état, jamais d'une mutation.

### 3.2 Les dix profils de D-17 **[LIVRÉ]**

| Vague | Profil | Ce qu'il était | Ce qu'il impose au joueur |
|---:|---|---|---|
| 1 | Errant | Civil aux vêtements usés | Gérer la masse et les munitions. |
| 2 | Infecté récent | Contaminé depuis peu, encore mobile | Surveiller les amas de corps : il les franchit. |
| 3 | Briseur | Ouvrier en veste ocre | Protéger les structures (dégâts ×1,8 sur le bâti). |
| 4 | Infecté protégé | Policier, pompier ou militaire encore équipé | Concentrer le tir, compter les munitions. |
| 5 | Rampant | Blessé qui progresse au ras du sol | Fermer les positions basses, déblayer. |
| 6 | Traqueur | Silhouette en sweat à capuche | Ne laisser personne isolé hors des murs. |
| 7 | Hurleur | Infecté dont les cris agitent les proches | L'abattre tôt ; il accélère, il ne crée rien. |
| 8 | Engorgé | Infecté massif et très lent | Le tuer loin du mur : sa dépouille pèse 3,4. |
| 9 | Porte-bouclier | Agent antiémeute | Le prendre de flanc : bouclier frontal de 110°. |
| 11 | Fonceur | Infecté récent en tenue de sport | Poser des obstacles ; il s'épuise après son élan. |

Les profils spéciaux forment au plus 82 % d'une vague. La santé ne dépasse pas
+34 % ; c'est le nombre qui monte.

### 3.3 Règle de création d'un nouveau profil

Un profil n'entre dans le jeu que s'il répond « oui » aux quatre questions :

1. Peut-on dire **qui il était** en une phrase ?
2. Son effet vient-il d'un **équipement, d'un métier ou d'un état physique** ?
3. Le joueur dispose-t-il d'une **réponse par la position, le terrain ou le
   moment**, et pas seulement par plus de dégâts ?
4. Se **reconnaît-il à sa silhouette** au milieu de 700 autres ?

### 3.4 Harmonisation à faire

- Les contacts régionaux utilisent d'autres noms (« Agent protégé », « Ouvrier
  infecté », « Infecté mobile »). **[PROPOSITION]** Garder leurs profils et
  leurs valeurs, mais afficher les noms de D-17 quand le rôle est le même :
  Infecté protégé, Briseur, Traqueur.
- Hurleur et Engorgé n'existent pas en région. **[PROPOSITION]** L'assumer
  dans la fiction : ils ne se forment que dans les grandes masses, donc autour
  des cités.
- Plusieurs documents annoncent encore « huit profils » (§11).

---

## 4. Les vivants hors de D-17

### 4.1 État livré et changement de cap

- **[LIVRÉ]** Le jeu 1.74.0 ne contient **aucune faction humaine hostile**.
  Les « camps hostiles » sont d'anciens camps occupés par des infectés ; les
  camps alliés réutilisent les relais existants. `LIVRAISON_1_60.md` et
  `NARRATIVE.md` formulent ce refus.
- **[DÉCISION]** Le monde accueillera désormais des communautés alliées
  discrètes **et** des groupes humains hostiles ou ambigus : pillards,
  cannibales et autres factions.

Cette décision **remplace** l'ancien refus. Elle ne remplace pas le brief :
les hordes restent la menace principale.

### 4.2 Principes non négociables

1. **Les humains sont peu nombreux.** Une faction compte des dizaines de
   personnes, jamais des centaines. Aucune ne peut assiéger D-17.
2. **Ils attaquent la chaîne, pas le mur.** Convois, fourgons, sites de
   récolte, relais, éclaireurs isolés. La cité ne tombe que par les hordes.
3. **Tout combat humain se paie trois fois** : en munitions, en bruit qui
   attire une migration, et en morts dont une partie se relève (§2.4).
4. **Chaque faction est reliée à une ressource et à un système existant.**
   Une faction sans lien mécanique n'entre pas dans le jeu.
5. **Toujours une issue sans tir** : troc, tribut, détour, dissuasion.
6. **Ton sobre.** Aucune complaisance, aucune scène gratuite. L'horreur des
   cannibales se lit dans des indices, pas dans un spectacle.
7. **Aucun survivant d'avant** (§2.6) ne réapparaît dans une faction.

### 4.3 Les factions **[PROPOSITION]**

Noms et contenus originaux, à valider.

| Faction | Qui ils sont | Ressource et système liés | Ce qu'ils font | Réponse du joueur |
|---|---|---|---|---|
| **Les Relais** (alliés) | Hameaux et écluses tenus par quelques familles : Les Granges, La Rive, Fontvieille. | Nourriture, eau, troc ; expéditions et routes de retour. | Échangent, hébergent une expédition, signalent une migration. | Entretenir la route, tenir parole, escorter. |
| **La Colonne** (neutre) | Convoi marchand itinérant, qui passe et repart. | Carburant, pièces, médicaments ; troc à taux variables. | Vend cher ce qui manque, achète les surplus, ne s'arrête jamais longtemps. | Stocker pour son passage ; protéger son étape. |
| **Les Rouleurs** (pillards) | Bande motorisée qui vit du carburant des autres. | Carburant ; fourgons, postes de secteur, expéditions. | Embuscades sur les routes, vol de cargaison, tribut exigé aux relais. | Escortes, routes sûres, dissuasion, ou tribut. |
| **La Garde de Saint-Roch** (autorité) | Reste d'une force publique : uniformes dépareillés, règlement intact. | Munitions, population ; lois et conscription (§8.5). | Réquisitionne, exige des recrues, offre une protection sous condition. | Coopérer et perdre de l'autonomie, ou refuser et perdre une route. |
| **Les Éteints** (secte) | Communauté convaincue que la lumière et le bruit appellent les morts. | Signature, énergie. | Sabotent générateurs et projecteurs isolés ; ne tuent pas. | Garder les installations, ou négocier une extinction partielle. |
| **La Tablée** (cannibales) | Hameau accueillant, trop bien nourri pour la saison. | Nourriture, population ; éclaireurs et petits groupes isolés. | Offrent le gîte, troquent une viande sans origine, font disparaître les isolés. | Lire les indices, ne jamais envoyer un isolé, rompre ou détruire. |

Remarque de cohérence : **les Éteints ont raison sur le fond**. La signature
attire réellement les hordes. C'est la faction qui commente le plus
directement la règle centrale du jeu.

### 4.4 Relations **[PROPOSITION]**

Cinq états par faction, sans jauge chiffrée affichée :

`Inconnue → Repérée → En contact → Entente | Tension → Hostile`

- Un état change par des **actes** (troc honoré, convoi attaqué, tribut
  refusé), jamais par un menu de diplomatie abstrait.
- Les états sont sauvegardés dans un module additif versionné.
- Les factions utilisent le générateur de monde existant et ses transactions
  d'activation ; les campagnes anciennes ne reçoivent de faction qu'après une
  activation volontaire.

### 4.5 Ce que les factions ne sont pas

- Pas une seconde horde : aucun assaut humain contre les enceintes.
- Pas un jeu de tir contre des humains : les rencontres armées sont brèves,
  rares et coûteuses.
- Pas une source de butin gratuit : détruire une faction supprime aussi ce
  qu'elle apportait.

---

## 5. La boucle et la carte de cohérence

### 5.1 La boucle à préserver **[LIVRÉ]**

`récolte → dépôt → construction → automatisation → fortification → horde → reconstruction`

Une journée de jeu suit quatre temps : **phase calme → alerte → assaut →
sécurisation**.

### 5.2 Ce que chaque système doit à la boucle

| Système | Étape servie | Reçoit | Produit | Règle d'or |
|---|---|---|---|---|
| Récolte et sac | Récolte | Gisements, vestiges, sites | Ressources portées | Rien n'est crédité avant l'arrivée au dépôt. |
| Dépôt et stockage | Dépôt | Ressources portées | Stock plafonné par ressource | Un stock plein ne gaspille rien : l'ouvrier garde son reliquat. |
| Chantiers | Construction | Stock engagé, travail | Structures | On finance, puis on construit physiquement. |
| Ouvriers et ordres | Automatisation | Nourriture, logement | Collecte, chantier, déblaiement | Un ordre déplace réellement quelqu'un. |
| Économie urbaine | Automatisation | Nourriture, logement, eau | Population, moral | La pénurie ralentit avant de tuer. |
| Énergie | Automatisation | Carburant | Défenses et industries alimentées | Les défenses passent avant le reste. |
| Enceintes et portes | Fortification | Bois, ferraille, pierre | Périmètres fermés | Une enceinte se juge à sa fermeture, pas à son nombre de murs. |
| Armurerie | Fortification | Ferraille, atelier | Armes, outils, montages | Tout est payé, porté et entretenu. |
| Escouades et spécialistes | Fortification | Nourriture, munitions, médicaments | Tir, soin, réparation | Personne ne ressuscite ni ne répare gratuitement. |
| Signature | Horde | Bâti, population, énergie | Taille des hordes | La cité ne devient jamais définitivement sûre. |
| Directeur de hordes | Horde | Signature, vague, difficulté | Fronts, effectifs, profils | Plus de monde et de fronts, pas plus de vie. |
| Pression des cadavres | Horde | Morts près des murs | Rampes, franchissements | Un mur seul ne suffit pas. |
| Crises et doctrines | Horde | Points d'analyse, événements | Choix à contrepartie | Chaque bonus s'achète une fois et se paie. |
| Réparation et déblaiement | Reconstruction | Matériaux, travail | Enceintes remises en état | Ce qui est détruit doit être rebâti, pas restauré. |
| Exploration | Récolte (au large) | Carburant, temps, risque | Ressources finies, recrues, récit | Le monde lointain est fini ; la cité, non. |
| Récit de D-17 | Toutes | Traces relevées sur place | Sens, pas de puissance | Lire ne rapporte rien ; aller voir, si. |

### 5.3 Test de cohérence d'une nouvelle fonctionnalité

Avant d'ajouter quoi que ce soit, répondre par écrit dans la spécification :

1. **Quelle étape de la boucle** sert-elle ?
2. **De quelle ressource existante** se nourrit-elle, et que rend-elle ?
3. **Fait-elle monter la signature**, ou a-t-elle une autre contrepartie ?
4. **Que voit le joueur au sol** quand elle agit ?
5. **Quel pilier de rang 1** renforce-t-elle (§1.3) ?
6. **À quel âge** apparaît-elle (§6) ?
7. **Quel fichier propriétaire** existant la porte, et quel test la couvre ?

Une fonctionnalité qui échoue aux questions 1, 2 ou 5 est refusée ou
reformulée.

### 5.4 Les sept ressources, plus une

| Ressource | Source principale | Débouché principal | Tension voulue |
|---|---|---|---|
| Bois | Forêts, vestiges | Logements, palissades | Abondant tôt, insuffisant tard. |
| Ferraille | Vestiges, sites | Acier, armes, réparations | Disputée entre murs et armes. |
| Pierre | Carrières | Béton, bâtiments lourds | Lourde à transporter. |
| Nourriture | Fermes, élevage, cueillette | Population, recrutement | Croît avec la cité. |
| Carburant | Sites, raffinerie | Énergie, véhicules | Convoité par les Rouleurs. |
| Munitions | Manufacture | Joueur, fusiliers, tourelles | Se vide en une nuit. |
| Médicaments | Clinique, ambulances | Soins | Rare par nature. |
| **Eau** | Pluie, berges, puits | Population, cultures, élevage, incendies | **[DÉCISION]** voir §7.3. |

---

## 6. Prise en main : les systèmes révélés par âge

### 6.1 Principe **[DÉCISION]**

Le jeu contient plus de systèmes qu'un nouveau joueur ne peut en lire. La
réponse n'est pas d'en retirer : c'est de **ne montrer que ceux de l'âge en
cours**.

Règles :

- La révélation porte sur **l'interface** (menus, onglets, raccourcis,
  objectifs). La simulation n'est jamais désactivée par un masquage.
- Chaque âge introduit **au plus trois systèmes**, chacun par un objectif
  court qui demande un geste réel.
- Une campagne chargée affiche tout ce que son âge **le plus haut atteint** a
  déjà ouvert : aucune sauvegarde ne perd un menu.
- Un réglage « Tout afficher » existe pour les joueurs expérimentés.
- Les âges acquis restent acquis après une perte **[LIVRÉ]**.

### 6.2 Table de révélation **[PROPOSITION]**

| Âge | Nom | Systèmes révélés | Question posée au joueur |
|---:|---|---|---|
| 1 | Refuge | Récolte et sac, dépôt, chantier au sol, palissade, première horde | Vais-je tenir cette nuit ? |
| 2 | Camp fortifié | Ouvriers et ordres, caserne et fusiliers, générateur, portes et leurs trois modes | Qui travaille pendant que je me bats ? |
| 3 | Avant-poste | Acier, atelier et armurerie, clinique, secouristes et ingénieurs, pression des cadavres | Que se passe-t-il au pied de mon mur ? |
| 4 | Forteresse | Béton, manufacture de munitions, deuxième enceinte et diagnostic de fermeture, escouades, nuits noires | Où est-ce que je me replie ? |
| 5 | Ville | Tourelles lourdes, hôpital, logistique, doctrines et crises, **abords et secteurs** (échelles 1 et 2 de l'exploration), **eau de cité** | Qu'est-ce que je vais chercher dehors ? |
| 6 | Grande ville | Centrale et circuits, **districts**, territoires et fourgons, météo lisible | Qui commande quand je ne suis pas là ? |
| 7 | Métropole | Citadelle verticale et vue à la première personne, **région lointaine** (échelle 3), factions | Avec qui est-ce que je partage ce monde ? |
| 8 | Grande métropole | Services de grande capacité, **lois et rationnement** | Que suis-je prêt à imposer ? |
| 9 | Mégaville I | Grand ensemble fortifié, **sacrifice et reconquête** planifiés | Quel secteur puis-je perdre ? |
| 10 | Mégaville II | Tour de mégaville, complexe nourricier, **grands ouvrages** | Que laissera cette cité ? |
| 11 | Mégaville III | Réserve stratégique, croissance et survie continues | Jusqu'où ? |

Cette table est une cible de présentation. Elle ne déplace aucun prérequis
matériel existant sans un chantier d'équilibrage dédié dans `src/core.js`.

### 6.3 La première heure

Objectif mesurable **[PROPOSITION]** : un nouveau joueur, sans lire de texte
d'aide, doit en une heure avoir

1. récolté et déposé ;
2. financé et bâti un chantier ;
3. fermé une première enceinte de palissade avec une porte ;
4. survécu à trois vagues ;
5. recruté un ouvrier et vu la collecte s'automatiser.

Tout écran qui ne sert aucun de ces cinq points est masqué pendant l'âge 1.

Le calme initial doit avoir **une seule valeur documentée par scénario et par
difficulté**, lue dans `src/core.js` (§11, point 4).

---

## 7. Les systèmes, un par un

Chaque fiche donne la règle, l'état livré et la direction. Les fichiers
propriétaires sont ceux à étendre ; ne pas créer de propriétaire concurrent.

### 7.1 Récolte, sac et dépôt **[LIVRÉ]**

- Sac unique partagé entre colis, ballots et cargaisons : 36 pour le
  Commandant, 32 à 44 selon la relève ; ceinture de 8 objets.
- Stockage : 500 au centre, +600 par entrepôt, +600 par réserve d'étage.
  Démontage remboursé à 0,4.
- Propriétaires : `game.js`, `loadout129.js`, `fieldcraft.js`, `core.js`.
- **Direction** : conserver tel quel. C'est le geste fondateur de l'âge 1.

### 7.2 Chantiers, routes et bâti **[LIVRÉ]**

- 91 modèles urbains, 21 ensembles métriques, trois générations de murs
  améliorables sans perdre position ni intégrité.
- Les routes avancées accélèrent aussi les infectés.
- Propriétaires : `core.js`, `game.js`, `settlement-plans.js`.
- **Direction** : le principe « une route sert aussi l'ennemi » est exemplaire
  et doit inspirer chaque confort tardif.

### 7.3 Eau : une ressource de cité **[DÉCISION]**

État livré : quatre réserves séparées, aux débits différents.

| Réserve | Capacité | Rôle actuel |
|---|---:|---|
| Citernes anti-incendie | 120 | Incendies (Siege 1.3) |
| Seau du joueur | 8 | Transport manuel |
| Abreuvoirs | 40 | Élevage |
| Tonneaux de pluie | 24 | Collecte (0,06/s sous la pluie) |

Direction :

- L'**eau** devient la huitième ressource de cité, avec **une seule unité**
  commune aux quatre réserves.
- **Pas de jauge de soif** pour le joueur ni pour les unités.
- **Sources** : pluie (tonneaux), berges (seau, puis pompe), puits et château
  d'eau aux âges suivants.
- **Débouchés** : population, cultures, élevage, incendies, clinique.
- **Pénurie** : même logique que la nourriture. Elle touche d'abord le
  rendement des fermes et le moral, puis laisse les incendies se propager.
- **Lien avec la météo** : une suite de fronts secs devient une vraie menace
  de gouverneur.
- **Lien avec la fiction** : la coupure d'eau ouvre la chronologie (§2.3).
- Les quatre réserves restent des objets distincts ; seul leur contenu est
  unifié. Migration de sauvegarde additive et testée.
- Propriétaires à étendre : `core.js` (`Siege`), `husbandry191.js`,
  `campaign-water214.js`, `weather193.js`, `urban.js`.

### 7.4 Économie urbaine, énergie et signature **[LIVRÉ]**

- Consommation de 0,0065 nourriture/s par habitant ; une ferme donne 0,42/s.
- Sous 20 % de moral, les unités tombent à 82 % de leur vitesse.
- Énergie servie par priorité : défenses, clinique, industries.
- Signature = score du bâti + 2 × population + 2 × consommation électrique
  + 0,35 × nombre de structures. Effet : jusqu'à +80 % d'effectif.
- Propriétaires : `urban.js`, `power-grid.js`, `power-network173.js`,
  `vertical-network179.js`, `core.js`.
- **Direction** : expliquer au joueur **une seule** lecture de l'énergie. Le
  ratio global devient l'indicateur de cité ; les circuits en sont le détail,
  révélé à l'âge 6. La signature doit être **visible et expliquée** dès
  l'âge 3 : c'est la règle la plus importante et la moins lisible du jeu.

### 7.5 Enceintes, portes et cadavres **[LIVRÉ]**

- Portes : automatique (alliés), ouverte (tous), verrouillée (personne). Une
  fermeture occupée est refusée.
- Une enceinte n'est « fermée » que si le centre est inatteignable depuis
  l'extérieur.
- Cadavres : +1 par mort ordinaire, +2,2 protégé, +3,4 Engorgé. Érosion de
  0,012/s ; un ouvrier déblaie 0,9/s.
- Propriétaires : `tactics.js`, `game.js`, `barricades134.js`,
  `fortification-pack.js`, `vertical-siege176.js`.
- **Direction** : voir §8.1.

### 7.6 Hordes **[LIVRÉ]**

- Effectif : `10 + 5v + 2,35 × v^1,62`, multiplié par la difficulté et
  l'attraction.
- Un front de plus tous les trois niveaux, quatre au plus. 720 infectés
  simultanés au plus.
- Huit migrations types, dont la tenaille (vague 10) et le débordement
  (vague 13). Nuits noires aux vagues 4, 7, 10, puis toutes les trois.
- Propriétaires : `game.js`, `core.js`, `battlefield.js`, `nightwatch.js`.

### 7.7 Ouvriers, escouades, spécialistes **[LIVRÉ]**

- Cinq ordres d'ouvriers : automatique, récolte, chantier, déblaiement, repli.
- Trois sections : Alpha, Bravo, Charlie.
- Secouriste : 6 PV/s. Ingénieur : 14 PV/s. Tous deux consomment.
- **Direction de vocabulaire [PROPOSITION]** : « spécialiste » désigne
  uniquement le secouriste et l'ingénieur. Les affectations temporaires
  (pompier, analyste, agent de quartier, récupération) s'appellent
  **détachements**. Les programmes de `frontier-specialists.js` s'appellent
  **programmes**.

### 7.8 Armurerie et équipement **[LIVRÉ]**

- Fabrication : 4 s + 1 s par kilogramme arrondi. Tout se paie, se porte et
  s'use.
- Propriétaires : `arsenal134.js`, `night-gear.js`, `interventions134.js`.
- **Direction** : chaque nouvel objet doit offrir un **compromis** (vitesse
  contre masse, impact contre matériaux), jamais une simple amélioration.

### 7.9 Exploration en trois échelles **[DÉCISION]**

État livré : cinq couches nées à des versions différentes. Aucune n'est
supprimée ; chacune est rangée dans une échelle.

| Échelle | Ce que voit le joueur | Couches rangées ici | Âge | Ce qu'elle rapporte à la cité |
|---|---|---|---:|---|
| **1. Les abords** | À pied depuis la porte, retour avant la nuit | Sorties 1.1, six quartiers, vestiges, cueillette, chasse et pêche | 1–5 | Ressources de tous les jours, traces du récit. |
| **2. Les secteurs** | Postes tenus et lignes de fourgons | Territoires 1.2 (6 secteurs), expéditions 1.13 (12 destinations) | 5–6 | Flux régulier, réserves finies, routes à garder. |
| **3. La région** | Carte lointaine, voyages de plusieurs jours | Monde régional G4 à G11, opérations de campagne (15), codex | 7+ | Recrues, sites rares, factions, grands ouvrages. |

Règles de cohérence :

- **Une seule carte**, avec trois niveaux de zoom, et un seul vocabulaire.
- Chaque sortie répond à un **besoin de la cité** affiché au départ : un
  chantier bloqué, une réserve basse, une route coupée.
- Les ressources lointaines sont **finies** ; la cité est sans limite. À
  terme, la cité doit produire ce qu'elle ne peut plus aller chercher.
- Les six quartiers reçoivent une **position fixe** par rapport aux villes
  nommées, pour relier la carte locale à la carte régionale.
- Les versions de génération, flux aléatoires et identifiants restent ceux
  des campagnes existantes.
- Propriétaires : `frontier-*.js`, `expeditions.js`, `exploration-125.js`,
  `campaign-pack.js`, `field-atlas*.js`, `return-routes.js`.

### 7.10 Météo, élevage, cueillette **[LIVRÉ]**

- Six fronts de quatre minutes ; la tendance suivante se lit dans les
  90 dernières secondes.
- Élevage : enclos de 3 × 3 m, huit enclos de quatre animaux au plus.
- Cueillette : 16 espèces.
- **Direction** :
  - la météo doit peser sur le siège (visibilité, boue, feu) et sur l'eau ;
  - le cuir doit trouver un second débouché (équipement, protections) ;
  - ces trois systèmes relèvent de l'échelle 1 et de l'âge 5.

### 7.11 Citadelle verticale **[LIVRÉ]**

- Supports de 12, 24 et 48 m ; dalle à 180 pierre et 90 ferraille.
- Vue à la première personne en WebGL ; les deux vues partagent une seule
  simulation.
- Propriétaires : `vertical-citadel175*.js`, `vertical-siege176.js`.
- **Direction** : c'est la matérialisation du pilier « bâtir la mégacité ».
  Les grands ouvrages (§8.4) doivent s'y lire.

### 7.12 Coopération, scénarios, records, sauvegarde **[LIVRÉ]**

- Coopération : présence et repères seulement ; le relais n'a aucune autorité
  sur le monde.
- Quatre départs, trois difficultés. Records locaux, dix campagnes récentes,
  aucun bonus permanent.
- Sauvegarde v20, migrations en chaîne depuis la v2, puis modules additifs.
- **Direction** : la coopération reste hors des priorités actuelles. Toute
  évolution de cette bible passe par un module de sauvegarde additif.

---

## 8. Profondeur du siège et fin de jeu

### 8.1 Rendre chaque nuit mémorable **[DÉCISION : priorité]**

Une nuit réussie se raconte en une phrase : « La porte est a cédé, on a tenu
la deuxième enceinte, on a repris l'atelier au matin. »

| Besoin | État livré | Direction [PROPOSITION] |
|---|---|---|
| Lire les fronts | Annonce du ou des fronts | Chaque front porte un nom de lieu (« front de la porte nord ») et un effectif estimé. |
| Vivre la brèche | Chute d'un mur ou d'une porte | La brèche devient un **événement nommé** : alerte, repère sur la carte, compte des infectés entrés. |
| Se replier | Repli des escouades vers une redoute | Un **ordre de repli par enceinte**, qui déplace garnison et ouvriers d'un seul geste. |
| Choisir | Secteurs sacrifiables en phase d'alerte | Le choix se fait sur la carte, avant l'assaut, et s'affiche pendant. |
| Gérer le terrain | Pression des cadavres | Rendre l'amas **visible et lisible** : hauteur, seuil, franchissement imminent. |
| Conclure | Récompenses de vague | Un **bilan de nuit** : secteurs tenus, perdus, repris ; pertes ; munitions tirées. |

Aucune de ces directions n'ajoute de vie aux infectés. Toutes ajoutent de la
géographie.

### 8.2 Districts autonomes **[DÉCISION]**

- Un **district** est un secteur fermé doté d'un **responsable**, d'une
  **garnison**, de **stocks propres** et d'un rang de **priorité**.
- Il s'appuie sur le diagnostic topologique existant : pas de district sans
  périmètre réellement fermé.
- Le responsable peut être un compagnon (§2.7) ou un habitant nommé.
- **En temps calme** : le district se ravitaille et répare selon sa priorité.
- **En assaut** : trois ordres par district — *tenir*, *évacuer*, *sacrifier*.
- **Contrepartie** : chaque district ajoute de la signature et immobilise des
  stocks. Dix districts mal reliés perdent plus sûrement qu'un seul bien tenu.
- Révélé à l'âge 6.

### 8.3 Sacrifice et reconquête **[DÉCISION]**

Le brief demande de « perdre un secteur, se replier puis le reconquérir ».
Cette étape devient un système à part entière.

États d'un secteur :

`Tenu → Menacé → Perdu → Contesté → Repris`

- **Sacrifice volontaire** : une évacuation ordonnée sauve la population et
  une part des stocks, puis scelle les portes intérieures. Abandonner à temps
  doit toujours valoir mieux que perdre.
- **Secteur perdu** : les infectés y stagnent. Les structures se dégradent
  mais ne disparaissent pas. Le secteur ne produit plus et ne compte plus dans
  les capacités ; il compte encore dans la signature.
- **Reconquête** : une opération de jour en trois temps.
  1. **Isoler** : refermer la brèche extérieure.
  2. **Nettoyer** : éliminer ce qui est resté dedans.
  3. **Rétablir** : déblayer les corps, réparer, rouvrir les portes.
- Une reconquête rend les structures à leur intégrité restante : reprendre
  coûte moins cher que rebâtir.
- Révélé à l'âge 9, mais la perte et la reprise simples existent dès qu'il y a
  deux enceintes.

### 8.4 Grands ouvrages **[DÉCISION]**

- Projets géants bâtis **par tranches sur plusieurs nuits**, qui changent la
  silhouette de la cité.
- Chaque tranche est un chantier ordinaire : financé, puis construit
  physiquement. Une tranche inachevée est une faiblesse pendant l'assaut.
- Chaque ouvrage résout un problème de mégacité **et** en crée un.

| Ouvrage [PROPOSITION] | Ce qu'il apporte | Ce qu'il coûte |
|---|---|---|
| Chemin de ronde continu | Garnison mobile entre deux fronts | Une brèche y coupe la circulation. |
| Château d'eau et réseau | Eau de cité sans portage | Un point unique à défendre. |
| Beffroi d'alerte | Fronts annoncés plus tôt | Forte signature. |
| Grand dépôt | Stocks de district mutualisés | Tout perdre d'un coup. |
| Grande centrale | Énergie pour toutes les défenses | Carburant, signature, Éteints. |

Un ouvrage ne crée pas de quatrième génération de mur : les trois générations
restent la règle. Révélé à l'âge 10.

### 8.5 Lois et rationnement **[DÉCISION]**

- Une **loi** est une politique de cité à contrepartie visible.
- Nombre de lois actives limité par l'âge ; un changement prend effet après un
  délai, jamais au milieu d'un assaut.

| Loi [PROPOSITION] | Effet | Contrepartie |
|---|---|---|
| Demi-rations | Moins de nourriture consommée | Moral en baisse continue. |
| Extinction des feux | Signature réduite la nuit | Production nocturne arrêtée, défenses moins éclairées. |
| Conscription | Ouvriers armés pendant l'assaut | Production et chantiers à l'arrêt, pertes civiles. |
| Quarantaine des arrivants | Moins de réanimations dans les murs | Accueil retardé, logements immobilisés. |
| Corvée de déblaiement | Corps retirés plus vite après l'assaut | Journée de récolte perdue. |
| Rationnement de l'eau | Réserve d'incendie préservée | Rendement des fermes en baisse. |

Les lois prolongent les quatre crises existantes : une crise est un choix
ponctuel, une loi est un choix durable. Révélées à l'âge 8.

### 8.6 Ce que la fin de jeu ne doit pas devenir

- Une suite de chiffres plus grands sans décision nouvelle.
- Un menu de gestion qui dispense de descendre au sol.
- Une cité si sûre que la signature ne compte plus.

---

## 9. Récit

### 9.1 Structure **[LIVRÉ]**

- **Registre de D-17** : six traces relevées sur place, une décision au dépôt
  par secteur, quatre chapitres persistants.
  1. Le point de retour
  2. Une place derrière les murs
  3. Ce qu'ils ont laissé
  4. La dernière enceinte
- **Chroniques de D-17** : huit dossiers de trois documents, trois scènes,
  quatre entretiens.
- L'épilogue ne termine pas la simulation : « Vous n'avez ni retrouvé tous les
  disparus, ni arrêté la contamination. »
- Propriétaires : `narrative.js`, `chronicles131-data.js`,
  `campaign-intro132.js`.

### 9.2 Thèmes

1. **Un endroit où revenir.** D-17 n'est pas une frontière.
2. **La fonction survit à la personne.** Luc, puis le Commandant, puis la
   relève.
3. **Ne rien promettre de faux.** Ni guérison, ni sauvetage.
4. **Compter les vivants.** Le registre est un acte, pas un souvenir.

### 9.3 Ton d'écriture

- Sobre, administratif et humain : des quarts, des listes, des faits.
- Phrases courtes. Aucun lyrisme, aucune ironie.
- Un document trouvé ne dit jamais plus que ce que son auteur pouvait savoir.
- Le mot « guérison » reste barré.

### 9.4 Pistes ouvertes **[PROPOSITION]**

- **Chaîne de quarantaine** : arrivants, morsures, isolement. Cohérente avec
  la loi de quarantaine (§8.5) et la règle de réanimation.
- **Voix des Relais** : quelques visages vivants hors de D-17, sans jamais
  confirmer le sort de « ceux d'avant ».
- **Chapitre V facultatif** : le premier district confié à un compagnon.

---

## 10. Direction artistique et sonore **[LIVRÉ]**

- **Image** : poste de commandement de terrain. Terre, acier patiné, béton,
  végétation sale, éclairage sodium. Palette olive, or et acier.
- **Bâti** : assemblé, rapiécé, réparé. Jamais futuriste, jamais impeccable.
- **Lisibilité** : une silhouette se reconnaît dans la masse. C'est une
  contrainte de jeu avant d'être une contrainte d'image.
- **Ambiance** : pluie, nuit, fumée, étincelles, impacts, corps persistants.
- **Nuits noires** : masque noir réel, torche et projecteurs.
- **Son** : entièrement synthétisé, sans fichier audio. Musique discrète, sons
  mécaniques, sirènes, signal radio procédural.
- **Provenance** : toute image conserve sa fiche de provenance.
- **Règle** : peintres, animations, effets et sons **lisent** les actions
  accomplies. Ils ne créent ni stock, ni dégât, ni tirage de simulation.

Pour les factions (§4.3) : chaque groupe humain se reconnaît à un **signe
matériel** sobre (un véhicule, un brassard, une absence de lumière), jamais à
un costume de fiction.

---

## 11. Incohérences relevées dans la documentation

Écarts constatés entre documents ou entre documents et code. À corriger dans
un chantier documentaire dédié ; aucun ne demande de changer une règle de jeu.

| # | Écart | Où | Correction attendue |
|---:|---|---|---|
| 1 | Version annoncée 1.65.0 | `PROJECT_MANIFEST.md`, `CHANGELOG.md` | Aligner sur 1.74.0 ; ajouter les versions 1.66 à 1.74. |
| 2 | Sauvegarde décrite en « version 2 » | `ARCHITECTURE.md` | Décrire la v20 et les modules additifs. |
| 3 | « Huit profils d'infectés » | `ROADMAP.md`, `SCENARIOS.md`, `ENEMY_CONTENT.md`, `AUDIT_STORY_RELEASE.md` | Dix profils (§3.2). |
| 4 | Calme initial : 82/112/64 s contre 210 s | `SCENARIOS.md`, `BALANCING.md` | Une valeur par scénario et difficulté, lue dans `core.js`. |
| 5 | Feuille de route périmée | `ROADMAP.md` | Retirer des exclusions ce qui est livré : break, relais de coopération, incendies, logements suspendus. |
| 6 | Âges numérotés depuis 0 ou depuis 1 | `vertical175/README.md`, `SPECIALISTS.md`, `DEFENSES_193.md`, `CAMPAIGN_CONTRACTS_194.md` | 1 à 11 partout (§2.8). |
| 7 | Élevage : « aucun transfert », « aucun puisage » | `HUSBANDRY_191.md`, `EXTENSION_SURVIE_191.md` | Mentionner seau, soins et colis livrés depuis. |
| 8 | Tableaux « à traiter » déjà traités | `UNDERCOVERED_SYSTEMS_199.md`, `_200.md` | Marquer le transport et l'identité de carte comme faits. |
| 9 | « Aucune fusion » alors que le code est présent | `LIFECYCLE_202.md`, `PRODUCT_TRANSPORT_203.md` | Mettre à jour le statut. |
| 10 | Biomes : « ni rivière, ni animaux » | `BIOMES_1_35.md` contre `docs/codex/README.md` et le code | Marquer la 1.35 comme historique. |
| 11 | « Camp de pillards » dans une fiche de conception | `docs/codex/HABITAT.md` contre `LIVRAISON_1_60.md` | Désormais cohérent avec §4 ; préciser le statut non livré. |
| 12 | « Trois ouvriers » quel que soit le départ | `src/narrative.js` | Suivre l'effectif réel (§2.5). |
| 13 | « trois vagues » contre « trois migrations » | `NARRATIVE.md`, `src/narrative.js` | Vocabulaire canonique (§2.8). |
| 14 | Sami, Sami V., Samir | `src/narrative.js`, `src/chronicles131-data.js` | Fusion et règle d'écriture (§2.6, §2.7). |
| 15 | « Registre v5 » ambigu | `vertical175/CHANTIERS_VERTICAUX.md` | Préciser qu'il s'agit d'un registre interne. |
| 16 | Identifiant `D17:` potentiellement affiché | `src/coop.js` | Vérifier qu'il ne paraît jamais à l'écran. |

Les lignes 12, 13, 14 et 16 touchent du code ou des textes joués : elles
demandent un test.

---

## 12. Feuille de route de la bible

Ordre proposé. Chaque chantier passe par une spécification, suit le test de
cohérence (§5.3) et se termine par `npm run check`.

| Rang | Chantier | Pilier servi | Propriétaires principaux | Parcours joueur observable |
|---:|---|---|---|---|
| 0 | Nettoyage documentaire (§11) | Tous | `docs/`, `PROJECT_MANIFEST.md`, `CHANGELOG.md` | Les documents disent la même chose que le jeu. |
| 1 | Révélation par âge (§6) | Clarté | `command-ui.js`, `urban.js`, `core.js` | Une nouvelle partie n'affiche que cinq systèmes. |
| 2 | Signature visible et bilan de nuit (§7.4, §8.1) | Siège | `urban.js`, `battlefield.js`, `command-ui.js` | Le joueur voit pourquoi la horde grossit et ce qu'il a tenu. |
| 3 | Brèche nommée et repli par enceinte (§8.1) | Siège | `tactics.js`, `squads.js`, `game.js` | Une porte cède, un ordre replie la garnison. |
| 4 | Eau de cité (§7.3) | Chaîne | `core.js`, `urban.js`, `husbandry191.js`, `weather193.js` | Une sécheresse fait baisser les fermes. |
| 5 | Exploration en trois échelles (§7.9) | Monde | `frontier-*.js`, `expeditions.js`, `field-atlas*.js` | Une seule carte, trois zooms, un besoin affiché. |
| 6 | Sacrifice et reconquête (§8.3) | Siège | `tactics.js`, `game.js`, `core.js` | Un secteur est abandonné puis repris au matin. |
| 7 | Districts (§8.2) | Mégacité | `urban.js`, `tactics.js`, `squads.js` | Un compagnon tient un district sans le joueur. |
| 8 | Lois (§8.5) | Mégacité | `command-ui.js`, `urban.js`, `core.js` | Une loi change un chiffre et son contraire. |
| 9 | Grands ouvrages (§8.4) | Mégacité | `core.js`, `settlement-plans.js`, `vertical-citadel175*.js` | La silhouette de la cité change en plusieurs nuits. |
| 10 | Récit relié et arcs des compagnons (§2.6, §2.7) | Récit | `narrative.js`, `chronicles131-data.js`, `companions-pack.js` | Un entretien suit une nuit difficile. |
| 11 | Factions (§4) | Monde | `frontier-*.js`, `expeditions.js`, nouveau module additif | Un fourgon est intercepté ; un relais demande de l'aide. |

Les rangs 1 à 3 ne demandent presque aucune règle nouvelle : ils rendent
lisible ce qui existe. C'est le meilleur rapport entre effort et effet.

---

## 13. Questions encore ouvertes

À trancher avant les chantiers concernés.

1. **Factions** : valider ou remplacer les six groupes et leurs noms (§4.3).
   Peut-on en détruire une définitivement ?
2. **Combat contre des humains** : jusqu'où le montrer ? Rencontre jouée au
   sol, ou résolution d'expédition hors champ ?
3. **Sens de « D-17 »** et de « La Dernière Enceinte » : valider §2.2.
4. **Fusion des auteurs** : valider le tableau §2.6, en particulier
   Sami et Sami V.
5. **Compagnons** : un compagnon peut-il mourir définitivement ? Que devient
   son district ?
6. **Révélation par âge** : la table §6.2 déplace-t-elle des prérequis
   matériels, ou seulement l'affichage ?
7. **Eau** : la pénurie peut-elle tuer, ou seulement ralentir ?
8. **Durée d'une campagne** : l'objectif de 6 à 10 h en Standard n'a jamais
   été mesuré par une campagne humaine. Qui le mesure, et quand ?
9. **Coopération** : reste-t-elle une simple présence ?
10. **Records** : faut-il un classement, ou les records restent-ils locaux ?

---

## 14. Faire vivre ce document

- Toute décision de direction se note ici **avant** son implémentation.
- Une **[PROPOSITION]** validée devient **[DÉCISION]** ; une décision livrée
  devient **[LIVRÉ]**, avec la version du jeu.
- Une valeur chiffrée citée ici se vérifie dans `src/core.js` à chaque
  livraison qui la touche.
- Un document de livraison qui contredit la bible doit le dire explicitement
  et proposer la correction de l'un ou de l'autre.
