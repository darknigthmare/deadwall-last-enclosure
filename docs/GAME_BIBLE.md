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
| **[DÉCISION]** | Tranché par l'auteur du projet (sessions de cadrage du 10 novembre 2026). À respecter, pas encore forcément implémenté. |
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
| Monde | Procédural et **sans bord**, avec des lieux générés à découvrir, un terrain modifiable et des graines réellement différentes. |
| Hordes | Marée visible à l'horizon, pyramides de corps, murs colossaux, brèche catastrophe, et de **rares abominations géantes** cohérentes avec le ton. |
| Absence du joueur | La cité **se défend vraiment** : la simulation continue pendant l'exploration. |
| Déplacement | Véhicules à entretenir, avant-postes bâtis, routes à sécuriser, marche et campement. |
| Rythme de l'exploration | Entre deux vagues au début ; pendant les vagues dès que la cité est autonome. |
| Combat contre des humains | Joué au sol, rare et coûteux. |
| Sort des factions | Destructibles **et** absorbables. Les six factions proposées sont validées ; d'autres s'y ajoutent. |
| Sort des compagnons | Blessés d'abord ; la mort définitive survient après un certain nombre de blessures graves. |
| Chute du centre pendant l'absence | Dernier carré : un délai pour rentrer et reprendre le centre. |
| Relief | Par paliers : plateaux, falaises, cuvettes, pentes. |
| Ampleur des hordes | Des milliers à l'écran : premiers rangs simulés, gros de la horde en masses agrégées. |
| Monde sans bord | Réservé aux nouvelles campagnes. |
| Travaux de terrain | Permis dans toute l'emprise de la cité et des avant-postes. |
| Pénurie d'eau | Ralentit, fait partir des habitants, puis tue si elle dure. |
| Révélation par âge | Interface seulement : aucun prérequis déplacé. |
| Abominations | De nouvelles s'ajoutent aux trois existantes ; certaines rôdent en région. |
| Coopération | Vraie coopération : un hôte et jusqu'à trois invités, qui rejoignent ou quittent une campagne en cours. |
| Blessures des compagnons | Trois ; une longue convalescence efface une marque. |
| Délai du dernier carré | Fixé par l'état de la cité, sans chrono arbitraire. |
| Mort du Commandant | La relève reprend, mais la cité en sort fragilisée. |
| Durée d'une campagne | 15 à 25 h jusqu'à Mégaville III. |
| Matériel visé | Un ordinateur portable courant, dans un navigateur. |
| Ordre des chantiers | Prise en main d'abord. |
| Propositions validées | Sens de « D-17 », fusion des auteurs, quatre factions et trois abominations supplémentaires, six lois et cinq grands ouvrages de base. |
| Après le dernier carré | Une cité à reconquérir : centre repris, districts perdus à reprendre un par un. |
| Factions par campagne | Quatre à six sur dix, tirées et placées par la graine ; les Relais toujours présents. |
| Pause en coopération | Aucune : le temps ne s'arrête jamais à plusieurs. |
| Relève en coopération | L'hôte incarne la relève. |
| Lois | Liste validée, complétée par des lois plus dures. |
| Grands ouvrages | Liste validée, complétée. |
| Corps après l'assaut | Une vraie filière (fosse ou bûcher), et des corps laissés trop longtemps rendent malade. |
| Campagnes existantes | Reçoivent les nouveautés indépendantes du nouveau monde, par activation volontaire. |
| Validations | Cinq lois dures, six grands ouvrages ajoutés, table de révélation par âge. |
| Maladie des corps | Affaiblit, puis tue si rien n'est fait. |
| Avant-postes | Aucun plafond fixe : limités par les moyens. |
| Convalescence | Trois assauts à l'hôpital pour effacer une marque. |
| Récit | Trois chapitres de plus, liés aux âges tardifs et déclenchés par des faits de jeu. |
| Saisons | Quatre saisons longues sur la durée d'une campagne. |
| Jour et nuit | Assauts surtout la nuit, parfois le jour. |
| Habitants | Visibles dans la cité ; une douzaine de figures nommées, promouvables responsables de district. |
| Durée d'une saison | Comptée en assauts. |
| Assauts de jour | Dès la Forteresse (âge 4), environ un sur six, jamais deux de suite. |
| Son | Enregistrements acceptés pour les hordes ; musique plus présente aux grands moments. |
| Image | Planche de référence validée avant tout chantier de faction ou d'abomination. |

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

### 1.5 Cibles **[DÉCISION]**

| Cible | Valeur | Conséquence |
|---|---|---|
| Durée d'une campagne | **15 à 25 h** jusqu'à Mégaville III, soit environ deux heures par âge | Remplace l'ancienne cible de 6 à 10 h, jamais mesurée. À vérifier par des campagnes humaines. |
| Matériel | **Ordinateur portable courant**, puce graphique intégrée, navigateur | Les marées de plusieurs milliers reposent sur les masses agrégées (§8.6), pas sur la puissance de la machine. |
| Joueurs | Un, ou **deux à quatre** en coopération (§7.12) | Tout système doit rester jouable seul. |

### 1.6 Interdits

Ce que DEADWALL refuse, quel que soit le chantier :

- zombies fluorescents, explosions organiques, pouvoirs surnaturels ;
- difficulté fondée sur des barres de vie : les abominations géantes existent
  mais restent rares, annoncées et bornées (§3.5) ;
- renforts ennemis téléportés, IA de chasse omnisciente ;
- guérison, vaccin, résurrection, explication de l'origine ;
- sauvetage promis, auteur de document déclaré vivant ou sauvé ;
- stock, dégât ou tirage aléatoire créés par un effet visuel ou sonore ;
- récompense donnée pour une simple lecture ; cinématique non sautable ;
- suppression d'un système existant pour en simplifier un nouveau ;
- humains transformés en armée : voir §4.6.

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
- **[DÉCISION]** « D-17 » est le **Dépôt n° 17** des services techniques
  intercommunaux : une désignation administrative banale, peinte sur un
  portail. Le nom n'a aucune portée mystérieuse ; c'est ce qui le rend
  crédible.
- **[DÉCISION]** « La Dernière Enceinte » n'est pas un lieu. C'est le nom
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
- **[DÉCISION]** La mort du Commandant **fragilise la cité** : le moral
  chute, les consignes d'absence et les ordres de district sont suspendus un
  temps, et son corps peut se relever comme celui de n'importe qui. La
  fonction survit, mais la passation a un prix. Les valeurs vivent dans
  `src/core.js`.

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
| **Émile R.** | Agent technique | « E.R. » du Registre et Émile des Chroniques sont la même personne : la lumière de service, le fusible absent | [DÉCISION] |
| **Sami V.** | Répartiteur bénévole devenu conducteur | « Sami » et « Sami V. » du Registre sont la même personne | [DÉCISION] |
| **Oumar** | Conducteur | Second conducteur du dernier convoi, avec Sami V. | [DÉCISION] |
| **Nora** et **Héloïse** | Soignantes | Deux soignantes du même dispensaire : les soins sans diagnostic | [DÉCISION] |
| **Lina** et **Solène** | Habitantes | Deux voisines de la même rue : la liste des voisins, le mot sous la porte | [DÉCISION] |
| **Aline**, **Basile** | Habitants | Témoins du barrage et des ordres contradictoires | [DÉCISION] |

Règles qui ne changent pas **[LIVRÉ]** :

- le sort de ces personnes reste **inconnu** ;
- ce ne sont pas des PNJ présents, et aucun ne revient ;
- aucun appel radio ne les déclare vivants.

### 2.7 Les quatre compagnons **[DÉCISION : arc court]**

Chaque compagnon reçoit une origine, un lien avec « ceux d'avant » et quatre
étapes d'arc. Une étape se déclenche par un **fait de jeu**, s'affiche comme un
entretien court et lisible plus tard dans le registre, et ne donne aucune
récompense de lecture.

| Compagnon | Rôle [LIVRÉ] | Origine et lien [DÉCISION] | Question de l'arc |
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

**Blessures et mort [DÉCISION]**

- Un compagnon qui tombe est d'abord **blessé gravement** : évacué, soigné,
  indisponible un temps.
- Chaque blessure grave laisse une marque. **La troisième est la dernière
  survécue** : la suivante est mortelle. Le seuil vit dans `src/core.js`.
- Une **convalescence de trois assauts** à l'hôpital, sans combattre ni
  commander, efface une marque. Soigner un compagnon, c'est s'en priver au
  moment où il sert le plus.
- Le joueur **voit** le compte : un compagnon marqué deux fois est un
  compagnon qu'on n'expose plus sans raison.
- Une mort est définitive. L'arc s'arrête là où il en était, son district
  change de responsable, et son nom entre au registre.
- Un compagnon mort peut se relever comme n'importe qui (§2.4). Le jeu ne
  met pas cette scène en avant ; il ne l'empêche pas non plus.

**Première tranche livrée [LIVRÉ]**

Léa, Samir, Inès et Malik ont chacun leur origine, leur lien avec « ceux
d'avant » et **quatre entretiens**, soit seize textes
(`src/chronicles131-data.js`, déclencheurs dans `src/chronicles131.js`).

| Étape | Fait qui l'ouvre |
|---|---|
| Rencontre | Le compagnon est recruté et vivant. |
| Trace | Le dossier lié à son passé est relevé sur place (Registre), ou le document de terrain correspondant est collecté (Chroniques). |
| Épreuve | Pendant un assaut, une brèche s'ouvre ou un secteur est perdu. |
| Choix | La cité atteint l'âge Ville. |

- Une étape s'annonce une fois, se relit au carnet et **ne donne rien**.
- Un compagnon mort ne parle plus.
- Correspondances retenues : Léa et la liste de Lina ; Samir et la fiche de
  Nora ; Inès et le cahier d'Émile R. ; Malik et les deux ordres du barrage.
- Les signatures d'Émile R., Nora, Héloïse, Solène et Oumar sont reliées,
  sans réécrire leurs documents.
- Une campagne en cours consigne en silence ce qui est déjà vrai ; une nuit
  passée ne compte jamais comme Épreuve.
- Test `tests/companion-arcs217.test.cjs`.

Écarts : l'Épreuve n'est pas liée au secteur du compagnon, car aucune
affectation de compagnon à un secteur n'existe ; l'étape Choix pose sa
question sans offrir encore la décision (district confié ou non). Le jeu
limite à deux compagnons à la fois : une campagne voit deux arcs en même
temps.

Restent à faire : blessures, marques et mort définitive ; la décision du
Choix avec les districts ; relier Aline et Basile au barrage ; les
chapitres V à VII.

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

### 3.5 Les abominations

**[LIVRÉ]** Le siège vertical contient déjà trois géants (`core.js`,
`vertical-siege176.js`) :

| Nom | Taille | Santé | Vitesse | Portée | Âge requis |
|---|---:|---:|---:|---:|---:|
| Porte-faille | 6 m | 700 | 1,1 m/s | 3 m | 7 |
| Porte-charniers | 12 m | 1 000 | 0,8 m/s | 4 m | 9 |
| Colosse de siège | 20 m | 1 500 | 0,6 m/s | 6 m | 11 |

Les âges suivent la convention 1 à 11 du §2.8 ; le code les note de 0 à 10.

Ils apparaissent à partir de la vague 25, tous les cinq assauts, selon l'âge
et le rempart construit, à **trois au plus**. Leurs attaques sont annoncées,
suivies d'une récupération, et ils ont des points faibles à la tête et aux
jambes. Un affût de précision leur est dédié.

**[DÉCISION]** Les abominations géantes font partie du jeu, à condition de
rester rares et cohérentes avec le ton. Cette décision **nuance le brief**,
qui écarte les « zombies fantaisistes transformés en boss » : elle l'encadre,
elle ne l'abolit pas.

Garde-fous :

1. **Rares.** Une abomination est un événement de fin de campagne, jamais un
   profil de vague ordinaire. Le plafond de trois présentes à la fois reste
   la règle, quel que soit leur type.
2. **Jamais seules.** Elles arrivent **dans** une horde et la rendent plus
   dangereuse ; elles ne la remplacent pas. Le nombre reste la menace.
3. **Annoncées.** On les voit venir de loin (§8.6) et elles portent un nom
   dans l'annonce du front.
4. **Battues par la position**, pas par l'usure : points faibles, affûts
   dédiés, terrain préparé, moment choisi.
5. **Inexpliquées.** Personne ne sait ce qu'elles sont. Aucun document ne le
   dit (§2.4). Les survivants constatent seulement qu'on n'en voit qu'au
   milieu des très grandes masses.
6. **Sobres.** Ni couleur vive, ni pouvoir, ni explosion. Une abomination est
   lourde, lente et abîmée.
7. **Elles laissent un problème.** Leur dépouille est un obstacle et une
   charge de corps considérable au pied du mur.

**[PROPOSITION]** Donner à chacune un rôle lisible dans le siège, tiré de son
nom :

| Abomination | Rôle dans le siège | Réponse du joueur |
|---|---|---|
| Porte-faille | Ouvre : elle vise les portes et les pans déjà fissurés. | La ralentir avant le mur ; renforcer ou sacrifier la porte visée. |
| Porte-charniers | Élève : là où elle s'arrête, l'amas monte plus vite. | L'abattre loin du rempart ; brûler ou déblayer l'amas. |
| Colosse de siège | Franchit : elle menace directement le sommet d'un rempart de 12 à 24 m. | Affûts de précision, tir aux jambes, repli préparé. |

**[DÉCISION]** D'autres abominations s'ajoutent aux trois existantes, et
certaines **rôdent en région**, où elles menacent avant-postes et convois.

Trois nouvelles, validées, chacune avec un rôle que les trois premières
n'ont pas :

| Abomination | Où | Rôle | Réponse du joueur |
|---|---|---|---|
| **Comble-fossé** | Siège | Pousse devant elle corps et gravats : elle annule les fossés et les douves. | La stopper avant l'ouvrage ; recreuser au matin. |
| **Meneuse** | Région, puis siège | Les groupes sauvages s'agrègent autour d'elle : c'est le noyau d'une migration, visible de très loin. | L'abattre en région disperse la migration avant qu'elle atteigne la cité. |
| **Traîne-épave** | Région | Empêtrée dans des câbles et de la tôle qu'elle traîne ; elle barre les routes et renverse les véhicules légers. | La contourner, l'attirer hors de la route, ou l'abattre et dégager l'épave. |

