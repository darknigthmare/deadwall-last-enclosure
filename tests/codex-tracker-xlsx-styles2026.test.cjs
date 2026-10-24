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
 for component in ['font','fill']:
  target=pathlib.Path(folder)/(component+'.xlsx')
  with zipfile.ZipFile(source) as old,zipfile.ZipFile(target,'w') as new:
   styles=E.fromstring(old.read('xl/styles.xml'))
   tab=E.fromstring(old.read('xl/worksheets/sheet3.xml'))
   first=next(c for c in tab.findall('m:sheetData/m:row/m:c',v.NS) if c.attrib['r']=='A6')
   xf=list(styles.find('m:cellXfs',v.NS))[int(first.attrib.get('s','0'))]
   if component=='font':
    font=list(styles.find('m:fonts',v.NS))[int(xf.attrib.get('fontId','0'))]
    size=font.find('m:sz',v.NS)
    if size is None:size=E.SubElement(font,'{'+v.NS['m']+'}sz')
    size.set('val','99')
   else:
    fill=list(styles.find('m:fills',v.NS))[int(xf.attrib.get('fillId','0'))]
    fill.clear()
    pattern=E.SubElement(fill,'{'+v.NS['m']+'}patternFill',{'patternType':'solid'})
    E.SubElement(pattern,'{'+v.NS['m']+'}fgColor',{'rgb':'FF00FF00'})
   for info in old.infolist():new.writestr(info,E.tostring(styles) if info.filename=='xl/styles.xml' else old.read(info.filename))
  changed=v.read_workbook(target)
  try:v.verify_historical_styles(changed,baseline,data)
  except AssertionError as error:assert 'style historique' in str(error),str(error)
  else:raise AssertionError('Modification non détectée : '+component)
  # Exercise the author-only wrap normalization too, isolating this real
  # changed signature so an earlier unrelated cell cannot reject it first.
  scoped=dict(baseline);scoped['Extension typologies']=dict(baseline['Extension typologies'])
  for key in ['styles','stylesWithoutWrap','stylesWithoutWrapRaw']:
   scoped['Extension typologies'][key]=dict(baseline['Extension typologies'][key])
   scoped['Extension typologies'][key]['A6']=changed['Extension typologies'][key]['A6']
  author={'typologies':[{'id':'EXT-MONDE-T001','dimensions_m':{'scope':'choix de composition auteur'}}],'variants':[]}
  try:v.verify_historical_styles(scoped,baseline,author)
  except AssertionError as error:assert 'style historique A6' in str(error),str(error)
  else:raise AssertionError('La normalisation a masqué une modification : '+component)
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
print(json.dumps({'sheets':len(baseline),'styledCells':sum(len(t['styles']) for t in baseline.values()),'mutationDetected':True,'fontAndFillDetectedInAuthorRows':True,'sourceUnchanged':True}))
`;
  const result = JSON.parse(execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', script], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 30000,
  }));
  assert.equal(result.sheets, 14); assert.ok(result.styledCells > 90000);
  assert.equal(result.mutationDetected, true); assert.equal(result.sourceUnchanged, true);
  assert.equal(result.fontAndFillDetectedInAuthorRows, true);
});
