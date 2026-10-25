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
import posixpath
import subprocess
import xml.etree.ElementTree as ET
import zipfile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
EXPECTED_SHEETS = ["Accueil", "Catalogue existant", "Extension typologies", "Variantes à concevoir", "Chantiers", "Règles seed", "Familles existantes", "Références", "Publication", "Légende", "Références métriques", "Avancement par type", "Inspection"]


def xml_signature(element, ignore_wrap=False):
    if element is None:
        return None
    attributes = tuple(sorted((k, v) for k, v in element.attrib.items()
                              if not (ignore_wrap and k == "wrapText")))
    return (element.tag, attributes, element.text or "", tuple(xml_signature(c, ignore_wrap) for c in element))


def style_signatures(z, ignore_wrap=False, normalize_defaults=True):
    tree = ET.fromstring(z.read("xl/styles.xml"))
    fonts = list(tree.find("m:fonts", NS))
    fills = list(tree.find("m:fills", NS))
    borders = list(tree.find("m:borders", NS))
    formats = {n.attrib["numFmtId"]: n.attrib["formatCode"] for n in tree.findall("m:numFmts/m:numFmt", NS)}
    def signature(xf, omit_wrap=False, normalize=False):
        # Adding wrapText can make existing defaults explicit on export.
        # Compare their resolved font/fill/border/format below; an explicit
        # apply*=1 and an empty alignment add no other visual change.
        attributes = tuple(sorted((k, v) for k, v in xf.attrib.items()
                                  if k not in ("fontId", "fillId", "borderId", "numFmtId", "xfId")
                                  and not (normalize and k.startswith("apply") and v == "1")))
        children = tuple(xml_signature(child, omit_wrap) for child in xf
                         if not (normalize and child.tag == "{" + NS["m"] + "}alignment"
                                 and not {k: v for k, v in child.attrib.items() if k != "wrapText"}
                                 and not len(child) and not child.text))
        return (attributes, xml_signature(fonts[int(xf.attrib.get("fontId", 0))]),
                xml_signature(fills[int(xf.attrib.get("fillId", 0))]),
                xml_signature(borders[int(xf.attrib.get("borderId", 0))]),
                formats.get(xf.attrib.get("numFmtId", "0"), xf.attrib.get("numFmtId", "0")), children)
    # Preserve inherited styles too: equal explicit components must not hide
    # a changed base font, fill, border or alignment behind apply flags.
    inherited = [signature(xf) for xf in tree.find("m:cellStyleXfs", NS)]
    return [(signature(xf, ignore_wrap, ignore_wrap and normalize_defaults), inherited[int(xf.attrib.get("xfId", 0))])
            for xf in tree.find("m:cellXfs", NS)]


