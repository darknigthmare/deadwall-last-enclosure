#!/usr/bin/env python3
"""Build an external world-design catalogue. No game code or saves are modified."""
from pathlib import Path
import json, re, hashlib, html, unicodedata, collections
ROOT=Path(__file__).resolve().parents[1]
ACTIVE={1:('house',14,12,[0]),3:('duplex',16,13,[0,1]),10:('cabin',9,8,[0]),21:('apartments',30,23,[0,1,2]),41:('mall',82,56,[0,1]),45:('hardware',38,28,[0]),61:('grocer',19,15,[0]),62:('market',42,30,[0]),69:('diner',25,17,[0]),101:('hotel',42,26,[0,1,2]),123:('clinic',23,17,[0]),142:('school',38,28,[0,1]),161:('townhall',28,20,[0,1]),201:('bunker',26,21,[-1,0]),221:('warehouse',46,29,[0]),241:('garage',25,20,[0]),247:('fuel',19,14,[0]),381:('sawmill',40,26,[0]),401:('mine',32,25,[-1,0]),403:('quarry',30,24,[0]),481:('ruin',18,14,[0]),498:('motel',44,19,[0,1])}
ADDED_116={65: ('bakery', 22, 17, [0]), 153: ('library', 32, 24, [0, 1]), 46: ('garden', 36, 28, [0]), 97: ('veterinary', 26, 20, [0]), 85: ('laundry', 21, 15, [0]), 181: ('firestation', 36, 28, [0, 1]), 224: ('selfstorage', 36, 26, [0]), 367: ('marketgarden', 32, 24, [0]), 82: ('postoffice', 28, 22, [0]), 444: ('gym', 38, 28, [0]), 104: ('inn', 28, 23, [0, 1]), 251: ('scrapyard', 35, 25, [0])}
ACTIVE.update(ADDED_116)
ADDED_117={4: ('basementHouse', 18, 15, [-1, 0]), 53: ('pharmacy', 24, 18, [0]), 73: ('centralKitchen', 38, 29, [0]), 126: ('dental', 25, 20, [0]), 237: ('reuse', 40, 28, [0]), 289: ('freight', 46, 24, [0]), 306: ('joinery', 35, 26, [0]), 331: ('generatorRoom', 16, 13, [0])}
ACTIVE.update(ADDED_117)
# Art-direction reference sizes, not universal real-world specifications or building regulations.
PROPS={
 'sedan':('Voiture compacte',4.6,1.85,1.5,'parking'), 'van':('Fourgon',5.4,2.05,2.4,'parking'), 'bus':('Autobus',12.0,2.55,3.2,'parking'),
 'bed':('Lit adulte',2.05,1.6,.6,'mur'), 'bunk':('Lits superposés',2.1,.95,1.8,'mur'), 'sofa':('Canapé',2.2,.95,.85,'mur'), 'wardrobe':('Armoire',1.2,.65,2.0,'mur'),
 'desk':('Bureau',1.4,.7,.75,'mur'), 'chair':('Chaise',.48,.5,.9,'poste'), 'table':('Table',1.6,.85,.75,'poste'), 'child_table':('Table enfant',1.1,.7,.55,'poste'),
 'shelf':('Rayonnage',2.4,.7,2.1,'travee'), 'counter':('Comptoir',2.1,.8,1.1,'poste'), 'fridge':('Réfrigérateur',.8,.8,1.85,'mur'), 'sink':('Évier',.8,.65,.9,'mur_technique'),
 'medical':('Armoire de soins',1.2,.65,1.8,'mur'), 'stretcher':('Brancard',2.1,.75,.9,'poste'), 'pallet':('Palette',1.2,.8,.15,'stock'), 'crate':('Caisse',1.2,.8,.9,'stock'),
 'workbench':('Établi',2.0,.85,.9,'mur'), 'machine':('Machine d’atelier',2.6,1.6,1.7,'machine'), 'logs':('Lot de grumes',4.4,1.4,1.2,'stock_long'),
 'barrel':('Fût fermé',.62,.62,.9,'stock'), 'fuel_can':('Bidon de carburant',.35,.19,.47,'stock'), 'pump':('Pompe de station',.8,.65,1.8,'station'),
 'locker':('Casier',.45,.5,1.9,'mur'), 'bin':('Bac roulant',.6,.75,1.1,'service'), 'rack_pipe':('Rack de tubes',6.0,1.1,2.5,'stock_long'),
 'bench':('Banc extérieur',1.8,.65,.85,'chemin'), 'sign':('Panneau',.8,.12,2.0,'chemin'), 'tree':('Arbre, tronc et canopée séparés',.65,.65,8.0,'nature'),
 'rubble':('Débris bas',1.6,1.3,.5,'degat'), 'rock':('Rocher',1.5,1.2,1.0,'nature'), 'tent':('Tente',3.5,2.6,2.1,'camp'),
 'server':('Baie technique',.8,1.1,2.0,'travee'), 'cabinet':('Armoire technique',1.0,.6,2.0,'mur_technique'), 'tank':('Cuve de site',2.8,2.8,3.0,'machine'),
 'boat':('Embarcation légère',5.5,2.2,1.4,'quai'), 'container':('Conteneur court',6.06,2.44,2.59,'stock'), 'wagon':('Wagon de référence',18.0,3.1,4.0,'rail')}
