from pathlib import Path
import sys,json,hashlib,shutil
from PIL import Image
import numpy as np
prep=Path(__file__).resolve().parent
selection=json.loads((prep/'selection-and-prompts.json').read_text());targets={t['key']:t for t in selection['targets']}
history=json.loads((prep/'history-results.json').read_text()) if (prep/'history-results.json').exists() else []
for new in json.loads(sys.argv[1]):
 t=targets[new['key']]
 r={k:t[k] for k in ['key','kind','id','artId','label','file','prompt','referenceImages','generator','transparentBackgroundRequested','promptIsVerbatim','runtimeIdentity','route']}
 r.update(iteration=new['iteration'],generatedSourcePath=new['generatedSourcePath'])
 for k in ['prompt','referenceImages','correctionReason','replaces','toolCallRecord']:
  if k in new:r[k]=new[k]
 same=[h for h in history if h['key']==r['key'] and h['iteration']==r['iteration']]
 if same:assert same[0]==r
 else:history.append(r)
final=[]
for t in selection['targets']:
 candidates=[h for h in history if h['key']==t['key']]
 if candidates:final.append(max(candidates,key=lambda r:r['iteration']))
for name,rows in [('history-results.json',history),('initial-results.json',[h for h in history if h['iteration']==1]),('results.json',final)]:
 (prep/name).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
review=[]
for r in history:
 p=Path(r['generatedSourcePath']);raw=p.read_bytes();im=Image.open(p)
 assert im.mode=='RGBA',f"Not RGBA: {r['key']} iteration {r['iteration']} mode {im.mode}"
 a=np.array(im.getchannel('A'));dest=prep/'generated'/('iteration-'+str(r['iteration']))/r['file'];dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists():assert dest.read_bytes()==raw
 else:shutil.copyfile(p,dest)
 def bbox(th):
  yy,xx=np.where(a>=th)
  return [int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1] if len(xx) else None
 b=bbox(128);a16=bbox(16)
 review.append(dict(key=r['key'],iteration=r['iteration'],generatedSourcePath=str(p),savedCopyPath=str(dest),sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw),mode=im.mode,dimensions=list(im.size),pixelEditingPerformed=False,nativeCopyByteIdentical=True,alpha=dict(min=int(a.min()),max=int(a.max()),zeroPixels=int((a==0).sum()),opaquePixels=int((a==255).sum()),partialPixels=int(((a>0)&(a<255)).sum()),alpha1to15=int(((a>0)&(a<16)).sum()),alpha16to127=int(((a>=16)&(a<128)).sum()),alpha128to249=int(((a>=128)&(a<250)).sum()),alpha250to255=int((a>=250).sum()),bboxAlpha1=bbox(1),bboxAlpha16=a16,bboxAlpha128=b,bboxAlpha250=bbox(250),edgeMaximum=int(max(a[0].max(),a[-1].max(),a[:,0].max(),a[:,-1].max())),foregroundRatio128=round((b[2]-b[0])/(b[3]-b[1]),6) if b else None,metricFidelityCertified=False)))
(prep/'alpha-review.json').write_text(json.dumps(review,indent=2)+'\n')
print(json.dumps([dict(key=x['key'],iteration=x['iteration'],sha256=x['sha256'],dimensions=x['dimensions'],alphaZero=x['alpha']['zeroPixels'],alpha1to15=x['alpha']['alpha1to15'],alpha16to127=x['alpha']['alpha16to127'],bbox128=x['alpha']['bboxAlpha128'],bbox16=x['alpha']['bboxAlpha16'],edge=x['alpha']['edgeMaximum']) for x in review[-3:]]))
