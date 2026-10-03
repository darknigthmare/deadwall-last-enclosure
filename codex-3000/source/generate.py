#!/usr/bin/env python3
"""Build 2000 explicit modular compositions from the 1000 preserved original programmes.
Run: python source/generate.py [original-root] [game-project]
No Internet, no random values, no alteration of original records.
"""
from pathlib import Path
from collections import Counter
import json,hashlib,shutil,sys,re
OUT=Path(__file__).resolve().parents[1]
ORIGINAL=Path(sys.argv[1]) if len(sys.argv)>1 else OUT/'originaux'
PROJECT=Path(sys.argv[2]) if len(sys.argv)>2 else None
if ORIGINAL.resolve()!=(OUT/'originaux').resolve():
 shutil.copytree(ORIGINAL,OUT/'originaux',dirs_exist_ok=True)
ORIGINAL=OUT/'originaux'
base_file=next(ORIGINAL.rglob('CATALOGUE_500.json'));supp_file=next(ORIGINAL.rglob('CATALOGUE_501_1000.json'))
base=json.loads(base_file.read_text())['fiches'];supp=json.loads(supp_file.read_text())['fiches'];parents=base+supp
assert len(parents)==1000 and len({p['id'] for p in parents})==1000
if PROJECT:
 shutil.copytree(PROJECT/'docs/codex',OUT/'modules',dirs_exist_ok=True)
 packs=[]
 for p in sorted((PROJECT/'src').glob('world-codex-*.js')):
  txt=p.read_text();packs+=json.loads(txt.split('const entries=',1)[1].split(';\nfor(const entry',1)[0])
 (OUT/'source/MODULES.json').write_text(json.dumps(packs,ensure_ascii=False,indent=2))
