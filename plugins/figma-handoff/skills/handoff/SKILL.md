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

In Update mode, run `scripts/snapshot.js` through a read-only `use_figma` call, then `scripts/figma_diff.py <old snapshot> <new snapshot>`. Document every finding before anything else:

- **Swapped control:** check it against the code. If the design now differs, say so in an annotation on the control and in the inventory's Components table, and say which one to build.
- **Lost annotation:** swaps drop annotations on the layers they replace. Put it back on the new control if it still applies.
- **Unused variant:** it may describe something that no longer exists. Remove it if this skill made it, and update any description that names it.

The designer's change wins over the code unless they say otherwise. Record it as a design decision, not as drift.

| Mode | When | Rules |
|---|---|---|
| **New** | The file is empty or a fresh duplicate | Create the default page |
| **Add** | The file already has work | Follow the file's conventions. Never move, rename or delete work you didn't create |
| **Update** | This skill documented the feature before | Compare the pinned commit with the current one, **and** compare the Figma file with the last snapshot, because designers change the file too. Change only skill-owned nodes and affected screens, move superseded work to a section named Superseded, and add a change log entry |

## Run folder

Keep state in `<repo>/.handoff/<feature-slug>/`, and add `.handoff/` to `.gitignore` if the user agrees. It holds the plan, reference captures, `state.json`, `progress.md` and `figma-snapshot.json`. Re-read `progress.md` and run `scripts/run_state.py report` after any context compaction.

Two files last in the repo: the inventory at `docs/handoff/<feature-slug>/inventory.md`, and the repo's binding table at `docs/handoff/design-system.md`, which later runs start from. Write them, but leave committing to the user.

## Pipeline

Stop at each listed point and ask. Otherwise keep moving.

### 1. Preflight

Check for these tools and report anything missing in plain language:

- **Required:** `use_figma`, `get_screenshot`, `get_metadata`.
- **Useful:** `upload_assets`, `get_libraries`, `search_design_system`, `get_variable_defs`, `get_code_connect_map`, `create_new_file`, and any capture tool. Never assume a capture tool exists.

Load `figma-use` before any `use_figma` call, and `figma-generate-design` before building screens, from the Figma plugin or through `get_figma_skill`. If neither route works, stop and explain that Figma's skills are required.

Confirm write access early with `whoami`. Annotations need a paid plan and a Full seat, and Completed status needs a higher plan. Figma also caps MCP calls by seat, and a run can hit that limit, so read the call budget in [figma-rules.md](references/figma-rules.md) before starting. If something is unavailable, adapt and tell the user. If the file is shared, offer to work on a duplicate.

Flow arrows are copied from a connector already in the file, because Figma's tools can't create one. If the file has none, ask the user to place one FigJam arrow on the page now, so it's there when the rows are built.

**Stop if** write access is missing or no target file is named.

### 2. Prototype status

Record the status, commit, URL and date in the run folder.

**Stop until** the user has chosen a status.

### 3. Discover the design system

Read [design-system.md](references/design-system.md). Look in code and in Figma separately, then compare.

**Stop if** nothing is found on either side.

### 4. Join code and Figma

Propose matches by code syntax, then by normalised name. Confirm each by resolved value in each mode. Record the method and confidence, and report drift.

Then run the library-first check in [design-system.md](references/design-system.md): search the library for every component the code imports, containers included, and record a match or "none" for each. The builder may not create a local component for anything that has a match.

Finish with the binding table in [design-system.md](references/design-system.md): every colour, spacing, radius and type value the prototype renders, mapped to the token the code names. It decides ties that a value can't, such as several white surfaces.

**Stop if** names and values disagree on something that affects the screens, or several tokens share a value and you can't tell which is meant.

### 5. Inventory the prototype

Run the inventory role: [roles/inventory.md](references/roles/inventory.md). The format is in [inventory.md](references/inventory.md). If a capture is useful, run [roles/capture.md](references/roles/capture.md) alongside it.

