# DEADWALL 1.54 — Terrain, combat et reprise

Cette version corrige des problèmes constatés dans les déplacements hostiles, la reprise de combat, les soins, l'information régionale et les contrôles tactiles. Elle conserve la boucle récolter → déposer → construire → automatiser → fortifier → survivre → réparer, les cartes G1–G7, les ressources finies et les onze âges de D17.

## Jouer et conserver sa campagne

Ouvrez https://deadwall-last-enclosure.vercel.app/, choisissez difficulté et graine, puis **Nouvelle partie**. Une graine reproduit la carte ; elle ne garantit pas une simulation compétitive parfaitement déterministe. Récoltez, revenez déposer et financez des chantiers visibles. Les ouvriers, services et défenses doivent être construits et ravitaillés pour devenir opérationnels.

La sauvegarde automatique reste locale au navigateur et à cette origine. **Continuer** reprend la dernière copie lisible. Dans **Paramètres**, utilisez **Sauvegarder maintenant** et **Exporter** pour conserver un fichier JSON avant un transfert d'appareil ou un import. L'import présente son aperçu et demande confirmation avant remplacement ; un stockage indisponible impose les protections de copie existantes. Le profil Windows et celui du navigateur sont distincts.

Pour jouer hors ligne en PWA, ouvrez d'abord le jeu connecté et laissez l'installation de ses ressources terminer. Revenez ensuite par la même origine ou la PWA installée. Le nouveau cache garde les fichiers déjà installés pendant une mise à jour incomplète ; la version suivante prend la relève après précache réussi. Une page ouverte conserve son code en mémoire jusqu'à sa prochaine ouverture. Les entrées manquantes peuvent demander le réseau ; une première visite interrompue ne prouve pas une installation hors ligne complète.

Pour développer localement, depuis le dossier du projet avec Node.js ≥22.12 :

```sh
npm ci
npm start
```

Le serveur annonce son adresse locale, normalement sur le port 4173. `PORT=4183 npm start` permet d'utiliser un autre port. `npm run build` prépare `dist/` et `DEADWALL_Standalone.html` ; les deux sorties sont générées. L'ouverture du HTML autonome et l'application PC disposent de contrôles distincts du site web.

## Corrections jouables

- **Temps de campagne :** les frames lentes intègrent leur durée active en sous-pas de 40 ms maximum, jusqu'à sept pas et 250 ms. Les interruptions plus longues sont abandonnées ; pauses, modales et changements de focus ne sont pas rattrapés. Une action ponctuelle reste livrée une seule fois.
- **Enceintes :** les infectés respectent leur rayon contre les angles et obstacles, y compris pendant la poussée de foule. Les Récents et Rampants conservent les rampes de cadavres existantes ; les accès et portes gardent leur rôle tactique.
- **Reprise de chasse :** le Traqueur conserve sa proie vivante et l'échéance du prochain examen. Les champs sont facultatifs pour les anciennes sauvegardes et validés avant remplacement. Les ralentissements, agitation et cris conservés par la 1.53.1 restent présents.
- **Exploration :** une bande sauvage n'annonce plus automatiquement son effectif et son lieu hors vision physique. Les travaux de récupération prennent aussi en compte les dépouilles régionales réanimées.
- **Survie :** un dommage réellement reçu interrompt immédiatement le pansement et les préparations, même si un soin arrive dans la même frame. Une attaque absorbée ou refusée par l'invulnérabilité ne supprime pas un soin valable.
- **Tactile et navigation :** le bouton de torche laisse son texte et son état visibles ; un raccourci de commandement ramène l'onglet actif dans la portion atteignable de la barre, en conservant le focus.
- **Sprites :** seize rectangles mesurés du Rampant et d'une variante Fusilier évitent doigts/canons coupés et fragments voisins. PNG originaux, provenance, pivot et échelle nominale sont conservés.
- **Préparation économique :** le catalogue annonce la consommation déjà appliquée du générateur de départ, 0,018 carburant/s, soit 1,08/min avant réduction par recherche. Aucun prélèvement supplémentaire n'est ajouté.
- **Relais co-op :** messages JSON invalides ignorés, départ annoncé à l'ancien salon et reconnexion protégée des événements tardifs. Le panneau affiche l'état réel sans effacer les champs. Cette préversion locale échange présences et repères ; inventaires, combats, constructions et sauvegardes restent locaux.

La sauvegarde générale reste **v20**, avec champs de chasse additifs. Coûts, statistiques, réserves initiales, cartes et conditions de progression sont conservés. Le détail technique est dans `docs/AUDIT_1_54.md` et `docs/PWA_COOP_1_54.md`.

## Onze âges, durée et taille de livraison

La croissance de D17 reste conditionnée par les constructions achevées et variées, la population, les services opérationnels, les reconnaissances, les sites récoltés et les hordes survécues. Les connaissances acquises restent mémorisées après une perte ; un bâtiment détruit n'apporte plus ses capacités. **Préparatifs → Catalogue des âges** expose déblocages, coûts, dépendances et conditions restantes.

La cible Standard est **6 à 10 heures jusqu'au onzième âge**, encore à confirmer par plusieurs campagnes humaines complètes. Un scénario du directeur, une partie préparée ou le respect des conditions d'âge ne chronomètrent pas une campagne réelle. Les choix d'anticipation des assauts, déplacements et pertes modifient la durée.

Les ressources web représentent environ **186 Mo**, et le HTML autonome environ **261 Mo bruts**, avant compression de distribution. Ces tailles importantes comprennent les images originales et leur intégration ; elles ne mesurent pas le téléchargement effectif d'une archive ni le coût d'une mise à jour déjà partiellement installée.

## Validation et limites

Après modification, le contrôle obligatoire est :

```sh
npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:campaign
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:standalone
```

`npm run test:browser` importe automatiquement le parcours PWA : **ne pas le relancer séparément sans changement ou problème précis**. Pour limiter le runner de campagne aux deux profils desktop/portrait, utilisez `DEADWALL_QA_PROFILES=desktop,mobile`. Les scènes avancées préparées, les entrées natives, l'émulation tactile et les contrôles de protocole gardent leurs scopes propres. Une modification de simulation peut justifier l'endurance facultative `DEADWALL_SOAK=1 node --test tests/soak.test.cjs`.

Les comptes, codes de sortie et empreintes finales seront consignés après exécution ; aucun résultat futur n'est anticipé ici. Un push n'atteste pas la publication : les octets HTTPS du commit attendu doivent être comparés au build final. Le précache seul n'authentifie pas la provenance de réponses HTTP 200 incorrectes fournies par un serveur.

Les mesures actuelles du candidat, à 1280×720 sur SwiftShader dans le cloud, donnent environ **7 à 10 FPS avec 720 infectés préparés**. C'est une limite restante ; l'intégration correcte du temps ne garantit pas une hausse de cadence. Les scènes calmes et les appareils physiques demandent leurs propres mesures. Cette passe ne certifie ni 60 FPS partout, ni Windows natif, ni tactile physique, ni audio, ni accessibilité complète, ni une publication en boutique. Le portable Windows doit être fabriqué puis testé sur Windows ; les parcours autonomes HTTP ne certifient pas `file://`.
