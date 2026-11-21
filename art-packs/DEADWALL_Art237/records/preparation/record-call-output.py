from pathlib import Path
import json,sys,subprocess,hashlib
prep=Path(__file__).resolve().parent
call_path=prep/'calls'/sys.argv[1]
call=json.loads(call_path.read_text())
native=Path(sys.argv[2]);assert native.is_file()
row={'key':call['key'],'iteration':call['iteration'],'generatedSourcePath':str(native),'prompt':call['arguments']['prompt'],'referenceImages':call['arguments']['referenced_image_paths'],'toolCallRecord':str(call_path.relative_to(prep))}
if 'correctionReason' in call:row['correctionReason']=call['correctionReason']
if 'replaces' in call:row['replaces']=call['replaces']
subprocess.run([sys.executable,str(prep/'record-results.py'),json.dumps([row])],check=True)
selection=json.loads((prep/'selection-and-prompts.json').read_text())
t=next(t for t in selection['targets'] if t['key']==row['key'])
t.update(prompt=row['prompt'],referenceImages=row['referenceImages'],iteration=row['iteration'],generationStatus='native-output-received')
known={r['path']:r for r in t['referenceFiles']}
t['referenceFiles']=[known.get(ref,{'path':ref,'sha256':hashlib.sha256(Path(ref).read_bytes()).hexdigest(),'bytes':Path(ref).stat().st_size,'role':'Earlier native generated output, inspected before targeted ImageGen correction; preserved unchanged.'}) for ref in row['referenceImages']]
(prep/'selection-and-prompts.json').write_text(json.dumps(selection,ensure_ascii=False,indent=2)+'\n')
receipt={'key':call['key'],'iteration':call['iteration'],'status':'native-output-received','callRecord':str(call_path.relative_to(prep)),'generatedSourcePath':str(native),'sha256':hashlib.sha256(native.read_bytes()).hexdigest(),'bytes':native.stat().st_size,'pixelEditingPerformed':False}
(prep/'calls'/(call_path.stem+'-output.json')).write_text(json.dumps(receipt,indent=2)+'\n')
