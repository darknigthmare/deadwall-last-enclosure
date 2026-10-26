#!/usr/bin/env python3
"""Compatibility CLI: verify-codex-workbook2026.py FILE DATA_DIR.

Keep the original two-argument command while sharing the current XLSX checker.
The supplied regenerated JSON must agree with current repository sources; an old
snapshot must not silently validate a workbook whose inspection data have moved.
This module only reads workbooks and JSON files.
"""
import argparse
from collections import Counter
import importlib.util
import json
from pathlib import Path


def verify(file, data_dir):
    root = Path(__file__).resolve().parent.parent
    module_path = root / "scripts/verify-codex-tracker-xlsx2026.py"
    spec = importlib.util.spec_from_file_location("codex_tracker_xlsx2026", module_path)
    checker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(checker)
    data = checker.repository_data(root)
    directory = Path(data_dir)
    for key, filename in (("tasks", "chantiers.json"), ("typologies", "typologies-cibles.json"), ("variants", "variantes-a-concevoir.json")):
        snapshot = json.loads((directory / filename).read_text())
        by_id = {row["id"]: row for row in snapshot}
        if len(by_id) != len(snapshot):
            raise AssertionError("Identifiants dupliqués dans " + filename)
        checker.assert_equal(set(by_id), {row["id"] for row in data[key]}, filename + " identifiants régénérés")
        # repository_data projects the variant fields used by the XLSX checker.
        # Compare every projected field, including inspection counts and proof.
        for expected in data[key]:
            actual = by_id[expected["id"]]
            checker.assert_equal({field: actual.get(field) for field in expected}, expected, filename + " " + expected["id"])
    if data.get("campaign205"):
        campaign = json.loads((directory / "campagne-g11.json").read_text())
        checker.assert_equal(campaign, data["campaign205"], "Preuves de campagne G11 régénérées")
    services_file = directory / "campagne-services-g11.json"
    if data.get("campaign208"):
        services = json.loads(services_file.read_text())
        checker.assert_equal(services, data["campaign208"], "Preuves des services G11 régénérées")
    elif services_file.exists():
        raise AssertionError("Preuves de services orphelines : campagne-services-g11.json")
    result = checker.verify(checker.read_workbook(file), data)
    result.update({
        "passed": True,
        "errors": result["formulaErrors"],
        "uncached": result["missingFormulaCaches"],
        "taskCounts": dict(Counter(task["status"] for task in data["tasks"])),
        "sourceComparison": "All workbook IDs, states, source fields, inspection aggregates and saved formulas; supplied JSON reconciled with current sources",
    })
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file")
    parser.add_argument("data_dir")
    arguments = parser.parse_args()
    print(json.dumps(verify(arguments.file, arguments.data_dir), ensure_ascii=False, indent=2))
