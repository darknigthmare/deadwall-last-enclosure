# DEADWALL — extension visuelle des secteurs et survivants

Création le 31 août 2026 avec l'outil OpenAI ImageGen intégré. Aucun téléchargement d'asset tiers et aucun appel OpenAI pendant le jeu. Trois nouvelles planches réellement incorporées dans src/art.js, la PWA, le standalone et le paquet PC.

## Fichiers retenus

| Fichier du dépôt | PNG original conservé | Dimensions | Contenu |
| --- | --- | --- | --- |
| assets/infected-expansion-atlas.webp | exec-2bafddd0-e8d0-4dd0-9fce-d6f1299ea0ab.png | 1774 × 887 | Briseur, Traqueur, Engorgé, variante cosmétique d'Errant ; huit poses chacun. |
| assets/specialists-atlas.webp | exec-7ecfd6d0-d85c-4589-af57-9562afbcd61a.png | 1774 × 887 | Secouriste, Ingénieur, variantes d'Ouvrier et Fusilier ; huit poses chacun. |
| assets/district-props-atlas.webp | exec-0bf14cca-91f1-4f5f-8626-6ce419f8fe32.png | 1254 × 1254 | Seize ruines, véhicules, équipements et débris récupérables. |

Originaux dans C:/Users/chuck/.codex/generated_images/01a05109-3897-7502-bf7b-c23356dbf233/.
Les trois copies WebP qualité 90 totalisent 714 888 octets. Fond technique magenta demandé et reçu en RGB ; retrait au chargement, une seule fois, par le décodeur chroma existant. Ce ne sont pas des fichiers fournis avec canal alpha.

La première génération d'infectés (exec-29baf4bb-e3fe-450c-9bfb-d5a7a5139fbc.png) était trop latérale : une correction OpenAI a élevé la caméra. La tentative par chemins locaux a échoué avant génération (ACL Windows) ; la correction réussie a utilisé quatre images déjà visibles dans la conversation. L'image 1 était la cible et l'image 4 l'atlas des infectés existants. Seule la version corrigée est distribuée.

La grille nominale des décors n'est pas parfaitement respectée par la génération. L'inspection de chaque cellule a révélé un fragment de hangar dans le poste de garde et un fragment de gravats à côté de l'arbre. Les rectangles UV runtime du hangar, du poste, de l'arbre et des gravats ont donc été adaptés aux silhouettes observées ; le bitmap généré n'est pas retouché. Les cellules d'acteurs gardent leurs pivots fixes.

## Contrat runtime

- Seize cycles au total dans le catalogue acteurs (128 poses), dont huit nouveaux cycles. Ce sont des cycles de marche en place, pas des animations 3D squelettiques ni des cycles de mort.
- Variantes cosmétiques stables par identifiant pour les ouvriers, fusiliers et errants ; aucun changement de caractéristiques dû à l'apparence.
- Les silhouettes plus massives du Briseur et de l'Engorgé sont rendues à l'échelle du Protégé.
- Les quartiers sont des gisements traversables : pas de conduite de véhicule, de couvert supplémentaire ou de bâtiment habitable implicite.
- Les dossiers affichent les mêmes sprites décodés que le jeu. Les icônes de rôle et contours de soutien sont géométriques, distincts des nouveaux bitmaps.
- Générateur de secteurs déterministe séparé du flux aléatoire historique, sans déplacement des anciens gisements.

## Prompts exacts

### Infectés — génération initiale

```text
Use case: stylized-concept
Asset type: production game sprite atlas for DEADWALL, an original grounded post-apocalyptic top-down survival strategy game.
Primary request: create ONE landscape bitmap sprite sheet, exactly 8 columns by 4 rows, 32 isolated character frames, on a perfectly uniform pure magenta #ff00ff chroma-key background. Width exactly twice height, square cells, no grid lines.
Composition: steep overhead camera 70 degrees looking down, semi-realistic hand-painted pre-rendered 3D game sprites; every character faces RIGHT/EAST in every cell. Eight successive frames of an in-place walk cycle across each row, same character scale, fixed center and ground anchor. Each sprite comfortably inside its cell with 15% clear margins. At small size silhouettes must be immediately distinct.
Row 1: BRISER zombie, stocky former construction worker, torn ochre safety vest over charcoal work clothes, battered yellow hardhat, one heavy dangling arm, bruised pale grey skin. No weapon, no oversized mutant.
Row 2: STALKER zombie, wiry adult in ripped charcoal hooded jacket and dark trousers, crouched furtive gait, thin pale hands, visible human head under lowered hood.
Row 3: BLOATED zombie, swollen but recognizably human adult torso in filthy reddish-brown raincoat, slow heavy gait, grey-green skin. Not a fantasy monster, no glowing parts.
Row 4: WALKER VARIANT, elderly adult female infected with grey hair, faded olive cardigan, worn earth-brown skirt and shoes, small torn shoulder bag, dragging limp.
Lighting: consistent soft overhead daylight with muted warm highlights and cool desaturated shadows. Palette: weathered ochre, olive, rust, charcoal, grey skin, consistent sober survival game art.
Constraints: original artwork only; uniform magenta backing, no ground plane or cast shadows beyond character silhouette, no borders, no labels, no letters, no watermark, no logos, no perspective changes, no giant bosses, no graphic gore, no scene or poster. This is a functional animation atlas, not concept-art presentation.
```

