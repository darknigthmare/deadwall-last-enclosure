'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const path = require('node:path');

test('the independent G11 worksheet reader rejects model/site confusion, aliases, hidden rows and missing formula proofs', () => {
  const script = String.raw`
import copy,importlib.util,json,pathlib,sys
sys.dont_write_bytecode=True
root=pathlib.Path.cwd()
spec=importlib.util.spec_from_file_location('tracker',root/'scripts/verify-codex-tracker-xlsx2026.py')
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
types=['EXT-MONDE-T045','EXT-MONDE-T046','EXT-MONDE-T047','EXT-MONDE-T048']
records=[{'id':t+'-V'+str(n).zfill(2),'typologyId':t,'number':n,'campaignType':'campaign205-'+t[-3:]+'-'+str(n).zfill(2),'observedInstances':2 if (t==types[0] and n==1) else 0,'observedSeeds':[42] if (t==types[0] and n==1) else []} for t in types for n in range(1,51)]
summary={'types':4,'eligibleVariants':200,'passedVariants':200,'guaranteedSitesPerSeed':0,'observedSeeds':2,'observedSites':2,'observedVariants':1}
coverage={'records':records,'summary':summary,'witnessSeeds':[42,101],'report':'docs/codex/suivi-monde2026/campagne205-eligibilite.json','evidence':'docs/codex/suivi-monde2026/CAMPAGNE_G11_2026.md','reportSha256':'b'*64}
data={'campaign205':coverage,'typologies':[{'id':t,'name':'Name '+t} for t in types]}
base='https://github.com/darknigthmare/deadwall-last-enclosure/blob/'+'a'*40+'/'
tab={'cells':{},'formulas':{},'tableDetails':[{'name':'CampagneG11205','range':'A5:L205','filterRange':'A5:L205'}],'merges':['A1:L2','A3:L3','A206:B206']}
for row,r in enumerate(records,6):
 values=[r['id'],'Name '+r['typologyId'],r['number'],r['campaignType'],'Oui','Oui','Oui','Oui','Oui',r['observedInstances'],', '.join(str(s) for s in r['observedSeeds']) or 'Aucun témoin pour cette variante',base+coverage['report']]
 for c,value in enumerate(values):tab['cells'][chr(65+c)+str(row)]=value
for c in ['C','F','G','H','I']:
 source='E' if c=='C' else c;tab['cells'][c+'206']=200;tab['formulas'][c+'206']='COUNTIF('+source+'6:'+source+'205,"Oui")'
tab['cells'].update({'J206':2,'E211':2,'I211':'42, 101','E212':base+coverage['report'],'E213':coverage['reportSha256'],'E214':'Éligibilité de modèles ; aucun nombre de lieux garanti par graine.','E215':base+coverage['evidence']})
tab['formulas']['J206']='SUM(J6:J205)'
book={'Publication':{'cells':{'B7':'a'*40}},'Campagne G11':tab}
assert v.verify_campaign(book,data)==summary
negative=[lambda t:t['cells'].__setitem__('J206',200),lambda t:t['cells'].__setitem__('E211',200),lambda t:t['cells'].__setitem__('D6','campaign205-046-01'),lambda t:t['cells'].__setitem__('L6',base+'other-report.json'),lambda t:t['cells'].__setitem__('A7',t['cells']['A6']),lambda t:t['formulas'].pop('C206'),lambda t:t['merges'].append('A6:L6')]
for mutate in negative:
 candidate=copy.deepcopy(book);mutate(candidate['Campagne G11'])
 try:v.verify_campaign(candidate,data)
 except AssertionError:pass
 else:raise AssertionError('Un faux compteur ou une preuve altérée a été accepté')
print(json.dumps({'pass':True,'eligible':200,'observedSites':2,'observedSeeds':2,'negativeCases':len(negative),'workbookWritten':False}))
`;
  const result = JSON.parse(execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', script], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000,
  }));
  assert.equal(result.pass, true); assert.equal(result.eligible, 200);
  assert.equal(result.observedSites, 2); assert.equal(result.observedSeeds, 2);
  assert.equal(result.negativeCases, 7); assert.equal(result.workbookWritten, false);
});
