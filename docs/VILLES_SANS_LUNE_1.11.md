# DEADWALL 1.11 — Villes sans lune

Candidat local **1.11.0-rc.1** construit à partir du jeu complet 1.10. Aucun push GitHub ni déploiement Vercel.

## Nuits noires

Les vagues 4, 7, 10, puis tous les trois assauts, se déroulent dans une nuit noire. Le calme annonce le type de nuit à venir. Le masque noir devient actif pendant l'assaut et la sécurisation. Le retour au calme rétablit le jour. Les trois premières nuits et les autres vagues restent des nuits ordinaires, avec une visibilité ambiante réduite.

Le terrain non éclairé est réellement masqué en noir. Les sources ouvrent des zones visibles dans le masque ; le simple éclaircissement global précédent ne suffisait pas à produire cet effet. Les obstacles construits coupent la lumière. Les portes ouvertes à tous laissent passer le faisceau ; les portes automatiques et verrouillées restent opaques, même si les alliés peuvent franchir les premières. Le rendu reste un calcul 2D par cellules et rayons, pas une illumination volumétrique 3D.

`L` et le bouton tactile commandent une torche autonome orientée selon la visée. Elle est éteinte au départ, ne nécessite pas de munition et ne possède pas de système de batterie dans ce candidat. Son faisceau dessiné porte à 190 unités ; l'acquisition automatique est plus conservatrice que le bord estompé du halo. Elle s'éteint visuellement quand le commandant est à terre. Le joueur peut toujours tirer manuellement dans l'obscurité.

Les miradors, tourelles, fusiliers et l'assistance de visée tactile n'acquièrent pas d'infecté non éclairé pendant une nuit noire. Les réactions de danger et le corps-à-corps existants ne sont pas remplacés par ce système. Les flèches donnant des positions ennemies sont masquées ; la minicarte n'affiche pas les infectés non éclairés. La carte stratégique conserve ses bâtiments connus et les fronts déjà annoncés, sans ajouter de radar.

Les anciennes constructions qui avaient un halo décoratif mais aucun consommateur électrique n'éclairent plus gratuitement une nuit noire. Le centre conserve son éclairage de secours. Les consommateurs éclairants nécessitent une allocation électrique complète. Générateurs, centrales à carburant et incendies sont traités selon leur état effectif. Les lumières ne soignent rien et n'infligent aucun dégât.

Le rendu limite les sources les plus proches de la caméra à 85. Cette limite graphique ne coupe pas les lumières logiques des défenses éloignées : leur acquisition peut utiliser une source hors caméra. Les polygones statiques sont mis en cache et invalidés par les changements de navigation. Ce mécanisme ne certifie pas une cadence d'images sur tous les matériels.

## Onze âges constructibles

Le score est la somme des valeurs des constructions **achevées**, pas le nombre d'habitants. Les sept premiers seuils numériques sont conservés ; les noms supérieurs sont réorganisés pour que Métropole précède Mégaville.

| Âge | Score requis | Nouvelles constructions 1.11 |
|---|---:|---|
| Refuge | 0 | Balise de secours |
| Camp fortifié | 10 | Lampadaire de cité, projecteur directionnel |
| Avant-poste | 24 | Maisons en bande, cour solaire |
| Forteresse | 48 | Immeuble de quartier, magasin central |
| Ville | 85 | Hôpital de ville, halle alimentaire, centre logistique |
| Grande ville | 135 | Centrale de quartier, usine de valorisation, cuisine industrielle |
| Métropole | 210 | Tour résidentielle, complexe de granulats, arsenal métropolitain |
| Grande métropole | 420 | Plateforme métropolitaine, ensemble résidentiel, centre hospitalier |
| Mégaville I | 750 | Grand ensemble fortifié, raffinerie urbaine, projecteur de grand périmètre |
| Mégaville II | 1 200 | Tour de mégaville, complexe nourricier |
| Mégaville III | 1 850 | Centrale de mégaville, réserve stratégique de mégaville |

Les 40 structures précédentes restent présentes, soit 66 types au total, centre et variantes compris. Le catalogue constructible ne crée aucun bouton pour les bâtiments des âges futurs. À l'âge atteint, les modèles apparaissent ; leurs coûts et dépendances demeurent. Les rangs futurs peuvent être nommés dans la progression, mais leurs fiches de constructions ne sont pas dévoilées.

