# DEADWALL — audit technique, contenu, cohérence et narration

Date : 31 août 2026. Point de départ inspecté : `14b4c520b185d2b1902dde0a445818832a531e7f`.

Cette passe applique des corrections dans le vrai moteur, pas seulement des recommandations. Le code, les simulations et les parcours navigateur actuels ont été contrôlés. Ce document décrit la validation locale avant publication ; le manifeste Windows et le rapport de livraison séparé identifient ensuite l’archive, le commit et le déploiement effectivement vérifiés.

## Défauts reproduits et corrigés

| Priorité | Défaut constaté | Résultat appliqué |
| --- | --- | --- |
| P1 | Récolte, dépôt ou chantier manuel possibles à travers un mur proche. | Recherche de la cible proche réellement accessible ; une cible cachée n’empêche pas de choisir une cible accessible. |
| P1 | Une balle à 970 unités/s peut sauter un infecté entre deux images de 40 ms. | Collision balayée, premier impact sélectionné et portée respectée. La convention de tirs au-dessus des remparts reste conservée. |
| P1 | La crosse pousse une cible dans un mur ; mêlée de fusilier possible à travers un angle. | Contrôle de ligne et recul à petits pas arrêtés par les obstacles. |
| P1 | Une clinique soigne de l’autre côté d’un rempart. | Soins réservés aux blessés vivants accessibles. Cadences historiques et alimentation requise conservées. |
| P1 | La crise renvoie au commandement, mais ses décisions y sont bloquées. | Choix réels dans ENCEINTE, pause tactique autorisée, autres modales interdites, minuterie suspendue. |
| P1 | Un clic Nouvelle partie remplace immédiatement la campagne active. | Confirmation annulable depuis le menu ; aucun changement du monde, des stocks ou de la sauvegarde en cas d’annulation. |
| P1 | Un import valide à la borne d’insight devient non exportable après un nouveau gain. | Borne partagée, gain narratif refusé avant débit s’il dépasse cette borne ; gain de vague plafonné. |
| P1 | La tolérance flottante de paiement peut laisser un stock légèrement négatif en pause. | Résidu ramené à zéro après achat validé. Un manque réel reste refusé, sans paiement partiel. |
| P2 | À la première ouverture du poste, des boutons restent désactivés avant synchronisation du focus. | Rafraîchissement après activation de la vraie modale. Focus restitué après lecture ou décision. |
| P2 | Après une décision du journal, Tab quitte la modale : Chromium conserve des rectangles pour les boutons des dossiers fermés. | Le piège de focus exclut explicitement le contenu des `details` fermés, sauf leur premier résumé. Régression Node et parcours Chromium sur six formats réussis. |
| P2 | Des descriptions promettent abri automatique, entretien d’armes ou guérison implicite des mordus. | Textes alignés sur les systèmes présents, sans inventer de sauvetage, contagion simulée ou guérison. |
| P2 | Empreinte du package de staging sensible à la suppression de `private` et au LF ajouté par Packager ; provenance Git défaillante assimilable à un état propre. | Métadonnées stabilisées octet par octet, contrôle des fichiers ASAR réels avant ZIP et provenance Git exigée. |
| P2 | Envoi Vercel incluant documentation, preuves QA et outils inutiles au runtime. | Exclusions ciblées ; build sans installation de dépendances vérifié dans un répertoire temporaire. La liste publique demeure explicite. |

Les cas physiques et leurs conventions sont détaillés dans [PHYSICAL_INTERACTIONS.md](PHYSICAL_INTERACTIONS.md). Aucun résultat de test synthétique n’est présenté comme un nombre d’images/seconde garanti.

## Passe contenu et histoire

- Six opérations facultatives rattachées aux thèmes des secteurs, sans déplacer les anciens gisements.
- Six fragments écrits originaux, douze orientations proposées, une décision définitive par secteur.
- Relevé physique par maintien E / ACTION pendant huit secondes actives ; progression partielle sauvegardée.
- Retour près du dépôt nécessaire pour engager le coût et l’effet. Le partage exige au moins un autre survivant vivant.
- Quatre chapitres mémorisés et un épilogue humain qui n’arrête jamais les hordes.
- Journal volontaire en pause tactique, dossiers repliables, refus et gains plafonnés explicitement affichés.
- Aucune récompense de simple visite, de lecture ou de chargement. Aucun personnage historique supposé encore vivant.

Les dix atlas originaux déjà présents sont conservés. Cette passe ajoute du récit et des fonctions jouables, pas de nouveaux bitmaps ni de doublage. Règles, coûts et canon : [NARRATIVE.md](NARRATIVE.md).

## Passe cohérence

L’architecture, l’équilibrage, le design et la feuille de route sont rapprochés du moteur livré : huit profils ennemis, 720 infectés simultanés, 900 cadavres, six doctrines, quatre métiers, industrie et énergie prioritaires, navigation bornée. Le brief initial est conservé.

