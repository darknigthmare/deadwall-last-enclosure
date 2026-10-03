# DEADWALL 1.3 — Les Nuits de siège

## Rôle dans la boucle originale

Cette extension renforce « construire → fortifier → survivre → reconstruire ». Elle ajoute des migrations de composition différente et un réseau de secours à défendre à l'intérieur des enceintes. La ville n'obtient ni invulnérabilité ni ressources gratuites. Les sorties 1.1, territoires 1.2, transports, équipes et coûts d'entretien restent présents. Ce ne sont pas de nouvelles cartes ni un moteur 3D.

## Quatre structures

| Structure | Palier et dépendance | Coût | Fonction |
|---|---|---|---|
| Citerne anti-incendie | Camp fortifié | 60 ferrailles, 40 pierres, 8 carburants | Réserve locale de 120 eaux ; puissance 2 ; commence vide. |
| Poste de secours incendie | Avant-poste, atelier militaire | 65 bois, 80 ferrailles, 25 pierres | Deux ouvriers existants peuvent être détachés ; puissance 2. |
| Cloison coupe-feu | Avant-poste | 12 ferrailles, 10 pierres | Mur incombustible de 680 intégrités, bloquant les déplacements et la propagation directe. |
| Vigie d'alerte | Camp fortifié | 70 bois, 65 ferrailles, 10 munitions | Puissance 1, bonus unique de 7 secondes à une nouvelle alerte, à partir de la vague 3. |

Tous ces bâtiments ont une emprise de grille, une durée de chantier, un coût, une intégrité et une contribution à la signature. Le catalogue conserve toutes les constructions antérieures. Le poste de secours ne crée pas de PNJ : l'ouvrier détaché reste compté dans la population et ses besoins. Limites techniques annoncées : 128 citernes, 16 secouristes détachés au maximum.

## Eau de secours

L'eau est un inventaire spécialisé du réseau de secours, distinct des sept ressources de stockage central. Une pompe alimentée produit 0,55 eau/s et dépense 0,012 carburant par eau. La pluie ajoute au plus 0,12 eau/s selon son intensité, même sans courant. Le remplissage est fractionné à capacité partielle ; ni une citerne pleine ni une pompe arrêtée ne consomment leur carburant.

L'eau reste dans chaque citerne. Détruire une citerne perd sa réserve. Les porteurs prennent réellement cette eau sur place, à 4 eaux/s ; il n'existe pas de distribution instantanée à distance. Le bilan de Logistique inclut le débit courant de carburant des pompes et l'arrêt des générateurs incendiés. Il reste un bilan instantané, pas une prévision de la campagne.

## Départs de feu et propagation

Un générateur, une raffinerie, une manufacture de munitions ou une cuisine collective peuvent s'enflammer après un dégât qui les laisse à 45 % ou moins de leur intégrité. Les explosions peuvent embraser une structure combustible proche. Un logement ou une palissade ne s'enflamme pas spontanément parce qu'un zombie le frappe. Aucun jet aléatoire gratuit n'allume une cité paisible.

