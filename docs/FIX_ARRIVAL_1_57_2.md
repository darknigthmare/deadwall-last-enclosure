# 1.57.2 — Arrivée à D-17, pause et identité de campagne

Base examinée : `96c5de8f7f52321e0de0f620d16eb0b8942e3936`, fusion de la PR #3. Signalement : Nouvelle partie, menu Pause, puis Reprendre donnant l'impression d'une carte ancienne et vide.

## Ce qui était effectivement affiché

Le démarrage normal ouvre le prologue puis le terrain **local de D-17**. Le dépôt, les trois ouvriers du départ classique, les ressources et les quartiers locaux sont présents ; la cour centrale reste un espace à aménager. `frontier.active()` est faux à cet endroit. La région G8 existe déjà, mais son renderer prend la main lorsque le joueur quitte le domaine local. Reprendre appelle `togglePause(false)` et ne charge aucune autre carte.

Sur la graine 17117, le document complet produit quatre stations locales, sept jardins, trois groupes de bâtiments et 23 segments de routes. La région comporte 2 550 lieux, dont 1 283 implantations de programmes du Codex 3000. Ces nombres décrivent cette graine et des objets de natures différentes ; les 3 000 fiches ne sont pas 3 000 bâtiments garantis sur toute carte.

La PR #3 avait corrigé la sélection de la génération régionale. Elle ne reconstruisait pas l'aménagement de départ de D-17. Le dernier tableau du prologue explique maintenant où commence le joueur et comment rejoindre la région. Aucun quartier préconstruit, ressource ou avantage de progression n'est ajouté.

## Défauts corrigés

### Une seconde commande Reprendre après le prologue

Le wrapper de `suspendForFocusLoss` du prologue mémorisait toute perte de focus comme une pause volontaire. Même revenu dans la fenêtre, cliquer **Prendre mon quart** ou **Passer l'introduction** ouvrait donc ensuite le menu Pause.

Le prologue distingue maintenant ces deux intentions. Une action de fin de nouvelle introduction peut acquitter la seule perte de focus, si le document est visible et focalisé. Le retour au premier plan sans action, une fermeture par API, une pause explicitement demandée et une relecture du prologue restent conservateurs. Un document caché ou sans focus reste suspendu ; la perte de focus pendant le jeu garde sa protection normale.

Le parcours vierge sans perte de focus n'ouvrait pas spontanément Pause dans notre reproduction Chromium. Le parcours de perte de focus a été reproduit par un événement DOM `blur` explicitement déclaré ; le changement d'onglet en Chromium sans interface n'émettait pas une perte de focus native. La vérification ne prétend pas reproduire le système de fenêtres de chaque appareil.

### L'écologie G8 absente du rendu local

`Art.drawNode` réservait le choix d'espèce local à `generation === 7`. Une nouvelle partie G8 retombait alors sur les familles historiques. Exemple reproduit avec les atlas chargés : graine 17117, nœud 51 à `(715, 1380)`, bouleau et schiste attendus d'après les coordonnées régionales, mais chêne et calcaire dessinés en G8.

Le chemin actuel accepte désormais G7 et G8. Les clés de cache conservent monde, génération, identité, coordonnées, projection et fournisseur. Les quantités restent lues à chaque dessin. Les générations antérieures, les grumes et les replis en cas d'image absente gardent leurs chemins ; aucun stock, collider, tirage de simulation ou champ de sauvegarde n'est modifié.

### Deux entrées d'archives pour une seule nouvelle campagne

Le démarrage créait et sauvegardait un identifiant `run:…`. L'installation du terrain local ajoutait ensuite `:g4` au même identifiant et sauvegardait à nouveau. Le profil voyait deux campagnes distinctes. L'échec du contrôle Windows d'archives a permis de retrouver ce défaut du runtime.

L'identifiant créé au départ reste maintenant stable à travers les autosauvegardes successives. Les registres explicites de génération portent déjà la version du terrain. Les lecteurs du marqueur historique `:g4` restent disponibles pour les anciennes sauvegardes. Cette correction ne supprime ni ne fusionne automatiquement des archives déjà enregistrées.

## Vérifications complétées

`tests/new-game-generation.test.cjs` exécute tous les scripts dans l'ordre du HTML et vérifie les commandes du menu, le parcours de focus, les identités des deux mondes, l'historique et les sauvegardes. Le test isolé de récolte utilise l'ordre réel de repli des ouvriers : leurs dépôts autonomes ne peuvent plus être confondus avec une duplication du butin du joueur.

