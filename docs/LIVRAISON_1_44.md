# DEADWALL 1.44 — Terrains & reconquête

Cette version poursuit la 1.43 sur les accès physiques, les soins, la préparation logistique et la reconstruction après perte d'une structure. Elle conserve la boucle récolte → dépôt → construction → automatisation → fortification → horde → reconstruction, les générations G1–G7 et le format général de sauvegarde v20.

## Marcher sur les dessertes réelles

Les dessertes privées déjà dessinées en goudron sont reconnues par le sol de marche et son bruit en G4–G7. Auparavant, une desserte traversant un biome boisé pouvait recevoir le profil sous-bois malgré sa chaussée visible. Hors desserte, le biome garde son sol ; l'intérieur garde sa priorité et les collisions physiques sont conservées. Les générations G1–G3, la géométrie, les ressources, identifiants, RNG et prélèvements restent inchangés.

La correction sélectionne le profil de terrain existant ; elle n'ajoute pas de nouvelle table de vitesse ou de consommation. Reprendre une campagne conserve ses coordonnées et ses stocks. Le dossier Survie présente la graine, le milieu et le sol effectivement parcouru, avec ses coefficients à pied : ces lectures ne révèlent pas de lieu et ne déplacent pas le personnage.

## Trouver et utiliser l'escalier

Les boutons ÉTAGE +/− lisent le même diagnostic que l'action réelle, avec approche, niveau disponible et passage d'arrivée. Ils se désactivent quand l'accès n'est pas matériellement disponible. Le HUD fournit une direction (E/SE/S/SO/O/NO/N/NE) et une distance en mètres vers le centre de l'escalier. PageUp/PageDown refusés expliquent le rapprochement attendu, l'intervention ou la conduite en cours, ou le palier obstrué.

Aucun déplacement horizontal automatique n'est ajouté. Véhicule et intervention gardent leurs restrictions existantes ; géométrie, collisions, générations et stocks sont conservés, sans nouveau champ de sauvegarde.

## Préparer et interrompre les soins

Le démontage du bivouac consulte le même diagnostic de manipulation que son bouton : commandant libre et à pied, intervention terminée, absence de rechargement ou de poste de tir occupé, et halte accessible à proximité. Un refus ne supprime pas la halte. Le démontage conserve sa règle historique : les fournitures usagées ne sont pas récupérables.

Un pansement déjà posé est interrompu quand le commandant reçoit une blessure. Le dossier Survie annonce la perte du soin restant ; ce soin ne continue pas au prochain tick. Les fournitures du pansement terminé restent consommées. Une préparation encore inachevée garde sa règle de paiement à la fin : l'interruption ne dépense pas les fournitures qu'elle n'a pas encore utilisées. Les coûts, durées, capacités et registres existants sont conservés.

## Réserves et remise en chantier

La supervision de D-17 avertit si les rations sont insuffisantes ou si les munitions communes ne permettent plus un tir après la consigne de réserve. Le bilan distingue le stock commun et la réserve ; il ne prédit ni les futures productions ni les futures dépenses. Les chargeurs et munitions déjà portés restent sous leurs contrôleurs existants.

La commande historique REMISE EN CHANTIER d'une ruine de D-17 prépare un devis sans dépense, demande confirmation puis revalide le placement normal au coût plein. Elle exige un commandant vivant et à pied dans D-17, pendant le calme ou la sécurisation, un accès physique au contour et des abords sûrs ; rechargement, poste de tir, outil ou activité concurrente peuvent la bloquer. Palier, prérequis, croquis, stocks et emprise sont vérifiés à nouveau à la confirmation. Le devis est temporaire et annulé à la fermeture, à la reprise ou au changement de monde.

Le chantier retrouve le type, la rotation et l'emplacement historiques avec un nouvel identifiant, une priorité de 3 et une progression nulle. Il exige ensuite le travail ordinaire ; logement, stockage, énergie et tirs reviennent seulement après achèvement, et les occupants doivent pouvoir quitter l'emprise. Une confirmation n'est pas un remboursement ou une réparation instantanée. Les débris gardent leur quantité finie et exigent récupération physique, sac et dépôt : aucun butin automatique n'est offert. Le registre existant est conservé sans nouveau champ de format ; la chute du centre garde sa condition de défaite.

## Lire la pression d'assaut

