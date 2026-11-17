#!/usr/bin/env python3
"""Assemble a source-only DEADWALL Art226 pack from exact generation records.

All inputs are explicit arguments. PNG bytes are copied, never rewritten.
The selected images require a visual-review record bound to their SHA-256.
This local assembler does not publish, install assets or alter game sources.
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


ORDER = ("sawmill", "warehouse", "freight", "centralKitchen", "generatorRoom", "quarry")
EXPECTED = {
    "sawmill": ("DW-0381", [40, 26], [0]),
    "warehouse": ("DW-0221", [46, 29], [0]),
    "freight": ("DW-0289", [46, 24], [0]),
    "centralKitchen": ("DW-0073", [38, 29], [0]),
    "generatorRoom": ("DW-0331", [16, 13], [0]),
    "quarry": ("DW-0403", [30, 24], [0]),
}
DEFAULT_BASE = "f3ba02a5b73a55120c02c21d5703902ea3e901d9"
REPOSITORY = "darknigthmare/deadwall-last-enclosure"


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


def records(path: Path) -> list:
    value = load_json(path)
    if isinstance(value, dict):
        value = value.get("results", value.get("records"))
    if not isinstance(value, list):
        raise ValueError(f"Expected a record array: {path}")
    return value


def resolve_input(value: str, record_file: Path) -> Path:
    path = Path(value)
    return path.resolve() if path.is_absolute() else (record_file.parent / path).resolve()


def audit_png(path: Path, output_path: str) -> dict:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Invalid PNG signature: {path}")
    width, height, bits, color, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", data[16:29]
    )
    with Image.open(path) as check:
        check.verify()
    with Image.open(path) as im:
        im.load()
        if im.mode != "RGBA" or im.size != (width, height):
            raise ValueError(f"Expected matching native RGBA header: {path}")
        alpha = im.getchannel("A")
        histogram = alpha.histogram()
        boxes, margins = {}, {}
        for threshold in (1, 8, 32, 128, 240):
            box = alpha.point(lambda v, t=threshold: 255 if v >= t else 0).getbbox()
            boxes[str(threshold)] = list(box) if box else None
            margins[str(threshold)] = (
                {"left": box[0], "top": box[1], "right": width-box[2], "bottom": height-box[3]}
                if box else None
            )
        if histogram[0] == 0 or not boxes["8"]:
            raise ValueError(f"No transparent background or visible body: {path}")
        if min(margins["8"].values()) <= 0:
            raise ValueError(f"Visible body touches canvas boundary at alpha>=8: {path}")
        edges = {
            "top": (0, 0, width, 1), "bottom": (0, height-1, width, height),
            "left": (0, 0, 1, height), "right": (width-1, 0, width, height),
        }
        return {
            "file": output_path, "bytes": len(data), "sha256": sha256(data),
            "width": width, "height": height, "mode": im.mode,
            "pngBitDepth": bits, "pngColorType": color,
            "pngCompressionMethod": compression, "pngFilterMethod": filtering,
            "pngInterlaceMethod": interlace, "pillowVerifyPassed": True,
            "alphaExtrema": list(alpha.getextrema()),
            "fullyTransparentPixels": histogram[0],
            "fullyTransparentFraction": histogram[0]/(width*height),
            "lowAlphaPixels1to7": sum(histogram[1:8]),
            "boundsAlphaAtLeast": boxes, "marginsAlphaAtLeast": margins,
            "borderAlphaMaximum": {name: alpha.crop(box).getextrema()[1] for name, box in edges.items()},
            "cornerAlpha": [alpha.getpixel(p) for p in [(0,0),(width-1,0),(0,height-1),(width-1,height-1)]],
            "visibleBodyWithinCanvasAtAlpha8": True,
            "nativeBytesPreserved": True, "pixelEditingResizingCroppingPerformed": False,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--selection", type=Path, required=True)
    parser.add_argument("--history-records", type=Path, nargs="+", required=True)
    parser.add_argument("--final-records", type=Path, required=True)
    parser.add_argument("--review", type=Path, required=True)
    parser.add_argument("--prior-publications", type=Path)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--base-revision", default=DEFAULT_BASE)
    parser.add_argument("--date", required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.date):
        raise ValueError("Use an explicit YYYY-MM-DD date in Europe/Paris")
    repo = args.repo.resolve()
    output = (args.output or repo/"art-packs"/"DEADWALL_Art226").resolve()
    if output != repo/"art-packs"/"DEADWALL_Art226":
        raise ValueError("Output must be this repository's art-packs/DEADWALL_Art226")
    base = git_read(repo, "rev-parse", args.base_revision+"^{commit}").decode().strip()
    if git_read(repo, "rev-parse", "HEAD").decode().strip() != base:
        raise ValueError("Start from the unchanged declared base commit")
    selection = load_json(args.selection)
    targets = {row["type"]: row for row in selection["targets"]}
    if set(targets) != set(ORDER):
        raise ValueError("Selection must contain the six exact Art226 types")
    final = records(args.final_records)
    final_by_key = {row["key"]: row for row in final}
    if len(final) != 6 or set(final_by_key) != set(ORDER):
        raise ValueError("Final records must contain exactly six unique sprites")
    review = load_json(args.review)
    if set(review) != set(ORDER):
        raise ValueError("Visual review must cover all six selected outputs")
    prior_publications = load_json(args.prior_publications) if args.prior_publications else []
    if prior_publications:
        if {row["batch"] for row in prior_publications} != {"art222", "art223", "art224"} or len(prior_publications) != 3:
            raise ValueError("Prior publication records must identify Art222, Art223 and Art224 once each")
        expected_counts = {"art222": (8, 2), "art223": (6, 9), "art224": (6, 1)}
        for row in prior_publications:
            if (row["finalSpriteCount"], row["supersededCandidateCount"]) != expected_counts[row["batch"]]:
                raise ValueError("Prior publication counts do not match the preserved continuation")
            if not re.fullmatch(r"[0-9a-f]{40}", row["headRevision"]):
                raise ValueError("Prior publication must include an exact commit SHA")
    planned: dict[str, bytes] = {}

    def put(rel: str, data: bytes) -> None:
        path = Path(rel)
        if path.is_absolute() or ".." in path.parts:
            raise ValueError(f"Unsafe pack path: {rel}")
        if rel in planned and planned[rel] != data:
            raise ValueError(f"Conflicting pack entries: {rel}")
        planned[rel] = data

    def put_json(rel: str, value) -> None:
        put(rel, json_bytes(value))

    source_by_name, source_index = {}, []
    input_to_pack = {}
    for source in selection["sources"]:
        rel = source["path"]
        path = resolve_input(rel, args.selection)
        data = path.read_bytes()
        if sha256(data) != source["sha256"] or git_blob(data) != source["gitBlob"]:
            raise ValueError(f"Reference digest mismatch: {path}")
        put(rel, data)
        entry = git_read(repo, "ls-tree", base, "--", source["repositoryPath"])
        base_blob = entry.split()[2].decode() if entry else None
        checked = {**source, "baseRevisionCompared": base, "baseGitBlob": base_blob,
                   "sameBlobAtPublicationBase": base_blob == source["gitBlob"],
                   "sourceDigestVerified": True}
        source_index.append(checked)
        source_by_name[path.name] = checked
        input_to_pack[str(path)] = rel
    if len(source_index) != 13:
        raise ValueError("Art226 expects the thirteen prepared references")
    put_json("references/sources.json", source_index)
    put("references/selection-at-retrieval.json", args.selection.read_bytes())

    history = []
    seen = {}
    for input_number, record_file in enumerate([*args.history_records, args.final_records], 1):
        put(f"records/input-results-{input_number:02d}.json", record_file.read_bytes())
        for row in records(record_file):
            key = row["key"]
            if key not in EXPECTED or row["id"] != EXPECTED[key][0]:
                raise ValueError("Unexpected generation ID or type")
            if not row.get("prompt") or not row.get("promptIsVerbatim"):
                raise ValueError("Exact prompts are required")
            if not row.get("transparentBackgroundRequested"):
                raise ValueError("Native transparent output must be requested")
            path = resolve_input(row["generatedSourcePath"], record_file)
            data = path.read_bytes()
            fingerprint = (key, row.get("iteration"), sha256(data), row["prompt"])
            identity = (key, row.get("iteration"))
            if identity in seen:
                if seen[identity] != fingerprint:
                    raise ValueError(f"Conflicting iteration records: {identity}")
                continue
            seen[identity] = fingerprint
            selected = final_by_key[key]
            selected_path = resolve_input(selected["generatedSourcePath"], args.final_records)
            chosen = data == selected_path.read_bytes()
            filename = targets[key]["filename"]
            rel = f"assets/art226/regional/{filename}" if chosen else f"references/iterations/{EXPECTED[key][0]}_{key}-v{row.get('iteration', 1)}.png"
            put(rel, data)
            input_to_pack[str(path)] = rel
            history.append({"raw": row, "recordFile": record_file, "source": path,
                            "path": rel, "selected": chosen, "sha256": sha256(data), "bytes": len(data)})
    history.sort(key=lambda item: (ORDER.index(item["raw"]["key"]), item["raw"].get("iteration", 0)))
    normalized = []
    for item in history:
        row = item["raw"]
        reference_paths = []
        for reference in row.get("referenceImages", []):
            path = resolve_input(reference, item["recordFile"])
            rel = input_to_pack.get(str(path))
            if rel is None and path.name == "buildings-atlas.webp":
                if sha256(path.read_bytes()) == source_by_name[path.name]["sha256"]:
                    rel = source_by_name[path.name]["path"]
            if rel is None:
                raise ValueError(f"Generation reference missing from pack: {path}")
            reference_paths.append(rel)
        normalized.append({
            "key": row["key"], "id": row["id"], "name": row["label"],
            "iteration": row.get("iteration"), "prompt": row["prompt"],
            "promptIsVerbatim": True, "generator": row.get("generator", "OpenAI ImageGen intégré"),
            "transparentBackgroundRequested": True, "referenceImages": reference_paths,
            "output": item["path"], "selected": item["selected"], "sha256": item["sha256"],
            "bytes": item["bytes"], "nativeBytesPreserved": True,
        })
    if sum(row["selected"] for row in normalized) != 6:
        raise ValueError("History must identify exactly six selected output records")
    put_json("generation-history.json", normalized)
    put_json("generation-prompts.json", normalized)

    source_map, asset_rows, audit_rows = [], [], []
    for key in ORDER:
        ident, footprint, levels = EXPECTED[key]
        target = targets[key]
        sheet = planned[f"references/{ident}.md"].decode("utf-8")
        pilot = re.search(r"Plan source : `([^`]+)`; enveloppe bâtie actuelle (\[[^\]]+\]) m; niveaux (\[[^\]]+\])", sheet)
        parcel = re.search(r"Enveloppe de parcelle proposée : de (\d+) × (\d+) m à (\d+) × (\d+) m\. Niveaux proposés : ([^.]+)\.", sheet)
        if not pilot or not parcel or pilot[1] != key or json.loads(pilot[2]) != footprint or json.loads(pilot[3]) != levels:
            raise ValueError(f"Pilot dimensions do not match preserved source: {ident}")
        row = final_by_key[key]
        path = resolve_input(row["generatedSourcePath"], args.final_records)
        digest = sha256(path.read_bytes())
        note = review[key]
        if note.get("sha256") != digest or not note.get("observation"):
            raise ValueError(f"Visual review does not match selected bytes: {key}")
        rel = f"assets/art226/regional/{target['filename']}"
        audit_rows.append(audit_png(path, rel))
        mapping = {
            "id": ident, "name": target["preset"]["name"], "type": key,
            "sourceSheet": f"references/{ident}.md", "sourceRevision": target["source"]["revision"],
            "pilotBuildingFootprintMetres": footprint, "pilotLevels": levels,
            "nativeRooms": target["nativeRooms"], "nativeOutdoorKinds": target["nativeOutdoorKinds"],
            "authorProposedParcelRangeMetres": {"minimum": [int(parcel[1]), int(parcel[2])], "maximum": [int(parcel[3]), int(parcel[4])]},
            "authorProposedLevelsText": parcel[5], "pilotAndParcelAreDifferentConcepts": True,
            "existingGenericRoofFamily": target["roofFamily"], "existingRoofChoices": target["roofChoices"],
        }
        source_map.append(mapping)
        asset_rows.append({
            "id": ident, "type": key, "name": mapping["name"], "path": rel,
            "sha256": digest, "bytes": len(path.read_bytes()), "iteration": row.get("iteration"),
            "pilotBuildingFootprintMetres": footprint, "pilotLevels": levels,
            "status": "generated_review_candidate_not_runtime_integrated",
        })
    put_json("references/SOURCE_MAP.json", source_map)
    put_json("qa/visual-review-records.json", review)
    put_json("qa/image-audit.json", {
        "schemaVersion": 1, "batch": "art226", "checkedOn": args.date, "timezone": "Europe/Paris",
        "method": "PNG signature/IHDR and Pillow verify, native RGBA alpha histogram and bounds, SHA-256. No write, crop, resize or pixel transformation.",
        "alphaThresholds": [1, 8, 32, 128, 240], "boundsConvention": "left/top inclusive, right/bottom exclusive",
        "alphaInterpretation": "Hidden RGB colors with alpha=0 are transparent. Low alpha1–7 noise is reported separately. Alpha>=8 margins are a technical visibility indicator, not a physical footprint or fidelity certificate.",
        "finalSpriteCount": 6, "allRgba": True, "allVisibleBodiesWithinCanvasAtAlpha8": True,
        "nativeBytesPreserved": True, "assets": audit_rows,
    })
    intermediate_count = len(normalized)-6
    notes = ["# Art226 — revue visuelle", "", f"Revue du {args.date}, Europe/Paris, liée aux SHA-256 des six PNG retenus.", "",
             "| Fiche | Bâtiment | Observation de la version retenue |", "|---|---|---|"]
    notes += [f"| {EXPECTED[k][0]} | {targets[k]['preset']['name']} | {review[k]['observation']} |" for k in ORDER]
    notes += ["", "Les silhouettes et le canal alpha sont contrôlés séparément. Les images natives ne sont ni recadrées ni redimensionnées. Les coordonnées de portes, mètres par pixel, ancrages, collisions, ouverture des intérieurs et tri de profondeur restent à vérifier dans le moteur. Aucun résultat de fidélité métrique ou pixel pour pixel 1:1 n’est certifié.", ""]
    put("qa/visual-review.md", "\n".join(notes).encode("utf-8"))
    provenance = {
        "schemaVersion": 1, "project": "DEADWALL — Last Enclosure", "batch": "art226",
        "assembledOn": args.date, "timezone": "Europe/Paris", "generator": "OpenAI ImageGen intégré",
        "referenceRepository": REPOSITORY, "publicationBaseRevision": base,
        "publicationBaseIsOutputCommit": False, "finalSpriteCount": 6,
        "generationCount": len(normalized), "supersededCandidateCount": intermediate_count,
        "nativeOutputBytesPreserved": True, "pixelEditingResizingCroppingPerformed": False,
        "scope": "Six extérieurs dédiés aux ateliers, à la logistique et aux locaux techniques ; pack de préparation artistique.",
        "styleReference": source_by_name["buildings-atlas.webp"],
        "fidelity": {"observed": ["Atlas réel utilisé", "Programmes et niveaux documentés", "Accès visibles au sol", "Silhouettes et alpha contrôlés"],
                     "notCertified": ["Projection métrique exacte", "Mètres par pixel", "Identité pixel pour pixel", "Ancres et collisions", "Position des accès et intégration en jeu"]},
        "integration": {"performed": False, "runtimeSourceChanged": False, "runtimeAssetRegistrationChanged": False, "testsChanged": False},
        "validation": {"packTechnicalAudit": "passed", "runtimeCheckThisPack": "not_run_by_assembler", "browser": "not_run", "windows": "not_run"},
        "sourcesIndex": "references/sources.json", "sourceMapping": "references/SOURCE_MAP.json",
        "prompts": "generation-prompts.json", "generationHistory": "generation-history.json",
        "technicalAudit": "qa/image-audit.json", "visualReview": "qa/visual-review.md", "assets": asset_rows,
    }
    put_json("PROVENANCE.json", provenance)
    put_json("REPRISE.json", {
        "schemaVersion": 1, "project": provenance["project"], "batch": "art226",
        "savedOn": args.date, "timezone": "Europe/Paris",
        "intent": "Continuer les sprites manquants depuis le point conservé, sans régénérer les lots précédents.",
        "completedSpriteIds": [row["id"] for row in asset_rows],
        "finalAssets": [{"id": row["id"], "path": row["path"], "sha256": row["sha256"]} for row in asset_rows],
        "priorArt221Regenerated": False, "priorArt222Regenerated": False, "priorArt223Regenerated": False, "priorArt224Regenerated": False,
        "exclusionEvidence": selection["exclusions"], "publicationBaseRevision": base,
        "priorPublishedPacks": prior_publications,
        "continuationCounts": {
            "priorPublishedFinalSprites": sum(row["finalSpriteCount"] for row in prior_publications),
            "art226FinalSprites": 6,
            "distinctFinalSpritesAcrossArt222Art223Art224Art226": len(set(selection["exclusions"]["art222CodexIds"]+selection["exclusions"]["art223CodexIds"]+selection["exclusions"]["art224CodexIds"]+[row["id"] for row in asset_rows])),
            "supersededCandidates": {"art222": 2, "art223": 9, "art224": 1, "art226": intermediate_count},
            "art225IsParallelCompanionNotCountedHere": True,
            "countsDescribeArtPacksNotRuntimeIntegration": True,
        },
        "integration": "not_performed", "publicationStatusAtAssembly": "prepared_locally_not_published_by_assembler",
        "nextSteps": ["Lire les PR et manifestes publiés avant de sélectionner la suite.", "Conserver les six PNG retenus et les itérations remplacées.", "Associer les futurs visuels aux fiches et types exacts.", "Calibrer projection, échelle, ancrages, portes et ouverture des intérieurs avant raccord au moteur.", "Après raccord, qualifier le commit réel par les contrôles du dépôt et le parcours joueur."],
        "knownLimits": selection["limits"][:2]+["Inventaire historique Art221 incomplet.", "Intégration au chargement et au rendu du jeu non effectuée.", "Fidélité métrique ou pixel pour pixel 1:1 non certifiée."],
    })
    table = []
    for row in source_map:
        w,h = row["pilotBuildingFootprintMetres"]
        lo,hi = row["authorProposedParcelRangeMetres"]["minimum"],row["authorProposedParcelRangeMetres"]["maximum"]
        table.append(f"| {row['id']} | {row['name']} | {w} × {h} m | {', '.join(map(str,row['pilotLevels']))} | {lo[0]} × {lo[1]} à {hi[0]} × {hi[1]} m |")
    readme = f"""# DEADWALL — Art226 : ateliers, logistique et locaux techniques