def read_workbook(file):
    with zipfile.ZipFile(file) as z:
        corrupt = z.testzip()
        if corrupt is not None:
            raise AssertionError("Entrée XLSX corrompue : " + corrupt)
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            strings = ["".join(s.itertext()) for s in ET.fromstring(z.read("xl/sharedStrings.xml"))]
        styles = style_signatures(z)
        styles_without_wrap = style_signatures(z, ignore_wrap=True)
        styles_without_wrap_raw = style_signatures(z, ignore_wrap=True, normalize_defaults=False)
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
            cell_styles = {}
            cell_styles_without_wrap = {}
            cell_styles_without_wrap_raw = {}
            for c in tree.findall("m:sheetData/m:row/m:c", NS):
                style = int(c.attrib.get("s", 0))
                cell_styles[c.attrib["r"]] = styles[style]
                cell_styles_without_wrap[c.attrib["r"]] = styles_without_wrap[style]
                cell_styles_without_wrap_raw[c.attrib["r"]] = styles_without_wrap_raw[style]
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
            table_details = []
            table_parts = tree.findall("m:tableParts/m:tablePart", NS)
            if table_parts:
                sheet_relations_path = posixpath.join(posixpath.dirname(target), "_rels", posixpath.basename(target) + ".rels")
                sheet_relations = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(z.read(sheet_relations_path))}
                for part in table_parts:
                    table_target = sheet_relations[part.attrib[REL + "id"]]
                    table_path = table_target[1:] if table_target.startswith("/") else posixpath.normpath(posixpath.join(posixpath.dirname(target), table_target))
                    table = ET.fromstring(z.read(table_path))
                    table_filter = table.find("m:autoFilter", NS)
                    table_style = table.find("m:tableStyleInfo", NS)
                    table_details.append({
                        "name": table.attrib.get("name"), "range": table.attrib.get("ref"),
                        "filterRange": table_filter.attrib.get("ref") if table_filter is not None else None,
                        "style": table_style.attrib if table_style is not None else None,
                        "filterColumns": [ET.tostring(column, encoding="unicode") for column in table.findall("m:autoFilter/m:filterColumn", NS)],
                    })
            result[s.attrib["name"]] = {
                "cells": cells, "formulas": formulas, "errors": errors,
                "state": s.attrib.get("state", "visible"),
                "hiddenRows": [int(row.attrib["r"]) for row in tree.findall("m:sheetData/m:row", NS)
                               if row.attrib.get("hidden") in ("1", "true")],
                "hiddenColumns": [(int(column.attrib["min"]), int(column.attrib["max"]))
                                  for column in tree.findall("m:cols/m:col", NS)
                                  if column.attrib.get("hidden") in ("1", "true")],
                "missing": missing,
                "pane": pane.attrib if pane is not None else None,
                "tables": len(tree.findall("m:tableParts/m:tablePart", NS)),
                "tableDetails": table_details,
                "merges": [merge.attrib["ref"] for merge in tree.findall("m:mergeCells/m:mergeCell", NS)],
                "validations": len(tree.findall("m:dataValidations/m:dataValidation", NS)),
                "validationRules": [{"range": v.attrib.get("sqref"), "formula": v.findtext("m:formula1", namespaces=NS)} for v in tree.findall("m:dataValidations/m:dataValidation", NS)],
                "conditionalFormats": len(tree.findall("m:conditionalFormatting", NS)),
                "styles": cell_styles,
                "stylesWithoutWrap": cell_styles_without_wrap,
                "stylesWithoutWrapRaw": cell_styles_without_wrap_raw,
                "columns": [xml_signature(c) for c in tree.findall("m:cols/m:col", NS)],
            }
        return result


def repository_data(root):
    command = """const d=require('./scripts/build-codex-tracker2026.cjs').currentData(process.cwd());
const inspection=require('./scripts/codex-inspection-progress2026.cjs');
process.stdout.write(JSON.stringify({
programmes:d.catalogue.programmes.map(p=>({id:p.id,parent:p.parent,name:p.name,origin:p.origin,family:p.family,generation:p.generation,rooms:p.sourceRooms,props:p.authoredProps+p.authoredSlots,qualification:p.qualification,source:p.source})),
spaces:d.catalogue.rooms.length,props:d.catalogue.props.length,
typologies:d.typologies,variants:d.variants.map(v=>({id:v.id,typologyId:v.typologyId,typology:v.typology,domain:v.domain,number:v.number,status:v.status,playable:v.playable,inspection:v.inspection,campaign205:v.campaign205,campaign208:v.campaign208})),tasks:d.tasks,campaign205:d.campaign205,campaign208:d.campaign208,
inspection:inspection.checkedReport(process.cwd()).report,
inspectionReportSha256:require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync(inspection.REPORT)).digest('hex')}));"""
    node = os.environ.get("CODEX_PRIMARY_RUNTIME_NODE", "node")
    run = subprocess.run([node, "-e", command], cwd=root, check=True, capture_output=True, text=True)
    return json.loads(run.stdout)


def assert_equal(actual, expected, message):
    if actual != expected:
        raise AssertionError(f"{message}: {actual!r} != {expected!r}")


def task_acceptance(task):
    scoped = (task["typologyId"] in {f"EXT-MONDE-T{n:03}" for n in range(45, 49)}
              and task.get("stage") in {"architecture", "sauvegarde", "qa", "services", "art"})
    return task["acceptance"] + ("\nAvancement et limites : " + task["progress"]
                                if scoped and task.get("progress") else "")


def mapped_rows(sheet, count):
    rows = {}
    for r in range(6, count + 6):
        key = sheet["cells"].get("A" + str(r))
        if not key or key in rows:
            raise AssertionError("Identifiant vide ou dupliqué à la ligne " + str(r))
        rows[key] = r
    return rows


