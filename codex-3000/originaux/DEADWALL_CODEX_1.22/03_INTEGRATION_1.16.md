# Codex 1.1 — liaison à DEADWALL 1.16

Les 500 concepts et leurs 2 061 espaces sont conservés. Douze fiches supplémentaires sont reliées à des plans pilotes réels; il reste 466 conceptions non intégrées.

Les nouveaux lieux sont présents dans les régions de génération 2. Les sauvegardes de régions déjà explorées en 1.15 conservent la génération 1, ses objets, ses prélèvements et ses emplacements. Il ne faut jamais convertir silencieusement un identifiant de contenant ou réinitialiser la région pour afficher un nouveau lieu.

La carte publique possède un carnet, pas le catalogue développeur : recherche, douze résultats par page, notes manuelles À explorer / Visité / Fouillé / Danger, repère persistant et estimation par le réseau routier. Une annotation ne crée ni ne détruit des stocks, ne certifie pas la sécurité et n'accorde pas de récompense.

Les plans pilotes sont dans `src/frontier-places.js`; leurs gabarits et transformations partagent `frontier-geometry.js`. Les cours sont des objets physiques récupérables, générés dans la parcelle de service. Les baies et objets restent inertes lorsqu'aucune interaction spécifique n'existe : fours, machines à laver et chenils ne constituent pas des systèmes de production ou d'animaux nouveaux.

Les 12 nouveautés sont :

- **DW-0065 — Boulangerie artisanale** : `bakery`, 22 × 17 m, niveaux [0].
- **DW-0153 — Bibliothèque municipale** : `library`, 32 × 24 m, niveaux [0, 1].
- **DW-0046 — Jardinerie** : `garden`, 36 × 28 m, niveaux [0].
- **DW-0097 — Clinique vétérinaire** : `veterinary`, 26 × 20 m, niveaux [0].
- **DW-0085 — Laverie automatique** : `laundry`, 21 × 15 m, niveaux [0].
- **DW-0181 — Caserne de pompiers** : `firestation`, 36 × 28 m, niveaux [0, 1].
- **DW-0224 — Garde-meubles** : `selfstorage`, 36 × 26 m, niveaux [0].
- **DW-0367 — Exploitation maraîchère** : `marketgarden`, 32 × 24 m, niveaux [0].
- **DW-0082 — Bureau postal** : `postoffice`, 28 × 22 m, niveaux [0].
- **DW-0444 — Gymnase** : `gym`, 38 × 28 m, niveaux [0].
- **DW-0104 — Auberge de village** : `inn`, 28 × 23 m, niveaux [0, 1].
- **DW-0251 — Casse automobile** : `scrapyard`, 35 × 25 m, niveaux [0].

## Reproduction

Exécuter dans l'ordre `python source/generer_codex.py`, `python source/creer_lecteur.py`, puis `python source/valider_codex.py`. Ces commandes régénèrent la documentation; elles ne placent rien dans une campagne et ne publient pas le jeu.

Les compteurs de qualification du jeu doivent être lus dans le rapport réel de la 1.16, pas déduits du nombre de fiches. Le codex reste externe à l'interface publique.
