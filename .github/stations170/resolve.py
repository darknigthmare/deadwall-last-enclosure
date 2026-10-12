"""Resolve only the four inspected conflicts against pinned main; reject all drift."""
from pathlib import Path
import re,hashlib,subprocess,json
expected={'.github/workflows/ci.yml':('4eac563937aa7db20d06e71af52e6c082c39f9945a0ee45a757c2db83a9fc7eb','3ba4bb631a036304d3f8895e978c5f8d5f629152f8c2d3e77415adba6fae53ca'),
'desktop/smoke.cjs':('9f6afd47ed7560c1bc2ffd4b4fddcbd0c1b8c9ed1072143dfcad7db2d75e3636','b2805785d1d5a756e20a1a4203d5175fefc0bdd12d11761028de3aab6da1fdde'),
'src/campaign-intro132.js':('2a74039cb3f6b62d369a95586a907c732c38671f6cae834476abf92f42693f84','4e70c51b37ea52396ea495ce2f5db22fb9438a4783a6acae7ead5b75dc27a581'),
'sw.js':('eccdba830d25c628801ce857540ea7a5e238fba5e3ddcf2e5012df0bd94f6a91','1124c0f09a64791f6400253e4a853328e38c433d455ebf99aa6b3b3f38e9442e')}
conflicts=set(filter(None,subprocess.check_output(['git','diff','--name-only','--diff-filter=U','-z']).decode().split('\0')))
if conflicts!=set(expected):raise RuntimeError('Unexpected conflicts: '+repr(conflicts))
pattern=re.compile(r'<<<<<<< HEAD\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> c7174caa3a7fe3eea0a3f28acd9b49a8ebab410c\n')
results={}
for name,(before,after) in expected.items():
 b=Path(name).read_bytes()
 if hashlib.sha256(b).hexdigest()!=before:raise RuntimeError('Unreviewed source conflict '+name)
 def resolve(m):
  ours,theirs=m.group(1),m.group(2)
  if name=='.github/workflows/ci.yml':return ours+theirs
  if name=='desktop/smoke.cjs':return theirs
  if name=='sw.js':return "const CACHE = 'deadwall-v1.57.2-stations170';\n"
  if 'let startDepth161=0,pendingRecord161=null;' not in ours or 'focusLost=true' not in theirs:raise RuntimeError('History/focus anchors changed')
  return theirs+' // Record history only after every new-campaign initializer has finished.\n // Initial identities and existing archives remain unchanged.\n'+ours[ours.index(' let startDepth161='):]
 text,n=pattern.subn(resolve,b.decode())
 if n!=(2 if name=='desktop/smoke.cjs' else 1) or hashlib.sha256(text.encode()).hexdigest()!=after:raise RuntimeError('Resolution mismatch '+name)
 results[name]=text
for name,text in results.items():Path(name).write_text(text)
subprocess.run(['git','add','--',*results],check=True)
Path('artifacts/qa/stations170-preflight/resolutions.json').write_text(json.dumps(expected,indent=2))
print('Four reviewed conflicts resolved: cumulative CI, native smoke helper, focus plus history, new PWA cache.')
