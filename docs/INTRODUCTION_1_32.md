# Arrivée à D-17 — 1.32

Chaque **nouvelle campagne valide** ouvre automatiquement quatre tableaux illustrés, avant la première seconde de simulation : la route, le dépôt municipal, la relève et les premiers gestes. Les deux premiers tableaux nomment les infectés, la menace sur les routes et les accès à défendre pendant la nuit, sans supposer un état universel des enceintes. Le dernier tableau reprend le départ réellement choisi : classique, convoi de civils, dépôt à reconstruire ou arrière-garde. Les trois illustrations sont originales et leur provenance figure dans le dossier d’assets de la version.

L’introduction est une séquence de tableaux avec léger mouvement d’image, textes et navigation manuelle. Ce n’est ni une vidéo précalculée, ni une scène 3D, ni un dialogue doublé. Le temps de lecture appartient au joueur : aucune avance automatique, aucun décompte de nuit caché.

- **Continuer** / **Précédent**, ou flèches droite / gauche : changer de tableau.
- **Prendre mon quart** : entrer dans le terrain après le quatrième tableau.
- **Passer l’introduction**, ou Échap : aller au terrain en conservant le suivi des premiers gestes.
- Tab et Maj + Tab restent dans le dialogue. Les boutons fonctionnent avec Entrée ou Espace et au toucher.
- La préférence de mouvement réduit désactive le mouvement d’image. Le texte reste disponible dans toutes les configurations.

## Raccordement au jeu

`src/campaign-intro132.js` est installé après les chroniques, le commandement et l’inventaire. `campaign-intro132.css` suit les feuilles d’interface précédentes. Les assets requis sont `intro-road132.webp`, `intro-bastion132.webp` et `command-room132.webp` dans `assets/`.

Après `startNew` réussi, le module active le **prologue existant** des chroniques avant de mettre le récit à l’écran. Il ne distribue aucune ressource et n’accomplit aucun objectif. La carte d’objectif suit alors les actions réelles : récolte personnelle, dépôt personnel puis achèvement d’un nouveau chantier financé. Les constantes restent dans `Chronicles131Rules` de `src/core.js`. Les objectifs historiques continuent d’exister et réapparaissent lorsque les trois gestes sont terminés ou passés depuis les archives.

Pendant les tableaux, `paused` reste vrai, `update` n’avance pas, les commandes de simulation sont refusées et les entrées tenues sont libérées. Le reste de la page est inerte et le focus est contenu dans le dialogue. Ouvrir les paramètres, l’aide, l’inventaire ou le commandement par une entrée ordinaire ne permet pas de lancer des actions derrière le récit. Une perte de focus conserve une pause volontaire à la fermeture : le joueur doit reprendre explicitement.

Une nouvelle campagne demandée pendant la séquence valide d’abord sa graine et son scénario. Si ces paramètres sont invalides, l’introduction et la campagne courantes restent intactes. S’ils sont valides, l’ancienne séquence est nettoyée avant la génération suivante, afin que la migration du monde garde ses permissions normales.

## Sauvegarde et relecture

Le prologue est déjà enregistré par `expansions127.modules.lore131`. Aucun nouveau champ de sauvegarde n’est ajouté. Charger une campagne reprend le terrain et les gestes en cours, sans rejouer automatiquement les tableaux ; une sauvegarde refusée conserve l’introduction courante. Quitter le récit vers le menu respecte le résultat de la sauvegarde existante.

`game.campaignIntro132.replay()` permet de revoir les quatre tableaux depuis le menu, la pause ou le commandement, sans modifier ni le monde, ni le prologue, ni les stocks. La relecture rend ensuite son état de pause et son focus à l’écran précédent. API de présentation : `isOpen()`, `view()`, `next()`, `previous()`, `skip()`, `refresh()` et `element`.

## Vérification ciblée

`tests/campaign-intro132.test.cjs` couvre les quatre tableaux automatiques, conservation de l’état et du temps, touches tenues, commandes refusées, focus et clavier, mouvement réduit, perte de focus, relecture et progression récolte → dépôt → chantier via les actions du moteur. Le test de construction libère physiquement le passage avant l’achèvement, comme le jeu l’exige.

Les tests indépendants de `tests/qa132-onboarding.test.cjs` complètent ce contrôle avec les départs et difficultés, les remplacements de campagne, les sauvegardes et les interfaces voisines. Les tests DOM automatisés n’affirment pas un contrôle visuel par navigateur ; ce contrôle appartient à la passe d’intégration de la version.
