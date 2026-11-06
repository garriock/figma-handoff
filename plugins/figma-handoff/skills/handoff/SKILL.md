---
name: handoff
description: Document a coded prototype in Figma for developer handoff. Reads the code, finds the project's design system in code and in Figma, rebuilds the screens with real components and variables, and writes a short, honest handoff file that says what is real, what is faked and what still needs a decision. Use for prototypes built with Claude or another AI tool, or for any working feature that has no Figma documentation.
disable-model-invocation: true
argument-hint: <figma file link> <prototype path, URL or feature> [notes]
---

# Prototype handoff

Turn a working prototype into a Figma file that a designer, an engineer and a tester can use without having sat in on the work.

A prototype already answers most of what a traditional spec exists for. It raises a new question: which of these confident-looking details are true? Treat that as the main job. A short file that says "payment is stubbed and nobody owns the retry logic" beats a polished file that doesn't.

## Principles

- **Code records behaviour. Figma records visual intent and review decisions.** Say so on the brief, because readers of a Figma file assume it is the spec.
- **Never let a fake read as a requirement.** Every item in the inventory carries a reality label and a confidence label.
- **State each fact once.** Tokens live in variables, component props in code, everything else in the inventory. Figma gets short projections, never hand-kept copies.
- **Exhaustive in the run folder, sparse on the canvas.** If you are unsure whether something belongs in Figma, leave it out.
- **Never rebuild with flat layers and call it design.** Captures and screenshots are reference only.
- **Don't document a flaw as the design.** Report it and propose the better behaviour.
- **Report what you could not do.** Never imply a prototype is secure, accessible or production-ready.

## Inputs

Find what you can before asking. You need:

1. **The target Figma file.** Ask if it is missing. If the user wants a new file, use `create_new_file`.
2. **The prototype:** a folder, route, branch, pull request, URL or description.
3. **The prototype's status**, which the user must choose: **Reference** (a sketch of intent), **Spec** (the behaviour to build) or **Candidate for production** (the code may ship). Ask every time. Leaving this unstated is how prototypes get promoted by accident.
4. **The audience,** if the user names one.

Document one feature per run.

## Run modes

Inspect the file, pick a mode, say which in one line and continue unless corrected.

| Mode | When | Rules |
|---|---|---|
| **New** | The file is empty or a fresh duplicate | Create the default page set |
| **Add** | The file already has work | Follow the file's conventions. Never move, rename or delete work you didn't create |
| **Update** | This skill documented the feature before | Compare the pinned commit with the current one. Change only skill-owned nodes and affected screens, move superseded work to a section named Superseded, and add a change log entry |

## Run folder

Keep state in `<repo>/.handoff/<feature-slug>/`, and add `.handoff/` to `.gitignore` if the user agrees. It holds the plan, reference captures, `state.json` and `progress.md`. Re-read `progress.md` and run `scripts/run_state.py report` after any context compaction.

The inventory is the one lasting output in the repo: `docs/handoff/<feature-slug>/inventory.md`. Write it, but leave committing to the user.

## Pipeline

Stop at each listed point and ask. Otherwise keep moving.

### 1. Preflight

Check for these tools and report anything missing in plain language:

- **Required:** `use_figma`, `get_screenshot`, `get_metadata`.
- **Useful:** `upload_assets`, `get_libraries`, `search_design_system`, `get_variable_defs`, `get_code_connect_map`, `create_new_file`, and any capture tool. Never assume a capture tool exists.

Load `figma-use` before any `use_figma` call, and `figma-generate-design` before building screens, from the Figma plugin or through `get_figma_skill`. If neither route works, stop and explain that Figma's skills are required.

Confirm write access early with `whoami`. Annotations need a paid plan and a Full seat, and Completed status needs a higher plan. Figma also caps MCP calls by seat, and a run can hit that limit, so read the call budget in [figma-rules.md](references/figma-rules.md) before starting. If something is unavailable, adapt and tell the user. If the file is shared, offer to work on a duplicate.

**Stop if** write access is missing or no target file is named.

### 2. Prototype status

Record the status, commit, URL and date in the run folder.

