#!/usr/bin/env python3
"""Package a verified DEADWALL 1.40 tree; fail before delivery on missing evidence."""
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
    report = root / 'reports/1.40.0'
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    log = (report / 'check-full.log').read_text()
    stats = {key: int(re.findall(r'(?:ℹ|#)\s*' + key + r'\s+(\d+)', log)[-1])
             for key in ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']}
    assert stats['tests'] == stats['pass'] and stats['fail'] == stats['cancelled'] == stats['skipped'] == stats['todo'] == 0, stats
    duration = float(re.findall(r'(?:ℹ|#)\s*duration_ms\s+([\d.]+)', log)[-1])
    assert 'Syntaxe :' in log and 'standalone hors ligne intégré.' in log
    assert json.loads((root / 'package.json').read_text())['version'] == '1.40.0'
    frozen = json.loads((report / 'frozen-runtime140.json').read_text())
    assert all(digest(root / name) == value for name, value in frozen.items()), 'Runtime changed after final test freeze.'
    check_inputs = json.loads((report / 'frozen-check-inputs140.json').read_text())
    assert all(digest(root / name) == value for name, value in check_inputs.items()), 'A tested source or script changed after the final freeze.'
    gates = {name: json.loads((report / f'integration140-{name}.json').read_text()) for name in ['loop', 'vehicle']}
    assert all(gate['status'] == 'passed' for gate in gates.values())
    captures = json.loads((report / 'captures/qa140-after-visual.json').read_text())
    before_captures = json.loads((report / 'captures/qa140-before-visual.json').read_text())
    assert len(before_captures['scenes']) == len(captures['scenes']) == 9
    assert all(asset['ready'] == 49 and not asset['failed'] for asset in before_captures['assets'])
    for evidence in [before_captures, captures]:
        for scene in evidence['scenes']:
            png = report / 'captures' / scene['file']
            assert png.is_file() and png.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'), png
    assert len(captures['assets']) == 2
    assert all(asset['ready'] == 51 and not asset['failed'] for asset in captures['assets'])
    assert captures['assets'][0]['draws']['art140Van'] == 31
    assert captures['assets'][1]['draws']['art140Buggy'] == 10
    critical = ['src/core.js', 'src/save.js', 'src/geography135.js', 'src/biomes135.js',
                'src/world-content.js', 'src/frontier-world.js', 'src/frontier-state.js',
                'src/frontier-geometry.js', 'src/fieldcraft.js', 'src/ground135.js']
    unchanged = {name: digest(root / name) == digest(args.baseline / name) for name in critical}
    assert all(unchanged.values()), unchanged
    originals = json.loads((root / 'codex-3000/ORIGINAUX_SHA256.json').read_text())
    assert len(originals) == 1051
    assert all(digest(root / 'codex-3000' / name) == value for name, value in originals.items())
    assets = []
    for version in ['36', '37', '38', '39', '40']:
        data = json.loads((root / f'assets/PROVENANCE_1_{version}.json').read_text())
        for item in data['images']:
            assert digest(root / item['runtime']) == item['sha256'], item['runtime']
            assets.append(item['runtime'])
    assert len(assets) == 35
    baseline_files = [p.relative_to(args.baseline) for p in args.baseline.rglob('*') if p.is_file()]
    missing = [str(name) for name in baseline_files if not (root / name).is_file()]
    assert not missing, missing
    changed = [str(name) for name in baseline_files if digest(root / name) != digest(args.baseline / name)]
    public = [p for p in (root / 'dist').rglob('*') if p.is_file()]
    assert all((root / p.relative_to(root / 'dist')).read_bytes() == p.read_bytes() for p in public)
    for item in ['van', 'buggy']:
        assert (root / f'dist/assets/art140/{item}.png').is_file()
        assert f"assets/art140/{item}.png" in (root / 'sw.js').read_text()
    standalone = (root / 'DEADWALL_Standalone.html').read_text()
    assert 'VERSION 1.40.0' in standalone and not re.search(r'<script[^>]+src=|<link[^>]+stylesheet', standalone)
    assert 'art140Van' in standalone and 'art140Buggy' in standalone
    assert "url:'assets/art140/" not in standalone
    preservation = {'version': '1.40.0', 'baseline': 'DEADWALL 1.39.0 verified complete archive',
                    'original_codex_files': len(originals), 'verified_new_and_previous_images': len(assets),
                    'unchanged_critical_files': unchanged, 'missing_baseline_files': missing,
                    'changed_baseline_files': changed, 'public_distribution_files': len(public),
                    'regenerated_manifest': 'MANIFEST_SHA256.json',
                    'preserved_previous_manifest': 'reports/1.39.0/MANIFEST_SHA256.json'}
    dump(report / 'preservation140.json', preservation)
    dump(report / 'verification140.json', {'version': '1.40.0', 'command': 'DEADWALL_SOAK=1 npm run check',
         'stats': stats, 'duration_ms': duration, 'gates': list(gates), 'browser': False,
         'method': 'production HTML with simulated DOM; native Canvas rendering',
         'assets_ready': 51, 'failed_assets': [], 'original_codex_files': len(originals)})
    diffs = []
    for name in changed:
        if name.startswith('src/') or name in ['sw.js', 'index.html', 'package.json', 'package-lock.json']:
            diffs.extend(difflib.unified_diff((args.baseline / name).read_text().splitlines(True),
                         (root / name).read_text().splitlines(True), fromfile='1.39/' + name, tofile='1.40/' + name))
    (report / 'release140.diff').write_text(''.join(diffs))
    source = root / 'SOURCE_PROVENANCE.md'
    suffix = '''\n\n## Continuation 1.40 — Parcours et ateliers\n\nBase complète : `DEADWALL_1.39.0_MAINS_ET_VEHICULES.zip`, 389078117 octets, SHA-256 `0d89254c82ad71af1b615bff32f0ef02dc9b937925f65b40688f9a175f5e6ab6`. L’archive a été vérifiée avant extraction, puis copiée en baseline de lecture. Les corrections sont décrites dans `docs/LIVRAISON_1_40.md` ; préservation et validation dans `reports/1.40.0/`. Les deux PNG originaux générés sont référencés dans `assets/PROVENANCE_1_40.json`. Aucun push, déploiement ou nouveau binaire natif n’est associé à cette livraison.\n'''
    if '## Continuation 1.40' not in source.read_text():
        source.write_text(source.read_text() + suffix)
    project = root / 'PROJECT_MANIFEST.md'
    old = project.read_text()
    if '## Livraison actuelle 1.40.0' not in old:
        old = old.replace('## Livraison actuelle 1.39.0', '## Livraison historique 1.39.0', 1)
        project.write_text('# Manifeste de livraison\n\n## Livraison actuelle 1.40.0 — Parcours & ateliers\n\n'
            + f"Version cumulative, deux sprites nouveaux et corrections d’ateliers, sécurité, sorties physiques, dépôts et clavier. {stats['pass']} tests réussis avec endurance, aucun échec ni test ignoré ; deux parcours intégrés passent. Sources, codex, documentation, images, web et standalone inclus. Voir `reports/1.40.0/`.\n\n"
            + old.removeprefix('# Manifeste de livraison\n\n'))
    preservation['changed_baseline_files'] = [str(name) for name in baseline_files
                                             if digest(root / name) != digest(args.baseline / name)]
    dump(report / 'preservation140.json', preservation)
    generate_report(root, report, stats, duration, len(public))
    report_name = 'RAPPORT_CORRECTIONS_1.40.0.html'
    shutil.copyfile(report / report_name, out / report_name)
    manifest_path = root / 'MANIFEST_SHA256.json'
    def files():
        return sorted(p for p in root.rglob('*') if p.is_file()
                      and not set(p.relative_to(root).parts).intersection({'.git', 'node_modules', '__pycache__'})
                      and p != manifest_path)
    entries = [{'file': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size, 'sha256': digest(p)} for p in files()]
    dump(manifest_path, {'version': '1.40.0', 'algorithm': 'sha256', 'files': entries,
                        'manifest_self_excluded': True})
    archive = out / 'DEADWALL_1.40.0_PARCOURS_ET_ATELIERS.zip'
    prefix = 'DEADWALL_1.40.0/'
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
    result = {'version': '1.40.0', 'archive': str(archive), 'bytes': archive.stat().st_size, 'sha256': digest(archive),
              'verified_files': len(entries) + 1, 'report': str(out / report_name),
              'tests': stats, 'duration_ms': duration, 'original_codex_files': len(originals),
              'images_verified': len(assets), 'images_ready': 51, 'captures': 18,
              'frozen_checked_files': len(check_inputs), 'gates': list(gates),
              'distribution_files': len(public)}
    dump(out / 'release140-validation.json', result)
    print(json.dumps(result, ensure_ascii=False, indent=2))

def generate_report(root, folder, stats, duration, public_count):
    pairs = [
        ('d17-van', 'Fourgon dans D-17', 'Le fourgon fermé reçoit son propre toit et sa cabine. Le profil physique compact local reste identique.'),
        ('d17-buggy', 'Buggy dans D-17', 'Arceau, sièges, roues et moteur arrière remplacent le dessin générique du break.'),
        ('region-buggy', 'Buggy dans la région', 'Le même sprite transparent suit le profil régional métrique 3,5 × 1,75 m.'),
        ('region-van-opened-loot', 'Fouille réelle du fourgon', 'Douze pas ACTION prélèvent 1,44 ferraille ; la prise et l’état ouvert survivent à la sauvegarde/reprise.')]
    comparisons = []
    for name, title, caption in pairs:
        item = {'name': title, 'caption': caption}
        for phase in ['before', 'after']:
            item[phase] = 'data:image/png;base64,' + base64.b64encode((folder / f'captures/qa140-{phase}-{name}.png').read_bytes()).decode()
        comparisons.append(item)
    states = ''.join('<figure><img alt="Orientations et états du ' + name + '" src="data:image/png;base64,'
             + base64.b64encode((folder / f'captures/qa140-after-{name}-states.png').read_bytes()).decode()
             + '"><figcaption>' + name + ' : quatre orientations, fouille, épave, démontage et épuisement. États préparés, peints par le moteur livré.</figcaption></figure>' for name in ['van', 'buggy'])
    rows = [
        ('Sortie physique', 'Le conducteur sortait d’un break à travers une fenêtre barricadée de la station.', 'Le choix de portière contrôle maintenant le trajet physique ; une autre issue libre reste accessible.'),
        ('Interventions', 'Le bouton Réviser engageait le diagnostic et débitait 6 ferrailles en gardant le mirador contrôlé.', 'Aperçu et transaction attendent la libération du poste ; révision et réparation reprennent ensuite.'),
        ('Barricades', 'Pose et entretien de planches restaient disponibles sous contrôle manuel du poste.', 'Mains libres revalidées, matériaux conservés au refus ; paiement final et reprise inchangés.'),
        ('Préparations du commandant', 'Outils et trois autres préparations, plus le vidage de la cartouchière, ignoraient le poste occupé.', 'Le devis et les commandes lisent l’état réel du mirador, puis retrouvent leur effet après libération.'),
        ('Fortification', 'Installation d’un caisson, reprise de ses cartouches, réparation et débris concurrençaient le mirador ou la recharge.', 'Les opérations matérielles attendent les mains libres ; tir du poste et industrie autonome conservés.'),
        ('Éclairage', 'Ravitailler une lanterne débitait du carburant pendant la recharge ; équiper restait possible au mirador.', 'Manipulations et nouvel allumage utilisent une raison commune ; l’entretien autorisé par le bivouac reste fonctionnel.'),
        ('Soin régional', 'L’ancien bouton de soin ignorait les corps réellement relevés et les membres de groupes sauvages.', 'Le soin consulte les contacts existants, leur portée, leur étage et leur visibilité avant de travailler.'),
        ('Dépôt et premiers gestes', 'L’ancien dépôt ne comptait pas les ressources ; les dépôts de l’inventaire ne faisaient pas avancer le prologue.', 'Les vrais dépôts personnels alimentent un observateur unique, avec quantités fractionnaires, sans compter les ouvriers.'),
        ('Clavier du carnet', 'Changer un repère ou une annotation laissait le focus sur un contrôle retiré.', 'Focus restitué au contrôle correspondant ou à la recherche du carnet.'),
        ('Districts et annexes', 'SÉCURISER et + Bâtiment pouvaient rester actifs sans les conditions ou le budget requis ; sécuriser perdait le focus.', 'Devis partagé par contrôleur et interface, coût ou raison visible, repli du focus vers l’onglet courant.'),
        ('Sprites manquants', 'Fourgon et buggy utilisaient encore les trois rectangles du break.', 'Deux PNG originaux transparents, partagés entre domaines ; démontage du buggy aligné sur son moteur arrière.')]
    # The survival supplement is described only when its confirmed evidence exists.
    if (root / 'tests/survival140.test.cjs').exists():
        rows.insert(6, ('Bivouac', 'Des préparations pouvaient concurrencer le contrôle manuel du mirador.', 'Les préparations matérielles revalident les mains disponibles ; fournitures, permis d’entretien et effets historiques conservés.'))
    table = ''.join('<tr>' + ''.join('<td>' + html.escape(value) + '</td>' for value in row) + '</tr>' for row in rows)
    content = '''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEADWALL 1.40 — parcours et ateliers</title>
<style>:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#12231c;color:#eee8d2}body{margin:0}main{max-width:1160px;margin:auto;padding:42px 24px}h1{font-size:clamp(30px,5vw,58px);margin:12px 0}h2{margin-top:40px;color:#dcc584}p{line-height:1.65;max-width:100ch}.tag{letter-spacing:.18em;color:#d9bd76}.facts{display:flex;gap:14px;flex-wrap:wrap;margin:25px 0}.facts div{background:#24362a;padding:18px;border:1px solid #617052}.facts strong{display:block;font-size:28px;color:#e3cb8c}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:14px;text-align:left;vertical-align:top;border-bottom:1px solid #4c614a}th{background:#293a2d}td:first-child{width:18%;color:#dccb99}figure{margin:24px 0}img{max-width:100%;display:block;border:1px solid #687153}figcaption,.muted{color:#c2cbb4;line-height:1.5}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}button{font:inherit;padding:12px;background:#304632;border:1px solid #7a8460;color:#f0e1b6;cursor:pointer}button[aria-pressed=true]{background:#536b43;border-color:#dcc67e}button:focus-visible{outline:3px solid #dfb86a}.views{display:grid;grid-template-columns:1fr 1fr;gap:14px}.views h3{font-size:15px}.notice{border-left:4px solid #b9a265;padding:10px 18px;background:#283b2c}code{color:#e2cf91}footer{margin-top:40px;border-top:1px solid #526049;padding-top:18px;color:#b4c0aa}@media(max-width:700px){.views{grid-template-columns:1fr}td,th{padding:8px}main{padding:25px 14px}}@media print{button{display:none}body{background:white;color:#17251b}h2{color:#365134}img{max-height:260px;object-fit:contain}table{font-size:11px}}</style>
<main><div class="tag">DEADWALL · 1.40.0 · 1 OCTOBRE 2026</div><h1>Parcours & ateliers</h1><p>Cette version cumulative répare les parcours confirmés de la 1.39 : sorties de véhicule, travail au mirador, éclairage, fortification, soins, dépôts et clavier. Deux illustrations complètent le fourgon et le buggy. Les règles de combat, coûts, cartes, possessions et formats de sauvegarde sont conservés.</p>
<div class="facts"><div><strong>__COUNT__ / __COUNT__</strong>tests avec endurance</div><div><strong>2 / 2</strong>parcours intégrés</div><div><strong>51</strong>images chargées</div><div><strong>1 051</strong>originaux du codex vérifiés</div></div>
<h2>Défauts reproduits et corrections</h2><table><thead><tr><th>Parcours</th><th>Défaut observé en 1.39</th><th>Résultat vérifié en 1.40</th></tr></thead><tbody>__ROWS__</tbody></table>
<h2>Comparaisons visuelles</h2><p>Choisissez une scène. Les vrais peintres du jeu sont exécutés sur Canvas natif, avec DOM simulé et positions préparées. Ces captures ne mesurent pas le CSS du HUD dans un navigateur.</p><div class="controls" id="scenes"></div><h3 id="scene-title"></h3><div class="views"><section><h3>Avant · 1.39</h3><img id="before" alt="Rendu avant correction"></section><section><h3>Après · 1.40</h3><img id="after" alt="Rendu après correction"></section></div><p id="caption" class="muted"></p>
<h2>Orientations et états</h2>__STATES__
<h2>Vérification complète</h2><p><code>DEADWALL_SOAK=1 npm run check</code> : __COUNT__ tests réussis, aucun échec, annulation ou test ignoré. Durée : __SECONDS__ secondes. Syntaxe, distribution web et standalone reconstruits ; __PUBLIC__ fichiers publics vérifiés contre les sources.</p>
<p>Le parcours de survie utilise une vraie récolte ACTION, un dépôt, une maison financée puis achevée et une alerte suivie d’un assaut, avec sauvegardes/reprises. Le voyage finance un véhicule, charge son coffre, ravitaille, franchit effectivement la frontière en conduite, reprend la sauvegarde, descend, retire du matériel puis revient. Les préparations de ces scènes sont documentées dans les preuves JSON.</p>
<p>Les régressions nouvelles vérifient le refus sans effet, la libération volontaire, le paiement unique et la conservation après reprise. Les contrôles historiques couvrent armement, générations, énergie, barricades, interface et migrations. L’endurance comporte deux sessions de 30 minutes simulées avec un bot de sécurité ; elle ne certifie pas l’équilibrage d’une partie humaine. Dix-huit captures avant/après sont conservées. Les neuf captures finales chargent 51 images sans échec, avec 31 dessins du fourgon et 10 du buggy.</p>
<h2>Préservation et lancement</h2><p>Extraire le ZIP complet puis ouvrir <code>DEADWALL_Standalone.html</code>. Les sauvegardes existantes se poursuivent sans créer une nouvelle campagne. Les générations G1–G6 restent valides ; dix fichiers critiques de règles, sauvegarde et géographie sont identiques à la 1.39. Aucun fichier de la baseline source n’est supprimé. Les 33 images individuelles de 1.36–1.39 sont préservées avec les deux nouveaux PNG.</p>
<p>Sources, tests, codex, documentation, illustrations, preuves, <code>dist/</code> et standalone sont inclus. Les prompts exacts et la provenance figurent dans <code>assets/art140/</code>. Le manifeste SHA-256 décrit chaque fichier livré sauf lui-même ; tous les fichiers de l’archive ont été relus et vérifiés. L’ancien manifeste est préservé dans <code>reports/1.39.0/</code>.</p>
<h2>Limites précises</h2><div class="notice"><p>Les tests sous DOM simulé et les captures Canvas ne certifient pas le CSS dans un navigateur réel, le tactile matériel, l’audio ni les FPS GPU. Aucun déploiement distant ni nouveau binaire natif n’est annoncé. Ces corrections ne garantissent pas l’absence de tout défaut.</p><p>La région conserve le fourgon à 5,3 × 2,05 m et le buggy à 3,5 × 1,75 m. D-17 conserve les profils compacts historiques ; une harmonisation métrique globale des véhicules, personnages, bâtiments et accès reste un chantier distinct. Cette passe ne modifie pas la génération de biomes.</p></div>
<footer>Guide : <code>docs/LIVRAISON_1_40.md</code> · Preuves : <code>reports/1.40.0/</code> · La première passe a été interrompue pour adapter un ancien parcours de récupération des cartouches à la libération préalable du mirador. Seul <code>check-full.log</code> décrit la validation finale complète sur sources gelées.</footer></main>
<script>const scenes=__COMPARISONS__;const dock=document.getElementById('scenes');function show(i){document.getElementById('scene-title').textContent=scenes[i].name;document.getElementById('before').src=scenes[i].before;document.getElementById('after').src=scenes[i].after;document.getElementById('caption').textContent=scenes[i].caption;[...dock.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));}scenes.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=s.name;b.addEventListener('click',()=>show(i));dock.appendChild(b);});show(0);</script></html>'''
    for key, value in {'COUNT': str(stats['pass']), 'ROWS': table, 'STATES': states,
                       'SECONDS': f'{duration / 1000:.1f}', 'PUBLIC': str(public_count),
                       'COMPARISONS': json.dumps(comparisons, ensure_ascii=False)}.items():
        content = content.replace('__' + key + '__', value)
    (folder / 'RAPPORT_CORRECTIONS_1.40.0.html').write_text(content)

if __name__ == '__main__':
    main()
