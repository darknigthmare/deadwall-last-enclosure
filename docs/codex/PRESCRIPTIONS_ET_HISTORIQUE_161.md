# Passe 161 — Prescriptions consultables et historique de campagne

Base initiale : `3ed438f6105d69298af98a0678db591008e81844`, puis intégration de `8d4903595791c9e0dc7e94ab9bc483a48aa0529a` (mobilier ancré et révision de détail 3 conservés), PR #2, version du paquet 1.57.0. Aucun changement direct de main, aucune fusion ni publication de production.

## Correction reproduite : une campagne, une identité finale

Le démarrage traversait plusieurs initialiseurs historiques. Des sauvegardes enregistraient d'abord `run:<uuid>`, puis `startNew125` ajoutait `:g4` et sauvegardait de nouveau. Le profil retenait donc deux campagnes pour un seul départ. Le diagnostic des expressions natives a réellement reproduit deux lignes dans les archives.

La passe diffère uniquement `recordCampaign` pendant cette initialisation et publie la dernière demande après un démarrage réussi. La sauvegarde, les stocks, les identifiants des parties existantes et le suffixe historique `:g4` restent conservés. Un démarrage refusé ou une exception libère la garde sans publier un historique partiel. Les anciennes archives ne sont ni fusionnées ni supprimées automatiquement.

## Codex : les prescriptions sources sont lisibles dans les fiches

Chaque mobilier auteur expose quantité, longueur/largeur/hauteur, dégagement proposé, ancrage, orientation, collision prescrite et éligibilité au budget de butin. Les espaces montrent niveaux, répétitions et règle de placement. Les accès décrits affichent leurs extrémités nommées, largeurs et contraintes. Les parcelles montrent leur emprise et leurs stationnements ; les jardins détaillent leur composition et l'absence de duplication des équipements uniques.

Les états causaux séparent cause, circulation, ressources et éclairage. Les informations absentes restent explicitement non renseignées, notamment les sources sans accès détaillés. Aucune dimension réglementaire, interaction, porte ni quantité de stock n'est inventée.

Le parcours conserve les 3 000 programmes et leurs références héritées : 13 680 espaces, 18 117 occurrences de mobilier source. Ces occurrences ne sont pas autant d'architectures ni de sprites indépendants. Les prescriptions ne prouvent pas que leur contenu est déjà placé dans la carte. La pagination par 36 et le chargement à l'ouverture des fiches restent en place. Les sections sont adaptées aux petits écrans sans ajouter de sous-menus repliables imbriqués.

## Contrat de la vérification native

Le contrôle des fronts du smoke test Windows comparait encore des contacts omniscients et le texte « contacts actifs ». Il utilise désormais `observedSnapshot` et le libellé actuel « contact(s) observé(s) », comme l'interface et ses règles de visibilité. Aucun assouplissement du contrôle de compte, de sauvegarde ou de sécurité native.

Un diagnostic Chromium a exécuté les expressions fonctionnelles du smoke test : menu, commandes, historique, sections, fronts et récit. Après les deux corrections, ce parcours termine sans erreur. Il ne certifie pas Electron Windows, son protocole, son archive, ses deux processus ou le plein écran ; la CI Windows doit encore les vérifier sur le commit publié.

## Contrôles terminés avant publication

- 11/11 tests : trois régressions d'identité de campagne et huit tests existants d'introduction. Aucun échec, annulation ou skip.
- 2/2 tests des prescriptions : parcours des 3 000 sources, restitution des dimensions/ancrages/quantités et absence de mutation, champs absents et valeurs nulles de quantité.
- 40/40 contrôles du nouveau parcours navigateur : 1440×900, 1280×720, 390×844 et 844×390. Vrais boutons de départ et de consultation, identité unique, contenu source, réouverture sans doublon, sauvegarde inchangée et absence de débordement horizontal.
- `npm run test:browser` termine avec code 0 : 171 contrôles sur quatre formats, puis 30 contrôles PWA sur deux formats. Chargement des 278 fichiers attendus, images, création et reprise hors ligne.
- Le build exécuté termine avec code 0. Le cache PWA devient `deadwall-v1.57.0-codex-prescriptions161`, sans nouveau fichier public.

Les captures automatisées ne sont pas annoncées comme revues artistiquement. Les profils mobiles sont émulés, pas des tests sur téléphones physiques.

Le précédent commit 160 a obtenu 2 979 tests de code réussis dans la CI avec endurance ; ce résultat concerne ce précédent commit. La validation complète du nouveau commit, le portable Windows et les autres campagnes navigateur ne sont pas déduits de ce résultat. Cette PR reste en brouillon jusqu'à leur achèvement.

## Commandes reproductibles

```sh
node --test tests/campaign-records161.test.cjs tests/campaign-intro132.test.cjs tests/codex-prescriptions161.test.cjs
npm run build
npm run test:browser
node scripts/browser-prescriptions161.mjs
DEADWALL_SOAK=1 npm run check
```

La CI conserve toutes ses étapes et ajoute le parcours `browser-prescriptions161.mjs`. Aucun coût, rayon, capacité de stockage, réglage des ennemis ou asset graphique n'est modifié. Les architectures G8 restent simplifiées ; ports, tunnels et échangeurs complets ne sont pas livrés par cette passe.

## Vérification après intégration du commit concurrent

Après reprise sur `8d49035`, les quatre fichiers de tests ciblés (identité, introduction, prescriptions et ancrages) terminent **19/19**, sans échec, annulation ni skip. Le nouveau parcours quatre formats termine à nouveau **40/40**. Le parcours existant `browser-anchors160.mjs` termine sur desktop et mobile avec recherche, dimensions, sauvegarde stable, trois meubles ancrés peints et navigation conservée. Ces répétitions ne sont pas additionnées aux premières comme tests distincts.
