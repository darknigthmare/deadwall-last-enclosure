# Codex mondial — fondations métriques, 21 octobre 2026

> Rapport historique de la première étape métrique. Les compteurs, validations et états de publication ci-dessous décrivent cette étape du 21 octobre. L’état courant des inspections et du classeur est consigné dans [PUBLICATION.md](PUBLICATION.md) et [INSPECTION_PHYSIQUE_2026.md](INSPECTION_PHYSIQUE_2026.md).

## Périmètre
Cette passe d'**outillage auteur** part de DEADWALL 1.68, main `6c6fbb6cf563bea6c89ade99c65f18c438481532`, PR 16 avant modification `03e189b8435c20a05f4dc052336b1746d68d60b2`.
Elle ne change aucun fichier de `src`, aucun générateur de campagne, aucune sauvegarde, aucune collision du monde joué, aucun stock et aucune probabilité de rencontre. Un plan métrique n'est ni un lieu implanté ni une architecture jouable validée.

## Dimensions auteur validees
Trois tâches `dimensions` sont clôturées selon leur critère existant : sources publiques identifiées, unités en mètres, emprise distincte de la hauteur. Cela ne clôture aucune tâche d'architecture, de graphismes ou de campagne.

| Typologie | Plans auteur | Emprise composée (m) | Hauteur (m) | Provenance et limites |
|---|---:|---|---|---|
| EXT-MONDE-T060 — Champ d'éoliennes | 50 | 1 280 à 4 430 × 280 à 1 780 | 180 à 241 en bout de pale | Rotor de 150 m, moyeux de 105/123/145/155/166 m d'après Vestas. Espacements 7D/5D, fondations 16×16 et annexes : choix auteur, non plan d'ingénierie. |
| EXT-MONDE-T065 — Stade municipal | 50 | 201 à 269 × 162 à 230 | 7 à 15 | Terrain 105×68 et marges 4/3 m d'après la référence FIFA. Tribune, hauteur, bâtiments annexes et périmètre : choix de jeu explicitement séparés. |
| EXT-MONDE-T066 — Grand stade couvert | 50 | 219 à 319 × 180 à 280 | 36 à 52 | Terrain 105×68 et marges 5/4 m d'après la référence FIFA. Couverture, portées structurelles, gradins et enveloppe restent des choix auteur non construits. |

Il s'agit de **50 compositions paramétriques distinctes par typologie**, pas de 150 modèles artistiques ni de 150 relevés d'ouvrages existants. Le même terrain sportif reste à l'échelle. Aucun grand site n'est réduit à une parcelle de maison.

Les 150 sorties totalisent 1 150 réservations de bâtiments annexes, 5 750 espaces auteur (circulations comprises), 720 volumes de tribunes ou turbines et 3 890 nœuds internes. Ces occurrences héritées ne sont pas des bâtiments indépendants fabriqués dans le jeu.

## Architecture encore ouverte
Chaque annexe réserve quatre salles et une circulation centrale. Les entrées et passages ont des coordonnées, largeur et extrémités explicites. Les stades prévoient accueil, vestiaires/douches, sanitaires, soins, maintenance, énergie, restauration, sécurité, gestion et associations. Les parcs éoliens réservent maintenance, énergie et gestion.

Le premier contrôle de largeur a découvert qu'une liaison longitudinale du parc passait par une fondation. Elle utilise maintenant une desserte latérale. Les tests couvrent les rectangles complets des voies, y compris obliques, pas seulement leurs lignes centrales. Un contact voulu au bord d'une entrée reste permis. Les voies ne traversent ni les volumes ni la zone libre du terrain sportif. Le réseau interne rejoint un port externe **déclaré non connecté au monde**.

Les trois tâches `architecture` restent **En cours**. Il manque encore les murs et ouvertures du moteur, la couverture des grands stades, les vrais gradins, escaliers et niveaux, les contenants, les rencontres, les services, les graphismes, le raccord au seed et les tests de sauvegarde. Les petites réservations d'étagères sont des slots auteur sans butin, pas un aménagement intérieur exhaustif.

