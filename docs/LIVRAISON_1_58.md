# DEADWALL 1.58 — Mille programmes et variantes du monde

Le candidat 1.58 poursuit `main` au commit `c7174ca`, fusion de la PR #4. Il conserve les correctifs 1.57.1/1.57.2 : nouvelle campagne G8, arrivée locale à D-17, pauses du prologue, espèces locales et identité stable de campagne. Les contrôles finaux et la publication sont consignés dans [AUDIT_1_58.md](AUDIT_1_58.md).

## Extension du Codex

**DW-3001 à DW-4000 ajoutent 1 000 programmes parents indépendants.** Le catalogue contient 4 000 fiches et 2 000 parents : les 3 000 fiches historiques, dont leurs 2 000 compositions documentaires, restent conservées. Les ajouts couvrent habitat, santé, enseignement, commerces, services, culture, administration, secours, logistique, industrie et agriculture.

Les quatre lots de 250 fiches dans [l'addendum 1.58](../codex-3000/addendum-1.58/CONTRACT.md) matérialisent **7 500 pièces sur 1 475 niveaux**. Chaque fiche fournit usage, architecture, pièces, meubles natifs, accès, retour, implantation, réserves finies, risques, nuit, interactions et critères de contrôle. Le guide du jeu, l'index et `LIRE_1000_NOUVEAUX.html` consultent ces mêmes programmes ; le lecteur HTML contient ses données pour rester consultable hors connexion.

Les emprises auteur vont de 24 à 78 m de largeur et de 24 à 75 m de hauteur. Un programme comprend au moins six pièces et **trois niveaux maximum au total, sous-sol compris**. Les niveaux restent contigus et comprennent le rez-de-chaussée. Quatre géométries organisent les passages : axe médian (`axial`), couloir décentré (`offset`), dégagement transversal (`cross`) et galerie élargie (`gallery`). La compilation peut agrandir explicitement la hauteur dans la limite de 75 m pour réserver les circulations ; elle conserve la référence auteur.

## Activer G9 dans une partie

Une nouvelle campagne démarre en **G8**, sur le terrain local de D-17. La région prend le relais lorsque le joueur quitte ce domaine. Au dépôt, avec le commandant vivant, libre et son rechargement terminé, **AJOUTER LES 1 000 NOUVEAUX PROGRAMMES** active volontairement G9. Une ancienne partie G7 conserve d'abord son action **ÉTENDRE AUX 3 000 PROGRAMMES**, puis accède à G9 depuis G8. Consulter le Codex ne déclenche aucune extension.

G9 conserve les implantations G8 et ajoute les candidats compatibles avec routes, parcelles et accès. Le nombre accepté dépend de la seed : les 4 000 fiches consultables ne garantissent pas 4 000 bâtiments sur chaque carte. Un candidat recouvrant un bivouac, un éclairage posé ou bloquant la voiture régionale fait refuser l'extension avant mutation. Les supports se déplacent ou se retirent par leurs actions de terrain.

Les prélèvements, cargaisons et stocks restent conservés. Un relevé de secteur déjà payé couvre ses nouveaux sites ; aucun autre secteur n'est révélé. Les ressources utilisent les sept stocks existants et les budgets finis des contenants natifs. Le format général de sauvegarde reste **v20**, avec G9 comme valeur régionale additive.

## Dessins et variantes

Les **83 modèles D17 et leurs 174 coupes effectives** de la 1.57 restent conservés. Le registre 1.58 raccorde dix PNG sources à **137 dessins utilisés** :

| Ensemble | Dessins utilisés |
| --- | ---: |
| Onze familles d'infectés et spécialistes, huit poses chacune | 88 |
| Neuf silhouettes alternatives de véhicules | 9 |
| Deux dessins pour chacun des six montages mécaniques | 12 |
| Deux dessins pour chacune des treize familles de petits détails | 26 |
| Deux sacs attachés au torse du commandant | 2 |

Les poses sont les phases d'une variante animée, pas huit personnages cosmétiques. Les rangées A/B difficiles à isoler et les deux véhicules lourds trop courts sont exclus des compteurs ; des atlas distincts les remplacent. Les images restent les octets générés, sans retouche de pixels. [La provenance](../assets/art158/PROVENANCE.json) décrit originaux, empreintes, coupes et exclusions ; [PROMPTS.md](../assets/art158/PROMPTS.md) fournit des descriptions normalisées des briefs.

La seed et l'identité stable choisissent les variantes sans RNG de simulation. Les propriétaires gardent actions, poses immobiles, mouvement réduit, états de véhicule, rectangle physique, charge des montages et obstacles des décors. Les sacs complètent les animations existantes du commandant. Les programmes assemblent les meubles et familles de couvertures natifs ; ils ne possèdent pas chacun une illustration de toiture unique.

## Portée et lancement

Les nouveaux lieux servent l'exploration, la circulation, la fouille de réserves finies et leur retour vers D-17. Leurs anciens usages ne créent pas automatiquement soins spécialisés, métiers, production, commerce, réseau d'eau, voie ferrée ou ascenseur. Les onze âges et la boucle récolte → dépôt → construction → automatisation → fortification → horde → reconstruction restent les références.

Les parcours navigateur terminent avec **701 contrôles réussis sur 16 contextes**, codes de sortie 0 : jeu/PWA, arrivée à D-17, campagne, visibilité, extension G9 et HTML autonome servi par HTTP. Les essais avancés déclarent leurs scènes préparées ; le mobile est émulé. Le standalone embarque maintenant les dix PNG art158 après correction du build, avec zéro demande externe lors du rejeu HTTP. Runtime et images restent inchangés par cette correction.

La suite complète avec endurance réussit désormais **3 258/3 258, code 0**, sans échec, annulation ni omission ; les 4 187 fichiers observés restent inchangés pendant le contrôle. La première passe négative (3 256/3 258) reste consignée avec ses deux attentes historiques corrigées, sans ajouter les 27 ciblés au total global. L'audit conserve aussi la fixture de visibilité incompatible avec G8, l'erreur de capture G9 et les PNG externes du premier autonome. **La CI et la publication du futur commit 1.58 restent à constater séparément.**

Avec Node.js ≥22.12 : `npm ci`, `npm start`, puis `DEADWALL_SOAK=1 npm run check` pour la qualification générale. La cible Standard de 6 à 10 heures jusqu'au onzième âge nécessite encore des campagnes humaines complètes. Les contrôles techniques locaux ne certifient pas tous les appareils ou une version prête à la vente.

La publication vise https://deadwall-last-enclosure.vercel.app/. Le 13 octobre, cette production sert la 1.57.2 avec HTTP 200. La publication 1.58 doit être vérifiée après livraison : commit distant, état Vercel, version et octets publics.
