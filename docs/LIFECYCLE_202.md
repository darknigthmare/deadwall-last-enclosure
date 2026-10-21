# 202 — Récoltes conservées et présence réseau correctement fermée

Base examinée : `main` `6c6fbb6cf563bea6c89ade99c65f18c438481532` (DEADWALL 1.68), après fusion de la PR #12. La PR #14 sur les dimensions de D-17 et les routes est indépendante et n'est pas modifiée. Le suffixe 202 sert au suivi technique, pas à annoncer une version commerciale.

## État de livraison

Le correctif 202 avait été livré localement sans publication. Il est repris avec la continuation 203 sur la base exacte 1.68 ; les résultats et limites de cette nouvelle qualification sont consignés dans `PRODUCT_TRANSPORT_203.md` et la PR. Les preuves ci-dessous décrivent **la passe locale initiale**, pas les résultats du nouveau commit. Aucune fusion ni promotion en production n'est effectuée.

## Récoltes et campagne refusée

Le wrapper de `wildlife-harvest190.js` protégeait uniquement un retour normal du créateur de campagne. Si un autre propriétaire nettoyait les extensions puis levait une exception sans remplacer le monde, le registre fini des parts prélevées et l'action déjà payée étaient perdus.

Le wrapper utilise maintenant `try/finally`. Il conserve le registre, l'action, le message et le cache du menu **uniquement si l'identité du monde reste identique**. Si un nouveau monde a effectivement été installé, il ne réinjecte jamais l'historique de la campagne précédente, même en présence d'une erreur ultérieure. Ce contrat concerne ce propriétaire ; il ne promet pas un rollback général des mutations d'un créateur arbitraire.

La reprise de la même action conserve son paiement initial et son progrès. Elle ne crédite ni remboursement ni récompense immédiate et ne transforme pas le rechargement d'une sauvegarde en travail achevé. Les règles ordinaires d'interruption et de validation continuent à s'appliquer.

## Mains réellement disponibles

Pêcher ou préparer une dépouille est refusé lorsque le personnage possède un affût ou utilise l'équipement de secours incendie. Le refus intervient avant toute dépense ou immobilisation de poisson. Ces conditions sont également revérifiées pendant le travail : s'équiper après paiement interrompt sans rembourser le matériel ni produire de nourriture.

Ranger l'équipement ou quitter l'affût rétablit l'opération normale. Aucun nouvel outil, stock distant, coût, rendement ou format de sauvegarde n'est introduit.

## Élevage et état temporaire de la faune

Lors d'une création abandonnée sans changement de monde, le wrapper d'élevage préservait le registre et la tâche, mais pas les délais d'attaque ni la cadence des sons. Les resets allouent maintenant une nouvelle table de délais, de sorte que la table du monde conservé demeure récupérable. Le wrapper restaure également le temps restant avant le prochain son.

Le changement effectif de monde conserve son reset normal. Les morts, soins, animaux, naissances et produits restent sous leurs propriétaires historiques. Ce changement n'ajoute ni nouvelle espèce ni migration ni animation corporelle.

## Présence coopérative

Une connexion fermée n'est plus présentée comme « compatible ». La fermeture nettoie l'identité vérifiée, les contacts, les repères et le délai d'admission, sans affecter une connexion plus récente.

Après l'ouverture du transport, la confirmation de carte est limitée à **10 secondes de temps réel**, indépendamment de la pause de simulation. Sans réponse compatible, le client ferme cette tentative et affiche un message demandant une reconnexion explicite. Il n'ouvre pas une boucle de reconnexion automatique. Ce délai ne prétend pas contrôler la durée de l'ouverture initiale du transport WebSocket.

Un accusé valide annule le délai. Une réponse tardive ne peut plus réactiver une tentative expirée. Les callbacks d'anciennes connexions ou d'anciennes admissions sont inoffensifs. Un déclenchement anticipé du timer est réarmé pour le temps restant. Dans un intégrateur sans timers, la vérification se fait lors d'une mise à jour ou d'une réponse exploitable.

Une file réseau saturée ne conserve plus à tort l'identité précédente comme déjà rejointe : aller de A vers B puis revenir à A avant l'envoi réussi déclenche une nouvelle admission. Les identités de carte, règles d'étage, limites de messages et copies en lecture seule sont conservées. Il ne s'agit toujours pas d'un monde multijoueur autoritaire.

## Historique des preuves locales 202 et de leurs limites

Les trois préimages modifiées et le fichier `core.js` utilisé par les contrats correspondent aux identifiants Git de la base 1.68. Le relais source utilisé correspond également à cette base. Les autres fichiers de l'espace local ont été reconstitués à partir d'archives antérieures : **cet espace n'est pas certifié comme un checkout intégral de main**. Aucun build intégral ou `npm run check` n'est revendiqué.

Le dernier groupe ciblé passe **100/100 tests**, dont **32 nouveaux**, zéro échec, annulation, ignoré ou TODO. Il inclut de vrais échanges WebSocket locaux, en plus des bancs VM des commandes et du cycle de vie. Les bancs de terrain utilisent les vrais modules ciblés et les règles du core, mais des acteurs/positions/transport de stocks explicitement préparés : ce ne sont pas des campagnes naturellement jouées.

Sur la série initiale de 31 nouveaux cas, **22 échouaient avant correction**. Il s'agit de cas de test, pas de 22 défauts indépendants. Les journaux avant correction et les étapes intermédiaires sont conservés séparément. Un groupe plus large a été interrompu par le timeout de la commande locale : il n'est pas annoncé réussi.

Une tentative Chromium avec vrai serveur local a été refusée avant navigation par `ERR_BLOCKED_BY_ADMINISTRATOR`, avant toute assertion navigateur. Aucun contournement et aucune capture de jeu ne sont revendiqués. Le script proposé teste seulement les transports avec un jeu factice volontairement en pause, pas les écrans ou les performances du jeu. Sa version finale et le workflow fourni restent **à exécuter sur un checkout complet**, avec les dépendances verrouillées.

Les tests ciblés locaux ont été exécutés avec Node 22.16.0 et des dépendances déjà présentes ; ce n'est pas un nouveau `npm ci`. Le workflow proposé utilise les conventions Node 24 du dépôt, ne demande que `contents: read`, et ne remplace aucune suite globale existante.

## Réception encore nécessaire

Avant fusion : application sur une branche de travail propre, revue du diff, réinstallation verrouillée, suite ciblée, build, parcours réel de jeu, tests natifs exhaustifs avec endurance et qualification Windows. Les résultats du main ou d'une autre PR ne certifient pas ces nouvelles sources. Le script d'application ne pousse ni ne fusionne rien.
