#!/usr/bin/env python3
"""Assemble source-only Art230/231/232 with native identities and exact bytes.

No generation, image rewriting, runtime registration, Codex remapping, staging
or publication is performed. --validate-selection never writes a pack.
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

BASE = "f3ba02a5b73a55120c02c21d5703902ea3e901d9"
REPOSITORY = "darknigthmare/deadwall-last-enclosure"
COUNTS = {230: 7, 231: 7, 232: 6}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def json_bytes(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def git_read(repo: Path, *args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(repo), *args])


def safe_relative(value: str) -> str:
    path = Path(value)
    if path.is_absolute() or ".." in path.parts or "\\" in value or not path.parts:
        raise ValueError(f"Unsafe relative path: {value}")
    return path.as_posix()


def input_path(value: str, record_file: Path) -> Path:
    path = Path(value)
    return path.resolve() if path.is_absolute() else (record_file.parent / path).resolve()


def records(path: Path) -> list:
    value = load_json(path)
    if isinstance(value, dict):
        value = value.get("results", value.get("records"))
    if not isinstance(value, list):
        raise ValueError(f"Expected a generation-record array: {path}")
    return value


def audit_png(path: Path, output_path: str) -> dict:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Invalid PNG signature: {path}")
    width, height, bits, color, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", data[16:29])
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        image.load()
        if image.mode != "RGBA" or image.size != (width, height):
            raise ValueError(f"Final output is not native RGBA: {path}")
        alpha = image.getchannel("A")
        histogram = alpha.histogram()
        boxes, margins = {}, {}
        for threshold in (1, 8, 32, 128, 240):
            box = alpha.point(lambda value, t=threshold: 255 if value >= t else 0).getbbox()
            boxes[str(threshold)] = list(box) if box else None
            margins[str(threshold)] = ({"left": box[0], "top": box[1],
                                       "right": width-box[2], "bottom": height-box[3]} if box else None)
        if not histogram[0] or not boxes["8"] or min(margins["8"].values()) <= 0:
            raise ValueError(f"Final output lacks transparent margins or a contained visible body: {path}")
        edges = {"top": (0, 0, width, 1), "bottom": (0, height-1, width, height),
                 "left": (0, 0, 1, height), "right": (width-1, 0, width, height)}
        return {"file": output_path, "bytes": len(data), "sha256": sha256(data),
                "width": width, "height": height, "mode": image.mode, "pngBitDepth": bits,
                "pngColorType": color, "pngCompressionMethod": compression,
                "pngFilterMethod": filtering, "pngInterlaceMethod": interlace,
                "pillowVerifyPassed": True, "alphaExtrema": list(alpha.getextrema()),
                "fullyTransparentPixels": histogram[0], "fullyTransparentFraction": histogram[0]/(width*height),
                "lowAlphaPixels1to7": sum(histogram[1:8]), "boundsAlphaAtLeast": boxes,
                "marginsAlphaAtLeast": margins,
                "borderAlphaMaximum": {name: alpha.crop(box).getextrema()[1] for name, box in edges.items()},
                "cornerAlpha": [alpha.getpixel(p) for p in [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]],
                "visibleBodyWithinCanvasAtAlpha8": True, "nativeBytesPreserved": True,
                "pixelEditingResizingCroppingPerformed": False}


def preparation_path(original: str) -> str:
    renamed = {"selection-and-prompts.json": "references/selection-at-retrieval.json",
               "references/sources.json": "references/prepared-sources.json",
               "evaluated-native-plans.json": "references/evaluated-native-plans.json",
               "generation-prompts.json": "references/prepared-prompts.json",
               "prompt-validation.json": "references/prepared-prompt-validation.json",
               "source-only-contract.md": "references/source-only-contract.md"}
    return renamed.get(original, original if original.startswith("references/")
                       else "references/preparation/" + original)


def validate_preparation(selection_file: Path, pack: int, repo: Path, base: str):
    selection = load_json(selection_file)
    if selection.get("batch", "").lower() != f"art{pack}" or selection.get("sourceMainRevision") != base:
        raise ValueError("Prepared batch or source revision does not match the requested native pack")
    rows = selection["targets"]
    targets = {row["type"]: row for row in rows}
    if len(rows) != COUNTS[pack] or len(targets) != COUNTS[pack]:
        raise ValueError("Selection has an unexpected target count or duplicate native types")
    prepared, mapped = {}, {}
    manifest = selection_file.parent / "PREPARATION_SHA256SUMS.txt"
    for line in manifest.read_text(encoding="utf-8").splitlines():
        match = re.fullmatch(r"([0-9a-f]{64})  (.+)", line)
        if not match:
            raise ValueError("Malformed preparation manifest")
        digest, original = match.groups()
        original = safe_relative(original)
        if original in mapped:
            raise ValueError("Duplicate preparation-manifest path")
        data = (selection_file.parent / original).read_bytes()
        if sha256(data) != digest:
            raise ValueError(f"Preparation digest mismatch: {original}")
        destination = preparation_path(original)
        if destination in prepared:
            raise ValueError("Conflicting preparation destination")
        prepared[destination] = data
        mapped[original] = {"path": destination, "sha256": digest, "bytes": len(data)}
    if mapped.get(selection_file.name, {}).get("sha256") != sha256(selection_file.read_bytes()):
        raise ValueError("Selection itself must be included in the verified preparation manifest")
    prepared["records/input-preparation-sha256.txt"] = manifest.read_bytes()
    prepared["records/preparation-paths.json"] = json_bytes(mapped)
    sources = []
    for source in selection["sources"]:
        original = safe_relative(source["path"])
        if original not in mapped or mapped[original]["sha256"] != source["sha256"]:
            raise ValueError(f"Source is not bound to the prepared bytes: {original}")
        data = prepared[mapped[original]["path"]]
        if source.get("bytes", len(data)) != len(data):
            raise ValueError(f"Source byte count mismatch: {original}")
        checked = {**source, "packPath": mapped[original]["path"], "sourceDigestVerified": True}
        if source.get("repositoryPath"):
            if git_blob(data) != source.get("gitBlob"):
                raise ValueError(f"Reference Git blob mismatch: {original}")
            entry = git_read(repo, "ls-tree", base, "--", source["repositoryPath"])
            base_blob = entry.split()[2].decode() if entry else None
            checked.update(baseRevisionCompared=base, baseGitBlob=base_blob,
                           sameBlobAtPublicationBase=base_blob == source["gitBlob"])
            if source["revision"] == base and base_blob != source["gitBlob"]:
                raise ValueError(f"Declared base reference differs from actual Git tree: {original}")
        sources.append(checked)
    evaluation = selection["nativePlanEvaluation"]
    evaluated_bytes = (selection_file.parent / evaluation["path"]).read_bytes()
    if evaluation["path"] not in mapped or sha256(evaluated_bytes) != evaluation["sha256"]:
        raise ValueError("Native-plan evaluation bytes are not bound to the selection")
    evaluated_rows = json.loads(evaluated_bytes)["targets"]
    evaluated = {row["type"]: row for row in evaluated_rows}
    if len(evaluated_rows) != len(targets) or set(evaluated) != set(targets):
        raise ValueError("Evaluated plans must cover each selected native type once")
    for key, target in targets.items():
        if not re.fullmatch(r"[a-z][A-Za-z0-9]*", key):
            raise ValueError("Invalid native type")
        ident = "native:" + key
        if target["nativeType"] != key or target["artId"] != ident:
            raise ValueError("Sprite identities must be native:<type>")
        preset = target["preset"]
        if preset["id"] != key or "codex" in preset or "declaredCodexId" in target:
            raise ValueError("A Codex assignment must not become a sprite or preset identity")
        if not all(isinstance(preset[axis], (int, float)) and not isinstance(preset[axis], bool) and preset[axis] > 0 for axis in ("w", "h")):
            raise ValueError("Native footprint dimensions must be positive")
        levels = preset["levels"]
        if not levels or levels != sorted(set(levels)) or 0 not in levels or any(type(z) is not int for z in levels):
            raise ValueError("Native levels must be a unique ordered integer list including the ground floor")
        filename = target["filename"]
        if not re.fullmatch(re.escape(key) + r"_[A-Za-z0-9_-]+\.png", filename) or re.search(r"DW[-_]?\d{4}", filename, re.I):
            raise ValueError("Final filenames must use only native type and a slug, without a DW ID")
        provenance = target["provenance"]
        if provenance["codexMappingStatus"] != "contradictory_unresolved" or not re.fullmatch(r"DW-\d{4}", provenance["declaredCodexId"]):
            raise ValueError("The conflicting declared Codex assignment must remain explicit and unresolved")
        conflict = provenance["conflictingCardSource"]
        if mapped.get(conflict["path"], {}).get("sha256") != conflict["sha256"]:
            raise ValueError("Conflicting Codex evidence is missing or changed")
        native = evaluated[key]
        payload = {k: v for k, v in native.items() if k != "canonicalPayloadSha256"}
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        snapshot = target["nativePlanSnapshot"]
        if (sha256(canonical) != native["canonicalPayloadSha256"] or
                native["canonicalPayloadSha256"] != snapshot["canonicalPayloadSha256"] or
                snapshot["fileSha256"] != sha256(evaluated_bytes) or native["preset"] != preset or
                native["fixture"] != snapshot["fixture"] or native["artId"] != ident):
            raise ValueError(f"Native plan or canonical fingerprint mismatch: {key}")
        if native["fixture"].get("codex") is not None or "declaredCodexId" in native:
            raise ValueError("Canonical native snapshot must not promote a conflicting Codex identity")
        if [floor["z"] for floor in native["floors"]] != levels:
            raise ValueError("Evaluated native floors differ from the selected levels")
    return selection, targets, prepared, mapped, sources


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pack", type=int, choices=sorted(COUNTS), required=True)
    parser.add_argument("--selection", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--history-records", type=Path, nargs="+")
    parser.add_argument("--final-records", type=Path)
    parser.add_argument("--review", type=Path)
    parser.add_argument("--prior-publications", type=Path)
    parser.add_argument("--coverage-report", type=Path)
    parser.add_argument("--base-revision", default=BASE)
    parser.add_argument("--date")
    parser.add_argument("--validate-selection", action="store_true")
    args = parser.parse_args()
    repo = args.repo.resolve()
    base = git_read(repo, "rev-parse", args.base_revision + "^{commit}").decode().strip()
    if base != BASE or git_read(repo, "rev-parse", "HEAD").decode().strip() != base:
        raise ValueError("Assembly requires the unchanged declared base commit")
    output = repo / "art-packs" / f"DEADWALL_Art{args.pack}"
    if output.resolve() != output:
        raise ValueError("Refusing an output path redirected through a symlink")
    selection, targets, planned, prepared_paths, sources = validate_preparation(args.selection, args.pack, repo, base)
    order = tuple(targets)
    if args.validate_selection:
        print(json.dumps({"pack": args.pack, "sourceRevision": base, "targets": list(order),
                          "preparedFilesVerified": len(prepared_paths), "referencesVerified": len(sources),
                          "canonicalNativePlansVerified": len(targets), "packWritten": False}, indent=2))
        return
    if not args.date or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.date):
        raise ValueError("Assembly requires an explicit YYYY-MM-DD date (Europe/Paris)")
    if not args.history_records or not args.final_records or not args.review:
        raise ValueError("Assembly requires complete history, final records and a SHA-bound visual review")
    if args.coverage_report and args.pack != 232:
        raise ValueError("The new 69-image aggregate is included only in Art232")
    if args.pack == 232 and not args.coverage_report:
        raise ValueError("Art232 requires the final 69-image aggregate before assembly")

    def put(rel: str, data: bytes) -> None:
        rel = safe_relative(rel)
        if rel in planned and planned[rel] != data:
            raise ValueError(f"Conflicting pack entry: {rel}")
        planned[rel] = data

    def put_json(rel: str, value) -> None:
        put(rel, json_bytes(value))

    final = records(args.final_records)
    final_by_key = {row["key"]: row for row in final}
    review = load_json(args.review)
    if len(final) != len(order) or set(final_by_key) != set(order) or set(review) != set(order):
        raise ValueError("Final records and visual review must cover every selected native type exactly once")
    prior = load_json(args.prior_publications) if args.prior_publications else []
    if prior:
        if len(prior) != len({row["batch"] for row in prior}):
            raise ValueError("Duplicate prior publication")
        for row in prior:
            if not re.fullmatch(r"art22[2-9]", row["batch"], re.I) or not re.fullmatch(r"[0-9a-f]{40}", row["headRevision"]):
                raise ValueError("Prior-publication records need a known batch and exact remote commit")
        put("references/prior-publications.json", args.prior_publications.read_bytes())

    def identity(row: dict, record_file: Path):
        key = row["key"]
        if key not in targets or row.get("id", row.get("artId")) != "native:" + key:
            raise ValueError("Generation record must use a selected native identity")
        if row.get("artId", "native:" + key) != "native:" + key:
            raise ValueError("Conflicting record artId")
        if not row.get("prompt") or row.get("promptIsVerbatim") is not True or row.get("transparentBackgroundRequested") is not True:
            raise ValueError("Exact sent prompt and transparent-background request are required")
        if type(row.get("iteration")) is not int or row["iteration"] < 1:
            raise ValueError("Each generation needs a positive iteration number")
        if row.get("file", targets[key]["filename"]) != targets[key]["filename"]:
            raise ValueError("Generation filename differs from the native-only selection filename")
        path = input_path(row["generatedSourcePath"], record_file)
        data = path.read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError("All original generation outputs must be preserved as native PNGs")
        refs = tuple(sha256(input_path(ref, record_file).read_bytes()) for ref in row.get("referenceImages", []))
        if not refs:
            raise ValueError("Every generation must record its actual image references")
        return (key, row["iteration"], sha256(data), row["prompt"], refs), path, data

    final_identity = {key: identity(row, args.final_records)[0] for key, row in final_by_key.items()}
    history, seen, input_to_pack = [], {}, {}
    for original, mapped in prepared_paths.items():
        input_to_pack[str((args.selection.parent / original).resolve())] = mapped["path"]
    for index, record_file in enumerate([*args.history_records, args.final_records], 1):
        put(f"records/input-results-{index:02d}.json", record_file.read_bytes())
        for row in records(record_file):
            fingerprint, path, data = identity(row, record_file)
            key, iteration = fingerprint[:2]
            token = (key, iteration)
            if token in seen:
                if seen[token] != fingerprint:
                    raise ValueError(f"Conflicting records for native generation {token}")
                continue
            seen[token] = fingerprint
            selected = fingerprint == final_identity[key]
            rel = (f"assets/art{args.pack}/native/{targets[key]['filename']}" if selected
                   else f"references/iterations/{key}-v{iteration}.png")
            put(rel, data)
            input_to_pack[str(path)] = rel
            history.append({"row": row, "recordFile": record_file, "source": path, "path": rel,
                            "selected": selected, "sha256": fingerprint[2], "bytes": len(data)})
    history.sort(key=lambda item: (order.index(item["row"]["key"]), item["row"]["iteration"]))
    if sum(item["selected"] for item in history) != len(order):
        raise ValueError("History must identify exactly one selected native generation per type")
    by_digest = {}
    for rel, data in planned.items():
        if Path(rel).suffix.lower() in (".png", ".webp", ".jpg", ".jpeg"):
            by_digest.setdefault(sha256(data), []).append(rel)
    normalized = []
    for item in history:
        row = item["row"]
        references = []
        for ref in row["referenceImages"]:
            path = input_path(ref, item["recordFile"])
            digest = sha256(path.read_bytes())
            rel = input_to_pack.get(str(path))
            if rel is None:
                candidates = by_digest.get(digest, [])
                if not candidates:
                    raise ValueError(f"Actual generation reference is absent from the pack: {path}")
                rel = sorted(candidates)[0]
            if sha256(planned[rel]) != digest:
                raise ValueError("Generation reference bytes have changed")
            references.append({"path": rel, "sha256": digest})
        normalized.append({"key": row["key"], "id": "native:" + row["key"], "artId": "native:" + row["key"],
                           "nativeType": row["key"], "name": row["label"], "iteration": row["iteration"],
                           "prompt": row["prompt"], "promptIsVerbatim": True,
                           "generator": row.get("generator", "OpenAI ImageGen intégré"),
                           "transparentBackgroundRequested": True, "referenceImages": references,
                           "output": item["path"], "selected": item["selected"], "sha256": item["sha256"],
                           "bytes": item["bytes"], "nativeBytesPreserved": True})
    put_json("generation-history.json", normalized)
    put_json("generation-prompts.json", normalized)
    put_json("references/sources.json", sources)

    source_map, assets, audits = [], [], []
    for key in order:
        target, row = targets[key], final_by_key[key]
        path = input_path(row["generatedSourcePath"], args.final_records)
        digest = sha256(path.read_bytes())
        if review[key].get("sha256") != digest or not review[key].get("observation"):
            raise ValueError(f"Selected native PNG lacks a matching SHA-bound review: {key}")
        rel = f"assets/art{args.pack}/native/{target['filename']}"
        audits.append(audit_png(path, rel))
        source_map.append({"id": target["artId"], "artId": target["artId"], "nativeType": key,
                           "name": target["preset"]["name"], "nativePreset": target["preset"],
                           "nativeRooms": target["nativeRooms"], "nativeOutdoorKinds": target["nativeOutdoorKinds"],
                           "nativeOutdoorProps": target["nativeOutdoorProps"], "nativeFunction": target["nativeFunction"],
                           "inheritanceNotes": target["inheritanceNotes"], "artScope": target["artScope"],
                           "existingRoofFamily": target["roofFamily"], "existingRoofChoices": target["roofChoices"],
                           "nativePlanSnapshot": {**target["nativePlanSnapshot"],
                                                  "packPath": prepared_paths[target["nativePlanSnapshot"]["path"]]["path"]},
                           "source": target["source"], "geometrySources": target["geometrySources"],
                           "provenance": target["provenance"], "codexRemappingPerformed": False})
        assets.append({"id": target["artId"], "artId": target["artId"], "type": key, "nativeType": key,
                       "name": target["preset"]["name"], "path": rel, "sha256": digest,
                       "bytes": len(path.read_bytes()), "iteration": row["iteration"],
                       "nativeBuildingFootprintMetres": [target["preset"]["w"], target["preset"]["h"]],
                       "nativeLevels": target["preset"]["levels"],
                       "status": "native_type_source_art_not_runtime_integrated"})
    if len({row["sha256"] for row in assets}) != len(order):
        raise ValueError("Distinct selected native types must have distinct final PNG bytes")
    put_json("references/SOURCE_MAP.json", source_map)
    put_json("qa/visual-review-records.json", review)
    put_json("qa/image-audit.json", {"schemaVersion": 1, "batch": f"art{args.pack}", "checkedOn": args.date,
             "timezone": "Europe/Paris", "method": "Native PNG/IHDR, Pillow decode/verify, RGBA alpha histogram and margins, SHA256; no image writes.",
             "alphaThresholds": [1, 8, 32, 128, 240], "boundsConvention": "left/top inclusive, right/bottom exclusive",
             "alphaInterpretation": "RGB under alpha=0 is invisible. Low alpha1–7 is reported separately. Alpha>=8 margins do not certify geometry or fidelity.",
             "finalSpriteCount": len(order), "nativeBytesPreserved": True, "assets": audits})
    coverage_info = None
    if args.coverage_report:
        coverage_bytes = args.coverage_report.read_bytes()
        coverage = json.loads(coverage_bytes)
        rows = coverage.get("assets", [])
        ids = {row["id"] for row in rows}
        if len(rows) != 69 or len(ids) != 69 or len({row["sha256"] for row in rows}) != 69:
            raise ValueError("Aggregate coverage must identify 69 distinct final identities and PNG hashes")
        if len([ident for ident in ids if ident.startswith("native:")]) != 20:
            raise ValueError("Aggregate must distinguish 20 new native identities from 49 prior identities")
        if coverage.get("ownManifestSha256Included") is not False or coverage.get("ownOutputCommitShaIncluded") is not False:
            raise ValueError("Coverage must explicitly exclude its own manifest and future output commit hashes")
        if coverage.get("finalPngBytes") != sum(row["bytes"] for row in rows):
            raise ValueError("Aggregate PNG byte total differs from its rows")
        reported = {row["id"]: (row["sha256"], row["bytes"], row["repositoryAssetPath"])
                    for row in rows if row.get("batch", "").lower() == f"art{args.pack}"}
        actual = {row["id"]: (row["sha256"], row["bytes"], str((output/row["path"]).relative_to(repo))) for row in assets}
        if reported != actual:
            raise ValueError("Aggregate Art232 identities, PNG hashes, sizes or repository paths do not match")
        explanation = args.coverage_report.with_suffix(".md").read_bytes()
        put("coverage/coverage-art222-232.json", coverage_bytes)
        put("coverage/coverage-art222-232.md", explanation)
        coverage_info = {"report": "coverage/coverage-art222-232.json", "reportSha256": sha256(coverage_bytes),
                         "explanation": "coverage/coverage-art222-232.md", "explanationSha256": sha256(explanation),
                         "thisPackIdentityHashSizePathVerified": True, "ownManifestSha256Included": False}
    replaced = len(normalized) - len(order)
    put_json("PROVENANCE.json", {"schemaVersion": 1, "project": "DEADWALL — Last Enclosure", "batch": f"art{args.pack}",
             "assembledOn": args.date, "timezone": "Europe/Paris", "referenceRepository": REPOSITORY,
             "publicationBaseRevision": base, "publicationBaseIsOutputCommit": False,
             "generator": "OpenAI ImageGen intégré", "finalSpriteCount": len(order), "generationCount": len(normalized),
             "supersededCandidateCount": replaced, "identityPolicy": selection["identityPolicy"],
             "scope": "Dedicated closed exteriors identified only by existing native types; contradictory declared Codex references remain unresolved evidence.",
             "nativeOutputBytesPreserved": True, "pixelEditingResizingCroppingPerformed": False,
             "geometryBasis": "Existing native preset and unchanged-owner canonical fixture; inherited programme is preserved. No live campaign instance is claimed.",
             "integration": {"performed": False, "runtimeSourceChanged": False, "runtimeAssetRegistrationChanged": False,
                             "testsChanged": False, "codexRemappingPerformed": False, "saveOrWorldIdentityChanged": False},
             "fidelity": {"observed": ["Actual game-atlas reference", "SHA-bound visual review", "Native PNG and alpha checks"],
                          "notCertified": ["Exact metric projection", "Metres per pixel", "Pixel-for-pixel identity", "Runtime anchors, collisions and access alignment"]},
             "sourcesIndex": "references/sources.json", "sourceMapping": "references/SOURCE_MAP.json",
             "prompts": "generation-prompts.json", "generationHistory": "generation-history.json",
             "technicalAudit": "qa/image-audit.json", "visualReview": "qa/visual-review.md",
             "aggregateCoverage": coverage_info, "historicalArt221Inventory": "incomplete_not_reconstructed",
             "validation": {"packTechnicalAudit": "passed", "runtimeCheckThisPack": "not_run_by_assembler",
                            "browser": "not_run", "windows": "not_run"}, "assets": assets})
    put_json("REPRISE.json", {"schemaVersion": 1, "batch": f"art{args.pack}", "savedOn": args.date,
             "publicationBaseRevision": base, "completedArtIds": [row["id"] for row in assets],
             "finalAssets": [{"id": row["id"], "path": row["path"], "sha256": row["sha256"]} for row in assets],
             "priorPublishedPacks": prior, "priorPacksRegenerated": False,
             "counts": {"thisPackFinalSprites": len(order), "thisPackSupersededCandidates": replaced,
                        "priorPublishedFinalSprites": sum(row["finalSpriteCount"] for row in prior),
                        "parallelSiblingPacksCountedAsPublished": False},
             "codexMappingStatus": "contradictory_unresolved", "codexRemappingPerformed": False,
             "integration": "not_performed", "publicationStatusAtAssembly": "prepared_locally_not_published_by_assembler",
             "knownLimits": ["Art221 exact inventory remains incomplete.", "Declared Codex assignments remain contradictory and unresolved.",
                             "No runtime registration or metric 1:1 certification."],
             "nextSteps": ["Read the final PNG hashes and the native source map before continuing.",
                           "Resolve Codex identity contradictions as a separate explicit decision, without silent remapping.",
                           "Calibrate projection, scale, anchors and entrances before any runtime integration.",
                           "Qualify an integration commit through the existing game checks and real player path."]})
    visual = [f"# Art{args.pack} — revue des extérieurs natifs", "", f"Revue du {args.date}, Europe/Paris, liée aux SHA256.", "",
              "| Identité | Nom natif | Observation retenue |", "|---|---|---|"]
    visual += [f"| native:{key} | {targets[key]['preset']['name']} | {review[key]['observation']} |" for key in order]
    visual += ["", "Les images restent dans leurs octets natifs. La revue ne certifie ni fidélité métrique 1:1 ni intégration au moteur. Les références Codex contradictoires ne deviennent pas les identités de ces sprites.", ""]
    put("qa/visual-review.md", "\n".join(visual).encode("utf-8"))
    table = [f"| {row['id']} | {row['name']} | {row['nativeBuildingFootprintMetres'][0]} × {row['nativeBuildingFootprintMetres'][1]} m | {', '.join(map(str,row['nativeLevels']))} |" for row in assets]
    readme = f"""# DEADWALL — Art{args.pack} : extérieurs des types natifs

