#!/usr/bin/env python3
"""Read XLSX XML and reconcile the tracker against current repository sources.

This script never modifies a workbook. It checks every tracked identifier and
status, saved formula results, and the source workbook's retained native features.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
EXPECTED_SHEETS = ["Accueil", "Catalogue existant", "Extension typologies", "Variantes à concevoir", "Chantiers", "Règles seed", "Familles existantes", "Références", "Publication", "Légende", "Références métriques", "Avancement par type", "Inspection"]


def read_workbook(file):
    with zipfile.ZipFile(file) as z:
        corrupt = z.testzip()
        if corrupt is not None:
            raise AssertionError("Entrée XLSX corrompue : " + corrupt)
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            strings = ["".join(s.itertext()) for s in ET.fromstring(z.read("xl/sharedStrings.xml"))]
        relations = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
        result = {}
        for s in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
            target = relations[s.attrib[REL + "id"]]
            target = target[1:] if target.startswith("/") else "xl/" + target
            tree = ET.fromstring(z.read(target))
            cells = {}
            formulas = {}
            errors = []
            missing = []
            for c in tree.findall("m:sheetData/m:row/m:c", NS):
                typ = c.attrib.get("t")
                value_tag = c.find("m:v", NS)
                value = value_tag.text if value_tag is not None else None
                formula = c.find("m:f", NS)
                if typ == "s" and value is not None:
                    value = strings[int(value)]
                elif typ == "inlineStr":
                    value = "".join(c.find("m:is", NS).itertext())
                elif typ == "e":
                    errors.append([c.attrib["r"], value])
                elif typ == "b" and value is not None:
                    value = value == "1"
                elif typ in (None, "n") and value is not None:
                    value = float(value)
                    if value.is_integer():
                        value = int(value)
                if formula is not None:
                    formulas[c.attrib["r"]] = formula.text
                    if value_tag is None or (value is None and typ != "str"):
                        missing.append(c.attrib["r"])
                cells[c.attrib["r"]] = value
            pane = tree.find("m:sheetViews/m:sheetView/m:pane", NS)
            result[s.attrib["name"]] = {
                "cells": cells, "formulas": formulas, "errors": errors,
                "missing": missing,
                "pane": pane.attrib if pane is not None else None,
                "tables": len(tree.findall("m:tableParts/m:tablePart", NS)),
                "validations": len(tree.findall("m:dataValidations/m:dataValidation", NS)),
                "validationRules": [{"range": v.attrib.get("sqref"), "formula": v.findtext("m:formula1", namespaces=NS)} for v in tree.findall("m:dataValidations/m:dataValidation", NS)],
                "conditionalFormats": len(tree.findall("m:conditionalFormatting", NS)),
            }
        return result


def repository_data(root):
    command = """const d=require('./scripts/build-codex-tracker2026.cjs').currentData(process.cwd());
