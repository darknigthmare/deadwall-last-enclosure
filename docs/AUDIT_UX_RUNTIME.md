# Audit UX/runtime — passe commerciale DEADWALL

Périmètre : chargement, sauvegardes portables, commandes PC/tactiles, accessibilité, audio et simulation prolongée. Les mesures ci-dessous proviennent du code et de tests Node ; elles ne constituent pas une mesure du rendu navigateur ou du nombre d’images par seconde.

## Défauts reproduits puis traités

1. **P0 — restauration destructive et secours ignoré.** Une sauvegarde JSON v2 avec `buildings: []` faisait disparaître le monde actif avant de lever « Centre absent », sans essayer le backup pourtant valide. Le nouveau module `src/save.js` valide toute la structure. `restoreSave()` construit le monde et la navigation avant de remplacer l’état actif ; `load()` essaie chaque copie indépendamment.
2. **P0 — copie de secours perdue sur échec d’écriture.** Un primaire corrompu remplaçait le bon backup avant une écriture primaire pouvant échouer faute de quota. Le primaire est maintenant écrit en premier ; seul un ancien primaire validé devient copie de secours. Un échec conserve les données existantes et produit un état de sauvegarde explicite.
3. **P1 — joueur à terre restauré vivant avec zéro santé.** L’état de réanimation, l’endurance et les délais de combat ne survivaient pas au chargement. Ils sont conservés ; une ancienne sauvegarde à zéro santé reprend une réanimation, avec sa pénalité de portage. Les récolteurs retrouvent une cible valide et leur récolte partielle ; une cible obsolète provoque un retour sûr.
4. **P1 — commandes tactiles incomplètes.** Le Canvas n’écoutait que la souris : un glisser tactile ne suivait pas réellement une ligne de murs. Les gestes pointer sont maintenant capturés et annulables. Le volet Actions expose rechargement manuel, arme suivante, crosse, sprint maintenu, zoom, rotation et annulation. Un toucher sélectionne une structure ; FEU conserve l’auto-visée.
5. **P1 — audio bloquant et reprise manquante.** Une exception de création du périphérique audio empêchait la nouvelle partie ; un contexte suspendu n’était jamais repris. L’audio est désormais facultatif et reprend sur geste utilisateur. Le mute évite les allocations audio ; les échantillons procéduraux sont réutilisés et les voix simultanées sont bornées.

## Surface livrée

- Paramètres depuis le menu, la pause et le commandement : volume, mute, contraste, mouvement réduit, résolution légère, plein écran.
- Export JSON local et import vérifié avec résumé, annulation et confirmation explicite. Un fichier invalide ne remplace ni monde actif ni sauvegarde locale. La partie active doit être sauvegardée avant remplacement ; en cas de stockage indisponible, l’utilisateur est invité à exporter d’abord.
- Commandes de la version PC par le bridge `deadwallDesktop` lorsqu’il est présent ; navigateur conservé en fallback.
- Navigation clavier native, focus des modales, régions masquées inertes, libération des touches à la perte de focus.
- Validation des types de catalogue, coordonnées, identifiants uniques, intégrité, chargeurs et files de migration ; import limité à 8 Mo.

## Performance mesurée avant compression stratégique

Une simulation Node de 720 infectés, sans rendu ni audio réels, sur 300 pas à 1/60 s a donné une moyenne de 0,70 ms par pas et un percentile 95 de 1,51 ms dans cette session. Ce chiffre ne prédit pas les performances graphiques d’un appareil.

L’ancienne file sauvegardait une chaîne par infecté : la formule Brutal/signature 1000 produisait environ 4,0 Mo de chaînes à la vague 1000 et 53,3 Mo à la vague 5000. Le système stratégique parallèle remplace ce volume par des compteurs et un petit tampon. Le chargement et les tests de reprise conservent exactement les effectifs en attente.

## Vérifications automatisées ajoutées

- `tests/recovery.test.cjs` : corruption structurelle, secours, quota, réanimation, import invalide, audio, geste tactile, stockage désactivé.
- `tests/options.test.cjs` : ouverture/fermeture des réglages, préférences persistantes, prévisualisation d’import non mutante, annulation puis confirmation.
- `tests/runtime.test.cjs` : focus clavier, responsive, perte de focus, mouvement réduit, indicateur de menace sous les panneaux.
- `tests/strategic.test.cjs` : reprise d’une horde compressée, délai de crise et récolte partielle.

## Vérification navigateur des nouvelles surfaces

Le 31 août 2026, `node tests/browser-ux.mjs` a passé 75 assertions dans quatre contextes Chromium isolés : PC 1440×900, mobile 390×844, petit mobile 320×640 et paysage tactile 844×390. Aucune erreur console ni exception de page n’a été relevée. Le parcours couvre focus contenu, réglages persistants, pause réelle, téléchargement JSON, import invalide, aperçu non mutant, annulation puis confirmation, glisser tactile construisant plusieurs murs, annulation, zoom, rechargement, indication d’interaction sans chevauchement du volet Actions et choix de crise accessible par défilement.

Les fixtures sont explicites : nouvelle partie locale isolée, export réimporté avec vague 3, chargeur réduit pour tester le rechargement, crise et réserves déterministes pour tester les choix. Aucun serveur de production ni sauvegarde utilisateur n’a été modifié. Ce test bloque le service worker pour isoler les surfaces UX ; il ne remplace pas la vérification PWA/offline de publication.

Le contrôle visuel a confirmé puis corrigé un débordement interne des champs à 320 px et des chevauchements du volet Actions avec le portage et le texte d’interaction. Captures, exports téléchargés et rapport JSON sont conservés localement sous `artifacts/ux-qa/` (ignoré par Git). Le script nécessite une installation Playwright/Chromium et est reproductible avec `DEADWALL_QA_URL`, `DEADWALL_PLAYWRIGHT_MODULE` et `DEADWALL_CHROMIUM` pour adapter le serveur et les chemins. Aucun chemin personnel de cette machine n’est imposé.

## Contrat de publication

Charger `src/save.js` après `src/core.js` et avant `src/game.js`, puis `src/ui.js` après l’initialisation du jeu. Inclure `settings.css`, les deux nouveaux scripts et leurs contenus intégrés dans le standalone, le cache PWA, le serveur public et le paquet PC. Les vérifications navigateur locales ci-dessus portent sur ces nouvelles surfaces ; le packaging PC, la PWA et la production restent des portes de validation distinctes à la charge du responsable de la publication.
