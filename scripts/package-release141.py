#!/usr/bin/env python3
"""Build a complete, verified cumulative 1.41 delivery and illustrated report."""
import argparse, base64, difflib, hashlib, html, json, re, shutil, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
REPORT=ROOT/'reports/1.41.0'
def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for block in iter(lambda:f.read(1048576),b''):h.update(block)
    return h.hexdigest()
def read(p):return json.loads(p.read_text())
def dump(p,data):p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def png(p):
    assert p.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'),p
    return 'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()

def illustrated(stats,duration):
    pairs=[
      ('Premier atlas — même carte G6','map141-before-17117-first.png','map141-after-g6-17117-first.png','Même graine et même géométrie historique. Le cadrage corrigé montre toute la région de 24,576 km ; D17 n’est plus hors de la première vue.'),
      ('Territoire G7 — nouvelle campagne','map141-before-17117-whole.png','map141-after-17117-whole.png','Même graine numérique, générations différentes : G6 historique à gauche, nouveau territoire G7 à droite. Les anciennes campagnes gardent la carte de gauche.'),
      ('D17 sur son biome — même G6','map141-before-17117-home.png','map141-after-g6-17117-home.png','Même ancre G6. Le fond sombre carré de D17 cesse de recouvrir le sol du biome.'),
      ('Douze matières réelles','captures/qa141-before-ground-gallery.png','captures/qa141-after-ground-gallery.png','Douze positions G6 identiques pour comparer les peintres. Arbres, roches et petits décors sont des spécimens placés, pas une capture de leur distribution en jeu.'),
      ('Sous-bois de conifères','captures/qa141-before-conifer-ground.png','captures/qa141-after-conifer-ground.png','Même point réel et même cadrage. La litière et les détails suivent les poids écologiques plutôt qu’un motif uniforme.'),
      ('Nature locale D17 — G6/G7','captures/qa141-before-d17-natural-resources.png','captures/qa141-after-d17-natural-resources.png','Deux campagnes réelles de même graine : G6 avant, G7 après. Les espèces peintes à D17 suivent désormais sa position dans le biome régional ; les gisements locaux gardent leurs quantités et rayons historiques.')]
    local=REPORT/'captures/qa141-after-local-ground.json'
    if local.exists():
        info=read(local)
        # Local captures remain available in the ZIP even if their scene naming evolves.
    scenes=[{'name':name,'before':png(REPORT/a),'after':png(REPORT/b),'caption':caption} for name,a,b,caption in pairs]
    details=read(REPORT/'world141-audit.json')
    rows=''.join('<tr><td>'+html.escape(k)+'</td><td>'+html.escape(v)+'</td></tr>' for k,v in [
      ('Nouvelle campagne','G7, ancre D17 et rues déterministes par graine ; G1–G6 préservés.'),
      ('Agglomérations','374/374 programmes complets sur onze graines contrôlées ; 62 types de lieux conservés.'),
      ('Écologie','12 biomes existants + 9 communautés G7 ; essences, minéraux et décors regroupés.'),
      ('Exploration','Tournées par biome parmi les lieux connus ; origine réelle et retours vérifiés.'),
      ('Plans et accès','Miroirs G7 partagés entre murs, ouvertures, escaliers et butin ; budget conservé.'),
      ('Art','53 images chargées ; deux nouveaux PNG individuels, roseaux et branche tombée.'),
      ('Validation',f"{stats['pass']} tests avec endurance, aucune omission ; quatre parcours intégrés."),
      ('Historique','12 mondes G1–G6 de deux graines comparés pour routes, parcelles, plans et réserves.')])
    content='''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEADWALL 1.41 — Territoires et exploration</title>
<style>*{box-sizing:border-box}body{margin:0;background:#121b17;color:#e7dfc5;font:17px/1.6 system-ui,sans-serif}main{max-width:1250px;margin:auto;padding:38px 24px}h1{font-size:clamp(30px,5vw,55px);line-height:1.15;margin:8px 0 22px}h2{margin-top:38px;color:#ddc28b}.eyebrow{letter-spacing:.15em;color:#a4bf9d}.lead{max-width:900px;color:#c4ceb9}.metrics{display:flex;flex-wrap:wrap;gap:18px;margin:24px 0}.metrics strong{font-size:26px;display:block}.metrics div{padding:14px 20px;border:1px solid #526047;background:#1c2921}table{width:100%;border-collapse:collapse}td{padding:13px;border-bottom:1px solid #40533e}td:first-child{width:24%;color:#d8be88;font-weight:600}button{background:#233729;border:1px solid #678063;color:#efe5c8;padding:10px 13px;margin:4px;cursor:pointer;font:inherit}button[aria-pressed=true]{background:#456047}.pair{display:grid;grid-template-columns:1fr 1fr;gap:15px}figure{margin:0;background:#1b2b21;padding:12px}figure img{width:100%;height:auto;display:block}figcaption{color:#b2c2a6;margin:7px 0}#caption,.notice{padding:17px;background:#1b2b21;border-left:3px solid #b89c68}.sprite{max-height:270px;max-width:100%;object-fit:contain}.art{display:grid;grid-template-columns:1fr 1fr;gap:20px}code{font-size:.9em;color:#d6c48c}footer{margin-top:35px;font-size:14px;color:#adb9a2}@media(max-width:740px){.pair,.art{grid-template-columns:1fr}main{padding:24px 14px}td:first-child{width:30%}}</style>
<main><p class="eyebrow">DEADWALL · LIVRAISON CUMULATIVE 1.41.0</p><h1>Territoires &amp; exploration</h1><p class="lead">Les nouvelles cartes composent des agglomérations et communautés naturelles cohérentes. L’atlas montre toute la région dès son premier affichage ; les anciennes sauvegardes conservent leurs lieux et leurs réserves.</p>
<div class="metrics"><div><strong>G7</strong>nouvelles campagnes</div><div><strong>12 + 9</strong>biomes et communautés</div><div><strong>374 / 374</strong>agglomérations vérifiées</div><div><strong>__COUNT__</strong>tests réussis</div></div>
<table>__ROWS__</table><h2>Comparaisons des vrais peintres</h2><p>Rendu Canvas natif et document simulé. Les comparaisons distinguent correction sur une même carte et nouveau territoire G7.</p><div id="scenes"></div><h3 id="scene-title"></h3><div class="pair"><figure><figcaption>1.40 — avant</figcaption><img id="before" alt="Vue avant correction"></figure><figure><figcaption>1.41 — après</figcaption><img id="after" alt="Vue après correction"></figure></div><p id="caption"></p>
<h2>Décors réellement intégrés</h2><div class="art"><figure><img class="sprite" src="__REEDS__" alt="Roseaux"><figcaption>Roseaux : décor passable des fonds humides et roselières.</figcaption></figure><figure><img class="sprite" src="__BRANCH__" alt="Branche tombée"><figcaption>Branche tombée : petit décor de futaie et lisière.</figcaption></figure></div><p>Images individuelles originales générées avec alpha natif et copiées sans retouche dans le jeu. Les coordonnées du scatter et les compteurs de dessins prouvent leur utilisation ; ces décors ne créent aucune réserve invisible.</p>
<h2>Contrôles et préservation</h2><p><strong>__COUNT__ tests sur __COUNT__ passent</strong> avec endurance, zéro échec, annulation, omission ou TODO. La suite finale sur sources figées dure __SECONDS__ secondes. Récolte, dépôt, construction, vague, véhicule, coffre, carburant, quatre frontières et reprises passent sous l’ordre réel des scripts HTML.</p><p>Les empreintes G1–G6 sont conservées dans les comparaisons ; toutes les sources de la baseline sont présentes, les 1 051 fichiers du codex original sont vérifiés et les 37 images individuelles de 1.36–1.41 sont contrôlées. Sources, tests, documentation, rapports, images, version web, cache PWA et standalone sont inclus. Le manifeste SHA-256 couvre chaque fichier de l’archive sauf lui-même.</p>
<h2>Lancer et choisir la carte</h2><p>Extraire le ZIP et ouvrir <code>DEADWALL_Standalone.html</code>. <strong>Continuer</strong> garde la génération de la sauvegarde ; <strong>Nouvelle partie</strong> crée G7. Une graine explicite reproduit la même carte G7 ; sans graine, une nouvelle graine est tirée. Les générations G1–G6 ne sont pas redistribuées au chargement.</p>
<h2>Limites précises</h2><div class="notice">Les contrôles sous DOM simulé et Canvas natif ne certifient pas le CSS en navigateur réel, le tactile matériel, l’audio ou les FPS GPU. Les échantillons de graines ne prouvent pas toutes les graines possibles. L’échelle compacte des véhicules locaux reste à harmoniser. Relief montagneux, hydrographie bloquante, neige et factions humaines ne sont pas activés par cette livraison. Aucun déploiement ou nouveau binaire natif n’est annoncé.</div><footer>Guide : docs/LIVRAISON_1_41.md · Preuves : reports/1.41.0/ · Prompts et hashes : assets/art141/PROMPTS.md et assets/PROVENANCE_1_41.json.</footer></main>
<script>const scenes=__SCENES__;const dock=document.getElementById('scenes');function show(i){document.getElementById('scene-title').textContent=scenes[i].name;document.getElementById('before').src=scenes[i].before;document.getElementById('after').src=scenes[i].after;document.getElementById('caption').textContent=scenes[i].caption;[...dock.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));}scenes.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=s.name;b.addEventListener('click',()=>show(i));dock.appendChild(b);});show(0);</script></html>'''
    for key,value in {'COUNT':str(stats['pass']),'ROWS':rows,'SECONDS':f'{duration/1000:.1f}','SCENES':json.dumps(scenes,ensure_ascii=False),'REEDS':png(ROOT/'assets/art141/reeds.png'),'BRANCH':png(ROOT/'assets/art141/fallen-branch.png')}.items():content=content.replace('__'+key+'__',value)
    p=REPORT/'RAPPORT_CORRECTIONS_1.41.0.html';p.write_text(content);return p

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--baseline',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    log=(REPORT/'check-full.log').read_text();stats={k:int(re.findall(r'(?:ℹ|#)\s*'+k+r'\s+(\d+)',log)[-1]) for k in ['tests','pass','fail','cancelled','skipped','todo']};duration=float(re.findall(r'(?:ℹ|#)\s*duration_ms\s+([\d.]+)',log)[-1]);assert stats['tests']==stats['pass'] and sum(stats[k] for k in ['fail','cancelled','skipped','todo'])==0,stats
    assert 'Syntaxe :' in log and 'standalone hors ligne intégré.' in log;assert read(ROOT/'package.json')['version']=='1.41.0'
    for name in ['frozen-runtime141.json','frozen-check-inputs141.json']:
        assert all(digest(ROOT/p)==h for p,h in read(REPORT/name).items()),'Changed after full verification: '+name
    gates={n:read(REPORT/f'integration141-{n}.json') for n in ['loop','vehicle','campaign','gateways']};assert all(x['status']=='passed' for x in gates.values())
    legacy=read(REPORT/'legacy141-after.json');assert legacy==read(ROOT/'tests/fixtures/world141-legacy.json')
    world=read(REPORT/'world141-audit.json');assert world['legacyIdentical'] and world['allSettlementsComplete'] and world['allProgrammesPreserved'];extra=read(REPORT/'world141-extra-seeds.json');assert len(extra)==6 and all(x['complete']==34 and x['types']==62 for x in extra)
    ground=read(REPORT/'captures/qa141-after-ground.json');assert len(ground['assets'])==53 and ground['draws']['art141Reeds']>0 and ground['draws']['art141FallenBranch']>0
    for n in ['map141-before','map141-after','map141-after-g6']:
        captures=read(REPORT/(n+'.json'));assert len(captures['records'])==6
        for scene in captures['records']:png(REPORT/scene['file'])
    originals=read(ROOT/'codex-3000/ORIGINAUX_SHA256.json');assert len(originals)==1051;assert all(digest(ROOT/'codex-3000'/p)==h for p,h in originals.items())
    images=[]
    for version in range(36,42):
        for item in read(ROOT/f'assets/PROVENANCE_1_{version}.json')['images']:assert digest(ROOT/item['runtime'])==item['sha256'];images.append(item['runtime'])
    assert len(images)==37
    previous=[p.relative_to(args.baseline) for p in args.baseline.rglob('*') if p.is_file()];missing=[str(p) for p in previous if not (ROOT/p).is_file()];assert not missing,missing
    changed=[p.as_posix() for p in previous if digest(ROOT/p)!=digest(args.baseline/p)]
    public=[p for p in (ROOT/'dist').rglob('*') if p.is_file()];assert public and all(p.read_bytes()==(ROOT/p.relative_to(ROOT/'dist')).read_bytes() for p in public)
    standalone=(ROOT/'DEADWALL_Standalone.html').read_text();assert 'VERSION 1.41.0' in standalone and not re.search(r'<script[^>]+src=|<link[^>]+stylesheet',standalone)
    for key in ['art141Reeds','art141FallenBranch']:assert key in standalone
    assert "url:'assets/art141/" not in standalone
    for p in ['assets/art141/reeds.png','assets/art141/fallen-branch.png']:assert (ROOT/'dist'/p).exists() and p in (ROOT/'sw.js').read_text()
    verification={'version':'1.41.0','command':'DEADWALL_SOAK=1 npm run check','stats':stats,'duration_ms':duration,'gates':list(gates),'browser':False,'assets_ready':53,'failed_assets':[],'legacy_worlds_compared':len(legacy['rows']),'original_codex_files':1051,'individual_images_verified':37};dump(REPORT/'verification141.json',verification)
    dump(REPORT/'preservation141.json',{'baseline':'verified complete1.40 archive','missing_baseline_files':missing,'changed_baseline_files':changed,'old_generations_verified':'G1–G6','original_codex_files':1051,'individual_images_verified':37,'distribution_files':len(public),'previous_manifest':'reports/1.40.0/MANIFEST_SHA256.json'})
    diffs=[]
    for p in changed:
        if p.startswith('src/') or p in ['sw.js','index.html','package.json','package-lock.json']:
            diffs.extend(difflib.unified_diff((args.baseline/p).read_text().splitlines(True),(ROOT/p).read_text().splitlines(True),fromfile='1.40/'+p,tofile='1.41/'+p))
    (REPORT/'release141.diff').write_text(''.join(diffs))
    report=illustrated(stats,duration);shutil.copyfile(report,out/report.name)
    manifest=ROOT/'MANIFEST_SHA256.json';files=sorted(p for p in ROOT.rglob('*') if p.is_file() and p!=manifest and not set(p.relative_to(ROOT).parts).intersection({'.git','node_modules','__pycache__'}));entries=[{'file':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':digest(p)} for p in files];dump(manifest,{'version':'1.41.0','algorithm':'sha256','files':entries,'manifest_self_excluded':True})
    archive=out/'DEADWALL_1.41.0_TERRITOIRES_ET_EXPLORATION.zip';prefix='DEADWALL_1.41.0/'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as pack:
        for item in entries:pack.write(ROOT/item['file'],prefix+item['file'])
        pack.write(manifest,prefix+manifest.name)
    with zipfile.ZipFile(archive) as pack:
        assert len(pack.namelist())==len(entries)+1
        for item in entries:
            data=pack.read(prefix+item['file']);assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'],item['file']
    result={**verification,'zip_file':archive.name,'zip_bytes':archive.stat().st_size,'zip_sha256':digest(archive),'manifest_files':len(entries),'report_file':report.name,'report_bytes':report.stat().st_size,'all_archive_files_verified':True};dump(out/'release141-validation.json',result);print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
