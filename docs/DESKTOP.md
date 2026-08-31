# DEADWALL — édition Windows hors ligne

L'édition PC lance le jeu dans sa propre application Windows avec son icône, son profil persistant, une fenêtre redimensionnable, le plein écran et une fermeture qui confirme la sauvegarde. Elle embarque le moteur Canvas 2D/2.5D existant et tous les fichiers publics dans Electron ; ce n'est pas un port Unreal/Godot ni un nouveau moteur natif.

## Jouer

Extraire **tout** le dossier de l'archive `DEADWALL-1.0.0-Windows-x64-portable.zip`, puis lancer `DEADWALL.exe`. Les DLL, ressources et sous-dossiers doivent rester à côté de l'exécutable. Windows 10/11 x64 est la cible ; aucune installation de Node.js, de navigateur ou de serveur local n'est nécessaire. Le jeu n'a besoin d'aucune connexion réseau.

- F11 ou Alt+Entrée : basculer entre fenêtre et plein écran.
- Échap : pause du jeu et options existantes.
- Alt+Tab : le jeu se met en pause lorsqu'il perd le focus.
- Alt+F4 ou fermeture de la fenêtre : sauvegarder, vérifier l'écriture, puis quitter.
- Un second lancement ramène la fenêtre existante au premier plan.

Les dimensions, l'état maximisé et le plein écran sont conservés. La fenêtre est replacée dans l'espace disponible pour éviter de disparaître après un changement d'écran. Si la sauvegarde ne peut pas être confirmée, un dialogue propose de revenir au jeu avant de quitter.

## Sauvegardes et mises à jour

Le profil stable se trouve dans `%APPDATA%\DEADWALL`. Il contient le stockage persistant Chromium du jeu et `window.json`. Les sauvegardes gardent leur format versionné et leur mécanisme de secours existants ; l'édition Windows ne crée pas de format concurrent.

L'origine locale `deadwall://game/index.html` et le nom du profil ne dépendent pas du dossier de l'exécutable. Une mise à jour consiste à extraire la nouvelle version dans un autre dossier et à la lancer : **ne pas supprimer `%APPDATA%\DEADWALL`**. Pour une copie de secours intégrale, fermer le jeu puis copier ce profil. Les profils d'un navigateur et de l'application sont séparés ; un éventuel transfert passe par l'export/import du jeu, pas par une lecture des profils du navigateur.

## Construire

Les outils de développement exigent Node.js **22.12 ou supérieur**. La version initialement vérifiée utilise Node 24.15.0, npm 11.12.1, Electron 44.0.0, `@electron/packager` 20.3.0 et `@electron/fuses` 2.1.3. Le lockfile verrouille les dépendances.

```powershell
npm ci
npm run desktop:setup
npm run check
npm run desktop
```

Electron 44 télécharge explicitement son runtime via `desktop:setup`. L'accès réseau n'est nécessaire que pour installer les outils et le runtime ; pas pour jouer au dossier déjà construit.

```powershell
npm run package:desktop
# Ou choisir un répertoire de livrables hors du dépôt :
npm run package:desktop -- --output C:\chemin\livrables
```

Le script reconstruit `dist`, copie tous ses assets locaux, crée un `app.asar`, applique l'icône et les métadonnées DEADWALL, verrouille les fuses Electron et produit un dossier exécutable ainsi qu'une archive ZIP. Chaque fabrication utilise un nouveau sous-dossier `build-*` ; les anciennes livraisons ne sont pas remplacées. Le dossier intermédiaire `source` est conservé pour audit. Seuls le sous-dossier `DEADWALL-win32-x64` et son ZIP constituent la distribution joueur.

`release-manifest.json` indique les versions, la révision source au moment de la fabrication et les SHA-256 de chaque fichier source distribué, de l'exécutable et du ZIP. Si des modifications ne sont pas encore commitées, les hashes des fichiers sont la preuve exacte du contenu ; la révision Git seule ne décrit pas ces modifications.

La fabrication exige une provenance Git lisible : un échec de commande Git ne peut plus être présenté comme un arbre propre. Les métadonnées de `package.json` sont normalisées avant calcul de l'empreinte, sans le champ de développement `private` que Packager retire et avec le LF final qu'il ajoute. Avant création du ZIP, chaque fichier du vrai `app.asar` est relu et comparé au manifeste, avec rejet des fichiers supplémentaires et liens. La licence du jeu reste distincte de `LICENSE` et `LICENSES.chromium.html`, conservés avec le runtime ; leur présence et leurs empreintes sont vérifiées avant création du ZIP. `NOTICES_TIERS.md` explique ces composants et les limites de la revue. Voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Vérifier le vrai exécutable