Règles propres à la région :

- une abomination de région se **voit et s'entend de loin** : on choisit de
  l'affronter, on ne la découvre pas au détour d'un mur ;
- elle n'apparaît que dans les cantons éloignés, jamais aux abords d'une cité
  des premiers âges ;
- elle peut ruiner un poste, pas le prendre : seule une migration le fait ;
- la **Meneuse** relie les deux échelles : la tuer loin de la cité est la
  seule façon d'affaiblir une vague avant qu'elle n'arrive.

Toute nouvelle abomination passe les quatre questions du §3.3, sauf la
première : on ne sait pas qui elle était. C'est précisément ce qui la
distingue d'un infecté.

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

### 4.3 Les factions

**[DÉCISION]** Les six factions ci-dessous sont validées.

| Faction | Qui ils sont | Ressource et système liés | Ce qu'ils font | Réponse du joueur |
|---|---|---|---|---|
| **Les Relais** (alliés) | Hameaux et écluses tenus par quelques familles : Les Granges, La Rive, Fontvieille. | Nourriture, eau, troc ; expéditions et routes de retour. | Échangent, hébergent une expédition, signalent une migration. | Entretenir la route, tenir parole, escorter. |
| **La Colonne** (neutre) | Convoi marchand itinérant, qui passe et repart. | Carburant, pièces, médicaments ; troc à taux variables. | Vend cher ce qui manque, achète les surplus, ne s'arrête jamais longtemps. | Stocker pour son passage ; protéger son étape. |
| **Les Rouleurs** (pillards) | Bande motorisée qui vit du carburant des autres. | Carburant ; fourgons, postes de secteur, expéditions. | Embuscades sur les routes, vol de cargaison, tribut exigé aux relais. | Escortes, routes sûres, dissuasion, ou tribut. |
| **La Garde de Saint-Roch** (autorité) | Reste d'une force publique : uniformes dépareillés, règlement intact. | Munitions, population ; lois et conscription (§8.5). | Réquisitionne, exige des recrues, offre une protection sous condition. | Coopérer et perdre de l'autonomie, ou refuser et perdre une route. |
| **Les Éteints** (secte) | Communauté convaincue que la lumière et le bruit appellent les morts. | Signature, énergie. | Sabotent générateurs et projecteurs isolés ; ne tuent pas. | Garder les installations, ou négocier une extinction partielle. |
| **La Tablée** (cannibales) | Hameau accueillant, trop bien nourri pour la saison. | Nourriture, population ; éclaireurs et petits groupes isolés. | Offrent le gîte, troquent une viande sans origine, font disparaître les isolés. | Lire les indices, ne jamais envoyer un isolé, rompre ou détruire. |

**[DÉCISION]** Quatre factions supplémentaires, validées :

| Faction | Qui ils sont | Ressource et système liés | Ce qu'ils font | Réponse du joueur |
|---|---|---|---|---|
| **Les Sans-Drapeau** (déserteurs) | Anciens soldats sans chaîne de commandement, bien armés, peu nombreux. | Munitions, armurerie. | Tiennent un pont ou un dépôt ; vendent leur protection ou la retirent. | Les payer, les contourner, les rallier, ou les déloger au prix fort. |
| **Les Bateliers** (communauté fluviale) | Familles vivant sur l'eau, hors d'atteinte des hordes. | Eau, poisson, transport ; hydrologie. | Transportent de lourdes charges par la rivière, loin des routes. | Tenir un quai ; garder le cours d'eau ouvert. |
| **La Fonderie** (récupérateurs) | Ouvriers retranchés dans une usine qu'ils démontent pièce à pièce. | Ferraille, machines ; grands ouvrages. | Fabriquent ce que la cité ne sait pas encore faire ; exigent de la nourriture. | Les nourrir régulièrement, ou perdre l'accès aux pièces. |
| **Les Enfants du Préau** | Des enfants et adolescents qui ont tenu seuls dans une école. | Population, moral, logements. | Se cachent, volent de la nourriture, ne font confiance à personne. | Gagner leur confiance par des actes ; aucun affrontement possible. |

Les Enfants du Préau ne sont jamais des adversaires : aucun combat, aucune
menace armée, aucune mise en danger montrée. Ils posent une seule question au
Commandant : ce qu'il fait d'une bouche de plus.

Remarque de cohérence : **les Éteints ont raison sur le fond**. La signature
attire réellement les hordes. C'est la faction qui commente le plus
directement la règle centrale du jeu.

### 4.4 Relations **[PROPOSITION]**

Cinq états par faction, sans jauge chiffrée affichée :

`Inconnue → Repérée → En contact → Entente | Tension → Hostile`

- Un état change par des **actes** (troc honoré, convoi attaqué, tribut
  refusé), jamais par un menu de diplomatie abstrait.
- Les états sont sauvegardés dans un module additif versionné.
- **Tirage par la graine [DÉCISION]** : une campagne compte **quatre à six
  factions sur les dix**, choisies et placées par la graine. Les Relais sont
  toujours présents. Deux campagnes n'ont pas les mêmes voisins, et la fiche
  de graine (§7.13) ne les révèle pas : on les découvre.
- **Campagnes existantes [DÉCISION]** : elles peuvent recevoir les factions
  par **activation volontaire** depuis le dépôt, avec migration additive,
  comme les extensions actuelles. La même règle vaut pour les lois, les
  districts, l'eau de cité et la filière des corps. Seuls le monde sans bord
  et le relief restent réservés aux nouvelles campagnes.

### 4.5 Affrontements, destruction et ralliement **[DÉCISION]**

**Le combat contre des humains se joue au sol, et il est rare et coûteux.**

- Il arrive dans deux situations : une **embuscade** sur une route, ou
  l'**assaut d'un repaire** décidé par le joueur.
- Il est **bref et mortel** : peu d'adversaires, qui s'abritent, tirent juste
  et se replient. Aucun humain n'encaisse plus qu'un autre.
- Il se paie **trois fois** (§4.2) : munitions, bruit qui attire une
  migration, morts qui se relèvent des deux côtés.
- Il n'est jamais nécessaire pour avancer : chaque situation garde une issue
  sans tir.

**Une faction peut disparaître de deux façons.**

| Issue | Comment | Ce que la cité gagne | Ce que la cité perd |
|---|---|---|---|
| **Détruite** | Repaire pris et vidé | La route, le lieu, le stock sur place | Tout ce que la faction apportait : troc, transport, pièces, informations. Définitif. |
| **Ralliée** | Entente tenue dans la durée, puis une demande de la faction | Ses membres comme habitants, son lieu comme avant-poste, son savoir-faire | De la nourriture, des logements, parfois une loi imposée par l'accord |

- Une faction détruite ne revient pas. Son lieu reste, vide, et peut devenir
  un nid.
- Un ralliement n'est jamais offert : il se demande après des actes.
- Certaines factions ne se rallient pas : la Tablée ne peut être que tenue à
  distance ou détruite ; la Colonne ne s'arrête jamais.
- [PROPOSITION] Les Éteints ne se rallient qu'à une cité qui applique
  l'extinction des feux (§8.5).

### 4.6 Ce que les factions ne sont pas

- Pas une seconde horde : aucun assaut humain contre les enceintes.
- Pas un jeu de tir contre des humains : les rencontres armées sont brèves,
  rares et coûteuses.
- Pas une source de butin gratuit : détruire une faction supprime aussi ce
  qu'elle apportait.

### 4.7 Première tranche livrée **[LIVRÉ]**, nouvelles campagnes seulement

(`src/factions217.js`, valeurs dans `C.Factions217Rules`, test
`tests/factions217.test.cjs`)

Deux factions sur dix : **Les Rouleurs** (bande motorisée) et **Les Relais**
(Les Granges, La Rive, Fontvieille). Aucun hasard : tout suit le compteur de
retours chargés et le numéro de vague.

- **Relation** : une réputation entière par faction, montrée par les états
  de §4.4 (Inconnue, Repérée, En contact, Entente, Tension, Hostile), jamais
  par une jauge chiffrée. Seuls des actes la changent. Un relais ne devient
  jamais hostile.
- **Interception** : un fourgon d'expédition qui rentre avec au moins 20
  unités au coffre est repéré la première fois, puis barré tous les trois
  retours chargés. Les Rouleurs prennent 35 % du coffre, 24 unités au plus,
  carburant d'abord (50 % et 36 à l'état Hostile). Deux parades sans tir :
  deux fusiliers près du fourgon, ou un tribut de 6 carburant versé d'avance
  au dépôt. Personne ne tire, le fourgon n'est pas abîmé, le stock du dépôt
  n'est jamais touché.
- **Demande d'aide** : un relais demande de l'aide aux vagues 2, 5, 8…, en
  phase calme, pendant une vague. Un don pris au stock fait monter l'entente
  et rapporte, deux vagues plus tard, une contrepartie annoncée et plus
  petite que le don. Une demande ignorée fait baisser l'entente, sans autre
  sanction.
- Carte « Factions » dans le dossier de situation ; fiche et actions dans
  les opérations, groupe Région.

Réserves : jamais joué en partie réelle. L'escorte est sans doute trop
facile pour une grande cité (des fusiliers de garnison suffisent). Le tribut
est bon marché. « Entente » n'a encore aucun effet propre. Seul le fourgon
d'expédition local est concerné. Les factions n'ont aucune présence sur la
carte : ni lieu, ni silhouette, ni son.

Restent à faire : le tirage de quatre à six factions par la graine, leur
placement sur la carte, le combat « payé trois fois » (§4.2), la destruction
et le ralliement, l'activation volontaire des campagnes existantes, les huit
autres factions.

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
| Exploration | Récolte (au large) | Carburant, temps, risque | Ressources finies par lieu, recrues, récit | Chaque lieu s'épuise ; il faut aller plus loin, donc tenir plus de route. |
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

### 6.2 Table de révélation **[DÉCISION]**

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

**[DÉCISION]** Cette table ne porte que sur l'**interface**. Aucun prérequis
matériel, aucun coût et aucun seuil d'âge ne change : un système dont le
prérequis existant tombe plus tôt ou plus tard que sa ligne reste jouable
selon ses règles actuelles, et seul son menu attend l'âge indiqué.

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

### 6.4 Première tranche livrée **[LIVRÉ]**

Une première tranche de la révélation par âge est en place. Elle masque
**onze entrées de menu** au début d'une campagne et les rouvre avec l'âge.

| Menu masqué | S'ouvre à l'âge |
|---|---:|
| Fusiliers, point de ralliement, dossier de l'équipe | 2 (Camp fortifié) |
| Spécialistes, sorties, siège et secours, entretien des lignes | 3 (Avant-poste) |
| Sections de fusiliers, logistique | 4 (Forteresse) |
| Bulletin météo | 5 (Ville) |
| Quartiers | 6 (Grande ville) |

- **Où** : table et module dans `src/age-reveal.js`, test
  `tests/age-reveal.test.cjs`. La table est une donnée de présentation : elle
  reste hors de `src/core.js`, qu'aucune règle ne lit pour elle.
- **Comment** : le module pose un attribut sur des contrôles existants. Il ne
  lit ni n'écrit aucun stock, aucune règle, aucun tirage, aucune sauvegarde.
- **Réglage** : « Afficher tous les menus dès le début », dans les
  paramètres, avec le rappel de ce que l'âge suivant ouvrira.
- **Campagnes chargées** : l'âge ne redescend jamais ; une campagne avancée
  retrouve tous ses menus.
- Les fusiliers et les spécialistes suivent le **prérequis réel** de leur
  recrutement, lu dans les données.

Écarts volontaires avec la table du §6.2, par prudence :

- Les **doctrines** restent visibles dès l'âge 1 : un objectif du début
  demande d'en lancer une.
- La **carte**, l'**exploration**, les **préparatifs**, le **journal**, les
  **secteurs** et le **catalogue de construction** ne sont jamais masqués.
- Les sorties s'ouvrent à l'âge 3 plutôt qu'à l'âge 5 : elles servent tôt.
- Les opérations, l'armurerie, l'élevage, la citadelle verticale et la
  coopération ne sont **pas encore** concernés.

Limites connues :

- Les **raccourcis clavier** des systèmes masqués restent actifs.
- Les parcours **automatisés** et l'atelier auteur gardent l'interface
  complète, pour ne pas fausser les contrôles existants ; `?agereveal=1`
  force le masquage.
- Aucun objectif nouveau n'accompagne encore l'ouverture d'un menu.

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
- **Pénurie [DÉCISION]**, en trois temps :
  1. **Ralentir** : rendement des fermes et moral en baisse ; incendies plus
     difficiles à éteindre.
  2. **Faire partir** : des habitants quittent la cité.
  3. **Tuer** : si la pénurie dure, les plus fragiles meurent, **dans les
     murs**, avec le risque de réanimation ordinaire (§2.4).
  Chaque temps est annoncé avant d'arriver ; la mort n'est jamais une
  surprise.
- **Lien avec la météo** : une suite de fronts secs devient une vraie menace
  de gouverneur.
- **Lien avec la fiction** : la coupure d'eau ouvre la chronologie (§2.3).
- Les quatre réserves restent des objets distincts ; seul leur contenu est
  unifié. Migration de sauvegarde additive et testée.
- Propriétaires à étendre : `core.js` (`Siege`), `husbandry191.js`,
  `campaign-water214.js`, `weather193.js`, `urban.js`.

#### Première tranche livrée **[LIVRÉ]**

- **La population boit.** À partir de l'âge Ville, chaque habitant puise dans
  les **citernes existantes** : 0,004 unité par seconde et par personne, soit
  12 unités par minute pour 50 habitants.
- **Une seule réserve.** Ce sont les citernes des incendies : l'eau bue
  n'éteint plus un foyer. Aucune eau n'est créée ; la pompe (électricité et
  carburant) et la pluie restent les seuls apports.
- **Pénurie, premier temps seulement.** Citernes vides : 180 s de délai,
  annoncé. Ensuite le moral baisse de 0,35 par seconde, la moitié de la
  famine. Le retour de l'eau l'arrête aussitôt.
- **Nouvelles campagnes** : suivies d'office. **Campagnes existantes** :
  inchangées jusqu'à une activation volontaire, au dépôt, sans coût.
