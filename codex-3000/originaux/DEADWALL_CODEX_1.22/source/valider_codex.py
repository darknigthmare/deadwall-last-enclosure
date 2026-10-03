#!/usr/bin/env python3
"""Validate the authored catalogue and its deliverable links, not unimplemented game worlds."""
from pathlib import Path
import json, collections, hashlib
R=Path(__file__).resolve().parents[1]
d=json.loads((R/'CATALOGUE_500.json').read_text());rows=d['fiches'];checks=[]
def check(name,condition):
 if not condition:raise AssertionError(name)
 checks.append({'controle':name,'reussi':True})
check('500 fiches exactement',len(rows)==500)
check('500 identifiants ordonnés et stables',[r['id'] for r in rows]==[f'DW-{i:04}' for i in range(1,501)])
check('500 noms distincts',len({r['nom'].casefold() for r in rows})==500)
families=collections.Counter(r['famille'] for r in rows)
check('25 familles, 20 fiches chacune',len(families)==25 and set(families.values())=={20})
check('42 pilotes et 458 conceptions distincts',collections.Counter(r['statut'] for r in rows)=={'pilote_1_15':22,'pilote_1_16':12,'pilote_1_17':8,'conception_non_integree':458})
check('Guide opérationnel 1.18 présent',(R/'05_RELAIS_1.18.md').exists())
space_ids=[];props=0
for r in rows:
 checkfile=R/'fiches'/f"{r['id']}.md"
 if not checkfile.exists() or r['nom'] not in checkfile.read_text():raise AssertionError('Markdown '+r['id'])
 virtual={'voie_publique','parvis','distribution','voie_service','cour_service','noyau_vertical'}
 ids={s['id'] for s in r['espaces']};space_ids+=list(ids)
 for edge in r['graphe_acces']:
  if edge['de'] not in ids|virtual or edge['vers'] not in ids|virtual or edge['largeur_min_m']<=0:raise AssertionError('graphe '+r['id'])
 for e in r['espaces']:
  if e['surface_unitaire_m2'][1]<e['surface_unitaire_m2'][0] or not e['niveaux_candidats']:raise AssertionError('dimensions '+e['id'])
  for p in e['props']:
   props+=1
   if any(n<=0 for n in p['gabarit_m'].values()) or p['quantite_par_espace'][0]<1 or p['quantite_par_espace'][1]<p['quantite_par_espace'][0]:raise AssertionError('prop '+e['id'])
check('2061 espaces distincts documentés',len(space_ids)==2061 and len(set(space_ids))==2061)
check('Chaque fiche possède un Markdown correspondant',len(list((R/'fiches').glob('DW-*.md')))==500)
check('Graphes, plages de dimensions et props valides',props>5000)
check('Aucun statut intégré donné aux 458 plans futurs',all(r['integration']['archetype_runtime'] is None for r in rows if r['statut']=='conception_non_integree'))
try:
 import jsonschema
 jsonschema.validate(d,json.loads((R/'SCHEMA_CATALOGUE.json').read_text()))
 check('Validation JSON Schema',True)
except ImportError:
 checks.append({'controle':'Validation JSON Schema','reussi':None,'limite':'jsonschema non installé; contrôles structuraux explicites exécutés'})
for f in ['00_LIRE_AVANT_GENERATION.md','01_CENTRE_COMMERCIAL_EXEMPLE.md','02_PROMPT_DE_CONTINUATION.md','LECTEUR_CODEX_500.html','INDEX.md','PROPS_GABARITS.json']:
 if not (R/f).is_file():raise AssertionError(f)
check('Guides et lecteur présents',True)
check('Aucun fichier de police embarqué',not any(p.suffix.lower() in {'.otf','.ttf','.woff','.woff2'} for p in R.rglob('*')))
result={'version':'1.3.0','perimetre':'Validation documentaire du codex externe, pas qualification de 500 niveaux jouables','fiches':500,'familles':dict(families),'espaces':len(space_ids),'descriptions_de_props':props,'controles':checks}
(R/'VALIDATION_CODEX.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'fiches':500,'espaces':len(space_ids),'descriptions_de_props':props,'controles':len(checks)},ensure_ascii=False))