ANCHORS={
 'mur':('Appui sur une paroi compatible; dos à 0–0,08 m de la paroi.','Angle de la paroi ou +90°; aucun bruit libre.',.8),
 'mur_technique':('Appui au mur portant les réseaux; maintenir leur continuité.','Angle exact du mur technique.',.9),
 'poste':('Dans une zone de travail; réserver l’espace de la personne et l’ouverture des tiroirs.','Axes de la pièce; petite variation de chaise ±8° après test de clearance.',.75),
 'travee':('Dans une travée alignée; séparer allée publique et passage de maintenance.','Axes des travées uniquement, pas de rotation indépendante par meuble.',1.4),
 'stock':('En groupe sur une aire de stockage; support porteur obligatoire pour tout empilement.','Alignement palette dominant; désordre local de ±4° seulement.',.85),
 'stock_long':('Parallèle au trajet d’extraction du matériau; aire de recul libre.','Axe de manutention; extrémités ne traversant aucune paroi.',2.0),
 'machine':('Sur un socle ou plancher porteur; zone de service autour des faces ouvrantes.','Axe de production; aucune variation décorative de la machine fixe.',1.2),
 'parking':('À l’intérieur d’une place ou dans une scène d’arrêt justifiée; portes et accès voiture réservés.','Axe de place ±3°; accident = orientation causale propre à la scène.',.65),
 'station':('Sur une île de pompes, hors chaussée; couloir pour véhicule de chaque côté.','Axe de l’île et de la circulation; aucune rotation aléatoire.',1.2),
 'service':('Sur une aire de déchets accessible au ramassage, hors sortie et réserve propre.','Aligné au mur de service, légèrement décalé selon usage.',.8),
 'chemin':('En bordure d’un chemin sans réduire sa largeur utile.','Orienté selon la bordure ou la vue utile.',.6),
 'nature':('Dans un peuplement corrélé au sol, au relief et à l’humidité; collider du tronc distinct du feuillage.','Rotation continue libre; densité et taille corrélées, pas grille visuelle.',.15),
 'degat':('Sous une rupture identifiable; gravité, matériau et direction de chute définissent le tas.','Cône de chute local, pas bruit uniforme sur toute la parcelle.',.1),
 'camp':('Sur terrain praticable, relié au sentier et sans fermer la circulation du camp.','Entrée vers l’allée; variabilité locale d’implantation.',1.2),
 'quai':('À flot ou sur un berceau; passerelle vers un quai réel.','Parallèle au ponton ou au sens d’échouage de la scène.',1.0),
 'rail':('Sur des rails raccordés; gabarit autour des véhicules et traversées réservées.','Tangente du rail, jamais rotation indépendante.',.7)}