- **Avant la Ville** : aucun besoin, aucune consommation.
- Fiche « Eau de la cité » dans les dossiers du carnet : réserve, besoin par
  minute, autonomie sans apport.
- Valeurs dans `C.CityWater215Rules` (`src/core.js`), module
  `src/city-water215.js`, test `tests/city-water215.test.cjs`. État
  sauvegardé comme module additif, sans changer la version de sauvegarde.

Restent à faire :

- les deux autres temps de la pénurie : départs d'habitants, puis morts ;
- les débouchés cultures, élevage et clinique ;
- l'unité commune avec les abreuvoirs et les tonneaux, qui restent des
  réserves séparées, reliées par le seau ;
- puits, château d'eau et réseau ;
- le lien avec les saisons.

Ces valeurs n'ont été éprouvées par aucune campagne humaine.

#### Deuxième tranche livrée **[LIVRÉ]**

- **Pénurie, deuxième temps : les départs.** Après 7 min de citernes vides,
  la cité l'annonce ; à 10 min, un ouvrier sans affectation quitte la cité,
  puis un autre toutes les 2 min, six au plus. Ni le dernier ouvrier, ni un
  résident nommé, ni un habitant affecté ne partent. Un départ n'est pas une
  perte au combat.
- **Pénurie, troisième temps : les morts.** À 18 min, la cité l'annonce ; à
  21 min, le plus affaibli meurt dans les murs, puis un autre toutes les
  3 min, par le chemin de mort ordinaire. Les départs cessent alors. Le
  Commandant et le dernier ouvrier sont épargnés.
- **Le retour de l'eau arrête tout aussitôt** et réarme les seuils. Une
  reprise ne rejoue ni annonce, ni départ, ni mort.
- La fiche « Eau de la cité » indique le temps en cours, l'échéance suivante
  et les pertes dues à l'eau.
- L'état de la première tranche, s'il figure dans une sauvegarde, est
  accepté et converti sans effet rétroactif.

**Écart avec la décision** : les morts de soif **ne se relèvent pas**. Dans
le jeu actuel, seule la dépouille du survivant joué peut se relever (§2.4) ;
les unités ne laissent pas de corps. Il faut d'abord un système de dépouilles
pour toutes les unités.

Restent à faire : ce système de dépouilles ; le départ d'autres habitants
que les ouvriers ; cultures, élevage, clinique ; l'unité commune avec
abreuvoirs et tonneaux ; puits et réseau ; les saisons. Le moral tombe à
zéro vers 7 à 8 min de pénurie, bien avant les premiers départs : cet
enchaînement n'a pas été observé en partie.

### 7.4 Économie urbaine, énergie et signature **[LIVRÉ]**

- Consommation de 0,0065 nourriture/s par habitant ; une ferme donne 0,42/s.
- Sous 20 % de moral, les unités tombent à 82 % de leur vitesse.
- Énergie servie par priorité : défenses, clinique, industries.
- Signature = score du bâti + 2 × population + 2 × consommation électrique
  + 0,35 × nombre de structures. Effet : jusqu'à +80 % d'effectif.
- Propriétaires : `urban.js`, `power-grid.js`, `power-network173.js`,
  `vertical-network179.js`, `core.js`.
- **Habitants visibles et nommés [DÉCISION]** :
  - On **voit** les habitants circuler, travailler, puis se réfugier pendant
    l'assaut. C'est un dessin de la population réelle, pas une seconde
    simulation : aucun besoin individuel, aucune jauge par personne.
  - **Une douzaine de figures nommées** à la fois, chacune avec un métier.
    Leurs pertes entrent au registre, avec celles des compagnons.
  - Une figure nommée peut être **promue responsable de district** (§8.2)
    quand les quatre compagnons ne suffisent plus. Elle n'a pas d'arc
    narratif : c'est ce qui la distingue d'un compagnon.
  - Quand une figure meurt, une autre émerge de la population : la douzaine
    se renouvelle, les noms perdus restent au registre.
  - Un district perdu se lit dans la rue : des gens fuient vers l'enceinte
    intérieure.
  - Les prénoms viennent de la liste épicène existante ; aucun habitant
    nommé n'est l'un de « ceux d'avant » (§2.6).
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
- **Jour et nuit [DÉCISION]** : la nuit reste le temps de l'assaut. Mais une
  migration peut arriver **de jour**, rarement : chantiers ouverts, ouvriers
  dehors, portes en mode automatique. Un assaut de jour est moins nombreux et
  mieux visible ; il frappe une cité qui ne l'attendait pas. Il apparaît
  **dès la Forteresse (âge 4)**, pour environ **un assaut sur six**, et
  **jamais deux de suite**. Il s'annonce
  comme les autres (§8.6) : rare ne veut pas dire sans préavis.

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

Rythme **[DÉCISION]** :

- **Entre deux vagues** : l'échelle 1 se joue dans la phase calme, retour
  avant l'alerte. C'est l'exploration des âges 1 à 4.
- **Pendant les vagues** : les échelles 2 et 3 supposent une cité capable de
  tenir sans le Commandant (§7.15). C'est l'exploration des âges 5 et
  suivants.

Règles de cohérence :

- **Une seule carte**, avec trois niveaux de zoom, et un seul vocabulaire.
- Chaque sortie répond à un **besoin de la cité** affiché au départ : un
  chantier bloqué, une réserve basse, une route coupée.
- Chaque lieu est **fini** et ne se régénère pas ; le monde, lui, n'a pas de
  bord (§7.13). Aller plus loin coûte plus de carburant et plus de route à
  tenir : à terme, la cité doit produire ce qu'il devient trop cher d'aller
  chercher.
- Les six quartiers reçoivent une **position fixe** par rapport aux villes
  nommées, pour relier la carte locale à la carte régionale.
- Les versions de génération, flux aléatoires et identifiants restent ceux
  des campagnes existantes.
- Propriétaires : `frontier-*.js`, `expeditions.js`, `exploration-125.js`,
  `campaign-pack.js`, `field-atlas*.js`, `return-routes.js`.

#### Première tranche livrée **[LIVRÉ]**

Le carnet affiche, en tête des dossiers « Sur le terrain » :

- les **besoins de la cité** : eau en pénurie, munitions sous une salve,
  chantiers financés en attente, logements pleins, et les trois réserves les
  plus basses par rapport à leur plafond ;
- **où aller** : les trois échelles avec leurs entrées existantes, ouvertes
  par leurs onglets et fiches d'origine.

| Échelle | Entrées rangées |
|---|---|
| Les abords | Sorties, vestiges des six secteurs, plan de D-17, cueillette, chasse et pêche, trajets et récupération |
| Les secteurs | Quartiers et fourgons, expéditions et voiture |
| La région | Carte et exploration, voyages lointains, monde et relais, opérations de campagne |

- Une entrée voilée par l'âge n'est pas proposée. Le bilan de départ cite
  les mêmes besoins.
- Module `src/exploration-scales.js`, test
  `tests/exploration-scales.test.cjs`. Présentation seulement : aucun stock,
  tirage, règle ni état sauvegardé.
- Les réserves sont classées par taux de remplissage, sans seuil propre.
  « Munitions sous une salve » compare le stock au coût d'un tir de toutes
  les défenses et de tous les fusiliers : c'est le seul critère construit
  pour cette tranche.

Restent à faire : une seule carte à trois niveaux de zoom ; la position fixe
des six quartiers ; le besoin « route coupée » ; le lien entre un besoin et
un lieu précis encore approvisionné ; la révélation par âge des fiches
d'opérations ; un vocabulaire unifié, car « secteurs » désigne encore
l'onglet des vestiges **et** la deuxième échelle.

#### Deuxième tranche livrée **[LIVRÉ]**

- **Un besoin, des lieux.** Sous chaque besoin de réserve, le carnet nomme
  les lieux connus qui en détiennent encore, au plus deux par échelle, du
  plus proche au plus lointain : nom, sorte de lieu, échelle, reste, cap et
  distance depuis le centre de D-17, bouton vers l'onglet ou la fiche
  d'origine. Un lieu vidé disparaît ; un lieu voilé par l'âge n'est ni
  proposé ni nommé. Sans lieu : « Aucune source connue : explorer plus
  loin. » L'eau renvoie à l'enceinte.
- **Vocabulaire unique des lieux** : gisement, vestige, cueillette,
  **quartier** (les six territoires), **halte d'expédition** (les douze
  destinations), site régional.
- **Une seule carte.** Les six quartiers et les douze haltes avaient déjà
  une position régionale : ils tiennent dans le carré de 128 m de D-17.
  Chacun reçoit un cap et une distance fixes depuis le centre et la ville
  nommée la plus proche. L'atlas les dessine au zoom de la cité (losange :
  quartier ; carré : halte repérée) ; un volet sous la carte les liste et
  cadre la vue.
- Module `src/exploration-needs217.js`, test
  `tests/exploration-needs217.test.cjs`. Présentation seulement, toutes
  campagnes : aucun stock, tirage, règle ni état sauvegardé.

Réserves : les sites régionaux ne sont relus que si la carte régionale a
déjà été dessinée dans la session (la construire coûte environ 4 s) ; cette
partie n'a pas été jouée. Chasse et pêche ne sont pas reliées. Les distances
sont à vol d'oiseau, sans durée ni carburant. **À trancher** : les haltes
d'expédition sont proposées dès l'âge 1, alors que cette échelle est rangée
aux âges 5 et 6.

Restent à faire : le besoin « route coupée », une durée de trajet, la chasse
et la pêche comme sources, le renommage des onglets d'origine.

### 7.10 Météo, élevage, cueillette **[LIVRÉ]**

- Six fronts de quatre minutes ; la tendance suivante se lit dans les
  90 dernières secondes.
- Élevage : enclos de 3 × 3 m, huit enclos de quatre animaux au plus.
- Cueillette : 16 espèces.
- **Saisons longues [DÉCISION]** : quatre saisons se succèdent sur la durée
  d'une campagne, par-dessus les fronts météo existants.

  | Saison | Ce qu'elle change | Systèmes touchés |
  |---|---|---|
  | Printemps | Crues, sols détrempés | Rivières, cuvettes, routes basses, fossés qui se remplissent |
  | Été | Sécheresse, incendies | Eau de cité, fermes, feu, bûchers |
  | Automne | Boue, brouillard | Véhicules, convois, préavis des hordes |
  | Hiver | Gel, nuits longues | Cultures à l'arrêt, eau gelée, corps conservés plus longtemps, assauts plus longs |

  - Une saison change la **question logistique** du moment, pas les règles.
  - Elle s'annonce : le joueur prépare l'hiver, il ne le subit pas.
  - **[DÉCISION]** Une saison se **compte en assauts** : « encore deux nuits
    avant l'hiver ». [PROPOSITION] Six assauts par saison ; la valeur vit
    dans `src/core.js`.
  - Le calcul des saisons, comme celui de la météo, ne consomme pas le flux
    aléatoire de la simulation.
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
- **Coopération [DÉCISION]** : viser une **vraie coopération**, plusieurs
  joueurs dans la même cité.
  - L'image visée : l'un tient le mur pendant que l'autre explore. C'est la
    cité autonome (§7.15) avec un humain à la place des consignes.
  - C'est le chantier technique le plus lourd de cette bible : il faut une
    **autorité unique** sur le monde (un hôte), là où le relais actuel n'en a
    aucune, et une simulation qui ne dépend plus de l'écran d'un seul joueur.
  - **Format** : un hôte et jusqu'à **trois invités**, qui rejoignent ou
    quittent une campagne en cours.
  - La campagne appartient à l'hôte et ne tourne que lorsqu'il joue : pas de
    serveur persistant.
  - Une seule sauvegarde, celle de l'hôte. Les invités n'emportent rien.
  - Le Commandant reste unique ; les autres joueurs tiennent le rôle de
    responsables de district ou de chefs de sortie.
  - **Aucune pause à plusieurs.** En solo, le poste de commandement met
    toujours la simulation en pause. En coopération, le temps ne s'arrête
    jamais : on commande pendant que les autres jouent.
  - **Si le Commandant meurt**, l'hôte incarne la relève, comme en solo. Les
    invités gardent leur rôle.
  - Les records restent locaux et sans classement.
- Toute évolution de cette bible passe par un module de sauvegarde additif.

### 7.13 Un monde procédural sans bord **[DÉCISION]**

#### D'où l'on part **[LIVRÉ]**

| Sujet | État en 1.74.0 |
|---|---|
| Taille | Région finie de 24 576 m de côté (8 192 m pour les générations 1 à 4). Constante dure dans `core.js`. |
| Découpage | 576 secteurs de 1 024 m ; arbres et rochers par morceaux de 256 m (25 en cache) ; 48 plans d'intérieurs en cache. |
| Génération | Routes et lieux créés **d'un bloc** au lancement (environ 7 s) : de l'ordre de 3 100 routes et 3 200 lieux par graine. |
| Variété | Depuis G6, la graine fixe la position de D-17, 34 agglomérations, le réseau routier, les biomes, cinq rivières et la côte. Quatre profils de paysage. |
| Biomes | 16 milieux tempérés. |
| Relief | **Aucun.** L'altitude n'est qu'un canal de climat ; le sol est plat ; seule l'eau a une profondeur. |
| Lieux | Tous visitables (un à trois niveaux), butin fini jamais régénéré, un à quatre occupants. Environ 41 % infestés, 53 % vides, 6 % alliés. |
| Terrain | Arbres, rochers et épaves se prélèvent et le prélèvement persiste. Aucun creusement, fossé ni talus. Aucune construction en région. |

Ce qui borne le monde aujourd'hui : la taille figée, la génération d'un bloc,
les identifiants de lieux limités à 10 000, les validateurs de sauvegarde
bornés à la taille de la carte, la côte qui longe les bords, et la carte
d'atlas calée sur l'étendue totale.

#### Direction : sans bord

