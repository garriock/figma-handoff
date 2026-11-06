#!/usr/bin/env python3
"""Track a handoff run across context compaction.

  run_state.py init <run_folder> <figma_url> <commit>
  run_state.py add <run_folder> <id> <kind> <title>
  run_state.py built <run_folder> <id> <node_id>
  run_state.py verified <run_folder> <id> <evidence>
  run_state.py report <run_folder>

An item moves from todo to built to verified. Verified requires evidence.
"""
import json
import sys
from pathlib import Path


def state_path(folder):
    return Path(folder) / "state.json"


def load(folder):
    path = state_path(folder)
    if not path.exists():
        sys.exit(f"No run found at {path}. Run init first.")
    return json.loads(path.read_text())


def save(folder, state):
    state_path(folder).write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")


def find(state, item_id):
    for item in state["items"]:
        if item["id"] == item_id:
            return item
    sys.exit(f"Unknown item: {item_id}")


def init(folder, figma_url, commit):
    if state_path(folder).exists():
        sys.exit("This run already has a state file.")
    Path(folder).mkdir(parents=True, exist_ok=True)
    save(folder, {"figma_url": figma_url, "commit": commit, "items": []})


def add(folder, item_id, kind, title):
    state = load(folder)
    if any(item["id"] == item_id for item in state["items"]):
        sys.exit(f"Item already exists: {item_id}")
    state["items"].append({"id": item_id, "kind": kind, "title": title,
                           "status": "todo", "node_id": None, "evidence": None})
    save(folder, state)


def built(folder, item_id, node_id):
    state = load(folder)
    item = find(state, item_id)
    item.update(status="built", node_id=node_id)
    save(folder, state)


def verified(folder, item_id, evidence):
    if not evidence.strip():
        sys.exit("Verified needs evidence.")
    state = load(folder)
    item = find(state, item_id)
    if item["status"] != "built":
        sys.exit(f"{item_id} is {item['status']}, so it can't be verified yet.")
    item.update(status="verified", evidence=evidence)
    save(folder, state)


def report(folder):
    state = load(folder)
    counts = {"todo": 0, "built": 0, "verified": 0}
    for item in state["items"]:
        counts[item["status"]] += 1
    print(f"{state['figma_url']} at {state['commit']}")
    print(" · ".join(f"{name}: {count}" for name, count in counts.items()))
    for item in state["items"]:
        if item["status"] != "verified":
            print(f"- [{item['status']}] {item['id']}: {item['title']}")


COMMANDS = {"init": (init, 3), "add": (add, 4), "built": (built, 3),
            "verified": (verified, 3), "report": (report, 1)}


def main(args):
    if not args or args[0] not in COMMANDS:
        sys.exit(__doc__)
    command, count = COMMANDS[args[0]]
    if len(args) - 1 != count:
        sys.exit(__doc__)
    command(*args[1:])


if __name__ == "__main__":
    main(sys.argv[1:])
