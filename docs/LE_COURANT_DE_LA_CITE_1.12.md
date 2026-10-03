# DEADWALL 1.12 — Le Courant de la cité

**Candidat local 1.12.0-rc.1.** La base est le jeu complet 1.11. Toutes ses mécaniques et ses 14 fichiers d’assets sont conservés. Aucun push GitHub et aucun déploiement Vercel.

## Trois réserves électriques constructibles

| Construction | Âge | Coût | Capacité | Charge maximale | Appoint maximal |
|---|---|---|---:|---:|---:|
| Armoire de secours | Avant-poste, 24 points | 45 bois, 100 ferraille, 50 pierre | 900 u·s | 6 | 8 |
| Station d’accumulation | Grande ville, 135 points | 120 bois, 350 ferraille, 300 pierre | 3 600 u·s | 18 | 24 |
| Réserve électrique métropolitaine | Mégaville I, 750 points | 250 bois, 900 ferraille, 700 pierre | 12 000 u·s | 48 | 60 |

Une unité-seconde (u·s) représente une unité de puissance maintenue pendant une seconde de simulation. La capacité et le débit maximal sont deux limites différentes : une réserve de 900 u·s avec un débit de 8 ne peut pas couvrir seule un besoin instantané de 12.

Les trois bâtiments commencent comme des chantiers payés, puis comme des batteries **vides**. Ils ont une emprise, des points d’intégrité, un score de cité, un peintre Canvas distinct et une barre de charge. L’armoire exige un générateur achevé ; les deux grandes réserves exigent la centrale de quartier. Les modèles restent absents du catalogue tant que leur âge n’est pas atteint. Le catalogue total comporte désormais 69 types de constructions, centre et variantes compris.

La charge vient du surplus de la production existante, une fois la demande active couverte. Le rendement de charge est de **90 %** : recevoir 10 unités-secondes n’en stocke que 9. La décharge retire seulement l’énergie effectivement fournie aux consommateurs, jamais toute l’offre que leur débit aurait permis. Deux batteries ne se rechargent pas mutuellement. Une réserve pleine ne prélève pas de courant supplémentaire.

Aucune recharge n’est effectuée quand la demande active dépasse la production directe, même si l’allocation tout-ou-rien de certaines lampes laisse un petit reliquat inutilisé. Cette règle conservatrice évite les micro-cycles qui feraient clignoter un projecteur sur une batterie presque vide. Le reliquat n’est pas une promesse de maintien de tous les consommateurs.

Le réseau reste celui du jeu : **global à la cité, sans câbles ni lignes électriques physiques ajoutés**. L’énergie stockée appartient à chaque batterie. Une destruction perd cette énergie ; une reconstruction avec un nouvel identifiant repart vide. Un incendie ou un secteur perdu déconnecte la réserve, sans transformer l’énergie conservée en matériau récupérable.

## Modes des batteries

- **AUTO** : charge avec le surplus et comble les déficits à toute phase.
- **NUIT**, mode initial : charge avec le surplus, mais ne décharge qu’à partir de l’alerte, pendant l’assaut et la sécurisation.
- **ISOLÉE** : conserve sa charge, sans charge ni décharge.

Les commandes ne prélèvent pas de matériaux et ne remplissent pas la réserve. Elles sont enregistrées dans la campagne. L’indication d’autonomie est une borne supérieure à déficit constant : la fin du solaire, une nouvelle construction, un incendie, la priorité et les limites de débit peuvent la raccourcir. Ce n’est pas une prévision du prochain siège.

## Circuits

Dans **Commandement → Terrain → Préparatifs**, la section des réserves permet de régler chaque bâtiment consommateur : Toujours, Jour seulement, Nuit seulement ou Coupé. Le jour désigne le calme ; la nuit commence dès l’alerte et inclut la sécurisation.

Couper un atelier retire sa demande du réseau, sa production et les intrants de cette production. Couper un projecteur enlève son éclairage réel. Couper un hôpital arrête ses soins électriques. Les logements et capacités de stockage ne disparaissent pas quand on coupe leurs services : les habitants restent à nourrir. Les portes motorisées conservent leurs règles d’accès historiques, sans nouvelle simulation de moteur.

