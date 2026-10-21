#!/usr/bin/env python3
"""Read-only comparison of XLSX cells to regenerated JSON. No spreadsheet edits."""
import collections,json,pathlib,sys,zipfile,xml.etree.ElementTree as E
N={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
def verify(file,data_dir):
    d=pathlib.Path(data_dir)
    datasets={k:json.loads((d/f).read_text()) for k,f in [('tasks','chantiers.json'),('types','typologies-cibles.json'),('variants','variantes-a-concevoir.json')]}
    with zipfile.ZipFile(file) as z:
        assert z.testzip() is None
        rels={e.attrib['Id']:e.attrib['Target'] for e in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            strings=[''.join(e.itertext()) for e in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',N)]
        def val(c):
            if c.attrib.get('t')=='inlineStr':return ''.join(c.find('s:is',N).itertext())
            v=c.find('s:v',N)
            if v is None or v.text is None:return None
            return strings[int(v.text)] if c.attrib.get('t')=='s' else v.text
        sheets={};formulas=0
        for sh in E.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet',N):
            target=rels[sh.attrib[REL]];target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
            xml=E.fromstring(z.read(target));cells={}
            for c in xml.findall('.//s:sheetData/s:row/s:c',N):
                value=val(c);assert c.attrib.get('t')!='e',(sh.attrib['name'],c.attrib['r'],value)
                if c.find('s:f',N) is not None:
                    formulas+=1;assert value is not None,('uncached formula',c.attrib['r'])
                cells[c.attrib['r']]=value
            sheets[sh.attrib['name']]=cells
        for key,name,col in [('tasks','Chantiers','G'),('types','Extension typologies','E'),('variants','Variantes à concevoir','F')]:
            values=sheets[name];actual={values['A'+str(row)]:values.get(col+str(row)) for row in range(6,6+len(datasets[key]))}
            assert actual=={r['id']:r['status'] for r in datasets[key]},name
        dash=sheets['Accueil'];counts=collections.Counter(t['status'] for t in datasets['tasks'])
        expected={'A6':4000,'D6':2000,'G6':80,'J6':4000,'C13':12060,'C14':13539,'C15':800,'C16':counts['Validé'],'C17':0,'C18':0,'K13':counts['À faire'],'K14':counts['En cours'],'K15':counts['Validé'],'K16':150,'K17':250,'K18':3600}
        for cell,expected_value in expected.items():assert float(dash[cell])==expected_value,(cell,dash[cell],expected_value)
        assert all(float(sheets['Extension typologies']['L'+str(i)])==50 for i in range(6,86))
        assert len(sheets)==11
        return {'passed':True,'sheets':len(sheets),'formulas':formulas,'errors':0,'uncached':0,'taskCounts':dict(counts),'sourceComparison':'all 4880 IDs and status cells'}
if __name__=='__main__':print(json.dumps(verify(sys.argv[1],sys.argv[2]),ensure_ascii=False,indent=2))
