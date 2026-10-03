from pathlib import Path
from collections import Counter
import json,hashlib,re,sys
root=Path(__file__).resolve().parents[1]
index=json.loads((root/'INDEX_3000.json').read_text());items=index['entries'];children=json.loads((root/'CATALOGUE_1001_3000.json').read_text())['fiches'];modules=json.loads((root/'source/MODULES.json').read_text());states=json.loads((root/'source/ETATS.json').read_text());compat=json.loads((root/'source/CONTEXTES.json').read_text());hashes=json.loads((root/'ORIGINAUX_SHA256.json').read_text())
assert len(items)==len({x['id'] for x in items})==3000
assert {x['id'] for x in items}=={f'DW-{i:04d}' for i in range(1,3001)}
assert all((root/x['path']).is_file() for x in items)
assert len(children)==2000
assert Counter(x['parent'] for x in children)==Counter({f'DW-{i:04d}':2 for i in range(1,1001)})
mod={m['id'] for m in modules};state={s['id'] for s in states}
for x in children:
 assert x['module'] in mod and x['module'] in compat[x['family']] and x['state'] in state
 assert x['status']=='conception_non_integree' and len(x['program_rules'])==4 and len(x['acceptance'])==5
 assert set(x['overrides'])=={'cause','access','loot','night','risk','qa'}
 assert all(len(v)>65 for v in x['overrides'].values())
for i in range(0,len(children),2):
 a,b=children[i:i+2];assert a['module']!=b['module'] and a['state']!=b['state']
for p,h in hashes.items():assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h
html=(root/'LIRE_CODEX_3000.html').read_text();payload=html.split('<script id="codex-data" type="application/json">',1)[1].split('</script>',1)[0];data=json.loads(payload)
assert len(data['entries'])==3000 and len(data['modules'])==59 and len(data['pilots'])==62
assert all(x.get('program') for x in data['entries'][:1000])
originals={x['id']:x for p in (root/'originaux').rglob('CATALOGUE*.json') for x in json.loads(p.read_text())['fiches']}
assert all(x['program']==originals[x['id']] for x in data['entries'][:1000])
assert 'fetch(' not in html and 'PAGE=24' in html
(root/'source/reader-runtime.js').write_text(html.split('</script><script>',1)[1].split('</script>',1)[0])
result={'total':3000,'parents':1000,'compositions':2000,'modules':59,'pilots':62,'original_files_preserved':len(hashes),'original_payloads_unchanged':1000,'all_paths_exist':True,'ids_contiguous_unique':True,'parents_resolve':True,'distinct_context_and_state_per_parent':True,'contexts_compatible_with_family':True,'complete_parent_in_offline_reader':True,'offline_without_fetch':True,'initial_page_limit':24,'scope':'Données et conservation ; aucune certification de3000 lieux en jeu.'}
(root/'VALIDATION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
