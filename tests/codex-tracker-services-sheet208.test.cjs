'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {execFile} = require('node:child_process');
const execFileAsync = require('node:util').promisify(execFile);
const path = require('node:path');

test('the independent services worksheet reader keeps models, site poses and prepared art separate', async () => {
  // This fixture is deliberately unrelated to the generated JSON or workbook:
  // 200 models offer 650 supports, while 23 witnessed sites offer only 360.
  const script = String.raw`
import copy,importlib.util,json,pathlib,sys
sys.dont_write_bytecode=True
root=pathlib.Path.cwd()
spec=importlib.util.spec_from_file_location('tracker',root/'scripts/verify-codex-tracker-xlsx2026.py')
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
types=['EXT-MONDE-T045','EXT-MONDE-T046','EXT-MONDE-T047','EXT-MONDE-T048']
actions=['meal','restSheltered','service','medicalCare']
records=[]
for type_index,t in enumerate(types):
 for n in range(1,51):
  model_actions=actions if t==types[2] else actions[:3]
  supports=[]
  for index,action in enumerate(model_actions):
   kind={'meal':'oven','restSheltered':'singleBunk','service':'toolbox' if t==types[0] else 'workbench','medicalCare':'medical'}[action]
   support={'supportId':'P'+str(type_index*50+n).zfill(4)+':0:'+str(index),'action':action,'supportKind':kind,'anchor':{'x':3+index,'y':4,'z':0},'accessible':not(t==types[3] and n==50 and action=='service')}
   if not support['accessible']:support['reason']='Face obstruée dans ce modèle synthétique'
   supports.append(support)
  records.append({'authorPlanId':t+'-V'+str(n).zfill(2),'typologyId':t,'number':n,'campaignType':'campaign205-'+t[-3:]+'-'+str(n).zfill(2),'supports':supports,'supportCountsByAction':{a:sum(s['action']==a for s in supports) for a in actions},'anchorsOffered':len(supports),'anchorsValid':sum(s['accessible'] for s in supports),'refusals':[{k:s[k] for k in ['supportId','action','reason']} for s in supports if not s['accessible']]})
summary={'types':4,'models':200,'offered':650,'valid':649,'refused':1,'modelsWithAccessibleSupport':200,'modelsWithoutAccessibleSupport':0,'byAction':{'meal':{'offered':200,'valid':200,'refused':0},'restSheltered':{'offered':200,'valid':200,'refused':0},'service':{'offered':200,'valid':199,'refused':1},'medicalCare':{'offered':50,'valid':50,'refused':0}}}
assert len(records)==200 and sum(r['anchorsOffered'] for r in records)==650
assert sum(r['anchorsValid'] for r in records)==649 and sum(len(r['refusals']) for r in records)==1
visual=[]
for r in records:
 if r['number']!=1:continue
 for s in r['supports']:
  visual.append({**{k:r[k] for k in ['authorPlanId','typologyId','number','campaignType']},'supportId':s['supportId'],'supportKind':s['supportKind'],'action':s['action'],'pass':True})
assert len(visual)==13 and len({r['authorPlanId'] for r in visual})==4
coverage={'records':records,'summary':summary,'worldSummary':{'seeds':3,'sites':23,'offered':360,'valid':360,'refused':0,'transactions':0},'worldWitnesses':[{'seed':s} for s in [0,17117,967313470]],'report':'docs/codex/suivi-monde2026/campagne208-services.json','evidence':'docs/codex/suivi-monde2026/SERVICES_G11_2026.md','reportSha256':'b'*64,'art':{'records':visual,'summary':{'types':4,'models':4,'samples':13,'actions':4,'passedSamples':13},'report':'docs/codex/suivi-monde2026/campagne208-art.json','evidence':'docs/codex/suivi-monde2026/SERVICES_G11_2026.md#presentation-preparee','reportSha256':'c'*64}}
data={'campaign208':coverage,'typologies':[{'id':t,'name':'Name '+t} for t in types]}
base='https://github.com/darknigthmare/deadwall-last-enclosure/blob/'+'a'*40+'/'
scope='Supports proposés et poses canoniques ; parcours et transactions distincts.'
global_scope='Supports et présentations préparées ; aucune qualification globale des 4 000 plans.'
tab={'cells':{},'formulas':{},'tableDetails':[{'name':'ServicesG11208','range':'A5:P205','filterRange':'A5:P205','filterColumns':[]}],'merges':['A1:P2','A3:P3','A206:B206','N206:P206','A208:P208','A209:P209'],'hiddenRows':[],'hiddenColumns':[],'state':'visible','errors':[],'missing':[]}
for row,r in enumerate(records,6):
 visual_count=sum(s['authorPlanId']==r['authorPlanId'] for s in visual)
 values=[r['authorPlanId'],'Name '+r['typologyId'],r['number'],r['campaignType'],r['anchorsOffered'],r['anchorsValid'],len(r['refusals']),*[r['supportCountsByAction'][a] for a in actions],'Oui' if visual_count else 'Non',visual_count,base+coverage['report'],base+coverage['art']['report'],scope]
 for column,value in enumerate(values):tab['cells'][chr(65+column)+str(row)]=value
tab['cells']['C206']=200;tab['formulas']['C206']='COUNTA(A6:A205)'
for column in ['E','F','G','H','I','J','K','M']:
 tab['cells'][column+'206']=sum(tab['cells'][column+str(row)] for row in range(6,206))
 tab['formulas'][column+'206']='SUM('+column+'6:'+column+'205)'
tab['cells']['L206']=4;tab['formulas']['L206']='COUNTIF(L6:L205,"Oui")'
tab['cells'].update({'E211':3,'I211':'0, 17117, 967313470','E212':23,'I212':360,'M212':360,'E213':0,'E214':base+coverage['report'],'E215':coverage['reportSha256'],'E216':base+coverage['art']['report'],'E217':coverage['art']['reportSha256'],'E218':base+coverage['evidence'],'E219':global_scope,'E220':4,'I220':13})
for row in range(211,221):
 tab['merges'].append('A'+str(row)+':D'+str(row))
 tab['merges'].append('E'+str(row)+(':'+('H' if row in [211,212,220] else 'P'))+str(row))
 if row in [211,220]:tab['merges'].append('I'+str(row)+':P'+str(row))
 if row==212:tab['merges'].extend(['I212:L212','M212:P212'])
book={'Publication':{'cells':{'B7':'a'*40}},'Services G11':tab}
expected={**summary,'worldSeeds':3,'worldSites':23,'transactionsTested':0,'visualModels':4,'visualSamples':13}
before=copy.deepcopy(book)
assert v.verify_services(book,data)==expected
assert book==before,'Le lecteur a modifié son entrée'
assert v.verify_services(book,{}) is None

negative=[]
def cell(label,address,value):
 negative.append((label,lambda b,address=address,value=value:b['Services G11']['cells'].__setitem__(address,value)))
def formula(label,address,value):
 negative.append((label,lambda b,address=address,value=value:b['Services G11']['formulas'].__setitem__(address,value)))
for label,address,value in [
 ('site count presented as model count','C206',23),('visual model count presented as model count','C206',4),('all authored plans presented as models','C206',4000),
 ('world offers presented as model offers','E206',360),('world anchors presented as model anchors','F206',360),('model refusal hidden by world success','G206',0),
 ('incorrect meal total','H206',360),('incorrect rest total','I206',4),('incorrect service total','J206',0),('medical scope inflated to all models','K206',200),
 ('all models claimed visually sampled','L206',200),('visual sample count confused with models','M206',4),
 ('model offer count changed','E6',200),('invalid support counted as accessible','F205',3),('explicit model refusal omitted','G205',0),
 ('meal support count changed','H6',2),('rest support count changed','I6',0),('service support count changed','J6',0),('medical support invented outside T047','K6',1),
 ('unsampled V02 marked visual','L7','Oui'),('V01 visual count extrapolated','M6',13),('typology name changed','B6','Other name'),('variant number changed','C6',2),
 ('campaign alias points at another model','D6','campaign205-045-02'),('duplicate authored ID','A7',tab['cells']['A6']),('empty authored ID','A6',''),('unknown authored ID','A6','EXT-MONDE-T049-V01'),
 ('support URL substituted in row','N6',base+'other-report.json'),('support URL uses branch in row','N6',base.replace('a'*40,'main')+coverage['report']),
 ('art URL substituted in row','O6',base+coverage['report']),('row scope claims transactions','P6','200 modèles jouables ; transactions validées.'),
 ('models presented as seeds','E211',200),('seed zero missing','I211','17117, 967313470'),('seed order changed','I211','17117, 0, 967313470'),('unobserved seed added','I211','0, 17117, 967313470, 42'),
 ('models presented as native sites','E212',200),('model offers presented as native offers','I212',650),('model anchors presented as native anchors','M212',649),('transactions inferred from poses','E213',360),
 ('support footer URL changed','E214',base+'other-report.json'),('support hash changed','E215','d'*64),('support hash truncated','E215','b'*63),
 ('art footer URL changed','E216',base+coverage['report']),('art hash changed','E217','d'*64),('art hash truncated','E217','c'*63),('evidence URL changed','E218','https://example.com/'+coverage['evidence']),
 ('global scope promoted','E219','Les 4 000 plans sont intégralement qualifiés.'),('all models claimed visually reviewed','E220',200),('samples presented as visual models','E220',13),('models presented as visual samples','I220',200),('visual models presented as samples','I220',4),
]:cell(label,address,value)
for address in ['C206','E206','F206','G206','H206','I206','J206','K206','L206','M206']:
 negative.append(('formula absent '+address,lambda b,address=address:b['Services G11']['formulas'].pop(address)))
 negative.append(('formula result absent '+address,lambda b,address=address:b['Services G11']['cells'].pop(address)))
formula('model formula counts native sites','C206','COUNTA(A6:A28)')
formula('model formula includes total row','C206','COUNTA(A6:A206)')
formula('offer sum omits last model','E206','SUM(E6:E204)')
formula('valid sum uses offers','F206','SUM(E6:E205)')
formula('visual formula counts all populated labels','L206','COUNTA(L6:L205)')
formula('visual formula counts negative labels','L206','COUNTIF(L6:L205,"Non")')
formula('visual sample formula uses model flag','M206','SUM(L6:L205)')
negative.extend([
 ('native table absent',lambda b:b['Services G11'].__setitem__('tableDetails',[])),
 ('native table duplicated',lambda b:b['Services G11']['tableDetails'].append(copy.deepcopy(b['Services G11']['tableDetails'][0]))),
 ('wrong table identity',lambda b:b['Services G11']['tableDetails'][0].__setitem__('name','CampagneG11205')),
 ('table omits model row',lambda b:b['Services G11']['tableDetails'][0].__setitem__('range','A5:P204')),
 ('table includes total row',lambda b:b['Services G11']['tableDetails'][0].__setitem__('range','A5:P206')),
 ('table omits scope column',lambda b:b['Services G11']['tableDetails'][0].__setitem__('range','A5:O205')),
 ('filter omits model row',lambda b:b['Services G11']['tableDetails'][0].__setitem__('filterRange','A5:P204')),
 ('active table filter hides evidence',lambda b:b['Services G11']['tableDetails'][0].__setitem__('filterColumns',['<filterColumn colId="11"/>'])),
 ('merged model row',lambda b:b['Services G11']['merges'].append('A6:P6')),
 ('merge crosses last model',lambda b:b['Services G11']['merges'].append('N205:P206')),
 ('hidden first model row',lambda b:b['Services G11'].__setitem__('hiddenRows',[6])),
 ('hidden last model row',lambda b:b['Services G11'].__setitem__('hiddenRows',[205])),
 ('hidden evidence column',lambda b:b['Services G11'].__setitem__('hiddenColumns',[(14,14)])),
 ('hidden services worksheet',lambda b:b['Services G11'].__setitem__('state','hidden')),
 ('very hidden services worksheet',lambda b:b['Services G11'].__setitem__('state','veryHidden')),
 ('publication commit changed',lambda b:b['Publication']['cells'].__setitem__('B7','e'*40)),
])
rejected=[]
for label,mutate in negative:
 candidate=copy.deepcopy(book);mutate(candidate)
 try:v.verify_services(candidate,data)
 except AssertionError:rejected.append(label)
 else:raise AssertionError('Preuve altérée acceptée : '+label)
assert book==before,'Une vérification négative a modifié la base'
print(json.dumps({**expected,'pass':True,'negativeCases':len(rejected),'workbookWritten':False}))
`;
  const {stdout} = await execFileAsync(process.platform === 'win32' ? 'python' : 'python3', ['-c', script], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000,
  });
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true); assert.equal(result.models, 200);
  assert.equal(result.offered, 650); assert.equal(result.valid, 649); assert.equal(result.refused, 1);
  assert.equal(result.worldSeeds, 3); assert.equal(result.worldSites, 23);
  assert.equal(result.transactionsTested, 0);
  assert.equal(result.visualModels, 4); assert.equal(result.visualSamples, 13);
  assert.equal(result.negativeCases, 94); assert.equal(result.workbookWritten, false);
});
