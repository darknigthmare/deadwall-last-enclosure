#!/usr/bin/env python3
"""Assemble the Art223 review pack without altering image pixels or runtime files.

Inputs are exact ImageGen records and the previously retrieved repository sources.
The output remains an art-source pack: it does not install sprites in the game.
All produced files except SHA256SUMS.txt are covered by that checksum manifest.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import subprocess
from pathlib import Path

from PIL import Image


ORDER = ("bakery", "library", "laundry", "postoffice", "gym", "selfstorage")
EXPECTED = {
    "bakery": ("DW-0065", [22, 17], [0]),
    "library": ("DW-0153", [32, 24], [0, 1]),
    "laundry": ("DW-0085", [21, 15], [0]),
    "postoffice": ("DW-0082", [28, 22], [0]),
    "gym": ("DW-0444", [38, 28], [0]),
    "selfstorage": ("DW-0224", [36, 26], [0]),
}
REFERENCE_REVISION = "c9e60c28d8a4b831b94f64c64c766eb724a90d25"
DEFAULT_BASE = "f3ba02a5b73a55120c02c21d5703902ea3e901d9"
REPOSITORY = "darknigthmare/deadwall-last-enclosure"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def json_bytes(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def git_read(repo: Path, *args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(repo), *args])


def png_audit(path: Path, rel: str) -> dict:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Invalid PNG signature: {path}")
    width, height, depth, color_type, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", data[16:29]
    )
    with Image.open(path) as probe:
        probe.verify()
    with Image.open(path) as im:
        im.load()
        if im.mode != "RGBA":
            raise ValueError(f"Expected native RGBA, got {im.mode}: {path}")
        if im.size != (width, height):
            raise ValueError(f"PNG header mismatch: {path}")
        alpha = im.getchannel("A")
        histogram = alpha.histogram()
        pixels = width * height
        bounds = {}
        margins = {}
        for threshold in (1, 8, 32, 128, 240):
            box = alpha.point(lambda value, t=threshold: 255 if value >= t else 0).getbbox()
            bounds[str(threshold)] = list(box) if box else None
            margins[str(threshold)] = (
                {"left": box[0], "top": box[1], "right": width - box[2], "bottom": height - box[3]}
                if box else None
            )
        if alpha.getextrema()[0] != 0 or not bounds["8"]:
            raise ValueError(f"Missing transparent background or visible silhouette: {path}")
        if min(margins["8"].values()) <= 0:
            raise ValueError(f"Visible silhouette reaches image boundary at alpha >=8: {path}")
        edge_max = {
            "top": alpha.crop((0, 0, width, 1)).getextrema()[1],
            "bottom": alpha.crop((0, height - 1, width, height)).getextrema()[1],
            "left": alpha.crop((0, 0, 1, height)).getextrema()[1],
            "right": alpha.crop((width - 1, 0, width, height)).getextrema()[1],
        }
        return {
            "file": rel,
            "bytes": len(data),
            "sha256": digest(data),
            "pngSignatureValid": True,
            "pillowVerifyPassed": True,
            "width": width,
            "height": height,
            "mode": im.mode,
            "pngBitDepth": depth,
            "pngColorType": color_type,
            "pngCompressionMethod": compression,
            "pngFilterMethod": filtering,
            "pngInterlaceMethod": interlace,
            "alphaExtrema": list(alpha.getextrema()),
            "fullyTransparentPixels": histogram[0],
            "fullyTransparentFraction": histogram[0] / pixels,
            "lowAlphaPixels1to7": sum(histogram[1:8]),
            "boundsAlphaAtLeast": bounds,
            "marginsAlphaAtLeast": margins,
            "borderAlphaMaximum": edge_max,
            "cornerAlpha": [alpha.getpixel(p) for p in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))],
            "visibleSilhouetteWithinCanvasAtAlpha8": True,
            "nativeBytesPreserved": True,
            "pixelEditingResizingCroppingPerformed": False,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--historical-root", type=Path, required=True)
    parser.add_argument("--camera-records", type=Path, required=True)
    parser.add_argument("--camera-prompts", type=Path, nargs="+", required=True)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--base-revision", default=DEFAULT_BASE)
    parser.add_argument("--date", default="2026-11-17")
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.date):
        raise ValueError("--date must be an explicit YYYY-MM-DD date in Europe/Paris")
    repo = args.repo.resolve()
    output = args.output.resolve()
    permitted = repo / "art-packs" / "DEADWALL_Art223"
    if output != permitted:
        raise ValueError(f"Output must be the assigned pack directory: {permitted}")
    base = git_read(repo, "rev-parse", args.base_revision + "^{commit}").decode().strip()
    head = git_read(repo, "rev-parse", "HEAD").decode().strip()
    if head != base:
        raise ValueError("Pack assembly must start from the declared unchanged base revision")
    source_root = args.historical_root.resolve()
    references_root = source_root / "references-art223"
    old_targets = read_json(references_root / "targets.json")
    target_by_key = {target["type"]: target for target in old_targets["targets"]}
    prompts = [record for path in args.camera_prompts for record in read_json(path)]
    prompt_by_key = {record["key"]: record for record in prompts}
    final_records = read_json(args.camera_records)
    if isinstance(final_records, dict):
        final_records = final_records.get("results", final_records.get("records", []))
    final_by_key = {record["key"]: record for record in final_records}
    if len(final_records) != 6 or set(final_by_key) != set(ORDER):
        raise ValueError("Exactly six unique final camera records are required")
    if len(prompts) != 6 or set(prompt_by_key) != set(ORDER):
        raise ValueError("Exactly six camera prompts are required")

    planned: dict[str, bytes] = {}

    def put(rel: str, data: bytes) -> None:
        relative = Path(rel)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError(f"Unsafe output path: {rel}")
        if rel in planned and planned[rel] != data:
            raise ValueError(f"Conflicting planned content: {rel}")
        planned[rel] = data

    def put_json(rel: str, value) -> None:
        put(rel, json_bytes(value))

    source_index = []
    source_by_filename = {}
    for record in read_json(references_root / "sources.json"):
        source = Path(record["localPath"])
        data = source.read_bytes()
        if digest(data) != record["sha256"] or git_blob(data) != record["gitBlob"]:
            raise ValueError(f"Source checksum mismatch: {source}")
        rel = "references/" + source.name
        put(rel, data)
        tree_entry = git_read(repo, "ls-tree", base, "--", record["repositoryPath"])
        current_blob = tree_entry.split()[2].decode() if tree_entry else None
        updated = {
            **record,
            "packPath": rel,
            "bytes": len(data),
            "sha256": digest(data),
            "gitBlob": git_blob(data),
            "verifiedAgainstRetrievedSourceDigest": True,
            "baseRevisionCompared": base,
            "basePathPresent": bool(tree_entry),
            "baseGitBlob": current_blob,
            "sameBlobAtPublicationBase": current_blob == record["gitBlob"],
        }
        source_index.append(updated)
        source_by_filename[source.name] = updated
    put_json("references/sources.json", source_index)
    put("references/selection-at-retrieval.json", (references_root / "targets.json").read_bytes())

    source_map = []
    for key in ORDER:
        ident, footprint, levels = EXPECTED[key]
        target = target_by_key[key]
        sheet = (references_root / f"{ident}.md").read_text(encoding="utf-8")
        pilot = re.search(r"Plan source : `([^`]+)`; enveloppe bâtie actuelle (\[[^\]]+\]) m; niveaux (\[[^\]]+\])", sheet)
        parcel = re.search(r"Enveloppe de parcelle proposée : de (\d+) × (\d+) m à (\d+) × (\d+) m\. Niveaux proposés : ([^.]+)\.", sheet)
        if not pilot or not parcel:
            raise ValueError(f"Could not verify pilot/author distinction for {ident}")
        if pilot[1] != key or json.loads(pilot[2]) != footprint or json.loads(pilot[3]) != levels:
            raise ValueError(f"Pilot data changed for {ident}")
        source_map.append({
            "id": ident,
            "name": target["name"],
            "type": key,
            "sourceRevision": REFERENCE_REVISION,
            "sheet": f"references/{ident}.md",
            "sheetSha256": source_by_filename[f"{ident}.md"]["sha256"],
            "pilotBuildingFootprintMetres": footprint,
            "pilotLevels": levels,
            "pilotSource": "src/frontier-places.js::PRESETS",
            "authorProposedParcelRangeMetres": {"minimum": [int(parcel[1]), int(parcel[2])], "maximum": [int(parcel[3]), int(parcel[4])]},
            "authorProposedLevelsText": parcel[5],
            "pilotAndAuthorParcelAreDifferentConcepts": True,
            "program": target["program"],
            "invariants": target["invariants"],
            "existingGenericRoofFamily": target["genericRoof"],
            "existingRenderer": "src/frontier-art.js::lotRoof → DeadwallInteriorArt153.drawRoof",
            "newSpriteRegisteredInRuntime": False,
        })
    put_json("references/SOURCE_MAP.json", source_map)

    history = []
    historical_count = 0
    original_records = {}
    for key in ORDER:
        original_records[key] = read_json(source_root / f"art223-record-{key}.json")
        record_paths = [source_root / f"art223-record-{key}.json"]
        access = source_root / f"art223-corrected-record-{key}.json"
        if access.exists():
            record_paths.append(access)
        for stage, record_path in enumerate(record_paths, start=1):
            record = read_json(record_path)
            source = Path(record["generatedSourcePath"])
            rel = f"references/iterations/{record['id']}_{key}_v{stage}.png"
            put(rel, source.read_bytes())
            put(f"records/{record_path.name}", record_path.read_bytes())
            history.append({
                **record,
                "iteration": stage,
                "stage": "initial_generation" if stage == 1 else "ground_access_correction",
                "packPath": rel,
                "sha256": digest(source.read_bytes()),
                "selectedAsFinal": False,
                "supersededReason": "Projection rapprochée de l’atlas dans la version finale ; les versions initiales bakery/laundry/postoffice avaient aussi un accès sur toiture.",
            })
            historical_count += 1
    if historical_count != 9:
        raise ValueError(f"Expected nine superseded native PNGs, found {historical_count}")

    asset_rows = []
    audit_rows = []
    for key in ORDER:
        ident, footprint, levels = EXPECTED[key]
        prompt_record = prompt_by_key[key]
        record = {**prompt_record, **final_by_key[key]}
        if record.get("id") != ident:
            raise ValueError(f"Final record identifier mismatch: {key}")
        if record.get("prompt") != prompt_record["prompt"]:
            raise ValueError(f"Final prompt does not equal the verbatim prompt record: {key}")
        source = Path(record["generatedSourcePath"])
        filename = original_records[key]["file"]
        rel = f"assets/art223/regional/{filename}"
        data = source.read_bytes()
        put(rel, data)
        audit = png_audit(source, rel)
        audit_rows.append({"id": ident, "key": key, **audit})
        row = {
            **record,
            "file": filename,
            "stage": "camera_projection_correction",
            "packPath": rel,
            "sha256": digest(data),
            "selectedAsFinal": True,
            "nativeOutputBytesPreserved": True,
        }
        history.append(row)
        asset_rows.append({
            "id": ident,
            "type": key,
            "name": target_by_key[key]["name"],
            "path": rel,
            "generatedSourcePath": str(source),
            "sha256": digest(data),
            "bytes": len(data),
            "pilotBuildingFootprintMetres": footprint,
            "pilotLevels": levels,
            "sourceMap": "references/SOURCE_MAP.json",
            "generationIteration": record.get("iteration"),
            "status": "generated_review_candidate_not_runtime_integrated",
        })
    put_json("generation-history.json", history)
    put_json("generation-prompts.json", [{k: value for k, value in record.items() if k != "image_url"} for record in history])
    for path in args.camera_prompts:
        put("records/camera-input-" + path.name, path.read_bytes())
    put("records/camera-results.json", args.camera_records.read_bytes())

    audit_report = {
        "schemaVersion": 1,
        "batch": "art223",
        "checkedOn": args.date,
        "timezone": "Europe/Paris",
        "method": "PNG signature and IHDR inspection; Pillow verify; native RGBA alpha histogram and bounds; SHA-256 comparison. No image write, crop, resize or pixel transformation.",
        "alphaThresholds": [1, 8, 32, 128, 240],
        "boundsConvention": "left, top inclusive; right, bottom exclusive",
        "alphaInterpretation": "Raw RGB outside the silhouette may contain hidden background colors while alpha=0. Very low alpha noise at thresholds1–7 is reported separately. Alpha>=8 margins are a technical visibility indicator, not a physical footprint or a fidelity certificate.",
        "finalSpriteCount": len(audit_rows),
        "allNativePngSignaturesValid": all(row["pngSignatureValid"] for row in audit_rows),
        "allRgba": all(row["mode"] == "RGBA" for row in audit_rows),
        "allVisibleSilhouettesWithinCanvasAtAlpha8": all(row["visibleSilhouetteWithinCanvasAtAlpha8"] for row in audit_rows),
        "assets": audit_rows,
    }
    put_json("qa/image-audit.json", audit_report)

    # Each note records the reviewer observations made on the actual selected PNG.
    observations = {
        "bakery": "Façade raccourcie par rapport à la correction d’accès, toiture davantage dominante ; porte de service au sol à gauche, boutique et conduit du four conservés.",
        "library": "Façade comprimée, toiture davantage dominante ; deux rangées de fenêtres conservées, porche soutenu au sol et accès latéral distinct.",
        "laundry": "Façade raccourcie ; toiture, trois évents et machines derrière vitrage conservés ; entrée publique et petite porte technique à droite restent au sol.",
        "postoffice": "Façade fortement raccourcie, toiture dominante ; rideau de chargement et bornes à gauche restent au sol, séparés de l’entrée publique et des casiers.",
        "gym": "Toiture à deux pans davantage dominante, façade raccourcie ; rangée de fenêtres hautes et bande basse d’entrée conservées, sans étage ajouté ; accès matériel au sol.",
        "selfstorage": "Toiture plus profonde et façade raccourcie ; accueil bas et unique porte de manutention au sol conservés ; bâtiment fermé, sans rangée de garages extérieurs.",
    }
    if any(note.startswith("À compléter") for note in observations.values()):
        raise ValueError("Final visual review must be completed for all six PNGs before assembly")
    visual_lines = [
        "# Art223 — revue visuelle des versions retenues", "",
        f"Revue du {args.date}, Europe/Paris. Comparaison avec l’atlas réel, les fiches du Codex et les versions antérieures conservées.", "",
        "Les corrections rapprochent la projection des bâtiments de la caméra haute de l’atlas. Elles ne certifient ni une projection métrique exacte, ni une identité pixel pour pixel.", "",
        "| Fiche | Observation sur la version finale |", "|---|---|",
    ]
    visual_lines += [f"| {EXPECTED[key][0]} — {target_by_key[key]['name']} | {observations[key]} |" for key in ORDER]
    visual_lines += ["", "Les silhouettes principales restent entièrement visibles. Les vérifications du canal alpha et des marges sont chiffrées dans `image-audit.json`. Les octets natifs de chaque image sont conservés.", "", "## Limites", "", "Les dimensions des pilotes décrivent les bâtiments existants du Codex ; les plages de parcelles auteur décrivent d’autres propositions. Les coordonnées de portes, pivots, mètres par pixel, collisions, visibilité des intérieurs et tri de profondeur restent à calibrer dans le moteur. Aucun parcours navigateur, Windows ou test de jouabilité n’a été exécuté pour ce pack. Le contrôle général antérieur est interrompu : aucune réussite globale n’est déduite de ses résultats partiels.", ""]
    put("qa/visual-review.md", "\n".join(visual_lines).encode("utf-8"))

    provenance = {
        "schemaVersion": 1,
        "project": "DEADWALL — Last Enclosure",
        "batch": "art223",
        "assembledOn": args.date,
        "timezone": "Europe/Paris",
        "generator": "OpenAI ImageGen intégré",
        "finalSpriteCount": 6,
        "generationCount": len(history),
        "supersededCandidateCount": historical_count,
        "referenceRepository": REPOSITORY,
        "referenceRevision": REFERENCE_REVISION,
        "publicationBaseRevision": base,
        "referenceRevisionIsOutputCommit": False,
        "publicationBaseIsOutputCommit": False,
        "styleReference": source_by_filename["buildings-atlas.webp"],
        "nativeOutputBytesPreserved": True,
        "pixelEditingResizingCroppingPerformed": False,
        "scope": "Six extérieurs civils dédiés, leurs références et quinze sorties ImageGen natives conservées. Pack de préparation artistique distinct des ressources chargées par le jeu.",
        "fidelity": {
            "observed": ["Atlas réel fourni comme référence", "Programmes et niveaux rapprochés des fiches", "Accès sur toiture corrigés", "Projection rapprochée de la caméra haute", "Silhouettes entières et canal alpha vérifiés"],
            "notCertified": ["Projection et mètres par pixel exacts", "Fidélité pixel pour pixel", "Ancres et collision", "Positions d’accès conformes au moteur", "Intérieurs ou comportement en jeu"],
        },
        "integration": {"performed": False, "runtimeSourceChanged": False, "runtimeAssetRegistrationChanged": False, "testsChanged": False},
        "validation": {"packTechnicalAudit": "passed", "runtimeCheckThisPack": "not_run", "priorRuntimeCheck": "interrupted_without_final_success", "browser": "not_run", "windows": "not_run"},
        "sourcesIndex": "references/sources.json",
        "sourceMapping": "references/SOURCE_MAP.json",
        "prompts": "generation-prompts.json",
        "generationHistory": "generation-history.json",
        "technicalAudit": "qa/image-audit.json",
        "visualReview": "qa/visual-review.md",
        "assets": asset_rows,
    }
    put_json("PROVENANCE.json", provenance)
    put_json("REPRISE.json", {
        "schemaVersion": 1,
        "project": provenance["project"],
        "batch": "art223",
        "savedOn": args.date,
        "timezone": "Europe/Paris",
        "intent": "Continuer les sprites manquants depuis le point conservé, sans régénérer les lots précédents.",
        "completedSpriteIds": [row["id"] for row in asset_rows],
        "finalAssets": [{"id": row["id"], "path": row["path"], "sha256": row["sha256"]} for row in asset_rows],
        "priorArt222Regenerated": False,
        "priorArt221Regenerated": False,
        "priorArt221HistoricalInventoryFullyVerified": False,
        "publicationBaseRevision": base,
        "referenceRevision": REFERENCE_REVISION,
        "integration": "not_performed",
        "publicationStatusAtAssembly": "prepared_locally_not_published_by_assembler",
        "nextSteps": ["Conserver les six versions finales et les neuf étapes précédentes.", "Vérifier les PR et les manifestes existants avant de choisir d’autres manquants.", "Associer les futurs sprites au type et à la fiche exacts.", "Calibrer projection, échelle, ancrages, accès et visibilité des intérieurs avant raccord au rendu.", "Après intégration, exécuter les contrôles du dépôt et le parcours joueur sur le commit réel."],
        "gendarmerie": {"status": "source_required", "reason": "Aucune fiche dédiée retrouvée dans les index inspectés; une occurrence de regex ne suffit pas à revendiquer une référence canonique."},
        "knownLimits": ["Inventaire exhaustif des manquants non certifié.", "Fidélité métrique 1:1 non certifiée.", "Contrôle global antérieur interrompu; aucun succès global annoncé.", "Pack non enregistré dans le chargement du jeu."],
    })
    rows = []
    for row in source_map:
        w, d = row["pilotBuildingFootprintMetres"]
        mini = row["authorProposedParcelRangeMetres"]["minimum"]
        maxi = row["authorProposedParcelRangeMetres"]["maximum"]
        rows.append(f"| {row['id']} | {row['name']} | {w} × {d} m | {', '.join(map(str, row['pilotLevels']))} | {mini[0]} × {mini[1]} à {maxi[0]} × {maxi[1]} m |")
    readme = f"""# DEADWALL — Art223 : services civils