modules=json.loads((OUT/'source/MODULES.json').read_text());M={m['id']:m for m in modules}
# The selection is curated per function: no mine under a school, no cargo port in a forest.
contexts={
'Habitat individuel':['quartier-pavillonnaire','hameau','village','ferme'],
'Habitat collectif':['quartier-collectif','ville','metropole','centre-historique'],
'Commerces non alimentaires':['zone-commerciale','ville','village','metropole'],
'Alimentation et restauration':['zone-commerciale','village','ville','station-service'],
'Services et petits ateliers':['atelier','village','industrie','ville'],
'Hôtellerie et hébergement':['village','zone-loisirs','ville','lac'],
'Santé':['hopital-soins','ville','village','camp-evacuation'],
'Éducation et connaissance':['ecole-civique','ville','quartier-collectif','village'],
'Administration et communauté':['ecole-civique','ville','village','centre-historique'],
'Secours et protection civile':['camp-evacuation','ville','station-service','industrie'],
'Abris et souterrains':['ville','camp-allie','montagne','industrie'],
'Entrepôts et réserves':['entrepot','port','industrie','gare-fret'],
'Automobile et carburant':['station-service','industrie','ville','atelier'],
'Routes et ouvrages':['routes-coutures','montagne','riviere','ville'],
'Ferroviaire et transports collectifs':['gare-fret','metropole','industrie','port'],
'Industrie et production':['industrie','entrepot','port','carriere'],
'Énergie et communication':['energie','industrie','ville','montagne'],
'Eau et réseaux':['eau-services','riviere','ville','industrie'],
'Agriculture':['ferme','prairie','hameau','terre-aride'],
'Forêts et filière bois':['bois-lisiere','foret-profonde','clairiere','scierie'],
'Mines et matériaux':['mine','carriere','montagne','terre-aride'],
'Ports et activités nautiques':['port','plage','lac','riviere'],
'Loisirs et culture':['zone-loisirs','lac','plage','ville'],
'Quartiers et agglomérations':['hameau','village','ville','metropole'],
'Ruines et lieux dégradés visitables':['ruines-vegetales','centre-historique','industrie','bois-lisiere'],
'habitat':['quartier-pavillonnaire','hameau','village','quartier-collectif'],
'commerce':['zone-commerciale','ville','village','metropole'],
'industrie':['industrie','atelier','entrepot','gare-fret'],
'public':['ecole-civique','ville','village','camp-evacuation'],
'rural':['ferme','prairie','bois-lisiere','hameau'],
'militaire':['camp-allie','camp-hostile','camp-fortune','camp-evacuation'],
'transport':['station-service','gare-fret','port','routes-coutures'],
'ruines':['ruines-vegetales','centre-historique','industrie','bois-lisiere']}
# These state patches change route, programme use, loot and light together.
states=[
{'id':'evacuation','name':'évacuation interrompue','cause':'Le départ a commencé par l’accès public avant de s’arrêter. Les objets personnels suivent le trajet de sortie, pas une dispersion uniforme.',
 'access':'Garder le passage de départ ouvert ; les bagages occupent les bords. Prévoir le contournement du dernier véhicule seulement si la parcelle le permet.',
 'loot':'Réduire les réserves transportables près de l’entrée ; conserver du matériel lourd dans ses espaces de travail. Les deux zones partagent le budget fini du parent.',
 'light':'Balisage de sortie et une lampe temporaire près du point de rassemblement. Les autres appareils sont éteints faute de service ; toute activation dépend d’un système implémenté.',
 'risk':'Contacts regroupés sur l’ancienne file de départ, sortie visuellement encombrée mais réellement franchissable.',
 'qa':'Comparer entrée et issue après placement des bagages ; aucune ressource abandonnée ne s’ajoute hors budget.'},
{'id':'maintenance','name':'arrêt de maintenance','cause':'Une intervention a interrompu l’usage du lieu. Outils et pièces sont concentrés sur la zone technique effectivement choisie.',
 'access':'Conserver entrée publique et détour autour du poste d’intervention. Le matériel de maintenance n’occupe pas l’escalier ni l’accès à la réserve.',
 'loot':'Répartir le budget d’outillage du parent vers la zone d’intervention ; ne pas transformer une pièce domestique en stock industriel sans changement de programme.',
 'light':'Lampe de tâche au poste et balise de retour ; le réseau principal peut être coupé. L’appareil doit avoir un support, une source et un état épuisé.',
 'risk':'Angle mort derrière la machine ou le poste ; le détour doit rester possible même si un contact approche de l’entrée.',
 'qa':'Prouver le trajet poste–réserve–issue ; aucun halo n’active les machines de décor.'},
{'id':'recuperation','name':'première récupération passée','cause':'Des récupérateurs ont déjà fouillé une partie accessible du lieu. Les éléments ouverts montrent leur parcours et leurs limites.',
 'access':'Conserver la collision des gros meubles et châssis ; les portes ouvertes restent liées à un état sauvegardé et ne forment pas de nouvelle brèche invisible.',
 'loot':'Les contenants visités commencent partiellement ou totalement épuisés dans une future instance ; les réserves restantes n’augmentent pas pour compenser.',
 'light':'Une balise usagée près du retour peut raconter le passage ; elle reste éteinte si aucun dispositif actif n’a été créé.',
 'risk':'Lecture trompeuse d’un site supposé vide ; le joueur doit pouvoir distinguer exploré et sûr.',
 'qa':'Vérifier états initiaux, quantités réduites et conservation exacte après aller-retour et reprise.'},
{'id':'service-arriere','name':'service déplacé à l’arrière','cause':'L’accès public a été délaissé au profit de la livraison ou du passage de maintenance, avec une cause visible près de la façade.',
 'access':'Raccorder la voie de service au réseau parent. La façade peut être encombrée seulement si une entrée alternative lisible existe.',
 'loot':'Déplacer une partie des réserves de service vers le quai ou la cour sans copier les stocks intérieurs. Garder les denrées dans leur contenant adapté.',
 'light':'Éclairer ponctuellement la porte de service et le poste de déchargement ; la façade abandonnée peut rester sombre.',
 'risk':'Arrivée par un angle étroit et retour plus long ; le coffre reste sur un emplacement réellement accessible.',
 'qa':'Tester réseau–cour–pièce–sortie et vérifier que les réserves déplacées ne restent pas doublées dans le parent.'},
{'id':'lisiere-reprise','name':'reprise progressive de la végétation','cause':'Le manque d’entretien a laissé la végétation gagner les marges et les ouvertures. L’ancien usage reste identifiable.',
 'access':'Réserver les chemins avant troncs et arbustes. Une branche visuelle n’impose pas un collider plein couvrant une porte.',
 'loot':'Conserver les ressources dans les contenants du parent ; les végétaux nouveaux ne donnent pas automatiquement un second stock de bois.',
 'light':'Lumière portée ou posée au point de travail ; les anciens appareils restent éteints sans source. La végétation ne devient pas luminescente.',
 'risk':'Silhouettes masquées et route secondaire moins lisible ; maintenir un repère de retour distinct.',
 'qa':'Contrôler le trajet après végétalisation, l’absence de ressource générée hors budget et l’état des toitures.'},
{'id':'relai-temporaire','name':'relais temporaire envisagé','cause':'Le programme prévoit une occupation future courte : travail, stockage temporaire et veille, sans déclarer de nouveaux PNJ déjà présents.',
 'access':'Séparer arrivée, circulation et repli ; ne pas fermer toutes les issues avec une défense improvisée.',
 'loot':'Le matériel de l’occupation future doit venir d’un stock ou d’un coût explicite. Le butin ancien reste un budget séparé et fini.',
 'light':'Lampe de travail et faible balisage des issues ; foyer seulement sur sol dégagé compatible. La durée et le combustible sont à raccorder au système nocturne.',
 'risk':'Une halte éclairée ne devient pas une zone sûre. Nourriture, garde et relation de faction sont à développer si l’occupation devient active.',
 'qa':'Avant intégration, tester coût d’installation, extinction, départ et sauvegarde sans duplication des réserves.'},
{'id':'reseau-coupe','name':'réseau principal coupé','cause':'Le lieu conserve ses appareils mais son alimentation principale ne fonctionne plus. Les traces de panne suivent la chaîne technique.',
 'access':'Rendre le coffret et la source atteignables depuis le service. Ne pas exiger une interaction de réparation non implémentée pour ressortir.',
 'loot':'Réserves inchangées par l’absence de courant ; les appareils ne se transforment pas tous en piles récupérables.',
 'light':'Éclairage autonome seulement : lampe, balise ou foyer adapté. Un futur rétablissement devra propager l’état vers les appareils liés.',
 'risk':'Zones d’ombre, contraste et méprise sur un bâtiment silencieux ; ni monstre fluorescent ni bonus de butin nocturne.',
 'qa':'Couper et rétablir une source dans une future intégration ; aucun point lumineux indépendant non déclaré.'},
{'id':'repli-organise','name':'repli organisé interrompu','cause':'Les occupants ont préparé une sortie secondaire et regroupé les objets utiles près d’un point de départ, avant de disparaître.',
 'access':'Garder une boucle entre pièce principale et sortie secondaire. Les défenses improvisées doivent avoir un passage lisible ou un état ouvert explicite.',
 'loot':'Déplacer les réserves réellement préparées vers le point de départ ; ne pas répliquer leur quantité dans les pièces d’origine.',
 'light':'Une balise marque l’issue et une lampe de tâche le dernier poste ; sources éteintes ou actives selon l’état de dispositif réellement généré.',
 'risk':'Cul-de-sac évitable si le repère est compris ; la seconde issue ne doit pas donner sur une parcelle inaccessible.',
 'qa':'Tester les deux sens de la boucle avec la géométrie finale et le niveau de chaque objet déplacé.'}
]
(OUT/'source/CONTEXTES.json').write_text(json.dumps(contexts,ensure_ascii=False,indent=2))
(OUT/'source/ETATS.json').write_text(json.dumps(states,ensure_ascii=False,indent=2))
def original_path(p):
 candidates=list(ORIGINAL.rglob(p['id']+'.md'))
 assert len(candidates)==1,(p['id'],candidates)
 return str(candidates[0].relative_to(OUT))