Un âge atteint reste connu même après des pertes. Le score actuel, le stockage, les logements et l'électricité diminuent effectivement si leurs bâtiments sont détruits. Les dépendances doivent être reconstruites pour retrouver les commandes concernées. L'historique de score ne donne aucune ressource, aucun bâtiment et aucun habitant.

## Économie et volumes

Les constructions utilisent le chantier, le placement, les coûts, les dégâts, le stockage, la signature et la consommation électrique existants. Les logements ajoutent de la **capacité**, pas des habitants. Les volumes en hauteur sont des dessins 2.5D, jusqu'à vingt niveaux représentés ; il n'y a pas d'intérieur visitable ou de déplacement vertical ajouté.

Les nouveaux dépôts augmentent la capacité par ressource et sont des destinations physiques pour le joueur et la collecte ordinaire. Ils ne créent pas de convoi et ne changent pas automatiquement les destinations des sorties spécialisées, dont plusieurs doivent encore revenir au centre.

La cour solaire fournit 18 unités pendant le calme diurne seulement. Elle ne possède pas de batterie et s'arrête dès l'alerte. La centrale de quartier fournit 90 unités contre 0,065 carburant par seconde ; la centrale de mégaville 210 contre 0,16 par seconde, avant la réduction de la doctrine Réseau prioritaire. Elles cessent de produire sans carburant ou pendant leur incendie.

Les productions de nourriture, matériaux, carburant et munitions sont limitées par leurs intrants, l'électricité et le stockage. Leurs intrants ne sont pas gaspillés quand la sortie est saturée. Les hôpitaux soignent les personnes vivantes, accessibles et présentes dans leur rayon, contre médicaments et courant. Ni résurrection ni traitement de la contamination n'est ajouté.

Les nouveaux bâtiments combustibles rejoignent le système d'incendie ; les centrales, raffineries et arsenaux peuvent s'embraser après de forts dégâts. Les lampes restent des éclairages, pas des tours de tir.

## Sauvegarde v10

Le registre urbain conserve le plus haut score atteint, la torche et l'éventuelle exemption de la nuit en cours pour les migrations. Les orientations utilisent la rotation des structures déjà sauvegardée. Les registres des extensions précédentes sont préservés.

Les versions v1 à v9 migrent. Leur premier âge connu est dérivé des constructions existantes, faute d'ancien historique complet. Une ancienne sauvegarde importée pendant l'alerte, l'assaut ou la sécurisation ne passe pas soudain dans une nuit noire ; les nuits suivantes suivent le calendrier normal. Une sauvegarde v10 reste illisible par le jeu 1.10 : conserver l'export d'origine.

Les valeurs non finies, négatives, les exemptions datées du futur et un pic de score inférieur aux structures courantes sont refusés avant remplacement de la campagne.

## Portée des tests

Les 889 tests Node comprennent les contrôles logiques historiques et une endurance technique assistée identifiée dans ses journaux. Quatre nouveaux parcours Chromium ont été exécutés en parallèle : survivant de nuit noire, électricien, bâtisseur et tactile/sauvegardes. Les 46 nouveaux contrôles chargent le vrai moteur, le vrai DOM et les dix atlas/textures ; les zones noires sont vérifiées par lecture des pixels du Canvas, et les 26 peintres ont été exécutés.

Les 203 contrôles navigateur hérités et les huit contrôles de distribution/hors ligne ont été rejoués. Les scènes de métropole et de mégaville sont des mises en place de QA, avec âge et constructions préparés ; elles ne sont pas présentées comme des campagnes jouées naturellement jusqu'au dernier rang. Les premiers échecs de fixtures, les corrections et les résultats finaux sont conservés dans le rapport courant.

Le monde reste de 128 × 128 cellules, et le plafond de 720 infectés simultanés est inchangé. Pas de validation Safari/iOS physique, Firefox, Electron empaqueté, simulation d'une mégaville peuplée pendant plusieurs heures, ni garantie de fluidité. Les captures sont celles du jeu ; elles ne remplacent pas une revue artistique humaine exhaustive.