- Le monde se génère **par cantons** au fil de l'avancée, à partir de la
  graine et des coordonnées du canton. Deux cantons voisins partagent leurs
  points de raccord (routes, cours d'eau) pour ne laisser aucune couture.
- **La limite n'est plus un mur, c'est le réservoir.** Un break parcourt
  environ 6 km avec un plein. Aller plus loin exige des dépôts, des
  avant-postes et des routes tenues (§7.14) : la portée du joueur devient une
  mesure de la puissance de sa cité.
- **Plus loin, plus rare et plus dur** : sites remarquables plus riches,
  migrations plus nombreuses, relais plus espacés.
- La côte et les grands cours d'eau deviennent des éléments de paysage, pas
  une clôture.
- Les identifiants portent les coordonnées de leur canton ; les registres de
  sauvegarde sont **creux** : ils ne retiennent que ce que le joueur a touché.
- **Nouvelles campagnes seulement [DÉCISION].** Le monde sans bord est une
  nouvelle génération de monde. Les campagnes existantes gardent leur région
  finie, leurs identifiants, leurs flux aléatoires et leurs prélèvements ;
  aucune n'est convertie.
- Propriétaires : `frontier-world.js`, `frontier-state.js`, `geography135.js`,
  `hydrology165.js`, `atlas-projection.js`, `core.js`.

**Avancement [LIVRÉ, sans effet en jeu]**

- **[DÉCISION]** Le monde sans bord passe avant le relief.
- Cadrage dans `specs/monde-sans-bord/` : inventaire de ce qui suppose un
  bord, architecture, tranches T0 à T7, risques, décisions D1 à D7.
- Première brique : `src/world-cantons217.js`, adressage pur des cantons de
  1 024 m (coordonnées signées, identifiants `K<cx>_<cy>`, sous-graines de
  canton, de couture et de sommet indépendantes de l'ordre de visite, anneau
  de chargement, cache borné). Le jeu ne la charge pas ; aucune génération
  1 à 11 ne la lit. La génération 12 est réservée et refusée partout tant
  que la tranche d'ouverture n'est pas livrée.
- Les deux inconnues techniques : un réseau routier connexe sans arbre
  couvrant global, et une hydrologie qui ne dépend plus d'un bord (la côte
  est aujourd'hui un des quatre bords).
- Tranche suivante recommandée : des accesseurs de limite posés sur les
  mondes existants, sans changer aucune valeur, vérifiés par les empreintes.

#### Direction : des lieux à découvrir

Trois rangs de lieux, pour que l'exploration ait des souvenirs :

| Rang | Fréquence | Exemple | Ce qu'on y gagne | Ce qu'on y risque |
|---|---|---|---|---|
| **Ordinaire** [LIVRÉ] | Des milliers par région | Maison, commerce, atelier | Butin courant | Un à quatre occupants |
| **Remarquable** [LIVRÉ, première tranche] | Quelques-uns par canton | Hôpital, caserne, dépôt de carburant, silo, gare de triage, barrage, émetteur | Une chose que la cité ne fabrique pas encore : machine, plan, pièce de grand ouvrage, recrue qualifiée | Un **nid** : des infectés qui stagnent en masse |
| **Singulier** [PROPOSITION] | Un par grande distance | Un lieu nommé, lié au récit ou à une faction | Une trace, une rencontre, une décision | Propre au lieu |

- Les 4 000 plans du codex servent de matière première ; il manque surtout
  des **lieux qui comptent**, pas des plans.
- Un lieu remarquable se **voit de loin** (château d'eau, cheminée, pylône) :
  on choisit d'y aller, on n'y tombe pas par hasard.
- Un nid vidé peut se repeupler si une migration passe : rien n'est acquis
  hors des murs.

**Première tranche livrée [LIVRÉ] : lieux remarquables et nids**, nouvelles
campagnes seulement (`src/remarkable217.js`, valeurs dans
`C.Remarkable217Rules`, test `tests/remarkable217.test.cjs`)

- Les lieux remarquables sont des lieux **déjà générés**, promus par une
  fonction pure du monde : usage lu sur leur nom (hôpital, caserne, dépôt de
  carburant, silo, gare, barrage, émetteur, château d'eau, centrale),
  emprise d'au moins 400 m², deux au plus par canton de 4 km, à 1 km
  d'écart. Soit 39 à 48 lieux par région. Aucun lieu créé, déplacé ni
  renommé.
- **Vu de loin** : une silhouette (château d'eau, cheminée, pylône) avec nom
  et distance, sur l'atlas et en vue de région, visible à 2,5 km. Un seul
  lieu peut être désigné **objectif de sortie**, avec cap et distance.
- **Nid** : 10 à 16 infectés au lieu de 1 à 4, immobiles tant qu'on ne les
  dérange pas. Ce sont les occupants ordinaires : seul leur nombre change.
- **Récompense** : un lot annoncé d'avance sur la fiche (médicaments,
  munitions ou carburant, 24 à 36 unités), chargé sur place une fois le nid
  vidé, une seule fois.

Réserves : aucun combat réel contre un nid n'a été joué. **Il n'y a pas de
distance minimale à la cité** : sur la graine 17117, un nid est à 365 m de
D-17. Les lots cumulés font environ 1 300 unités rares par région, à
surveiller. Le classement par nom a ses approximations (une clinique
vétérinaire compte comme hôpital). La minicarte de région ne porte aucun
repère.

Restent à faire : le rang singulier, le repeuplement par migration, des
récompenses autres que des ressources (machine, plan, pièce de grand
ouvrage, recrue qualifiée).

#### Direction : un terrain modifiable

Le moteur est en 2D et 2,5D : la transformation du terrain se fait **par
cases sur la grille existante**, pas par blocs en volume.

| Travail [PROPOSITION] | Effet de jeu | Lien de cohérence |
|---|---|---|
| Fossé | Ralentit et canalise la horde | Les corps finissent par le combler : il se déblaie comme un mur. |
| Douve | Fossé en eau | Consomme l'eau de cité (§7.3). |
| Talus | Protège un tireur, surélève un mur | Fait avec la terre du fossé : l'un ne va pas sans l'autre. |
| Défrichage | Dégage un champ de tir | Le bois récolté est un prélèvement ordinaire. |
| Carrière | Gisement de pierre creusé par le joueur | Reste une cicatrice visible sur la carte. |
| Remblai | Referme un fossé, répare une route | Coûte de la pierre ou de la terre. |

Règles :

- Tout travail de terrain est un **chantier** : financé, puis accompli
  physiquement par le joueur ou les ouvriers.
- Il modifie le **coût de passage** lu par le champ de flux des hordes ; il
  ne crée pas de règle parallèle.
- Il est **persistant** et enregistré dans un registre creux, comme les
  prélèvements actuels.
- **[DÉCISION]** Les travaux sont permis dans **toute l'emprise de la cité
  et des avant-postes** (§7.14), pas en pleine région.

#### Direction : un relief par paliers **[DÉCISION]**

Le sol passe de plat à **quelques niveaux francs** : plateaux, falaises,
cuvettes, et des pentes pour passer de l'un à l'autre.

| Ce que le relief apporte | Lien de cohérence |
|---|---|
| Des **points de vue** | On voit la marée venir de plus loin (§8.6). |
| Des **murs adossés** | Une falaise vaut une enceinte ; une pente est une porte. |
| De l'**eau qui descend** | Rivières, cuvettes inondables, château d'eau en hauteur (§7.3). |
| Des **passages obligés** | Les cols et les rampes canalisent hordes et convois. |
| Des **sites qui diffèrent** | La graine change vraiment la façon de bâtir. |

Règles :

- Paliers discrets, pas de pente continue : le jeu reste lisible vu de
  dessus, et les collisions restent sur la grille.
- Le champ de flux des hordes lit le relief comme un coût : une falaise est
  infranchissable, une rampe est un goulet.
- Fossés et talus deviennent le relief **fait par le joueur** : mêmes règles,
  même registre.
- Le relief n'existe que dans la nouvelle génération de monde.
- C'est un chantier lourd : rendu, vision, eau, construction, citadelle
  verticale. À mener **avec** le monde sans bord, puisque les deux exigent
  une nouvelle génération.

#### Direction : des graines qui comptent

- Une graine se **partage** : elle recrée la carte, pas le combat.
- Chaque campagne affiche une **fiche de graine** : milieu dominant, eau,
  densité urbaine, distance aux premiers lieux remarquables.
- La graine doit changer la **stratégie d'ouverture** : une cité de plaine
  sans pierre ne se bâtit pas comme une cité de plateau sans eau.

**Première tranche livrée [LIVRÉ] : la fiche de graine**, toutes campagnes
(`src/seed-card217.js`, présentation seule, test
`tests/seed-card217.test.cjs`)

- Le carnet, classement « Sur le terrain », affiche sous les échelles
  d'exploration une fiche de graine repliable : graine et profil de paysage,
  milieu dominant et milieux voisins autour de D-17, rivière et côte les
  plus proches (ou « aucune eau proche »), densité urbaine en un mot (isolé,
  rural, périurbain, urbain), gisements de bois, de pierre et de ferraille à
  portée de marche du centre, premiers lieux de la carte, et un conseil
  d'ouverture déduit de ces seuls faits.
- Deux boutons copient la graine seule ou la fiche entière.
- Au menu, une ligne sous le champ de graine résume la carte en cours.
- La fiche est une fonction pure du monde déjà généré : aucun tirage, aucun
  état sauvegardé. Elle compte les gisements à leur quantité d'origine et ne
  change donc pas avec la récolte.

Réserves : la fiche **décrit**, elle ne change pas l'ouverture. Elle nomme
des agglomérations, une carrière ou une casse avant leur reconnaissance.
Le menu ne décrit pas une graine saisie avant le départ (il faudrait tracer
la région, 1 à 8 s). Les cartes d'avant G6 n'ont ni milieu ni eau relevés.
Un adjectif du conseil ne s'accorde pas avec les noms de milieux au pluriel.

**Travaux de terrain** (direction « un terrain modifiable », plus haut)

**Première tranche livrée [LIVRÉ] : le fossé**, nouvelles campagnes seulement
(`src/earthworks217.js`, valeurs dans `C.Earthworks217Rules`, test
`tests/earthworks217.test.cjs`)

- Le fossé se choisit au catalogue, onglet Défense, dès l'âge Refuge, et se
  pose case par case dans l'emprise de la cité (44 cases autour du centre).
  La pose coûte 4 bois ; la case est ensuite creusée à la main en 10 s de
  travail, par les ouvriers (après les autres chantiers) ou par le
  Commandant immobile à portée.
- Un fossé ouvert ralentit l'infecté qui le traverse (vitesse ×0,55) et
  ajoute un coût de passage : une partie de la horde le contourne quand le
  détour est court. Il ne bloque aucun passage, n'inflige aucun dégât et ne
  gêne ni les ouvriers ni le Commandant.
- Les infectés abattus dans le fossé ou à son bord y tombent. Chaque case
  absorbe 6 corps ; au-delà elle est comblée et n'a plus d'effet. L'ordre
  « déblayer » existant, et la corvée de déblaiement (§8.5), vident les
  fossés après les murs, à la même cadence.
- Le fossé n'est pas un ouvrage du monde : il tient dans un registre à part,
  sauvegardé par case, pour ne jamais devenir un obstacle attaquable.

Réserves : aucun assaut réel n'a été joué ; l'effet sur le choix des fronts
n'a pas été observé. Une ligne simple devant un front dense sera vite
comblée. À 4 bois, un joueur peut tapisser les approches (256 cases au
plus). Un clic par case, pas de tracé en ligne. Le fossé n'est pas dessiné
dans la vue à la première personne. Le Commandant creuse dès qu'il reste
immobile près d'un fossé, sans geste explicite. Le remblai est gratuit,
alors que la direction le veut payant.

Restent à faire : talus, douve, défrichage, carrière, remblai payant, tracé
en ligne, travaux aux avant-postes.

### 7.14 Se déplacer dans le monde **[DÉCISION]**

#### Véhicules à entretenir

**[LIVRÉ]** Neuf véhicules pilotables : skate, vélo, moto, compacte, break,
buggy, fourgon, bus, camion. Vitesses de 6,2 à 20 m/s, coffres de 4 à 260,
réservoirs de 10 à 65. Santé de 45 à 760 ; épave à zéro. Une révision du
moteur réduit la consommation de 20 % sur 2 000 m. Aucune panne.

**[PROPOSITION]**

- **Usure plutôt que hasard** : une panne vient d'un entretien négligé, que
  le joueur pouvait prévoir.
- **Remorquage** d'une épave par un véhicule plus lourd.
- **Bruit** : un moteur attire, selon sa taille. Le vélo reste le véhicule de
  l'éclaireur.
- **Garage** de cité : entretien, modification, chargement des convois.

#### Avant-postes bâtis

**[LIVRÉ]** Un relais s'ouvre dans un lieu sécurisé ou allié : 8 s, 8 bois et
4 ferraille, capacité 120, repos possible. Un lieu sécurisé peut être
réinfesté. Rien ne se construit au loin.

**[PROPOSITION]** Le relais devient le premier rang d'un **avant-poste** :

| Rang | Ce que c'est | Ce qu'il permet |
|---|---|---|
| Relais [LIVRÉ] | Un coffre et un lit | Point de retour, dépôt, repos |
| Poste | Une petite enceinte et un dépôt de carburant | Ravitaillement des véhicules, guet d'une route |
| Avant-poste | Une garnison, un émetteur, un garage | Convois automatiques, radio, base d'opérations lointaines |

- Mêmes règles que la cité : chantier, enceinte réellement fermée, garnison
  nourrie, signature locale.
- Un avant-poste **peut tomber**. Il n'attire pas de vague numérotée mais des
  migrations et, plus tard, des factions (§4).
- **Aucun plafond fixe [DÉCISION]** : on tient autant d'avant-postes qu'on
  peut en nourrir, en garnir et en relier par une route gardée. La limite est
  logistique, comme partout ailleurs dans le jeu.

#### Routes à sécuriser

**[LIVRÉ]** Les routes servent au guidage et aux chemins de retour ; aucune
ne se sécurise.

**[PROPOSITION]** Quatre états par tronçon :

`Inconnue → Reconnue → Dégagée → Gardée`

- **Dégager** : retirer les épaves, déjà démontables aujourd'hui.
- **Garder** : un poste à chaque extrémité.
- Une route gardée est **rapide et sûre** ; les fourgons des territoires et
  les convois l'empruntent seuls.
- Règle déjà vraie dans la cité et qui reste vraie ici : **une bonne route
  sert aussi l'ennemi**. Une route gardée guide les migrations vers D-17.

#### À pied et campement

**[LIVRÉ]** Quatre bivouacs au plus, 600 s chacun, 12 bois et 6 ferraille ;
repos contre 3 vivres. Torche, feu de camp et lanterne fonctionnent en
région. Un bivouac n'arrête ni la nuit ni les vagues.

**[PROPOSITION]** Faire peser la nuit dehors :

- un feu **protège et signale** à la fois : chaleur et visibilité contre
  attraction locale ;
- les nuits noires s'appliquent aussi en région ;
- une sortie à pied de plusieurs jours impose de choisir **où dormir** avant
  la tombée de la nuit.

### 7.15 La cité autonome **[DÉCISION]**

#### D'où l'on part **[LIVRÉ]**

- Quand le Commandant est en région, **D-17 continue d'être simulée en temps
  réel** : vagues, ouvriers, production, tourelles, fusiliers.
- Le joueur absent n'est plus ciblé par les infectés de la cité.
- Une alerte s'affiche à chaque passage en phase d'alerte ou d'assaut ; le
  tableau régional montre la phase en cours de D-17.
- Avant le départ, un bilan signale les postes sans munitions ou sans
  courant et l'état du centre.
- Il n'existe **ni radio, ni retour d'urgence** : il faut revenir
  physiquement à la porte.
- Si le centre tombe pendant l'absence, la campagne est perdue.
- **Incohérence** : l'escalade verticale, la population verticale et les
  meutes sauvages sont **en pause** pendant l'absence. Une partie de la cité
  se défend, une autre attend le joueur.

#### Direction

1. **Tout ou rien.** Pendant l'absence, tous les systèmes de siège tournent,
   ou aucun. La pause partielle du siège vertical est à lever en premier.
2. **Consignes d'absence.** Avant de sortir, le Commandant fixe une posture
   pour chaque district (§8.2) : tenir, se replier sur une enceinte donnée,
   sacrifier un secteur. Les responsables l'appliquent ; ils n'improvisent
   pas.
3. **Radio.** Un poste radio transmet des messages **factuels** : front
   annoncé, brèche, secteur perdu, munitions basses. Sa portée dépend des
   émetteurs des avant-postes. Hors de portée, c'est le silence, et le
   silence fait partie de la tension.
4. **Rappel.** Pas de téléportation. Le rappel trace le chemin le plus rapide
   par les routes gardées. Rentrer à temps est une affaire de routes, donc de
   préparation.
5. **Estimation honnête.** À la porte, le bilan de départ indique ce que la
   cité peut raisonnablement tenir sans le Commandant. C'est une estimation,
   jamais une garantie.
6. **Le dernier carré [DÉCISION].** Si le centre tombe pendant l'absence du
   Commandant, la campagne n'est pas perdue sur-le-champ :
   - les survivants se replient dans un **dernier réduit** ;
   - un **délai** s'ouvre, annoncé par radio si elle porte ;
   - le Commandant doit **rentrer et reprendre le centre** avant la fin du
     délai ;
   - passé ce délai, ou si le réduit tombe, c'est la défaite.
   **Aucun chrono arbitraire** : le réduit tient tant qu'il a des
   défenseurs, des munitions et des vivres. Une cité préparée tient
   longtemps ; une cité négligée, presque pas. Le joueur voit ce qu'il reste
   au réduit, pas un compte à rebours.
   **Après la reprise : une cité à reconquérir.** Le centre est repris, mais
   les districts sont perdus : bâtiments dégradés mais debout, population
   réduite, secteurs à reprendre un par un selon les règles du §8.3. Les âges
   et connaissances acquis restent acquis. Le dernier carré n'efface pas la
   cité ; il transforme la campagne en reconquête.
   La règle ne vaut **que pour l'absence** : un centre détruit sous les yeux
   du Commandant reste une défaite immédiate.

#### L'autonomie comme progression

| Âges | La cité sans le Commandant | Exploration possible |
|---|---|---|
| 1–2 | Ne tient pas une nuit | Abords, entre deux vagues |
| 3–4 | Tient une vague ordinaire, pas une brèche | Abords, retour avant l'alerte |
| 5–6 | Tient si les consignes sont bonnes | Secteurs, pendant une vague |
| 7+ | Tient plusieurs nuits, perd parfois un district | Région, plusieurs jours |

L'autonomie se **gagne** : c'est la récompense de l'automatisation, des
districts et des routes. Elle est le lien direct entre le pilier « bâtir la
mégacité » et l'exploration.

Propriétaires : `frontier.js`, `departure130.js`, `frontier-ui.js`,
`vertical-siege176.js`, `vertical-population181.js`, `game.js`.

#### Première tranche livrée **[LIVRÉ]**

Direction 1, « tout ou rien » : pendant une sortie régionale, D-17 est
désormais **simulée en entier**.

- **Siège vertical** : pression des faces, ascension, chute, escaliers,
  passerelles et attaques de palier continuent.
- **Personnel vertical** déjà affecté : trajets, livraisons, réparations,
  soins et gardes continuent.
- **Bandes errantes** : elles restent **suspendues** pendant l'absence,
  comme avant. Une première version les faisait avancer : le parcours de
  terrain de la CI a montré qu'une cité des premiers âges tombait alors en
  moins de quatre minutes, sans avoir subi une seule vague. Les lever
  demandera une règle de distance ou de délai, donc un équilibrage.
- Le Commandant absent n'est ni visé ni blessé par un grimpeur, et sa
  position mémorisée à la limite n'encombre plus aucun passage.
- Les **ordres** (affecter, transférer, rappeler, bâtir) exigent toujours sa
  présence : la cité n'improvise pas.
- La première arrivée de la horde sur un chemin de ronde est annoncée une
  fois par les notifications ordinaires, qui restent affichées en région
  comme les annonces de brèche, de secteur perdu et de pénurie d'eau.
- Test `tests/absence-coherence216.test.cjs`. Aucune valeur d'équilibrage,
  format de sauvegarde inchangé.

Conséquences à connaître :

- **L'absence est plus dangereuse qu'avant aux âges tardifs** : un rempart
  peut être escaladé pendant que le Commandant est sorti. Aucun
  rééquilibrage n'a été fait.
- Les cités sans rempart vertical ne sont pas concernées.

Restent à faire : bandes errantes pendant l'absence (avec une règle
d'équité), consignes d'absence, radio et portée (les annonces arrivent
aujourd'hui sans condition de portée), rappel par les routes gardées,
estimation honnête au départ, dernier carré.

**Radio et consignes, première tranche [LIVRÉ]**
(`src/city-radio217.js`, valeur dans `C.CityRadio217Rules`, test
`tests/city-radio217.test.cjs`)

- **Radio, toutes campagnes** : pendant une sortie en région, un répartiteur
  (Sami V.) relaie les faits de D-17 : front annoncé, assaut, brèche nommée,
  secteur perdu ou repris, mur qui menace de céder, amas imminent ou
  franchi, pénurie d'eau, moral au plus bas, centre gravement endommagé,
  munitions communes épuisées.
- Chaque fait est daté et annoncé une fois par épisode ; jamais quand le
  Commandant est sur place, ni à la reprise d'une sauvegarde. Une
  aggravation est réannoncée, une amélioration non.
- Le poste s'affiche pendant la sortie ; les douze derniers messages restent
  dans le carnet, onglet Situation.
- **Consignes, nouvelles campagnes seulement** : avant de sortir, le
  Commandant fixe une consigne pour toute la cité : tenir la ligne, replier
  les combattants à la première brèche, ou repli général à la première
  brèche. La cité l'applique seule, une fois par vague, par les ordres de
  repli existants, et lève le repli quand l'assaut est fini. Si le
  Commandant rentre avant, c'est à lui de le lever.
- Aucune règle de combat nouvelle. Les bandes errantes restent en pause
  pendant l'absence.

Réserves : jamais joué en vraie partie ; la brèche vue au navigateur venait
d'un mur détruit par script. **La radio porte partout**, alors que la
direction veut le silence hors portée. L'absence, c'est la sortie
régionale seulement. Risque du repli général en absence : les ouvriers
cessent de produire jusqu'à la fin de l'assaut, les portes peuvent être
closes au retour, et les sections restent groupées au centre après la
levée. À valider côté récit : Sami V. est-il bien vivant à D-17 ?

Restent à faire : portée radio liée aux émetteurs des avant-postes,
consignes par district et « sacrifier un secteur », rappel par les routes
gardées, estimation honnête au départ, dernier carré.

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

#### Première tranche livrée **[LIVRÉ]**

Le dossier **Situation** s'ouvre désormais sur deux cartes :

- **Signature de la cité** : la valeur, ses quatre parts (bâtiments achevés,
  population, consommation électrique, nombre de structures) et son effet sur
  la vague en cours, en pourcentage et en nombre d'infectés supplémentaires.
- **Dernière nuit** : durée, infectés éliminés, équipiers perdus, structures
  perdues, tirs du commandant. Une phrase de bilan est aussi annoncée une
  fois, à la sécurisation.

Détails :

- Module `src/siege-readout.js`, test `tests/siege-readout.test.cjs`.
- Présentation seulement. L'effet sur la horde est **lu** dans le plan de
  vague du moteur, sans recopier sa formule ; le bilan est **lu** dans le
  registre des nuits déjà tenu par la citadelle, jusque-là visible seulement
  au fond d'un dossier.
- Une campagne reprise ne répète pas l'annonce de l'ancienne nuit.

Restent à faire dans ce rang : fronts nommés, secteurs tenus, perdus et
repris, munitions tirées par la garnison.

#### Repli sur l'enceinte intérieure et brèches nommées **[LIVRÉ]**

**[DÉCISION]** Les deux ordres de repli existent, côte à côte, dans l'onglet
Situation du carnet :

| Ordre | Ce qu'il fait | Ce qu'il ne touche pas |
|---|---|---|
| **Repli des combattants** | Les trois sections se replient vers le centre. | Ouvriers et portes. |
| **Repli général** | Sections, ouvriers et spécialistes rentrent ; les portes de l'enceinte intérieure sont verrouillées dès que plus personne n'est dehors. | Rien n'est fermé tant qu'un équipier, ou le Commandant, est dehors. |
| **Lever le repli** | Les portes verrouillées par l'ordre retrouvent leur mode précédent ; les ouvriers reprennent. | Les sections attendent un nouveau point de ralliement. |

- **Enceinte intérieure** : la zone qu'on atteint depuis le centre sans
  franchir un mur ni une porte, quel que soit le mode de la porte. Avec
  plusieurs enceintes, c'est la plus proche du centre.
- Sans enceinte fermée, le repli général replie tout le monde et ne
  verrouille rien : le jeu le dit.
- **Brèche nommée** : quand un mur ou une porte tombe pendant l'alerte ou
  l'assaut, l'annonce donne le **côté** (nord, est, sud, ouest), l'ouvrage, et
  le nombre d'infectés déjà dans l'enceinte intérieure.
- Module `src/fallback-order.js`, test `tests/fallback-order.test.cjs`.
- L'ordre **compose des commandes existantes** (repli des sections, ordre de
  repli des ouvriers, mode des portes) avec leurs propres refus. Il n'ajoute
  ni valeur d'équilibrage, ni stock, ni dégât, ni tirage, et ne modifie pas
  `src/core.js`.

Limites :

- L'ordre de repli en cours, les portes qu'il a verrouillées avec leur mode
  précédent, les brèches ouvertes et la ligne de repli choisie sont
  **sauvegardés** (module additif `fallback217`). Une reprise ne réannonce
  rien ; une sauvegarde plus ancienne se charge sans ordre ni brèche.
- Le repli vise toujours le centre. Le repli **enceinte par enceinte**, avec
  le choix de la ligne à tenir, viendra avec les districts (§8.2).
- Le repli général est le premier pas du sacrifice de secteur (§8.3), sans
  encore l'évacuation des stocks ni l'état « perdu ».

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

#### Première tranche livrée **[LIVRÉ]**

Le jeu reconnaît **toutes les enceintes fermées** autour du centre, de
l'intérieur vers l'extérieur : « Enceinte intérieure », « Deuxième
enceinte », « Troisième enceinte »… Un **district** est la zone d'une
enceinte moins celle des enceintes intérieures ; le reste est « Dehors ».
Une porte reste une limite quel que soit son mode. Pas de district sans
périmètre réellement fermé.

- L'onglet Situation du carnet liste chaque district avec des faits
  comptés : bâtiments achevés, logements, équipiers par rôle, portes et leur
  mode, ouvrages en service et fragiles, infectés présents.
- Dès qu'il y a deux enceintes fermées, le Commandant choisit la **ligne de
  repli général** : tout le monde rentre toujours vers le centre, mais ce
  sont les portes de l'enceinte choisie qui sont verrouillées, et seulement
  quand plus personne n'est au-delà. Si cette ligne tombe, le repli revient
  à l'enceinte encore fermée.
- Module `src/districts.js`, test `tests/districts.test.cjs`. Lecture
  seule : aucune valeur d'équilibrage, aucun stock, dégât, tirage ni état
  sauvegardé. Le seuil de mur fragile est celui du relevé de champ de
  bataille.

Restent à faire : responsable, garnison affectée, stocks propres et
priorité ; ordres *tenir / évacuer / sacrifier* ; repli des unités vers une
enceinte plutôt que vers le centre ; état des secteurs (§8.3) par district ;
révélation à l'âge 6 (la section est visible dès maintenant).

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

#### Première tranche livrée **[LIVRÉ]**

L'onglet Situation du carnet affiche l'**état des quatre secteurs** de la
cité (nord, est, sud, ouest) et, quand une ligne est ouverte, la
**reconquête en trois temps**.

| État | Ce qui le déclenche |
|---|---|
| Tenu | Ligne intacte, aucun contact. |
| Menacé | Ligne intacte, mais contacts ou murs fragiles de ce côté pendant l'alerte ou l'assaut. |
| Contesté | Un mur ou une porte de ce côté est tombé ; personne n'est encore entré. |
| Perdu | La ligne est ouverte **et** des infectés sont à l'intérieur. |
| Repris | La brèche est rebâtie : annoncé une fois, puis le secteur redevient tenu. |

Reconquête, lue sur l'état réel :

1. **Isoler** : fait quand chaque brèche est recouverte par un mur ou une
   porte en service.
2. **Nettoyer** : fait quand plus aucun infecté n'est près du centre.
3. **Rétablir** : fait quand les deux premiers le sont et que le repli est
   levé.

- Les annonces « Secteur nord perdu » et « Secteur nord repris » paraissent
  une fois par changement.
- Tout est **déduit de faits déjà calculés** : contacts et murs fragiles par
  le relevé de champ de bataille existant, brèches par la chute réelle d'un
  ouvrage. Aucune valeur d'équilibrage, aucun effet sur la simulation.
- Dans `src/fallback-order.js`, test `tests/fallback-order.test.cjs`.

Écarts avec la direction ci-dessus, à combler :

- Un « secteur » est ici un **côté** de la cité, pas encore la zone entre
  deux enceintes : cela viendra avec les districts (§8.2).
- Un secteur perdu **continue de produire** et ses structures ne se
  dégradent pas davantage : l'état est un constat, pas encore une règle.
- Le **sacrifice volontaire** avec évacuation des stocks n'existe pas ; le
  repli général (§8.1) en tient lieu.
- Le relevé de la nuit (secteurs perdus et repris) n'est pas sauvegardé : il
  repart de zéro après une reprise. Les brèches ouvertes, elles, le sont.

### 8.4 Grands ouvrages **[DÉCISION]**

- Projets géants bâtis **par tranches sur plusieurs nuits**, qui changent la
  silhouette de la cité.
- Chaque tranche est un chantier ordinaire : financé, puis construit
  physiquement. Une tranche inachevée est une faiblesse pendant l'assaut.
- Chaque ouvrage résout un problème de mégacité **et** en crée un.

| Ouvrage [DÉCISION] | Ce qu'il apporte | Ce qu'il coûte |
|---|---|---|
| Chemin de ronde continu | Garnison mobile entre deux fronts | Une brèche y coupe la circulation. |
| Château d'eau et réseau | Eau de cité sans portage | Un point unique à défendre. |
| Beffroi d'alerte | Fronts annoncés plus tôt | Forte signature. |
| Grand dépôt | Stocks de district mutualisés | Tout perdre d'un coup. |
| Grande centrale | Énergie pour toutes les défenses | Carburant, signature, Éteints. |

**[DÉCISION]** Ouvrages ajoutés, validés :

| Ouvrage | Ce qu'il apporte | Ce qu'il coûte |
|---|---|---|
| Rempart colossal | Une enceinte de 24 à 48 m, bâtie par tranches (§8.6) | Des nuits entières avec un pan inachevé. |
| Grandes douves | Un fossé en eau sur tout un front | Vide la réserve d'eau en période sèche ; se comble de corps. |
| Pont-levis | Une porte qui se retire au lieu de tenir | Coupe aussi la sortie de ses propres défenseurs. |
| Gare de convois | Chargement et départ de plusieurs convois à la fois | Un grand portail de plus à défendre. |
| Émetteur régional | Radio jusqu'aux cantons lointains (§7.15) | Forte signature ; attire les factions. |
| Nécropole | Bûchers et fosses à l'échelle d'une mégacité (§8.7) | Fumée permanente, donc signature ; moral du district voisin. |

Un ouvrage ne crée pas de quatrième génération de mur : les trois générations
restent la règle. Révélé à l'âge 10.

**Première tranche livrée [LIVRÉ]**, nouvelles campagnes seulement
(`src/great-works217.js`, valeurs dans `C.GreatWorks217Rules`, test
`tests/great-works217.test.cjs`)

- À l'âge Mégaville II, la cité peut lancer deux grands ouvrages depuis le
  dépôt : le **Beffroi d'alerte** et la **Nécropole**.
- Chaque ouvrage compte trois tranches. Une tranche est payée sur le stock,
  puis construite en 60 s. Le chantier s'arrête de l'alerte à la fin de
  l'assaut, et quand aucun ouvrier n'est présent. Une seule tranche par
  ouvrage et par nuit : un ouvrage demande donc au moins trois nuits.
- **Un ouvrage inachevé n'a aucun effet**, ni bénéfice ni prix.
- Achevé, le beffroi allonge l'alerte avant l'assaut de 8 s ; la nécropole
  accélère de moitié le déblaiement des corps par les ouvriers. Chacun
  ajoute à la signature de la cité (+120 et +80) : c'est leur prix.
- L'avancement se lit dans le dossier de situation (carte « Grands
  ouvrages ») et sur un repère dessiné au-dessus du dépôt.

Réserves : rien n'a été joué en conditions réelles ; l'âge a été forcé par
une sauvegarde modifiée. **Écart avec la direction** : la tranche est un
minuteur sans bâtiment ni emprise, la silhouette de la cité ne change pas,
et une tranche inachevée n'est pas une faiblesse pendant l'assaut. Le prix
en signature est presque symbolique avec la courbe ouverte (environ 1 %
d'infectés en plus). La carte « Signature » affiche un total qui inclut les
ouvrages, mais pas dans ses quatre parts.

Restent à faire : les neuf autres ouvrages, un vrai chantier posé sur la
carte, la tranche inachevée comme point faible, le prix en moral du
district voisin, l'activation sur une campagne ancienne.

### 8.5 Lois et rationnement **[DÉCISION]**

- Une **loi** est une politique de cité à contrepartie visible.
- Nombre de lois actives limité par l'âge ; un changement prend effet après un
  délai, jamais au milieu d'un assaut.

| Loi [DÉCISION] | Effet | Contrepartie |
|---|---|---|
| Demi-rations | Moins de nourriture consommée | Moral en baisse continue. |
| Extinction des feux | Signature réduite la nuit | Production nocturne arrêtée, défenses moins éclairées. |
| Conscription | Ouvriers armés pendant l'assaut | Production et chantiers à l'arrêt, pertes civiles. |
| Quarantaine des arrivants | Moins de réanimations dans les murs | Accueil retardé, logements immobilisés. |
| Corvée de déblaiement | Corps retirés plus vite après l'assaut | Journée de récolte perdue. |
| Rationnement de l'eau | Réserve d'incendie préservée | Rendement des fermes en baisse. |

**[DÉCISION]** Lois plus dures, validées :

| Loi | Effet | Contrepartie |
|---|---|---|
| Portes closes | Plus aucun réfugié accueilli : vivres et logements préservés | Croissance arrêtée ; ceux qu'on refuse meurent devant les murs et s'ajoutent à la horde. |
| Expulsion des mordus | Aucune réanimation dans les murs | Chaque blessé mordu est perdu, soignable ou non ; moral en forte baisse ; les secouristes peuvent refuser. |
| Travail forcé des ralliés | Les membres d'une faction ralliée travaillent sans compter | Risque de fuite, de sabotage, et rupture avec les factions voisines. |
| Justice expéditive | Les pillards pris sont exécutés : les embuscades se raréfient | Les Rouleurs deviennent hostiles pour de bon ; les morts se relèvent ; un compagnon peut s'y opposer. |
| Garde des morts | Tout mort de la cité est veillé jusqu'à certitude | Mobilise des habitants à chaque décès ; aucune surprise la nuit. |

Règles propres aux lois dures :

- Le jeu **ne juge pas** et ne récompense pas : il montre le prix. Aucune
  loi dure n'est la bonne réponse évidente.
- Chacune a un **visage** : un compagnon, un secouriste ou un habitant nommé
  réagit par un acte, pas par un discours.
- Elles sont **réversibles**, mais ce qu'elles ont coûté ne revient pas.
- Ton sobre (§9.3) : on constate, on ne met pas en scène.
- Elles relèvent du thème « ne rien promettre de faux » : une cité qui
  ferme ses portes cesse d'être « un endroit où revenir », et le récit doit
  pouvoir le dire.

#### Première tranche livrée **[LIVRÉ]**

À la Grande métropole, la cité peut promulguer au dépôt trois lois
(`src/city-laws217.js`, valeurs dans `C.CityLaws217Rules`) :

| Loi | Effet | Prix |
|---|---|---|
| Demi-rations | Nourriture consommée −50 % | Moral −0,12/s (−0,04/s net du regain ordinaire) |
| Rationnement de l'eau | Eau puisée −30 % ; citernes préservées pour les incendies | Moral −0,10/s (−0,02/s net) |
| Corvée de déblaiement | Après chaque assaut repoussé, les ouvriers déblaient 30 s à cadence ×1,5 | Ni récolte ni chantier pendant la corvée |

- Une loi à l'âge 8, deux aux âges 9 et 10, trois à l'âge 11. Tout changement
  prend effet après 60 s, **jamais de l'alerte à la fin de l'assaut**.
- Nouvelles campagnes : suivies d'office. Campagnes existantes : activation
  volontaire au dépôt. État sauvegardé comme module additif.
- Aucune ressource créée : les demi-rations restituent au plus ce qui vient
  d'être consommé.
- Test `tests/city-laws217.test.cjs`.

Écarts et réserves :

- **Extinction des feux n'est pas livrée**, et pour une raison de fond :
  voir §11.3. La signature ne peut plus rien changer aux hordes à cet âge.
- Le rationnement de l'eau coûte du moral, pas le rendement des fermes prévu
  plus haut.
- Le moral n'agit dans le jeu qu'en dessous de 20 : avec une seule loi de
  rationnement, il faut environ 33 min pour y descendre. Le prix est
  probablement trop doux.
- Aucune de ces valeurs n'a été éprouvée par une campagne humaine.

Restent à faire : conscription, quarantaine des arrivants, les lois dures et
leurs visages, le lien avec les Éteints.

Les lois prolongent les quatre crises existantes : une crise est un choix
ponctuel, une loi est un choix durable. Révélées à l'âge 8.

### 8.6 Le siège à grande échelle **[DÉCISION]**

L'image visée : une marée qui vient de l'horizon, s'écrase contre un mur
immense, s'y entasse jusqu'à le déborder, et parfois le perce.

#### La marée à l'horizon

**[LIVRÉ]** Les infectés apparaissent au bord du carré local de 128 m, après
un préavis de 10 s (15 s avec la doctrine de reconnaissance), un message et
une sirène. Rien n'est visible de loin. Les hordes régionales (jusqu'à
18 groupes de 360) n'existent que lorsque le joueur est en région.

**[PROPOSITION]**

- **Une seule horde, deux échelles.** La vague qui frappe D-17 est une
  migration qui a traversé la région. Elle ne naît plus au bord de la carte.
- **On la voit venir** depuis les remparts et la vue à la première personne :
  une masse lointaine, dessinée à moindre détail, qui grossit.
- **Le préavis se gagne** : guet, beffroi, Léa, avant-postes et radio
  l'allongent. Sans eux, on reste à quelques secondes.
- **En région**, le joueur peut croiser la migration en marche vers sa cité.
  Il peut la suivre, la prévenir, ou rentrer.
- La foule lointaine est un **dessin de la simulation**, pas une seconde
  simulation : elle ne crée ni dégât ni tirage.

**Première tranche livrée [LIVRÉ], présentation seulement**

- Pendant l'alerte et l'assaut, une masse sombre de silhouettes se tient au
  bord de la carte du côté de chaque front encore attendu
  (`src/horde-horizon217.js`). Elle grossit pendant le préavis et s'amenuise
  à mesure que la file se vide.
- Le dossier Situation indique « Horde en approche : fronts — N contacts
  restant à entrer ».
- Aucune silhouette n'est un infecté : ni dégât, ni tirage, ni horloge.
  240 silhouettes au plus, 96 en qualité légère ; positions déterministes.
- L'effectif n'est pas partagé entre fronts : le jeu tire le front de chaque
  arrivée au moment où elle entre.
- Test `tests/horde-horizon217.test.cjs`.

**Passe visuelle [LIVRÉ]**

- La masse est une foule : une avant-garde de silhouettes entières (tête,
  épaules, tronc, jambes, parfois bras tendus) devant des rangs serrés de
  têtes, sur une base sombre et un voile de poussière. Vues de face au nord,
  de dos au sud, de profil à l'est et à l'ouest.
- Trois densités : une petite vague arrive par paquets, une vague moyenne
  tient tout le bord, une marée s'épaissit sur environ cinq mètres.
- Elle se tient à la limite de ce que l'interface cache, sur les quatre
  côtés ; un libellé « HORDE · EST » marque le bord quand elle est hors
  champ.
- Elle est peinte avec le sol : acteurs, véhicules et bâtiments passent
  dessus, et aucune figure n'est posée autour du Commandant.
- Au plus 240 silhouettes entières et 1 440 têtes de rang (96 et 192 en
  qualité légère).

Réserves, constatées dans un navigateur :

- La masse **entre de 8 à 12 m dans la carte** selon l'interface : un
  rempart extérieur bâti loin serait dessiné par-dessus elle.
- Les têtes de rang sont carrées, d'aspect « briques » de près.
- Est et ouest restent moins imposants que nord et sud ; une petite vague
  reste discrète ; en nuit noire on voit des têtes, pas des corps.
- L'animation n'a pas été observée à l'écran, seulement testée.
- La masse ne se voit que si le bord de la carte est à l'écran : pas encore
  « depuis le rempart ».

Restent à faire : allonger et faire gagner le préavis ; relier la vague à
une migration régionale ; les masses agrégées ; la vue depuis les remparts.

#### Les pyramides de corps

**[LIVRÉ]**

- Au sol : seuls l'Infecté récent et le Rampant franchissent un mur, quand la
  charge de corps dépasse son seuil. Le franchissement n'a pas d'animation ;
  huit marques au plus signalent l'amas.
- En hauteur : l'amas a une vraie hauteur (charge ÷ 16, en mètres). La charge
  compte les corps **et** les vivants pressés contre le mur. L'ascension
  commence quand l'amas atteint le sommet ; 24 grimpeurs au plus. Le rendu
  est un empilement de six gradins.
- **Limite constatée** : un rempart de 48 m demande une charge de 768, soit
  plus de vivants que le plafond de 720 infectés simultanés. Il est donc
  aujourd'hui presque inatteignable.

**[PROPOSITION]**

- **Montrer la pyramide** : des corps et des vivants dessinés un à un sur
  l'amas, à partir de la même charge. Le calcul ne change pas ; l'image, si.
- **La pyramide est vivante** : elle monte par la base. Tirer dans la base,
  l'incendier ou la déblayer la fait s'affaisser.
- **Elle se prépare** : un fossé la retarde, des Hérissons la désorganisent,
  un Porte-charniers l'accélère (§3.5).
- **Des milliers à l'écran [DÉCISION]** : les premiers rangs sont simulés un
  à un, comme aujourd'hui ; le gros de la horde est fait de **masses
  agrégées**.
  - Une masse a un effectif, une position et une direction. Elle pèse sur le
    mur, nourrit la pyramide et **se déverse** dans la simulation détaillée à
    mesure que les premiers rangs tombent.
  - Tirer dans une masse y tue réellement : l'effectif baisse, les munitions
    sont dépensées, les corps comptent.
  - Le plafond de 720 reste celui des infectés **détaillés** ; il ne borne
    plus la taille de la horde.
  - Cible de cadence : un ordinateur portable courant (§1.5). Une masse
    coûte le prix d'un seul objet, quel que soit son effectif.
  - Un mur de 48 m redevient débordable par une très grande horde, sinon il
    n'a pas d'enjeu.
- Une pyramide ne se forme jamais sans le nombre : c'est l'expression directe
  de la règle « plus de monde, pas plus de vie ».

**Lecture de l'amas au sol [LIVRÉ], présentation seulement**
(`src/corpse-heaps217.js`, test `tests/corpse-heaps217.test.cjs`)

| État | Charge | Ce qu'on voit contre la face extérieure |
|---|---|---|
| Épars | Moins de 50 % du seuil | Quelques corps |
| Haut | 50 à 85 % | Un talus continu |
| Imminent | 85 à 100 % | Le talus atteint la crête, liseré ambré |
| Franchi | Au-delà | Les corps couvrent le mur, liseré rouge et chevrons |

- **Le seuil dépend de chaque infecté, pas du mur** : les infectés agiles
  ont chacun le leur, de 15 à 32 corps. Les premiers passent à 15, tous
  passent au-delà de 32. L'affichage prend le premier franchissement pour
  repère.
- Une annonce signale « imminent » puis « franchi », une fois par épisode,
  jamais à la reprise. Le dossier Situation donne l'amas le plus haut par
  côté et le temps de déblaiement d'un ouvrier.
- 600 corps dessinés au plus (240 en qualité légère). Aucune règle
  modifiée, aucun état sauvegardé. Les remparts de citadelle gardent leur
  rendu en gradins.

Réserves : corps en découpes à plat ; la hauteur se lit par l'emprise et la
densité, pas par un volume ; l'amas épars est presque invisible de nuit ; la
montée pendant un vrai combat n'a pas été observée ; dans un cas extrême de
180 murs chargés visibles, le dessin coûte 8 à 14 ms par image en rendu
logiciel.

Restent à faire : faire monter l'amas par les vivants ; l'affaisser en
tirant dans sa base ; l'incendier ; animer le franchissement.

#### Les murs colossaux

**[LIVRÉ]** Remparts de 12, 24 et 48 m, dalles jusqu'à 72 m, quatre affûts,
logements et réserves suspendus, vue à la première personne.

**[PROPOSITION]**

- Un rempart colossal est un **grand ouvrage** (§8.4) : bâti par tranches,
  sur plusieurs nuits, visible pendant qu'il monte.
- Il se voit **depuis la région** : c'est un repère pour le joueur qui
  rentre, et une raison de plus pour la signature de grimper.
- Il a une **vie** : chemin de ronde, garnison, relève, projecteurs. Un mur
  vide ne défend rien.
- Les trois générations de matériau restent la règle ; la hauteur est une
  dimension de plus, pas une quatrième génération.

#### La brèche catastrophe

**[LIVRÉ]** Une notification signale qu'une structure détruite ouvre le
secteur. La chute d'un rempart ne termine pas la partie.

**[PROPOSITION]** En faire le moment le plus fort du jeu, et le plus rare :

1. **Des signes avant-coureurs** : intégrité basse, fissures visibles, poids
   de la pyramide, abomination en approche. Une brèche catastrophe se
   prévoit ; elle n'est jamais un coup du sort.
2. **La rupture** : un pan entier ou une porte cède d'un coup, et non case
   par case.
3. **L'engouffrement** : la horde change de direction vers l'ouverture. Le
   champ de flux le fait déjà ; il faut le montrer.
4. **La décision** : tenir, évacuer ou sacrifier le district (§8.2), dans les
   secondes qui suivent.
5. **Le lendemain** : le secteur est perdu, puis repris (§8.3).

Une brèche catastrophe ne termine jamais la partie à elle seule : seule la
chute du centre de commandement le fait.

**Première tranche livrée [LIVRÉ], nouvelles campagnes seulement**
(`src/breach217.js`, valeurs dans `C.Breach217Rules`, test
`tests/breach217.test.cjs`)

- **Le pan menacé** : une suite droite d'au moins 4 ouvrages de mur voisins,
  portes comprises, tous sous 30 % de leur solidité. Il est annoncé une
  fois (« Le mur nord menace de céder sur 4 ouvrages. ») et figure dans le
  dossier « Pans menacés ». Réparer un seul de ses ouvrages au-dessus du
  seuil lève la menace.
- **La rupture** : si un ouvrage d'un pan déjà annoncé est détruit, le reste
  du pan cède dans le même instant, 6 ouvrages au plus, avec une annonce
  unique (« Rupture au nord : 5 ouvrages ont cédé d'un coup. »).
- Elle n'ajoute aucun dégât aux ouvrages sains, ne tire aucun hasard, ne
  crée ni infecté ni ressource, n'emporte jamais le centre et ne déclenche
  pas d'autre rupture. Un pan ne tourne pas le coin.
- Le seuil de fragilité est celui du relevé de champ de bataille : il n'y en
  a qu'un.
- Les campagnes commencées avant gardent la chute ouvrage par ouvrage.

**Risque d'équilibrage, jamais joué** : les ruptures pourraient être
fréquentes en début de partie, alors qu'elles doivent rester rares. Les
infectés frappent souvent plusieurs palissades voisines, qui passent vite
sous 30 %. Une ouverture d'une case peut devenir une ouverture de huit, et
une section postée sur le pan peut perdre plusieurs équipiers d'un coup.
**[DÉCISION]** Réglage retenu : 4 ouvrages pour menacer, 6 emportés au
plus (auparavant 3 et 8). Leviers restants : passer à 5, ou réduire encore
le nombre d'ouvrages emportés.

Restent à faire : montrer les pans menacés sur la carte (fissures) ; les
autres signes avant-coureurs (poids de l'amas, abomination en approche) ;
la décision tenir, évacuer ou sacrifier avec les districts ; une seule
brèche nommée par rupture dans l'état des secteurs.

### 8.7 La filière des corps **[DÉCISION]**

**[LIVRÉ]** Un ouvrier en déblaiement retire la charge de corps au pied d'un
mur ; la charge disparaît. Les corps dessinés s'effacent après 100 s.

**Direction** : un corps déblayé **va quelque part**, et un corps laissé sur
place **rend malade**.

| Destination | Coût | Contrepartie |
|---|---|---|
| **Bûcher** | Carburant ou bois, un emplacement | Fumée : signature en hausse tant qu'il brûle. Rapide. |
| **Fosse** | Travail, emprise au sol hors des murs | Lent ; la place finit par manquer ; une fosse pleine se referme. |
| **Laissés sur place** | Rien | Rampe pour la prochaine horde, et maladie dans le secteur voisin. |

Maladie :

- Des corps laissés trop longtemps près d'un secteur habité y dégradent la
  **santé** et le **moral**. L'effet est local, progressif et annoncé.
- **[DÉCISION]** Si rien n'est fait, la maladie **tue** les plus fragiles,
  dans les murs, avec le risque de réanimation ordinaire. Même gradation que
  la pénurie d'eau (§7.3) : affaiblir, puis tuer, jamais par surprise.
- Il mobilise la clinique et consomme des médicaments : la filière des corps
  devient une affaire de gouverneur, pas seulement d'ouvriers.
- Ce n'est **pas** la contamination qui relève les morts : aucune confusion
  avec l'infection, dont rien n'est expliqué (§2.4).
- La pluie et la chaleur accélèrent ou ralentissent l'effet : lien avec la
  météo.

Cohérence :

- La charge de corps au pied du mur garde ses règles actuelles ; la filière
  commence **après** le déblaiement.
- Un bûcher est un choix de signature, une fosse un choix d'espace : les deux
  courbes du §1.2 s'y retrouvent.
- La corvée de déblaiement (§8.5) et la Nécropole (§8.4) en sont la loi et
  le grand ouvrage.
- Propriétaires : `game.js`, `core.js` (`WORKER_RULES`), `urban.js`,
  `weather193.js`.

### 8.8 Ce que la fin de jeu ne doit pas devenir

- Une suite de chiffres plus grands sans décision nouvelle.
- Un menu de gestion qui dispense de descendre au sol.
- Une cité si sûre que la signature ne compte plus.
- Un mur si haut qu'aucune horde ne peut l'atteindre.
- Une exploration si confortable que l'absence ne coûte rien.

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

**Trois chapitres de plus [DÉCISION]**, liés aux âges tardifs. Chacun se
déclenche par un fait de jeu, s'ajoute au registre et ne termine rien.

| Chapitre | Déclencheur | Ce qu'il raconte |
|---|---|---|
| V. Ceux à qui l'on confie | Premier district confié à un responsable | Le Commandant n'est plus partout. La fonction se partage. |
| VI. Les autres | Première faction ralliée ou détruite | D-17 n'est plus seule ; ce qu'elle fait aux autres dit ce qu'elle est. |
| VII. Revenir | Cité reconquise après un dernier carré, ou Mégaville III atteinte | « Un endroit où revenir » : la phrase de Luc, vérifiée ou démentie par la campagne. |

- [PROPOSITION] Les titres et les textes restent à écrire selon le ton du
  §9.3.
- Le chapitre VI a deux versions, selon que la première faction a été
  ralliée ou détruite. Aucune n'est présentée comme la bonne.
- Les lois dures (§8.5) peuvent colorer le chapitre VII : une cité aux
  portes closes n'écrit pas la même dernière page.
- L'épilogue du chapitre IV reste en place et reste vrai.

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

---

## 10. Direction artistique et sonore **[LIVRÉ]**

- **Image** : poste de commandement de terrain. Terre, acier patiné, béton,
  végétation sale, éclairage sodium. Palette olive, or et acier.
- **Bâti** : assemblé, rapiécé, réparé. Jamais futuriste, jamais impeccable.
- **Lisibilité** : une silhouette se reconnaît dans la masse. C'est une
  contrainte de jeu avant d'être une contrainte d'image.
- **Ambiance** : pluie, nuit, fumée, étincelles, impacts, corps persistants.
- **Nuits noires** : masque noir réel, torche et projecteurs.
- **Son [LIVRÉ]** : entièrement synthétisé, sans fichier audio. Musique
  discrète, sons mécaniques, sirènes, signal radio procédural.
- **Son [DÉCISION]** :
  - Des **enregistrements** sont acceptés pour la masse des hordes : la
    rumeur d'une marée, le piétinement, la pression contre un mur. Chacun
    porte une fiche de provenance et de licence, comme les images.
  - Une **musique plus présente** accompagne les grands moments : marée à
    l'horizon, brèche catastrophe, dernier carré, reconquête. Elle se tait
    dans le travail ordinaire : le silence reste la règle, la musique
    l'exception.
  - La synthèse reste le socle et le repli : le jeu doit sonner juste sans
    aucun fichier.
  - Le son continue de **lire** la simulation : la rumeur suit l'effectif
    réel de la horde, elle ne l'annonce jamais à sa place.
  - Pas de voix jouée : la règle « ni doublage » demeure.
- **Provenance** : toute image conserve sa fiche de provenance.
- **Règle** : peintres, animations, effets et sons **lisent** les actions
  accomplies. Ils ne créent ni stock, ni dégât, ni tirage de simulation.

**Planches de référence [DÉCISION]** : avant tout chantier de faction ou
d'abomination, une planche validée fixe la silhouette, la palette et le signe
matériel. Aucune image de jeu n'est produite avant cette validation. La
planche rejoint les fiches de provenance.

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
| 17 | Siège et population verticaux en pause pendant l'absence, alors que le reste de la cité est simulé | `vertical-siege176.js`, `vertical-population181.js` | Tout simuler ou tout suspendre (§7.15). |
| 18 | Rempart de 48 m hors d'atteinte : charge requise 768, plafond 720 | `vertical-siege176.js`, `core.js` | Masses agrégées (§8.6). |
| 19 | « Véhicules pilotables » exclus, alors que neuf sont livrés | `ROADMAP.md`, `GAME_DESIGN.md` §4 | Mettre à jour. |
| 20 | Trois géants livrés, alors que le brief et `GAME_DESIGN.md` §14 écartent boss et mutations | `docs/vertical175/README.md`, `GAME_DESIGN.md` | Renvoyer à l'encadrement du §3.5. |

Les lignes 12, 13, 14, 16, 17 et 18 touchent du code ou des textes joués :
elles demandent un test.

### 11.1 État des corrections

Passe du 10 novembre 2026 :

| Lignes | État |
|---|---|
| 1, 2, 3, 5, 6, 8, 11, 15, 19, 20 | **Corrigées** dans les documents cités, par une correction directe ou une note de mise à jour en tête des documents historiques. |
| 4 | **Requalifiée** : les deux valeurs sont vraies. 82, 112 et 64 s sont les durées historiques ; le premier calme affiché vaut `(210 + durée historique − 82) × difficulté`. `SCENARIOS.md` l'explique désormais. |
| 7 | **Corrigée en partie** : notes ajoutées. « Aucun puisage à distance » reste exact ; seul le sort des produits bruts avait changé. |
| 12, 13, 14 | **Corrigées** dans `src/narrative.js`, avec un test dans `tests/narrative.test.cjs`. Le chapitre I ne suppose plus d'effectif ; « E.R. » est écrit Émile R. ; le répartiteur est Sami V. |
| 9, 10 | **Non confirmées** à la relecture : les formulations relevées n'ont pas été retrouvées telles quelles. Aucun changement. |
| 16 | **Vérifiée** : `D17:` est une clé interne de l'espace de coopération, validée par motif et jamais affichée. Aucun changement. |
| 17 | **Résolue** par « tout simuler » (§7.15, première tranche). |
| 18 | **Ouverte** : chantier de jeu (§12, rang 14). |

L'accord de la fiche du Manutentionnaire (§2.5) reste à trancher.

### 11.2 Défauts du jeu relevés en passant

Deux défauts de la version d'origine (`main`) faisaient échouer la CI par
intermittence, quel que soit le contenu d'une demande de fusion.

| Défaut | Constat | Correction |
|---|---|---|
| **Nouvelle partie impossible sur certaines graines** | En contenu actuel, le décor métrique ne trouvait aucune parcelle libre sur de rares graines (relevées : 3033422227, 139741324, 4075956896 ; aucune sur 60 tirées en série). La création s'interrompait à mi-chemin. | `src/map-recovery216.js` reprend la création avec une autre carte et l'annonce au joueur. Une graine qui fonctionne donne exactement le même monde qu'avant. Test `tests/map-recovery216.test.cjs`. |
| **Test de libellés sensible à la police** | `tests/expedition-art159.test.cjs` mesurait du texte avec la police du système et échouait sur l'image actuelle des machines de CI. | Le test vérifie le contrat de retour à la ligne sur n'importe quelle police, et les vrais noms avec une largeur de caractère fixe. |

### 11.3 La signature cesse d'agir avant la fin de partie

Constat fait en livrant les lois, sur la version d'origine :

- L'effet de la signature sur l'effectif d'une vague est plafonné à +80 %,
  atteint dès une signature de **288** (`C.wavePlan`, `signature / 360`
  borné à 0,8).
- Or il faut un score de bâtiments de **420** pour atteindre la Grande
  métropole, et ce score entre entier dans la signature.
- À partir de là, agrandir la cité n'attire plus un infecté de plus, et la
  réduire ne change rien.

Cela contredit la règle centrale du §1.2 : les deux courbes cessent de
monter ensemble vers le milieu de la progression. Tant que cette courbe
n'est pas revue, **aucune décision de fin de jeu fondée sur la signature n'a
d'effet** : extinction des feux, grands ouvrages, beffroi, Éteints.

**[DÉCISION]** La courbe devient **sans plafond** :

- identique à aujourd'hui tant que l'attirance reste sous +80 % ;
- au-delà, elle continue de monter, de plus en plus lentement : environ
  +110 % à la Grande métropole, environ +150 % à Mégaville III ;
- elle ne s'applique qu'aux **nouvelles campagnes** ; les campagnes en cours
  gardent la courbe plafonnée.

**[DÉCISION]** Le **moral agit par paliers**, dans les nouvelles campagnes
seulement. Aujourd'hui il ne pèse qu'en dessous de 20 (vitesse ×0,82). Il
doit ralentir progressivement, et plus tôt :

- le travail des ouvriers (récolte, chantiers, déblaiement) ;
- le déplacement de tous ;
- la cadence de tir des fusiliers ;
- et, à un moral très bas qui dure, faire partir des habitants.

Sans cela, le prix des lois de rationnement (§8.5) met environ 33 minutes à
se faire sentir.

**[LIVRÉ], nouvelles campagnes seulement** (`src/balance217.js`, valeurs dans
`C.Balance217Rules`, test `tests/balance217.test.cjs`) :

- **Signature sans plafond** : identique à l'ancienne courbe jusqu'à +80 %
  (signature 288), puis toujours croissante et de plus en plus lente : +94 %
  à 420, +110 % vers 600, +125 % vers 1 000, +150 % vers 2 600. La fiche
  « Signature et moral » et la lecture de siège affichent la courbe en
  vigueur.
- **Moral par paliers** : ×0,94 sous 60, ×0,88 sous 40, ×0,82 sous 20, sur le
  déplacement des unités, sur la récolte, les chantiers et le déblaiement
  des ouvriers, et sur la cadence de tir des fusiliers.
- **Départs** : sous 10 de moral pendant cinq minutes, un ouvrier quitte la
  cité, puis un autre toutes les trois minutes, après annonce. Jamais le
  dernier ; jamais en double d'une pénurie d'eau, qui a ses propres départs.
- Les campagnes commencées avant gardent la courbe plafonnée et le seul
  ×0,82 sous 20, sans activation possible. Un plan de vague déjà tiré n'est
  jamais recalculé.

Conséquences à connaître, **jamais jouées** :

- À signature 600, une vague compte environ 17 % d'infectés de plus
  qu'avant ; à 2 600, environ 39 % de plus. Le plafond d'infectés simultanés
  étale ce surplus : les nuits seront plus longues autant que plus denses.
- Une **spirale** est possible : moral bas, donc ouvriers et fusiliers plus
  lents, donc moins de récolte et de feu, donc pertes et famine, donc moral
  plus bas, puis départs. Le plancher ×0,82 et le dernier ouvrier épargné la
  bornent.
- Une **famine continue fait maintenant partir des ouvriers** au bout
  d'environ sept minutes.
- Le prix des lois de rationnement se sent dès 60 de moral : cinq à six
  minutes de demi-rations au lieu d'environ 33.

**[DÉCISION]** Le Commandant n'est **pas** ralenti par le moral : le moral
pèse sur la cité, pas sur la maniabilité du personnage joué. « Le
déplacement de tous » s'entend des habitants et des équipes.

Restent à décider : si les spécialistes, les gardes de palier et les travaux
affectés (routes, récupération, expéditions) suivent aussi les paliers ; une
activation pour les anciennes campagnes ; puis
brancher les décisions de fin de jeu fondées sur la signature.

### 11.4 Limites de la reprise de carte

Limites de la première correction du défaut de génération (§11.2) :

- La **cause est traitée** (217) : sur une carte saturée, les grandes ruines
  n'avaient plus de parcelle avec un mètre de dégagement. La seule pièce
  restée sans parcelle est désormais replacée avec un dégagement réduit par
  paliers (`C.Scenery217Rules` : 1 m, 0,5 m, contact), sans recouvrement,
  sans tirage et sans perdre de gisement. Les graines 3033422227,
  139741324, 4075956896 et 1168806633 démarrent avec leur graine.
- **Écart assumé** au contrat « un mètre partout » : sur ces cartes
  saturées seulement, quelques grandes ruines ont entre 0,5 m et 1 m de
  dégagement. Le palier « contact » n'a été atteint sur aucune graine
  observée.
- Balayage de 300 graines : 1 échec avant, 0 après ; 299 cartes saines
  identiques au bit près. Ce balayage est court : une carte encore plus
  saturée lancerait la même erreur et serait reprise par
  `src/map-recovery216.js`, qui reste le filet de sécurité.
- Test `tests/seed-scenery217.test.cjs`.
- Une graine **saisie à la main** qui se révèle impraticable est remplacée
  elle aussi, avec l'annonce. Une **recette de carte rejouée** n'est jamais
  remplacée : l'erreur d'origine est conservée.

---|---|---|
| **Nouvelle partie impossible sur certaines graines** | En contenu actuel, quelques graines font échouer la génération du décor : « Décor métrique sans parcelle libre ». Trois graines relevées : 3033422227, 139741324, 4075956896. Rare : aucune sur 60 graines tirées en série. La partie ne démarre pas. | `packMetricScenery202`, `src/exploration-125.js` |
| **Test de libellés sensible à la police** | `tests/expedition-art159.test.cjs` mesure du texte avec la police du système ; il échoue sur l'image actuelle des machines de CI et passe ailleurs. | `tests/expedition-art159.test.cjs` |

Ces deux défauts font échouer la CI par intermittence, indépendamment du
contenu d'une demande de fusion.

La fiche du Commandant est corrigée (« premier commandant de D-17 ») depuis
le chantier de l'eau de cité, qui modifiait déjà `src/core.js`. Ce fichier est
couvert par les preuves d'inspection du codex
(`docs/codex/suivi-monde2026/`) : toute modification impose de régénérer
l'inspection, environ cinq minutes.

---

## 12. Feuille de route de la bible

Ordre **validé** : la prise en main d'abord, pour rendre lisible ce qui
existe avant d'ajouter. Chaque chantier passe par une spécification, suit le test de
cohérence (§5.3) et se termine par `npm run check`.

| Rang | Chantier | Pilier servi | Propriétaires principaux | Parcours joueur observable |
|---:|---|---|---|---|
| 0 | Nettoyage documentaire (§11) | Tous | `docs/`, `PROJECT_MANIFEST.md`, `CHANGELOG.md` | Les documents disent la même chose que le jeu. |
| 1 | Révélation par âge (§6) — première tranche livrée (§6.4) | Clarté | `age-reveal.js`, `ui.js` | Une nouvelle partie masque onze menus, rouverts âge par âge. |
| 2 | Signature visible et bilan de nuit (§7.4, §8.1) — première tranche livrée | Siège | `urban.js`, `battlefield.js`, `command-ui.js` | Le joueur voit pourquoi la horde grossit et ce qu'il a tenu. |
| 3 | Brèche nommée et repli par enceinte (§8.1) — première tranche livrée | Siège | `tactics.js`, `squads.js`, `game.js` | Une porte cède, un ordre replie la garnison. |
| 4 | Eau de cité (§7.3) — première tranche livrée | Chaîne | `core.js`, `urban.js`, `husbandry191.js`, `weather193.js` | Une sécheresse fait baisser les fermes. |
| 5 | Exploration en trois échelles (§7.9) — première tranche livrée | Monde | `frontier-*.js`, `expeditions.js`, `field-atlas*.js` | Une seule carte, trois zooms, un besoin affiché. |
| 6 | Sacrifice et reconquête (§8.3) — première tranche livrée | Siège | `tactics.js`, `game.js`, `core.js` | Un secteur est abandonné puis repris au matin. |
| 7 | Districts (§8.2) — première tranche livrée | Mégacité | `urban.js`, `tactics.js`, `squads.js` | Un compagnon tient un district sans le joueur. |
| 8 | Lois (§8.5) — première tranche livrée | Mégacité | `command-ui.js`, `urban.js`, `core.js` | Une loi change un chiffre et son contraire. |
| 9 | Grands ouvrages (§8.4) — première tranche livrée | Mégacité | `core.js`, `settlement-plans.js`, `vertical-citadel175*.js` | La silhouette de la cité change en plusieurs nuits. |
| 10 | Récit relié et arcs des compagnons (§2.6, §2.7) — première tranche livrée | Récit | `narrative.js`, `chronicles131-data.js`, `companions-pack.js` | Un entretien suit une nuit difficile. |
| 11 | Factions (§4) — première tranche livrée | Monde | `frontier-*.js`, `expeditions.js`, nouveau module additif | Un fourgon est intercepté ; un relais demande de l'aide. |
| 12 | Cité autonome cohérente : siège vertical actif (livré), consignes et radio (première tranche livrée) (§7.15) | Siège, Monde | `frontier.js`, `departure130.js`, `vertical-siege176.js` | Un message radio annonce une brèche pendant une sortie. |
| 13 | Marée à l'horizon (§8.6) — première tranche livrée | Siège | `game.js`, `world-evolution.js`, `vertical-citadel175-render.js` | La horde se voit depuis le rempart avant la sirène. |
| 14 | Pyramides visibles (livré) et masses agrégées (§8.6) | Siège | `vertical-siege176.js`, `art.js`, `core.js` | Un amas déborde un rempart de 24 m ; tirer dans sa base l'affaisse. |
| 15 | Brèche catastrophe (§8.6) — première tranche livrée | Siège | `tactics.js`, `game.js`, `battlefield.js` | Un pan cède, la horde s'engouffre, un district est sacrifié. |
| 16 | Avant-postes, routes gardées, entretien des véhicules (§7.14) | Monde | `world-pack131.js`, `frontier-routing.js`, `return-routes.js` | Un convoi roule seul sur une route gardée. |
| 17 | Travaux de terrain : fossés (livré), talus, douves (§7.13) | Siège | `core.js`, `game.js`, `barricades134.js` | Un fossé ralentit un front, puis se comble de corps. |
| 18 | Lieux remarquables et nids (§7.13) — première tranche livrée | Monde | `frontier-geometry.js`, `codex-campaign205.js` | Un château d'eau vu de loin devient un objectif de sortie. |
| 19 | Monde sans bord et relief par paliers (§7.13) | Monde | `frontier-world.js`, `frontier-state.js`, `geography135.js` | Une nouvelle campagne n'a plus de bord ; une falaise sert d'enceinte. |
| 20 | Filière des corps et maladie (§8.7) | Siège, Chaîne | `game.js`, `core.js`, `urban.js` | Un bûcher fume après l'assaut ; un secteur négligé tombe malade. |
| 21 | Nouvelles abominations, dont celles de région (§3.5) | Siège, Monde | `core.js`, `vertical-siege176.js`, `world-evolution.js` | Abattre une Meneuse au loin réduit la vague suivante. |
| 22 | Vraie coopération (§7.12) | Tous | `coop.js`, `scripts/coop-server.mjs`, `game.js` | Un joueur tient le mur pendant qu'un autre explore. |

Le dernier carré se traite avec le rang 12. Le monde sans bord et la
coopération sont placés en fin de liste parce qu'ils touchent la génération,
les identifiants, la sauvegarde et l'autorité sur la simulation. Les rangs 12 à 18 lui donnent d'abord une
raison d'exister : sans avant-postes ni routes, un monde plus grand n'est
qu'un monde plus vide.

Les rangs 1 à 3 ne demandent presque aucune règle nouvelle : ils rendent
lisible ce qui existe. C'est le meilleur rapport entre effort et effet.

---

## 13. Questions encore ouvertes

Les grandes orientations sont tranchées. Ce qui reste relève du réglage et
se décide au début du chantier concerné.

1. **Mesure de durée** : qui joue les campagnes de référence qui vérifient
   la cible de 15 à 25 h ?
2. **Valeurs** : assauts par saison, délais des lois, seuils de maladie et de
   pénurie, portée de la radio. À fixer dans `src/core.js`, avec tests.
3. **Enregistrements sonores** : quelle source et quelle licence ?
4. **Textes** : qui écrit les chapitres V à VII et les entretiens des
   compagnons ?
5. **Propositions restantes** : les mentions [PROPOSITION] encore présentes
   (états des routes, rangs d'avant-poste, travaux de terrain, rangs de
   lieux, rôles des trois géants livrés) sont à valider avec leur chantier.

## 14. Faire vivre ce document

- Toute décision de direction se note ici **avant** son implémentation.
- Une **[PROPOSITION]** validée devient **[DÉCISION]** ; une décision livrée
  devient **[LIVRÉ]**, avec la version du jeu.
- Une valeur chiffrée citée ici se vérifie dans `src/core.js` à chaque
  livraison qui la touche.
- Un document de livraison qui contredit la bible doit le dire explicitement
  et proposer la correction de l'un ou de l'autre.