Les foyers commencent à 28 de chaleur. La chaleur croît lentement (0,28/s, jusqu'à deux fois moins vite sous pluie), les dommages dépendent de cette chaleur et du matériau. Après 48 de chaleur, un foyer peut propager le feu toutes les 4 secondes à un voisin séparé de 38 unités au plus entre les emprises. La propagation directe est arrêtée par une cloison coupe-feu, un mur d'acier ou un mur de béton qui coupe le segment. Les explosifs en destruction utilisent un rayon borné au plus à 70 unités entre emprises. Ce modèle géométrique simplifié ne simule ni le vent, ni la diffusion volumétrique de chaleur.

Les dégâts passent par `Game.damageBuilding` et `Game.destroyBuilding` : pertes de structures et défaite du centre gardent leurs règles d'origine. Une industrie en feu cesse de produire et un générateur en feu cesse de fournir de l'électricité et de consommer son carburant d'entretien. Les autres besoins électriques restent présents. L'extinction permet la reprise, sans réparer l'intégrité. Les structures terminées en bois/industrielles ont des susceptibilités distinctes ; le béton, l'acier, les cloisons et les citernes ne sont pas combustibles.

Le combustible d'un foyer s'épuise au bout de 180 s actives s'il n'a pas déjà détruit sa structure. Au plus 32 foyers actifs sont suivis pour borner la simulation. Ce plafonnement est technique, pas une promesse d'incendies illimités. Les incendies endommagent les **structures** ; ils ne constituent pas une arme supplémentaire blessant directement les infectés, joueurs ou fourgons. Les explosions historiques conservent leurs dégâts propres.

## Intervention manuelle

En jeu : **V**, le bouton **SEAU** du HUD, ou le bouton du poste de commandement. Avec le seau équipé, **ACTION / E** remplit à une citerne ou arrose un foyer accessible. Une structure sélectionnée est prioritaire. Les voies bloquées sont contrôlées avec les méthodes du jeu et les emprises réelles. Des infectés à proximité suspendent l'arrosage.

Le seau contient 8 eaux dans un emplacement dédié : ce n'est pas une ressource ordinaire du sac. Le tir, la crosse et le rechargement sont indisponibles quand il est équipé. Ranger le seau restitue E aux sorties et aux quartiers ; la capacité du sac n'est pas modifiée. L'eau refroidit le foyer à raison de 9 chaleurs par eau, avec un débit de 2 eaux/s. Seule l'eau nécessaire est dépensée lors de l'extinction. La structure reste humide pendant 24 s actives, évitant une réinflammation immédiate ; aucune santé n'est restaurée. Le commandant tombé perd l'eau de son seau.

## Secouristes et replis

Commandement → Terrain → **Siège & secours** permet d'affecter un ouvrier libre. Il ne peut pas être simultanément détaché à un quartier. Il rapporte d'abord son sac ordinaire, choisit une citerne, prend jusqu'à 12 eaux puis rejoint le foyer par la navigation alliée. La pression ennemie à proximité le fait reculer. Une porte verrouillée peut empêcher le trajet, le remplissage ou l'arrosage ; les échecs de parcours utilisent la mémoire temporaire de tâches bloquées du jeu.

Un ordre de repli général est prioritaire. La perte de places de secours (poste détruit, incendié ou non alimenté) rappelle les équipes excédentaires. Un rappel ne téléporte ni ne libère immédiatement l'ouvrier : il rejoint le centre, abandonne son eau restante et redevient disponible pour les tâches ordinaires. Un ouvrier mort n'est jamais recréé par la reprise de sa sauvegarde. Les équipes de nettoyage des corps restent une mission distincte ; elles ne sont pas remplacées par les porteurs d'eau.

## Six migrations

Les vagues 1 et 2 sont intactes. Les nouvelles alertes à partir de la vague 3 appliquent un profil déterminé par la vague et la graine, sans consommer le générateur aléatoire de campagne. Les types non encore débloqués ne sont jamais introduits. Le total de contacts, les points de vie, les fronts et le plafond simultané ne sont pas augmentés.

| Profil | À partir de | Différence |
|---|---:|---|
| La Marée compacte | 3 | Plus d'errants, arrivées plus serrées. |
| La Course des récents | 4 | Plus de récents et rampants, progression rapide. |
| Les Colonnes de rupture | 5 | Plus de briseurs ; les structures sont les cibles critiques. |
| Les Rues de traverse | 6 | Plus de traqueurs et de récents ; équipes isolées exposées. |
| Le Poids des dépouilles | 8 | Plus d'engorgés et de protégés, charge de corps accrue. |
| Le Siège étiré | 9 | Effectif identique, arrivées plus espacées, pression logistique prolongée. |

Le plan reçoit une nouvelle pondération suivie d'un arrondi conservant exactement son total. Il n'ajoute pas de seconde file d'ennemis. À partir de la vague 3, une vigie alimentée ajoute 7 s au début de l'alerte, jamais plusieurs fois pour la même vague ni par multiplication des vigies. Le profil d'une vague déjà enregistrée n'est pas recalculé au chargement. La fin du siège utilise les mêmes conditions et récompenses qu'avant.

## Sauvegarde v5

Le format v5 conserve chaque citerne, l'eau des porteurs et du commandant, les foyers, leur âge, la propagation, l'humidification, les affectations et rappels, le journal borné et le dernier profil annoncé. Les registres `fieldOps` et `territories` sont conservés. Les v1/v2/v3/v4 migrent avec un réseau de secours vide, sans ressource ou récompense attribuée.

Le validateur vérifie les identifiants : pas de citerne inexistante, feu sur béton, eau sur commandant à terre, ou ouvrier affecté à deux systèmes. Toute erreur précède le remplacement du monde. Les délais ne s'écoulent pas hors ligne. Gardez l'export de votre ancienne sauvegarde : l'ancien jeu ne sait pas lire la v5. Restaurer les fichiers de code ne convertit pas une campagne v5 en v4.

## Intégration et limites de livraison

Les nouveaux modules sont ajoutés aux scripts existants sans remplacer le moteur. Les hooks sont appliqués à des motifs exacts, protégés par les empreintes de la base ou les reçus d'installation. Les exports CommonJS du cœur, le build autonome, la liste publique et le protocole Electron conservent leur structure ; le cache PWA est renouvelé. Les quatre silhouettes de bâtiments et les flammes sont dessinées en Canvas ; ce ne sont pas des atlas illustrés définitifs.

Cette livraison est une extension cumulative candidate. Le dépôt original complet et ses atlas ne sont pas dans l'environnement de test. Les tests Node et les quatre parcours Chromium exécutent les modules réels sur un hôte explicite simulé. Ils ne prouvent pas une campagne complète, une cadence d'images sur PC ou mobile, une compatibilité Firefox/Safari/Electron, ni l'équilibrage commercial. Le projet complet doit être assemblé, `npm run check` exécuté, puis les longues campagnes et occlusions vérifiées avant publication.
