#!/usr/bin/env python3
"""Package a verified DEADWALL 1.39 tree; fail before delivery on missing evidence."""
import argparse
import base64
import difflib
import hashlib
import html
import json
import re
import shutil
import zipfile
from pathlib import Path

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    report = root / 'reports/1.39.0'
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    log = (report / 'check-full.log').read_text()
    stats = {key: int(re.findall(r'(?:ℹ|#)\s*' + key + r'\s+(\d+)', log)[-1])
             for key in ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']}
    assert stats['tests'] == stats['pass'] and stats['fail'] == stats['cancelled'] == stats['skipped'] == stats['todo'] == 0, stats
    duration = float(re.findall(r'(?:ℹ|#)\s*duration_ms\s+([\d.]+)', log)[-1])
    assert 'Syntaxe :' in log and 'standalone hors ligne intégré.' in log
    assert json.loads((root / 'package.json').read_text())['version'] == '1.39.0'
    frozen = json.loads((report / 'frozen-runtime139.json').read_text())
    assert all(digest(root / name) == value for name, value in frozen.items()), 'Runtime changed after final test freeze.'
    gates = {name: json.loads((report / f'integration139-{name}.json').read_text()) for name in ['loop', 'vehicle']}
    assert all(gate['status'] == 'passed' for gate in gates.values())
    captures = json.loads((report / 'captures/qa139-after-visual.json').read_text())
    assert len(captures['assets']) == 2
    assert all(asset['ready'] == 49 and not asset['failed'] for asset in captures['assets'])
    critical = ['src/core.js', 'src/save.js', 'src/geography135.js', 'src/biomes135.js',
                'src/world-content.js', 'src/frontier-world.js', 'src/frontier-state.js',
                'src/frontier-geometry.js', 'src/fieldcraft.js', 'src/ground135.js']
    unchanged = {name: digest(root / name) == digest(args.baseline / name) for name in critical}
    assert all(unchanged.values()), unchanged
    originals = json.loads((root / 'codex-3000/ORIGINAUX_SHA256.json').read_text())
    assert len(originals) == 1051
    assert all(digest(root / 'codex-3000' / name) == value for name, value in originals.items())
    assets = []
    for version in ['36', '37', '38', '39']:
        data = json.loads((root / f'assets/PROVENANCE_1_{version}.json').read_text())
        for item in data['images']:
            assert digest(root / item['runtime']) == item['sha256'], item['runtime']
            assets.append(item['runtime'])
    assert len(assets) == 33
    baseline_files = [p.relative_to(args.baseline) for p in args.baseline.rglob('*') if p.is_file()]
    missing = [str(name) for name in baseline_files if not (root / name).is_file()]
    assert not missing, missing
    changed = [str(name) for name in baseline_files if digest(root / name) != digest(args.baseline / name)]
    public = [p for p in (root / 'dist').rglob('*') if p.is_file()]
    assert all((root / p.relative_to(root / 'dist')).read_bytes() == p.read_bytes() for p in public)
    for item in ['bus', 'truck']:
        assert (root / f'dist/assets/art139/{item}.png').is_file()
        assert f"assets/art139/{item}.png" in (root / 'sw.js').read_text()
    standalone = (root / 'DEADWALL_Standalone.html').read_text()
    assert 'VERSION 1.39.0' in standalone and not re.search(r'<script[^>]+src=|<link[^>]+stylesheet', standalone)
    assert 'art139Bus' in standalone and 'art139Truck' in standalone
    assert "url:'assets/art139/" not in standalone
    preservation = {'version': '1.39.0', 'baseline': 'DEADWALL 1.38.0 verified complete archive',
                    'original_codex_files': len(originals), 'verified_new_and_previous_images': len(assets),
                    'unchanged_critical_files': unchanged, 'missing_baseline_files': missing,
                    'changed_baseline_files': changed, 'public_distribution_files': len(public),
                    'regenerated_manifest': 'MANIFEST_SHA256.json',
                    'preserved_previous_manifest': 'reports/1.38.0/MANIFEST_SHA256.json'}
    dump(report / 'preservation139.json', preservation)
    dump(report / 'verification139.json', {'version': '1.39.0', 'command': 'DEADWALL_SOAK=1 npm run check',
         'stats': stats, 'duration_ms': duration, 'gates': list(gates), 'browser': False,
         'method': 'production HTML with simulated DOM; native Canvas rendering',
         'assets_ready': 49, 'failed_assets': [], 'original_codex_files': len(originals)})
    diffs = []
    for name in changed:
        if name.startswith('src/') or name in ['sw.js', 'index.html', 'package.json', 'package-lock.json']:
            diffs.extend(difflib.unified_diff((args.baseline / name).read_text().splitlines(True),
                         (root / name).read_text().splitlines(True), fromfile='1.38/' + name, tofile='1.39/' + name))
    (report / 'release139.diff').write_text(''.join(diffs))
    source = root / 'SOURCE_PROVENANCE.md'
    suffix = '''\n\n## Continuation 1.39 — Mains et véhicules\n\nBase complète : `DEADWALL_1.38.0_PASSAGES_ET_SURVIE.zip`, 363244711 octets, SHA-256 `103f81cb14e0a8b189a4a7d0c953ab3bf69be877f3c346163ca922247599f9b6`. L’archive a été vérifiée avant extraction, puis copiée en baseline de lecture. Les corrections sont décrites dans `docs/LIVRAISON_1_39.md` ; préservation et validation dans `reports/1.39.0/`. Les deux PNG originaux générés sont référencés dans `assets/PROVENANCE_1_39.json`. Aucun push, déploiement ou nouveau binaire natif n’est associé à cette livraison.\n'''
    if '## Continuation 1.39' not in source.read_text():
        source.write_text(source.read_text() + suffix)
    project = root / 'PROJECT_MANIFEST.md'
    old = project.read_text()
    if '## Livraison actuelle 1.39.0' not in old:
        old = old.replace('## Livraison actuelle 1.32.0', '## Livraison historique 1.32.0', 1)
        project.write_text('# Manifeste de livraison\n\n## Livraison actuelle 1.39.0 — Mains & véhicules\n\n'
            + f"Version cumulative, deux sprites nouveaux et corrections de concurrence, sécurité, relève et focus. {stats['pass']} tests réussis avec endurance, aucun échec ni test ignoré ; deux parcours intégrés passent. Sources, codex, documentation, images, web et standalone inclus. Voir `reports/1.39.0/`.\n\n"
            + old.removeprefix('# Manifeste de livraison\n\n'))
    preservation['changed_baseline_files'] = [str(name) for name in baseline_files
                                             if digest(root / name) != digest(args.baseline / name)]
    dump(report / 'preservation139.json', preservation)
    generate_report(root, report, stats, duration, len(public))
    report_name = 'RAPPORT_CORRECTIONS_1.39.0.html'
    shutil.copyfile(report / report_name, out / report_name)
    manifest_path = root / 'MANIFEST_SHA256.json'
    def files():
        return sorted(p for p in root.rglob('*') if p.is_file()
                      and not set(p.relative_to(root).parts).intersection({'.git', 'node_modules', '__pycache__'})
                      and p != manifest_path)
    entries = [{'file': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size, 'sha256': digest(p)} for p in files()]
    dump(manifest_path, {'version': '1.39.0', 'algorithm': 'sha256', 'files': entries,
                        'manifest_self_excluded': True})
    archive = out / 'DEADWALL_1.39.0_MAINS_ET_VEHICULES.zip'
    prefix = 'DEADWALL_1.39.0/'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as pack:
        for entry in entries:
            pack.write(root / entry['file'], prefix + entry['file'])
        pack.write(manifest_path, prefix + manifest_path.name)
    with zipfile.ZipFile(archive) as pack:
        assert len(pack.namelist()) == len(entries) + 1
        assert pack.read(prefix + manifest_path.name) == manifest_path.read_bytes()
        for entry in entries:
            data = pack.read(prefix + entry['file'])
            assert len(data) == entry['bytes'] and hashlib.sha256(data).hexdigest() == entry['sha256'], entry['file']
    result = {'archive': str(archive), 'bytes': archive.stat().st_size, 'sha256': digest(archive),
              'verified_files': len(entries) + 1, 'report': str(out / report_name),
              'tests': stats, 'duration_ms': duration, 'original_codex_files': len(originals),
              'images_verified': len(assets), 'distribution_files': len(public)}
    dump(out / 'release139-validation.json', result)
    print(json.dumps(result, ensure_ascii=False, indent=2))

def generate_report(root, folder, stats, duration, public_count):
    pairs = [
        ('d17-bus', 'Bus dans D-17', 'Le corps suit désormais le profil compact local ; la géométrie physique existante est conservée.'),
        ('d17-truck', 'Camion dans D-17', 'Cabine et plateau distincts, avec les silhouettes héritées des autres véhicules.'),
        ('region-truck', 'Camion sur route régionale', 'Silhouette transparente aux dimensions métriques du profil, sans étirer un break.'),
        ('region-truck-opened-loot', 'Fouille réelle et place de parking', 'Douze pas ACTION prélèvent 1,44 ferraille. Ouvrant et prise survivent à la reprise ; marquage orienté au gabarit du camion.')]
    comparisons = []
    for name, title, caption in pairs:
        item = {'name': title, 'caption': caption}
        for phase in ['before', 'after']:
            item[phase] = 'data:image/png;base64,' + base64.b64encode((folder / f'captures/qa139-{phase}-{name}.png').read_bytes()).decode()
        comparisons.append(item)
    states = []
    for name in ['bus', 'truck']:
        states.append('<figure><img alt="Orientations et états du ' + name + '" src="data:image/png;base64,'
                      + base64.b64encode((folder / f'captures/qa139-after-{name}-states.png').read_bytes()).decode()
                      + '"><figcaption>' + name + ' : quatre orientations, coffre fouillé, épave, démontage et épuisement. États préparés pour le peintre existant.</figcaption></figure>')
    rows = [
        ('ACTION / recharge', 'Récolte, dépôt, chantier et sortie progressaient pendant une recharge réelle.', 'Entrée commune bloquée avant les propriétaires E ; reprise après recharge, puis sauvegarde.'),
        ('Poste manuel', 'Crosse, fabrication, équipement, service, kits et transferts pouvaient concurrencer le mirador.', 'Les contrôleurs lisent le même état monté ; tir du poste et libération conservés.'),
        ('Coffre régional', 'Entrée en conduite, plein, coffre et vieux panneau ignoraient certaines occupations des mains.', 'Rechargement, intervention et poste manuel revalidés ; plein à pied, débarquement physique accessible.'),
        ('Accès au module', 'Le coin d’une maison ne bloquait pas le ramassage local.', 'Ligne physique locale partagée ; objet conservé jusqu’à un accès libre.'),
        ('Menaces des modules', 'Corps réanimés et groupes sauvages visibles étaient absents du contrôle de sécurité.', 'Contacts des propriétaires existants inclus, selon étage, intérieur, distance et visibilité.'),
        ('Décès / relève', 'Une action interrompue pouvait rester occupée après la confirmation immédiate de relève.', 'Intervention et barricade annulées dans le nettoyage de mort ; paiement et dépouille conservés.'),
        ('Focus de l’établi', 'Ouverture ou rafraîchissement ciblait un bouton désactivé.', 'Première action disponible ou Fermer ; aucune tentative ni dépense supplémentaire.'),
        ('Véhicules dessinés', 'Bus/camion reprenaient un break ; profondeur, culling, barre 320 PV et parking étaient génériques.', 'Deux images distinctes, dessin partagé entre domaines, santé et représentation orientée du profil.')]
    table = ''.join('<tr>' + ''.join('<td>' + html.escape(value) + '</td>' for value in row) + '</tr>' for row in rows)
    content = '''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DEADWALL 1.39 — corrections vérifiées</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#13221c;color:#e6e6d4}body{margin:0}main{max-width:1160px;margin:auto;padding:44px 24px}h1{font-size:clamp(30px,5vw,58px);margin:12px 0}h2{margin-top:42px;color:#dabf7d}p{line-height:1.65;max-width:100ch}small,.muted{color:#b7c2ad}.tag{letter-spacing:.18em;color:#d9bd76}.facts{display:flex;gap:14px;flex-wrap:wrap;margin:28px 0}.facts div{background:#23342a;padding:18px;min-width:150px;border:1px solid #556248}.facts strong{display:block;font-size:28px;color:#e3cb8c}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:14px;text-align:left;vertical-align:top;border-bottom:1px solid #4a5946}th{background:#29382b}td:first-child{width:18%;color:#dbca99}figure{margin:20px 0}img{max-width:100%;display:block;border:1px solid #687153}figcaption{margin:10px 0;color:#c2cbb4;line-height:1.5}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}button{font:inherit;padding:12px;background:#2e402f;border:1px solid #7a8460;color:#f0e1b6;cursor:pointer}button[aria-pressed=true]{background:#526444;border-color:#d8c67e}button:focus-visible{outline:3px solid #dfb86a}.views{display:grid;grid-template-columns:1fr 1fr;gap:14px}.views h3{margin:0 0 12px;font-size:15px}.notice{border-left:4px solid #b9a265;padding:10px 18px;background:#27352a}code{font-size:.94em;color:#e2cf91}footer{margin-top:45px;border-top:1px solid #526049;padding-top:18px;color:#b4c0aa}@media(max-width:700px){.views{grid-template-columns:1fr}td,th{padding:8px}main{padding:25px 14px}}@media print{button{display:none}body{background:white;color:#17251b}h2{color:#365134}img{max-height:260px;object-fit:contain}table{font-size:11px}}
</style><main><div class="tag">DEADWALL · 1.39.0 · 1 OCTOBRE 2026</div><h1>Mains & véhicules</h1>
<p>Cette passe consolide les systèmes existants : interactions pendant la recharge, contrôle de mirador, coffres, kits, modules, relève et clavier de l’établi. Deux silhouettes originales complètent les bus et camions. Les coûts, statistiques, cartes et schémas de sauvegarde sont conservés.</p>
<div class="facts"><div><strong>__COUNT__ / __COUNT__</strong>tests avec endurance</div><div><strong>2 / 2</strong>parcours intégrés</div><div><strong>49</strong>images chargées</div><div><strong>1 051</strong>originaux du codex vérifiés</div></div>
<h2>Défauts reproduits et corrections</h2><table><thead><tr><th>Parcours</th><th>Défaut observé</th><th>Résultat vérifié</th></tr></thead><tbody>__ROWS__</tbody></table>
<h2>Comparaisons visuelles</h2><p>Choisissez une scène. Captures des vrais peintres sous DOM simulé et Canvas natif, avec positions préparées. Les constructions et poses locales avant/après peuvent différer ; il ne s’agit pas d’une comparaison pixel à pixel ni d’un rendu CSS du HUD.</p><div class="controls" id="scenes"></div><h3 id="scene-title"></h3><div class="views"><section><h3>Avant · 1.38</h3><img id="before" alt="Rendu avant correction"></section><section><h3>Après · 1.39</h3><img id="after" alt="Rendu après correction"></section></div><p id="caption" class="muted"></p>
<h2>Orientations et états</h2>__STATES__
<h2>Vérification complète</h2><p><code>DEADWALL_SOAK=1 npm run check</code> : __COUNT__ tests réussis, aucun échec, annulation, ignoré ou tâche restante. Durée du test : __SECONDS__ secondes. Syntaxe et distributions web/standalone reconstruites ; __PUBLIC__ fichiers publics vérifiés contre les sources.</p>
<p>Le parcours de survie tient E sur un vrai gisement, dépose les matériaux, finance puis achève une maison, déclenche l’alerte et l’assaut, avec plusieurs sauvegardes/reprises. Le voyage finance un véhicule, charge son coffre, ravitaille, franchit effectivement la frontière en conduite, reprend la sauvegarde, descend, retire du matériel puis revient. Les préparations de scènes sont décrites dans les preuves JSON.</p>
<p>Les scénarios nouveaux ciblent également l’absence d’effet après refus, la libération des mains, le paiement unique et la conservation après reprise. Les régressions historiques couvrent générations, armement, énergie, barricades, HUD, migrations et campagne. L’endurance comprend deux sessions de 30 minutes simulées avec un bot de sécurité ; elle ne valide pas l’équilibrage ni une partie humaine. Les captures finales chargent 49 images sans échec ; le nouveau bus est dessiné 10 fois et le camion 22 fois.</p>
<h2>Préservation et lancement</h2><p>Extraire le ZIP complet puis ouvrir <code>DEADWALL_Standalone.html</code>. Continuer une sauvegarde existante ne demande pas de nouvelle campagne. Les générations G1–G6 restent valides, les dix fichiers critiques de règles/géographie/sauvegarde sont identiques à la baseline 1.38, et les 31 images ajoutées en 1.36–1.38 sont préservées avec les deux nouveaux PNG. Aucun fichier de la baseline source n’est supprimé.</p>
<p>Sources, tests, codex, documentation, images originales, preuves, <code>dist/</code> et standalone sont inclus. <code>MANIFEST_SHA256.json</code> décrit chaque fichier livré sauf lui-même ; les octets de l’archive ont été relus et vérifiés. Le précédent manifeste reste archivé dans <code>reports/1.38.0/</code>. Les prompts et la provenance des deux images sont dans <code>assets/art139/</code> et <code>assets/PROVENANCE_1_39.json</code>.</p>
<h2>Limites précises</h2><div class="notice"><p>Les contrôles automatisés sous DOM simulé et captures Canvas natives ne certifient pas le CSS dans un navigateur réel, le tactile matériel, l’audio ou les FPS GPU. Aucun déploiement distant ni nouveau binaire natif n’est annoncé. Ces corrections ne garantissent pas l’absence de tout défaut.</p><p>La région utilise les dimensions métriques du bus (10,4 × 2,55 m) et du camion (7,4 × 2,5 m). D-17 conserve l’emprise compacte historique : environ 99,48 × 24,39 unités et 70,78 × 23,91 unités. L’harmonisation métrique globale des véhicules, personnages et bâtiments reste distincte.</p></div>
<p>Faux positifs écartés : barricade suspendue pendant un menu conformément à sa règle de paiement final ; interruption du pansement avant l’escalier déjà correcte ; annulation tactile liée au vrai bouton FEU déjà correcte. Leurs contrôleurs n’ont pas été remplacés.</p>
<footer>Preuves : <code>reports/1.39.0/</code> · Guide et rapports spécialisés : <code>docs/*_1_39.md</code>. Les deux premières passes globales ont été interrompues pour intégrer les derniers défauts confirmés ; seul <code>check-full.log</code> représente la validation finale.</footer></main>
<script>const scenes=__COMPARISONS__;const dock=document.getElementById('scenes');function show(i){document.getElementById('scene-title').textContent=scenes[i].name;document.getElementById('before').src=scenes[i].before;document.getElementById('after').src=scenes[i].after;document.getElementById('caption').textContent=scenes[i].caption;[...dock.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));}scenes.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=s.name;b.addEventListener('click',()=>show(i));dock.appendChild(b);});show(0);</script></html>'''
    for key, value in {'COUNT': str(stats['pass']), 'ROWS': table, 'STATES': ''.join(states),
                       'SECONDS': f'{duration / 1000:.1f}', 'PUBLIC': str(public_count),
                       'COMPARISONS': json.dumps(comparisons, ensure_ascii=False)}.items():
        content = content.replace('__' + key + '__', value)
    (folder / 'RAPPORT_CORRECTIONS_1.39.0.html').write_text(content)

if __name__ == '__main__':
    main()