Ce pack conserve **{len(order)} PNG finaux** et **{replaced} sortie(s) remplacée(s)**, leurs prompts exacts, leurs références et leurs empreintes. Chaque image est identifiée par `native:<type>` et par un nom de fichier sans identifiant DW.

| Identité artistique | Nom natif | Emprise native documentée | Niveaux natifs |
|---|---|---:|---|
{chr(10).join(table)}

## Identité et périmètre

Les pilotes possèdent déjà leurs plans, identités et programmes hérités. Les façades sont des propositions artistiques pour leur enveloppe fermée. Les props extérieurs, cours, véhicules et terrains restent documentés dans les sources et exclus de ces images.

Les références Codex déclarées par les presets sont contradictoires. Elles sont conservées uniquement comme preuves dans `provenance.declaredCodexId` et les fiches de `references/conflicting-codex/`, avec le statut `contradictory_unresolved`. Ce lot ne reconstruit pas ces fiches auteur et n’effectue aucun remapping. Le retrait de métadonnées Codex dans une fixture de lecture ne change aucune identité, sauvegarde, ressource ou propriété du jeu.

`references/SOURCE_MAP.json` relie les identités natives aux presets, plans évalués, programmes hérités, propriétaires et contradictions. L’évaluation est une fixture canonique synthétique G7, non une campagne réellement jouée. Le contrat source est conservé dans `references/source-only-contract.md`.