Le HUD distingue les infectés présents, ceux encore en attente et les fronts actifs, avec le prochain échelon de l'assaut. Cette lecture est un bilan agrégé de D-17 : contacts selon les quatre directions et futurs échelons issus du directeur de vague et des contrôleurs existants. Elle ne transforme pas ce bilan en visibilité individuelle des cibles. Le commandement conserve sa vraie pause de simulation et la phase d'assaut pendant l'attente entre échelons.

À l'entrée en alerte ou en assaut, les informations de siège sont mises en vue. En paysage, le rail conserve PRÉPARATIFS, PORTES et SECTIONS pendant la lecture de Personnel ; il se compacte lorsque vous faites défiler les dossiers, sans renvoyer continuellement le défilement en haut. PRÉPARATIFS donne accès au texte complet de l'annonce et de l'alerte. Après fermeture du commandement, le déplacement que vous reprenez au clavier reste maintenu. Si Fin du jour est refusée, sa raison est mise en vue, reçoit le focus et reste affichée pendant les rafraîchissements ordinaires. Ces corrections ne changent pas les effectifs, coûts, dégâts ou contrôles de combat.

## Jouer et mettre à jour

| Support | Démarrage |
| --- | --- |
| Navigateur/PWA | Extraire l'archive web puis servir intégralement `web/` sur HTTPS. Première visite connectée pour remplir le cache hors ligne. |
| Mobile | Même PWA et commandes tactiles ; ajout à l'écran d'accueil depuis le navigateur. Aucun APK ou paquet App Store n'est fabriqué. |
| HTML autonome | Extraire l'archive puis ouvrir `DEADWALL_Standalone.html`. Images, styles et scripts embarqués. |
| Windows 10/11 x64 | Depuis les sources sur Windows : `npm run package:desktop`, puis `npm run test:desktop -- --archive <zip>`. |

Les sauvegardes dépendent du profil et de l'origine du navigateur : exporter une campagne avant changement de site, d'adresse, de navigateur ou de chemin. Le portable Windows utilise son profil séparé `%APPDATA%\DEADWALL`. Les archives et références 1.41–1.43 restent conservées séparément.

## Vérification et fabrication depuis les sources

Node.js 22.12 minimum, 24 conseillé. Les commandes de fabrication exigent un dépôt Git contenant un commit pour consigner la provenance ; l'archive source n'embarque pas `.git`. Démarrage, build et QA restent utilisables depuis les sources extraites.

```sh
npm ci
DEADWALL_SOAK=1 npm run check
npx playwright install chromium
npm run test:browser
npm run test:campaign
npm run test:tactics
npm run test:journey
npm run test:assault
npm run test:reconstruction
npm run test:standalone
npm run package:web
npm run package:source
```

`CHROMIUM_EXECUTABLE_PATH` sélectionne un Chromium déjà installé. `test:journey` utilise la graine 54831 et des commandes natives sur quatre formats, sans injecter stock, acteur, position ou temps. Le parcours consulte carte, atlas et biomes, effectue une marche physique, recrute, garde un dossier ouvert puis rejoint une alerte/assaut par la vraie fin de préparation. Il complète `test:campaign` sans répéter toute sa boucle de récolte/dépôt/construction. Ses rapports et captures vont sous `artifacts/qa/journey-*`.

`test:assault` prépare explicitement une scène avancée : vague 8 avec budget borné à 24 infectés répartis entre les huit profils et plan en trois échelons. Les deux premiers sont émis par Dayworks et la simulation RAF ordinaires ; le troisième reste annoncé et en attente à la fin du parcours. Cinq contacts sont repositionnés explicitement pour exercer les quatre directions et l'alerte intérieure avec une composition maximale du HUD. Sur desktop, portrait et paysage mobile, le scénario contrôle présents/à venir/fronts, pause réelle et sauvegarde/reprise. Ces fixtures ne constituent pas une vague 8 obtenue après huit nuits jouées naturellement. Ses rapports vont sous `artifacts/qa/assault-*`. Les scénarios avancés `test:tactics` gardent également leur identification explicite de fixtures ; `test:campaign` conserve son parcours natif à la graine 17117.