### Infectés — correction de caméra retenue

```text
Use case: style-transfer
Asset type: DEADWALL infected expansion walk-cycle atlas.
Image1 is the EDIT TARGET, the new 8 by 4 infected sprite sheet. Image4 (existing magenta infected sheet with horizontal crawlers) is the STYLE AND CAMERA REFERENCE of existing in-game enemies, not to be copied.
Change ONLY the camera elevation of the characters in image1: raise it to the same high three-quarter overhead view as image4, seeing the top of heads, shoulders, upper backs and feet, rather than eye-level profiles. Characters must keep facing RIGHT/EAST in all frames. Preserve exactly all four unique identities (ochre construction zombie, charcoal hooded stalker, swollen red-brown raincoat zombie, elderly olive-cardigan walker), exact 8columns x4rows grid, cell positions, walk cycles, body proportions, costumes and magenta background. More top of heads and shoulders visible, less vertical portrait-like posture in projection. Keep original dimensions 1774x887 or same2:1ratio, fixed sprite center percell, clear margin, exact uniform #ff00ff backing; no text, no outlines, no grid, no extra elements. Consistent hand-painted pre-rendered 3D art style matching image4.
Images2 and3 are unrelated specialist and prop sheets: ignore them. Only modify image1.
```

### Spécialistes et variantes de survivants

```text
Use case: stylized-concept
Asset type: production animated character sprite atlas for DEADWALL, grounded post-apocalyptic top-down strategy game.
Create a landscape bitmap sheet exactly 8 columns by 4 rows, 32 isolated sprites, width twice height, square cells, perfectly uniform #ff00ff magenta chroma-key background with no grid.
Camera: HIGH TOP-DOWN three-quarter view from 65 degrees above horizon, seeing crown of head, shoulders and feet, compact overhead silhouettes, NOT eye-level side-profile illustrations. All actors face RIGHT/EAST, identical camera and lighting across all frames. Eight walk-cycle frames per row, walking in place, fixed position, equal scale, 15% empty margin per cell.
Row 1: adult female FIELD MEDIC with dark tied-back hair, weathered cream field jacket, muted teal medical satchel, dark practical trousers and boots; healing profession evident through bag and small medical pouch, no logo or cross.
Row 2: adult male ENGINEER with worn ochre hardhat, charcoal coveralls, rust gloves, small tool case and belt, industrial practical repair specialist.
Row 3: female WORKER VARIANT, short dark beanie, rust-orange faded work coveralls, gloves, utility belt; no weapon.
Row 4: female SOLDIER VARIANT, dark navy tactical vest, faded olive camouflage trousers and military boots, short hair, carrying practical rifle pointing right.
Style: polished hand-painted pre-rendered 3D game sprites, serious believable humans, weathered materials, readable at 55 pixels in game. Earthy rust, charcoal, olive, cream, ochre; consistent soft overhead light, no strong cast shadows.
Constraints: original game art only. No text, watermark, borders, logo, scene, ground plane, extra props outside sprite, gore, futuristic armor, fantasy, anatomy errors or camera changes. Exact row order and exact grid. Eight distinct subtle sequential walking poses per character.
```

### Décors récupérables

```text
Use case: stylized-concept
Asset type: original environmental prop atlas for DEADWALL, a grounded post-apocalyptic overhead survival strategy game.
Create ONE square bitmap with exactly 4 columns by 4 rows, 16 equal square cells. One separate prop centered per cell, occupying about 72% of cell, with clear 14% margin. Uniform flat #ff00ff magenta chroma-key background, no drawn grid lines. The same HIGH THREE-QUARTER TOP-DOWN camera and scale logic for every object; high enough to see roof surfaces and interiors, like pre-rendered strategy game props. Deliberately collapsed salvageable scenery, not occupied intact buildings.
Exact row order left to right:
Row 1: collapsed small brick house with roof broken away; ruined corner shop without signs; roofless warehouse ruin with bent beams; abandoned small guard booth.
Row 2: derelict cream ambulance van with blank panels and muted teal stripe but NO medical cross or writing; weathered rust-orange abandoned bus; old grey utility truck with empty cargo bed; abandoned small tanker truck with corroded fuel tank.
Row 3: patched olive emergency shelter tent partly collapsed; corroded blue-grey open shipping container with scrap inside; battered cylindrical water tank on low supports; fallen broken power pylon coiled with cable.
Row 4: cracked low concrete road barricade; burnt leafless tree stump with blackened branches; heap of broken brick and concrete rubble; fallen industrial street lamp.
Style: high-quality hand-painted pre-rendered 3D game sprites, tactile worn concrete, oxidized metal, dusty fabric and broken wood. Muted olive, charcoal, weathered ochre, rust and cool grey. Clear silhouettes readable at small game size. Consistent soft overhead natural light, modest shadows contained within each isolated prop.
Constraints: no landscape, no terrain tile, no scene composition, no background detail beyond pure magenta, no humans, no zombies, no text, numerals, logos, watermarks, grid lines, frame labels or franchise references. Each of the 16 specified props exactly once, fully visible and separately extractable, never touching another cell.
```