## Contenu et contrôle

- `assets/art{args.pack}/native/` : les PNG finaux, copiés sans changer un octet.
- `references/iterations/` : toutes les sorties remplacées enregistrées.
- `references/` : sources hashées, atlas réel, plans évalués et sélection initiale.
- `generation-history.json`, `generation-prompts.json`, `records/` : prompts effectivement envoyés, références exactes, versions et entrées d’assemblage.
- `qa/` : RGBA, alpha, marges visibles, SHA256 et revue visuelle liée aux finales.
- `PROVENANCE.json`, `REPRISE.json` : état et limites de reprise.
- `SHA256SUMS.txt` : empreintes de tous les autres fichiers du pack.

L’atlas de référence est vérifié par ses octets, même si le chemin local de génération diffère de la copie préparée. Les prompts de sélection restent des propositions historiques ; les enregistrements effectifs font autorité sur les appels réalisés. Les itérations non retenues restent disponibles.

Les signatures PNG, le décodage, les dimensions, le canal alpha et les empreintes sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Les couleurs RGB sous alpha zéro sont invisibles ; le bruit de très faible alpha est recensé séparément. **La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée.** Projection, mètres par pixel, ancrages et accès restent à calibrer avant un raccord au moteur.

## Reprise

L’inventaire exact Art221 reste incomplet ; aucune déduplication historique exhaustive n’est revendiquée. Les anciens packs restent inchangés. Les éventuels lots compagnons de cette branche ne sont pas déclarés publiés par cet assembleur.