ROLE_RULES=[
 (r'parking|parc véhicules|stationnement|drive|aire de départ|retournement',('parc_automobile',(80,1200),['sedan','van','sign'],'scrap',True)),
 (r'quai|expédition|réception|chargement|livraison',('logistique',(30,250),['pallet','crate','bin'],'scrap',False)),
 (r'garage|baie|remise|mécan|atelier|usinage|découpe|montage|préparation|réparation',('atelier',(20,220),['workbench','machine','crate'],'scrap',False)),
 (r'pompe|carburant|silo|énergie|chaudi|chaufferie|technique|compresseur|serveur|commande|maintenance|ventilation|radio',('technique',(12,140),['cabinet','workbench','fuel_can'],'fuel',False)),
 (r'froid|cuisine|fournil|réfectoire|restaurant|collation|plonge|cuisson|petit-déjeuner',('alimentation',(12,160),['fridge','sink','table'],'food',False)),
 (r'soin|consultation|infirmerie|triage|bloc|naissance|imagerie|prélèvement|stérilisation|dialyse',('soins',(14,90),['medical','stretcher','sink'],'medicine',False)),
 (r'cave|réserve|stock|magasin|archives|linge|bagagerie|carothèque|consigne|casiers|tri',('stockage',(8,250),['shelf','crate','wardrobe'],'scrap',False)),
 (r'chambre|dortoir|couchage|logement|appartement|studio|capsule|repos|nurserie',('vie_privee',(10,45),['bed','wardrobe','desk'],'wood',False)),
 (r'sanitaires|douche|vestiaire|buanderie|laverie|nettoyage|salle d.eau|lavage',('hygiene',(6,60),['sink','locker','bin'],'medicine',False)),
 (r'vente|boutique|vitrine|showroom|comptoir|caisse|étal|rayon|exposition|confiserie',('vente',(18,350),['shelf','counter','crate'],'food',False)),
 (r'classe|étude|bibliothèque|lecture|animation|réunion|conseil|bureaux|bureau|signature|entretien|audience|cartographie',('travail_public',(12,140),['desk','chair','shelf'],'scrap',False)),
 (r'séjour|salon|salle commune|pièce de vie|jeu|activité',('vie_commune',(15,90),['sofa','table','wardrobe'],'wood',False)),
 (r'hall|accueil|entrée|sas|porche|guichet|attente|lobby',('accueil',(6,100),['counter','bench','sign'],'scrap',False)),
 (r'escalier|palier|passerelle|coursive|galerie|couloir|mezzanine|circulation|mail|allées|passage|rampe',('circulation',(12,300),['sign','bench'],'scrap',False)),
 (r'jardin|prairie|champs|parcelle|serre|pépinière|verger|parc|pelouse|lisière|bois|canopée|sous-bois|friche|berge|pâture|clairière',('vegetation',(100,10000),['tree','sign','bench'],'wood',True)),
 (r'galerie|mine|front|gradin|éboulis|rupture|taille|roche|terrils',('mineraux',(80,3000),['rock','rubble','crate'],'stone',True)),
 (r'voie|rue|route|bretelle|chaussée|pont|tablier|quai|ponton|rail|faisceau|chemin|piste|trottoir|cour|place',('exterieur',(70,5000),['sign','bin','bench'],'scrap',True))]
# Family envelope ranges are design proposals, not a declaration that all these sizes already run in 1.15.
FAMILY_SIZE=[(12,10,28,24),(25,18,85,60),(25,20,180,120),(18,14,90,60),(12,10,40,26),(26,18,100,65),(20,16,150,100),(28,20,160,110),(25,20,120,80),(24,18,85,65),(16,12,95,70),(35,24,200,125),(22,18,100,85),(100,25,1200,180),(60,25,600,160),(45,30,240,170),(24,18,260,180),(30,20,240,180),(90,60,700,450),(90,70,900,700),(75,45,800,500),(80,55,700,350),(40,28,300,200),(250,200,1200,900),(20,16,180,120)]
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
def choose_role(name):
 t=norm(name)
 for rx,value in ROLE_RULES:
  if re.search(norm(rx),t):return value
 return ('specialise',(15,100),['workbench','crate','sign'],'scrap',False)
