# Logistique — 1.39

Cette passe utilise le jeu chargé dans l’ordre exact des scripts de `index.html`, via `bootDocument134`. Les scènes de test sont préparées ; les décès, la sélection de relève, la chute de module, la réanimation, les transferts et les sauvegardes passent par les contrôleurs livrés. Il ne s’agit pas d’une campagne humaine ni d’un contrôle CSS en navigateur.

## Défauts reproduits et corrections

| Cas | Preuve 1.38 | Correction 1.39 |
| --- | --- | --- |
| Module tombé derrière un angle de maison | Deux positions libres, distantes de 48,08 unités : décès à 1839/2031, relève à 1873/2065. Le retrait réussissait alors que le rayon physique complet était coupé. | `essentials.takeGround` utilise le rayon local partagé de `nightGear.localLineClear`, comme le sac de succession et les soins. |
| Kit pendant le contrôle manuel d’un mirador | Au poste #6, depuis une approche commune avec le dépôt, l’assemblage d’une trousse terminait et débitait le coût pendant que le même poste restait monté. | L’état monté rend indisponibles les tâches et manipulations essentielles avant leur transaction. Le joueur rend volontairement le contrôle du poste. |
| Transfert pendant le contrôle du mirador | Le dépôt perdait 3,125 ferrailles, le sac gagnait 3,125 et le poste restait monté. | `loadout.transfer` vérifie aussi le contrôle manuel avant de toucher les conteneurs. Le rangement graphique des piles reste possible sans modifier les quantités. |
| Corps relevé ignoré par la sécurité régionale | Graine 6 : décès à 9771/15076, puis compteur réel de réanimation avancé. Un relevé visible de 65 PV à 1,5 m n’empêchait pas de retirer le module. | `essentials.safe` consulte les contacts de succession, avec les mêmes portée, visibilité et étage. |
| Horde sauvage ignorée par la sécurité régionale | Graine 17117 : près de W0000, 36 contacts sauvages visibles à portée et aucun contact de POI ; le retrait du module réussissait. | La même garde consulte les vrais membres de groupes existants, y compris les contacts sauvegardés avant leur premier tick de reprise. |

Les sources modifiées sont `src/essential-ops.js` et `src/loadout129.js`. Aucun profil, coût, rendement, plafond, durée, format de sauvegarde, placement ni générateur n’est ajouté ou changé. Une action refusée n’altère aucun stock ; une récupération réussie ne peut être répétée. Le module reste distinct du sac de ressources de la dépouille.

## Vérifications

`tests/logistics139.test.cjs` contient quatre scénarios intégrés. Ils vérifient l’obstacle, la restitution du poste, la neutralisation du relevé, les contacts sauvages à la reprise, les refus sans dépense, les quantités fractionnaires et l’unicité de la récupération. Les quatre scénarios échouent exactement sur leurs anciennes autorisations fautives lorsqu’ils sont exécutés sur la source 1.38 extraite de l’archive autoritative, sans la modifier.

Le groupe de régressions initial comprend 132/132 tests réussis pour les kits, soins 1.38, inventaire, terrain, lampes et succession. Après le dernier raccord de sécurité et la garde de transfert, la validation ciblée finale réussit 67/67 tests, dont les quatre nouveaux scénarios. Les sorties exactes sont dans `reports/1.39.0/logistics139-final.log` ; la validation complète de la livraison relève du contrôle global de cette version.

L’inspection n’a pas démontré de défaut supplémentaire du plafond commun de huit objets, du soin régional, du paiement unique des assemblages, de la conservation du reliquat ni du devis périmé de réimplantation : les contrôleurs correspondants sont conservés. La sélection d’un aperçu de construction pendant une préparation n’est pas utilisée comme preuve d’un double travail réel et n’entraîne aucun changement préventif.

## Preuves conservées

- `logistics139-probe.log` : angle de maison et vraie chute après décès.
- `logistics139-mounted-probe.log` : assemblage terminé sous poste monté.
- `logistics139-mounted-transfer-probe.log` : transfert fractionnaire sous poste monté sur la source 1.38.
- `logistics139-risen-probe.log` : corps réellement relevé ignoré par l’ancienne sécurité.
- `logistics139-wild-probe.log` : vrai groupe généré ignoré sur la source 1.38.
- `logistics139-baseline138.log` : scénarios de régression exécutés sur la source précédente.
- `logistics139-regressions.log` et `logistics139-final.log` : contrôles ciblés de correction et de continuité.