def verify_historical_styles(book, baseline, data):
    checked = 0
    resized_footer_excluded = 0
    wrap_changes = []
    normalized = []
    author_types = {t["id"] for t in data["typologies"] if "choix de composition auteur" in (t.get("dimensions_m") or {}).get("scope", "")}
    author_rows = {"Extension typologies": set(), "Variantes à concevoir": set()}
    for name, records in (("Extension typologies", data["typologies"]), ("Variantes à concevoir", data["variants"])):
        positions = mapped_rows(book[name], len(records))
        author_rows[name] = {positions[item["id"]] for item in records if item.get("typologyId", item["id"]) in author_types}
    # All sheets already present in the source workbook remain historical. The
    # author wrap exception below is confined to the same two original sheets.
    for name in baseline:
        assert_equal(book[name]["columns"], baseline[name]["columns"], name + " largeurs de colonnes historiques")
        comparable_last_row = None
        if name not in EXPECTED_SHEETS[:11]:
            old_tables = {t["name"]: t["range"] for t in baseline[name]["tableDetails"]}
            new_tables = {t["name"]: t["range"] for t in book[name]["tableDetails"]}
            if old_tables != new_tables:
                assert_equal(set(new_tables), set(old_tables), name + " noms des tables dérivées")
                old_ends = []
                for table_name, old_range in old_tables.items():
                    old_start, old_end = old_range.split(":")
                    new_start, new_end = new_tables[table_name].split(":")
                    assert_equal(new_start, old_start, name + " origine de la table dérivée")
                    assert_equal("".join(c for c in new_end if c.isalpha()),
                                 "".join(c for c in old_end if c.isalpha()), name + " colonnes de la table dérivée")
                    old_last = int("".join(c for c in old_end if c.isdigit()))
                    new_last = int("".join(c for c in new_end if c.isdigit()))
                    if new_last < old_last:
                        raise AssertionError(name + " réduction de la table dérivée")
                    old_ends.append(old_last)
                # An expanded inspection table occupies the old footer rows.
                # Its original headers and data rows must retain their style;
                # its displaced totals and proof notes are checked at their new
                # addresses by the worksheet reconciliation, not as old cells.
                comparable_last_row = max(old_ends) if old_ends else None
        for address, signature in baseline[name]["styles"].items():
            row = int("".join(c for c in address if c.isdigit()))
            if comparable_last_row is not None and row > comparable_last_row:
                resized_footer_excluded += 1
                continue
            checked += 1
            column = "".join(c for c in address if c.isalpha())
            # Authored dimensions add line wrapping in A:K, while retaining
            # every font, fill, border, number format and other alignment.
            if name in author_rows and row in author_rows[name] and len(column) == 1 and column <= "K":
                key = "stylesWithoutWrap"
                assert_equal(book[name][key].get(address), baseline[name][key][address], name + " style historique " + address)
                if book[name]["styles"].get(address) != signature:
                    wrap_changes.append(name + "!" + address)
                if book[name]["stylesWithoutWrapRaw"].get(address) != baseline[name]["stylesWithoutWrapRaw"][address]:
                    normalized.append(name + "!" + address)
            else:
                assert_equal(book[name]["styles"].get(address), signature, name + " style historique " + address)
    return {"checkedHistoricalStyleCells": checked, "authorCellsWithWrapStyleChanges": len(wrap_changes),
            "derivedResizedFooterCellsExcluded": resized_footer_excluded,
            "authorCellsWithEquivalentExplicitDefaults": len(normalized),
            "equivalentExplicitDefaultsBySheet": {name: sum(cell.startswith(name + "!") for cell in normalized)
                                                 for name in author_rows},
            "inheritedStylesPreserved": True}


