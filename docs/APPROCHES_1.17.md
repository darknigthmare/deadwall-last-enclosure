# Approches silencieuses — 1.17.0-rc.1

## Périmètre

Cette passe prolonge le jeu complet 1.16. La région d’exploration conserve ses 8 192 mètres de côté et le chantier demeure dans D-17. Aucun push, déploiement ou exécutable signé. Les huit nouveaux types sont des plans originaux simplifiés reliés au codex externe, pas les 500 programmes intégralement construits.

| Nouveau type | Dimensions | Niveaux | Fiche |
|---|---|---|---|
| Maison sur sous-sol | 18 × 15 m | -1, 0 | DW-0004 |
| Pharmacie | 24 × 18 m | 0 | DW-0053 |
| Cuisine centrale | 38 × 29 m | 0 | DW-0073 |
| Cabinet dentaire | 25 × 20 m | 0 | DW-0126 |
| Recyclerie | 40 × 28 m | 0 | DW-0237 |
| Halle fret désaffectée | 46 × 24 m | 0 | DW-0289 |
| Menuiserie | 35 × 26 m | 0 | DW-0306 |
| Local groupe électrogène | 16 × 13 m | 0 | DW-0331 |

Le mobilier supplémentaire comprend fauteuil dentaire, stérilisateur, table inox, râtelier de plonge, stock de planches, banc de découpe, serre-joints, palettes, groupe et baie électrique. Les dessins et leurs emprises sont liés ; les machines restent arrêtées. Les objets ne donnent ni traitement médical automatique, ni courant au refuge.

## Lire et choisir la fouille

Le ciblage compare la distance au bord réel de l’objet. La ligne entre personnage et bord doit être dégagée. T permet de parcourir les cibles accessibles ; une cible devenue inaccessible perd son verrou temporaire. La posture et le choix ne créent aucune ressource. Le cercle, le nom et la quantité désignent la même cible. E remplit le sac à partir de sa réserve réelle. Un sac plein ou une action interrompue n’entretient pas une progression fictive. Les contenants vides restent identifiables. Le verrou de cible n’est pas sauvegardé, contrairement au prélèvement.

## Reconnaissance

Les paramètres sont dans `C.FrontierTacticsRules` : marche prudente 1,65 m/s ; vision 22 m, réduite à 10 m en posture prudente ; détection très proche 2,4 m ; angle visuel de demi-ouverture 1,15 radian. C commute la posture en région, à pied. Maintenir la course ne supprime pas la prudence.

Rayons des signaux de bruit : pas prudents 1,8 m, marche 7 m, course 18 m, moteur en mouvement 36 m, fouille active 11 m, tirs 42/58/62 m selon l’arme. Derrière un obstacle, le rayon est multiplié par 0,45. Ces valeurs ne sont pas une simulation acoustique scientifique et aucun nouvel enregistrement audio n’est annoncé. Les impulsions de déplacement demandent une distance réellement parcourue ; attendre avec un réservoir vide ne fait pas marcher fictivement le moteur.

Les signaux ne traversent pas les niveaux. L’infecté mémorise le point entendu pendant 12 secondes et tente de l’inspecter. Une vision dégagée entretient la poursuite ; sinon il va vers sa dernière information, pas vers la position courante invisible. Arrivé sans retrouver le joueur, il cherche brièvement puis se calme. Les silhouettes occultées par une cloison ne sont pas dessinées à travers celle-ci.

Le détour utilise une grille locale de 0,75 m, 950 nœuds maximum et un budget de deux recherches nouvelles par pas de simulation. Les segments utilisent la collision du monde et le gabarit du personnage. Un échec de recherche peut laisser un infecté attendre ; aucun chemin optimal ni capacité à franchir tous les plans n’est promis. La voiture du joueur est aussi un obstacle pour l’infecté.

## Sauvegarde et ancien monde

Format v16. Le registre régional reste en version 2, avec génération 3, posture et suivi des rencontres. Les anciennes générations 1/2 gardent leurs empreintes de parcelles, étages et végétation. Elles ne reçoivent pas rétroactivement les huit nouveaux sites. Les contrôles sur trois graines protègent cette compatibilité.

Positions, état de poursuite, point mémorisé et délai sont conservés avant sauvegarde et changement de niveau. Les ennemis morts ne sont pas recréés. Les régions éloignées restent désactivées et reprennent leur état, sans simulation continue du continent. Une pause ou une simple inspection n’avance pas les délais.

## Preuves et limites

Les contrôles logiques et navigateur sont sous `tests/`. Les scènes avancées préparent explicitement des positions, des infrastructures ou l’absence de menace afin d’isoler un mécanisme. Le temps est contrôlé. Les tests ne sont pas des joueurs humains.

Les premiers diagnostics ont corrigé des attentes de version, une fixture qui marquait un infecté mort sans retirer son état de poursuite, un local dont les meubles étaient trop proches et un test supposant une cloison plus longue que celle du plan. Les validators n’ont pas été relâchés pour accepter ces erreurs. Les règles de stockage, carburant, horde et anciens modes restent vérifiées par les régressions.

Safari/iOS physique, Firefox, Electron empaqueté, plusieurs heures de mégaville peuplée et la fluidité sur le matériel du joueur restent à valider. Les captures distantes sont produites par le vrai moteur ; leurs contrôles géométriques/DOM n’équivalent pas à une revue artistique humaine exhaustive.