Then write the plan and show the user a summary of ten lines at most: scenarios, screens, components to create, and open decisions. Continue unless corrected.

**Stop if** the prototype has logic with no clear owner that changes the scope, or a key state can't be reached.

### 6. Build

Read [file-layout.md](references/file-layout.md), [style.md](references/style.md) and [figma-rules.md](references/figma-rules.md). Build in this order: brief, key components, first scenario row. Review that first, because mistakes are cheapest to fix here. Then build the remaining rows.

Run one [builder](references/roles/builder.md) at a time. Concurrent writers race on positions and node IDs. Use `scripts/doc-kit.js` for documentation chrome, so every unit looks the same.

After each unit, run `scripts/bind.js` on it: a dry run first, then again with `APPLY = true`. It binds every raw value that equals a token exactly, including in the local components the unit's screens use, and reports ties and near misses. Fill its `HINTS` from the binding table so ties resolve the way the code does. Never bind a near miss: a 32 radius where the system has 36 is drift for the report, or a builder error to fix by hand.

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

Run `scripts/bind.js` once more as a dry run on the whole page, then `scripts/audit.js`, both read-only, and record the numbers. Any exact match the dry run still finds is a failed check. Fills, strokes, spacing and radius should be bound wherever the system has a token, so report each percentage under 100 with the reason, such as a near miss kept as drift. Compare screenshots per state and breakpoint. Then run a fresh [reviewer](references/roles/reviewer.md) that sees neither your reasoning nor the builders'. Review once after the first row and once at the end, with at most two rounds per checkpoint.

Fix what it finds, and check each fix by reading the file back, not by one screenshot. **If the first round led to any fixes, a second round is required:** run a new reviewer, never the first one again, and give it the list of fixes to re-check. Fixes are where a review finds the most, because nobody independent has seen them yet. In one real run the second round found two major problems, both in fixes from the first round, and one of them had been reported as done when it hadn't held. Skip the second round only when the first came back clean. If the second round still has findings after you fix them, say that the last pass was verified by you, not independently.

If subagents aren't available, do the work in sequence and tell the user that the review was not independent.

**Don't call it done** while a check fails, unless you name the failure in your report.

### 9. Hand over

- Save the inventory to the repo.
- Run `scripts/snapshot.js` and save the result to the run folder as `figma-snapshot.json`, so the next run can see what changed in Figma.
- Add the visible change log entry. The API can't save a named version, so ask the user to save one.
- Leave Ready for dev to a person. It is an approval, and `use_figma` can't set it anyway. Say which sections are ready to be marked.
- Reply with the file link and a short report: what was built, the audit numbers, drift, the reality summary, open decisions, and anything you could not do. Add a suggested walkthrough prompt for the designer and engineer.

Details that readers don't need in order to build belong in this reply and the run folder, not on the canvas.

## What goes where

| Content | Home | Shown in Figma as |
|---|---|---|
| Colour, spacing, type | Bound variables and styles | Nothing extra. Dev Mode shows them |
| Component props and defaults | Code and Code Connect | A link at most |
| Component specs | Inventory | The component's description, with a short Specs list |
| Reality and confidence labels | Inventory | One compact line in the brief, plus a `MOCK:`, `STUB:`, `HARDCODED:` or `NOT BUILT:` annotation on the affected control. These are the only annotations on flow screens, at most two per screen |
| Behaviour rules | Inventory | The screen's caption or a margin note |
| Flow between screens | Scenarios | A labelled arrow from one screen to the next |
| Accessibility | Inventory | A focus order overlay with one annotation listing the gaps |
| Open questions with defaults | Brief | The to-decide list, once |
| Code paths, test IDs | Inventory | Never on the canvas |
| Audit numbers, app bugs, drift | Your reply and the run folder | Never on the canvas |

The Figma file doesn't reach everyone. Native annotations need a Full or Dev seat, and plain canvas text may not reach coding agents. That is why the inventory is the master copy, and why it lists annotated node links.