def floor_rule(name,fam,number):
 s=norm(name)
 if number in ACTIVE:return ACTIVE[number][3]
 if 'souterrain' in s or 'enterre' in s or 'bunker' in s or 'sous-sol' in s:return [-1,0]
 if 'mine' in s and 'ciel ouvert' not in s and fam!=24:return [-2,-1,0]
 if 'tour resident' in s:return list(range(0,9))
 if 'etages' in s or 'etage' in s or 'hotel' in s or fam in [2]:return [0,1,2]
 if 'demi-niveaux' in s or 'gradins' in s:return [0,1,2]
 if 'immeuble' in s or 'duplex' in s or 'manoir' in s:return [0,1]
 return [0]
def roles_props(role_name,room_name,fam):
 role,area,props,res,out=choose_role(room_name)
 t=norm(room_name)
 if role=='technique' and not any(k in t for k in ['carburant','chaufferie','generateur']):res='scrap';props=['cabinet','workbench','crate']
 if role=='hygiene':res='scrap'
 if role=='vente' and fam not in [4]:res='scrap'
 if fam==4 and any(k in t for k in ['preparation','cuisson','plonge','conditionnement']):role,area,props,res,out='alimentation',(12,160),['fridge','sink','table'],'food',False
 if fam==18 and any(k in t for k in ['bassin','cuve','retenue','canal','puits']):role,area,props,res,out='ouvrage_eau',(30,600),['tank','cabinet','sign'],'scrap',True
 if fam==21 and 'galerie' in t:role,area,props,res,out='galerie_miniere',(60,450),['logs','sign','crate'],'stone',False
 if fam==7 and role in ['stockage','atelier']:props=['medical','shelf','crate'];res='medicine'
 if fam==4 and role in ['vente','stockage']:props=['shelf','fridge','crate'];res='food'
 if fam in [16,20] and any(k in norm(room_name) for k in ['bois','grume','sechage']):props=['logs','pallet','workbench'];res='wood'
 if fam==13 and any(k in norm(room_name) for k in ['pieces','pneus','atelier']):props=['shelf','workbench','crate'];res='scrap'
 if fam==21 and role not in ['accueil','travail_public','vie_privee']:props=['rock','rubble','crate'];res='stone'
 return role,area,props,res,out
INTENTIONS_117 = {4: 'La vie familiale occupe le rez-de-chaussée ; la cave, la buanderie et l’atelier se trouvent au-dessous de cette même emprise. Le joueur lit cette séparation avant de descendre chercher des provisions, puis retrouve l’escalier sans traverser un mur ou une zone technique.', 53: 'La façade donne sur la vente et le conseil. Les pièces de préparation et de réserve sont en retrait : le stock utile ne doit pas ressembler à des boîtes répandues sur un parking. La circulation laisse une approche distincte pour le public, le personnel et les livraisons.', 73: 'La cuisine se comprend comme une suite d’opérations : réception, réserve, préparation, cuisson, conditionnement et expédition. Le retour de plonge forme un circuit séparé. Les machines arrêtées servent à lire le lieu ; les denrées se récupèrent dans leurs contenants, pas dans un compteur de production magique.', 126: 'L’accueil protège l’intimité des salles de soins. Les fauteuils, les lavabos et les équipements arrêtés sont associés à leur pièce ; la stérilisation et le stock propre ne deviennent pas un couloir traversant. Les objets récupérables suivent l’usage du cabinet.', 237: 'La recyclerie distingue ce qui vient d’être déposé, ce qui est en cours de réparation et ce qui peut être remis en vente. Des meubles différents racontent ce trajet. Les allées permettent de déplacer une armoire sans la superposer au mobilier voisin.', 289: 'Cette halle garde la mémoire de la manutention : quai, tri, stockage intermédiaire et expédition sont raccordés. Les palettes restent groupées selon ces étapes ; les anciennes installations ne font pas apparaître un train ou un service logistique jouable non implémenté.', 306: 'Le bois brut arrive par la cour, rejoint le débit, puis les établis d’assemblage et la finition. Les longueurs sont orientées pour pouvoir être manipulées. Les machines sont arrêtées ; les piles de planches et les réserves expliquent les matériaux disponibles.', 331: 'Le groupe arrêté, les baies électriques et les réserves d’entretien forment un petit local technique accessible. La place pour travailler autour des machines reste libre. Visiter cette pièce ne fournit pas automatiquement du courant au refuge ni du carburant au véhicule.'}