**Stop until** the user has chosen a status.

### 3. Discover the design system

Read [design-system.md](references/design-system.md). Look in code and in Figma separately, then compare.

**Stop if** nothing is found on either side.

### 4. Join code and Figma

Propose matches by code syntax, then by normalised name. Confirm each by resolved value in each mode. Record the method and confidence, and report drift.

**Stop if** names and values disagree on something that affects the screens, or several tokens share a value and you can't tell which is meant.

### 5. Inventory the prototype

Run the inventory role: [roles/inventory.md](references/roles/inventory.md). The format is in [inventory.md](references/inventory.md). If a capture is useful, run [roles/capture.md](references/roles/capture.md) alongside it.

Then write the plan and show the user a summary of ten lines at most: scenarios, screens, components to create, and open decisions. Continue unless corrected.

**Stop if** the prototype has logic with no clear owner that changes the scope, or a key state can't be reached.

### 6. Build

Read [file-layout.md](references/file-layout.md), [style.md](references/style.md) and [figma-rules.md](references/figma-rules.md). Build in this order: page set, brief, custom components, first scenario row. Review that first, because mistakes are cheapest to fix here. Then build the remaining rows.

Run one [builder](references/roles/builder.md) at a time. Concurrent writers race on positions and node IDs. Use `scripts/doc-kit.js` for documentation chrome, so every unit looks the same.

Follow the design system state from stage 3:

| State | Behaviour |
|---|---|
| Figma library and code system, mapped | Build directly and report match confidence |
| Figma library and code system, unmapped | Join by name and value, flag matches as unconfirmed, offer Code Connect |
| Code system, no Figma library | Offer `figma-generate-library` first. Don't improvise components silently |
| Figma library, no code system | Build from the library and mark each code mapping as absent |
| Neither | Stop and ask. Plain layers can serve as reference only, and the file must say so |

### 7. Document

Write the brief content, captions and native annotations. Read [accessibility.md](references/accessibility.md), and resolve each item or mark it not applicable.

**Stop if** copy, intent or accessibility decisions are open and have no sensible default. Otherwise put them on the brief's to-decide list.

### 8. Verify

Run `scripts/audit.js` through a read-only `use_figma` call and record the numbers. Compare screenshots per state and breakpoint. Then run a fresh [reviewer](references/roles/reviewer.md) that sees neither your reasoning nor the builders'. Allow at most two rounds per checkpoint. Review once after the first row and once at the end.

Fix what it finds. If the final round still has findings after you fix them, say that the last pass was verified by you, not independently.

If subagents aren't available, do the work in sequence and tell the user that the review was not independent.

**Don't call it done** while a check fails, unless you name the failure in your report.

### 9. Hand over

- Save the inventory to the repo.
- Add the visible change log entry. The API can't save a named version, so ask the user to save one.
- Leave Ready for dev to a person. It is an approval, and `use_figma` can't set it anyway. Say which sections are ready to be marked.
- Reply with the file link and a short report: what was built, the audit numbers, drift, the reality summary, open decisions, and anything you could not do. Add a suggested walkthrough prompt for the designer and engineer.

Details that readers don't need in order to build belong in this reply and the run folder, not on the canvas.

## What goes where

| Content | Home | Shown in Figma as |
|---|---|---|
| Colour, spacing, type | Bound variables and styles | Nothing extra. Dev Mode shows them |
| Component props and defaults | Code and Code Connect | A link at most |
| Reality and confidence labels | Inventory | One compact line in the brief, plus a `MOCK:` or `STUB:` annotation on affected nodes |
| Behaviour rules | Inventory | A caption, a margin note or a native annotation |
| Accessibility | Inventory | Native annotations, and a separate overlay for focus order |
| Open questions with defaults | Brief | The to-decide list, once |
| Code paths, test IDs | Inventory | Never on the canvas |
| Audit numbers, app bugs, drift | Your reply and the run folder | Never on the canvas |

The Figma file doesn't reach everyone. Native annotations need a Full or Dev seat, and plain canvas text may not reach coding agents. That is why the inventory is the master copy, and why it lists annotated node links.
