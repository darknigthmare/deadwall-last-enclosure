# Contrat de rendu des routes — 1.29

`DeadwallRoadKit.drawNetwork(ctx, roads, options)` reçoit les segments existants `{a:{x,y},b:{x,y},width}`. Les données sont en mètres et ne sont jamais modifiées. Appeler la fonction une fois pour toutes les routes et accès d’un même plan, après les sols des parcelles et avant les bâtiments. Ne pas redessiner chaque accès individuellement après le réseau.

Options : `view={l,r,t,b}`, `markings` (vrai par défaut), `scale`, `minWidth` en pixels pour les cartes, `shoulderWidth` en mètres, et les couleurs `shoulder`, `surface`, `marking`. Le terrain conserve les largeurs métriques ; seule la carte peut imposer une largeur minimale de lisibilité.

Les marquages sont interrompus selon les intersections géométriques des chaussées, y compris les débouchés en bout de segment. `markingSpans` expose les intervalles visibles en mètres depuis le premier point pour les tests. Les segments colinéaires ne produisent pas de faux carrefour. Le dessin n’ajoute ni îlot physique, ni priorité routière, ni passage piéton sans donnée de simulation.

La minimap régionale utilise ce réseau, les empreintes orientées des lieux découverts, la graine active et le cadrage courant. D-17 est rendu par le service commun de projection de la cité. Le rendu d’un monde ne doit jamais tirer une nouvelle graine.
