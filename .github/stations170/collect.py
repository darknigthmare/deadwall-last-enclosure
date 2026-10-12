from pathlib import Path
import subprocess,json,hashlib,os,zipfile
out=Path('artifacts/qa/stations170-preflight');out.mkdir(parents=True,exist_ok=True)
def git(*args):return subprocess.check_output(['git',*args])
base=os.environ['GITHUB_SHA']
conflicts=git('diff','--name-only','--diff-filter=U','-z').decode().split('\0');conflicts=list(filter(None,conflicts))
changed=set(filter(None,git('diff',base,'--name-only','-z').decode().split('\0')))
allowed={'src','tests','scripts','docs','desktop','.github'}
files=[]
with zipfile.ZipFile(out/'reviewed-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in sorted(changed):
  p=Path(name)
  if p.is_absolute() or '..' in p.parts or p.is_symlink():raise RuntimeError('Unsafe changed path')
  if len(p.parts)>1 and p.parts[0] not in allowed:raise RuntimeError('Unexpected changed path '+name)
  if any(x.startswith('.env') for x in p.parts):raise RuntimeError('Private file in diff')
  record={'path':name,'deleted':not p.exists()}
  if p.exists():
   b=p.read_bytes();b.decode('utf8');record['sha256']=hashlib.sha256(b).hexdigest();record['bytes']=len(b);z.writestr('files/'+name,b)
  if name in conflicts:
   for stage,label in [(1,'base'),(2,'ours'),(3,'theirs')]:
    v=subprocess.run(['git','show',f':{stage}:{name}'],capture_output=True)
    if v.returncode==0:z.writestr('conflicts/'+label+'/'+name,v.stdout)
  files.append(record)
 report={'stage':base,'head':git('rev-parse','HEAD').decode().strip(),'main':'c7174caa3a7fe3eea0a3f28acd9b49a8ebab410c','conflicts':conflicts,'files':files}
 z.writestr('manifest.json',json.dumps(report,indent=2))
(out/'source.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'conflicts':conflicts,'files':len(files),'head':report['head']}))
