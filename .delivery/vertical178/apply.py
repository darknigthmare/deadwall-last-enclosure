"""Apply the exact reviewed rounding fix; do not overwrite concurrent changes."""
import hashlib,json,lzma,pathlib,subprocess
root=pathlib.Path.cwd().resolve();here=root/'.delivery/vertical178'
m=json.loads((here/'manifest.json').read_text())
if m['version']!=1 or len(m['files'])!=4: raise RuntimeError('Unexpected manifest')
subprocess.run(['git','merge-base','--is-ancestor',m['base'],'HEAD'],check=True)
paths=[i['path'] for i in m['files']]
if len(paths)!=len(set(paths)): raise RuntimeError('Duplicate targets')
for name in paths:
 p=pathlib.PurePosixPath(name)
 if p.is_absolute() or '..' in p.parts or name.startswith('.') or (root/name).resolve()!=root/name: raise RuntimeError('Unsafe target')
def blob(name):
 data=(root/name).read_bytes()
 return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
packed=(here/'rounding.xz').read_bytes()
if hashlib.sha256(packed).hexdigest()!=m['xz_sha256']: raise RuntimeError('Transport mismatch')
patch=lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest()!=m['patch_sha256']: raise RuntimeError('Patch mismatch')
if not all(blob(i['path'])==i['after'] for i in m['files']):
 bad=[i['path'] for i in m['files'] if blob(i['path'])!=i['before']]
 if bad: raise RuntimeError('Concurrent changes refused: '+', '.join(bad))
 subprocess.run(['git','apply','--check','-'],input=patch,check=True)
 subprocess.run(['git','apply','-'],input=patch,check=True)
if not all(blob(i['path'])==i['after'] for i in m['files']): raise RuntimeError('Output mismatch')
out=pathlib.Path('/tmp/vertical178-qa');out.mkdir(parents=True,exist_ok=True)
(out/'verified-manifest.json').write_text(json.dumps(m,indent=2))
print('Four reviewed rounding fix sources verified.')
