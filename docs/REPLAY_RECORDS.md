# Cartes partageables et records locaux

`src/profile.js` est un module UMD pur, exposé sous `DeadwallProfile` dans le jeu et via `require()` pour les tests Node. Il ne dépend ni du moteur, ni du DOM, ni d'un serveur. Le stockage lui est fourni explicitement. Il ne donne aucun bonus, ressource, avantage de progression ou multiplicateur de difficulté et n'envoie aucune télémétrie.

## Carte partageable

```js
const seed = DeadwallProfile.normalizeSeed(inputText);
// null : entrée vide ; le moteur choisit alors sa graine aléatoire.
// entier de 0 à 4294967295 : toute graine uint32, anciennes sauvegardes incluses.
// RangeError : valeur refusée ; ne pas lancer ni remplacer une partie.
```

Les espaces extérieurs et les zéros initiaux sont normalisés. Les exposants, nombres hexadécimaux, signes, fractions, séparateurs de milliers et valeurs hors plage sont refusés. Le module ne tire jamais de graine et ne réinitialise jamais la simulation lui-même.

Partager une graine signifie retrouver la **même génération de carte** dans la même version du jeu. Cela ne promet pas un défi compétitif entièrement déterministe : commandes, temps de simulation, choix du joueur, difficulté, événements et modifications futures du générateur peuvent changer la partie. Il n'existe ni classement distant ni mécanisme anti-triche. Les fichiers et records locaux restent sous le contrôle du joueur.

Les anciennes sauvegardes acceptées par le moteur peuvent contenir une graine uint32 hors de la plage du nouveau champ de saisie. Le profil conserve cette graine historique sans la convertir silencieusement en une autre carte.

## API d'intégration

```js
let storage = null;
try { storage = globalThis.localStorage; } catch { /* Le jeu reste jouable. */ }
const records = DeadwallProfile.create(storage);
const loaded = records.load();

const result = records.record({
  runId: game.runId,
  seed: game.world.seed,
  difficulty: game.difficulty.id,
  wavesSurvived: game.stats.wavesSurvived,
  kills: game.stats.kills,
  playSeconds: game.stats.playSeconds,
  population: populationPeak,
  buildings: buildingPeak,
  ended: game.gameOver
});

const view = records.get(); // Copie indépendante, sans nouvel accès au stockage.
const retry = records.save(); // Réessayer une écriture après un quota ou refus temporaire.
```

`create(storage)` n'accède pas au stockage pendant sa construction. `load()` est explicite ; le premier `record()` ou `save()` charge automatiquement le profil si nécessaire. Le stockage respecte `getItem(key)` retournant une chaîne ou `null`, et `setItem(key, text)` levant une erreur en cas d'échec. L'option facultative `{ now: () => timestamp }` sert aux tests reproductibles des dates, pas au gameplay.

`load()`, `record()` et `save()` renvoient tous :

```js
{
  profile,             // Copie du profil en mémoire.
  persisted,           // Données disponibles dans une copie valide, ou écriture primaire réussie.
  source,              // 'empty', 'primary', 'backup' ou 'memory'.
  changed,             // Un record() a effectivement fait évoluer l'historique.
  error                // null ou { code, message }, jamais une exception de stockage.
}
```

Une entrée invalide est refusée sans mutation. Une entrée valide conserve ses nouveaux records en mémoire même si le stockage refuse l'écriture. L'interface doit distinguer cette situation d'une persistance réussie et peut proposer de réessayer. Le profil ne bloque pas une sauvegarde de partie : les deux opérations ont des finalités et des clés distinctes.

Les codes possibles sont `invalid-snapshot`, `identity-conflict`, `storage-unavailable`, `storage-write-failed`, `profile-corrupt` et `profile-recovered`. Ce dernier signale qu'une copie valide a permis de récupérer le profil, avant réparation éventuelle de la copie illisible.

## Structure persistante

- `version: 1` et `updatedAt`.
- `byDifficulty.story`, `.standard`, `.brutal` contiennent chacun `wavesSurvived`, `kills`, `playSeconds`, `peakPopulation`, `peakBuildings`.
- `recentRuns` conserve au maximum dix entrées uniques : identité, graine, difficulté, les cinq métriques, `ended`, `startedAt`, `updatedAt`.
- `summary` compte uniquement les entrées conservées : `retainedRuns`, `completedRuns`, `inProgressRuns`.

Les records de difficulté sont des maxima de parties individuelles, pas une somme de kills ou de durée de plusieurs campagnes. La meilleure vague est le nombre de **vagues réellement repoussées** : il faut transmettre `stats.wavesSurvived`, jamais le numéro de la vague actuellement attaquante.

Une même `runId` fait une mise à jour, pas une nouvelle ligne. Les métriques et les pics ne diminuent pas lors du chargement d'une sauvegarde plus ancienne ; une entrée déjà marquée terminée ne redevient pas « en cours » tant qu'elle figure dans l'historique conservé. Réutiliser son identifiant avec une autre graine ou difficulté est refusé.

