#!/usr/bin/env python3
"""Fail if private or style-source terms appear in the plugin.

Public terms are listed here. Add private terms to .local-banned-terms, one
per line. That file is gitignored, so the private list is never published.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_TERMS = ["vercel"]
FONT_TERM = "geist"
FONT_ALLOWED = {
    "plugins/figma-handoff/skills/handoff/references/style.md",
    "plugins/figma-handoff/skills/handoff/scripts/doc-kit.js",
}
SKIP_PARTS = {".git", "__pycache__"}
SKIP_FILES = {"scripts/check-terms.py", ".local-banned-terms"}


def load_terms():
    terms = list(PUBLIC_TERMS)
    local = ROOT / ".local-banned-terms"
    if local.exists():
        terms += [line.strip() for line in local.read_text().splitlines() if line.strip()]
    return terms


def main():
    terms = [(term, re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)) for term in load_terms()]
    font = re.compile(rf"\b{FONT_TERM}\b", re.IGNORECASE)
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
            for term, pattern in terms:
                if pattern.search(line):
                    problems.append(f"{rel}:{number}: {term}")
            if rel not in FONT_ALLOWED and font.search(line):
                problems.append(f"{rel}:{number}: {FONT_TERM} (allowed only in the font order)")
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    print("No banned terms found.")


if __name__ == "__main__":
    main()
