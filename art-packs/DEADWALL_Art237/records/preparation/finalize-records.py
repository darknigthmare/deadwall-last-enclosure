from pathlib import Path
import json,hashlib,shutil
from PIL import Image
import numpy as np

p=Path(__file__).resolve().parent
read=lambda name:json.loads((p/name).read_text())
write=lambda name,data:(p/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
selection=read('selection-and-prompts.json');targets={t['key']:t for t in selection['targets']}
results=read('results.json');history=read('history-results.json');alpha=read('alpha-review.json')
ar={(a['key'],a['iteration']):a for a in alpha}
observations={
 'breachClamp193':'Two curved opposed inward-toothed jaw plates and their two circular hinge eyes remain on the open timber frame. Four corner damper plates and the two diagonal X members remain in front; no target, action, supplies or added mechanism.',
 'enduranceRack193':'Exactly four hanging rack plates remain in the rectangular upper frame. Iteration 2 restores a continuous lower rack rail in front of the angled ratchet blade, matching the native hardware-last order. Left pivot, right spring/hook, two base rails and support glimpses remain. Painted detail and bevels are interpretive; no pixel or metric identity is certified.',
 'shieldTongs193':'Two opposed jaw plates remain in their armed pose, with two broad separate inward-leaning tong bars; the bars do not cross. Open central gap, side pivots and support frame remain visible; no held shield or extra target.',
 'quickCable193':'Low horizontal twin-rail assembly preserves the left hooked slider, right toothed slider, two hollow annular reels and separate lower bar/cable. Background samples with visible RGB under alpha 0 are genuinely transparent. The full object is uncut. Horizontal clear margin is about 9.18%, less than requested in the prompts; this limitation is disclosed.',
 'siegeBrake193':'Braced central pivot, angled lever, right chain-hung rectangular counterweight, upper-left brake block and four lower V-shaped chain sections remain recognisable in the same projection. No swing, new loose chain or extra counterweight.'
}
reviews={};iteration_reviews=[]
for r in history:
 a=ar[(r['key'],r['iteration'])];im=Image.open(r['generatedSourcePath']);assert im.mode=='RGBA'
 raw=Path(r['generatedSourcePath']).read_bytes();assert hashlib.sha256(raw).hexdigest()==a['sha256']
 bounds=a['alpha']['bboxAlpha16'];w,h=a['dimensions']
 margins=[bounds[0]/w,bounds[1]/h,(w-bounds[2])/w,(h-bounds[3])/h]
 selected=any(x['key']==r['key'] and x['iteration']==r['iteration'] for x in results)
 row={
  'key':r['key'],'id':r['id'],'artId':r['artId'],'iteration':r['iteration'],'generatedSourcePath':r['generatedSourcePath'],'file':r['file'],'sha256':a['sha256'],
  'canonicalReferenceSha256':targets[r['key']]['canonicalReference']['sha256'],
  'decision':'accepted_source_art_proposal' if selected else 'superseded_preserved_native_history',
  'reviewer':'defenses_art237','method':'Visual comparison of native PNGs with the inspected unchanged-renderer canonical image, plus read-only alpha/SHA analysis.',
  'observation':observations[r['key']],
  'dimensions':a['dimensions'],'nativeMode':'RGBA','nativeCopyByteIdentical':True,'pixelEditingPerformed':False,
  'clearMarginFractionAtAlpha16':{'left':margins[0],'top':margins[1],'right':margins[2],'bottom':margins[3]},
  'allForegroundComplete':True,'sourceProposalOnly':True,'metricFidelityCertified':False,'pixelIdentityCertified':False,'runtimeIntegrated':False,'animationReplacement':False,
  'alphaCaveat':'Nonzero alpha up to 1 may reach the outer edge in square outputs; those native traces were measured and retained. RGB under alpha 0 is not treated as an opaque background.',
 }
 if r['key']=='enduranceRack193' and r['iteration']==1:
  row['observation']='Initial native output preserved. The angled ratchet blade appeared in front of the lower rack rail. A targeted ImageGen correction restored the native foreground rail order in iteration 2.'
 if r['key']=='quickCable193' and r['iteration']==1:
  row['observation']='Initial native output preserved. A broad brown backdrop appeared in the preview, but sampled pixels were all alpha 0. Iteration 2 was requested as a clarification of background/framing; this is not evidence of an opaque background in iteration 1.'
 iteration_reviews.append(row)
 if selected:reviews[r['key']]=row
write('review.json',reviews);write('iteration-review.json',iteration_reviews)

# Preserve the original, unsent plan separately. Only actual tool request records
# below are called generation-prompts; each retains the exact arguments sent.
draft=p/'planned-prompts-initial.json'
if not draft.exists():shutil.copyfile(p/'generation-prompts.json',draft)
calls=[]
for file in sorted((p/'calls').glob('*.json')):
 d=json.loads(file.read_text())
 if 'arguments' not in d:continue
 status='native-output-received' if any(r.get('toolCallRecord')==str(file.relative_to(p)) for r in history) else 'blocked-no-image'
 row={'key':d['key'],'iteration':d['iteration'],'attempt':d.get('attempt',1),'callRecord':str(file.relative_to(p)),'status':status,'prompt':d['arguments']['prompt'],'referenceImages':d['arguments']['referenced_image_paths'],'transparentBackgroundRequested':d['arguments']['transparent_background'],'generator':'image_gen.imagegen','promptIsVerbatim':True,'initiatedAt':d['initiatedAt']}
 row['referenceFiles']=[{'path':ref,'sha256':hashlib.sha256(Path(ref).read_bytes()).hexdigest(),'bytes':Path(ref).stat().st_size} for ref in row['referenceImages']]
 calls.append(row)
calls.sort(key=lambda row:row['initiatedAt'])
write('generation-prompts.json',calls)
assert len(calls)==9 and len(results)==5 and len(history)==7
assert set(targets)=={r['key'] for r in results}|{r['key'] for r in read('blocked-targets.json')}
assert not ({r['key'] for r in results}&{r['key'] for r in read('blocked-targets.json')})

# No authored mechanism-specific height is present. All source parts below are
# documented as renderer arguments, not rebuilt or edited images.
poses={
 'guideRail':[
  {'role':'mobile1','xy':[-5.46,0],'maxWh':[11.18,16.64],'angleRad':1.5707963267948966,'pivot':[0.5,0.5]},
  {'role':'mobile2','xy':[5.2,0],'maxWh':[7.02,16.9],'angleRad':0,'pivot':[0.5,0.5]}],
 'clamp':[
  {'role':'mobile1','xy':[-6.5,0],'maxWh':[14.04,17.42],'angleRad':-0.46,'pivot':[0.16,0.58]},
  {'role':'mobile2','xy':[6.5,0],'maxWh':[14.04,17.42],'angleRad':0.46,'pivot':[0.84,0.58]}],
 'ratchet':[
  {'role':'mobile1','xy':[-7.02,0],'maxWh':[13.78,14.3],'angleRad':-0.24,'pivot':[0.1,0.5]},
  {'role':'mobile2','xy':[5.72,0],'maxWh':[9.1,18.2],'angleRad':0,'pivot':[0.5,0.5]}],
 'counterweight':[
  {'role':'mobile1','xy':[-3.9,0],'maxWh':[15.6,15.08],'angleRad':-0.2,'pivot':[0.06,0.5]},
  {'role':'mobile2','xy':[7.8,-4.42],'maxWh':[6.5,14.3],'angleRad':0,'pivot':[0.5,0.5]}]
}
motion={
 'guideRail':'mobile1 x=-0.21w+0.39w*motion; mobile2 x=0.20w-0.30w*motion. Angles and pivots remain renderer-owned.',
 'clamp':'mobile1 angle=-0.46+0.70*motion; mobile2 angle=0.46-0.70*motion; pivots and positions remain renderer-owned.',
 'ratchet':'mobile1 angle=-0.24+0.72*motion; mobile2 x=0.22w-0.08w*motion and width limit=0.35w*(1-0.24*motion).',
 'counterweight':'mobile1 angle=-0.20+0.55*motion; mobile2 x=0.30w-0.16w*motion and y=-0.17h+0.34h*motion.'
}
hardware={
 'runnerCable193':'Two hooks plus one cable. The cable Y=(-0.12+0.24*motion)*h follows the mechanism owner; hook geometry is fixed.',
 'breachClamp193':'Four fixed corner damper blocks and two fixed diagonal members in an X.',
 'enduranceRack193':'One fixed upper rectangular frame and four fixed hanging rectangular rack teeth.',
 'shieldTongs193':'Two bars; upper endpoints move inward with motion: left=(-0.20+0.10*motion)*w, right=(0.20-0.10*motion)*w.',
 'quickCable193':'Two fixed hollow annular reels; lower cable Y=(0.15-0.30*motion)*h follows the owner.',
 'siegeBrake193':'One fixed upper-left brake block and four fixed V-shaped lower link sections.'
}
contract={'sourceMain':selection['sourceMain'],'scope':'Static mounted source-art proposals only. All original runtime components and animation owners are preserved.','metricFrame':{'supportKind':'spikes','footprintMetres':[1,1],'nativeOwnerWh':[32,32],'nativeDrawingInteriorWh':[26,26],'scaleInCanonical':24,'heightMetres':None,'rotation':0},'supportOwnership':{'definition':'src/core.js#BUILDINGS.spikes and CityGeometry202','renderer':'src/trap-art159.js#drawSpikes','sourcePieces':next(iter(targets.values()))['supportParts'],'staticPose':{'phase':'idle','progress':0,'motion':0},'drawArguments':[{'role':'base','xy':[0,0],'maxWh':[26,26],'angleRad':0,'pivot':[0.5,0.5]},{'role':'mobile1','xy':[0,0],'maxWh':[23.4,18.72],'angleRad':0,'pivot':[0.5,0.5]}],'runtimeMotion':'The existing support contact pulse owns its hinged spike beam; it is independent from the fitting mechanism.'},'mechanismOwnership':{'rulesAndSavedType':'src/core.js#FortificationPackRules.mechanisms','controllerAndPresentation':'src/fortification-pack.js#mechanismPresentation, presentationFor, advanceVisuals','renderer':'src/trap-art159.js#drawMechanism, hardware193','phases':['armed','trigger','action','held','return','exhausted'],'frozenState':{'phase':'armed','progress':0,'motion':0,'cooldown':0,'caught':[]},'integrationConstraint':'A future integration must retain separate fixed/mobile parts and source pivots, derive motion from the existing owner, and avoid drawing the shared support twice. These whole static PNGs are not drop-in animated replacements.'},'targets':[]}
for t in selection['targets']:
 family=t['profile']['family']
 contract['targets'].append({'key':t['key'],'runtimeIdentity':t['kind'],'profile':t['profile'],'sourceParts':t['mechanismParts'],'nominalChargesInFixture':t['sourceRecipe']['charges'],'fixedBase':{'role':'base','xy':[0,0],'maxWh':[26,26],'angleRad':0,'pivot':[0.5,0.5]},'armedMobilePaintArguments':poses[family],'runtimeMobileMotion':motion[family],'runtimeHardware':hardware[t['key']],'generationStatus':'accepted_source_art_proposal' if t['key'] in reviews else 'blocked-no-image'})
write('assembly-contract.json',contract)

# Read-only measurements of canonical images (no image output is produced).
canon_audit=[]
for t in selection['targets']:
 f=Path(t['canonicalReference']['path']);raw=f.read_bytes();assert hashlib.sha256(raw).hexdigest()==t['canonicalReference']['sha256']
 im=Image.open(f);a=np.array(im.getchannel('A'))
 yy,xx=np.where(a>=16)
 canon_audit.append({'key':t['key'],'sha256':hashlib.sha256(raw).hexdigest(),'mode':im.mode,'dimensions':list(im.size),'alphaZero':int((a==0).sum()),'bboxAlpha16':[int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1],'edgeMaximum':int(max(a[0].max(),a[-1].max(),a[:,0].max(),a[:,-1].max()))})
write('canonical-alpha-audit.json',canon_audit)
inspections=read('reference-inspections.json')
inspections['actualToolReferenceScope']='Successful initial calls used only each exact canonical assembly. Both original full atlases were visually inspected and archived as source evidence, but were tool inputs only to the first rejected runnerCable193 attempt.'
inspections['nativeGeneratedInputsForEdits']=[{'key':r['key'],'iteration':r['iteration'],'path':ref,'sha256':hashlib.sha256(Path(ref).read_bytes()).hexdigest(),'visuallyInspectedBeforeEdit':True} for r in history if r['iteration']>1 for ref in r['referenceImages'] if '/generated_images/' in ref]
write('reference-inspections.json',inspections)
print(json.dumps({'selectedTargets':6,'acceptedFinals':len(reviews),'nativeHistoryImages':len(history),'failedCallsWithoutImage':2,'actualCalls':len(calls),'blockedTargets':len(read('blocked-targets.json'))}))
