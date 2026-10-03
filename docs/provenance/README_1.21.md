# DEADWALL 1.21 — Horizons reconnus

**Jeu complet, candidat local 1.21.0-rc.1. Aucun push GitHub ni déploiement Vercel.**

La région et ses 42 plans sont conservés. Cette passe relie le bureau d’expédition à la grande carte : indices à confirmer, secteurs réellement parcourus et tournée jusqu’à six arrêts. Les relais, soins, réparations, atlas et chemins du retour précédents restent présents.

## Jouer

Ouvrir **DEADWALL_Standalone.html**. Moteur et images sont intégrés. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

Dans **Commandement → Terrain → Carte & exploration**, ouvrir **Renseignement & tournées**, ou le bouton RENSEIGNEMENT de l’atlas. Le panneau reste dans le dossier de carte existant. Le menu public ne reçoit pas de nouveau dossier développeur.

## Renseignement régional

Le bureau d’expédition doit être achevé et alimenté. Affecter son analyste avec la commande existante ; cette affectation conserve son coût de deux rations et utilise un véritable ouvrier. Choisir ensuite l’une des six zones et lancer **Recouper**, pour cinq rations.

Le dossier demande **40 secondes de travail effectif** au bureau. Jusqu’à trois lieux inédits sont signalés, sans créer de ressource. L’analyste ne produit pas de renseignement générique pendant ce travail. La marche vers le bureau, la pause, une panne ou le repli ne font pas progresser le dossier. La nuit peut imposer un retour de l’ouvrier ; le progrès reste conservé jusqu’à une affectation opérationnelle.

Un signalement donne un secteur approximatif de 65 mètres de rayon et un usage supposé. Le nom exact, les dimensions et le stock ne sont pas révélés. Il faut approcher réellement le lieu pour le confirmer. Les rations de préparation ne sont pas remboursées en cas d’abandon.

## Tournées

Ajouter jusqu’à six lieux confirmés ou indices dans la feuille de route. Les arrêts peuvent être réordonnés au repos. Activer la tournée montre un guidage vers sa prochaine étape, sans conduire le personnage. Passer explicitement à la suivante ne marque pas le lieu comme fouillé. Mettre en pause puis reprendre conserve la prochaine étape ; une tournée terminée peut être relancée.

Le budget couvre la boucle **régionale**, au départ de la jonction choisie quand on se trouve à D-17, ou de la position régionale du commandant/véhicule. Il ajoute le retour régional à la même jonction. Le débit régional est inchangé : 0,004 carburant par mètre, marge de détour 25 %, plus réserve fixe.

Le budget n’inclut pas le trajet local de D-17. Consulter **Jusqu’au dépôt** pour la dernière portion contrôlée. Les indices et raccordements restent approximatifs, et aucun danger futur n’est prédit. Le guide de tournée prend temporairement la priorité sur le repère unique sans effacer ce repère.

## Carte des passages

Le calque **Secteurs parcourus** enregistre la cellule réellement occupée en région, au rez-de-chaussée, pendant la simulation. Une cellule mesure 128 mètres. La carte ne déclare pas toute la cellule fouillée ou sûre. Regarder une zone, charger la sauvegarde ou changer d’étage n’ajoute aucune cellule.

Les trajets antérieurs à cette version ne sont pas reconstruits artificiellement. Les découvertes précédentes sont conservées, mais le nouveau registre commence vide lors d’une migration.

## Sauvegarde v18

Les sauvegardes v1 à v17 migrent sans indices, ressources ou tournée offerts. Les générations 1, 2 et 3 restent inchangées. Les dossiers en cours gardent leurs cibles et leur progression ; la tournée conserve ses arrêts et son curseur.

Les régressions ont détecté un problème nouveau de lecture des relais : leur module ne reconnaissait explicitement que la v17. Le chargement accepte maintenant les versions supportées à partir de v17 et garde leurs stocks. Les anciennes vérifications de conservation sont maintenues.

**Conserver l’export d’origine : la 1.20 ne relit pas la v18.** La construction et le siège restent à D-17, toujours projeté sur 128 × 128 m. Cette version ne transforme pas toute la région en chantier et n’ajoute pas de nouveaux plans architecturaux.

## Codex externe

Le paquet compagnon **DEADWALL_CODEX_500_LIEUX_1.21.zip** conserve les 500 fiches et le lecteur précédent, avec 42 plans pilotes et 458 conceptions non intégrées. Le nouveau guide **08_RECONNAISSANCE_TOURNEES_1.21.md**, aussi livré en HTML, détaille la chaîne renseignement → déplacement → confirmation → fouille → retour. Il est séparé du jeu.

## Vérifier

```sh
npm run check
DEADWALL_SOAK=1 npm run check
npm run test:world
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Sous cmd.exe : `set DEADWALL_SOAK=1`, puis `npm run check`. Les scripts navigateur créent leurs serveurs locaux. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent de sélectionner une installation existante.

Rapport actuel : **reports/RAPPORT_1.21.html**. Journaux : **reports/1.21/**. Scènes avancées préparées, temps contrôlé et endurance assistée explicitement : il ne s’agit pas de quatre joueurs humains. Safari/iPhone physique, Firefox, Electron empaqueté, longues campagnes et fluidité sur le matériel du joueur restent à vérifier.
