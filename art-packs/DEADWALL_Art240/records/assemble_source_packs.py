#!/usr/bin/env python3
"""Archive source-art proposals without changing any image bytes.

The three batches contain distinct existing structural205 painter variants.
Prior packs remain untouched; PNG bytes are only inspected and copied.  The default mode
validates the complete real inputs and computes the pack manifest without
writing a pack.  --write is used only after the coordinating agent freezes the
selected images and reviews.  Existing packs may only be replayed identically.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import struct
import subprocess
from pathlib import Path

from PIL import Image


SOURCE = "12e0aa4aa77b9901bd53eb7a8771382a5f753593"
BASE = "6ebd6707251e675a5b75ded23e91dd28339dfe38"
TREE = "33d089eab2bb23f288e66d57c2794f6a38b3ba84"
REPOSITORY = "darknigthmare/deadwall-last-enclosure"
CONTRACTS = {239: {'keys': ['fence:v1', 'fence:v2', 'garden-shed:v1', 'garden-shed:v2', 'rain-barrel:v1', 'rain-barrel:v2'],
       'directory': 'props',
       'title': 'Clôtures, abris et tonneaux — variantes 1 et 2',
       'identityPolicy': 'prop:<kind>:vN identifies an existing structural205 painter variant, not a new runtime type. '
                         'Author-plan instance and plan variant are preserved separately.',
       'scope': 'Additional source proposals for existing structural205 painter variants 1 and 2. Variant 0 images and '
                'all existing rendering remain unchanged. This is a chosen coverage extension, not evidence that the '
                'objects lack a visible in-game render.',
       'geometryBasis': 'Unmodified public drawProp on exact authored fixtures. Painter variant 1 or 2; stateAlpha '
                        'false; no live game argument. Author-design dimensions and plan variants are separate from '
                        'raster pixels.',
       'scopeFr': 'Ce lot étend la couverture aux variantes 1 et 2 déjà définies par structural205. Les propositions '
                  'en variante 0 restent conservées. Les objets ont déjà un rendu visible ; aucune nouvelle famille '
                  'runtime ni nouvelle fonctionnalité ne sont créées.',
       'geometryFr': 'Les références utilisent drawProp sur les instances auteur exactes, avec la variante de peintre '
                     '1 ou 2 et stateAlpha:false, sans objet game. La variante du plan auteur reste distincte. Les '
                     'dimensions sont des choix de conception, sans certification métrique ou pixel pour pixel du PNG.',
       'remainingWork': ['Qualify scale, anchors, clipping and orientation before any separate runtime registration.',
                         'Preserve the existing author-plan IDs, physics, service and water state owners.',
                         'Keep this painter variant distinct from the author-plan variant and from every other '
                         'instance size.']},
 240: {'keys': ['compost-bin:v1', 'compost-bin:v2', 'closed-pool:v1', 'closed-pool:v2'],
       'directory': 'props',
       'title': 'Composteurs et bassins — variantes 1 et 2',
       'identityPolicy': 'prop:<kind>:vN identifies an existing structural205 painter variant, not a new runtime type. '
                         'Author-plan instance and plan variant are preserved separately.',
       'scope': 'Additional source proposals for existing structural205 painter variants 1 and 2. Variant 0 images and '
                'all existing rendering remain unchanged. This is a chosen coverage extension, not evidence that the '
                'objects lack a visible in-game render.',
       'geometryBasis': 'Unmodified public drawProp on exact authored fixtures. Painter variant 1 or 2; stateAlpha '
                        'false; no live game argument. Author-design dimensions and plan variants are separate from '
                        'raster pixels.',
       'scopeFr': 'Ce lot étend la couverture aux variantes 1 et 2 déjà définies par structural205. Les propositions '
                  'en variante 0 restent conservées. Les objets ont déjà un rendu visible ; aucune nouvelle famille '
                  'runtime ni nouvelle fonctionnalité ne sont créées.',
       'geometryFr': 'Les références utilisent drawProp sur les instances auteur exactes, avec la variante de peintre '
                     '1 ou 2 et stateAlpha:false, sans objet game. La variante du plan auteur reste distincte. Les '
                     'dimensions sont des choix de conception, sans certification métrique ou pixel pour pixel du PNG.',
       'remainingWork': ['Qualify scale, anchors, clipping and orientation before any separate runtime registration.',
                         'Preserve the existing author-plan IDs, physics, service and water state owners.',
                         'Keep this painter variant distinct from the author-plan variant and from every other '
                         'instance size.']},
 241: {'keys': ['touring-caravan:v1', 'touring-caravan:v2', 'abandoned-caravan:v1', 'abandoned-caravan:v2'],
       'directory': 'props',
       'title': 'Caravanes fermées — variantes 1 et 2',
       'identityPolicy': 'prop:<kind>:vN identifies an existing structural205 painter variant, not a new runtime type. '
                         'Author-plan instance and plan variant are preserved separately.',
       'scope': 'Additional source proposals for existing structural205 painter variants 1 and 2. Variant 0 images and '
                'all existing rendering remain unchanged. This is a chosen coverage extension, not evidence that the '
                'objects lack a visible in-game render.',
       'geometryBasis': 'Unmodified public drawProp on exact authored fixtures. Painter variant 1 or 2; stateAlpha '
                        'false; no live game argument. Author-design dimensions and plan variants are separate from '
                        'raster pixels.',
       'scopeFr': 'Ce lot étend la couverture aux variantes 1 et 2 déjà définies par structural205. Les propositions '
                  'en variante 0 restent conservées. Les objets ont déjà un rendu visible ; aucune nouvelle famille '
                  'runtime ni nouvelle fonctionnalité ne sont créées.',
       'geometryFr': 'Les références utilisent drawProp sur les instances auteur exactes, avec la variante de peintre '
                     '1 ou 2 et stateAlpha:false, sans objet game. La variante du plan auteur reste distincte. Les '
                     'dimensions sont des choix de conception, sans certification métrique ou pixel pour pixel du PNG.',
       'remainingWork': ['Qualify scale, anchors, clipping and orientation before any separate runtime registration.',
                         'Preserve the existing author-plan IDs, physics, service and water state owners.',
                         'Keep this painter variant distinct from the author-plan variant and from every other '
                         'instance size.']}}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def git_blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args])


def safe(relative):
    if not isinstance(relative, str):
        raise ValueError("A relative path string is required")
    path = Path(relative)
    if path.is_absolute() or ".." in path.parts or "\\" in relative or not path.parts:
        raise ValueError("Unsafe relative path: " + relative)
    return path.as_posix()


def absolute(value, prep):
    if isinstance(value, dict):
        value = value.get("path", value.get("absolutePath", value.get("preparedPath")))
    if not isinstance(value, str) or not value:
        raise ValueError("Missing reference path")
    path = Path(value)
    resolved = path.resolve() if path.is_absolute() else (prep / path).resolve()
    if path.is_symlink() or not resolved.is_file():
        raise ValueError("Missing or symlinked input: " + str(path))
    return resolved


def png_audit(path, relative):
    """Decode and measure only; never save or re-encode an image."""
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Not a PNG: " + str(path))
    width, height, bits, color, compression, filtering, interlace = struct.unpack(">IIBBBBB", data[16:29])
    with Image.open(path) as image:
        image.verify()
    chunks, position = [], 8
    while position + 12 <= len(data):
        size = struct.unpack(">I", data[position:position + 4])[0]
        kind = data[position + 4:position + 8].decode("ascii")
        if position + 12 + size > len(data):
            raise ValueError("Truncated PNG chunk")
        chunks.append({"type": kind, "bytes": size})
        position += 12 + size
        if kind == "IEND":
            break
    if not chunks or chunks[-1]["type"] != "IEND":
        raise ValueError("Missing PNG IEND")
    with Image.open(path) as image:
        image.load()
        if image.mode != "RGBA" or image.size != (width, height):
            raise ValueError("Native RGBA required: " + str(path))
        alpha = image.getchannel("A")
        histogram, bounds, margins = alpha.histogram(), {}, {}
        for threshold in [1, 8, 32, 128, 240]:
            box = alpha.point(lambda value, t=threshold: 255 if value >= t else 0).getbbox()
            bounds[str(threshold)] = list(box) if box else None
            margins[str(threshold)] = dict(left=box[0], top=box[1], right=width - box[2], bottom=height - box[3]) if box else None
        if not histogram[0] or not bounds["8"] or min(margins["8"].values()) <= 0:
            raise ValueError("Visible body or transparent margin missing: " + str(path))
        edges = {"top": (0, 0, width, 1), "bottom": (0, height - 1, width, height), "left": (0, 0, 1, height), "right": (width - 1, 0, width, height)}
        return {
            "file": relative, "sha256": digest(data), "bytes": len(data), "width": width, "height": height, "mode": image.mode,
            "pngBitDepth": bits, "pngColorType": color, "pngCompressionMethod": compression, "pngFilterMethod": filtering, "pngInterlaceMethod": interlace,
            "pngChunks": chunks, "trailingBytesAfterIend": len(data) - position, "pillowVerifyPassed": True, "alphaExtrema": list(alpha.getextrema()),
            "fullyTransparentPixels": histogram[0], "fullyTransparentFraction": histogram[0] / (width * height), "lowAlphaPixels1to7": sum(histogram[1:8]),
            "boundsAlphaAtLeast": bounds, "marginsAlphaAtLeast": margins, "borderAlphaMaximum": {key: alpha.crop(box).getextrema()[1] for key, box in edges.items()},
            "nativeBytesPreserved": True, "imageEditingPerformed": False, "geometryCertified": False,
        }


def source_records(selection, prep):
    records = list(selection.get("sourceFiles", []))
    for name, fields in [
        ("references/source-index.json", ["sources", "atlases"]),
        ("references/sources.json", ["sources"]),
        ("source-evidence.json", ["sourceFiles"]),
    ]:
        path = prep / name
        if path.exists():
            value = read_json(path)
            if isinstance(value, list):
                records.extend(value)
            else:
                for field in fields:
                    records.extend(value.get(field, []))
    unique = {}
    for record in records:
        relative = safe(record.get("preparedPath", record.get("archivedPath", record.get("path"))))
        normalized = {
            "preparedPath": relative,
            "repositoryPath": safe(record.get("repositoryPath", record.get("sourcePath"))),
            "revision": record.get("revision", record.get("sourceRevision")),
            "gitBlob": record["gitBlob"], "sha256": record["sha256"], "bytes": record["bytes"],
        }
        if relative in unique and unique[relative] != normalized:
            raise ValueError("Conflicting source bindings: " + relative)
        unique[relative] = normalized
    if not unique:
        raise ValueError("No source index")
    return list(unique.values())


def validate_contract(number, target):
    kind, variant = target.get("kind"), target.get("canonicalVariant")
    if variant not in (1, 2) or target.get("painterVariant") != variant:
        raise ValueError("Painter variant must be explicitly 1 or 2")
    if target.get("key") != f"{kind}:v{variant}" or target.get("id") != f"prop:{kind}:v{variant}" or target.get("artId") != target["id"]:
        raise ValueError("Wrong existing-kind variant identity")
    if not target.get("label") or not re.fullmatch(r"[A-Za-z0-9_-]+\.png", target.get("file", "")):
        raise ValueError("Label and safe filename required")
    if target.get("route") != "structural205":
        raise ValueError("Wrong rendering route")
    source, dims = target.get("sourceObject", {}), target.get("dimensions", {})
    if source.get("kind") != kind or source.get("id") != target.get("sourceId"):
        raise ValueError("Exact authored fixture identity required")
    if not target.get("sourcePlanId") or int(target["sourcePlanId"].rsplit("-V", 1)[1]) != target.get("sourcePlanVariant"):
        raise ValueError("Explicit author-plan variant required")
    for a, d in [("w", "w"), ("h", "h"), ("maxHeightM", "heightM")]:
        if source.get(a) != dims.get(d) or dims.get(d) is None:
            raise ValueError("Authored dimensions differ")
    if source.get("depthM") != dims.get("depthM") or not target.get("existingAnalogue"):
        raise ValueError("Depth and existing v0 analogue must remain explicit")


def target_references(number, target, prep):
    references = target.get("referenceFiles", [])
    if not references:
        references = [target[key] for key in ["canonicalReference", "styleReference"] if target.get(key)]
    if not references and target.get("initialReferenceImages"):
        references = [{"path": path, "sha256": digest(absolute(path, prep).read_bytes()),
                       "binding": "normalized-from-original-initial-reference-list",
                       "role": "canonical-source" if index == 0 else "identity-or-material-reference"}
                      for index, path in enumerate(target["initialReferenceImages"])]
    # A correction may intentionally use only the canonical image. All actual
    # references for every earlier call remain bound in generation history.
    minimum = 1
    if len(references) < minimum:
        raise ValueError("An actual SHA-bound canonical reference is required")
    return references


def measure_label(number, target):
    dims = target["dimensions"]
    text = f"{dims['w']} × {dims['h']} m ; hauteur auteur {dims['heightM']} m"
    if dims.get("depthM") is not None:
        text += f" ; profondeur auteur {dims['depthM']} m"
    return text


def verify_coverage(directory, repo, workspace):
    from build_coverage import verify_report
    verify_report(workspace, repo, directory)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--prep", type=Path, required=True)
    parser.add_argument("--pack", type=int, choices=CONTRACTS, required=True)
    parser.add_argument("--date", required=True, help="Explicit YYYY-MM-DD date in Europe/Paris")
    parser.add_argument("--validate-selection", action="store_true", help="Read-only source and selection verification before complete generations exist")
    parser.add_argument("--write", action="store_true", help="Materialize the verified pack after the coordinating agent freezes its inputs")
    parser.add_argument("--coverage-dir", type=Path, help="Root-prepared aggregate files; supported only for Art241")
    args = parser.parse_args()
    repo, prep, number = args.repo.resolve(), args.prep.resolve(), args.pack
    contract = CONTRACTS[number]
    if args.write and args.validate_selection:
        raise ValueError("Selection validation does not write a pack")
    if git(repo, "rev-parse", "HEAD").decode().strip() != BASE or git(repo, "rev-parse", "HEAD^{tree}").decode().strip() != TREE:
        raise ValueError("Checkout must remain at the verified publication base")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.date):
        raise ValueError("Explicit Europe/Paris date required")
    selection = read_json(prep / "selection-and-prompts.json")
    if selection.get("sourceMain", selection.get("sourceBase", selection.get("sourceRevision"))) != SOURCE:
        raise ValueError("Wrong selection source revision")
    targets = {row["key"]: row for row in selection["targets"]}
    if list(targets) != contract["keys"] or len(selection["targets"]) != len(targets):
        raise ValueError("Wrong target order/count or duplicate key")
    if len({target["file"] for target in targets.values()}) != len(targets):
        raise ValueError("Duplicate final filenames")
    output = repo / "art-packs" / f"DEADWALL_Art{number}"
    if output.resolve() != output:
        raise ValueError("Symlinked output not permitted")
    planned, input_to_pack = {}, {}

    def put(relative, data):
        relative = safe(relative)
        if relative in planned and planned[relative] != data:
            raise ValueError("Conflicting pack destination: " + relative)
        planned[relative] = data

    def put_json(relative, value):
        put(relative, json_bytes(value))

    def archive(path, relative):
        if path.is_symlink():
            raise ValueError("Symlinked archived input: " + str(path))
        put(relative, path.read_bytes())
        input_to_pack[str(path.resolve())] = relative

    put("records/assemble_source_packs.py", Path(__file__).read_bytes())
    replay_script = Path(__file__).with_name("root_replay_canonicals.cjs")
    if replay_script.exists():
        put("records/root_replay_canonicals.cjs", replay_script.read_bytes())
    for path in sorted((prep / "references").rglob("*")):
        if path.is_file():
            archive(path, path.relative_to(prep).as_posix())
    for path in sorted(prep.iterdir()):
        if path.is_file() and path.suffix in [".json", ".cjs", ".mjs", ".py", ".md", ".txt", ".html"]:
            archive(path, "records/preparation/" + path.name)
    for dirname in ["generation-records", "generation-inputs", "calls"]:
        folder = prep / dirname
        if folder.exists():
            for path in sorted(folder.rglob("*")):
                if path.is_file():
                    archive(path, "records/" + path.relative_to(prep).as_posix())

    sources = []
    for record in source_records(selection, prep):
        path = prep / record["preparedPath"]
        raw = path.read_bytes()
        if record["revision"] not in {SOURCE, BASE}:
            raise ValueError("Unbound source revision: " + record["preparedPath"])
        native = git(repo, "show", record["revision"] + ":" + record["repositoryPath"])
        if raw != native or record["sha256"] != digest(raw) or record["gitBlob"] != git_blob(raw) or record["bytes"] != len(raw):
            raise ValueError("Changed source bytes: " + record["preparedPath"])
        if str(path.resolve()) not in input_to_pack:
            raise ValueError("Verified source was not archived")
        sources.append({**record, "packPath": input_to_pack[str(path.resolve())], "exactGitBaseBytesVerified": True})

    references, canonical = {}, {}
    for key, target in targets.items():
        validate_contract(number, target)
        references[key] = target_references(number, target, prep)
        for reference in references[key]:
            path = absolute(reference, prep)
            if digest(path.read_bytes()) != reference["sha256"]:
                raise ValueError("Reference bytes differ: " + key)
        canonical[key] = target.get("canonicalReference", references[key][0])
        if isinstance(canonical[key], str):
            matches = [ref for ref in references[key] if absolute(ref, prep) == absolute(canonical[key], prep)]
            if len(matches) != 1:
                raise ValueError("Canonical path must match one SHA-bound reference: " + key)
            canonical[key] = matches[0]
        path = absolute(canonical[key], prep)
        if digest(path.read_bytes()) != canonical[key]["sha256"] or str(path) not in input_to_pack:
            raise ValueError("Unbound canonical reference: " + key)
    if args.validate_selection:
        print(json.dumps({"pack": number, "targets": len(targets), "sourceFiles": len(sources), "selectionVerified": True, "packWritten": False}))
        return

    replay_path = prep / "root-canonical-replay.json"
    replay = read_json(replay_path)
    replay_rows = {row["id"]: row for row in replay["targets"]}
    if replay.get("sourceRevision") != SOURCE or set(replay_rows) != {target["artId"] for target in targets.values()} or len(replay["targets"]) != len(targets):
        raise ValueError("Incomplete independent canonical replay")
    for key, target in targets.items():
        row = replay_rows[target["artId"]]
        if row.get("canonicalSha256") != canonical[key]["sha256"] or row.get("replayedBytesIdentical") is not True:
            raise ValueError("Canonical replay differs: " + key)

    finals_list = read_json(prep / "results.json")
    history = read_json(prep / "history-results.json")
    reviews = read_json(prep / "review.json")
    if not isinstance(finals_list, list) or not isinstance(history, list) or not isinstance(reviews, dict):
        raise ValueError("Generation arrays and a review dictionary are required")
    finals = {row["key"]: row for row in finals_list}
    blocked_path = prep / "blocked-targets.json"
    blocked_list = read_json(blocked_path) if blocked_path.exists() else []
    if isinstance(blocked_list, dict):
        blocked_list = blocked_list.get("targets", blocked_list.get("blockedTargets"))
    if not isinstance(blocked_list, list):
        raise ValueError("Blocked targets must be a list")
    blocked = {row["key"]: row for row in blocked_list}
    if len(finals_list) != len(finals) or len(blocked_list) != len(blocked) or set(finals) & set(blocked) or set(finals) | set(blocked) != set(targets) or set(reviews) != set(finals):
        raise ValueError("Every planned target must have exactly one accepted final or explicit block, and only accepted finals may have an acceptance review")
    normalized_blocks, failure_receipts = [], []
    for key in contract["keys"]:
        if key not in blocked:
            continue
        row = blocked[key]
        if row.get("id") != targets[key]["id"] or row.get("artId") != targets[key]["artId"] or row.get("status") not in ["blocked-no-image", "blocked-no-accepted-image"] or not row.get("reason") or not row.get("failureReceipts"):
            raise ValueError("Incomplete blocked-target identity or real failure evidence: " + key)
        receipts = []
        for record in row["failureReceipts"]:
            path = absolute(record, prep)
            sha = digest(path.read_bytes())
            if not isinstance(record, dict) or record.get("sha256") != sha:
                raise ValueError("Failure receipt must be SHA-bound: " + key)
            if str(path) not in input_to_pack:
                archive(path, "records/failures/" + key + "/" + path.name)
            normalized = {**record, "path": input_to_pack[str(path)], "sha256": sha, "bytes": path.stat().st_size}
            receipts.append(normalized)
            failure_receipts.append({"key": key, "id": targets[key]["id"], **normalized})
        if row.get("attemptCount", len(receipts)) != len(receipts):
            raise ValueError("Failure count differs from the archived evidence: " + key)
        normalized_blocks.append({**row, "failureReceipts": receipts, "acceptedImage": None, "acceptanceReview": None})

    def fingerprint(row):
        key = row["key"]
        if key not in targets or any(row.get(field) != targets[key][field] for field in ["id", "artId", "file"]):
            raise ValueError("Unselected or conflicting generated identity")
        if row.get("promptIsVerbatim") is not True or row.get("transparentBackgroundRequested") is not True or not row.get("prompt"):
            raise ValueError("Exact prompt and actual transparent-background request are required")
        if type(row.get("iteration")) is not int or row["iteration"] < 1:
            raise ValueError("Bad generation iteration")
        if key in blocked and blocked[key]["status"] == "blocked-no-image":
            raise ValueError("A no-image block cannot contain a generated PNG: " + key)
        path = absolute(row["generatedSourcePath"], prep)
        data = path.read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError("Native PNG output required")
        if row.get("sha256", digest(data)) != digest(data):
            raise ValueError("Recorded native-output SHA differs: " + key)
        refs = tuple(digest(absolute(reference, prep).read_bytes()) for reference in row.get("referenceImages", []))
        if not refs:
            raise ValueError("Missing actual image references")
        if row["iteration"] == 1 and targets[key].get("initialReferenceImages"):
            initial = tuple(digest(absolute(reference, prep).read_bytes()) for reference in targets[key]["initialReferenceImages"])
            if refs != initial or row["prompt"] != targets[key].get("initialPrompt", row["prompt"]):
                raise ValueError("Initial-generation source record differs: " + key)
        return key, row["iteration"], digest(data), row["prompt"], refs

    selected = {key: fingerprint(row) for key, row in finals.items()}
    for key, value in selected.items():
        if targets[key].get("selectedSha256", value[2]) != value[2] or targets[key].get("selectedIteration", value[1]) != value[1]:
            raise ValueError("Frozen selection differs from the accepted output: " + key)
    independent_review = prep / "root-review.json"
    if independent_review.exists():
        root_review = read_json(independent_review)
        if isinstance(root_review, dict) and "sha256" in root_review:
            if len(selected) != 1 or root_review.get("sha256") != next(iter(selected.values()))[2] or root_review.get("decision") not in ["accepted_source_art_proposal", "accepted-source-art-proposal"]:
                raise ValueError("Independent root review differs from the selected image")
        elif isinstance(root_review, dict):
            if set(root_review) != set(selected):
                raise ValueError("Independent root review keys differ from the accepted finals")
            for key, review in root_review.items():
                if review.get("sha256") != selected[key][2] or review.get("iteration", selected[key][1]) != selected[key][1] or review.get("decision") not in ["accepted_source_art_proposal", "accepted-source-art-proposal"]:
                    raise ValueError("Independent root review differs: " + key)
    seen, generations = {}, []
    for row in [*history, *finals_list]:
        fingerprint_value = fingerprint(row)
        token = fingerprint_value[:2]
        key, iteration = token
        if token in seen:
            if seen[token] != fingerprint_value:
                raise ValueError("Conflicting generation record")
            continue
        seen[token] = fingerprint_value
        path = absolute(row["generatedSourcePath"], prep)
        chosen = fingerprint_value == selected.get(key)
        relative = f"assets/art{number}/{contract['directory']}/{targets[key]['file']}" if chosen else f"references/iterations/{key.replace(chr(58), chr(95))}-iteration-{iteration:02d}.png"
        archive(path, relative)
        generations.append({"row": row, "path": relative, "sha256": fingerprint_value[2], "bytes": path.stat().st_size, "selected": chosen})
    for key in targets:
        iterations = sorted(token[1] for token in seen if token[0] == key)
        if iterations and iterations != list(range(1, max(iterations) + 1)):
            raise ValueError("Generation history has a gap: " + key)
    if not finals:
        if args.write:
            raise ValueError("No accepted native output: preserve the preparation/backlog directory; no delivered art pack will be created")
        print(json.dumps({"pack": number, "status": "preparation_backlog_only", "plannedTargetCount": len(targets), "finalSpriteCount": 0,
                          "blockedTargetCount": len(blocked), "failureReceiptCount": len(failure_receipts), "verifiedSourceFiles": len(sources), "packWritten": False}))
        return

    image_by_hash = {}
    for relative, data in planned.items():
        if Path(relative).suffix.lower() in [".png", ".webp", ".jpg", ".jpeg"]:
            image_by_hash.setdefault(digest(data), relative)
    # An edit may legitimately reference a preceding native generation. Resolve
    # its archived destination only after all actual outputs are preserved.
    for key, rows in references.items():
        for reference in rows:
            path = absolute(reference, prep)
            sha = digest(path.read_bytes())
            relative = input_to_pack.get(str(path), image_by_hash.get(sha))
            if not relative or digest(planned[relative]) != sha:
                raise ValueError("Actual target reference is absent from retained sources/history: " + key)
            input_to_pack[str(path)] = relative
    normalized = []
    for generation in sorted(generations, key=lambda item: (contract["keys"].index(item["row"]["key"]), item["row"]["iteration"])):
        row, refs = generation["row"], []
        for original in row["referenceImages"]:
            path = absolute(original, prep)
            sha = digest(path.read_bytes())
            relative = input_to_pack.get(str(path), image_by_hash.get(sha))
            if not relative or digest(planned[relative]) != sha:
                raise ValueError("Actual generation reference is missing: " + str(path))
            refs.append({"path": relative, "sha256": sha})
        normalized.append({
            "key": row["key"], "kind": targets[row["key"]]["kind"], "id": row["id"], "artId": row["artId"], "label": targets[row["key"]]["label"],
            "iteration": row["iteration"], "prompt": row["prompt"], "promptIsVerbatim": True, "generator": row.get("generator", "OpenAI built-in ImageGen"),
            "transparentBackgroundRequested": True, "referenceImages": refs, "output": generation["path"], "sha256": generation["sha256"], "bytes": generation["bytes"],
            "selected": generation["selected"], "nativeBytesPreserved": True,
            **({"editReason": row["editReason"]} if row.get("editReason") else {}),
        })

    assets, audits, source_map = [], [], []
    for key, target in targets.items():
        canonical_path = absolute(canonical[key], prep)
        mapping = {
            "key": key, "id": target["artId"], "kind": target["kind"], "name": target["label"], "sourceRevision": SOURCE,
            "canonicalReference": {"path": input_to_pack[str(canonical_path)], "sha256": digest(canonical_path.read_bytes())},
            "canonicalReplay": replay_rows[target["artId"]],
            "deliveryStatus": "accepted-source-art-proposal" if key in finals else blocked[key]["status"],
            "runtimeIntegrationPerformed": False, "newGameplayPlacementCreated": False,
        }
        for field in ["route", "sourceId", "sourcePlanId", "sourceType", "sourceObject", "dimensions", "nativeSpec", "canonicalVariant", "painterVariant", "sourcePlanVariant", "variant", "phase", "motion", "existingState", "sourceStatus", "existingAnalogue", "geometryOwner", "renderOwner", "stateOwner", "runtimeOwner", "runtimeIdentity", "sourceRecipe", "profile", "supportParts", "mechanismParts", "sourceContract", "geometryContract", "identityContract", "identityMeaning", "intendedPhases", "excludedPhase", "sharedProfiles", "camera", "metricDimensions"]:
            if field in target:
                mapping[field] = target[field]
        mapping["referenceFiles"] = [{**reference, "path": input_to_pack[str(absolute(reference, prep))]} for reference in references[key]]
        source_map.append(mapping)
        if key not in finals:
            continue
        row, review = finals[key], reviews[key]
        path = absolute(row["generatedSourcePath"], prep)
        data, sha = path.read_bytes(), digest(path.read_bytes())
        if review.get("sha256") != sha or not review.get("observation") or review.get("decision") not in ["accepted_source_art_proposal", "accepted-source-art-proposal"]:
            raise ValueError("Missing accepted SHA-bound visual review: " + key)
        relative = f"assets/art{number}/{contract['directory']}/{target['file']}"
        audits.append(png_audit(path, relative))
        asset = {
            "key": key, "id": target["artId"], "artId": target["artId"], "kind": target["kind"], "name": target["label"], "path": relative,
            "sha256": sha, "bytes": len(data), "iteration": row["iteration"], "status": "dedicated_source_art_proposal_not_runtime_integrated",
        }
        for source_field, output_field in [
            ("route", "existingRoute"), ("canonicalVariant", "canonicalVariant"), ("painterVariant", "painterVariant"), ("sourcePlanVariant", "sourcePlanVariant"), ("variant", "canonicalVariant"),
            ("phase", "phase"), ("motion", "motion"), ("dimensions", "dimensionsAuthorDesignMetres"), ("nativeSpec", "nativeSourceSpecification"),
            ("sourceId", "sourceId"), ("sourcePlanId", "sourcePlanId"), ("geometryOwner", "geometryOwner"), ("renderOwner", "renderOwner"), ("stateOwner", "stateOwner"),
        ]:
            if source_field in target:
                asset[output_field] = target[source_field]
        assets.append(asset)
    if len({asset["sha256"] for asset in assets}) != len(assets):
        raise ValueError("Duplicate final sprite bytes")
    source_by_key = {row["key"]: row for row in source_map}

    put_json("references/verified-sources.json", sources)
    put_json("references/SOURCE_MAP.json", source_map)
    put_json("generation-history.json", normalized)
    put_json("generation-prompts.json", normalized)
    if blocked:
        put_json("generation-failures.json", failure_receipts)
        put_json("backlog/blocked-targets.json", normalized_blocks)
    put_json("qa/visual-review-records.json", reviews)
    put_json("qa/image-audit.json", {
        "pack": f"Art{number}", "checkedOn": args.date, "timezone": "Europe/Paris",
        "method": "Read-only PNG decode, chunk inventory, RGBA histogram, alpha thresholds and SHA256.", "alphaThresholds": [1, 8, 32, 128, 240],
        "alphaInterpretation": "Transparent pixels and alpha 1–7 are recorded separately. Visible margins at alpha>=8 do not imply zero alpha everywhere and do not certify source geometry.", "assets": audits,
    })
    visual = [f"# Art{number} — Revue visuelle", "", f"Revue du {args.date}, liée aux SHA256 des PNG natifs.", "", "| Identité de proposition | Observation |", "|---|---|"]
    visual.extend(f"| `{targets[key]['artId']}` | {reviews[key]['observation'].replace('|', '/')} |" for key in targets if key in finals)
    if blocked:
        visual.extend(["", f"{len(blocked)} cible(s) bloquée(s) restent documentées dans `backlog/blocked-targets.json` ; elles ne possèdent aucune revue d’acceptation."])
    visual.extend(["", "La revue visuelle ne certifie ni fidélité métrique 1:1, ni identité pixel pour pixel, ni intégration moteur. Les dimensions, lorsqu’elles sont déclarées, proviennent des choix auteur exacts.", ""])
    put("qa/visual-review.md", "\n".join(visual).encode())

    coverage = None
    if args.coverage_dir:
        if number != 241:
            raise ValueError("Aggregate coverage belongs only to Art241")
        verify_coverage(args.coverage_dir.resolve(), repo, prep.parent)
        put("records/build_coverage.py", Path(__file__).with_name("build_coverage.py").read_bytes())
        coverage = {}
        for path in sorted(args.coverage_dir.rglob("*")):
            if path.is_file():
                relative = "coverage/" + path.relative_to(args.coverage_dir).as_posix()
                archive(path, relative)
                coverage[relative] = digest(path.read_bytes())
        if not coverage:
            raise ValueError("Empty aggregate coverage directory")

    superseded = len(normalized) - len(assets)
    title = contract["title"] + (f" — {len(assets)} proposition(s) retenue(s) sur {len(targets)} cibles" if blocked else "")
    delivery_status = "partial-source-art-proposals" if blocked else "accepted-source-art-proposals"
    put_json("PROVENANCE.json", {
        "schemaVersion": 2, "project": "DEADWALL — Last Enclosure", "batch": f"Art{number}", "title": title,
        "assembledOn": args.date, "timezone": "Europe/Paris", "referenceRepository": REPOSITORY, "publicationBaseRevision": BASE, "publicationBaseTree": TREE, "runtimeSourceRevision": SOURCE,
        "publicationBaseIsOutputCommit": False, "identityPolicy": contract["identityPolicy"], "scope": contract["scope"],
        "deliveryStatus": delivery_status, "plannedTargetCount": len(targets), "plannedArtIds": [target["artId"] for target in targets.values()],
        "finalSpriteCount": len(assets), "generationCount": len(normalized), "supersededCandidateCount": superseded,
        "blockedTargetCount": len(blocked), "blockedArtIds": [targets[key]["artId"] for key in targets if key in blocked],
        "failureReceiptCount": len(failure_receipts), "blockedTargetRecords": "backlog/blocked-targets.json" if blocked else None,
        "generationFailureRecords": "generation-failures.json" if blocked else None,
        "nativeOutputBytesPreserved": True, "imageEditingResizingCroppingPerformed": False, "geometryBasis": contract["geometryBasis"],
        "integration": {"performed": False, "runtimeSourceChanged": False, "runtimeAssetRegistrationChanged": False, "testsChanged": False, "newWorldPlacementCreated": False, "saveOrWorldIdentityChanged": False},
        "fidelity": {
            "reviewed": ["canonical source layout", "existing object identity and components", "selected source presentation", "native PNG and transparency", "exact references and prompt history"],
            "notCertified": ["metric or pixel-for-pixel 1:1 fidelity", "generated-sprite metres per pixel", "runtime anchors and collision alignment", "unseen variants, phases or rotations"],
        },
        "sourcesIndex": "references/verified-sources.json", "sourceMapping": "references/SOURCE_MAP.json", "generationHistory": "generation-history.json",
        "canonicalReplay": "records/preparation/root-canonical-replay.json", "canonicalReplayScript": "records/root_replay_canonicals.cjs" if replay_script.exists() else None,
        "technicalAudit": "qa/image-audit.json", "visualReview": "qa/visual-review.md",
        "independentVisualReview": "records/preparation/root-review.json" if independent_review.exists() else None, "gallery": "gallery.html", "aggregateCoverage": coverage,
        "validation": {"packTechnicalAudit": "passed", "runtimeTests": "not_run_by_assembler", "browser": "not_run_by_assembler"}, "assets": assets,
    })
    put_json("REPRISE.json", {
        "schemaVersion": 2, "batch": f"Art{number}", "savedOn": args.date, "publicationBaseRevision": BASE,
        "completedArtIds": [asset["id"] for asset in assets], "finalAssets": assets, "supersededCandidates": superseded, "priorPacksRegenerated": False,
        "deliveryStatus": delivery_status, "plannedArtIds": [target["artId"] for target in targets.values()], "blockedTargets": normalized_blocks,
        "publicationStatusAtAssembly": "prepared_locally_not_published_by_assembler", "runtimeIntegrationPerformed": False,
        "remainingWork": contract["remainingWork"] + (["Retain blocked targets and their exact failure receipts as backlog; no replacement image or acceptance review is implied."] if blocked else []),
    })
    table = "\n".join(f"| `{asset['id']}` | {asset['name']} | {measure_label(number, targets[asset['key']])} |" for asset in assets)
    previews = "\n\n".join(
        f"### {asset['name']}\n\n`{asset['id']}`\n\n| Référence canonique existante | Proposition source retenue |\n|---|---|\n| ![Référence {asset['kind']}]({source_by_key[asset['key']]['canonicalReference']['path']}) | ![{asset['name']}]({asset['path']}) |"
        for asset in assets
    )
    backlog_summary = ""
    backlog_section = ""
    failed_calls_content = ""
    if blocked:
        backlog_summary = f"\n**Livraison partielle : {len(assets)} proposition(s) acceptée(s), {len(blocked)} cible(s) bloquée(s), sur {len(targets)} cibles prévues.** Les {len(failure_receipts)} reçus d’échec sont conservés ; une cible bloquée ne reçoit aucune image de substitution ni revue d’acceptation.\n"
        rows = "\n".join(f"| `{row['id']}` | {row['reason'].replace('|', '/')} | [Référence canonique]({source_by_key[row['key']]['canonicalReference']['path']}) |" for row in normalized_blocks)
        backlog_section = "\n## Cibles bloquées — backlog\n\nLes sources et références des cibles prévues restent conservées. Les états exacts et reçus SHA figurent dans `backlog/blocked-targets.json` et `generation-failures.json`.\n\n| Identité prévue | Blocage constaté | Source conservée |\n|---|---|---|\n" + rows + "\n"
        failed_calls_content = f"\n- `generation-failures.json`, `records/preparation/generation-prompts.json` et `records/calls/` : les {len(failure_receipts)} reçus de blocage ou de refus et les prompts effectivement envoyés sont archivés séparément. Seules les sorties PNG effectivement produites sont comptées dans l’historique ; un reçu ne constitue pas une image."
    readme = f"""# DEADWALL — Art{number} : {title}