**Source art uniquement : aucune intégration au moteur.** Le pack ne modifie ni sources, ni génération, ni sauvegardes, ni tests, ni dépendances, ni listes publiques. Les contrôles d’images ne remplacent pas les vérifications du jeu et ne démontrent pas une CI réussie.

La base des sources est `{base}` ; ce n’est pas le commit de publication de ce pack. Pour vérifier les fichiers depuis ce dossier :

```sh
sha256sum -c SHA256SUMS.txt
```

L’outil local conservé dans `tools/` ne génère et ne retouche aucune image. Les chemins d’entrée originaux et leur relocalisation dans ce pack sont explicités par `records/preparation-paths.json` ; les manifestes d’entrée restent des preuves historiques distinctes du manifeste final.
"""
    if prior:
        readme += "\n## Publications précédentes\n\n" + "\n".join(
            f"- {row['batch'].capitalize()} : [{row['pullRequestLabel']}]({row['url']}), tête `{row['headRevision']}`, {row['finalSpriteCount']} finales et {row['supersededCandidateCount']} sorties remplacées." for row in prior) + "\n"
    if coverage_info:
        readme += "\n## Couverture agrégée\n\nLes deux fichiers `coverage/coverage-art222-232.json` et `.md` sont inclus exactement depuis le rapport final vérifié. Ils distinguent 42 correspondances natives directes, 20 types natifs aux références Codex contradictoires et 7 autres variantes ou lieux antérieurs : 69 identités artistiques et PNG finaux. La couverture graphique des 62 types ne vaut ni résolution des 20 contradictions ni intégration au jeu. Ce rapport ne contient pas le SHA de son propre manifeste ou d’un commit futur.\n"
    put("README_FR.md", readme.encode("utf-8"))
    put_json("records/assembly-inputs.json", {"baseRevision": base, "dateEuropeParis": args.date,
             "selectionSha256": sha256(args.selection.read_bytes()),
             "preparationManifestSha256": sha256((args.selection.parent/"PREPARATION_SHA256SUMS.txt").read_bytes()),
             "historyRecordSha256": [sha256(path.read_bytes()) for path in args.history_records],
             "finalRecordsSha256": sha256(args.final_records.read_bytes()), "visualReviewSha256": sha256(args.review.read_bytes()),
             "priorPublicationsSha256": sha256(args.prior_publications.read_bytes()) if args.prior_publications else None,
             "aggregateCoverage": coverage_info, "assemblerSha256": sha256(Path(__file__).read_bytes()),
             "nativePngBytesPreserved": True, "outputDeterministicForSameInputsAndExplicitDate": True,
             "assemblerIsLocalNotPartOfRuntime": True})
    put("tools/assemble_native_packs.py", Path(__file__).read_bytes())
    checksum = "".join(f"{sha256(data)}  {rel}\n" for rel, data in sorted(planned.items())).encode("utf-8")
    all_files = {**planned, "SHA256SUMS.txt": checksum}
    if output.exists():
        existing = {str(path.relative_to(output)): path for path in output.rglob("*") if path.is_file()}
        if set(existing) != set(all_files) or any(path.read_bytes() != all_files[rel] for rel, path in existing.items()):
            raise ValueError("Refusing to change an already assembled pack; preserve the frozen output")
    for rel, data in sorted(all_files.items()):
        target = output / safe_relative(rel)
        if target.is_symlink() or any(parent.is_symlink() for parent in target.parents if parent != repo.parent):
            raise ValueError(f"Refusing an output symlink: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            target.write_bytes(data)
        if target.read_bytes() != data:
            raise RuntimeError(f"Output read-back mismatch: {rel}")
    if git_read(repo, "rev-parse", "HEAD").decode().strip() != base:
        raise RuntimeError("Repository revision changed during assembly")
    print(json.dumps({"pack": str(output), "baseRevision": base, "finalSpriteCount": len(order),
                      "supersededCandidateCount": replaced, "totalGeneratedPngCount": len(normalized),
                      "files": len(all_files), "bytes": sum(map(len, all_files.values())),
                      "checksumManifestSha256": sha256(checksum), "nativePngCopiesVerified": True,
                      "runtimeIntegrationPerformed": False, "codexRemappingPerformed": False}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
