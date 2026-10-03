# DEADWALL 1.18 — Relais de ravitaillement

**Jeu complet, candidat local 1.18.0-rc.1, non publié.** La région et ses 42 plans sont conservés. Cette passe ajoute la logistique physique des provisions, les soins et réparations de terrain, et des relais aménagés dans des contenants existants.

## Jouer

Ouvrir **DEADWALL_Standalone.html**, avec le moteur et ses images intégrés. Aucun ancien préparateur d’extension n’est nécessaire. Pour les sources : Node.js 22.12 ou plus récent, puis `npm start`.

Dans **Commandement → Terrain → Carte & exploration**, ouvrir **Sac, coffre & relais**. En région, le bouton **SAC & RELAIS** ouvre directement ce panneau. Le tiroir tactile **ACTIONS** offre le même accès. **G** conserve le dépôt rapide du sac dans le coffre ; le panneau permet de choisir les ressources et de les reprendre.

Le dépôt de D-17, le coffre et les relais sont des réserves différentes. Un transfert demande un accès physique au bon niveau. Choisir une réserve distante dans le menu permet de lire son stock, pas de le téléporter. Quantités : 1, 5 ou maximum possible ; le reliquat reste à l’origine si le sac ou la réserve est plein.

## Relais

Vider une caisse, une armoire ou un rayonnage. L’approcher, le cibler avec **T** si nécessaire, puis choisir **Aménager**. Coût : **6 bois + 4 ferrailles dans le sac**, cinq secondes de travail pendant le jour. Le relais réutilise le même objet et sa collision ; un repère visuel le distingue.

Chaque relais commence vide et contient jusqu’à **60 ressources au total**. Maximum : **16 relais**. Le stock est sauvegardé séparément du butin initial, qui reste épuisé. Retirer un relais demande sa présence et un stock vide ; aucun remboursement. Le relais n’est ni un bâtiment de production ni un point de réapparition. Cette version ne simule pas son pillage ou sa destruction structurelle.

## Soins et travaux

**Pansement :** deux médicaments portés, quatre secondes, jusqu’à 35 points de vie, plafonnés à la santé maximale. Pas de soin à pleine vie ou de résurrection. Peut être effectué la nuit si les conditions sont réunies.

**Réparation du break :** douze ferrailles portées, six secondes, jusqu’à 50 points d’intégrité, plafonnés à 320. Le jour seulement, à proximité et conducteur descendu. Ne répare pas un véhicule détruit et ne remplit pas le réservoir.

Un infecté proche avec une ligne de vue, un déplacement, un tir, un rechargement, des dégâts ou la perte des conditions interrompent l’action. Les matériaux sont retirés seulement à la fin. La progression est affichée dans le HUD. Les travaux de relais et de réparation émettent le bruit de travail existant.

Une action en cours n’est pas sauvegardée : reprendre la campagne l’annule sans dépense et sans effet différé. La pause ne fait pas avancer son temps.

## Préparer le retour

Le panneau estime le trajet vers le repère puis le retour à une jonction de D-17, ou le retour seul en l’absence de repère. Budget : consommation estimée + 25 % de détour + réserve fixe, réglable de 0 à 8 et initialement 2.

C’est une estimation, pas une garantie d’accès ni un pilote automatique. Elle n’inclut pas automatiquement la livraison finale au centre. Les réserves connues du véhicule ne deviennent pas physiquement accessibles à distance.

## Sauvegarde et monde

Format **v17**. Les sauvegardes v1 à v16 migrent sans relais ni ressource offerte. Les trois générations de région sont inchangées : nul besoin de recommencer pour utiliser ces mécaniques. Conserver l’export d’origine, car la 1.17 ne relit pas la v17.

La construction et le siège restent dans D-17. La région fait 8,192 km de côté ; la graine 17117 conserve 231 parcelles, 317 niveaux, 405 objets de cour. Les gabarits historiques du refuge ne sont pas intégralement redimensionnés.

## Codex externe

Le paquet compagnon **DEADWALL_CODEX_500_LIEUX_1.18.zip** contient toujours 500 fiches, 42 plans pilotes et 458 conceptions non intégrées. Son guide `05_RELAIS_1.18.md` documente les transactions, les accès, les actions interrompues et les migrations. Il est fourni séparément et n’ajoute aucun catalogue développeur au HUD.

## Vérifier

```sh
npm run check
DEADWALL_SOAK=1 npm run check
npm run test:world
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Sous cmd.exe, utiliser `set DEADWALL_SOAK=1` avant `npm run check`. Les scripts du navigateur démarrent leurs serveurs locaux. `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent de choisir des installations existantes.

Les scènes avancées des tests sont préparées et leur temps piloté, pas jouées par quatre humains. L’endurance logique possède une assistance synthétique déclarée. Safari/iPhone physique, Firefox, Electron empaqueté, campagnes de plusieurs heures et fluidité sur le matériel du joueur restent à vérifier. Aucun exécutable signé n’est livré.

Rapport : **reports/RAPPORT_1.18.html**. Journaux : **reports/1.18/**. Aucun push GitHub ni déploiement Vercel.