Les centrales et les sources sans consommation électrique ne sont pas des circuits de cette liste. Leur fonctionnement reste régi par le carburant, l’état du bâtiment et, pour le solaire, le cycle diurne. Un consommateur allumé garde sa demande nominale, même lorsque sa production est bloquée par un stock plein : le délestage manuel a donc une utilité.

La priorité **Éclairage d’abord** sert balises, lampadaires et projecteurs avant les autres consommateurs. L’ordre habituel conserve les catégories de distribution du jeu. Les priorités existantes des bâtiments départagent les équipements d’une même catégorie. Changer l’ordre ne crée ni puissance, ni munitions, ni ressources.

## Jour, nuit et autres systèmes

Les tests de la chaîne complète préparent une cour solaire, une armoire vide et quatre projecteurs. Après vingt secondes de simulation, la batterie contient 108 u·s : 6 × 20 × 0,9. À la fin du solaire, la production directe de 8 ne couvre plus la demande de 12 ; la batterie fournit l’appoint de 4. Lorsqu’elle ne peut plus le fournir, les derniers projecteurs non servis s’éteignent. Leurs pixels redeviennent noirs et les cibles non éclairées ne sont plus acquises automatiquement. Couper deux circuits peut rétablir le projecteur utile sans déplacer ni réparer sa structure.

Le HUD, les Préparatifs et les alertes de cité comptent l’appoint des batteries au lieu d’annoncer une panne malgré leur soutien. La production industrielle intègre le temps réellement alimenté entre deux mises à jour économiques : allumer au dernier instant ne produit pas gratuitement pour toute la période passée. Les tests couvrent également le cas inverse, l’énergie déjà fournie avant une coupure.

L’écran est intégré au dossier existant ; aucun quatorzième onglet n’a été ajouté. Recherche, filtres et pages de douze circuits évitent d’afficher toutes les commandes d’une grande ville dans une liste continue. Les contrôles sont exercés au clavier et en Chromium tactile à densité 2.

## Sauvegarde v11

Le nouveau registre contient la charge et le mode de chaque batterie, les exceptions de circuits et la priorité de réseau. Les versions v1 à v10 migrent sans énergie stockée supplémentaire ni circuit coupé d’office. Les registres de récupération, exploration, quartiers, secours et progression urbaine sont préservés.

Surcharges, valeurs non finies, identifiants étrangers, doublons, batteries inachevées et absence de charge obligatoire sont refusés avant mutation du monde. La limite de 128 batteries est contrôlée lors du placement, y compris les chantiers. Le jeu 1.11 ne peut pas relire une sauvegarde v11 ; conserver son export original.

## QA et périmètre

Résultats actuels : **925 tests Node**, endurance incluse ; **46 nouveaux contrôles Chromium** dans quatre contextes parallèles ; **249 contrôles navigateur hérités** ; **8 contrôles de distribution**, tous réussis. Un test de conservation vérifie 2 000 configurations d’allocation sans mutation de leurs entrées ; il compte comme un seul test Node.

Les pages chargent le véritable moteur, le DOM et les atlas. Les situations électriques avancées sont préparées par les scripts ; les ressources et bâtiments de ces fixtures ne représentent pas une campagne gagnée naturellement. Le temps est piloté. Les lectures de pixels vérifient l’éclairage et l’obscurité ; les captures ne sont pas une maquette, mais elles ne constituent pas une revue artistique humaine exhaustive.

La première adaptation a trouvé des attentes historiques de version et de nombre de bâtiments à mettre à jour, ainsi qu’un test ancien d’allocation dont les objets factices n’avaient pas d’identité ni de santé. Les propriétés de ces fixtures ont été complétées sans modifier l’exigence de répartition. Les premiers journaux restent inclus. La règle anti-micro-recharge a ensuite été ajoutée et testée.

Le monde reste de 128 × 128 cellules, avec 720 infectés simultanés maximum. Pas de certification Safari/iOS physique, Firefox, Electron empaqueté, longue mégaville à population maximale ou débit d’images sur le matériel du joueur. L’endurance logique historique contient une assistance synthétique explicitement enregistrée. Aucun résultat n’est présenté comme quatre joueurs humains ayant terminé toutes les campagnes.
