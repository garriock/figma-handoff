#!/usr/bin/env python3
"""Fail if private terms appear in the repo.

List terms in .local-banned-terms, one per line. That file is gitignored, so
the list is never published. To allow a term in certain files, write
`term | path, path`.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_PARTS = {".git", "__pycache__"}
SKIP_FILES = {"scripts/check-terms.py", ".local-banned-terms"}


def load_terms():
    local = ROOT / ".local-banned-terms"
    if not local.exists():
        return []
    terms = []
    for line in local.read_text().splitlines():
        term, _, allowed = line.partition("|")
        if term.strip():
            paths = {p.strip() for p in allowed.split(",") if p.strip()}
            terms.append((term.strip(), paths))
    return terms


def main():
    terms = [(term, paths, re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE))
             for term, paths in load_terms()]
    if not terms:
        print("No terms listed in .local-banned-terms.")
        return
    problems = []
    for path in sorted(ROOT.rglob("*")):
        rel = path.relative_to(ROOT).as_posix()
        if not path.is_file() or SKIP_PARTS & set(path.parts) or rel in SKIP_FILES:
            continue
        try:
            text = path.read_text()
        except UnicodeDecodeError:
            continue
        for number, line in enumerate(text.splitlines(), 1):
            for term, allowed, pattern in terms:
                if rel not in allowed and pattern.search(line):
                    problems.append(f"{rel}:{number}: {term}")
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    print("No banned terms found.")


if __name__ == "__main__":
    main()