Ce pack conserve **six sprites extérieurs dédiés**, issus de l’atlas réel et des fiches natives du Codex, avec **{intermediate_count} sortie(s) intermédiaire(s)** et leurs prompts exacts.

## Contenu documenté

| Fiche | Bâtiment | Emprise bâtie du pilote | Niveaux du pilote | Parcelles auteur proposées |
|---|---|---:|---|---|
{chr(10).join(table)}

Les emprises des pilotes décrivent les bâtiments présents dans le moteur. Les plages de parcelles auteur décrivent d’autres propositions. Le sprite de carrière représente la halle technique fermée de 30 × 24 m effectivement décrite dans le plan natif, sans carrière à ciel ouvert ni niveau souterrain. La halle fret conserve son programme de manutention ; aucun train, service logistique ou nouveau réseau jouable n’est ajouté. `references/SOURCE_MAP.json` conserve les distinctions et les pièces natives.

## Fichiers et références

- `assets/art226/regional/` : six PNG retenus, copiés dans leurs octets natifs.
- `references/iterations/` : générations remplacées, si présentes.
- `references/` : treize références, sélection initiale, mapping et empreintes.
- `generation-prompts.json`, `generation-history.json`, `records/` : prompts exacts, relations d’entrée et sorties natives.
- `PROVENANCE.json`, `REPRISE.json` : périmètre, limites et point de reprise.
- `qa/` : mesures PNG/alpha et revue visuelle liée aux empreintes finales.
- `SHA256SUMS.txt` : empreintes de tous les autres fichiers du pack.