process.stdout.write(JSON.stringify({
programmes:d.catalogue.programmes.map(p=>({id:p.id,parent:p.parent,name:p.name,origin:p.origin,family:p.family,generation:p.generation,rooms:p.sourceRooms,props:p.authoredProps+p.authoredSlots,qualification:p.qualification,source:p.source})),
spaces:d.catalogue.rooms.length,props:d.catalogue.props.length,
typologies:d.typologies,variants:d.variants.map(v=>({id:v.id,typologyId:v.typologyId,typology:v.typology,domain:v.domain,number:v.number,status:v.status,playable:v.playable,inspection:v.inspection})),tasks:d.tasks,
inspection:require('./scripts/codex-inspection-progress2026.cjs').checkedReport(process.cwd()).report,
inspectionReportSha256:require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync('docs/codex/suivi-monde2026/inspection-20261021.json')).digest('hex')}));"""
    node = os.environ.get("CODEX_PRIMARY_RUNTIME_NODE", "node")
    run = subprocess.run([node, "-e", command], cwd=root, check=True, capture_output=True, text=True)
    return json.loads(run.stdout)


def assert_equal(actual, expected, message):
    if actual != expected:
        raise AssertionError(f"{message}: {actual!r} != {expected!r}")


def mapped_rows(sheet, count):
    rows = {}
    for r in range(6, count + 6):
        key = sheet["cells"].get("A" + str(r))
        if not key or key in rows:
            raise AssertionError("Identifiant vide ou dupliqué à la ligne " + str(r))
        rows[key] = r
    return rows


def verify(book, data, baseline=None):
    if not all(name in book for name in EXPECTED_SHEETS):
        raise AssertionError("Onglet requis manquant")
    assert_equal(list(book)[:11], EXPECTED_SHEETS[:11], "Onglets historiques déplacés ou supprimés")
    for name, tab in book.items():
        assert_equal(tab["errors"], [], name + " erreurs Excel")
        assert_equal(tab["missing"], [], name + " formules sans résultat enregistré")

    def reconcile(name, records, expected_columns):
        tab = book[name]
        by_id = mapped_rows(tab, len(records))
        assert_equal(set(by_id), {r["id"] for r in records}, name + " identifiants")
        for item in records:
            row = by_id[item["id"]]
            for column, expected in expected_columns(item).items():
                actual = tab["cells"].get(column + str(row))
                assert_equal(actual, expected, name + " " + item["id"] + " " + column)
        return by_id

    reconcile("Catalogue existant", data["programmes"], lambda p: {"B": p["parent"], "C": p["origin"], "D": p["family"], "E": p["name"], "F": p["generation"], "G": p["rooms"], "H": p["props"], "I": p["qualification"]})
    type_rows = reconcile("Extension typologies", data["typologies"], lambda t: {"B": t["domain"], "C": t["name"], "D": t["targetVariants"], "E": t["status"]})
    for typology in data["typologies"]:
        address = "L" + str(type_rows[typology["id"]])
        expected = sum(v["typologyId"] == typology["id"] for v in data["variants"])
        assert_equal(book["Extension typologies"]["cells"].get(address), expected, "Compteur de variantes " + typology["id"])
        if address not in book["Extension typologies"]["formulas"]:
            raise AssertionError("Compteur de typologie figé : " + address)
    reconcile("Variantes à concevoir", data["variants"], lambda v: {"B": v["typologyId"], "C": v["domain"], "D": v["typology"], "E": v["number"], "F": v["status"], "J": "Oui" if v["playable"] else "Non"})
    task_rows = reconcile("Chantiers", data["tasks"], lambda t: {"B": t["typologyId"], "C": t["domain"], "D": t["name"], "E": t["deliverable"], "F": t["priority"], "G": t["status"], "H": t["owner"], "I": t["acceptance"]})
    for task in data["tasks"]:
        proof = book["Chantiers"]["cells"].get("J" + str(task_rows[task["id"]])) or ""
        if task.get("evidence"):
            if not proof.endswith(task["evidence"]) and proof != task["evidence"]:
                raise AssertionError("Preuve non conservée : " + task["id"])
        elif proof:
            raise AssertionError("Preuve inventée : " + task["id"])
        if task["status"] == "Validé" and not proof.strip():
            raise AssertionError("Validation sans preuve : " + task["id"])

    counts = {
        "A6": len(data["programmes"]), "D6": len({p["parent"] for p in data["programmes"]}),
        "G6": len(data["typologies"]), "J6": len(data["variants"]),
        "C13": data["spaces"], "C14": data["props"], "C15": len(data["tasks"]),
        "K13": sum(t["status"] == "À faire" for t in data["tasks"]),
        "K14": sum(t["status"] == "En cours" for t in data["tasks"]),
        "K15": sum(t["status"] == "Validé" for t in data["tasks"]),
        "C16": sum(t["status"] == "Validé" for t in data["tasks"]),
        "C17": 0, "C18": sum(v["playable"] for v in data["variants"]),
        "K16": sum(v["status"] != "À concevoir" for v in data["variants"]),
        "K17": sum(v["status"] == "À concevoir" for v in data["variants"]),
        "K18": sum(v["playable"] for v in data["variants"]),
    }
    for cell, expected in counts.items():
        assert_equal(book["Accueil"]["cells"].get(cell), expected, "Résumé " + cell)
        if cell not in ("C13", "C14") and cell not in book["Accueil"]["formulas"]:
            raise AssertionError("Compteur figé : " + cell)

    stages = ["dimensions", "architecture", "seed", "props", "loot", "rencontres", "services", "art", "sauvegarde", "qa"]
    matrix = book["Avancement par type"]
    matrix_rows = mapped_rows(matrix, len(data["typologies"]))
    tasks_by_id = {t["id"]: t for t in data["tasks"]}
    for typology in data["typologies"]:
        row = matrix_rows[typology["id"]]
        validated = 0
        for c, stage in enumerate(stages, 2):
            status = tasks_by_id[typology["id"] + "/" + stage]["status"]
            address = chr(65 + c) + str(row)
            assert_equal(matrix["cells"].get(address), status, "Matrice " + address)
            if address not in matrix["formulas"]:
                raise AssertionError("Statut de matrice figé : " + address)
            validated += status == "Validé"
        assert_equal(matrix["cells"].get("M" + str(row)), validated, "Étapes validées")
        assert_equal(matrix["cells"].get("N" + str(row)), len(stages) - validated, "Étapes restantes")
    assert_equal(matrix["cells"].get("M86"), counts["K15"], "Total des étapes validées")
    assert_equal(matrix["cells"].get("N86"), len(data["tasks"]) - counts["K15"], "Total des étapes restantes")

    report = data["inspection"]
    inspected = {}
    variants_by_id = {v["id"]: v for v in data["variants"]}
    inspection_keys = ["rooms", "furnishedRooms", "props", "refused", "walls", "transitions", "levels"]
    for record in report["records"]:
        variant = variants_by_id[record["id"]]
        assert_equal(variant["status"], "Inspection physique", "Statut d’inspection " + record["id"])
        assert_equal(variant["playable"], False, "Campagne indûment validée " + record["id"])
        for key in inspection_keys:
            assert_equal(variant["inspection"][key], record[key], "Source d’inspection " + record["id"] + "/" + key)
        total = inspected.setdefault(record["typologyId"], dict.fromkeys(["plans", "passed", "playable"] + inspection_keys, 0))
        total["plans"] += 1
        total["passed"] += record["pass"] is True
        total["playable"] += variant["playable"]
        for key in inspection_keys:
            total[key] += record[key]
    inspection_sheet = book["Inspection"]
    inspection_rows = mapped_rows(inspection_sheet, len(inspected))
    assert_equal(set(inspection_rows), set(inspected), "Typologies de la feuille Inspection")
    columns = {"C": "plans", "D": "rooms", "E": "furnishedRooms", "F": "props", "G": "refused", "H": "walls", "I": "transitions", "J": "levels", "K": "passed", "L": "playable"}
    names = {t["id"]: t["name"] for t in data["typologies"]}
    for type_id, aggregate in inspected.items():
        row = inspection_rows[type_id]
        assert_equal(inspection_sheet["cells"].get("B" + str(row)), names[type_id], "Nom de la typologie inspectée")
        for column, key in columns.items():
            assert_equal(inspection_sheet["cells"].get(column + str(row)), aggregate[key], "Inspection " + type_id + "/" + key)
    for column, key in columns.items():
        expected = sum(t[key] for t in inspected.values())
        address = column + "14"
        assert_equal(inspection_sheet["cells"].get(address), expected, "Total de l’inspection " + key)
        if address not in inspection_sheet["formulas"]:
            raise AssertionError("Total d’inspection figé : " + address)
        if key != "playable":
            assert_equal(report["summary"][key], expected, "Somme du rapport " + key)
    assert_equal(inspection_sheet["cells"].get("C22"), report["sourceHash"], "Empreinte des plans inspectés")
    assert_equal(inspection_sheet["cells"].get("C25"), data["inspectionReportSha256"], "Empreinte du rapport d’inspection")
    assert_equal(report["summary"]["lootContainersCreated"], 0, "Stock de campagne ajouté")
    assert_equal(report["summary"]["connectedServices"], 0, "Service de campagne ajouté")
    variant_validation = [v["formula"] for v in book["Variantes à concevoir"]["validationRules"] if v["range"] == "F6:F4005"]
    if len(variant_validation) != 1 or "Inspection physique" not in variant_validation[0]:
        raise AssertionError("Le nouveau statut n’est pas proposé dans la liste de validation")
    assert_equal(book["Légende"]["cells"].get("A27"), "Inspection physique", "Légende du nouveau statut")

    if baseline:
        for name in EXPECTED_SHEETS[:11]:
            for feature in ("pane", "tables", "validations", "conditionalFormats"):
                assert_equal(book[name][feature], baseline[name][feature], name + " conservation " + feature)
        for name in ("Règles seed", "Familles existantes", "Références", "Légende"):
            old = {k: v for k, v in baseline[name]["cells"].items() if v is not None}
            new = {k: v for k, v in book[name]["cells"].items() if v is not None}
            if name == "Légende":
                new.pop("A27", None)
                new.pop("B27", None)
            assert_equal(new, old, name + " contenu historique")
            assert_equal(book[name]["formulas"], baseline[name]["formulas"], name + " formules historiques")
    return {"sheets": len(book), "programmes": len(data["programmes"]), "typologies": len(data["typologies"]), "variants": len(data["variants"]), "tasks": len(data["tasks"]), "formulas": sum(len(s["formulas"]) for s in book.values()), "formulaErrors": 0, "missingFormulaCaches": 0, "validatedTasks": counts["K15"], "inProgressTasks": counts["K14"], "pendingTasks": counts["K13"], "playableVariants": counts["C18"], "inspectionPlans": len(report["records"]), "inspectionTypes": len(inspected), "inspectionProps": report["summary"]["props"], "inspectionRefused": report["summary"]["refused"], "preservedHistoricalFeatures": bool(baseline), "scope": "XLSX source reconciliation; does not certify gameplay"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("xlsx", nargs="?")
    parser.add_argument("--root", default=str(Path(__file__).resolve().parent.parent))
    parser.add_argument("--baseline")
    parser.add_argument("--metadata")
    parser.add_argument("--report")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    file = Path(args.xlsx) if args.xlsx else root / "docs/codex/suivi-monde2026/DEADWALL_CODEX_MONDE_SUIVI.xlsx"
    book = read_workbook(file)
    result = verify(book, repository_data(root), read_workbook(Path(args.baseline)) if args.baseline else None)
    if args.metadata:
        meta = json.loads(Path(args.metadata).read_text())
        cells = {
            "Accueil": {"subtitle": "A3", "summary": "A23", "details": "A26", "remaining": "A29", "metrics": "A32"},
            "Publication": {"baseCheckedAt": "B6", "baseCommit": "D6", "sourceCommit": "B7", "targetedTests": "B10", "targetedDetail": "D10", "globalCheck": "B11", "globalDetail": "D11", "globalState": "E11", "integration": "D12"},
        }
        for name, fields in cells.items():
            for key, address in fields.items():
                if key in meta:
                    assert_equal(book[name]["cells"].get(address), meta[key], "Métadonnée " + key)
        if "baseVersion" in meta:
            assert_equal(book["Publication"]["cells"].get("E6"), "DEADWALL " + str(meta["baseVersion"]) + " conservé", "Version de base")
        result["metadataReconciled"] = True
    result["sha256"] = hashlib.sha256(file.read_bytes()).hexdigest()
    result["bytes"] = file.stat().st_size
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    print(text, end="")
    if args.report:
        target = Path(args.report)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)


if __name__ == "__main__":
    main()
