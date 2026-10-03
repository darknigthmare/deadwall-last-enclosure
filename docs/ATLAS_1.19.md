# Contrat technique 1.19

`core.js / AtlasRules` porte les constantes. `atlas-projection.js` convertit les coordonnées, expose les emprises et les jonctions et fournit le calcul de caméra et de graduation. `atlas-render.js` réalise les lectures cartographiques et la vue de D-17 dans la région. `atlas-view.js` gère les gestes, le clic, les calques, les mesures et l’inspection.

32 unités locales correspondent à un mètre régional. Une emprise locale de 4096 unités donne donc 128 m. Conserver cette convention lors des futures générations ; un véritable agrandissement du chantier demandera un autre contrat de monde et une migration explicite. Ne pas grossir uniquement le symbole de D-17.

La géométrie et les sources du monde restent celles de la 1.18. La vue consomme les données réellement présentes. La couche de densité de végétation est indicative à grande distance ; les objets rapprochés sont lus dans les secteurs existants. Aucun ennemi caché n’est ajouté comme renseignement cartographique.

Les points de retour centraux restent (4036,2048), (60,2048), (2048,60), (2048,4036). La composante tangentielle est convertie ; la marge externe de quatre mètres est conservée. L’état d’accès de la carte ne vérifie que le point central avec chaque gabarit ; il ne remplace pas les collisions du déplacement. Le milieu de la copie régionale du secteur est maintenant interdit afin qu’un accès local refusé ne devienne pas un passage fantôme.

Les actions de caméra et de sélection n’entrent pas dans la sauvegarde v17. Les emplacements, stocks, prélèvements et relais continuent d’être validés. Les tests de reprise séparent les registres persistants des recalculs transitoires (par exemple un plan de vague ou l’opacité graphique).

Les premières vérifications ont révélé trois conditions de test : coordonnées de molette arrondies par Chromium, carte tactile partiellement hors de la zone visible et maison de fixture posée sur une ressource sans passer par la validation d’emprise. Les tests utilisent maintenant les coordonnées d’événement réellement envoyées, présentent la carte dans l’écran, et réservent des emplacements libres. Les contrôles de conservation et d’ancrage n’ont pas été supprimés.

Le guide complet externe `06_ATLAS_D17_1.19.md` est livré avec le codex. Ses 500 fiches ne sont pas modifiées ; la couverture reste 42 plans pilotes.
