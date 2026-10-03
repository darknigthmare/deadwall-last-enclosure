# Logistique — 1.40

L’audit vise les contrôleurs de possessions et de soin encore accessibles dans le HTML livré, y compris le panneau historique « SAC & RELAIS ». Les nouveaux scénarios utilisent `bootDocument134`, l’ordre réel de `index.html`, les boutons montés et les contrôleurs de récolte, décès, relève, réanimation et sauvegarde. Les positions sont préparées sur des accès physiquement libres. Ces tests ne constituent pas un audit CSS ni une campagne humaine en navigateur.

## Défauts reproduits

| Cas | Preuve sur la source 1.39 en lecture seule | Correction |
| --- | --- | --- |
| Ancien soin de terrain devant un relevé | Graine 6, décès régional à 9771/15076 ; après le vrai délai de réanimation, relevé visible de 65 PV à 1,5 m. `supplyHeal` était actif et commençait le traitement. | La sécurité de `fieldSupplies` consulte aussi les contacts de succession et les membres des groupes sauvages, avec les mêmes rayon, étage et visibilité. |
| Ancien soin devant une horde sauvage | Graine 17117, approche libre du vrai groupe W0000 ; les contacts sauvages visibles à portée ne désactivaient pas le soin, y compris après sauvegarde. | Le même contrôle tient compte des membres existants, disponibles avant leur premier tick de reprise. |
| Dépôt de ressources par l’ancien panneau | Récolte physique de huit bois, puis clic sur `supplyDeposit-wood` : dépôt 180→188 et sac 8→0, mais `depositedResources` restait à zéro. | La transaction compte exactement la quantité réellement déposée au dépôt de D-17 ; coffre, relais et retrait gardent leurs propres rôles. |
| Premier geste de dépôt oublié par les deux panneaux | Le dépôt par inventaire comptait déjà les ressources, mais le prologue restait à zéro. Deux clics transféraient 8 puis 0,125 dans les 8,125 places libres, sans valider ce geste personnel. L’ancien panneau avait aussi ce défaut. | Un observateur personnel unique dans `chronicles131` est appelé par chaque transaction réussie au dépôt et par l’interaction E. Les livraisons d’ouvriers restent exclues. |

Les trois sources corrigées sont `src/frontier-care.js`, `src/loadout129.js` et `src/chronicles131.js`. Aucun coût, soin, durée, plafond, formule de statistiques, format de sauvegarde, monde ni profil n’est changé. Le compteur de dépôt existant reçoit une transaction qu’il omettait. Aucun autre propriétaire de ressource n’est ajouté.

## Vérifications

`tests/logistics140.test.cjs` couvre quatre scénarios intégrés : refus devant un relevé, refus devant une horde sauvage après reprise, récolte et dépôt par l’ancien panneau, puis dépôt fractionnaire par l’inventaire. Les boutons refusés ne prélèvent rien. Après neutralisation du relevé, le soin normal reste de 35 PV pour deux médicaments portés, payés une seule fois après quatre secondes ; une pause ne le termine pas. Le dépôt distant de médicaments ne paie pas ce soin.

Les dépôts vérifient les quantités des deux conteneurs, leur reliquat, le compteur existant et le geste personnel avant et après sauvegarde. Un stockage plein ou un sac vide n’ajoute aucun dépôt. L’interaction E n’est pas observée deux fois ; une livraison d’ouvrier augmente le compteur collectif et ne remplace pas le geste personnel. La scène de retour ne se rejoue pas après reprise.

Les quatre scénarios échouent sur leurs assertions de défaut dans la source 1.39, chargée en lecture seule par `DEADWALL_LOGISTICS_ROOT`. Les régressions ciblées réussissent **91/91 tests**, sur `logistics140`, `logistics139`, `supplies118`, `loadout129`, `chronicles131` et `essential122`. Le bilan exact est consigné dans `reports/1.40.0/logistics140-regressions.log` ; la validation complète de la livraison relève du contrôle global de cette version.

## Alertes écartées

Le soin essentiel régional ne soigne pas deux fois : `frontier.ensure` indique déjà `player.regionAbsent`, ce qui exclut ce joueur de la boucle des soins locaux avant son soin régional. Les transferts d’inventaire pendant un soin historique sont aussi déjà bloqués : `expansion-kit.busy` inclut `fieldSupplies` et `essentials`. Ces contrôleurs sont conservés, sans garde préventive supplémentaire.

## Preuves

- `logistics140-heal-before.log` : bouton de soin effectivement actif devant le relevé dans la source 1.39.
- `logistics140-deposit-before.log` : vraie récolte et vrai bouton de dépôt, quantités transférées mais progression absente.
- `logistics140-baseline139.log` : quatre échecs attendus de la version précédente.
- `logistics140-regressions.log` : scénarios corrigés et régressions des soins, kits, inventaire et chroniques.