Le moteur doit créer une identité unique au début d'une nouvelle campagne et la conserver dans ses sauvegardes. Si l'identité manque dans un ancien fichier, le module utilise `legacy:<difficulty>:<seed>`. Ce secours fusionne volontairement d'anciennes parties de même carte/difficulté plutôt que d'inventer une nouvelle partie à chaque chargement. Il ne remplace pas les identifiants uniques des nouvelles campagnes.

Après éviction d'une entrée ancienne, ses records maxima restent conservés. Réimporter cette ancienne partie peut la replacer dans les dix entrées récentes, mais ne crée jamais un compteur « parties à vie » fictif. Aucun tel compteur n'est stocké. Les résumés concernent explicitement l'historique affiché, pas toutes les campagnes jamais jouées.

## Où prendre les pics

Le module ne peut connaître que les instantanés qui lui sont transmis. Le moteur doit suivre les pics de population et de structures en mémoire lorsqu'ils évoluent et fournir ces pics dans `population` / `buildings`. Se limiter aux effectifs présents au moment de la défaite manquerait les habitants ou bâtiments perdus pendant l'assaut.

Les écritures peuvent rester calées sur les sauvegardes existantes, les vagues repoussées et la fin de partie. Il n'est pas nécessaire d'écrire dans `localStorage` à chaque frame pour suivre un pic : cette mesure reste dans la simulation, puis le snapshot la transmet. Le module ne change pas la cadence du jeu.

## Protection du stockage

Le module utilise uniquement :

- `deadwall-profile-v1` : profil principal, limité à 64 K caractères JSON.
- `deadwall-profile-v1-backup` : copie valide précédente.
- `deadwall-profile-v1-recovery` : conservation des octets illisibles avant une réparation depuis une autre copie valide, au maximum quatre entrées et 256 K caractères JSON.

Il charge et fusionne les copies valides, sans écriture pendant `load()`. Avant de remplacer un primaire valide, il conserve ses octets exacts en backup. Exception prudente : si le backup contient aussi un historique absent de ce primaire, il persiste d'abord la fusion des deux copies ; un primaire ancien ne peut donc pas effacer ces records en cas de quota. Si cette écriture échoue, il ne remplace pas le primaire. Si le primaire échoue ensuite, les données précédemment conservées restent récupérables. Les nouveaux records de la session restent en mémoire pour `save()`.

Une copie corrompue n'écrase jamais la copie saine. Elle est conservée dans la clé de récupération avant réparation. Si cette conservation échoue, si son archive est déjà illisible/pleine, ou si aucune copie valide n'existe, les données illisibles restent en place et aucune réinitialisation silencieuse n'a lieu. Il n'existe aucune commande de suppression automatique de cet historique.

Chaque écriture relit les données disponibles pour fusionner les mises à jour séquentielles de plusieurs contrôleurs. `localStorage` n'offre pas de transaction inter-onglets : cela ne constitue pas une garantie de résolution de deux écritures strictement simultanées. L'application Windows reste à instance unique en usage normal.

Le profil Windows et chaque profil de navigateur sont isolés. Le module ne recherche aucun autre dossier AppData, profil Chrome, compte, installation ou jeu. Importer une sauvegarde de partie peut enrichir les records du profil qui la reçoit ; cela ne synchronise pas des historiques entre appareils.

## Vérification

```powershell
node --test tests/profile.test.cjs
npm run check
```

Les tests couvrent les bornes des graines, les sauvegardes répétées, les trois difficultés, les pics, la terminaison monotone, les identités anciennes/nouvelles, l'historique borné, la validation stricte, les copies corrompues, les quotas sur chaque étape, la conservation en mémoire, la fusion séquentielle et l'évaluation UMD sans dépendance ni stockage implicite.

### Endurance logique facultative

```powershell
$env:DEADWALL_SOAK = '1'
node --test tests/soak.test.cjs
Remove-Item Env:\DEADWALL_SOAK
```

Ce test est ignoré par défaut dans la suite rapide et exécuté explicitement par la CI GitHub. Il simule deux sessions de quinze minutes au pas de 40 ms : carte `17117` en Survivant, puis carte `903145` en Standard avec enceinte. Il exerce les ordres de nettoyage/repli/récolte, l'invalidation des chemins par les portes, les stocks et la simulation réelle, avec 32 checkpoints écrits puis rechargés. Une sonde séparée de vague 1000 atteint le plafond de 720 infectés et vérifie la conservation des arrivées en attente, y compris après sauvegarde/reprise. Les durées et maxima effectivement observés sont imprimés en diagnostic JSON.

Les constructions initiales sont posées par le test et un assistant synthétique élimine les ennemis approchants afin d'atteindre la durée prévue. Il ne s'agit donc **ni d'une preuve d'équilibrage**, ni d'une partie gagnée normalement, ni d'un benchmark graphique/FPS : le navigateur et le Canvas sont simulés. Ce test n'accède pas aux sauvegardes ou records d'un joueur réel.