def verify_campaign(book, data):
    """Read campaign evidence separately; the author inspection remains unchanged."""
    coverage = data.get("campaign205")
    if not coverage:
        return None
    tab = book["Campagne G11"]
    records = coverage["records"]
    rows = mapped_rows(tab, len(records))
    assert_equal(set(rows), {r["id"] for r in records}, "Identités de campagne G11")
    last_row = len(records) + 5
    total_row = last_row + 1
    tables = [t for t in tab["tableDetails"] if t["name"] == "CampagneG11205"]
    assert_equal(len(tables), 1, "Table native de campagne G11")
    assert_equal(tables[0]["range"], f"A5:L{last_row}", "Emprise de la table G11")
    if tables[0]["filterRange"] is not None:
        assert_equal(tables[0]["filterRange"], f"A5:L{last_row}", "Filtre de la table G11")
    for merge in tab["merges"]:
        bounds = merge.split(":")
        start = int("".join(c for c in bounds[0] if c.isdigit()))
        end = int("".join(c for c in bounds[-1] if c.isdigit()))
        if start <= last_row and end >= 6:
            raise AssertionError("Fusion recouvrant des preuves G11")
    names = {t["id"]: t["name"] for t in data["typologies"]}
    source_ref = book["Publication"]["cells"].get("B7")
    source_base = "https://github.com/darknigthmare/deadwall-last-enclosure/blob/" + str(source_ref) + "/"
    expected_proof = source_base + coverage["report"]
    for record in records:
        row = rows[record["id"]]
        expected = {"B": names[record["typologyId"]], "C": record["number"], "D": record["campaignType"],
                    "E": "Oui", "F": "Oui", "G": "Oui", "H": "Oui", "I": "Oui",
                    "J": record["observedInstances"],
                    "K": ", ".join(str(seed) for seed in record["observedSeeds"]) or "Aucun témoin pour cette variante",
                    "L": expected_proof}
        for column, value in expected.items():
            assert_equal(tab["cells"].get(column + str(row)), value, "Preuve G11 " + record["id"] + "/" + column)
    for column in ("C", "F", "G", "H", "I"):
        source_column = "E" if column == "C" else column
        address = column + str(total_row)
        assert_equal(tab["cells"].get(address), len(records), "Total de modèles G11 " + column)
        assert_equal(tab["formulas"].get(address), f'COUNTIF({source_column}6:{source_column}{last_row},"Oui")', "Formule G11 " + column)
    assert_equal(tab["cells"].get("J" + str(total_row)), coverage["summary"]["observedSites"], "Instances G11 observées")
    assert_equal(tab["formulas"].get("J" + str(total_row)), f"SUM(J6:J{last_row})", "Somme des instances G11")
    assert_equal(tab["cells"].get("E" + str(total_row + 5)), coverage["summary"]["observedSeeds"], "Graines G11 réellement auditées")
    assert_equal(tab["cells"].get("I" + str(total_row + 5)), ", ".join(str(seed) for seed in coverage["witnessSeeds"]) or "Aucun témoin", "Liste des graines G11")
    assert_equal(tab["cells"].get("E" + str(total_row + 6)), expected_proof, "Rapport de campagne G11")
    assert_equal(tab["cells"].get("E" + str(total_row + 7)), coverage["reportSha256"], "Empreinte du rapport G11")
    assert_equal(tab["cells"].get("E" + str(total_row + 8)), "Éligibilité de modèles ; aucun nombre de lieux garanti par graine.", "Portée de la feuille G11")
    assert_equal(tab["cells"].get("E" + str(total_row + 9)), source_base + coverage["evidence"], "Limites et preuve G11")
    return coverage["summary"]


