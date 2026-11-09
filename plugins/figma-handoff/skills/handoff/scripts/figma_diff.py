#!/usr/bin/env python3
"""Compare two Figma snapshots from snapshot.js and list what a designer changed.

Usage:
  figma_diff.py <old snapshot.json> <new snapshot.json>

Each finding needs documenting: a swapped control may differ from the code, a lost
annotation was usually dropped by a swap, and an unused variant may describe
something that no longer exists.
"""

import json
import sys


def load(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def main_name(control):
    main = control.get("main") or {}
    return main.get("name", "missing"), main.get("key")


def control_changes(before, after, where):
    findings = []
    before_controls, after_controls = before.get("controls", {}), after.get("controls", {})
    # A swap can give the instance a new id, so match controls by id first, then by layer name.
    # Unmatched controls on both sides at one spot are reported as removed and added.
    matched_old = set()
    old_by_name = {}
    for control_id, control in before_controls.items():
        old_by_name.setdefault(control["name"], []).append(control_id)
    for control_id, control in after_controls.items():
        previous_id = control_id if control_id in before_controls else next(
            (i for i in old_by_name.get(control["name"], []) if i not in matched_old), None)
        if previous_id is None:
            findings.append(f"Control added in {where}: {control['name']} uses {main_name(control)[0]}")
            continue
        matched_old.add(previous_id)
        previous = before_controls[previous_id]
        if main_name(previous)[1] != main_name(control)[1]:
            findings.append(
                f"Control swapped in {where}: {control['name']} was {main_name(previous)[0]}, "
                f"now {main_name(control)[0]}. Check it against the code, and record any difference"
            )
    for control_id, control in before_controls.items():
        if control_id not in matched_old:
            findings.append(f"Control removed from {where}: {control['name']} used {main_name(control)[0]}")
    return findings


def diff(old, new):
    findings = []
    old_screens, new_screens = old.get("screens", {}), new.get("screens", {})

    for screen_id in sorted(old_screens.keys() - new_screens.keys()):
        findings.append(f"Screen removed: {old_screens[screen_id]['name']} ({screen_id})")
    for screen_id in sorted(new_screens.keys() - old_screens.keys()):
        findings.append(f"Screen added: {new_screens[screen_id]['name']} ({screen_id})")

    for screen_id in sorted(old_screens.keys() & new_screens.keys()):
        before, after = old_screens[screen_id], new_screens[screen_id]
        where = f"{after['name']} ({screen_id})"
        findings += control_changes(before, after, where)

        still_there = {label for item in after["annotated"].values() for label in item["labels"]}
        for item in before["annotated"].values():
            for label in item["labels"]:
                if label not in still_there:
                    findings.append(f"Annotation lost in {where}, was on {item['name']}: {label[:90]}")

    old_components = old.get("components", {})
    for component_id, component in new.get("components", {}).items():
        if component_id in old_components:
            findings += control_changes(old_components[component_id], component, f"component {component['name']} ({component_id})")

    for component_id, component in new.get("components", {}).items():
        for variant, uses in component.get("uses", {}).items():
            previous = old.get("components", {}).get(component_id, {}).get("uses", {}).get(variant)
            if uses == 0 and previous:
                findings.append(f"Variant now unused: {component['name']} / {variant}. Remove it or say why it stays")

    return findings


def run(argv):
    if len(argv) != 3:
        sys.exit(__doc__)
    findings = diff(load(argv[1]), load(argv[2]))
    if not findings:
        print("No design changes found.")
        return
    print(f"{len(findings)} design changes to document:")
    for finding in findings:
        print(f"- {finding}")


if __name__ == "__main__":
    run(sys.argv)