Les sources principales proviennent de `{selection['sourceMainRevision']}`. Le module de classification `remarkable217.js` provient de la révision distincte précisée dans `references/sources.json`. Les références sont comparées à la base de publication `{base}` ; aucune de ces révisions n’est présentée comme le commit de livraison du pack.

## Vérification et fidélité

Signatures PNG, décodage, dimensions, RGBA, alpha, marges visibles et empreintes sont contrôlés. Aucun recadrage, redimensionnement ou changement de pixels n’est effectué. Les couleurs RGB cachées sous alpha zéro ne constituent pas un fond opaque ; les pixels de très faible alpha sont recensés séparément.

Les programmes, niveaux et proportions demandés suivent les pilotes et l’atlas. **La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée.** Les façades sont des propositions artistiques fondées sur les usages, sans photographie canonique fournie. Ancres, mètres par pixel, portes, collisions, intérieurs et profondeur restent à calibrer dans le moteur.

## État d’intégration

**Pack de préparation artistique : intégration au moteur non effectuée.** Ces lieux possèdent déjà des plans, props, intérieurs et toitures génériques. Les PNG apportent des extérieurs dédiés ; ils ne créent pas six nouveaux lieux jouables.

Le pack ne modifie aucune source de jeu, règle de génération, sauvegarde, dépendance, test ni liste publique. Les contrôles d’images ne valent pas validation du jeu. Les résultats de `npm run check`, de CI, du navigateur et de Windows doivent être rapportés sur le commit réellement contrôlé dans la PR.

