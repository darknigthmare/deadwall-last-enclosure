# 1.57.1 — Nouvelle partie sur le monde courant

## Diagnostic

Base examinée : [`68e91f294b71eef32b27497dca05d2028db3f902`](https://github.com/darknigthmare/deadwall-last-enclosure/commit/68e91f294b71eef32b27497dca05d2028db3f902), dernier commit de `main` au début de cette correction.

Deux problèmes distincts expliquent l’ancienne carte.

### Le code démarrait encore en G7

Dans `src/world-pack131.js`, l’enveloppe de `startNew()` sélectionnait explicitement `7` lorsque la géographie actuelle était disponible. Le catalogue G8 était bien compilé et chargé, mais ses nouveaux lieux n’étaient générés qu’après l’action d’extension au dépôt de D-17. L’installation des modules et le chargement du Codex ne suffisaient donc pas à les activer dans une nouvelle campagne.

Reproduction avec les scripts réels de `index.html`, dans leur ordre de chargement, et le clic du bouton Nouvelle partie sur un stockage vide :

| Graine 17117 | Avant le correctif | Après le correctif |
| --- | ---: | ---: |
| Génération enregistrée | G7 | G8 |
| Dimension régionale | 24 576 m de côté | 24 576 m de côté |
| Lieux régionaux générés | 1 267 | 2 550 |
| Nouveaux lieux `programme3000` | 0 | 1 283 |
| Sauvegarde initiale valide | Oui | Oui |

Ces nombres décrivent cette graine précise. Les 3 000 fiches du catalogue ne sont pas 3 000 bâtiments systématiquement placés : les règles de compatibilité, de terrain, d’accès et d’espacement restent appliquées. G8 conserve le réseau géographique existant et y ajoute les implantations éligibles.

Le test `tests/new-game-generation.test.cjs` a reproduit l’erreur avant modification : après le clic, l’assertion de génération attendue échouait avec `7 !== 8`.

### Le site public servait encore la 1.56.0

Inspection Vercel du 12 octobre 2026 : l’alias `deadwall-last-enclosure.vercel.app` pointe vers le déploiement production `dpl_AyNWR7wW6HP3FMi5rszHuJKXL6an`, état `READY`, issu du commit [`ae10a4583c604b0ad7536d6c92c08449b27f1743`](https://github.com/darknigthmare/deadwall-last-enclosure/commit/ae10a4583c604b0ad7536d6c92c08449b27f1743), version 1.56.0.

Le statut GitHub de `68e91f2` indique `Vercel: failure`, avec une destination signalant `build-rate-limit`. Le dernier `main` n’a donc pas remplacé cette production. Les aperçus des branches ne remplacent pas automatiquement l’alias public.

Référence du déploiement inspecté : [production Vercel](https://vercel.com/darknigthmares-projects/deadwall-last-enclosure/AyNWR7wW6HP3FMi5rszHuJKXL6an). Ce constat est daté ; le quota exact et sa date de réinitialisation n’ont pas été déterminés. Effacer les sauvegardes ou le cache du joueur ne corrige pas un serveur qui sert encore ce commit.

## Correction

- `startNew()` choisit G8 dès la création d’une nouvelle campagne avec la géographie actuelle. Les installations historiques partielles conservent leur branche G5.
- La position régionale initiale est calculée depuis la même graine et la génération choisie.
- `Continuer` et l’import utilisent toujours la génération de la sauvegarde. Les anciennes parties G7 restent G7, et leur extension manuelle au dépôt reste disponible avec ses protections existantes.
- Les versions du paquet, du menu, du panneau de diagnostic et du cache PWA passent à **1.57.1**. Le préchargement atomique de tous les fichiers et la conservation des sauvegardes restent en place.
- Les tests des nouveaux départs attendent désormais G8 et vérifient des lieux et plans réellement générés. Les tests historiques demandent explicitement leur ancienne génération, afin de conserver leur objet de validation.
- Le parcours mobile a également révélé que le libellé de torche débordait de sa touche de 44 px à D-17 en paysage. Les règles compactes de D-17 et de région utilisent une graisse normale et retirent le remplissage horizontal. Les libellés complets « ÉTEINTE » et « ALLUMÉE », la taille de texte de 9 px et la cible tactile de 44 px sont conservés.

Le format général de sauvegarde reste v20. La correction ne transforme pas les anciennes parties et ne modifie pas les générateurs historiques, les coûts ou les réserves déjà prélevées.

## Vérifications locales

La commande obligatoire `DEADWALL_SOAK=1 npm run check` a été exécutée deux fois. La syntaxe des **235 fichiers** et la construction des **278 fichiers publics** et du HTML autonome passent. La seconde passe de tests se termine avec **3 202 réussites sur 3 203, aucune annulation ni omission** ; les trois scénarios historiques ajustés après la première passe sont tous verts.

L’unique échec de cette seconde passe est un test d’horloge déjà présent, sans dépendance au monde G8. Il combinait `performance.now()` réel avec des temps synthétiques et exigeait l’égalité stricte de `0.01599999999999977` avec `0.016`. L’échec a été reproduit indépendamment avec une horloge fractionnaire contrôlée. La fixture fixe maintenant sa base à 2 040 ms, vérifie aussi cette base et le retour arrière, conserve les assertions strictes et restaure l’horloge dans `finally`. Le moteur de simulation est inchangé. Après cet ajustement, les **7 tests d’horloge passent**, aussi bien normalement qu’avec l’horloge fractionnaire qui reproduisait l’échec ; cette validation finale est ciblée sur le fichier concerné.

Les nouveaux tests exécutent le document dans l’ordre réel des scripts et les boutons du menu. Ils couvrent le premier enregistrement G8, les graines explicite et aléatoire, la reprise G8, une ancienne sauvegarde G7, l’annulation et la confirmation du remplacement. Un contenant physique est vidé par l’interaction E avant de redémarrer le document : son prélèvement et le butin restent identiques après Continuer.

Contrôles effectués avec Chromium 153.0.8010.0 :

| Parcours | Résultat |
| --- | --- |
| Navigateur, bureau 1 440 × 900 | 42 contrôles réussis |
| Navigateur, portable 1 280 × 720 | 42 contrôles réussis |
| Navigateur, mobile 390 × 844 | 47 contrôles réussis |
| Navigateur, mobile paysage 844 × 390 | 48 contrôles réussis après correction du libellé de torche |
| PWA hors ligne, bureau et mobile | 17 contrôles réussis par profil ; 278 fichiers en cache ; nouvelle G8 et reprise hors ligne |
| HTML autonome, ouvert réellement en `file://` | 9 contrôles réussis, dont les images embarquées, G8, sauvegarde v20 et export/import |
| Boucle de campagne, bureau | 49 contrôles réussis : récolte, dépôt, construction payée, ouvriers, recrutement, portes, sections, assaut naturel et reprise |

Le dernier passage navigateur a été effectué sur `dist` après sa reconstruction avec la présentation finale : les quatre formats et les deux profils PWA terminent avec le code de sortie 0, soit **213 contrôles réussis**. Les contrôles G8 vérifient aussi des programmes Codex réellement placés, leurs pièces, leurs ressources et leurs accès routiers, puis leur identité après sauvegarde et reprise. Les vues mobiles sont émulées ; les appareils physiques et le paquet natif Windows ne font pas partie de cette vérification.

Commandes navigateur utilisées : `DEADWALL_QA_ROOT=dist npm run test:browser`, `npm run test:standalone` et `DEADWALL_QA_PROFILES=desktop npm run test:campaign`, avec `CHROMIUM_EXECUTABLE_PATH` pointant vers ce Chromium local. Un passage ciblé paysage a également utilisé `DEADWALL_QA_PROFILES=mobile-landscape npm run test:browser`. Les rapports détaillés restent dans `artifacts/qa/`, ignoré par Git.

## Vérification après publication

La fusion de la PR et un déploiement Vercel réussi sont nécessaires pour mettre cette correction sur l’alias public. Cette PR n’effectue ni fusion ni promotion en production.

Après publication, le menu doit afficher **1.57.1**, et `sw.js` doit annoncer le cache `deadwall-v1.57.1-new-campaign-g8`. Une page déjà ouverte doit être rechargée après l’installation de la mise à jour. Une nouvelle partie doit enregistrer `frontier.generation: 8` ; Continuer une ancienne partie doit conserver sa génération. Aucune suppression des données locales n’est nécessaire.
