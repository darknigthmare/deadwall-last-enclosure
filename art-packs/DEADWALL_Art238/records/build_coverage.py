#!/usr/bin/env python3
"""Audit old files physically; finalize cumulative coverage only after Art237 is frozen.

Adapted from art233-235-tools/build_coverage.py. This script never writes to the
repository. By default it only audits Art222–235 and prints a short receipt.
The explicit --finalize --art237-frozen mode is reserved for the root's go-ahead.
"""
import argparse
from collections import Counter
from datetime import datetime
import hashlib
import json
from pathlib import Path
import subprocess
from zoneinfo import ZoneInfo

BASE = "12e0aa4aa77b9901bd53eb7a8771382a5f753593"
PRIOR_PATH = "art-packs/DEADWALL_Art235/coverage/coverage-art222-235.json"
PRIOR_SHA = "e83181bda4a481c4d864f754d72b938f096988538f6d4ec6e2b47fd1f45a6196"
REPOSITORY = "darknigthmare/deadwall-last-enclosure"
ACCEPTED = {"accepted_source_art_proposal", "accepted-source-art-proposal"}
CONFIG = {
    236: ("actor", "actors", "persistent_shared_survivor_inert_body"),
    237: ("mechanism", "mechanisms", "existing_d17_mechanism_mounted_on_support"),
    238: ("prop", "props", "structural205_authored_garden_prop_variant0"),
}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_text())


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def blob_hash(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def git_blobs(repo, paths):
    raw = subprocess.check_output(
        ["git", "-C", str(repo), "ls-tree", "-r", "-z", BASE, "--", *sorted(paths)]
    )
    found = {}
    for entry in raw.split(b"\0"):
        if entry:
            header, name = entry.split(b"\t", 1)
            mode, kind, oid = header.decode().split()
            require(kind == "blob", "Non-blob path in requested source inventory")
            found[name.decode()] = oid
    require(set(found) == set(paths), "Some prior file paths are absent from the current main tree")
    return found


def png_record(path, relative_path=None):
    data = path.read_bytes()
    require(data[:8] == b"\x89PNG\r\n\x1a\n", f"Not a native PNG: {path}")
    return {
        "path": relative_path or str(path),
        "sha256": sha(data),
        "bytes": len(data),
        "width": int.from_bytes(data[16:20], "big"),
        "height": int.from_bytes(data[20:24], "big"),
        "gitBlobCalculated": blob_hash(data),
    }


def audit_previous(repo):
    raw = (repo / PRIOR_PATH).read_bytes()
    require(sha(raw) == PRIOR_SHA, "Prior coverage report SHA changed")
    committed = subprocess.check_output(["git", "-C", str(repo), "show", BASE + ":" + PRIOR_PATH])
    require(raw == committed, "Prior report differs from current main blob")
    previous = json.loads(raw)
    rows = previous["assets"]
    require(len(rows) == 99, "Expected the 99 existing final proposals")
    indexed = {row["repositoryAssetPath"]: row for row in rows}
    require(len(indexed) == len(rows), "Duplicate paths in old inventory")
    physical, manifests, histories, metadata = {}, {}, [], []
    for n in range(222, 236):
        pack = repo / f"art-packs/DEADWALL_Art{n}"
        provenance_path = pack / "PROVENANCE.json"
        history_path = pack / "generation-history.json"
        provenance, history = load(provenance_path), load(history_path)
        require(len(provenance["assets"]) == provenance["finalSpriteCount"], f"Art{n} manifest count")
        require(len(history) == provenance["generationCount"], f"Art{n} generation count")
        for p in (provenance_path, history_path):
            metadata.append({"path": str(p.relative_to(repo)), "sha256": sha(p.read_bytes())})
        for row in provenance["assets"]:
            path = str((pack / row["path"]).relative_to(repo))
            require(path not in manifests, f"Duplicate manifest final: {path}")
            manifests[path] = row
        for p in (pack / "assets").rglob("*.png"):
            physical[str(p.relative_to(repo))] = p
        for row in history:
            output = row.get("output") or row.get("outputInPack") or row.get("packPath")
            require(bool(output), f"Art{n} historical output lacks an archived path")
            path = pack / output
            require(path.resolve().is_relative_to(pack.resolve()), "Historical path escapes its pack")
            measured = png_record(path, str(path.relative_to(repo)))
            audit = row.get("audit") or {}
            declared_sha = row.get("sha256") or audit.get("sha256")
            declared_bytes = row.get("bytes", audit.get("bytes"))
            require(measured["sha256"] == declared_sha, f"Historical SHA mismatch: {path}")
            require(declared_bytes is None or measured["bytes"] == declared_bytes,
                    f"Historical byte mismatch: {path}")
            histories.append({
                **measured, "batch": f"Art{n}", "key": row.get("key"),
                "iteration": row["iteration"], "declaredByteCount": declared_bytes,
                "declaredByteCountVerified": declared_bytes is not None,
                "selectedFinal": measured["path"] in indexed,
            })
    require(set(physical) == set(indexed) == set(manifests),
            "Physical finals, cumulative inventory and individual manifests disagree")
    require(len({r["path"] for r in histories}) == len(histories), "Duplicate archived history paths")
    require(len({r["sha256"] for r in histories}) == len(histories), "Duplicate historical output SHA")
    blobs = git_blobs(repo, {r["path"] for r in histories})
    for row in histories:
        require(row["gitBlobCalculated"] == blobs[row["path"]],
                f"Historical PNG differs from current main Git blob: {row['path']}")
        row["gitBlobAtSourceMain"] = blobs[row["path"]]
    historical_by_path = {row["path"]: row for row in histories}
    finals = []
    for path, row in indexed.items():
        measured = historical_by_path[path]
        manifest = manifests[path]
        require(measured["sha256"] == row["sha256"] == manifest["sha256"], f"Final SHA: {path}")
        require(measured["bytes"] == row["bytes"] == manifest["bytes"], f"Final bytes: {path}")
        require(row["id"] == manifest.get("artId", manifest["id"]), f"Final identity: {path}")
        n = int(row["batch"][3:])
        finals.append({
            **row, "coverageCategory": "exterior" if n <= 232 else "prop",
            "byteVerificationThisReport": True, "sourcePresentOnCurrentMain": True,
            "verifiedAtMainRevision": BASE, "gitBlobAtCurrentMain": blobs[path],
        })
    exterior = [row for row in finals if row["coverageCategory"] == "exterior"]
    native = [row for row in exterior if row.get("nativeType")]
    direct = [row for row in native if row.get("nativePilotMappingVerified") is True]
    unresolved = [row for row in native if row.get("nativePilotMappingVerified") is False]
    require(len(exterior) == 69 and len(native) == 62, "Existing exterior classification changed")
    require(len({r["nativeType"] for r in native}) == 62, "Native type duplication")
    require(len(direct) == 42 and len(unresolved) == 20, "Codex association partition changed")
    require(len(finals) - len(exterior) == 30, "Existing prop classification changed")
    require(len(histories) == 153, "Existing native history count changed")
    require(sum(row["selectedFinal"] for row in histories) == 99, "Final/history mismatch")
    require(sum(row["bytes"] for row in finals) == previous["totalFinalPngBytes"],
            "Prior report's byte total differs from physical files")
    summary = {
        "physicalFinalCount": len(finals), "physicalHistoricalOutputCount": len(histories),
        "physicalNonfinalOutputCount": len(histories) - len(finals),
        "finalPngBytes": sum(row["bytes"] for row in finals),
        "historicalPngBytes": sum(row["bytes"] for row in histories),
        "exteriorCount": len(exterior), "nativeBuildingTypeCount": len(native),
        "otherExteriorSitesOrVariants": len(exterior) - len(native),
        "typedPropCount": len(finals) - len(exterior),
        "verifiedDirectNativeCodexAssociations": len(direct),
        "nativeBuildingTypesWithUnresolvedCodexReferences": len(unresolved),
        "allHashesAndDeclaredBytesMatch": True, "allOutputsMatchCurrentMainGitBlobs": True,
        "physicalFinalPathsEqualAllManifestPaths": True,
        "physicalFinalPathsEqualPreviousInventoryPaths": True,
        "perBatch": dict(Counter(row["batch"] for row in finals)),
    }
    audit = {
        "sourceMainRevision": BASE, "previousReportSha256": PRIOR_SHA,
        "summary": summary, "metadataFiles": metadata,
        "finalAssetPaths": sorted(physical), "historicalOutputs": histories,
    }
    return raw, previous, finals, audit


def blocked_rows(data):
    if isinstance(data, list):
        return data
    for key in ("blockedTargets", "blocked", "targets", "backlog", "excludedTargets"):
        if key in data:
            nested = data[key]
            if isinstance(nested, list):
                return nested
            if isinstance(nested, dict):
                return [{"key": key, **value} for key, value in nested.items()]
    if isinstance(data, dict) and all(isinstance(v, dict) for v in data.values()):
        return [{"key": key, **value} for key, value in data.items()]
    raise RuntimeError("Unknown blocked-targets schema; inspect before finalization")


def inspect_native(row):
    source = Path(row["generatedSourcePath"])
    measured = png_record(source)
    if row.get("sha256"):
        require(row["sha256"] == measured["sha256"], f"Stale generation hash for {row['key']}")
    if row.get("archivedOutputPath"):
        archived = png_record(Path(row["archivedOutputPath"]))
        require(archived["sha256"] == measured["sha256"] and archived["bytes"] == measured["bytes"],
                f"Archived copy differs from native output: {row['key']}")
    return measured


def collect_new(workspace):
    additions, backlog, histories, counts, locks = [], [], [], {}, []
    for n, (category, directory, partition) in CONFIG.items():
        prep = workspace / f"art{n}-prep"
        handoff = None
        if n == 237:
            handoff_path = prep / "handoff-receipt.json"
            handoff = load(handoff_path)
            require(handoff["status"] == "frozen_for_assembly" and handoff["sourceMain"] == BASE,
                    "Art237 documentary handoff is not frozen on the expected main")
            locks.append({"batch": "Art237", "role": "documentary-freeze-receipt",
                          "path": str(handoff_path), "sha256": sha(handoff_path.read_bytes())})
            for record in handoff["records"] + [handoff["freezeManifest"]]:
                record_path = prep / record["path"]
                require(sha(record_path.read_bytes()) == record["sha256"],
                        f"Art237 document differs from its frozen receipt: {record_path}")
                locks.append({"batch": "Art237", "role": "frozen-document",
                              "path": str(record_path), "sha256": record["sha256"]})
        paths = {key: prep / filename for key, filename in {
            "selection": "selection-and-prompts.json", "results": "results.json",
            "review": "review.json", "history": "history-results.json",
        }.items()}
        data = {key: load(path) for key, path in paths.items()}
        for key, path in paths.items():
            locks.append({"batch": f"Art{n}", "role": key, "path": str(path), "sha256": sha(path.read_bytes())})
        selection = data["selection"]
        revision = selection.get("sourceRevision", selection.get("sourceMain", selection.get("sourceBase")))
        require(revision == BASE, f"Art{n} source revision differs")
        targets = {row["key"]: row for row in selection["targets"]}
        results = {row["key"]: row for row in data["results"]}
        require(len(results) == len(data["results"]), f"Art{n} duplicate result keys")
        require(set(results) <= set(targets), f"Art{n} unknown result key")
        reviews = data["review"]
        root_reviews = {}
        root_review_path = prep / "root-review.json"
        if root_review_path.exists():
            root_reviews = load(root_review_path)
            locks.append({"batch": f"Art{n}", "role": "independent-root-review",
                          "path": str(root_review_path), "sha256": sha(root_review_path.read_bytes())})
        blocked = {}
        blocked_path = prep / "blocked-targets.json"
        if blocked_path.exists():
            for row in blocked_rows(load(blocked_path)):
                key = row.get("key") or row.get("kind")
                require(key in targets, f"Unknown blocked target: {key}")
                blocked[key] = row
                for receipt in row.get("failureReceipts", []):
                    failure_path = prep / receipt["path"]
                    require(sha(failure_path.read_bytes()) == receipt["sha256"],
                            f"Failure receipt hash changed: {failure_path}")
                    locks.append({"batch": f"Art{n}", "role": "failed-service-attempt",
                                  "path": str(failure_path), "sha256": receipt["sha256"]})
            locks.append({"batch": f"Art{n}", "role": "blocked", "path": str(blocked_path),
                          "sha256": sha(blocked_path.read_bytes())})
        selected_tokens, batch_history, history_tokens = set(), [], set()
        for row in data["history"]:
            require(row["key"] in targets, f"Art{n} history unknown target")
            measured = inspect_native(row)
            token = (row["key"], row["iteration"], measured["sha256"])
            require(token not in history_tokens, f"Duplicate native generation in Art{n}")
            history_tokens.add(token)
            batch_history.append({
                "batch": f"Art{n}", "key": row["key"], "iteration": row["iteration"],
                "sha256": measured["sha256"], "bytes": measured["bytes"],
                "nativeSourcePath": str(row["generatedSourcePath"]),
                "archivedOutputPath": row.get("archivedOutputPath"), "promptIsVerbatim": row.get("promptIsVerbatim"),
            })
        for key, target in targets.items():
            review = reviews.get(key, {})
            accepted = review.get("decision") in ACCEPTED
            if not accepted:
                evidence = blocked.get(key) or review
                require(bool(evidence), f"Art{n} target not reviewed or explicitly blocked: {key}")
                backlog.append({
                    "batch": f"Art{n}", "key": key, "id": target.get("artId", target["id"]),
                    "name": target["label"], "selectedPngCount": 0,
                    "retainedGeneratedPngCount": sum(row["key"] == key for row in batch_history),
                    "existingRenderingRoute": target.get("route"),
                    "existingRendererPresent": True, "status": "backlog_no_accepted_source_png",
                    "evidence": evidence,
                })
                continue
            require(key in results, f"Accepted target lacks a result: {key}")
            row = results[key]
            require(row.get("artId", row["id"]) == target.get("artId", target["id"]),
                    f"New result identity mismatch: {key}")
            measured = inspect_native(row)
            require(review["sha256"] == measured["sha256"], f"Review SHA mismatch: {key}")
            root_review = root_reviews.get(key)
            if root_review is not None:
                require(root_review.get("decision") in ACCEPTED and root_review["sha256"] == measured["sha256"],
                        f"Independent root review differs from selected image: {key}")
            token = (key, row["iteration"], measured["sha256"])
            require(token in history_tokens, f"Selected output missing from complete history: {key}")
            selected_tokens.add(token)
            for reference in row["referenceImages"]:
                ref_path = reference["path"] if isinstance(reference, dict) else reference
                path = Path(ref_path)
                if not path.is_absolute():
                    path = prep / path
                require(path.exists(), f"Actual ImageGen reference missing: {path}")
                if isinstance(reference, dict) and reference.get("sha256"):
                    require(sha(path.read_bytes()) == reference["sha256"], f"Reference SHA changed: {path}")
            addition = {
                "batch": f"Art{n}", "id": row.get("artId", row["id"]),
                "key": key, "kind": target["kind"], "name": target["label"],
                "coverageCategory": category, "scopeGroup": f"new_{category}_source_proposal",
                "partition": partition,
                "repositoryAssetPath": f"art-packs/DEADWALL_Art{n}/assets/art{n}/{directory}/{target['file']}",
                "repositoryAssetPathStatus": "assembly_destination",
                "sha256": measured["sha256"], "bytes": measured["bytes"],
                "width": measured["width"], "height": measured["height"],
                "sourceRevision": BASE, "sourceId": target.get("sourceId"),
                "sourcePlanId": target.get("sourcePlanId"),
                "existingRenderingRoute": target.get("route", "succession133-canvas-fallback"),
                "iteration": row["iteration"],
                "sourceVariant": (
                    target["canonicalVariant"] if target.get("canonicalVariant") is not None
                    else target.get("variant")
                ),
                "byteVerificationSource": "native_imagegen_bytes_and_sha_bound_accepted_review",
                "nativeSourcePath": str(row["generatedSourcePath"]),
                "reviewDecision": review["decision"], "existingRendererPresent": True,
                "independentRootReviewShaVerified": root_review is not None,
                "analogousExistingImagesNotClaimedAbsent": True,
                "publishedRevision": None, "publicationStatusAtAssembly": "prepared_source_proposal",
                "metricFidelityCertified": False, "runtimeIntegrationPerformed": False,
            }
            if n == 236:
                addition.update({
                    "metricDimensions": None, "sharedProfiles": target["sharedProfiles"],
                    "intendedPhases": target["intendedPhases"], "excludedPhase": target["excludedPhase"],
                    "identityMeaning": target["identityMeaning"], "inventoryOwnershipChanged": False,
                })
            elif n == 237:
                addition.update({
                    "nativeSpec": target["nativeSpec"],
                    "dimensionsScope": "existing support footprint; no mechanism-specific height inferred",
                    "sourceArtIsMountedSupportComposite": True,
                })
            else:
                addition["dimensionsAuthorDesignMetres"] = target["dimensions"]
            additions.append(addition)
        for row in batch_history:
            row["selectedFinal"] = (row["key"], row["iteration"], row["sha256"]) in selected_tokens
        histories.extend(batch_history)
        counts[str(n)] = {
            "selectedTargets": len(targets), "final": len(selected_tokens),
            "generatedOutputs": len(batch_history), "nonfinalNativeOutputs": len(batch_history) - len(selected_tokens),
            "backlogTargetsWithZeroFinalPng": len(targets) - len(selected_tokens),
            "blockedServiceAttemptCount": sum(row.get("attemptCount", 0) for row in blocked.values()),
        }
        if handoff is not None:
            expected_tokens = {(row["key"], row["iteration"], row["sha256"]) for row in handoff["finals"]}
            require(selected_tokens == expected_tokens, "Art237 selected images differ from the frozen handoff")
            require(len(batch_history) == handoff["counts"]["nativeHistoryPngs"],
                    "Art237 physical history count differs from frozen handoff")
            require(counts[str(n)]["blockedServiceAttemptCount"] == handoff["counts"]["failedCallsWithoutImage"],
                    "Art237 failed calls and frozen receipt disagree")
    require(counts["236"]["final"] == 1, "Art236 must contain exactly one shared actor pose")
    require(counts["238"]["final"] == 5, "Art238 must contain five accepted structural props")
    require(counts["237"]["selectedTargets"] == 6, "Art237 source target inventory changed")
    require(counts["237"]["final"] + counts["237"]["backlogTargetsWithZeroFinalPng"] == 6,
            "Art237 partial selection is not fully accounted for")
    for lock in locks:
        require(sha(Path(lock["path"]).read_bytes()) == lock["sha256"],
                "An input changed during coverage collection; wait for the actual freeze")
    return additions, backlog, histories, counts, locks


def finalize(workspace, repo, raw, previous, prior_assets, prior_audit):
    new, backlog, histories, generations, locks = collect_new(workspace)
    assets = prior_assets + new
    require(len({row["id"] for row in assets}) == len(assets), "Duplicate final identity")
    require(len({row["sha256"] for row in assets}) == len(assets), "Duplicate final PNG bytes")
    prior_summary = prior_audit["summary"]
    categories = Counter(row["coverageCategory"] for row in assets)
    new_categories = Counter(row["coverageCategory"] for row in new)
    generated = prior_summary["physicalHistoricalOutputCount"] + len(histories)
    total_bytes, new_bytes = sum(row["bytes"] for row in assets), sum(row["bytes"] for row in new)
    report = {
        "schemaVersion": 2, "project": "DEADWALL — Last Enclosure",
        "reportDate": datetime.now(ZoneInfo("Europe/Paris")).date().isoformat(), "timezone": "Europe/Paris",
        "sourceMainRevision": BASE, "scopeStatus": "source_proposals_after_explicit_art237_freeze",
        "previousCoverageReport": {
            "path": PRIOR_PATH, "sha256": PRIOR_SHA, "presentAtCurrentMainRevision": BASE,
            "url": f"https://github.com/{REPOSITORY}/blob/{BASE}/{PRIOR_PATH}",
            "unchangedCopy": "prior-coverage-art222-235.json",
        },
        "finalSpriteCount": len(assets), "previousFinalSpriteCount": len(prior_assets),
        "newFinalSpriteCount": len(new), "previousExteriorCount": 69, "previousTypedPropCount": 30,
        "newActorCount": new_categories["actor"], "newMechanismCount": new_categories["mechanism"],
        "newTypedPropCount": new_categories["prop"], "categoryTotals": dict(categories),
        "nativeBuildingTypesWithSourceProposal": 62, "otherExteriorSitesOrVariants": 7,
        "verifiedDirectNativeCodexAssociations": 42,
        "nativeBuildingTypesWithUnresolvedCodexReferences": 20,
        "historicalCodexAssociationsChanged": False,
        "previousGeneratedOutputs": prior_summary["physicalHistoricalOutputCount"],
        "previousSupersededOutputs": prior_summary["physicalNonfinalOutputCount"],
        "newGenerationCounts": generations, "retainedGeneratedOutputCount": generated,
        "retainedNonfinalOutputCount": generated - len(assets),
        "allFinalByteInputsVerified": True, "priorFinalsAndHistoryMatchCurrentMainGitBlobs": True,
        "totalFinalPngBytes": total_bytes, "newFinalPngBytes": new_bytes,
        "blockedTargetCount": len(backlog), "blockedTargetsFinalPngCount": 0,
        "runtimeIntegrationPerformed": False, "gameplaySourcesModified": False,
        "metricProjectionCertified": False, "historicalArt221InventoryRecovered": False,
        "ownManifestSha256Included": False, "ownOutputCommitShaIncluded": False,
        "coverageBuilderSha256": sha(Path(__file__).read_bytes()),
        "scopeLimit": (
            "Final source proposals across exterior, prop, shared actor and mechanism categories. "
            "The count does not represent building types, all author plans, runtime integration, "
            "every variant, rotation, animation, interior or historical Art221 output."
        ),
        "knownBacklog": [
            "Every excluded target below has zero selected PNGs; any failed service receipt is not an image.",
            "Calibrate and register source proposals in a separate verified runtime integration.",
            "Keep the 20 unresolved historical Codex associations unchanged.",
        ],
        "blockedTargets": backlog, "assets": assets,
    }
    out = workspace / "resume-art236/coverage"
    out.mkdir(parents=True, exist_ok=True)
    (out / "prior-coverage-art222-235.json").write_bytes(raw)
    dump(out / "prior-files-audit.json", prior_audit)
    dump(out / "new-inputs-snapshot.json", {"sourceRevision": BASE, "inputs": locks, "nativeOutputs": histories})
    dump(out / "coverage-art222-238.json", report)
    lines = [
        "# DEADWALL — inventaire des propositions source Art222 à Art238", "",
        f"**{len(assets)} PNG finaux distincts**, dont {len(new)} nouveaux : "
        f"{new_categories['actor']} pose de survivant, {new_categories['mechanism']} mécanismes acceptés "
        f"et {new_categories['prop']} objets de jardin.", "",
        "| Ensemble | PNG finaux | Portée |", "| --- | ---: | --- |",
        "| Art222–232 | 69 | 62 types natifs de bâtiments et 7 autres sites ou variantes |",
        "| Art233–235 | 30 | Objets dédiés déjà présents sur main |",
        "| Art236 | 1 | Une pose inerte du modèle de survivant partagé |",
        f"| Art237 | {new_categories['mechanism']} | Sélection partielle de mécanismes existants montés sur support |",
        "| Art238 | 5 | Objets structurels de jardin, variante 0 |", "",
        f"Les 99 fichiers finaux antérieurs ont été physiquement relus et comparés à leurs SHA-256, tailles, "
        f"manifestes individuels et blobs Git du commit {BASE}. Le balayage des dossiers assets retrouve "
        "exactement les mêmes 99 chemins. Les 153 sorties historiques sont également présentes et vérifiées : "
        "99 finales et 54 remplacées. L’inventaire antérieur est conservé sans modification.", "",
        "Les 42 associations Codex directes et les 20 associations historiques non résolues sont inchangées. "
        "Les 69 extérieurs se composent toujours de 62 types natifs et 7 autres sites ou variantes.", "",
        f"Les nouveaux historiques contiennent {len(histories)} PNG natifs réels. Le cumul atteint {generated} "
        f"sorties conservées, dont {generated-len(assets)} non finales. Les images finales représentent "
        f"{total_bytes:,} octets, dont {new_bytes:,} octets pour les trois nouveaux packs.", "",
        "## Cibles conservées au backlog", "",
        "| Pack | Cible | PNG final | Statut |", "| --- | --- | ---: | --- |",
    ]
    for row in backlog:
        lines.append(f"| {row['batch']} | {row['name']} | 0 | Aucun PNG accepté ; preuves et raisons dans le JSON |")
    if not backlog:
        lines.append("| Aucun | — | 0 | Aucun refus dans les sélections figées |")
    lines += [
        "", "Un refus du service ne constitue pas une génération PNG. Une sortie conservée pour historique "
        "et rejetée en revue n’entre pas dans les finales. Les références canoniques et les atlas ne sont pas "
        "comptés comme de nouvelles images générées.", "",
        "## Limites", "",
        "Les représentations Canvas ou composites existantes restent en place. Le corps, son sac et son inventaire "
        "gardent leurs propriétaires ; les mécanismes ne créent pas de stock ou d’effet ; les objets de jardin "
        "n’ajoutent pas de service actif. Les propositions ne sont pas encore enregistrées dans le moteur. "
        "Ni les pivots, ni les collisions, ni les dimensions métriques, ni toutes les variantes ou animations "
        "ne sont certifiés par ce comptage. L’inventaire historique Art221 demeure hors de cette couverture.", "",
    ]
    (out / "coverage-art222-238.md").write_text("\n".join(lines))
    sums = [f"{sha(p.read_bytes())}  {p.name}" for p in sorted(out.iterdir())
            if p.is_file() and p.name != "SHA256SUMS.txt"]
    (out / "SHA256SUMS.txt").write_text("\n".join(sums) + "\n")
    return {
        "finals": len(assets), "newFinals": len(new), "newCategories": dict(new_categories),
        "blockedTargets": len(backlog), "newNativeGenerations": len(histories),
        "output": str(out), "coverageSha256": sha((out / "coverage-art222-238.json").read_bytes()),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--repo", type=Path)
    parser.add_argument("--verify-prior", action="store_true", help="Read-only old inventory audit; no output files")
    parser.add_argument("--finalize", action="store_true", help="Write report only after the root's explicit go-ahead")
    parser.add_argument("--art237-frozen", action="store_true", help="Assert all Art237 decisions and files are frozen")
    args = parser.parse_args()
    require(not (args.verify_prior and args.finalize), "Choose audit or finalization")
    require(not args.finalize or args.art237_frozen, "Finalization requires the explicit Art237 freeze flag")
    repo = args.repo or args.workspace / "deadwall-art236"
    raw, previous, assets, audit = audit_previous(repo)
    if args.finalize:
        result = finalize(args.workspace, repo, raw, previous, assets, audit)
    else:
        result = {"mode": "prior_audit_only", "newTotalNotComputed": True, **audit["summary"]}
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
