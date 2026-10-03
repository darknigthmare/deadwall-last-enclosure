# DEADWALL 1.17 — Approches silencieuses

**Candidat local 1.17.0-rc.1. Projet complet, sans push GitHub ni déploiement Vercel.**

Explorer, ramener des ressources, construire et défendre D-17. La région possède maintenant 42 types de lieux, huit programmes spécialisés supplémentaires et une reconnaissance de proximité : marcher prudemment, choisir son contenant, faire attention au bruit et perdre une poursuite derrière les obstacles.

## Jouer

Ouvrir **DEADWALL_Standalone.html**. Le moteur, l’interface et les images sont intégrés. Pour travailler sur les sources : Node.js 22.12 ou plus récent, puis `npm start`.

En région : **C** active la marche prudente ; **T** choisit le contenant accessible suivant ; **E maintenu** fouille la cible. **F** commande le véhicule, **G** le coffre, **V** le carburant. **M** ouvre la carte ; **PageUp / PageDown** change de niveau près d’un escalier. **R** recharge, avec le second appui actif facultatif déjà présent. **L** commande la torche. Le HUD tactile propose les commandes correspondantes.

La marche prudente fait moins de bruit et réduit la distance de détection visuelle, mais ne rend pas invisible. Les tirs, la course, le véhicule en mouvement et la fouille peuvent attirer les infectés du même étage. Ils cherchent le point entendu et conservent une dernière position connue, sans connaître les déplacements à travers les murs. Leurs détours sont bornés et ne garantissent pas tous les chemins possibles.

Les sons de détection sont des signaux de gameplay ; cette passe n’ajoute pas d’enregistrements audio de pas ou de moteur. Le HUD indique le bruit produit par le joueur, pas les ennemis invisibles.

## Huit nouveaux lieux

Maison sur sous-sol, pharmacie, cuisine centrale, cabinet dentaire, recyclerie, halle fret, menuiserie et local de groupe électrogène. Chaque programme possède ses pièces, son mobilier et ses réserves. Les machines restent arrêtées : aucune production, guérison ou énergie gratuite n’est déclenchée par leur visite.

La nouvelle génération 3 comporte **231 parcelles, 317 niveaux et 42 types** sur la graine 17117. Le monde reste de 8,192 km de côté. **Les constructions et le siège restent dans D-17 ; toute la région n’est pas constructible.** Les gabarits des anciennes structures de la cité ne sont pas entièrement refondus.

## Campagnes existantes

La sauvegarde passe au format **v16**. Les formats v1 à v15 migrent. Les régions des générations 1 et 2 gardent leurs lieux, leurs contenants et leurs prélèvements. Les huit nouvelles familles apparaissent dans les nouvelles campagnes de génération 3. Les anciens mondes bénéficient de la marche prudente, du ciblage et des correctifs de poursuite.

Les positions et intentions des infectés rencontrés sont sauvegardées. Une région éloignée n’est pas simulée en permanence : son état attend le retour du joueur. Les stocks ne se remplissent pas au rechargement. Le jeu 1.16 ne lit pas une sauvegarde v16 : conserver l’export original avant migration.

## Codex externe

Le paquet compagnon `DEADWALL_CODEX_500_LIEUX_1.17.zip` contient 500 fiches, 25 familles, 2 061 espaces programmés, le JSON, le lecteur et les sources. Sa couverture distingue 42 plans pilotes et 458 conceptions non intégrées. Les huit dernières liaisons et les règles de reconnaissance sont documentées. Le codex n’est pas un menu développeur dans le jeu.

## Vérifier

```sh
npm run check
DEADWALL_SOAK=1 npm run check
npm run test:world
npm install --prefix .qa-tools --no-save --package-lock=false playwright@1.63.0
node .qa-tools/node_modules/playwright/cli.js install chromium
npm run test:browser
```

Sous cmd.exe, utiliser `set DEADWALL_SOAK=1` avant `npm run check`. Les scripts du navigateur démarrent leurs serveurs ; `DEADWALL_PLAYWRIGHT` et `DEADWALL_CHROMIUM` permettent de réutiliser des outils installés.

Rapport actuel : `reports/RAPPORT_1.17.html`. Détails : `docs/APPROCHES_1.17.md`. Les scènes avancées des tests sont préparées et leur temps est piloté, pas quatre parties humaines. Safari/iPhone physique, Firefox, Electron empaqueté et les campagnes de plusieurs heures restent à vérifier. Aucun exécutable signé n’est livré.
