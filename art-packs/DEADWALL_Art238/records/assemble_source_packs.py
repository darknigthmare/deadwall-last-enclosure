#!/usr/bin/env python3
"""Archive source-art proposals without changing any image bytes.

Three deliberately separate source contracts are supported: an inert survivor
body, mounted defense mechanisms, and structural205 props.  The default mode
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


BASE = "12e0aa4aa77b9901bd53eb7a8771382a5f753593"
TREE = "663ad5750e49ae401fc0b46bfdebc28942ad1617"
REPOSITORY = "darknigthmare/deadwall-last-enclosure"
CONTRACTS = {
    236: {
        "keys": ["survivor-inert-body"],
        "directory": "actors",
        "title": "Dépouille inerte du survivant",
        "identityPolicy": "succession:body is a source-art identifier; the survivor-inert kind is descriptive and creates no runtime type or saved identity.",
        "scope": "One source sprite for the existing inert shared-survivor body, which already has a visible Canvas fallback. Living Art137 prone art remains a material and identity reference.",
        "geometryBasis": "The exact existing succession133 depth-entry fallback at angle zero. Its schematic geometry is not an anatomical or metric measurement. The canonical fallback retains its original ground mark; the proposed body sprite excludes that mark.",
        "scopeFr": "La dépouille inerte possède déjà un rendu Canvas visible. Cette proposition apporte un sprite dédié au corps ; Art137 prone représente un vivant et sert de référence d’identité et de matières. Le fallback canonique conserve sa marque de sol d’origine, alors que la proposition représente le corps seul.",
        "geometryFr": "La référence vient de l’entrée de profondeur réelle de succession133, à angle nul. Ses formes schématiques n’établissent ni une taille anatomique, ni un pivot raster métrique. Les états vivant, relevé ou infecté ne sont pas couverts.",
        "remainingWork": [
            "Review the selected inert body against the exact succession133 source fixture before registration.",
            "Qualify scale, pivot, depth ordering, rotations and clipping in a separate runtime-integration change.",
            "Preserve the existing death, remains, loot and reanimation state owners.",
            "Keep the canonical ground mark distinct from the body-only source sprite.",
        ],
    },
    237: {
        "keys": ["runnerCable193", "breachClamp193", "enduranceRack193", "shieldTongs193", "quickCable193", "siegeBrake193"],
        "directory": "mechanisms",
        "title": "Mécanismes spécialisés montés",
        "identityPolicy": "mechanism:<kind>:v0:armed-mounted is a descriptive source-art identifier. The existing mechanism kind remains its runtime identity; no saved identifier is assigned.",
        "scope": "Planned source scope covers six existing specialized mechanisms mounted on their Hérisson support; delivered and blocked counts are recorded separately. Only accepted native image outputs count as delivered proposals. Art159 shared atlas parts and Canvas193 hardware already render these mechanisms and their animated states.",
        "geometryBasis": "Unmodified exported drawSpikes and drawMechanism at variant 0 and armed phase. The support footprint is 1 x 1 author-design metres; no mechanism-specific authored height is available or inferred.",
        "scopeFr": "Les six mécanismes existent déjà, avec leurs pièces d’atlas Art159, leurs ajouts Canvas193 et leurs animations. Chaque proposition statique représente l’assemblage armé sur son support Hérisson. Les identifiants du pack décrivent les images ; la clé runtime du mécanisme reste inchangée.",
        "geometryFr": "Les références utilisent drawSpikes puis drawMechanism, variante 0, phase armée et mouvement nul. L’emprise auteur du support est de 1 × 1 m. Aucune hauteur propre au mécanisme n’est déclarée ; aucune hauteur n’est déduite. Les phases actives et les autres variantes ne sont pas couvertes.",
        "remainingWork": [
            "Review every mounted proposal against its exact support and mechanism source fixture.",
            "Keep support geometry, mechanism state and animation ownership separate.",
            "Qualify pivot, scale, clipping and animation strategy before any separate runtime registration.",
            "Do not treat a static armed assembly as all phases, orientations or variants.",
        ],
    },
    238: {
        "keys": ["fence", "garden-shed", "rain-barrel", "compost-bin", "closed-pool"],
        "directory": "props",
        "title": "Structures et équipements de parcelles",
        "identityPolicy": "prop:<kind>:v0 denotes the selected source-art proposal. Exact existing author-plan instance IDs are preserved separately; no DW or world identity is reassigned.",
        "scope": "Five dedicated structural205 source proposals for exact existing author-plan instances. Related generic images already exist in Art153, Art157 and Art158; this pack does not claim absence of all analogous images.",
        "geometryBasis": "Unmodified exported drawProp delegates to private drawPropBase for exact author-plan fixtures, variant 0, stateAlpha false and no live game argument. Authored dimensions are design choices, not manufacturer measurements.",
        "scopeFr": "Les cinq objets possèdent déjà un rendu structural205. Des images analogues existent dans Art153, Art157 ou Art158 et sont documentées par cible. Ces propositions concernent les instances auteur choisies ; elles ne certifient pas une absence de toute image analogue.",
        "geometryFr": "Les références utilisent drawProp, qui délègue à drawPropBase privé, avec les dimensions des instances auteur exactes, la variante 0 et stateAlpha:false, sans objet game. Les surimpressions de service et d’eau sont inactives. Une instance ne représente pas toutes les dimensions de sa famille.",
        "remainingWork": [
            "Review proposals against the exact selected author-plan instances before registration.",
            "Qualify scale, anchors, orientation and clipping in a separate runtime-integration change.",
            "Preserve existing service, water, collision and world-placement owners.",
            "Do not extrapolate the selected v0 fixtures to every family instance or rotation.",
        ],
    },
}


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
    key = target["key"]
    if target.get("id") != target.get("artId") or not target.get("label"):
        raise ValueError("Explicit matching source-art id/artId and label required")
    filename = target.get("file", "")
    if not re.fullmatch(r"[A-Za-z0-9_-]+\.png", filename):
        raise ValueError("Unsafe final filename")
    if number == 236:
        if target.get("kind") != "survivor-inert" or target["artId"] != "succession:body" or filename != "survivor_inert_body.png":
            raise ValueError("Wrong inert-body source-art identity")
        if target.get("dimensions", {}).get("authority") == "manufacturer":
            raise ValueError("The fallback does not certify anatomical dimensions")
    elif number == 237:
        if target.get("kind") != key or target["artId"] != f"mechanism:{key}:v0:armed-mounted":
            raise ValueError("Wrong descriptive mechanism identity")
        if target.get("route") != "art159-canvas193-mounted-source" or target.get("variant") != 0 or target.get("phase") != "armed" or target.get("motion") != 0:
            raise ValueError("Wrong mounted mechanism route or presentation")
        spec = target.get("nativeSpec", {})
        if spec.get("supportKind") != "spikes" or spec.get("footprintMetres") != [1, 1] or spec.get("heightMetres") is not None or not spec.get("heightReason"):
            raise ValueError("Wrong mechanism support geometry or inferred height")
        if not all(target.get(field) for field in ["geometryOwner", "renderOwner", "stateOwner"]):
            raise ValueError("Separate mechanism owners are required")
        if target.get("runtimeIdentity", key) != key:
            raise ValueError("Mechanism runtime key was reassigned")
    else:
        if target.get("kind") != key or target["artId"] != f"prop:{key}:v0" or target.get("route") != "structural205" or target.get("canonicalVariant") != 0:
            raise ValueError("Wrong structural205 source-art contract")
        source, dimensions = target.get("sourceObject", {}), target.get("dimensions", {})
        if source.get("kind") != key or source.get("id") != target.get("sourceId") or not target.get("sourcePlanId"):
            raise ValueError("Exact author-plan source instance required")
        for authored, dimension in [("w", "w"), ("h", "h"), ("maxHeightM", "heightM")]:
            if source.get(authored) != dimensions.get(dimension) or dimensions.get(dimension) is None:
                raise ValueError("Authored fixture dimensions differ: " + key)
        if source.get("depthM") != dimensions.get("depthM"):
            raise ValueError("Authored depth differs")
        if not target.get("existingAnalogue"):
            raise ValueError("Existing analogous graphics must be acknowledged")


def target_references(number, target, prep):
    references = target.get("referenceFiles", [])
    if not references:
        references = [target[key] for key in ["canonicalReference", "styleReference"] if target.get(key)]
    if not references and target.get("initialReferenceImages"):
        references = [{"path": path, "sha256": digest(absolute(path, prep).read_bytes()),
                       "binding": "normalized-from-original-initial-reference-list",
                       "role": "canonical-source" if index == 0 else "identity-or-material-reference"}
                      for index, path in enumerate(target["initialReferenceImages"])]
    minimum = 1 if number == 237 else 2
    if len(references) < minimum:
        raise ValueError("Actual canonical and, where applicable, identity/material reference bindings are required")
    return references


def measure_label(number, target):
    if number == 236:
        return "Schéma du corps ; aucune cote anatomique certifiée"
    if number == 237:
        return "Support auteur 1 × 1 m ; hauteur du mécanisme non déclarée"
    dims = target["dimensions"]
    text = f"{dims['w']} × {dims['h']} m ; hauteur auteur {dims['heightM']} m"
    if dims.get("depthM") is not None:
        text += f" ; profondeur auteur {dims['depthM']} m"
    return text


def verify_coverage(directory, repo, workspace):
    """Bind the cumulative report to real previous and newly selected bytes."""
    report = read_json(directory / "coverage-art222-238.json")
    previous_raw = (directory / "prior-coverage-art222-235.json").read_bytes()
    prior_path = "art-packs/DEADWALL_Art235/coverage/coverage-art222-235.json"
    if previous_raw != git(repo, "show", BASE + ":" + prior_path):
        raise ValueError("Archived prior coverage differs from the verified main")
    previous = json.loads(previous_raw)
    rows, prior_rows = report["assets"], previous["assets"]
    if report.get("sourceMainRevision") != BASE or report.get("ownManifestSha256Included") is not False or report.get("ownOutputCommitShaIncluded") is not False:
        raise ValueError("Wrong or self-referential cumulative coverage")
    if len(rows) != report["finalSpriteCount"] or len({row["id"] for row in rows}) != len(rows) or len({row["sha256"] for row in rows}) != len(rows):
        raise ValueError("Duplicate or miscounted cumulative finals")
    if [row["id"] for row in rows[:len(prior_rows)]] != [row["id"] for row in prior_rows]:
        raise ValueError("Prior coverage order or identity changed")
    by_id = {row["id"]: row for row in rows}
    for previous_row in prior_rows:
        row = by_id[previous_row["id"]]
        if any(row.get(key) != value for key, value in previous_row.items()):
            raise ValueError("Prior coverage metadata changed: " + row["id"])
        raw = (repo / safe(row["repositoryAssetPath"])).read_bytes()
        if digest(raw) != row["sha256"] or len(raw) != row["bytes"]:
            raise ValueError("Prior physical final differs: " + row["id"])
    expected, history_count, expected_blocks = {}, 0, []
    for number in [236, 237, 238]:
        prep = workspace / f"art{number}-prep"
        selected = read_json(prep / "selection-and-prompts.json")
        targets = {row["key"]: row for row in selected["targets"]}
        results, history = read_json(prep / "results.json"), read_json(prep / "history-results.json")
        reviews = read_json(prep / "review.json")
        history_count += len(history)
        blockfile = prep / "blocked-targets.json"
        blocks = read_json(blockfile) if blockfile.exists() else []
        if not isinstance(blocks, list):
            raise ValueError("Unexpected frozen blocked-target format")
        expected_blocks.extend(row["id"] for row in blocks)
        counts = report["newGenerationCounts"][str(number)]
        if counts["selectedTargets"] != len(targets) or counts["final"] != len(results) or counts["generatedOutputs"] != len(history) or counts["backlogTargetsWithZeroFinalPng"] != len(blocks):
            raise ValueError("Coverage counts differ from frozen preparation: " + str(number))
        for result in results:
            target = targets[result["key"]]
            raw = absolute(result["generatedSourcePath"], prep).read_bytes()
            sha, byte_count = digest(raw), len(raw)
            if result["artId"] != target["artId"] or reviews[result["key"]]["sha256"] != sha:
                raise ValueError("Frozen selection differs from coverage inputs")
            relative = f"art-packs/DEADWALL_Art{number}/assets/art{number}/{CONTRACTS[number]['directory']}/{target['file']}"
            expected[target["artId"]] = (sha, byte_count, relative)
            written = repo / relative
            if written.exists() and written.read_bytes() != raw:
                raise ValueError("Assembled sibling PNG differs from the frozen native output")
    new_rows = [row for row in rows if row["batch"] in ["Art236", "Art237", "Art238"]]
    actual = {row["id"]: (row["sha256"], row["bytes"], row["repositoryAssetPath"]) for row in new_rows}
    if actual != expected or report["newFinalSpriteCount"] != len(expected) or report["previousFinalSpriteCount"] != len(prior_rows):
        raise ValueError("Cumulative new finals differ from the real frozen outputs")
    if report["totalFinalPngBytes"] != sum(row["bytes"] for row in rows) or report["newFinalPngBytes"] != sum(row["bytes"] for row in new_rows):
        raise ValueError("Cumulative byte totals differ")
    if report["retainedGeneratedOutputCount"] != report["previousGeneratedOutputs"] + history_count or report["retainedNonfinalOutputCount"] != report["retainedGeneratedOutputCount"] - len(rows):
        raise ValueError("Cumulative retained-history totals differ")
    if sorted(row["id"] for row in report["blockedTargets"]) != sorted(expected_blocks) or any(row["selectedPngCount"] != 0 for row in report["blockedTargets"]):
        raise ValueError("Coverage backlog is missing or counted as a final")
    snapshot = read_json(directory / "new-inputs-snapshot.json")
    for row in snapshot["inputs"]:
        path = Path(row["path"]).resolve()
        expected_prep = workspace / (row["batch"].lower() + "-prep")
        if not path.is_relative_to(expected_prep) or digest(path.read_bytes()) != row["sha256"]:
            raise ValueError("A frozen coverage input changed")
    native_rows = snapshot["nativeOutputs"]
    if len(native_rows) != history_count:
        raise ValueError("Incomplete native-output snapshot")
    for row in native_rows:
        raw = Path(row["nativeSourcePath"]).read_bytes()
        if digest(raw) != row["sha256"] or len(raw) != row["bytes"]:
            raise ValueError("Retained native generation differs from coverage snapshot")
    sums = {}
    for line in (directory / "SHA256SUMS.txt").read_text().splitlines():
        sha, relative = line.split("  ", 1)
        relative = safe(relative)
        if relative in sums or digest((directory / relative).read_bytes()) != sha:
            raise ValueError("Coverage manifest mismatch")
        sums[relative] = sha
    physical = {path.relative_to(directory).as_posix() for path in directory.rglob("*") if path.is_file() and path.name != "SHA256SUMS.txt"}
    if set(sums) != physical:
        raise ValueError("Coverage manifest inventory differs")
    builder = Path(__file__).with_name("build_coverage.py")
    if digest(builder.read_bytes()) != report["coverageBuilderSha256"]:
        raise ValueError("Coverage builder differs from the recorded implementation")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--prep", type=Path, required=True)
    parser.add_argument("--pack", type=int, choices=CONTRACTS, required=True)
    parser.add_argument("--date", required=True, help="Explicit YYYY-MM-DD date in Europe/Paris")
    parser.add_argument("--validate-selection", action="store_true", help="Read-only source and selection verification before complete generations exist")
    parser.add_argument("--write", action="store_true", help="Materialize the verified pack after the coordinating agent freezes its inputs")
    parser.add_argument("--coverage-dir", type=Path, help="Root-prepared aggregate files; supported only for Art238")
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
    if selection.get("sourceMain", selection.get("sourceBase", selection.get("sourceRevision"))) != BASE:
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
        if record["revision"] != BASE:
            raise ValueError("Unbound source revision: " + record["preparedPath"])
        native = git(repo, "show", BASE + ":" + record["repositoryPath"])
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
        path = absolute(canonical[key], prep)
        if digest(path.read_bytes()) != canonical[key]["sha256"] or str(path) not in input_to_pack:
            raise ValueError("Unbound canonical reference: " + key)
    if args.validate_selection:
        print(json.dumps({"pack": number, "targets": len(targets), "sourceFiles": len(sources), "selectionVerified": True, "packWritten": False}))
        return

    replay_path = prep / "root-canonical-replay.json"
    replay = read_json(replay_path)
    replay_rows = {row["id"]: row for row in replay["targets"]}
    if replay.get("sourceRevision") != BASE or set(replay_rows) != {target["artId"] for target in targets.values()} or len(replay["targets"]) != len(targets):
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
    if blocked and number != 237:
        raise ValueError("Partial delivery is currently declared only for Art237")
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
        relative = f"assets/art{number}/{contract['directory']}/{targets[key]['file']}" if chosen else f"references/iterations/{key}-iteration-{iteration:02d}.png"
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
            "key": key, "id": target["artId"], "kind": target["kind"], "name": target["label"], "sourceRevision": BASE,
            "canonicalReference": {"path": input_to_pack[str(canonical_path)], "sha256": digest(canonical_path.read_bytes())},
            "canonicalReplay": replay_rows[target["artId"]],
            "deliveryStatus": "accepted-source-art-proposal" if key in finals else blocked[key]["status"],
            "runtimeIntegrationPerformed": False, "newGameplayPlacementCreated": False,
        }
        for field in ["route", "sourceId", "sourcePlanId", "sourceType", "sourceObject", "dimensions", "nativeSpec", "canonicalVariant", "variant", "phase", "motion", "existingState", "sourceStatus", "existingAnalogue", "geometryOwner", "renderOwner", "stateOwner", "runtimeOwner", "runtimeIdentity", "sourceRecipe", "profile", "supportParts", "mechanismParts", "sourceContract", "geometryContract", "identityContract", "identityMeaning", "intendedPhases", "excludedPhase", "sharedProfiles", "camera", "metricDimensions"]:
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
            ("route", "existingRoute"), ("canonicalVariant", "canonicalVariant"), ("variant", "canonicalVariant"),
            ("phase", "phase"), ("motion", "motion"), ("dimensions", "dimensionsAuthorDesignMetres"), ("nativeSpec", "nativeSourceSpecification"),
            ("sourceId", "sourceId"), ("sourcePlanId", "sourcePlanId"), ("geometryOwner", "geometryOwner"), ("renderOwner", "renderOwner"), ("stateOwner", "stateOwner"),
        ]:
            if source_field in target:
                asset[output_field] = target[source_field]
        if number == 237:
            asset["existingRuntimeMechanismKind"] = key
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
        if number != 238:
            raise ValueError("Aggregate coverage belongs only to Art238")
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
        "assembledOn": args.date, "timezone": "Europe/Paris", "referenceRepository": REPOSITORY, "publicationBaseRevision": BASE, "publicationBaseTree": TREE,
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
        failed_calls_content = f"\n- `generation-failures.json`, `records/preparation/generation-prompts.json` et `records/calls/` : les {len(failure_receipts)} refus du service, leurs prompts effectivement envoyés et leurs reçus sont archivés séparément ; ils ne sont pas comptés comme sorties PNG."
    readme = f"""# DEADWALL — Art{number} : {title}

**{len(assets)} PNG finaux et {superseded} sortie(s) remplacée(s)** sont conservés dans leurs octets natifs, avec les prompts effectivement envoyés, les références exactes, l’historique et les empreintes SHA256.
{backlog_summary}

| Identité de proposition | Sujet | Géométrie déclarée par la source |
|---|---|---|
{table}

## Sources et périmètre

Révision source : `{BASE}` ; arbre Git : `{TREE}`.

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