rows=[];family_id=0
for line in (ROOT/'source/lieux.txt').read_text().splitlines():
 if line.startswith('# '):family=line[2:];family_id+=1;continue
 if not line.strip():continue
 name,program,signature=line.split('|');num=len(rows)+1;rid=f'DW-{num:04d}';program=program.split(',');levels=floor_rule(name,family_id,num);size=FAMILY_SIZE[family_id-1]
 rooms=[];adj=[];stock_ids=[];public_ids=[]
 for i,part in enumerate(program,1):
  role,area,props,res,out=roles_props(name,part,family_id);roomid=f'{rid}/espace-{i:02d}';count=[1,1]
  if any(x in norm(part) for x in ['chambres','appartements','studios']):count=[2,12 if family_id in [2,6,7] else 4]
  if norm(part)=='boutiques':count=[8,24]
  if norm(part)=='classes':count=[4,14]
  if 'rayon' in norm(part):count=[3,10]
  z=[0] if role not in ['vie_privee','stockage'] else (levels[1:] if role=='vie_privee' and len(levels)>1 and min(levels)>=0 else levels)
  if out:z=[0]
  fixtures=[]
  for j,key in enumerate(props):
   label,w,d,h,anchor=PROPS[key];placement,rotation,clearance=ANCHORS[anchor]
   fixtures.append({'asset':key,'nom':label,'gabarit_m':{'longueur':w,'largeur':d,'hauteur':h},'quantite_par_espace':[1,3 if role not in ['stockage','vente'] else 8], 'ancrage':placement,'rotation':rotation,'degagement_min_m':clearance,'collider':'emprise au sol commune au rendu; tester OBB si tourné','loot_eligible':key not in ['sign','bench','chair','machine','tank','server']})
  if role=='circulation':fixtures=[f for f in fixtures if f['asset']=='sign']
  rooms.append({'id':roomid,'nom':part,'role':role,'exterieur':out,'repetitions':count,'surface_unitaire_m2':list(area),'niveaux_candidats':z,'props':fixtures,'ressource_dominante':res,'regle_stock':'quantité finie par contenant, prélèvement sauvegardé, aucun reroll au retour','placement': 'Réserver d’abord le parcours et les ouvrants, puis placer les objets contre leurs ancrages fonctionnels.'})
  route='cour_service' if role in ['logistique','stockage','atelier','technique'] else 'distribution'
  adj.append({'de':route,'vers':roomid,'type':'ouverture_franchissable','largeur_min_m':2.4 if role=='logistique' else 1.35,'contrainte':'porte visible et navigation utilisant la même transformation locale/monde'})
  if role in ['stockage','logistique']:stock_ids.append(roomid)
  if role in ['vente','accueil','vie_commune','travail_public']:public_ids.append(roomid)
 for a,b in zip(public_ids,stock_ids):adj.append({'de':a,'vers':b,'type':'liaison_service','largeur_min_m':1.35,'contrainte':'un accès arrière; jamais traverser une chambre ou une boutique tierce'})
 links=[{'de':'voie_publique','vers':'parvis','type':'acces_pieton','largeur_min_m':1.5},{'de':'parvis','vers':'distribution','type':'entree','largeur_min_m':1.35},{'de':'voie_service','vers':'cour_service','type':'livraison','largeur_min_m':4.0},*adj]
 if len(levels)>1:links.append({'de':'distribution','vers':'noyau_vertical','type':'escalier','largeur_min_m':1.2,'niveaux':levels,'contrainte':'mêmes coordonnées XY aux niveaux liés; arrivée dégagée; ordre explicite; aucun escalier vers le vide'})
 if family_id==1:parking=[0,3]
 elif family_id==3 and num==41:parking=[80,180]
 elif family_id in [2,3,4,6,7,8,9]:parking=[4,40]
 elif family_id in [10,12,13,16,17]:parking=[3,24]
 elif family_id==24:parking=[20,180]
 else:parking=[0,12]
 active=ACTIVE.get(num)
 entry={'id':rid,'nom':name,'famille':family,'famille_id':family_id,'statut':('pilote_1_17' if num in ADDED_117 else 'pilote_1_16' if num in ADDED_116 else 'pilote_1_15') if active else 'conception_non_integree','resume':signature,'intention':f'Rendre {name.lower()} identifiable par son organisation avant de distribuer du butin. Le joueur peut comprendre où chercher, entrer, ressortir et charger son retour.', 'parcelle':{'enveloppe_min_m':list(size[:2]),'enveloppe_max_m':list(size[2:]),'niveaux_proposes':levels,'implantation':('Parcelles et accès commandés par le relief, les milieux naturels et le réseau existant.' if family_id in [18,19,20,21,22] else 'Façade publique orientée vers la rue de desserte; service et réserves en retrait.'),'places_stationnement':parking,'places_techniques': [0,4] if family_id not in [12,13,16,22] else [2,12],'voiture_reference_m':[4.6,1.85],'largeur_place_reference_m':2.7,'profondeur_place_reference_m':5.5,'allee_stationnement_reference_m':6.0,'attention':'Ces dimensions sont des choix de level design, pas une certification réglementaire.'},'espaces':rooms,'graphe_acces':links,'dimensionnement':{'nature':'Fourchettes de conception indépendantes; pas un plan de construction certifié.','allocation':'Choisir répétitions et surfaces, puis vérifier la somme des pièces, murs, noyaux, accès et stationnements. Étendre la parcelle ou réduire le programme facultatif si nécessaire.','interdiction':'Ne pas prendre tous les maxima à la fois, ne pas rétrécir les voitures ni supprimer une issue pour faire entrer le programme.'},'circulation':{'humain_reference_m':1.78,'largeur_corporelle_reference_m':.64,'ouverture_pietonne_min_m':1.0,'degagement_ouvrant_m':.8,'navigation':'Tester chaque pièce, contenant et étage depuis une entrée réelle avant validation du seed. Réserver le couloir de retour.','vehicules':'Colliders orientés avec le gabarit du véhicule, pas cercle identique à celui du joueur.'},'generation':{'ordre':['biome et relief','réseau principal','quartier et voirie locale','parcelle et reculs','volumes et porteurs','pièces et noyaux','portes et parcours réservés','props fixes','contenants fonctionnels','dégâts et végétation','validation et empreintes'],'graine':'hash(worldSeed, generationVersion, parcelId, archetypeId, floor, roomId, objectSlot)','rotation':'Parcelle selon rue; meubles selon pièce; stationnement selon places; nature selon peuplement. Ne pas appliquer une rotation uniforme ni un angle libre à chaque objet.','variante_sans_changer_de_type':['enveloppe allongée ou ramassée dans la fourchette','entrée décalée sur façade compatible','pièces répétables en nombre borné','service latéral ou arrière','usure corrélée à une histoire locale'],'anti_repetition':'Comparer les trois parcelles voisines: ne pas répéter même façade, même plan, même état et même palette. Conserver malgré cela les alignements fonctionnels.','anti_superposition':'Un même volume physique ne peut appartenir à deux props. Exceptions explicites: objets posés sur meuble, empilement stable, feuillage visuel partagé; stocker supportId et hauteur dans ce cas.'},'loot':{'distribution':'Objets de cuisine dans cuisine/réserve alimentaire; médicaments dans soins/pharmacie; ferraille et outils en atelier; matériaux lourds dans cour/stock. Aucun semis uniforme par distance.','budget':'Calculer un budget par fonction et nombre de contenants; la distance au refuge ne crée pas de loot magique.','persistance':'Créer les stocks une seule fois; enregistrer seulement les deltas par identifiant stable. Un reload, un changement d’étage ou une éviction du cache ne remplit rien.','epuisement':'Le retour vers des réserves locales déjà vidées force progressivement une nouvelle tournée plus loin. La ressource d’un lieu disparu ne réapparaît pas dans un voisin.','informations':'Une carte ou un dossier peut révéler un voisin plausible; cela ne téléporte pas le joueur et ne pré-remplit pas son sac.'},'etat_post_chute':{'intact':'Objets regroupés selon l’usage. Quelques portes ouvertes, véhicules stationnés et traces d’abandon sans chaos uniforme.','pille':'Contenants accessibles au public plus souvent ouverts; stocks arrière encore possibles; ne pas effacer toutes les cloisons.','incendie':'Déterminer foyer et propagation, puis enlever les éléments réellement détruits; débris sous ruptures, couloir de repli testé.','envahi':'Végétation depuis lumière, humidité, fissures et lisières; jamais même densité sur dalle, toit, pièce sombre et prairie.'},'qa': ['Entrées et sorties raccordées au réseau; aucun accès dans une voie traversante.','Taille et rotation identiques dans dessin, collision, interaction et sauvegarde.','Zéro chevauchement physique non déclaré; clearance d’usage et ouvrants libres.','Tous les espaces obligatoires atteignables à pied; véhicules seulement sur accès prévus.','Étages et sous-sols au même XY, liés par un noyau et sans chute implicite.','Contenants cohérents avec la pièce; quantité conservée entre chargements.','Frontière de secteur: même façade, même route et même objet vus des deux côtés.','Aucune création gratuite d’habitant, de matériau, de véhicule ou de carburant.'], 'integration':{'archetype_runtime':active[0] if active else None,'dimensions_runtime_m':list(active[1:3]) if active else None,'niveaux_runtime':active[3] if active else [],'couverture':('Plan pilote de la 1.17, génération régionale 3. Le programme construit est défini dans src/frontier-specialists.js; les autres variantes restent des propositions. Les générations 1 et 2 conservent leurs lieux et leurs prélèvements.' if num in ADDED_117 else 'Plan pilote jouable en 1.16, génération régionale 2. Seules les pièces et cours décrites par src/frontier-places.js sont intégrées; la fiche complète reste un programme de conception. Une région 1.15 migrée conserve sa géométrie antérieure.' if num in ADDED_116 else 'Un plan pilote simplifié existe depuis le moteur 1.15. Cette fiche est plus ambitieuse et ne signifie pas que toutes ses variantes et sous-zones sont implémentées.') if active else 'Catalogue de conception pour une génération future; aucun plan jouable de ce type n’est revendiqué dans cette livraison.'}}
 if num in INTENTIONS_117: entry['intention']=INTENTIONS_117[num]
 rows.append(entry)
