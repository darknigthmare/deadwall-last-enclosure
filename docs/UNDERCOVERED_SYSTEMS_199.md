# 199 — Entretien de terrain, eau portée et cas limites

Cette continuation part du commit `5fccf78b553300fc7fc1411ee339d68a6f381be3`, tête qualifiée de la PR #10. La branche des menus reste intacte. La suite est proposée séparément et dépend de son intégration ; aucune fusion ni publication de production n'est effectuée. `199` est un repère de développement, pas une nouvelle version commerciale.

## Ce qui a été réalisé

### Une réserve d'eau commune au terrain et aux secours

**Carnet → Dossiers → Sur le terrain → Opérations → Fiche d'action « Enclos & transformation ».**

Le personnage peut désormais remplir son seau sur une berge réellement praticable d'eau douce, puis apporter cette eau à un enclos situé loin de la rivière. Le puisage demande six secondes et fournit au maximum six unités, dans un seau de huit. Le versement demande trois secondes et transfère au maximum six unités, limitées par l'eau effectivement portée et les quarante unités de capacité de l'abreuvoir.

Le seau est **le `siege.playerWater` existant**, déjà utilisé par les secours incendie : ni inventaire parallèle, ni réserve gratuite au démarrage. Les citernes, l'extinction, les besoins de l'enclos et la mort du commandant partagent la même quantité. L'eau naturelle collectée est comptabilisée dans `waterProduced`, et celle versée aux animaux dans `waterUsed`. Ces compteurs décrivent donc de l'eau de service, pas uniquement l'activité des pompiers.

La côte salée, les ponts, les obstacles solides, une position dans l'eau, une menace proche et les mains occupées refusent l'action. Le contrôleur de terrain revalide la source ou la destination pendant le travail et avant sa transaction synchrone. La pause ne produit rien. Interrompre le puisage ne remplit rien ; interrompre le versement laisse l'eau non encore versée dans le seau. Une reprise n'achève pas gratuitement une intervention interrompue. Le décès perd une seule fois la quantité portée, jamais celle déjà dans les abreuvoirs. **Cette eau n'est pas une boisson potable** et ne donne pas la nage au personnage ou aux véhicules.

Les gestes utilisent le dessin attaché du seau existant, avec la progression réelle et la réduction des animations. Le joueur peut ranger l'outil incendie avant de commencer son intervention ; l'eau demeure dans le même seau.

### Réparer sans abattre ses animaux

Une clôture endommagée mais encore debout reçoit jusqu'à vingt-cinq points d'intégrité après six secondes, contre trois bois et deux ferrailles portés, payés au début. Le plafond reste cent. Il n'est plus nécessaire de transformer un animal pour obtenir du cuir afin d'effectuer une première réparation. Le renfort au cuir reste disponible séparément.

Annuler ne rembourse pas le matériel engagé. Une destruction pendant le travail ne peut pas être annulée par la réparation : il faut la reconstruction existante. Les produits, l'âge, la santé, l'identité et les besoins des animaux ne sont pas remis à zéro. Les nombres sont centralisés dans `Husbandry191Rules`.

### Maîtriser les naissances et les comportements

Le joueur peut suspendre ou réautoriser les naissances par enclos, sans arrêter l'alimentation, l'abreuvement, la croissance ou la péremption. Le changement remet à zéro l'attente de naissance ; il ne crédite pas une naissance presque achevée après réactivation. Seules les espèces déjà reproductibles le restent.

La préférence optionnelle `breeding199` est un booléen enregistré sur l'enclos. Un ancien enregistrement dépourvu de ce champ conserve son comportement et sa représentation sérialisée jusqu'à une décision explicite. Une suspension associée à une attente non nulle est refusée. La compatibilité de ces nouvelles sauvegardes avec un ancien exécutable n'est pas promise.

Les comportements naturels optionnels peuvent aussi être désactivés de nouveau. Une alternance activation/désactivation ne remet pas les délais d'attaque à zéro. Ce réglage ne change pas la graine ou le nombre d'animaux.

## Défauts reproduits puis corrigés