`scripts/browser-arrival158.mjs` contrôle les boutons réels sur ordinateur et mobile. Il observe les passes de sol et les structures du canvas affiché, ainsi que les atlas et rectangles réellement dessinés pour les arbres et rochers visibles. Les empreintes de géométrie et l'identité de campagne sont comparées après Pause/Reprendre, Continuer et remplacement confirmé. Ce parcours est disponible par `npm run test:arrival` et figure en CI.

Le test d'assaut avait un autre problème de scène préparée : le contact déplacé près du commandant pour montrer l'alerte centrale pouvait le tuer pendant l'attente de l'échelon suivant. Dans le [rapport CI précédent](https://github.com/darknigthmare/deadwall-last-enclosure/actions/runs/38289569460), l'émission restait à 15 contacts et la simulation était suspendue ; sa capture mobile montre bien l'écran de relève après la mort du commandant. Après les assertions de visibilité, la fixture restitue désormais les cinq positions d'arrivée qu'elle avait mémorisées, avant la mesure des échelons et de leur reprise. Aucun soin, stock, temps, tirage ni budget d'arrivées n'est modifié. La campagne conserve ses combats normaux.

Le contrôle desktop attendait encore les anciens libellés « contacts actifs » et un comptage omniscient, alors que l'interface décrit les contacts observés par les alliés. Il vérifie maintenant cette visibilité avec le contrôleur partagé et conserve son assertion stricte d'une archive par nouvelle campagne. Les erreurs renderer sont reportées immédiatement dans le journal du processus, avant qu'Electron ne renvoie son message générique. L'exécution Windows native reste une preuve distincte d'un rejeu de ses séquences JavaScript dans Chromium.

## Version et publication

Le paquet, le menu, le diagnostic et le cache PWA portent **1.57.2**. La politique atomique de précache et le format général v20 restent conservés.

Au diagnostic, Vercel indiquait la production `dpl_HqWTUZookUC3TiXoNRSKiSBbV2rC`, prête le 12 octobre 2026 à 20:03:07 UTC, sur le commit de base `96c5de8`. Ce changement était intervenu 35 secondes avant le message du joueur. Un onglet déjà ouvert pouvait encore exécuter le document précédent ; les métadonnées du déploiement ne prouvent pas la version active dans cet onglet. L'accès HTTP du navigateur de contrôle à l'alias public échouait ; la vérification du déploiement vient des métadonnées Vercel.

Le correctif est destiné à une nouvelle PR vers `main`. La création de la PR ne constitue pas une fusion ni une publication en production.

## Preuves ciblées du candidat

| Vérification | Résultat |
| --- | --- |
| Prologue, focus, pauses volontaires et relecture | 11 tests réussis |
| Identité, nouvelle partie et commandement | 13 tests réussis |
| Espèces locales, cache et pixels des atlas | 16 tests réussis ; la nouvelle couverture échouait avant correction |
| Contrôle desktop et ses diagnostics | 14 tests réussis |
| Reprise des buffers et scène d'assaut | 5 tests réussis |
| Nouveau parcours d'arrivée, ordinateur et mobile | 50 contrôles réussis, aucune erreur navigateur |
| Échelons d'assaut, trois formats | 72 contrôles réussis, aucune erreur navigateur |
| Séquences renderer desktop rejouées dans Chromium HTTP | 20 séquences réussies, aucune erreur ; distinct d'un test Windows natif |

Les tests du DOM complet emploient la graine 17117 et une seconde graine pour les changements de carte. Le parcours navigateur d'arrivée compare les dessins de 19 arbres/rochers sur ordinateur et trois sur mobile, ainsi que les passes du sol et des structures locales. Les nombres d'entrées de dessin ne sont pas présentés comme un nombre de bâtiments distincts.

Environnement de ces contrôles : Node 24 et Chromium 153.0.8010.0 sous Linux, avec mobile émulé. La vérification globale exigée est `DEADWALL_SOAK=1 npm run check`, complétée par les parcours navigateur/PWA, campagne et HTML autonome. Les résultats de l'exécution finale et des jobs GitHub Actions sont consignés dans la PR ; ils sont distincts des preuves ciblées ci-dessus. Les scripts écrivent leurs rapports dans `artifacts/qa/`, et la CI conserve ces rapports comme artefacts.
