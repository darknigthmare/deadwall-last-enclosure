'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {execFile} = require('node:child_process'), path = require('node:path');
const execFileAsync = require('node:util').promisify(execFile);

test('derived worksheet growth preserves existing headers and data styles while displacing only its footer', async () => {
  const script = String.raw`
import copy,importlib.util,json,pathlib,sys
sys.dont_write_bytecode=True
root=pathlib.Path.cwd()
spec=importlib.util.spec_from_file_location('tracker',root/'scripts/verify-codex-tracker-xlsx2026.py')
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
empty={'cells':{},'columns':[],'styles':{},'tableDetails':[]}
inspection={'cells':{},'columns':[('A:L','width',18)],'styles':{'A1':('title',),'A5':('header',),'A6':('body',),'A7':('body',),'A8':('total',),'A9':('proof',)},'tableDetails':[{'name':'InspectionPhysique2026','range':'A5:L7'}]}
baseline={'Extension typologies':copy.deepcopy(empty),'Variantes à concevoir':copy.deepcopy(empty),'Inspection':inspection}
data={'typologies':[],'variants':[]}
baseline_before=copy.deepcopy(baseline)
unchanged=v.verify_historical_styles(copy.deepcopy(baseline),baseline,data)
assert unchanged['checkedHistoricalStyleCells']==6
assert unchanged['derivedResizedFooterCellsExcluded']==0
book=copy.deepcopy(baseline)
book['Inspection']['tableDetails'][0]['range']='A5:L9'
book['Inspection']['styles'].update({'A8':('body',),'A9':('body',),'A10':('total',),'A11':('proof',)})
book_before=copy.deepcopy(book)
result=v.verify_historical_styles(book,baseline,data)
assert result['checkedHistoricalStyleCells']==4,result
assert result['derivedResizedFooterCellsExcluded']==2,result
assert result['authorCellsWithWrapStyleChanges']==0,result
assert result['authorCellsWithEquivalentExplicitDefaults']==0,result
assert result['inheritedStylesPreserved'] is True
assert book==book_before and baseline==baseline_before,'Le lecteur a modifié une entrée'

negative=[]
for address in ['A1','A5','A6','A7']:
 negative.append(('style conservé altéré '+address,lambda candidate,address=address:candidate['Inspection']['styles'].__setitem__(address,('changed',))))
for label,value in [('réduction','A5:L6'),('colonne finale changée','A5:M9'),('colonne initiale changée','B5:L9'),('ligne initiale changée','A4:L9')]:
 negative.append((label,lambda candidate,value=value:candidate['Inspection']['tableDetails'][0].__setitem__('range',value)))
negative.append(('table renommée',lambda candidate:candidate['Inspection']['tableDetails'][0].__setitem__('name','OtherInspection')))
negative.append(('largeur historique modifiée',lambda candidate:candidate['Inspection'].__setitem__('columns',[('A:L','width',99)])))
def unchanged_range_footer(candidate,address):
 candidate['Inspection']['tableDetails'][0]['range']='A5:L7'
 candidate['Inspection']['styles']=copy.deepcopy(baseline['Inspection']['styles'])
 candidate['Inspection']['styles'][address]=('changed',)
for address in ['A8','A9']:
 negative.append(('pied sans agrandissement altéré '+address,lambda candidate,address=address:unchanged_range_footer(candidate,address)))
for label,mutate in negative:
 candidate=copy.deepcopy(book);mutate(candidate)
 try:v.verify_historical_styles(candidate,baseline,data)
 except AssertionError:pass
 else:raise AssertionError('Altération acceptée : '+label)
assert book==book_before and baseline==baseline_before,'Un contrôle négatif a modifié la base'
print(json.dumps({'pass':True,'checked':result['checkedHistoricalStyleCells'],'excluded':result['derivedResizedFooterCellsExcluded'],'unchangedChecked':unchanged['checkedHistoricalStyleCells'],'negativeCases':len(negative),'workbookWritten':False}))
`;
  const {stdout} = await execFileAsync(process.platform === 'win32' ? 'python' : 'python3', ['-c', script], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000,
  });
  const result = JSON.parse(stdout);
  assert.equal(result.pass, true); assert.equal(result.checked, 4); assert.equal(result.excluded, 2);
  assert.equal(result.unchangedChecked, 6); assert.equal(result.negativeCases, 12);
  assert.equal(result.workbookWritten, false);
});
