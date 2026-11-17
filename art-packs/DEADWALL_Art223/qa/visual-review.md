# Art223 — revue visuelle des versions retenues

Revue du 2026-11-17, Europe/Paris. Comparaison avec l’atlas réel, les fiches du Codex et les versions antérieures conservées.

Les corrections rapprochent la projection des bâtiments de la caméra haute de l’atlas. Elles ne certifient ni une projection métrique exacte, ni une identité pixel pour pixel.

| Fiche | Observation sur la version finale |
|---|---|
| DW-0065 — Boulangerie artisanale | Façade raccourcie par rapport à la correction d’accès, toiture davantage dominante ; porte de service au sol à gauche, boutique et conduit du four conservés. |
| DW-0153 — Bibliothèque municipale | Façade comprimée, toiture davantage dominante ; deux rangées de fenêtres conservées, porche soutenu au sol et accès latéral distinct. |
| DW-0085 — Laverie automatique | Façade raccourcie ; toiture, trois évents et machines derrière vitrage conservés ; entrée publique et petite porte technique à droite restent au sol. |
| DW-0082 — Bureau postal | Façade fortement raccourcie, toiture dominante ; rideau de chargement et bornes à gauche restent au sol, séparés de l’entrée publique et des casiers. |
| DW-0444 — Gymnase municipal | Toiture à deux pans davantage dominante, façade raccourcie ; rangée de fenêtres hautes et bande basse d’entrée conservées, sans étage ajouté ; accès matériel au sol. |
| DW-0224 — Garde-meubles | Toiture plus profonde et façade raccourcie ; accueil bas et unique porte de manutention au sol conservés ; bâtiment fermé, sans rangée de garages extérieurs. |

Les silhouettes principales restent entièrement visibles. Les vérifications du canal alpha et des marges sont chiffrées dans `image-audit.json`. Les octets natifs de chaque image sont conservés.

## Limites

Les dimensions des pilotes décrivent les bâtiments existants du Codex ; les plages de parcelles auteur décrivent d’autres propositions. Les coordonnées de portes, pivots, mètres par pixel, collisions, visibilité des intérieurs et tri de profondeur restent à calibrer dans le moteur. Aucun parcours navigateur, Windows ou test de jouabilité n’a été exécuté pour ce pack. Le contrôle général antérieur est interrompu : aucune réussite globale n’est déduite de ses résultats partiels.
