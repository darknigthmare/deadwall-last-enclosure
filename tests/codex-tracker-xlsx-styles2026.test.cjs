'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process'), path = require('node:path');
test('le lecteur XML détecte une altération réelle des styles historiques sans éditer le classeur source', () => {
  const script = String.raw`
import hashlib,importlib.util,json,pathlib,sys,tempfile,xml.etree.ElementTree as E,zipfile
sys.dont_write_bytecode=True
root=pathlib.Path.cwd()
spec=importlib.util.spec_from_file_location('verifier',root/'scripts/verify-codex-tracker-xlsx2026.py')
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
source=root/'docs/codex/suivi-monde2026/DEADWALL_CODEX_MONDE_SUIVI.xlsx'
before=hashlib.sha256(source.read_bytes()).hexdigest()
baseline=v.read_workbook(source)
data={'typologies':[],'variants':[]}
v.verify_historical_styles(baseline,baseline,data)
with tempfile.TemporaryDirectory(prefix='deadwall-xlsx-style-') as folder:
 target=pathlib.Path(folder)/'altered.xlsx'
 with zipfile.ZipFile(source) as old,zipfile.ZipFile(target,'w') as new:
  styles=E.fromstring(old.read('xl/styles.xml'))
  tab=E.fromstring(old.read('xl/worksheets/sheet1.xml'))
  first=tab.find('m:sheetData/m:row/m:c',v.NS)
  xf=list(styles.find('m:cellXfs',v.NS))[int(first.attrib.get('s','0'))]
  font=list(styles.find('m:fonts',v.NS))[int(xf.attrib.get('fontId','0'))]
  size=font.find('m:sz',v.NS)
  if size is None:size=E.SubElement(font,'{'+v.NS['m']+'}sz')
  size.set('val','99')
  for info in old.infolist():new.writestr(info,E.tostring(styles) if info.filename=='xl/styles.xml' else old.read(info.filename))
 changed=v.read_workbook(target)
 try:v.verify_historical_styles(changed,baseline,data)
 except AssertionError as error:
  assert 'style historique' in str(error),str(error)
 else:raise AssertionError('La modification de police n’a pas été détectée.')
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
print(json.dumps({'sheets':len(baseline),'styledCells':sum(len(t['styles']) for t in baseline.values()),'mutationDetected':True,'sourceUnchanged':True}))
`;
  const result = JSON.parse(execFileSync('python3', ['-c', script], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000,
  }));
  assert.equal(result.sheets, 13); assert.ok(result.styledCells > 90000);
  assert.equal(result.mutationDetected, true); assert.equal(result.sourceUnchanged, true);
});
