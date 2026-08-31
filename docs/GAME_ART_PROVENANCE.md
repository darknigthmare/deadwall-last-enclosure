# DEADWALL — assets de jeu OpenAI

Ce document décrit le premier lot de sept atlas. Le catalogue actuel comprend dix atlas et seize cycles d’acteurs : les trois nouvelles planches, leurs prompts exacts et limites sont documentés dans [CONTENT_ART_PROVENANCE.md](CONTENT_ART_PROVENANCE.md).

Création le 31 août 2026 avec **l'outil OpenAI ImageGen intégré**, et non des placeholders CSS, des images téléchargées ou une API simulée. Les originaux PNG sont conservés dans le dossier de génération Codex de cette session. Les fichiers ci-dessous sont les copies WebP réellement chargées par src/art.js et embarquées dans les trois distributions.

## Livrables et provenance

| Asset du dépôt | Original ImageGen | Dimensions | Usage réellement intégré |
| --- | --- | --- | --- |
| assets/buildings-atlas.webp | exec-602d6d2b-09c6-401d-8bb6-872dfc432855.png | 1254 × 1254 | Seize bâtiments, industrie et bases de tourelle. |
| assets/terrain-earth.webp | exec-31171d49-1bbd-4df1-86e3-25d797bd20e4.png | 1254 × 1254 | Sol terre/gravier/herbe, répété dans les seules tuiles visibles. |
| assets/props-atlas.webp | exec-bebccc85-5037-45ae-a60c-b71568b10d28.png | 1254 × 1254 | Seize éléments : végétation, matériaux, cultures, bidons, épaves, trois murs et porte. |
| assets/survivors-atlas.webp | exec-271c9b91-17d6-440e-b114-7ee7cae83ea3.png | 1774 × 887 | Commandant, ouvrier, fusilier, errant : huit poses chacun. |
| assets/infected-atlas.webp | exec-47801553-11da-443e-8b13-e39c005b7449.png | 1774 × 887 | Coureur, protégé, rampant, hurleur : huit poses chacun. |
| assets/vfx-atlas.webp | exec-54faff51-a070-4d45-84d7-6dd4e9a883d3.png | 1254 × 1254 | Quatre étapes de flash, impact, feu et fumée. |
| assets/defenses-atlas.webp | exec-96dbdb89-9fc8-42f2-b2cb-06c1436dbbc4.png | 1254 × 1254 | Hérissons, porte blindée, canon simple et canon double orientés vers la cible. |

Le menu utilise séparément assets/deadwall-keyart-v2.webp, documenté avec son prompt exact dans ART_PROVENANCE.md. Il reste une illustration de menu, jamais une capture de gameplay.

## Spécifications de génération

Les briefs de génération ont demandé des **assets runtime originaux** pour DEADWALL, dans un rendu peint semi-réaliste de stratégie industrielle post-apocalyptique. Palette acier/gris, olive, terre et rouille ; échelle humaine, pas de magie ni d'infecté fantastique ; aucun texte, logo, interface, watermark ou référence à une franchise tierce.

1. **Bâtiments** : vue presque verticale, grille 4 × 4, bâtiments isolés et marges transparentes demandées. Ordre : dépôt central à antenne, dortoir, entrepôt, caserne ; clinique, ferme, générateur, scierie ; recyclage, concasseur, raffinerie, atelier ; manufacture, mirador, base de tourelle, base lourde.
2. **Terrain** : texture carrée répétable de terre tassée usée, graviers fins, herbes olive clairsemées, éclairage diffus sans objet ni élément dominant.
3. **Props** : grille 4 × 4 sur fond technique magenta uniforme. Arbre, conifère, bûches, pierres ; ferraille, cultures, bidons, provisions ; voiture, pickup, fourgon, camion en épaves ; palissade, acier, béton, porte.
4. **Alliés/errant** : huit colonnes et quatre rangées régulières sur magenta, huit phases de déplacement par personnage, silhouette cohérente et pivots constants, tête/arme orientées vers l'est. Vêtements du commandant beige et gilet sombre, ouvrier ocre et sac, fusilier olive, errant gris-olive.
5. **Infectés** : même grille et orientation, quatre profils humains au lieu de monstres : récent rapide brun, ancien policier protégé gris-bleu, rampant aux jambes traînantes, hurleur bordeaux.
6. **VFX** : grille 4 × 4 sur noir pur pour composition additive ; quatre phases de bouche de tir ambre, impact poussière/pierre, incendie industriel orange, fumée grise ; effets centrés et marges vides.
7. **Défenses** : grille 2 × 2 sur magenta pur ; hérissons en poutres d'acier, double porte blindée à piliers béton, arme rotative simple, arme lourde à deux canons pointant à droite, bases fixes exclues des deux armes.

## Import et limites

- Compression mécanique WebP qualité 90, sans modification de composition des originaux.
- L'atlas des bâtiments demandé transparent a été livré en RGB avec un damier dessiné. Une tentative de correction par ImageGen a échoué sur la lecture locale ; aucun succès fictif ni nouvelle provenance n'est attribué à cette tentative.
- Le chargeur effectue donc un **décodage technique de matte** une seule fois dans un canvas : neutralité claire connectée au bord pour les bâtiments, chroma magenta pour les autres découpes. Les zones claires isolées, notamment la croix de clinique, restent opaques. Les effets noirs sont rendus en mode screen.
- Les rectangles découpés respectent les marges réellement observées, pas la résolution ou la grille idéale demandées. Les poses gardent une cellule fixe pour éviter les variations de pivot dues à un recadrage par image.
- Les huit cycles totalisent 64 poses générées ; ce ne sont pas des animations squelettiques 3D ou un ensemble d'animations de mort/rechargement. L'arme tenue par le personnage est stylisée, les statistiques des trois armes restent celles du gameplay.
- Les véhicules sont des silhouettes de gisements récupérables de ferraille/carburant. Pas de conduite, transport ou physique automobile.
- Un chargement d'image défaillant conserve le rendu géométrique jouable ; les erreurs sont consignées dans DEADWALL.art.diagnostics.failed. Aucun appel réseau OpenAI n'existe dans le jeu distribué.

## Vérification

tests/art.test.cjs contrôle couverture du catalogue, limites des rectangles, 64 poses et masquage conservant les détails clairs. La galerie de rendu et les captures de partie ont été inspectées dans Chromium ; le test local charge les sept assets, vérifie l'absence de magenta opaque et mesure 90 pas simulation+rendu avec 300 infectés visibles. Ces mesures locales ne constituent pas une promesse de fréquence d'image sur tout matériel.