## Navires cotes partielles
Cinq tâches `dimensions` passent à **En cours**, jamais à Validé :
- T005, cargo : Damen Combi Freighter 5000, 86,6×15,2 m, tirant 6,55 m et cale documentée.
- T006, pétrolier : Socatra Alcyone, longueur 183,06 m et largeur 32,2 m ; creux moulé 19,2 m et tirant été 13,258 m distincts de la hauteur totale.
- T007, croiseur : USS Little Rock, dimensions du musée converties du pied au mètre ; hauteur et compartimentage complet absents.
- T008, sous-marin en surface : Torsk, notice historique indexée de l'US Navy ; pied/pouce converti exactement. L'ouverture directe de la page a expiré, aucun plan de pont n'est prétendu consulté.
- T011, soutien offshore : Damen PSV 3300 CD, 80×16,2 m, creux 7,5 m et tirant 6,15 m ; superstructures et locaux restent à relever.

Aucun tirant d'eau ou creux moulé ne sert de hauteur totale. Les 35 cotes du fichier de référence ont un repère de mesure, une unité et une source. Les sources n'autorisent pas à reproduire un plan réel intégral ni à qualifier une construction réelle.

## Reproduction
Depuis la racine du dépôt :

```sh
node --test tests/codex-world-foundations2026.test.cjs
node scripts/codex-world-foundations2026.cjs artifacts/qa/codex-foundations2026
```

La première commande rejoue **16 tests** indépendants des données de suivi complètes. La seconde écrit le bilan et trois fichiers JSON de cinquante plans. Les sorties sont déterministes ; aucune installation de dépendance n'est requise pour ces deux commandes.

Le script `scripts/codex-progress2026.cjs` prépare les seuls changements de suivi autorisés. Il exige les données corrigées complètes du paquet/Drive, non encore toutes versionnées dans la PR. Par défaut il ne fait qu'afficher la modification ; `--apply` écrit les trois JSON concernés. Une tâche modifiée par un autre auteur est refusée plutôt qu'écrasée. La répétition du même patch est idempotente.

## Résultats réellement obtenus
- Groupe local : **28/28 tests**, sans échec, annulation, skip ou TODO (16 nouveaux + 12 contrats du suivi conservés).
- Audit : **150/150 plans auteur**, zéro revendication de jouabilité.
- Suivi : **800 tâches = 3 Validé + 8 En cours + 789 À faire**. Aucun autre statut modifié.
- Variantes : 150 `Gabarit métrique`, 3 850 `À concevoir`, **zéro architecture et zéro lieu jouable déclaré terminé**.
- Comparaison de tous les fichiers `src/` disponibles avec l'archive de la base : **aucune différence**, compilation du codex comprise.
- `npm run check` réellement lancé : syntaxe **383 fichiers** réussie, compilation du Codex réussie ; build ensuite arrêté avec `ENOENT assets/icon-192.png`, image absente de l'archive texte. **Pas de réussite de suite générale, navigateur, Windows ou endurance revendiquée.**

Les résultats et journaux sont dans le paquet de preuves. L'audit des graphes auteur ne certifie pas les véhicules ou personnages en mouvement dans la campagne.

## Publication et classeur
Le classeur est mis à jour séparément sur Drive en préservant son ID. Les fichiers source de cette passe peuvent être versionnés par les actions GitHub autorisées. **Le binaire XLSX reste non commité** tant qu'un dépôt binaire autorisé n'est pas confirmé ; aucun workflow de transfert précédemment bloqué n'est recréé. Les anciens reçus conservent leur valeur historique, sans être présentés comme preuve du nouvel état.

La PR reste en brouillon. Aucun merge, aucun déploiement, aucune modification des partages Drive.