**{len(assets)} PNG finaux et {superseded} sortie(s) remplacée(s)** sont conservés dans leurs octets natifs, avec les prompts effectivement envoyés, les références exactes, l’historique et les empreintes SHA256.
{backlog_summary}

| Identité de proposition | Sujet | Géométrie déclarée par la source |
|---|---|---|
{table}

## Sources et périmètre

Base de publication : `{BASE}` ; arbre Git : `{TREE}`. Sources du moteur inchangées depuis `{SOURCE}`.

{contract['scopeFr']}

{contract['geometryFr']}

## Contrôles et contenu

- `assets/art{number}/{contract['directory']}/` : images finales natives, sans réencodage.
- `references/iterations/` : sorties remplacées lorsqu’une correction a été nécessaire.
- `references/` : références canoniques, images réellement fournies et sources vérifiées contre Git.
- `generation-history.json` : chaque prompt ayant produit un PNG, ses références exactes et sa sortie retenue ou remplacée.{failed_calls_content}
- `records/` : préparation originale et reçus, notamment le rejeu indépendant des références canoniques.
- `qa/` : revue liée au SHA256, décodage PNG, chunks, dimensions de fichier et mesures alpha.
- `gallery.html` : comparaisons canoniques/finales avec les fichiers natifs liés directement.
- `SHA256SUMS.txt` : tous les fichiers du pack, hors manifeste lui-même.

