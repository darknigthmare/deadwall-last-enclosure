"""Apply only this reviewed PR patch, after checking every source fingerprint."""
import base64,gzip,hashlib,json,os,pathlib,subprocess,tempfile
root=pathlib.Path.cwd()
payload=json.loads((root/'scripts/quantities164.patch.json').read_text())
allowed={
 'docs/codex/SERIES_MOBILIER_164.md',
 'scripts/browser-city-content150.mjs','scripts/browser-city-proof164.mjs','scripts/browser-quantities164.mjs','scripts/compile-codex3000.mjs',
 'src/codex-quantities164.js','src/codex3000-runtime.js','src/frontier-state.js','src/frontier-world.js','src/world-codex.js','src/world-pack131.js','sw.js',
 'tests/city-proof164.test.cjs','tests/codex-anchors160.test.cjs','tests/codex-quantities164.test.cjs','tests/distribution.test.cjs'
}
changes=payload['changes']
assert len(changes)==len(allowed) and {c['path'] for c in changes}==allowed
assert payload['base']=='2c505a418d68c939d0dd48a1aff5c7ae8d094e0f'
subprocess.run(['git','merge-base','--is-ancestor',payload['base'],'HEAD'],check=True)
assert not subprocess.check_output(['git','diff','--name-only']).strip()
assert not subprocess.check_output(['git','diff','--cached','--name-only']).strip()
for c in changes:
 p=root/c['path']
 assert not p.is_symlink() and not any(q.is_symlink() for q in p.parents)
 if c['before'] is None: assert not p.exists(),c['path']
 else: assert hashlib.sha256(p.read_bytes()).hexdigest()==c['before'],c['path']
patch=gzip.decompress(base64.b64decode(''.join((root/('scripts/quantities164.'+str(i)+'.b64')).read_text().strip() for i in range(3)),validate=True))
assert len(patch)<131072 and hashlib.sha256(patch).hexdigest()==payload['patchSha256']
with tempfile.NamedTemporaryFile(suffix='.patch') as tmp:
 tmp.write(patch);tmp.flush()
 subprocess.run(['git','apply','--unidiff-zero','--check',tmp.name],check=True)
 subprocess.run(['git','apply','--unidiff-zero','--index',tmp.name],check=True)
for c in changes:assert hashlib.sha256((root/c['path']).read_bytes()).hexdigest()==c['after'],c['path']
assert set(subprocess.check_output(['git','diff','--cached','--name-only'],text=True).splitlines())==allowed
subprocess.run(['git','diff','--cached','--check'],check=True)
print(json.dumps({'verifiedFiles':len(changes),'base':payload['base'],'patchSha256':payload['patchSha256']}))
