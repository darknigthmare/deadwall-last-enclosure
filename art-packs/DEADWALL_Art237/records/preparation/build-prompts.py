from pathlib import Path
import json, hashlib, shutil

prep=Path(__file__).resolve().parent
base=json.loads((prep/'selection-base.json').read_text())
evidence=json.loads((prep/'source-evidence.json').read_text())
sources={s['repositoryPath']:s for s in evidence['sourceFiles']}
atlas_paths=['assets/art159/traps-mechanisms-a.png','assets/art159/traps-supplies-a.png']
details={
 'runnerCable193': '''Keep the low, broad horizontal two-rail timber-and-rusted-steel base. Keep its four end mounting bands. The mobile1 sliding/hooked crosspiece stands vertically just LEFT of centre, with the small hooked tip pointing LEFT in the lower half. The mobile2 toothed slider sits RIGHT of centre, horizontally, with its existing opposed teeth above and below. The distinctive Canvas193 hardware is TWO slender long vertical hook rails at the left and right positions shown: each has an inward slanted short return at its LOWER end, plus exactly ONE straight horizontal cable joining them above the middle. Preserve those two side uprights and both lower returns; do not shorten them to the wood base. Texture the pale olive-grey schematic hardware as simple dull worn metal/cable while retaining its complete silhouette and exact locations. Preserve the existing Hérisson underlay glimpses. No reel, extra coil, trigger pedal or new jaw.''',
 'breachClamp193': '''Keep the approximately square timber frame with a clear central opening, four steel corner bands, and its two lateral hinge drums. Preserve the TWO inward-facing toothed curved jaw plates, their circular hinge eyes in the lower left and lower right areas, their current fixed armed pose, and the central negative space. Do not open or close the jaws relative to reference 1. The distinctive Canvas193 hardware is FOUR small rectangular damper blocks, one near each corner position shown, and exactly TWO thin diagonal members crossing in an X across the frame, joining opposite damper positions. Make the tan-grey blocks and the X members look like worn material with exactly the same positions, widths and connections. Preserve the visible Hérisson underlay. No additional central trigger plate, third jaw, motor, hydraulic tank or new brace.''',
 'enduranceRack193': '''Keep the ratchet assembly: a timber-and-steel base with two side rails, the central roller opening and the broad lower crossbar. The first mobile piece is the existing long triangular toothed ratchet blade pivoting from its circular eye on the LEFT and sloping gently up toward the RIGHT. The second mobile piece is the existing compact coiled spring with its hooked end at the RIGHT of centre. Preserve their overlap, exact positions and armed angles. The distinctive Canvas193 hardware occupies the UPPER part of the reference: exactly ONE thin rectangular rack frame containing exactly FOUR evenly spaced rectangular hanging teeth. Give that pale grey-brown frame and those four teeth worn metal texture without adding teeth or filling their intervening gaps. Preserve the side glimpses of the Hérisson support beneath. No spare rack, loose teeth, extra stock, motor or duplicated spring.''',
 'shieldTongs193': '''Keep the approximately square timber frame, its four corner bands, two side hinge drums and clear central opening. Preserve exactly TWO inward-facing toothed curved jaw plates and the two circular pivot eyes, in the same fixed armed pose and overlap as reference 1. The distinctive Canvas193 hardware is exactly TWO broad straight metal tong bars. The LEFT bar runs from the lower-left corner area toward the upper-left inner area; the RIGHT bar mirrors it from the lower-right area toward the upper-right inner area. They lean inward toward the top, but remain separate and do NOT cross or connect over the central gap. Texture their muted blue-grey/olive-grey surfaces as worn metal while keeping their width, ends and placement. Preserve the Hérisson support underneath. No shield held in the jaws, target, third jaw, X brace, added spring or central trigger plate.''',
 'quickCable193': '''Keep the low broad horizontal twin-rail timber-and-rusted-steel base with the same four mounting bands. Keep the vertical sliding/hooked crosspiece LEFT of centre, its hook pointing LEFT, and the compact horizontal toothed slider RIGHT of centre. The distinctive Canvas193 hardware is exactly TWO circular annular reel shapes, one at each end on the horizontal centreline, and exactly ONE straight horizontal cable along the LOWER edge between their X positions. The two rings must remain visibly hollow: do not turn them into large solid disks, stacked loose coils or extra stock. Texture the existing pale tan-grey annular rims and the single lower cable as dull worn material without changing their outline, thickness, centres or spacing. Keep the lower cable separate from the centreline and preserve the existing underlay glimpses. No long vertical hook rails, no hanging ropes, no third reel, motor or new hardware.''',
 'siegeBrake193': '''Keep the existing counterweight-family assembly and its broad timber base with two outer steel rails. Preserve the central triangular-braced pivot tower, its circular upper eye, the angled long narrow lever running from a circular eye in the lower-left/centre area up toward the RIGHT, and the existing hanging rectangular riveted counterweight at the RIGHT with its short vertical chain extending toward the TOP. Keep the same overlaps, pivot placement, lever angle and attached chain length. The distinctive Canvas193 hardware is exactly ONE small muted grey-olive rectangular brake block at the UPPER LEFT, and exactly FOUR connected downward V-shaped chain/link sections forming a short horizontal zigzag across the LOWER centre. Texture that block and four-link zigzag as worn physical material with the same silhouette and placement. Preserve the underlying Hérisson support glimpses. No extra weight, pendulum swing, pulley wheel, extra long chain, winch, motor or loose stock.'''
}
observations={
 'runnerCable193':'Broad horizontal rails; vertical left slider; right tooth slider; long lateral hooks and high horizontal cable; lower inward returns.',
 'breachClamp193':'Two opposing inward-toothed jaw plates on a square open frame; four corner blocks and central X hardware.',
 'enduranceRack193':'Ratchet blade from left toward upper-right and a right spring; upper rack frame has four hanging rectangular teeth.',
 'shieldTongs193':'Shared paired-jaw frame with two uncrossed broad inward-leaning tong bars, distinct from breachClamp X.',
 'quickCable193':'Shared low rail frame with two hollow annular reels at the ends and a lower horizontal cable.',
 'siegeBrake193':'Central braced pivot, angled lever and right chain-hung counterweight; upper-left brake block and four-V lower chain.'
}
for t in base['targets']:
 t['route']='art159-canvas193-mounted-source'
 t['runtimeIdentity']=t['kind']
 t['idMeaning']='Descriptive source-art identity only; not a new runtime/save identifier.'
 t['referenceFiles']=[{'path':t['canonicalReference']['path'],'preparedPath':t['canonicalReference']['preparedPath'],'sha256':t['canonicalReference']['sha256'],'role':'Unchanged native renderer assembly: geometry, camera, state, part count and placement authority.'}]
 for p in atlas_paths:
  s=sources[p]
  t['referenceFiles'].append({**s,'path':s['absolutePath'],'role':'Original material and component texture reference only; never atlas layout, neighbouring objects or background.'})
 t['referenceImages']=[r['path'] for r in t['referenceFiles']]
 t['referenceInspection']={'inspectedBeforeGeneration':True,'method':'view_image native PNG; all 6 canonical references and both complete original atlases visually inspected before first call','observation':observations[t['key']]}
 t['generator']='image_gen.imagegen'
 t['transparentBackgroundRequested']=True
 t['promptIsVerbatim']=True
 t['iteration']=1
 t['prompt']=f'''Create ONE original DEADWALL source-art sprite proposal for the existing mechanism {t['label']} ({t['kind']}), variant 0, mounted on its existing Hérisson support, completely at rest in the armed pose.

REFERENCE CONTRACT: Image 1 is the actual assembled sprite drawn by the UNCHANGED game renderer for this exact mechanism. It is the authority for silhouette, camera/projection, axes, every major part, every connection, relative size, overlap, and position. Images 2 and 3 are the original component atlases, supplied ONLY for material texture and colour; do not copy their sheets, neighbours, backgrounds, or detached layout. Keep the assembled design of image 1. Refine materials, not geometry. This is one assembled object, never an exploded diagram or atlas.

CAMERA AND SCALE: Keep the same 2D sprite-plane projection and the same visible surfaces as image 1; do not rotate, mirror, tilt, reinterpret its elevation or rebuild it into a different perspective. Horizontal source X remains horizontal; source Y remains vertical downward. Preserve the full source silhouette and aspect ratio. The support has an authored 1 m by 1 m ground footprint; the native sprite owner is 32 by 32 units, with its drawing clipped to the existing 26 by 26 interior. These constrain its existing relative proportions; they are not permission to make all six silhouettes square. No mechanism height is specified. Do not add tall unseen faces, new supports or a new pedestal.

EXACT ASSEMBLY: {details[t['key']]}

STATE AND OWNERSHIP: The source contains the existing Hérisson support beneath one fixed mechanism base, TWO mobile parts frozen in their native armed pose, and its specialized hardware. Keep all visible pieces exactly where the reference places them. Full nominal charges ({t['sourceRecipe']['charges']}) are a state value, not a quantity of loose physical supplies to draw. No action, no target, no wound, no movement, no trigger flash, no sparks, no smoke, no charged glow, no UI badge or quantity marker. This is a static source illustration, not an animation replacement.

MATERIALS: Serious grounded repaired survival equipment. Match the original atlas's aged brown timber, dark oxidised steel, restrained iron-red rust, dull bolts and worn grey/olive hardware. Clearly readable existing edges and joins; no ornamental redesign, futuristic equipment, fantasy motifs or excessive new damage. Soft neutral illumination and crisp detailed silhouette. The original flat-colour specialized hardware should become believable material, not a painted annotation or diagram, but its count, topology and placement must remain unchanged.

OUTPUT: Exactly ONE complete isolated mounted mechanism, centred on TRUE transparent RGBA. Preserve every protruding existing part with at least 12 percent clear transparent margin on all four sides. No floor, terrain, base tile, ambient backdrop, coloured matte, cast shadow outside the object, labels, words, numerals, dimensions, watermark, logos, border, reference sheet or additional object. Keep the holes between parts transparent. Native PNG only.'''

(prep/'selection-and-prompts.json').write_text(json.dumps(base,ensure_ascii=False,indent=2)+'\n')
(prep/'generation-prompts.json').write_text(json.dumps([{'key':t['key'],'iteration':1,'prompt':t['prompt'],'referenceImages':t['referenceImages'],'transparentBackgroundRequested':True,'generator':t['generator'],'promptIsVerbatim':True} for t in base['targets']],ensure_ascii=False,indent=2)+'\n')
(prep/'reference-inspections.json').write_text(json.dumps({'reviewer':'defenses_art237','sourceMain':base['sourceMain'],'canonicalReferences':[{'key':t['key'],'path':t['canonicalReference']['path'],'sha256':t['canonicalReference']['sha256'],**t['referenceInspection']} for t in base['targets']],'styleAtlases':[sources[p] for p in atlas_paths]},ensure_ascii=False,indent=2)+'\n')
audit=prep.parent/'next-art233-audit/actors-and-equipment'
for name in ['README.md','shortlist-and-backlog.json','source-evidence.json']:
 dst=prep/'prior-audit'/name
 dst.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(audit/name,dst)
print(json.dumps({'targets':len(base['targets']),'route':base['targets'][0]['route'],'promptsPrepared':True,'generationStarted':False}))