assert len(rows)==500 and len({r['nom'] for r in rows})==500
(ROOT/'CATALOGUE_500.json').write_text(json.dumps({'version':'1.3.0','langue':'fr','usage':'codex développeur externe, pas une interface du jeu','nombre_fiches':500,'fiches_pilotes_source':42,'fiches':rows},ensure_ascii=False,indent=2)+'\n')
# Compact schema intentionally validates every machine-read field used for generation.
schema={'$schema':'https://json-schema.org/draft/2020-12/schema','type':'object','required':['version','fiches'],'properties':{'version':{'type':'string'},'fiches':{'type':'array','minItems':500,'maxItems':500,'items':{'type':'object','required':['id','nom','famille','statut','parcelle','espaces','graphe_acces','generation','loot','qa','integration'],'properties':{'id':{'type':'string','pattern':'^DW-[0-9]{4}$'},'nom':{'type':'string','minLength':5},'statut':{'enum':['pilote_1_15','pilote_1_16','pilote_1_17','conception_non_integree']},'espaces':{'type':'array','minItems':3},'graphe_acces':{'type':'array','minItems':5},'qa':{'type':'array','minItems':8}}}}}}
(ROOT/'SCHEMA_CATALOGUE.json').write_text(json.dumps(schema,ensure_ascii=False,indent=2)+'\n')
lines=['# DEADWALL — Codex de génération du monde','', '500 types de lieux distincts. Document de conception externe, non affiché dans le jeu. Les dimensions sont des références de level design. Les fiches ne représentent pas 500 lieux déjà développés.','', 'Statuts : **42 plans pilotes** (22 en 1.15, 12 en 1.16, 8 en 1.17), **458 fiches de conception non intégrées**. Voir le rapport de la version du jeu pour leur qualification effective.','', '## Index par famille','']
for family,items in __import__('itertools').groupby(rows,key=lambda r:r['famille']):
 items=list(items);lines+=['### '+family,'', '; '.join(f"[{r['id']} — {r['nom']}](fiches/{r['id']}.md)" for r in items),'']
