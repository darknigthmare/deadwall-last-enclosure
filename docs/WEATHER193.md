# Fronts météo et préparation des sorties

Les nouvelles campagnes utilisent six fronts : temps sec, bruine, ondées, pluie continue, forte averse et fin de pluie. Le premier front laisse quatre minutes sèches au refuge. La graine et le temps actif déterminent ensuite les fronts par périodes de quatre minutes, regroupées en tendances sèches ou humides. Ce choix ne consomme pas le générateur aléatoire du combat.

La pluie évolue progressivement vers l’intensité du front avec l’interpolation historique. Elle reste la donnée commune des flammes exposées, des bâches, des citernes, des incendies, du sol naturel de D-17 et du faible ralentissement historique des infectés locaux. La météo ne crée ni inondation, eau potable, culture renouvelable, malus de vision, ni boue régionale supplémentaire. Le vent représenté déplace les traits de pluie ; il ne pousse pas les acteurs et ne change pas la balistique.

Dans **Opérations → Région → Météo & préparation**, le bulletin affiche pluie observée, évolution, durée du front et précautions. La tendance suivante apparaît seulement dans les 90 dernières secondes du front. Depuis le tiroir régional **Terrain & trajet**, le même dossier est accessible directement. Le jeu est en pause dans le dossier ; lire le bulletin ne change ni stocks, ni découvertes, ni RNG.

Une sauvegarde historique sans `expansions127.modules.weather193` garde sa météo antérieure. Son bulletin peut être activé une fois au dépôt, à pied, les mains libres, sans ressource offerte ni modification de géographie. L’activation est durable. Le registre strict `{version:1,active:boolean}` s’ajoute au format existant ; aucune migration de campagne n’est imposée.

Le champ optionnel `weatherTarget` conserve aussi la pluie qui était en train d’arriver, même en mode historique. Avant cette correction, Continuer remplaçait cette cible par la pluie déjà visible et pouvait effacer une transition. Un ancien fichier sans ce champ reprend avec sa pluie courante. Les valeurs malformées sont refusées avant remplacement du monde.

Les scénarios natifs vérifient déterminisme, bornes, absence de RNG consommé par le bulletin, opt-in historique, reprise, pause et rendu avec mouvement réduit. Le parcours Chromium utilise de vrais contrôles et un point de météo avancé explicitement préparé ; il ne mesure pas une campagne humaine de plusieurs heures.