- **Types d'espèces :** le validateur acceptait des noms hérités de l'objet JavaScript, comme `constructor`, au lieu d'exiger une espèce du catalogue. Les noms doivent être des chaînes et des propriétés propres du registre. Les erreurs d'objet d'enclos restent des refus lisibles.
- **Équipement occupé :** une arme déployée possédée ou l'outil incendie ne bloquaient pas tous les travaux d'enclos. Le refus intervient avant paiement et s'applique aussi à la poursuite d'une tâche.
- **Pénurie partielle :** une réserve couvrant une partie du pas de simulation infligeait néanmoins la pénalité du pas entier. La perte de santé dépend maintenant de la fraction réellement non couverte par la nourriture ou l'eau. Une pénurie complète reste dangereuse ; aucune guérison gratuite n'est ajoutée.
- **Création de campagne interrompue :** si un autre créateur levait une exception après un reset et sans remplacer le monde, le wrapper de cueillette pouvait perdre son historique fini. Il le restaure désormais dans `finally`, avec sa tâche et son cache. Ce correctif concerne ce propriétaire, pas une prétention de rollback global de tous les modules.
- **Retour de sauvegarde :** une intervention ne prétend plus avoir sauvegardé ses stocks si l'écriture échoue. L'état en mémoire reste utilisable et un avertissement demande un export. Cela ne garantit pas la conservation après fermeture lorsque le stockage est indisponible.

## Qualification et provenance

Les sources initiales et leurs identifiants Git ont été récupérés depuis la tête immuable des menus ; tous les fichiers présents, assets compris, ont été rapprochés de leurs empreintes. Le code des menus, les atlas et les générateurs de monde ne sont pas modifiés.

Les nouveaux contrats couvrent le seau partagé, ses limites et pertes, la pause, les interruptions, les réparations payées, les préférences de naissance, les délais de riposte, les registres invalides, la consultation sans mutation et les gestes procéduraux. Des scénarios du moteur natif emploient des animaux et un enclos réellement générés/construits, avec stocks et positions de préparation déclarés ; ils vérifient la reprise et le décès. Les journaux antérieurs aux corrections conservent les défauts reproduits.

`browser-undercovered199.mjs` ouvre l'URL **joueur**, sans `tools=1`, et utilise les vrais boutons ordinateur/tactiles sur `dist`. Les trois formats doivent réussir. La position de construction, les fournitures, les déplacements de préparation vers une berge réelle et la clôture préalablement endommagée sont explicitement déclarés. **Aucune eau n'est injectée** : le puisage passe par l'action native. Le temps du contrôleur est avancé explicitement après arrêt de RAF ; cela ne certifie ni une expédition naturellement jouée, ni la fluidité, ni un appareil physique.

Le navigateur local de cette session n'a pas de binaire Chromium installé ; la tentative a échoué avant navigation. Le workflow permanent exécute le parcours sur GitHub avec les dépendances verrouillées. `DEADWALL_SOAK=1 npm run check` a été lancé séparément. Les résultats exacts, leur SHA et leurs limites sont consignés dans la PR et les reçus de livraison ; un lancement en cours n'est pas une réussite. Les groupes recouvrants ne sont pas additionnés.

## Zones peu couvertes encore à traiter

| Domaine | État après cette passe | Prochaine réception nécessaire |
|---|---|---|
| Eau et soins aux enclos | Transport manuel et réparation finie raccordés ; gestion locale. | Tournées de vrais PNJ avec sacs, trajets et incidents ; pas de service distant gratuit. |
| Captivité et produits | Capture fixe, élevage, cuisine/tannage existants conservés. | Cages transportables, transfert entre sites, transport des matières brutes, commerce/vêtements. |
| Écologie | Population déterministe et prédation locale existantes conservées. | Migrations longues, consommation des carcasses, navigation aérienne complète et effets hors secteurs. |
| Personnage et présentation | Gestes de maintenance raccordés ; coûts et commandes conservés. | Rig corporel complet, transitions d'équipement, sous-menus métier et HUD de combat en situation dense. |
| Sauvegardes | Refus et interruptions ciblés renforcés. | Endurance très longue, quotas réels, nombreux profils/versionnements et bascules multi-onglets. |
| Ville verticale et civils | Réseau et métiers déjà présents, inchangés. | Intérieurs libres, relèves, logements individuels, congestion et logistique automatisée exhaustive. |
| Coopération | Relais de présence existant, inchangé. | Monde partagé autoritaire, inventaires/transactions, reconnect et sauvegarde commune. |
| Progression et performance | Pas de nouveaux chiffres de performance ou d'équilibrage inventés. | Campagnes humaines complètes et mesures comparables sur les appareils ciblés. |

Cette matrice est une revue fonctionnelle, pas un pourcentage de couverture de code. Les grandes extensions citées ne sont pas déclarées implémentées par ces corrections ciblées.