def verify_services(book, data):
    """Reconcile model supports, native poses and prepared art as separate scopes."""
    coverage = data.get("campaign208")
    if not coverage:
        return None
    records = coverage["records"]
    assert_equal(len(records), 200, "Modèles de services G11")
    summary = coverage["summary"]
    assert_equal(summary["models"], len(records), "Résumé des modèles de services")
    for key, field in (("offered", "anchorsOffered"), ("valid", "anchorsValid")):
        assert_equal(summary[key], sum(record[field] for record in records), "Résumé des services " + key)
    assert_equal(summary["refused"], sum(len(record["refusals"]) for record in records), "Résumé des services refusés")
    witnesses = coverage["worldWitnesses"]
    assert_equal([w["seed"] for w in witnesses], [0, 17117, 967313470], "Graines des poses témoins de services")
    world = coverage["worldSummary"]
    assert_equal(world["seeds"], len(witnesses), "Nombre de graines des services")
    assert_equal(world["transactions"], 0, "Les poses de supports ne qualifient aucune transaction")
    art = coverage.get("art")
    visual_counts = {}
    if art:
        for record in art["records"]:
            key = record["authorPlanId"]
            visual_counts[key] = visual_counts.get(key, 0) + 1
        assert_equal(len(visual_counts), art["summary"]["models"], "Modèles visuels préparés")
        assert_equal(sum(visual_counts.values()), art["summary"]["samples"], "Échantillons visuels préparés")
        assert_equal(art["summary"]["models"], 4, "Le rendu échantillonné ne couvre pas 200 modèles")
        assert_equal(art["summary"]["samples"], 13, "Les treize présentations préparées sont distinctes des transactions")
    names = {item["id"]: item["name"] for item in data["typologies"]}
    tab = book["Services G11"]
    assert_equal(tab.get("state", "visible"), "visible", "Visibilité des preuves services")
    assert_equal([r for r in tab.get("hiddenRows", []) if 6 <= r <= len(records) + 5], [], "Lignes de services masquées")
    assert_equal([c for c in tab.get("hiddenColumns", []) if c[0] <= 16 and c[1] >= 1], [], "Colonnes de services masquées")
    by_id = mapped_rows(tab, len(records))
    assert_equal(set(by_id), {r["authorPlanId"] for r in records}, "Identifiants de services")
    native = [table for table in tab["tableDetails"] if table["name"] == "ServicesG11208"]
    assert_equal(len(native), 1, "Table native des services G11")
    last_data_row = len(records) + 5
    assert_equal(native[0]["range"], f"A5:P{last_data_row}", "Emprise des services G11")
    if native[0]["filterRange"] is not None:
        assert_equal(native[0]["filterRange"], f"A5:P{last_data_row}", "Filtre des services G11")
    assert_equal(native[0].get("filterColumns", []), [], "Aucun filtre ne masque les preuves services")
    for merge in tab["merges"]:
        bounds = merge.split(":")
        start_row = int("".join(c for c in bounds[0] if c.isdigit()))
        end_row = int("".join(c for c in bounds[-1] if c.isdigit()))
        if start_row <= last_data_row and end_row >= 6:
            raise AssertionError("Fusion recouvrant les données de services : " + merge)
    commit = book["Publication"]["cells"].get("B7", "")
    if len(commit) != 40 or any(c not in "0123456789abcdefABCDEF" for c in commit):
        raise AssertionError("La feuille services exige un commit source immuable")
    source_base = "https://github.com/darknigthmare/deadwall-last-enclosure/blob/" + commit + "/"
    actions = ["meal", "restSheltered", "service", "medicalCare"]
    for record in records:
        author_id = record["authorPlanId"]
        row = by_id[author_id]
        values = [author_id, names[record["typologyId"]], record["number"], record["campaignType"],
                  record["anchorsOffered"], record["anchorsValid"], len(record["refusals"]),
                  *[record["supportCountsByAction"][action] for action in actions],
                  "Oui" if author_id in visual_counts else "Non", visual_counts.get(author_id, 0),
                  source_base + coverage["report"], source_base + art["report"] if art else "Pas de reçu visuel",
                  "Supports proposés et poses canoniques ; parcours et transactions distincts."]
        for column, expected in enumerate(values):
            assert_equal(tab["cells"].get(chr(65 + column) + str(row)), expected,
                         "Services " + author_id + " " + chr(65 + column))
    total_row = last_data_row + 1
    totals = {"C": (len(records), f"COUNTA(A6:A{last_data_row})"),
              "L": (len(visual_counts), f'COUNTIF(L6:L{last_data_row},"Oui")'),
              "M": (sum(visual_counts.values()), f"SUM(M6:M{last_data_row})")}
    for column, field in (("E", "anchorsOffered"), ("F", "anchorsValid")):
        totals[column] = (sum(record[field] for record in records), f"SUM({column}6:{column}{last_data_row})")
    totals["G"] = (sum(len(record["refusals"]) for record in records), f"SUM(G6:G{last_data_row})")
    for column, action in zip("HIJK", actions):
        totals[column] = (sum(record["supportCountsByAction"][action] for record in records),
                          f"SUM({column}6:{column}{last_data_row})")
    for column, (expected, formula) in totals.items():
        address = column + str(total_row)
        assert_equal(tab["cells"].get(address), expected, "Total services " + column)
        assert_equal(tab["formulas"].get(address), formula, "Formule éditable des services " + column)
    footer = {"E211": world["seeds"], "I211": ", ".join(str(w["seed"]) for w in witnesses),
              "E212": world["sites"], "I212": world["offered"], "M212": world["valid"],
              "E213": 0, "E214": source_base + coverage["report"], "E215": coverage["reportSha256"],
              "E216": source_base + art["report"] if art else "Pas de reçu visuel",
              "E217": art["reportSha256"] if art else "Pas de reçu visuel",
              "E218": source_base + coverage["evidence"],
              "E219": "Supports et présentations préparées ; aucune qualification globale des 4 000 plans.",
              "E220": len(visual_counts), "I220": sum(visual_counts.values())}
    for address, expected in footer.items():
        assert_equal(tab["cells"].get(address), expected, "Portée et provenance des services " + address)
    return {**summary, "worldSeeds": world["seeds"], "worldSites": world["sites"],
            "transactionsTested": 0, "visualModels": len(visual_counts), "visualSamples": sum(visual_counts.values())}