```powershell
# Shell de développement, après construction de dist :
npm run test:desktop
# Dossier Windows effectivement empaqueté :
npm run test:desktop -- --executable C:\livrable\DEADWALL-win32-x64\DEADWALL.exe --output C:\preuves
# Ou extraire le ZIP joueur dans un dossier neuf et vérifier CET exemplaire :
npm run test:desktop -- --archive C:\livrable\DEADWALL-1.0.0-Windows-x64-portable.zip --output C:\preuves
# Vérifier également l'intégrité de cet exemplaire extrait (révision Git complète) :
node scripts/verify-desktop-integrity.mjs --folder C:\preuves\run-EXEMPLE\unpacked\DEADWALL-win32-x64 --manifest C:\livrable\release-manifest.json --archive C:\livrable\DEADWALL-1.0.0-Windows-x64-portable.zip --revision REVISION_GIT_40_CARACTERES --output C:\preuves
```

La vérification ouvre successivement deux processus avec un **profil temporaire isolé** : elle démarre une partie, modifie son état, ferme avec la sauvegarde normale, relance puis restaure exactement les valeurs attendues. Elle vérifie le rendu Canvas, les réglages persistants, le vrai bouton d'export, l'import avec prévisualisation/annulation/confirmation et le rejet d'un fichier corrompu. Elle contrôle aussi l'isolation, F11/Alt+Entrée, l'absence de Node dans le renderer, les chemins privés, les méthodes interdites, le blocage réseau/navigation/fenêtres externes et les erreurs console avec un observateur effectivement testé. Les captures et les rapports JSON restent dans le dossier de preuves indiqué à la fin. Le test choisit automatiquement un chemin d'export isolé et simule la sélection du fichier importé ; il ne constitue pas un audit visuel des dialogues système. Il ne touche pas au profil du joueur.

Les tests Node de `tests/desktop.test.cjs` couvrent la politique de fichiers, les chemins encodés, les origines hostiles, la politique CSP et les préférences invalides. Ils fonctionnent sans Electron ni dépendance installée ; la CI web demeure légère.

Le contrôle d'assets lit `DeadwallArt.ASSETS` dans l'application et le compare au catalogue source utilisé pour la vérification : aucun nombre d'atlas n'est figé dans le test. Chaque entrée doit être chargée, décodée aux dimensions déclarées et dessinable avec des pixels visibles. La sonde de dessin utilise un petit Canvas hors écran ; son rapport l'identifie comme un contrôle de rendu d'atlas, **pas comme une preuve que chaque PNJ, infecté ou décor apparaît naturellement en partie**. La galerie et les scénarios de contenu complètent cette distinction. Les rapports conservent les identifiants exacts des atlas testés.

## Frontières de sécurité

- Sandbox global et par renderer, `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, aucun webview.
- Protocole local limité aux fichiers publics, contrôle du chemin réel pour refuser les liens sortant du dossier, méthodes GET/HEAD uniquement.
- CSP locale sans `unsafe-eval`, sans script inline, sans frames, sans workers ni services distants. Les styles inline restent autorisés pour les indicateurs dynamiques du jeu.
- Permissions, navigation et nouvelles fenêtres refusées, requêtes HTTP/HTTPS/WebSocket/file externes bloquées. Seuls les exports locaux `deadwall*.json`, MIME JSON, de 8 Mio maximum et issus d'un blob du jeu sont autorisés via le dialogue natif de sauvegarde ; aucun téléchargement distant n'est autorisé.
- Bridge minimal : `window.deadwallDesktop.isDesktop`, `platform`, `toggleFullscreen()` et `quit()` ; chaque appel IPC vérifie la fenêtre et la frame d'origine. Aucune API de fichiers ou IPC générique n'est exposée.
- Distribution ASAR avec vérification d'intégrité embarquée ; fuses RunAsNode, variables Node, arguments d'inspection Node et privilèges supplémentaires file désactivés. Les outils de développement sont désactivés dans le paquet joueur.

La fabrication suit la [distribution Electron](https://www.electronjs.org/docs/latest/tutorial/distribution-overview), ses recommandations de [sécurité](https://www.electronjs.org/docs/latest/tutorial/security), de [sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox) et d'[isolation des contextes](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

## Limites de distribution commerciale

Le livrable local est **non signé**. Aucun certificat éditeur, installateur signé, compte de boutique, licence de boutique, Steamworks, mise à jour automatique ni publication d'archive externe n'est inventé. Windows SmartScreen peut avertir sur un exécutable téléchargé non signé. Une identité d'éditeur avec certificat, une matrice matérielle étendue, des essais longue durée et les vérifications de boutique restent des étapes de mise sur le marché. Ne pas désactiver les protections Windows pour prétendre avoir validé ces étapes.

Le ZIP est une distribution portable du programme ; son profil reste volontairement dans AppData afin de survivre aux mises à jour. Le shell n'ajoute ni télémétrie, ni service payant, ni dépendance réseau au gameplay.

Le build web reste indépendant des outils PC : il est vérifié dans un dossier sans `node_modules`, et Vercel n'exécute aucune installation npm pour construire `dist`. Les exclusions `.vercelignore` concernent l'envoi CLI ; elles ne remplacent pas la sélection des fichiers publics ni les contrôles HTTP.