Ce pack réunit **six sprites extérieurs dédiés**, préparés depuis les fiches du Codex et l’atlas réel de DEADWALL. Les trois erreurs d’accès sur toiture ont été corrigées, puis les six projections ont été rapprochées de la caméra haute de l’atlas. Les **neuf PNG intermédiaires** restent conservés avec les prompts exacts.

## Contenu

| Fiche | Bâtiment | Emprise bâtie du pilote | Niveaux du pilote | Parcelles proposées par la fiche auteur |
|---|---|---:|---|---|
{chr(10).join(rows)}

Les emprises des pilotes et les plages de parcelles auteur décrivent des objets différents. Les plages auteur ne servent pas à agrandir ou remplacer implicitement les pilotes. Le mapping détaillé est dans `references/SOURCE_MAP.json`.

## Références et fichiers

- `assets/art223/regional/` : six PNG retenus, dans leurs dimensions et octets natifs.
- `references/iterations/` : six premières générations et trois corrections d’accès.
- `references/` : six fiches, atlas, instantanés des mappings et index avec empreintes SHA-256 et Git.
- `generation-history.json`, `generation-prompts.json`, `records/` : historique et prompts exacts.
- `PROVENANCE.json`, `REPRISE.json` : périmètre, limites et suite du chantier.
- `qa/image-audit.json`, `qa/visual-review.md` : contrôles techniques et observations visuelles.
- `SHA256SUMS.txt` : intégrité de tous les autres fichiers du pack.