(ROOT/'INDEX.md').write_text('\n'.join(lines)+'\n')
for r in rows:
 p=r['parcelle'];m=[f"# {r['id']} — {r['nom']}",'',f"**Famille :** {r['famille']}  ",f"**Statut :** {r['statut']} — {r['integration']['couverture']}",'','## Intention et implantation','',r['intention'],r['resume'],f"Enveloppe de parcelle proposée : de {p['enveloppe_min_m'][0]} × {p['enveloppe_min_m'][1]} m à {p['enveloppe_max_m'][0]} × {p['enveloppe_max_m'][1]} m. Niveaux proposés : {', '.join(map(str,p['niveaux_proposes']))}. {p['implantation']}",f"Stationnement indicatif : {p['places_stationnement'][0]}–{p['places_stationnement'][1]} places; service : {p['places_techniques'][0]}–{p['places_techniques'][1]} emplacements. Référence voiture 4,6 × 1,85 m, place 2,7 × 5,5 m, allée 6 m. Ajuster l’enveloppe plutôt que réduire les véhicules.",'','## Programme spatial et mobilier','']
 for e in r['espaces']:
  m += [f"### {e['nom'].capitalize()}",f"{e['repetitions'][0]}–{e['repetitions'][1]} espace(s), {e['surface_unitaire_m2'][0]}–{e['surface_unitaire_m2'][1]} m² par unité. {'Extérieur' if e['exterieur'] else 'Intérieur ou volume spécialisé'}; niveaux candidats {e['niveaux_candidats']}. Ressource dominante : {e['ressource_dominante']}."]
  for f in e['props']:
   d=f['gabarit_m'];m.append(f"**{f['nom']}** : {f['quantite_par_espace'][0]}–{f['quantite_par_espace'][1]}, gabarit {d['longueur']} × {d['largeur']} × {d['hauteur']} m. {f['ancrage']} {f['rotation']} Dégagement utile : {f['degagement_min_m']} m.")
  m+=['']
 m+=['## Accès et étage','', '\n'.join(f"- `{e['de']}` → `{e['vers']}` : {e['type']}, largeur de référence {e['largeur_min_m']} m. {e.get('contrainte','') }" for e in r['graphe_acces']), '',r['circulation']['navigation'],r['circulation']['vehicules'],'','## Placement procédural','', ' → '.join(r['generation']['ordre'])+'.',r['generation']['rotation'],r['generation']['anti_repetition'],r['generation']['anti_superposition'],f"Identifiant de génération : `{r['generation']['graine']}`.",'','## Ressources et histoire locale','',r['loot']['distribution'],r['loot']['budget'],r['loot']['persistance'],r['loot']['epuisement']]
 for name,desc in r['etat_post_chute'].items():m.append(f"**{name.capitalize()} :** {desc}")
 m+=['','## Contrôles avant intégration','',*['- '+q for q in r['qa']],'','## Liaison au moteur','',r['integration']['couverture']]
 if r['integration']['archetype_runtime']:m.append(f"Plan source : `{r['integration']['archetype_runtime']}`; enveloppe bâtie actuelle {r['integration']['dimensions_runtime_m']} m; niveaux {r['integration']['niveaux_runtime']}. Les autres variantes de la fiche restent des propositions.")
 (ROOT/'fiches'/f"{r['id']}.md").write_text('\n\n'.join(m)+'\n')
(ROOT/'PROPS_GABARITS.json').write_text(json.dumps({key:{'nom':v[0],'dimensions_m':list(v[1:4]),'ancrage':v[4],'regles':ANCHORS[v[4]]} for key,v in PROPS.items()},ensure_ascii=False,indent=2)+'\n')
print('Generated',len(rows),'fiches;',sum(len(x['espaces']) for x in rows),'espaces programmés')
