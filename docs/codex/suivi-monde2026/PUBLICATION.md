# DEADWALL — Suivi du Codex mondial

## État exact du 21 octobre 2026

Le classeur corrigé est sauvegardé en format **XLSX** dans le dossier Drive DeadWall / Codex mondial — suivi et sauvegardes. Il a été retéléchargé et comparé octet pour octet au fichier local vérifié.

**Le fichier binaire XLSX n'est pas encore versionné dans cette branche.** Le transfert automatisé du binaire vers GitHub a été bloqué par les contrôles de sécurité et n'a pas été réessayé par un autre canal. Ce document fournit une référence de sauvegarde, pas une fausse pièce jointe Excel. Aucun workflow de publication bloqué n'a été ajouté au dépôt.

- [Ouvrir le classeur Excel sur Drive](https://docs.google.com/spreadsheets/d/1D4Agls6Q2BP1H8Oi9SRb1nOvg1Ff7p1X/edit?usp=drivesdk&ouid=102406458049746863092&rtpof=true&sd=true)
- [Sauvegarde des données, scripts et preuves](https://drive.google.com/file/d/1lpY89GcB03NoiE-Lol6QeDN4nlIL8Ht7/view?usp=drivesdk)
- [Dossier de sauvegarde](https://drive.google.com/drive/folders/1U6uAvZuUeOaMQAt0aH8qiUMo3OhfX1sm)

Les permissions Drive existantes ont été conservées ; ces liens ne rendent pas automatiquement les fichiers accessibles au public.

## Identité des copies

| Fichier | Taille | SHA-256 |
|---|---:|---|
| DEADWALL_CODEX_MONDE_SUIVI.xlsx | 507082 octets | `6db31acc3cf64f0bd9093419203438374a2f80e43a990acd7f2904c2cdeef153` |
| DEADWALL_CODEX_MONDE_SOURCES_ET_PREUVES_2026-10-21.zip | 1870239 octets | `0ba71b172e4b031d451c61b0df8940a65828fcc01bbcd4dd108b5c3045c8bc61` |

Le nom local du classeur est `DEADWALL_CODEX_MONDE_SUIVI_CORRIGE.xlsx`. La copie Drive porte un nom plus court ; ses octets sont identiques. Le paquet ZIP contient aussi cette copie et un manifeste des dix fichiers de données/scripts à intégrer ultérieurement.

## Contenu réellement présent dans la sauvegarde

Dix feuilles : Accueil ; Catalogue existant ; Extension typologies ; Variantes à concevoir ; Chantiers ; Règles seed ; Familles existantes ; Références ; Publication ; Légende.

- **4000 programmes existants**, extraits de DEADWALL 1.68 au commit `6c6fbb6cf563bea6c89ade99c65f18c438481532`.
- **2000 parents**, **12060 espaces** et **13539 références d'objets/emplacements** dans les données JSON du paquet. Les tables détaillées ne sont pas intégralement dupliquées en feuilles Excel.
- **80 typologies cibles**, **4000 identifiants de variantes à concevoir**, exactement cinquante par typologie, et **800 tâches**. Ces cibles ne sont pas des variantes détaillées déjà produites ni des lieux jouables.
- **30 règles de réception** ; synthèse des **33 familles** existantes.
- **192 formules calculées**, sans cellule d'erreur ni cache de résultat manquant dans le fichier vérifié.

L'ancienne livraison de trois lignes est obsolète. Utiliser seulement la copie dont l'empreinte figure ci-dessus.

## Contrôles rejoués avant sauvegarde

`node --test tests/codex-tracker2026.test.cjs` : **12/12** réussis, zéro échec/annulation/ignoré/TODO. Contrôles positifs et négatifs des identifiants, parents, espaces, dimensions, quantités, numéros de variante et validation sans preuve.

`node scripts/validate-codex-tracker2026.cjs` : succès. Zéro variante nouvelle conçue, zéro tâche d'extension validée ; le statut de production n'est pas modifié par le transfert.

`python scripts/verify-codex-tracker-xlsx2026.py` : succès, dix feuilles et 192 formules. Comparaison intégrale locale/Drive : identique. Les journaux et le manifeste sont dans l'archive de sauvegarde.

Il s'agit d'une validation du suivi, pas de la campagne complète. Le précédent `npm run check` sur l'archive de sources texte s'était arrêté au build sur l'image absente `assets/icon-192.png`. Aucun nouveau résultat global, navigateur ou Windows n'est attribué à cette publication documentaire.

## Suite du travail

1. Versionner le XLSX et les dix fichiers du manifeste par un mécanisme d'upload GitHub autorisé ; vérifier à nouveau l'empreinte et les trois commandes avant d'annoncer le binaire présent.
2. Préserver tous les identifiants existants. Réconcilier les sources si main n'est plus `6c6fbb6cf563bea6c89ade99c65f18c438481532`.
3. Pour chaque typologie : documenter dimensions et plans publics ; détailler les variantes ; produire intérieurs/niveaux, réseaux, objets, stocks finis, rencontres, services, art, sauvegardes et preuves.
4. Une validation de données ne fait jamais passer une cible au statut « jouable validé ».

Aucune fusion sur main, aucune modification du moteur, du hasard, des stocks, des sauvegardes ou de la production n'est effectuée par ce document.
