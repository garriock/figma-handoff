# Figma Handoff

A Claude Code plugin that documents a coded prototype in Figma for developer handoff.

Point it at a prototype and a Figma file. It reads the code, finds your design system in code and in Figma, rebuilds the screens with real components and variables, and writes a short file that says what is real, what is faked and what still needs a decision.

> **Status: early release.** Tested on one real web prototype with a Figma library, and partly on a second. Native apps and projects with no design system haven't been tested end to end. Its structure is a proposed convention, not an industry standard.

## Why it exists

Most handoff advice assumes design comes first. With a prompt-built prototype, the code already exists and looks finished, even where it's faked. The risk is that mock data and stubbed logic get built as requirements. This plugin makes the difference visible.

## What you get

**In Figma**

One page on a dark canvas, readable by zooming out:

```text
┌─────────┐   ┌───────────────────────────────────────┐   ┌──────────────────┐
│  Brief  │   │ Member opens the menu · Reference     │   │  Key components  │
│         │   │  [screen] ─ Clicks ─▶ [screen]        │   │  packed columns  │
│         │   └───────────────────────────────────────┘   └──────────────────┘
└─────────┘   ┌───────────────────────────────────────┐   ┌──────────────────┐
              │ Member invites a colleague · Reference│   │  Screen parts    │
              │  [screen] ─ Sends ─▶ [screen]         │   │  packed columns  │
              └───────────────────────────────────────┘   └──────────────────┘
              ┌───────────────────────────────────────┐
              │ Focus order                           │
              └───────────────────────────────────────┘
```

- **Brief,** a white card on the left: who it's for, what is real and what is faked, what it does, and up to seven open decisions with defaults.
- **Scenario rows** in the middle, one per user situation. They hold editable screens built from your components where you have them, with a one-line caption under each and plenty of space between.
- **Labelled arrows** from each screen to the next, naming the action, such as "Clicks the row".
- **Tokens bound, not pasted.** After each part is built, a sweep binds every colour, gap, padding, radius and text value that matches your system exactly, and lists the ones that are close but not equal as drift.
- **Library components wherever the library has them,** checked against everything the code imports, including containers such as Dialog, Drawer and menus. Custom content goes inside the library container rather than in a lookalike.
- **Key components and Screen parts** on the right, packed into compact columns. Specs live in each component's description, so Dev Mode shows them on every instance.
- **A few native annotations,** only where something is faked or missing and would get built wrong, and at most two per screen. Accessibility gaps go in one annotation on the focus order row.
- **Nothing drawn over your UI** except cursors. Figma's own frame labels carry the titles.

**In your repo**

- A cited inventory at `docs/handoff/<feature>/inventory.md`, with every item labelled for reality and confidence.

Your documentation stays minimal because the detail lives in the inventory. Run details go in a local `.handoff/` folder.

## Install

```bash
claude plugin marketplace add garriock/figma-handoff
```

```bash
claude plugin install figma-handoff@garriock-figma-handoff
```

To get a newer version later:

```bash
claude plugin marketplace update garriock-figma-handoff
```

```bash
claude plugin update figma-handoff@garriock-figma-handoff
```

Restart Claude Code afterwards. See [CHANGELOG.md](CHANGELOG.md) for what changed.

## Requirements

- Claude Code, with subagents available for an independent review.
- The [Figma MCP server](https://developers.figma.com/docs/figma-mcp-server/) with write access (`use_figma`).
- Figma's skills, from the Figma plugin or served by the MCP server.
- A paid Figma plan and a Full seat for writing outside drafts and for creating annotations. Viewing annotations needs a Full or Dev seat.
- For flow arrows, one FigJam arrow on the page. The plugin asks for it if the file has none.

Capture tools are optional, since they vary by client.

## Use

```text
/figma-handoff:handoff <figma file link> <prototype path, URL or feature> [notes]
```

```text
/figma-handoff:handoff https://www.figma.com/design/abc/Checkout src/app/checkout Prototype for review on Friday
```

It only runs when you call it, because it writes to shared files. It will ask whether the prototype is a **Reference**, a **Spec** or a **Candidate for production**. It works on a new file, adds to an existing one, or updates documentation after the code changes. On an update it also compares the file with its last snapshot, so changes you make in Figma, such as swapping a button for a library component, get documented too.

## What it won't do

- Mark anything Ready for dev. That's your approval to give, and Figma's tools don't allow it. It tells you which sections are ready.
- Move, rename or delete work it didn't create.
- Commit to your repo.
- Promise that a prototype is secure or accessible. Annotation doesn't replace testing with assistive technology and disabled people.

## Limits

- `use_figma` is in beta, so expect some manual cleanup.
- Native annotations don't reach people on View seats, and plain canvas text may not reach coding agents. The inventory covers both gaps.
- Figma's tools can't create arrows in a design file, only copy one. If the file has none, it asks you to place one FigJam arrow first, or falls back to plain lines.
- Figma limits MCP calls by seat. A 14-screen file took about 30 calls, but other sessions on the same account share the allowance.
- Figma's tools can't set Ready for dev status, add dev resource links or save named versions.
- The audit reports numbers rather than pass or fail, because there are no reliable thresholds yet.

## Development

```bash
claude plugin validate .
```

```bash
python3 scripts/check-terms.py
```

## Credits

See [NOTICE.md](NOTICE.md).

## License

[MIT](LICENSE)
