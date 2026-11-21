#!/usr/bin/env python3
"""Preserve a native ImageGen PNG byte-for-byte and record read-only QA."""
import argparse,datetime,hashlib,json,shutil
from pathlib import Path
import numpy as np
from PIL import Image

p=argparse.ArgumentParser();p.add_argument('--key',required=True);p.add_argument('--iteration',type=int,required=True);p.add_argument('--native',required=True);p.add_argument('--observation',required=True);p.add_argument('--rejected',action='store_true');a=p.parse_args()
root=Path(__file__).resolve().parent
selection=json.loads((root/'selection-and-prompts.json').read_text());target=next(t for t in selection['targets'] if t['key']==a.key)
stem=f"{target['kind']}_v{target['painterVariant']}-iteration-{a.iteration:02d}"
request_path=root/'calls'/f'{stem}-input.json';request=json.loads(request_path.read_text())
native=Path(a.native).resolve();assert native.is_file() and native.suffix=='.png'
data=native.read_bytes();sha=hashlib.sha256(data).hexdigest();dest=root/'outputs'/f'iteration-{a.iteration:02d}'/target['file'];dest.parent.mkdir(parents=True,exist_ok=True)
if dest.exists():assert dest.read_bytes()==data
else:shutil.copyfile(native,dest)
assert dest.read_bytes()==data
for ref in request['referenceFiles']:assert hashlib.sha256(Path(ref['path']).read_bytes()).hexdigest()==ref['sha256']
with Image.open(native) as im:
 assert im.format=='PNG' and im.mode=='RGBA', (im.format,im.mode)
 pixels=np.asarray(im);alpha=pixels[:,:,3];height,width=alpha.shape
 bounds={};margins={}
 for threshold in [1,8,32,128,240]:
  ys,xs=np.where(alpha>=threshold)
  box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)] if len(xs) else None
  bounds[str(threshold)]=box;margins[str(threshold)]=[box[0]/width,box[1]/height,(width-box[2])/width,(height-box[3])/height] if box else None
 audit={'key':a.key,'iteration':a.iteration,'file':str(dest),'sha256':sha,'bytes':len(data),'width':width,'height':height,'mode':im.mode,'alphaExtrema':[int(alpha.min()),int(alpha.max())],'fullyTransparentPixels':int((alpha==0).sum()),'lowAlpha1to7Pixels':int(((alpha>0)&(alpha<8)).sum()),'boundsAlphaAtLeast':bounds,'marginFractionsAlphaAtLeast':margins,'borderAlphaMaximum':max(int(alpha[0].max()),int(alpha[-1].max()),int(alpha[:,0].max()),int(alpha[:,-1].max())),'transparentPixelsWithNonzeroRgb':int(((alpha==0)&np.any(pixels[:,:,:3]!=0,axis=2)).sum()),'readOnlyDecode':True,'nativeOutputBytesPreserved':True,'pixelEditingPerformed':False}
 assert audit['alphaExtrema']==[0,255]
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
row={k:target[k] for k in ['key','kind','id','artId','label','file','canonicalVariant','painterVariant','sourcePlanVariant','sourcePlanId','sourceId','route']}
row.update({'iteration':a.iteration,'prompt':request['arguments']['prompt'],'referenceImages':request['arguments']['referenced_image_paths'],'referenceFiles':request['referenceFiles'],'generator':'OpenAI built-in ImageGen','promptIsVerbatim':True,'transparentBackgroundRequested':request['arguments']['transparent_background'],'generatedSourcePath':str(dest),'originalGeneratedSourcePath':str(native),'selected':not a.rejected,'generationDate':now[:10],'recordedAt':now,'nativeOutputBytesPreserved':True,'sha256':sha,'bytes':len(data),'inputCallFile':str(request_path.relative_to(root)),'responseCallFile':'calls/'+stem+'-response.json'})
read=lambda name,default:json.loads((root/name).read_text()) if (root/name).exists() else default
write=lambda name,obj:(root/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
history=read('history-results.json',[]);assert not any(r['key']==a.key and r['iteration']==a.iteration for r in history),'Iteration already recorded'
if not a.rejected:
 for r in history:
  if r['key']==a.key:r['selected']=False
history.append(row);write('history-results.json',history)
order={t['key']:i for i,t in enumerate(selection['targets'])};write('results.json',sorted([r for r in history if r['selected']],key=lambda r:order[r['key']]))
review={'decision':'rejected_iteration' if a.rejected else 'accepted_source_art_proposal','reviewStage':'artist_review_pending_independent_root_review','sha256':sha,'iteration':a.iteration,'reviewedBy':'/root/defenses_art237 — canonical, original material atlas and native output visually inspected','observation':a.observation,'canonicalReference':target['canonicalReference'],'canonicalReferenceSha256':target['referenceFiles'][0]['sha256'],'alphaAudit':audit,'limitations':['Source-art proposal only; runtime integration, pivot and raster scale are deferred.','Metric 1:1 or pixel-for-pixel fidelity is not certified.','Every native version is retained; no pixel retouch, crop, resize or re-encoding.'],'notRuntimeIntegrated':True}
reviews=read('review.json',{});review_history=read('review-history.json',[]);review_history.append({'key':a.key,**review});write('review-history.json',review_history)
if not a.rejected:reviews[a.key]=review
write('review.json',reviews)
audits=read('alpha-audit.json',[]);audits.append(audit);write('alpha-audit.json',audits)
print(json.dumps({'key':a.key,'iteration':a.iteration,'sha256':sha,'bytes':len(data),'file':str(dest),'selected':not a.rejected,'alphaAudit':audit},ensure_ascii=False))