## Reprise et intégrité

Lire `REPRISE.json`, puis `PROVENANCE.json` avant de poursuivre. Pour vérifier les fichiers livrés depuis la racine de ce dossier :

```sh
sha256sum -c SHA256SUMS.txt
```

L’assemblage est réalisé par un outil local à arguments explicites ; les entrées et son empreinte sont consignées dans `records/assembly-inputs.json`. Il n’effectue aucune génération ni retouche. Les PNG et références nécessaires à la revue sont tous présents dans ce pack.
"""
    if prior_publications:
        readme += "\n## Continuité des publications\n\n"
        readme += "\n".join(f"- {row['batch'].capitalize()} : [{row['pullRequestLabel']}]({row['url']}), tête `{row['headRevision']}`, {row['finalSpriteCount']} sprites finaux et {row['supersededCandidateCount']} sorties remplacées conservées." for row in prior_publications)
        readme += f"\n\nLes PR précédentes conservent **20 sprites finaux distincts**. Art226 en apporte six supplémentaires, avec {intermediate_count} sortie(s) remplacée(s) propre(s) à ce lot. Le lot compagnon Art225 est suivi séparément dans son propre manifeste. Ces nombres décrivent la production artistique ; ils ne signifient pas que ces images sont chargées ou intégrées au rendu du jeu.\n"
    put("README_FR.md", readme.encode("utf-8"))
    put_json("records/assembly-inputs.json", {
        "baseRevision": base, "dateEuropeParis": args.date,
        "selectionSha256": sha256(args.selection.read_bytes()),
        "historyRecordSha256": [sha256(p.read_bytes()) for p in args.history_records],
        "finalRecordsSha256": sha256(args.final_records.read_bytes()),
        "visualReviewSha256": sha256(args.review.read_bytes()),
        "priorPublicationsSha256": sha256(args.prior_publications.read_bytes()) if args.prior_publications else None,
        "assemblerSha256": sha256(Path(__file__).read_bytes()),
        "nativePngBytesPreserved": True, "outputDeterministicForSameInputsAndExplicitDate": True,
        "assemblerIsLocalNotPartOfRuntime": True,
    })
    put("tools/assemble_art226.py", Path(__file__).read_bytes())
    expected_paths = set(planned)|{"SHA256SUMS.txt"}
    if output.exists():
        unknown = [str(p.relative_to(output)) for p in output.rglob("*") if p.is_file() and str(p.relative_to(output)) not in expected_paths]
        if unknown:
            raise ValueError(f"Pack contains unrecognized files: {unknown}")
    for rel,data in sorted(planned.items()):
        target = output/rel
        if target.is_symlink() or any(p.is_symlink() for p in target.parents if p != repo.parent):
            raise ValueError(f"Refusing output symlink: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.read_bytes() != data:
            target.write_bytes(data)
    checksum = "".join(f"{sha256(data)}  {rel}\n" for rel,data in sorted(planned.items()))
    (output/"SHA256SUMS.txt").write_text(checksum, encoding="utf-8")
    for rel,data in planned.items():
        if (output/rel).read_bytes() != data:
            raise RuntimeError(f"Output read-back mismatch: {rel}")
    if git_read(repo, "rev-parse", "HEAD").decode().strip() != base:
        raise RuntimeError("Repository revision changed during assembly")
    print(json.dumps({"pack": str(output), "baseRevision": base, "finalSpriteCount": 6,
                      "supersededCandidateCount": intermediate_count, "totalGeneratedPngCount": len(normalized),
                      "files": len(planned)+1, "bytes": sum(map(len,planned.values()))+len(checksum.encode()),
                      "checksumManifestSha256": sha256(checksum.encode()),
                      "nativePngCopiesVerified": True, "runtimeIntegrationPerformed": False}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