Le jeu reste un moteur 2D/2.5D distribué en application Windows Electron, PWA et fichier autonome. Une éventuelle 3D, des véhicules pilotables, un multijoueur, une simulation complète de contagion ou une campagne cinématique ne sont pas présentés comme livrés. Le récit ajouté reste facultatif et intégré à la survie infinie.

Une seule campagne active est conservée par profil. Le menu explique le remplacement confirmé, les copies JSON et l’effacement de la campagne active à la destruction du centre. Les records et fichiers exportés restent indépendants.

## Vérifications réellement exécutées

| Contrôle de cette passe | Résultat |
| --- | --- |
| État initial, `npm test` | 169 réussis, 1 endurance optionnelle ignorée. |
| État corrigé, `DEADWALL_SOAK=1 npm run check` | **228 réussis, 0 échec, 0 ignoré** ; syntaxe, build et endurance inclus. |
| Build | 34 fichiers publics ; standalone avec modules, styles et images embarqués. |
| HTTP local réel | 34 réponses 200 avec SHA-256 identiques au build, 11 chemins sensibles 404, POST 405 et HEAD sans corps : 47 contrôles. |
| `npm audit --audit-level=high` | 0 vulnérabilité déclarée ; ne certifie pas l’absence de défaut dans tout le runtime. |
| Application Windows locale, deux processus réels | Réussite : dix atlas, journal, relevé partiel, décision, coûts, lecture, export/import et redémarrage persistants. Console : 0 erreur. |
| PWA | r9 effectivement contrôlé, puis reprise hors ligne avec récit, décisions et atlas sur les six formats. |
| Navigateur desktop/mobile | **764 contrôles réussis** : 175 commandement, 288 contenu, 84 UX, 217 récit. Zéro erreur console/runtime dans ces suites. Six formats, de 320 × 640 à 1440 × 900. |
| Parcours visuel complémentaire | Menu, commandes tactiles, récolte/dépôt/construction, recrutement, pause, sauvegarde, reprise et PWA : six formats réussis. Positions et démarrages de phases préparés explicitement. |
| Fichier HTML autonome | Démarrage, dix atlas décodés, pause et zéro requête HTTP externe dans Chromium depuis `file://`. |
| ZIP distribué / production | Contrôles après commit consignés dans le manifeste Windows et le rapport de livraison ; ils ne sont pas déduits des tests locaux. |

Preuves locales :

- `artifacts/http-qa/` : rapports horodatés HTTP dans le dépôt.
- `artifacts/desktop-narrative-audit/run-MxwGcK/summary.json` dans le workspace parent.
- `artifacts/command-qa/story-final-local-20260831/report.json` et `artifacts/content-qa/story-final-local-20260831/report.json`.
- `artifacts/ux-qa/report.json`.
- `artifacts/narrative-qa/narrative-focusfixed-20260831/report.json` ; le runner demande explicitement l’accord de navigateur alternatif.
- `outputs/story-resume-local-visual-qa.json` et `outputs/story-final-local-package-qa.json` dans le workspace parent.

Les essais natifs déplacent explicitement le commandant dans leurs fixtures : ils valident de vrais contrôles et transactions, pas un voyage naturel entre les six secteurs. Le programme exécuté est Electron depuis le checkout, pas une nouvelle archive extraite.

## Passe visuelle et accessibilité ciblée

La connexion au navigateur intégré a échoué avant toute capture, sur les permissions Windows du runtime. Après demande d’accord et reprise de l’utilisateur, les parcours ont été exécutés avec le Chromium local de test. Les anciennes captures ne sont pas réutilisées comme preuve du nouveau journal.

1. **Menu — contrôlé.** Identité olive/or conservée, nouvelle partie prioritaire, campagne unique et export expliqués. Un espacement supplémentaire sépare l’avertissement de sauvegarde du choix de difficulté. Menu défilable sur les petits écrans.
2. **Jeu et relevé — contrôlés.** Les actions restent sur le terrain ; le journal n’ouvre pas automatiquement une longue séquence de texte. Le maintien E est réellement exercé pendant huit secondes après préparation de la position.
3. **Journal et décision — corrigés puis recontrôlés.** Six dossiers repliables, coût et refus visibles, récompense unique et conséquence consignée. Le défaut de Tab a été reproduit et corrigé ; les résumés restent accessibles au clavier.
4. **Crise et reprise — contrôlées.** Arbitrage accessible en pause tactique, minuterie figée, décision sauvegardée. Les mêmes données et le journal se rechargent hors ligne.

Les captures montrent une interface sans débordement horizontal dans les formats exercés. Elles ne prouvent pas à elles seules la compréhension du récit, le confort sur téléphone physique, la compatibilité lecteur d’écran ou la qualité d’une longue session. Une partie des contrôles prépare positions, stocks, crises et progression ; ce n’est pas une campagne jouée naturellement du début à la fin.

## Ce qui reste avant mise en vente

Au-delà des vérifications techniques, une sortie commerciale nécessite encore des sessions humaines longues, une matrice matérielle, une revue accessibilité, le canal de vente et ses conditions, les classifications pertinentes et une décision de signature/distribution Windows. Le paquet reste non signé ; aucune protection Windows ne doit être désactivée. Voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