Les références proviennent de `{REFERENCE_REVISION}`. Leur identité est comparée à la base de publication `{base}` dans `references/sources.json`. Ces deux révisions sont des sources, pas le commit de livraison du pack.

## Vérification réelle

Les signatures PNG, le décodage, les dimensions, le mode RGBA, le canal alpha, les marges visibles et les empreintes des six sorties finales sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Quelques pixels de très faible alpha peuvent subsister hors silhouette ; l’audit conserve plusieurs seuils et ne confond pas ces pixels avec une emprise physique.

Les corrections de caméra améliorent la cohérence de projection. **La fidélité métrique ou pixel pour pixel n’est pas certifiée.** Les ancres, dimensions dans le moteur, accès, collisions, ouverture des intérieurs et tri de profondeur restent à valider lors du raccord au jeu.

## Statut d’intégration

**Pack de préparation artistique : intégration au moteur non effectuée.** Le jeu possède déjà des plans, intérieurs, props et toitures génériques pour ces types. Ce lot apporte des extérieurs complets dédiés ; il ne prétend pas créer six nouveaux lieux jouables.

Les sources de jeu, les tests, le chargeur et le manifeste public ne sont pas modifiés. Le contrôle global antérieur est **interrompu, sans réussite finale**. Aucun résultat ancien ou contrôle d’image ne vaut validation de la suite complète, du navigateur, de Windows ou de la jouabilité.

