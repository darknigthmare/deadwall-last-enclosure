# 200 — Soins des captifs, présence par carte et commandes conservées

Suite de la PR #12 (`cdba413`) réconciliée avec le main `70491e9a9defbc6334d304990353a5ed68d663d2`. Le main contient désormais les menus et les correctifs de fiabilité de la PR #11. Les deux ensembles sont conservés : les enclos gardent le transport d'eau et les préférences de naissance, mais aussi le registre global et les protections audio/sauvegarde de main. Aucun changement de graine, de génération, de peuplement initial ou de carte d'une sauvegarde existante.

## Soins sur place, pas résurrection ni soin distant

Dans **Carnet → Dossiers → Sur le terrain → Opérations → Enclos & transformation**, chaque animal vivant sous garde dispose d'une action **Soigner**. Une unité de médicament réellement portée est engagée au début ; six secondes de travail apportent au maximum 25 points de santé, plafonnés à 100. Les valeurs sont dans `Husbandry191Rules` de `src/core.js`.

La pause ne progresse pas. Éloignement, blessure, menace, mains occupées ou perte du sujet interrompent le travail sans remboursement et sans soin partiel gratuit. Une mort pendant le soin reste terminale. La faim et la soif continuent pendant le travail : soigner ne remplace pas l'entretien. Les fournitures et les stocks du dépôt distant ne sont jamais utilisés. Il faut reconstruire un enclos détruit avant de traiter ses occupants.

Le registre affiche la santé du captif le plus faible et la suspension explicite des naissances. Les consultations ne modifient pas la simulation. Un geste de pansement procédural est attaché aux avant-bras et au progrès réel de la tâche ; il respecte la réduction des animations. Ce n'est pas une nouvelle animation corporelle complète.

L'identité de l'animal, ses parents, son âge et ses produits ne sont pas réinitialisés. Les soins payés sont conservés à la sauvegarde et, pour les fondateurs relâchables, à la remise en liberté : la santé actuelle de captivité devient la santé sauvage équivalente, sans dépasser le maximum de l'espèce. La libération seule ne soigne pas et un animal mort ne peut pas être réintroduit.

## Présence coopérative : ne plus mélanger plusieurs mondes

Le protocole de présence inclut une identité canonique de l'espace : graine, génération, niveau de détail, révisions d'écologie et d'hydrologie, profil de paysage, scène refuge/région, étage et identifiant intérieur. Le relais ne transmet des présences et repères qu'entre connexions de même salle **et** même espace. Il refuse un état dont l'étage contredit l'enveloppe enregistrée.

Le client actuel attend l'accusé d'un relais compatible. Un ancien relais qui ne sait pas vérifier ces identités est annoncé comme tel ; ses messages sans identité ne sont pas affichés comme compatibles. Les anciens clients restent regroupés entre eux par le nouveau relais, pas avec les clients actuels. Les intégrations historiques dépourvues de l'API `frontier.position` gardent leur mode isolé sans identité.

Changer de carte, d'étage ou d'intérieur masque immédiatement les contacts précédents, même pendant la pause. Au prochain envoi, le client rejoint le nouvel espace ; aucun signal n'est émis dans l'ancien espace pendant cette transition. Les réponses tardives d'une autre identité sont ignorées. L'inspection de l'interface n'envoie aucun paquet et ne reconstruit pas le monde : elle utilise `frontier.position`, pas l'aperçu qui synchronise des registres. Les plafonds, délais d'admission, limites de débit et protections contre une connexion saturée restent actifs.

**Cette identité est déclarée par les clients ; ce n'est ni une authentification, ni un anti-triche, ni une campagne multijoueur autoritaire.** Inventaires, combats, constructions et sauvegardes restent locaux. Deux joueurs de même graine peuvent toujours avoir des états de progression différents : aucune synchronisation de ces états n'est revendiquée.

## Commandes après une image lente

Le moteur abandonnait correctement le temps d'une image de plus de 250 ms pour éviter une dette de simulation, mais vidait aussi `input.pressed` sans aucun pas de simulation pour consommer la commande. Une pression native sur R à ce moment pouvait donc disparaître. Le nouveau contrat reproduit cette perte avant correction.

Le temps excessif reste abandonné, sans pas ajouté, déplacement accéléré ou rattrapage. Les pressions encore non consommées restent en attente du prochain pas valide et ne sont délivrées qu'une fois. Pause, menu, défaite, changement de visibilité et perte de focus conservent leur nettoyage : pas de tir ou de commande différée après restitution des contrôles. Les tests historiques de cadence restent inchangés.

Le précédent échec distant du groupe `contexts` attendait un rechargement qui n'avait pas démarré. La perte de pression ci-dessus est une cause reproduite compatible avec ce symptôme ; seul le nouveau parcours distant permet de qualifier ce cas complet. Son attente, ses refus d'action pendant le rechargement et ses contrôles de dépenses sont conservés, sans graine supplémentaire ni suppression d'assertion.

## Qualification

Les journaux distinguent les tests avant correction, le groupe ciblé final, la vérification exhaustive et les scénarios navigateur. Les comptes recouvrants ne s'additionnent pas. L'exécution native utilise les vrais propriétaires de stocks, captivité, santé et sauvegarde ; un cas blesse un lapin généré via `hitWildlife165`, le capture, le soigne et le relâche avec son identité d'origine. Les tests réseau utilisent aussi de vraies connexions WebSocket locales pour les espaces compatibles/incompatibles et les changements d'étage.

Le parcours `browser-care200.mjs` reconstruit `dist` et utilise le carnet joueur sans paramètre auteur. Trois formats, vrais clics/touchers et sauvegarde/menu/rechargement/Continuer. Position régionale, fournitures et blessure initiale sont explicitement préparées. RAF est arrêté et le temps de travail est avancé dans le contrôleur pour cette scène ; pas de campagne humaine complète ni de benchmark. Le navigateur local a démarré mais refuse la navigation HTTP (`ERR_BLOCKED_BY_ADMINISTRATOR`), sans contournement ; aucune qualification visuelle locale n'est annoncée.

Les résultats exacts du SHA publié restent consignés dans la PR et les reçus. La CI complète et Windows de main ou de l'ancienne tête ne qualifient pas automatiquement cette intégration. Aucune fusion ou promotion en production par cette passe.

## Toujours distincts

Cages portables et escortes, transport de matières brutes, vêtements/commerce, tournées de PNJ, migrations longues, navigation aérienne générale, intérieurs verticaux libres, vie civile exhaustive, HUD de combat totalement refondu, partage autoritaire du monde et mesures sur matériel physique restent ouverts.