def parent_ui(p):
 first='nom' in p
 return {'id':p['id'],'name':p.get('nom',p.get('name')),'family':p.get('famille',p.get('family')),'kind':'historique','parent':None,'status':'programme historique','path':original_path(p),'summary':p.get('resume',p.get('design_intent')),'program':p}
ui=[parent_ui(p) for p in parents];children=[];paths=[]
for i,p in enumerate(parents):
 family=p.get('famille',p.get('family'));choices=contexts[family];name=p.get('nom',p.get('name'))
 # Distinct context and state for both derivatives of each parent.
 for v in range(2):
  n=1001+i*2+v;mid=choices[(i+v*max(1,len(choices)//2))%len(choices)];state=states[(i+v*3)%len(states)];m=M[mid]
  rooms=[x['nom'] for x in p.get('espaces',[])]+[x['zone'] for x in p.get('zones',[])]
  cid=f'DW-{n:04d}';first_use=rooms[0] if rooms else 'entrée du programme';last_use=rooms[-1] if rooms else 'zone de service'
  child={'id':cid,'name':name+' — '+m['title']+' / '+state['name'],'family':family,'kind':'composition','status':'conception_non_integree','parent':p['id'],'module':mid,'state':state['id'],
    'summary':f'Adapter le programme {p["id"]} ({name}) au contexte « {m["title"]} », puis appliquer l’état « {state["name"]} ». Le programme complet du parent reste la référence des pièces et gabarits.',
    'program_rules':[
       f'Préserver les usages du programme : {", ".join(rooms)}.' if rooms else 'Préserver le programme spatial complet du parent.',
       f'Raccorder « {first_use} » à l’accès public et « {last_use} » au parcours de retour ; ne pas imposer une liaison directe si le parent exige un couloir ou un niveau.',
       'Conserver dimensions, niveaux possibles et dégagements du parent. Agrandir dans les limites du programme, choisir explicitement une variante plus petite ou refuser la parcelle.',
       'Les contraintes territoriales priment sur le placement. Si le parent requiert eau, relief ou réseau spécialisé absent du contexte, réserver cet ouvrage ou refuser cette composition.'
    ],
    'overrides':{'cause':state['cause'],'access':state['access'],'loot':state['loot'],'night':state['light'],'risk':state['risk'],'qa':state['qa']},
    'acceptance':['Vérifier la compatibilité du programme avec le territoire avant géométrie.','Tester accès public, service, usage et retour après application de l’état.','Conserver la somme des ressources et les identifiants uniques, y compris les contenants déplacés.','Conserver source lumineuse, domaine, niveau et temps restant à la reprise.','Ne changer le statut qu’après implémentation, tests de comportement et preuve visuelle.'],
    'implementation':'Composition documentaire uniquement. Aucun lieu, faction, danger climatique ou mécanisme nouveau créé dans la partie par cette fiche.'}
  child['path']=f'compositions/{family.replace("/","-")}/{cid}.md'
  path=OUT/child['path'];path.parent.mkdir(parents=True,exist_ok=True)
  text=f'# {cid} — {child["name"]}\n\n**Statut : conception non intégrée.**\n\n{child["summary"]}\n\nParent conservé : `{p["id"]}` · Module : `{mid}` · État : `{state["id"]}`.\n\n'
  text+='## Programme hérité\n\n'+'\n'.join('- '+x for x in child['program_rules'])+'\n\n'
  text+='## Prescriptions territoriales\n\n'
  for key in ['layout','access','supplies','risks','night','variants']:
   text+=f'**{dict(layout="Organisation",access="Accès",supplies="Ressources",risks="Risques",night="Nuit",variants="Variantes")[key]}.** {m[key]}\n\n'
  text+='## Transformation causale\n\n'
  for key,val in child['overrides'].items():text+=f'**{dict(cause="Cause",access="Accès modifié",loot="Ressources",night="Nuit",risk="Risques",qa="Contrôle")[key]}.** {val}\n\n'
  text+='## Acceptation\n\n'+'\n'.join('- '+x for x in child['acceptance'])+'\n\n'+child['implementation']+'\n'
  text+=f'\nFiche parent originale : `{original_path(p)}`. Toutes ses pièces, props, gabarits, règles de circulation et budgets font partie de cette composition ; consulter ce parent avant génération.\n'
  path.write_text(text);children.append(child);ui.append(child)
assert len(children)==2000 and len({x['id'] for x in ui})==3000
assert len({x['name'] for x in children})==2000
for family in contexts:
 items=[x for x in children if x['family']==family]
 slug=''.join(c if c.isalnum() else '_' for c in family).strip('_')
 (OUT/'catalogues').mkdir(exist_ok=True)
 (OUT/f'catalogues/{slug}.json').write_text(json.dumps({'family':family,'count':len(items),'compositions':items},ensure_ascii=False,indent=2))
index=[{k:x.get(k) for k in ['id','name','family','kind','status','parent','module','state','path']} for x in ui]
(OUT/'INDEX_3000.json').write_text(json.dumps({'version':'1.26.0','count':3000,'originals':1000,'compositions':2000,'entries':index},ensure_ascii=False,indent=2))
(OUT/'CATALOGUE_1001_3000.json').write_text(json.dumps({'version':'1.26.0','count':2000,'fiches':children},ensure_ascii=False,indent=2))
# Bound ID claims to the actual runtime mapping; a pilot is not the complete parent programme.
if PROJECT:
 import subprocess
 code="const G=require('./src/frontier-geometry.js');process.stdout.write(JSON.stringify(G.PRESETS.map(p=>({id:p.codex,type:p.id,name:p.name,levels:p.levels}))))"
 pilots=json.loads(subprocess.check_output(['node','-e',code],cwd=PROJECT))
 (OUT/'COUVERTURE_JEU.json').write_text(json.dumps({'meaning':'62 gabarits simplifiés reliés à des identifiants historiques ; aucun dérivé1001–3000 intégré automatiquement.','pilots':pilots},ensure_ascii=False,indent=2))
pilots=json.loads((OUT/'COUVERTURE_JEU.json').read_text())['pilots']
pilot_ids={p['id'] for p in pilots}
for x in ui:
 if x['id'] in pilot_ids:x['status']='plan_pilote_partiel'
# Embedded JSON lets a direct file:// reader work offline without a local server.
data=json.dumps({'entries':ui,'modules':modules,'states':states,'pilots':pilots},ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
html=(OUT/'source/reader-template.html').read_text().replace('__CODEX_DATA__',data)
(OUT/'LIRE_CODEX_3000.html').write_text(html)
summary={'version':'1.26.0','base_originale':1000,'ajouts_composes':2000,'total':3000,'modules_territoriaux':len(modules),'gabarits_runtime':len(pilots),'conceptions_non_implantees':2000,'familles_historiques_et_supplement':len(contexts),'contexts_used':sorted({x['module'] for x in children}), 'method':'1000 programmes originaux préservés + deux compositions dérivées par parent, chacune avec contexte compatible et état distinct. Pas 3 000 architectures indépendantes ni 3 000 lieux jouables.'}
(OUT/'MESURE.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
# Preservation proof includes every original member, not only catalogue records.
manifest={str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ORIGINAL.rglob('*')) if p.is_file()}
(OUT/'ORIGINAUX_SHA256.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False))