def verify(book, data, baseline=None):
    expected_sheets = (EXPECTED_SHEETS + (["Campagne G11"] if data.get("campaign205") else [])
                       + (["Services G11"] if data.get("campaign208") else []))
    assert_equal(list(book), expected_sheets, "Onglets historiques ajoutés, déplacés ou supprimés")
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
    variant_rows = reconcile("Variantes à concevoir", data["variants"], lambda v: {"B": v["typologyId"], "C": v["domain"], "D": v["typology"], "E": v["number"], "F": v["status"], "J": "Oui" if v["playable"] else "Non"})
    author_scopes = {t["id"]: t["dimensions_m"]["scope"] for t in data["typologies"] if "choix de composition auteur" in (t.get("dimensions_m") or {}).get("scope", "")}
    for type_id, scope in author_scopes.items():
        metric_text = book["Extension typologies"]["cells"].get("I" + str(type_rows[type_id])) or ""
        if scope not in metric_text:
            raise AssertionError("Provenance auteur absente des dimensions : " + type_id)
    for variant in data["variants"]:
        scope = author_scopes.get(variant["typologyId"])
        if scope:
            metric_text = book["Variantes à concevoir"]["cells"].get("H" + str(variant_rows[variant["id"]])) or ""
            if scope not in metric_text:
                raise AssertionError("Provenance auteur absente des dimensions : " + variant["id"])
    task_rows = reconcile("Chantiers", data["tasks"], lambda t: {"B": t["typologyId"], "C": t["domain"], "D": t["name"], "E": t["deliverable"], "F": t["priority"], "G": t["status"], "H": t["owner"], "I": task_acceptance(t)})
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
    last_inspection_data_row = len(inspected) + 5
    inspection_total_row = last_inspection_data_row + 1
    inspection_provenance_row = inspection_total_row + 6
    assert_equal(set(inspection_rows), set(inspected), "Typologies de la feuille Inspection")
    inspection_tables = [table for table in inspection_sheet["tableDetails"] if table["name"] == "InspectionPhysique2026"]
    assert_equal(len(inspection_tables), 1, "Table native d’inspection")
    assert_equal(inspection_tables[0]["range"], f"A5:L{last_inspection_data_row}", "Emprise de la table native d’inspection")
    if inspection_tables[0]["filterRange"] is not None:
        assert_equal(inspection_tables[0]["filterRange"], f"A5:L{last_inspection_data_row}", "Filtre des typologies inspectées")
    for merge in inspection_sheet["merges"]:
        bounds = merge.split(":")
        first, last = bounds[0], bounds[-1]
        start_row = int("".join(c for c in first if c.isdigit()))
        end_row = int("".join(c for c in last if c.isdigit()))
        if start_row <= last_inspection_data_row and end_row >= 6:
            raise AssertionError("Fusion recouvrant des données d’inspection : " + merge)
    columns = {"C": "plans", "D": "rooms", "E": "furnishedRooms", "F": "props", "G": "refused", "H": "walls", "I": "transitions", "J": "levels", "K": "passed", "L": "playable"}
    names = {t["id"]: t["name"] for t in data["typologies"]}
    for type_id, aggregate in inspected.items():
        row = inspection_rows[type_id]
        assert_equal(inspection_sheet["cells"].get("B" + str(row)), names[type_id], "Nom de la typologie inspectée")
        for column, key in columns.items():
            assert_equal(inspection_sheet["cells"].get(column + str(row)), aggregate[key], "Inspection " + type_id + "/" + key)
    for column, key in columns.items():
        expected = sum(t[key] for t in inspected.values())
        address = column + str(inspection_total_row)
        assert_equal(inspection_sheet["cells"].get(address), expected, "Total de l’inspection " + key)
        if address not in inspection_sheet["formulas"]:
            raise AssertionError("Total d’inspection figé : " + address)
        assert_equal(inspection_sheet["formulas"][address], f"SUM({column}6:{column}{last_inspection_data_row})", "Plage du total d’inspection " + key)
        if key != "playable":
            assert_equal(report["summary"][key], expected, "Somme du rapport " + key)
    assert_equal(inspection_sheet["cells"].get("C" + str(inspection_provenance_row + 2)), report["sourceHash"], "Empreinte des plans inspectés")
    assert_equal(inspection_sheet["cells"].get("C" + str(inspection_provenance_row + 5)), data["inspectionReportSha256"], "Empreinte du rapport d’inspection")
    assert_equal(report["summary"]["lootContainersCreated"], 0, "Stock de campagne ajouté")
    assert_equal(report["summary"]["connectedServices"], 0, "Service de campagne ajouté")
    variant_validation = [v["formula"] for v in book["Variantes à concevoir"]["validationRules"] if v["range"] == "F6:F4005"]
    if len(variant_validation) != 1 or "Inspection physique" not in variant_validation[0]:
        raise AssertionError("Le nouveau statut n’est pas proposé dans la liste de validation")
    assert_equal(book["Légende"]["cells"].get("A27"), "Inspection physique", "Légende du nouveau statut")

    campaign = verify_campaign(book, data)
    services = verify_services(book, data)

    style_verification = None
    if baseline:
        style_verification = verify_historical_styles(book, baseline, data)
        for name in expected_sheets:
            if name in ("Campagne G11", "Services G11") and name not in baseline:
                continue
            for feature in ("pane", "tables", "validations", "conditionalFormats"):
                assert_equal(book[name][feature], baseline[name][feature], name + " conservation " + feature)
        for name in EXPECTED_SHEETS[:11]:
            assert_equal(book[name]["tableDetails"], baseline[name]["tableDetails"], name + " tables et filtres historiques")
            assert_equal(book[name]["formulas"], baseline[name]["formulas"], name + " formules historiques")
        old_inspection_tables = [table for table in baseline["Inspection"]["tableDetails"] if table["name"] == "InspectionPhysique2026"]
        assert_equal(len(old_inspection_tables), 1, "Table d’inspection source")
        for feature in ("name", "style", "filterColumns"):
            assert_equal(inspection_tables[0][feature], old_inspection_tables[0][feature], "Inspection conservation " + feature)
        assert_equal(inspection_tables[0]["filterRange"] is not None, old_inspection_tables[0]["filterRange"] is not None, "Inspection conservation du filtre")
        for name in ("Règles seed", "Familles existantes", "Références", "Légende"):
            old = {k: v for k, v in baseline[name]["cells"].items() if v is not None}
            new = {k: v for k, v in book[name]["cells"].items() if v is not None}
            if name == "Légende" and "A27" not in old:
                new.pop("A27", None)
                new.pop("B27", None)
            assert_equal(new, old, name + " contenu historique")
            assert_equal(book[name]["formulas"], baseline[name]["formulas"], name + " formules historiques")
    return {"sheets": len(book), "programmes": len(data["programmes"]), "typologies": len(data["typologies"]), "variants": len(data["variants"]), "tasks": len(data["tasks"]), "formulas": sum(len(s["formulas"]) for s in book.values()), "formulaErrors": 0, "missingFormulaCaches": 0, "validatedTasks": counts["K15"], "inProgressTasks": counts["K14"], "pendingTasks": counts["K13"], "playableVariants": counts["C18"], "inspectionPlans": len(report["records"]), "inspectionTypes": len(inspected), "inspectionProps": report["summary"]["props"], "inspectionRefused": report["summary"]["refused"], "preservedHistoricalFeatures": bool(baseline), "styleVerification": style_verification, "campaignG11": campaign, "campaignServicesG11": services, "scope": "XLSX source reconciliation; does not certify gameplay"}


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
            "Publication": {"baseCheckedAt": "B6", "baseCommit": "D6", "sourceCommit": "B7", "workbookState": "B9", "workbookDetail": "E9", "targetedTests": "B10", "targetedDetail": "D10", "globalCheck": "B11", "globalDetail": "D11", "globalState": "E11", "integration": "D12"},
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
