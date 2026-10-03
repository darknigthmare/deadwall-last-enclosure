# DEADWALL 1.20 — Les chemins du retour

**Jeu complet, candidat local 1.20.0-rc.1. Aucun push GitHub ni déploiement Vercel.**

Cette passe prolonge l’atlas de la 1.19 : elle vérifie un chemin dans la vraie cité entre une jonction et une face accessible du dépôt. Elle distingue piéton et break, signale les diagnostics devenus périmés et chiffre séparément le carburant régional et local. Les autres systèmes restent présents.

## Jouer

Ouvrir **DEADWALL_Standalone.html**, avec moteur et images intégrés. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

Dans **Carte & exploration → D-17 : emprise et jonctions → Jusqu’au dépôt**, choisir **À pied** ou **Break**, puis **Vérifier les quatre accès**. Le bouton **Afficher** dessine le trajet dans l’atlas et, une fois rentré, dans D-17. Le calque **Itinéraire** de l’atlas contrôle son affichage. Les commandes habituelles déplacent toujours le joueur : aucun pilote automatique n’est ajouté.

Le trait pointillé régional reste une suggestion routière. Le trait plein dans D-17 est le segment vérifié contre les collisions de la cité au moment du calcul. Le contrôle propose cinq positions d’approche à chaque jonction, dont la position centrale. Une arrivée centrale encombrée peut donc être distinguée d’un accès entièrement condamné.

## Un chemin, pas seulement un point d’arrivée

Les murs, les bâtiments achevés, les portes fermées et les props utilisent leurs collisions existantes. Le contrôle emploie le gabarit piéton ou le test physique du break. La destination est une position de service extérieure au centre de commandement ; le trajet n’entre pas sous sa représentation.

La recherche bornée utilise quatre grilles d’un mètre décalées de 0, 0,25, 0,5 et 0,75 m, puis vérifie chaque segment. Cela réduit les faux blocages aux ouvertures décentrées. Un résultat « chemin non trouvé » n’est pas une preuve mathématique qu’aucun passage manuel n’existe. Les infectés et véhicules mobiles ne sont pas prédits.

Une porte fermée, un chantier terminé, un bâtiment déplacé ou un décor épuisé invalide le diagnostic. Le tracé périmé est masqué et doit être recalculé. Un léger changement d’intégrité sans effet physique ne déclenche pas une fausse reconstruction du monde.

## Retour et carburant

Le nouveau budget est un **retour seul**, sans détour par le repère d’exploration. Il part du commandant à pied ou de l’emplacement réel du break en mode véhicule. La suggestion régionale contourne l’emprise de D-17 : elle ne passe pas dans une copie régionale non simulée pour rejoindre une jonction opposée.

Le calcul conserve les deux débits du moteur :

- région : **0,004 unité par mètre** ;
- D-17 : **0,003 unité par unité locale**, soit **0,096 par mètre projeté**.

La différence existante n’est pas rééquilibrée dans cette passe. Le budget additionne les deux portions, ajoute 25 % de marge puis la réserve fixe déjà réglable dans Sac & relais. Lire un budget ne retire ni ne crée de carburant. Il n’autorise pas non plus à utiliser un stock éloigné sans le rejoindre.

## Compatibilité

**Sauvegarde toujours v17**, sans nouvelle migration obligatoire. Les résultats du contrôle et le trajet sélectionné sont transitoires : ils sont effacés au chargement et à la nouvelle partie. Les ressources, prélèvements, bâtiments, véhicules, relais et trois générations régionales sont conservés.

La région garde 42 types de plans. La graine 17117 conserve 231 parcelles, 317 niveaux et 405 éléments extérieurs récupérables. La construction et le siège restent dans D-17, dont l’emprise projetée est de 128 × 128 m. Cette passe ne rend pas toute la région constructible et ne redimensionne pas les gabarits historiques.

## Codex compagnon

Le paquet externe **DEADWALL_CODEX_500_LIEUX_1.20.zip** préserve les 500 fiches, 25 familles, 42 plans pilotes et 458 conceptions non intégrées. Il ajoute **07_CHEMINS_RETOUR_1.20.md** et un guide HTML. Il reste un document pour les générations suivantes, pas un onglet développeur en jeu.

## Vérifier

```sh
npm run check
DEADWALL_SOAK=1 npm run check
npm run test:world
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Sous cmd.exe, utiliser `set DEADWALL_SOAK=1` avant `npm run check`. Les scripts navigateur lancent leurs serveurs. Les variables `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent de réutiliser des outils existants.

Rapport : **reports/RAPPORT_1.20.html**. Les tests avancés préparent des enceintes, réserves et véhicules ; le temps est piloté, pas joué par quatre testeurs humains. Un parcours conduit réellement le break avec le moteur normal puis décharge son coffre au centre. Safari/iPhone physique, Firefox, Electron empaqueté, longues campagnes et fluidité sur le matériel du joueur restent à vérifier.