## Reproduire le pack

L’assembleur est conservé dans `tools/assemble_art223.py`. Il utilise Python et Pillow, les fichiers sources et records exacts listés dans `records/assembly-inputs.json`, et une copie propre du dépôt à la base déclarée. Il copie les octets natifs sans générer ni retoucher d’image. Les empreintes de sortie sont reproductibles pour ces mêmes entrées et la même date explicite.

```sh
python tools/assemble_art223.py --historical-root /chemin/vers/la/reprise-historique --camera-records /chemin/vers/results.json --camera-prompts /chemin/vers/prompts.json /chemin/vers/next-prompts.json --repo /chemin/vers/deadwall-art223 --output /chemin/vers/deadwall-art223/art-packs/DEADWALL_Art223 --base-revision {base} --date {args.date}
```

Lire `REPRISE.json` avant de continuer la sélection, l’intégration ou la publication.
"""
    put("README_FR.md", readme.encode("utf-8"))
    script_bytes = Path(__file__).read_bytes()
    put("tools/assemble_art223.py", script_bytes)
    put_json("records/assembly-inputs.json", {
        "baseRevision": base,
        "dateEuropeParis": args.date,
        "historicalRoot": str(source_root),
        "cameraRecords": {"path": str(args.camera_records.resolve()), "sha256": digest(args.camera_records.read_bytes())},
        "cameraPrompts": [{"path": str(path.resolve()), "sha256": digest(path.read_bytes())} for path in args.camera_prompts],
        "historicalSourceIndex": {"path": str(references_root / "sources.json"), "sha256": digest((references_root / "sources.json").read_bytes())},
        "assemblerSha256": digest(script_bytes),
        "outputFilesAreDeterministic": True,
        "nativePngBytesPreserved": True,
    })
    expected_paths = set(planned) | {"SHA256SUMS.txt"}
    if output.exists():
        unexpected = sorted(str(p.relative_to(output)) for p in output.rglob("*") if p.is_file() and str(p.relative_to(output)) not in expected_paths)
        if unexpected:
            raise ValueError(f"Refusing to overwrite a pack with unrecognized files: {unexpected}")
    for rel, data in sorted(planned.items()):
        target = output / rel
        if target.is_symlink():
            raise ValueError(f"Refusing symlink: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.read_bytes() != data:
            target.write_bytes(data)
    checksum_text = "".join(f"{digest(data)}  {rel}\n" for rel, data in sorted(planned.items()))
    (output / "SHA256SUMS.txt").write_text(checksum_text, encoding="utf-8")
    for rel, expected_data in planned.items():
        if (output / rel).read_bytes() != expected_data:
            raise RuntimeError(f"Written output differs: {rel}")
    if git_read(repo, "rev-parse", "HEAD").decode().strip() != base:
        raise RuntimeError("Repository HEAD changed during assembly")
    print(json.dumps({
        "pack": str(output),
        "baseRevision": base,
        "finalSpriteCount": len(asset_rows),
        "supersededCandidateCount": historical_count,
        "totalGeneratedPngCount": len(history),
        "files": len(planned) + 1,
        "bytes": sum(len(value) for value in planned.values()) + len(checksum_text.encode()),
        "checksumManifestSha256": digest(checksum_text.encode()),
        "nativePngCopiesVerified": True,
        "runtimeIntegrationPerformed": False,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