`test:reconstruction` prépare lui aussi une fixture avancée : position, stocks et destruction d'une structure sont fournis au scénario. Sur desktop et mobile, il utilise les vrais contrôles de devis, d'annulation, de confirmation et d'ACTION, puis fait progresser la construction explicitement pas à pas par le contrôleur existant, avec RAF désactivé. La reprise est ensuite comparée. Le scénario ne prétend pas avoir obtenu ses stocks ou détruit la structure en jouant naturellement. Les rapports du harness permanent identifient ces fixtures et leur portée.

Le cloud administré bloque `file://` : `npm run test:standalone -- --transport http` contrôle les octets autonomes via un serveur local, distinct d'une ouverture disque. Les archives joueur embarquent ce guide, les licences et la provenance des images, avec liste exacte des fichiers et SHA-256 par fichier et par ZIP. Sources, tests, codex et fixture historique vont dans l'archive de développement séparée. Chaque fabrication crée un nouveau dossier `build-*`.

## Parcours navigateur sur les sources figées

Le 2 octobre 2026, les cinq parcours suivants ont terminé avec leur rapport en version 1.44.0 et aucune erreur JavaScript, console, HTTP ou requête enregistrée :

| Parcours | Contrôles réussis | Formats et portée |
| --- | --- | --- |
| `test:campaign` | 148/148, 37 par format | Quatre formats ; graine 17117, boucle récolte/dépôt/construction payée et premier assaut par commandes natives. |
| `test:journey` | 208/208, 52 par format | Quatre formats ; graine 54831, carte/biomes, commandes et assaut naturels, sans fixture. |
| `test:assault` | 69/69, 23 par format | Desktop, portrait et paysage ; vague/temps et positions de contacts explicitement fournis au scénario avancé. |
| `test:reconstruction` | 16/16, 8 par format | Desktop et portrait ; stocks/position/destruction fournis, construction contrôlée pas à pas, RAF désactivé. |
| `test:tactics` | 34/34, 17 par format | Desktop et portrait ; redoute/fusilier, objectif acquis et stockage plein préparés comme fixtures. |

Les quatre formats natifs sont desktop 1440×900, laptop 1280×720, tactile portrait 390×844 et tactile paysage 844×390. Les deux parcours natifs n'injectent aucun stock, position, acteur ou temps. Les scénarios avancés conservent leurs déclarations de fixtures et ne sont pas des campagnes obtenues naturellement. Ces assertions navigateur restent distinctes des tests Node et de la QA depuis les archives finales.

Le nouveau parcours natif vérifie notamment la reprise immédiate du déplacement après fermeture du commandement, le défilement tactile et la lecture de Personnel sous le rail d'alerte en paysage, la carte et les biomes, le refus visible puis la confirmation de fin de préparation, l'assaut naturel et la reprise de sauvegarde. Rapports JSON et captures sont conservés séparément des archives joueur. Aucun de ces parcours ne certifie un appareil physique ou l'équilibrage d'une campagne longue.

## Validation complète des sources

Le 2 octobre 2026, `DEADWALL_SOAK=1 npm run check` a réussi **2482/2482 tests**, sans échec, annulation, test ignoré ou restant à faire. Le contrôle de syntaxe couvre **202 fichiers** et le build produit **209 fichiers publics**. La commande complète, build compris, a terminé avec le code 0 en 1399,939 secondes, soit environ 23 minutes 20 secondes. Les 622 fichiers exécutables figés avant le contrôle conservent leurs empreintes après exécution.

Ces résultats et le tableau navigateur portent sur les sources figées. Les contrôles d'intégrité et les parcours depuis les archives finales font l'objet d'un rapport distinct, produit après fabrication. Les tests, parcours, captures et archives 1.43 restent historiques et ne certifient pas la 1.44.

## Étapes commerciales restantes

Fabriquer et essayer le portable sur Windows, puis évaluer les commandes tactiles sur téléphones physiques. Sessions humaines longues, lisibilité, audio, accessibilité, équilibrage et performances demandent les appareils cibles. Signature éditeur, conditions accordées aux joueurs, assistance, classification et fiche boutique restent à finaliser avant mise en vente.

La note de distribution se trouve dans `docs/THIRD_PARTY_NOTICES.md` avec les sources et `NOTICES_TIERS.md` avec les archives joueur. La licence source propriétaire reste applicable. Aucun déploiement, publication en boutique, signature Windows ou certification matérielle n'est annoncé.
