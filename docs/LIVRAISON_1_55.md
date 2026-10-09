# DEADWALL 1.55 — Commandement, relais et logistique

Cette passe corrige des défauts reproduits de pause en combat, de manipulation des relais, de bilan économique et d'activation des escaliers. Elle complète la présentation des annexes et réduit des travaux répétés du rendu. Elle part de la 1.54.0, commit `1ab157d`, et conserve la boucle récolter → déposer → construire → automatiser → fortifier → survivre → réparer.

## Changements jouables

- **Pause immédiate :** ouvrir un devis avec **O · ORIENTER** arrête le pas courant avant les attaques, les tirs et l'entretien. Un infecté au contact ne blesse plus le commandant après l'ouverture du dossier ; la sauvegarde de cette pause correspond au combat suspendu. La fermeture reprend les dégâts ordinaires.
- **Relais régionaux :** Déposer/Reprendre attendent la fin d'une recharge et utilisent le même devis que leurs boutons. Une dépouille réanimée réellement proche, sur le même niveau et avec une ligne physique libre, bloque les manipulations ou interrompt le relevé avant paiement. Les murs continuent de protéger un relais extérieur d'une menace masquée.
- **Bilan Logistique :** il expose le carburant des centrales réellement actives, y compris celles des âges avancés, et respecte les réserves du régulateur d'intrants payé. Une manufacture arrêtée par sa réserve n'annonce plus une production disponible. Le calcul décrit les débits du moteur ; il ne les augmente pas.
- **Escaliers :** MONTER/DESCENDRE conservent leurs boutons pendant les rafraîchissements lorsque l'action reste possible. Une pression souris, Espace ou tactile ne perd plus son activation entre le début et la fin du geste. Les accès invalides restent désactivés.
- **Annexes :** habitat, atelier, poste sanitaire, dépôt, tour et micro-réseau utilisent six silhouettes originales existantes. Les fondations physiques, rotations, profondeurs, chantiers et capacités restent celles des annexes actuelles.
- **Tactile :** MATÉRIEL et VÉHICULE restent lisibles sur une seule ligne dans leurs cibles compactes de 44 px de haut.

Le masque nocturne local réutilise son dernier bitmap lorsque ses sources, occlusions, projection et opacité sont identiques. Changer une porte, un plan, une ouverture de projecteur, une source ou la caméra actualise le masque. Les rayons régionaux entièrement hors écran évitent un balayage inutile ; les autres éclairages conservent leur comportement. Le cache de sprites mémorise aussi les clés de rectangles source immuables. Ces changements ne réduisent ni les poses, ni la résolution choisie, ni les portées de lumière.

Les façades et toits procéduraux de l'exploration locale disposent d'un cache limité à 8 Mio et 96 entrées, avec au plus 1 Mio par surface. Les projections régionales, contextes transparents ou découpés gardent le dessin original. Un déplacement fractionnaire de la caméra utilise aussi ce chemin tant que la phase de pixels n'est pas répétée. Les contours et états physiques restent ceux des bâtiments existants.

## Campagnes et compatibilité

Le format général de sauvegarde reste **v20**, sans champ ajouté par cette passe. Les campagnes G1–G7, leur seed, les stocks finis, les onze âges, les coûts, les statistiques et les règles de combat sont conservés. Une graine reproduit la géographie ; elle ne garantit pas une simulation compétitive parfaitement déterministe.

La sauvegarde est locale au navigateur et à son origine. Dans **Paramètres**, **Exporter** permet d'en conserver une copie JSON avant un changement d'appareil ou un import. Les profils PC et navigateur sont distincts. Pour le fonctionnement PWA et les protections de mise à jour déjà présentes, consulter [la livraison 1.54](LIVRAISON_1_54.md).

Le site autorisé pour la publication reste https://deadwall-last-enclosure.vercel.app/. Cette adresse désigne la destination ; ce document n'atteste pas que le candidat 1.55.0 y est déjà disponible.

## Lancement et contrôle

Depuis les sources, avec Node.js ≥22.12 :

```sh
npm ci
npm start
```

Le serveur annonce son adresse locale, normalement sur le port 4173. `npm run build` fabrique `dist/` et `DEADWALL_Standalone.html`. Les distributions web/PWA, autonome et Windows gardent leurs contrôles propres.

Les commandes de validation générale sur les sources finales sont :

```sh
npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:campaign
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:standalone
```

Le parcours PWA est déjà inclus dans `test:browser`. Les preuves ciblées terminées et leur portée figurent dans [l'audit 1.55.0](AUDIT_1_55.md), avec une comparaison de performance déjà mesurée sur le candidat. Ce guide est rédigé avant le contrôle global et la publication ; leurs résultats finaux sont consignés séparément dans le compte rendu de livraison. La publication doit comparer les fichiers HTTPS au build du commit attendu.

## Limites restantes

La cible Standard de **6 à 10 heures jusqu'au onzième âge** reste à vérifier par plusieurs campagnes humaines complètes. Les fixtures préparées et les chronomètres de simulation ne mesurent pas ce parcours.

La comparaison Chromium/SwiftShader dans le cloud à 1280×720 et DPR 2 mesure **8,32 → 9,27 FPS** dans la scène préparée à 720 infectés en automatique. En qualité basse, **5,31 → 10,59 FPS** sont observés, mais la référence comporte de longues interruptions et la médiane entre frames reste identique : cela ne démontre pas un gain causal de deux fois. Les scènes calmes sont légèrement moins rapides dans cet essai. Cette scène et ce GPU logiciel ne définissent pas le matériel requis ; la fluidité des grandes hordes et le budget FPS des appareils restent à valider.

Les contrôles ciblés de navigateur utilisent Linux et du tactile émulé. Le champ régional compact reste partiellement occupé par la carte, l'objectif et les avertissements. Cette passe ne certifie ni l'exhaustivité de tous les sprites et animations, ni Windows natif, ni le tactile physique, ni l'audio, ni une conformité complète d'accessibilité, ni une publication en boutique.