Les pixels d’alpha très faible sont mesurés séparément. Des marges autour du corps visible n’impliquent pas un alpha strictement nul partout autour du sujet. Les métadonnées natives restent préservées par copie exacte des octets.

**Propositions source uniquement.** La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée. Échelle, ancrage, orientation, clipping et apparence en jeu restent à qualifier lors d’une intégration distincte. L’assembleur ne modifie aucune source du moteur, sauvegarde, identité, collision, dépendance ou test.

## Comparaison visuelle

{previews}
{backlog_section}
"""
    put("README.md", readme.rstrip().encode() + b"\n")
    cards = []
    for asset in assets:
        key = asset["key"]
        escape = lambda value: html.escape(str(value), quote=True)
        canonical_url = escape(source_by_key[key]["canonicalReference"]["path"])
        cards.append(f"""<article><h2>{escape(asset['name'])}</h2><p><code>{escape(asset['id'])}</code></p><p>{escape(measure_label(number, targets[key]))}</p><div class="pair"><figure><a href="{canonical_url}"><img loading="lazy" src="{canonical_url}" alt="Référence canonique — {escape(asset['name'])}"></a><figcaption>Référence canonique existante</figcaption></figure><figure><a href="{escape(asset['path'])}"><img loading="lazy" src="{escape(asset['path'])}" alt="Proposition source — {escape(asset['name'])}"></a><figcaption>Proposition retenue · itération {asset['iteration']}</figcaption></figure></div><p>{escape(reviews[key]['observation'])}</p><p class="hash">SHA256 : {asset['sha256']}</p></article>""")
    blocked_cards = []
    for row in normalized_blocks:
        key = row["key"]
        canonical_url = html.escape(source_by_key[key]["canonicalReference"]["path"], quote=True)
        blocked_cards.append(f"<article><h2>{html.escape(targets[key]['label'])} — bloqué</h2><p><code>{html.escape(row['id'])}</code></p><p>{html.escape(row['reason'])}</p><p>Aucune proposition acceptée. <a href='{canonical_url}'>Référence canonique conservée</a> · <a href='backlog/blocked-targets.json'>Reçus et backlog</a></p></article>")
    gallery = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEADWALL — Art{number}</title><style>body{{margin:0;background:#181c19;color:#e9e9dd;font:16px/1.55 system-ui,sans-serif}}main{{max-width:1320px;margin:auto;padding:32px 22px}}h1{{line-height:1.15}}a{{color:#c6dbaa}}article{{padding:24px 0;border-top:1px solid #4e594a}}.pair{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}figure{{margin:0}}figure a{{display:block;background-color:#73786b;background-image:linear-gradient(45deg,#888d7d 25%,transparent 25%),linear-gradient(-45deg,#888d7d 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#888d7d 75%),linear-gradient(-45deg,transparent 75%,#888d7d 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}}img{{display:block;width:100%;height:420px;object-fit:contain}}figcaption{{padding:8px 0}}.hash{{overflow-wrap:anywhere;font:12px/1.5 monospace}}code{{color:#cbd6b6}}@media(max-width:700px){{.pair{{grid-template-columns:1fr}}img{{height:340px}}}}</style></head><body><main><h1>Art{number} — {html.escape(title)}</h1><p>{len(assets)} proposition(s) source acceptée(s) sur {len(targets)} cible(s) prévue(s) ; {len(blocked)} cible(s) bloquée(s). {html.escape(contract['scopeFr'])}</p><p>{html.escape(contract['geometryFr'])}</p><p>Les images affichées sont les fichiers natifs ; le navigateur adapte seulement leur présentation. Cliquer ouvre le PNG original. Les cadres d’affichage ne définissent aucune échelle commune ou métrique.</p><p><a href="README.md">Documentation</a> · <a href="PROVENANCE.json">Provenance</a> · <a href="SHA256SUMS.txt">Manifeste SHA256</a></p>{''.join(cards)}{''.join(blocked_cards)}</main></body></html>"""
    put("gallery.html", gallery.encode())
    manifest = "".join(f"{digest(data)}  {relative}\n" for relative, data in sorted(planned.items()))
    put("SHA256SUMS.txt", manifest.encode())

    existing = {}
    if output.exists():
        for path in output.rglob("*"):
            if path.is_symlink():
                raise ValueError("Symlink in existing pack")
            if path.is_file():
                existing[path.relative_to(output).as_posix()] = path.read_bytes()
        if existing != planned:
            raise ValueError("Refusing to overwrite a different assembled pack")
    written = False
    if args.write and not output.exists():
        for relative, data in planned.items():
            path = output / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        written = True
    print(json.dumps({
        "pack": number, "plannedTargetCount": len(targets), "finalSpriteCount": len(assets), "blockedTargetCount": len(blocked), "failureReceiptCount": len(failure_receipts),
        "generationCount": len(normalized), "supersededCandidateCount": superseded,
        "verifiedSourceFiles": len(sources), "files": len(planned), "bytes": sum(map(len, planned.values())),
        "manifestSha256": digest(planned["SHA256SUMS.txt"]), "output": str(output), "writeRequested": args.write, "written": written,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
