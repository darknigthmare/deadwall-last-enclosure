# Survivants tombés et relève — 1.33

La mort personnelle est définitive. La campagne de D-17 continue tant que son centre tient. Un écran suspend le temps pour choisir une nouvelle personne ; il ne recrée ni la colonie, ni les gisements, ni les véhicules, ni les réserves.

## Ce qui reste sur place

Au moment exact de la mort, la position contient le domaine local ou régional, les coordonnées, l’intérieur et l’étage. Le sac, la dépouille, les armes et leurs chargeurs, la cartouchière, le gilet restant, l’entretien des armes, les outils consommables et les kits de ceinture sont conservés dans un registre indépendant des cadavres temporaires de la horde.

Les éclairages portés et les modules techniques gardent leurs mécanismes physiques existants : ils sont posés à la même position réelle. Un ballot de prospection est reposé dans D-17 ; une opération de campagne portée est perdue. Les interventions personnelles sont interrompues, le repas et le pansement ne passent pas au successeur. Les sorties manuelles et le seau de lutte contre l’incendie sont nettoyés avant la sauvegarde du décès.

Maintenir **E** près du sac reprend ce qui tient dans l’inventaire. La portée est de 1,8 m ; domaine, étage, accès physique, poids, capacité, rangement et menace proche sont contrôlés. Le reliquat reste sur place. Une arme déjà possédée reste dans le sac au lieu de disparaître. Il n’existe pas de récupération à distance depuis le dépôt.

## Retour de l’infection

Chaque mort reçoit une seule fois un tirage déterministe enregistré : **30 %** de risque de se relever après **75 à 150 secondes de simulation active**. Ce réglage est une règle fictionnelle d’équilibrage, pas une estimation médicale. Menus et pause ne font pas avancer ce délai. Recharger ne relance jamais le tirage.

Dans D-17, la dépouille devient un vrai infecté du moteur, avec navigation, collisions, projectiles, crosse, défenses, plafond de population et identifiant sauvegardé. Dans la région, le revenant conserve son étage ; il réutilise la navigation physique des contacts et peut être neutralisé par les tirs, les compagnons ou **Espace** au contact. Les contacts éloignés sont dormants comme les autres infectés régionaux. Le sac reste au point de décès même si le revenant se déplace. Après neutralisation, sa dépouille reste à son dernier emplacement.

## Profils disponibles

| Profil | Vie | Déplacement à pied | Sac | Particularité |
|---|---:|---:|---:|---|
| Éclaireuse | 90 | +8 % | 32 portions | Mobilité contre protection et portage |
| Manutentionnaire | 100 | −6 % | 44 portions | Portage contre mobilité |
| Bâtisseuse | 100 | −2 % | 38 portions | Construction manuelle +15 % |

Les multiplicateurs fonctionnent dans D-17 et à pied dans la région ; ils n’accélèrent pas les véhicules. Les travaux de la bâtisseuse ne créent aucun matériau. Le profil, les possessions et la capacité sont réappliqués lors de la reprise.

Une relève arrive au dépôt **sans arme, chargeur rempli ou réserve offerte**. Elle peut reprendre le matériel perdu ou retirer une arme vide à l’armurerie du dépôt : pistolet 8 ferrailles, fusil 20, pompe 16. Le palier de l’arme reste requis. Recharger consomme ensuite les munitions accessibles selon les règles existantes. À mains nues, les coups font 18 dégâts contre 36 avec la crosse d’une arme possédée. La première personne d’une nouvelle campagne conserve le départ prévu par le scénario.

## Persistance et limites

`succession133.version = 1` est un champ additionnel du format général 20. Les sauvegardes antérieures restent lisibles. Si une ancienne sauvegarde contient une personne morte, sa mort est enregistrée avec le matériel encore présent au chargement ; un ancien fichier qui avait déjà perdu sa position régionale ne permet pas de reconstruire cette position historique.

La validation vérifie les champs, identités, quantités, armes, matériel, étage et bâtiment déterministe. Les revenants de D-17 doivent correspondre à un infecté sauvegardé réel. Tous les contrôles précèdent le remplacement du monde. Les cartes de validation d’étages utilisent un cache borné à deux mondes.

Le registre conserve au maximum 1 024 décès, sans supprimer silencieusement une dépouille ou un sac. Lorsque cette limite technique est atteinte, la relève est suspendue et l’interface explique la nécessité d’exporter la campagne ; le contenu reste exportable. Ce garde-fou n’est pas une durée de campagne promise.

## Raccordement

- `core.SuccessionRules` : réglages et profils.
- `succession133.js` : décès, transfert, persistance, récupération, contacts et rendu dans les files de profondeur existantes.
- `succession-ui133.js` : choix de relève, focus, commandes et armurerie.
- `frontier.js` : capture avant désactivation du domaine, projectiles et compagnons contre les revenants, vitesse personnelle et mêlée.
- `essential-ops.js` : transfert réel des kits dans les deux sens, en respectant la ceinture partagée avec l’éclairage.
- `loadout129.js` : armes physiquement possédées dans l’inventaire.

Les tests ciblés couvrent mort sans réveil automatique, conservation, reprise de campagne, profils, prix d’armurerie, reliquat, équipement, étage, import invalide atomique, migration, réanimation unique locale/régionale, neutralisation et présence dans les files de profondeur. Ils ne remplacent pas des parties longues humaines.
