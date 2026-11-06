# Figma Handoff

A Claude Code plugin that documents a coded prototype in Figma for developer handoff.

Point it at a prototype and a Figma file. It reads the code, finds your design system in code and in Figma, rebuilds the screens with real components and variables, and writes a short file that says what is real, what is faked and what still needs a decision.

> **Status: early release.** Tested on one real web prototype with a Figma library, and partly on a second. Native apps and projects with no design system haven't been tested end to end. Its structure is a proposed convention, not an industry standard.

## Why it exists

Most handoff advice assumes design comes first. With a prompt-built prototype, the code already exists and looks finished, even where it's faked. The risk is that mock data and stubbed logic get built as requirements. This plugin makes the difference visible.

## What you get

**In Figma**

- A cover showing name, owner, status and date.
- A one-page brief with the reality summary and open decisions.
- One section per user scenario, holding editable screens built from your components where you have them.
- Native annotations and measurements for mocks, behaviour, accessibility and component specs.
- Nothing drawn over your UI except cursors. Figma's own frame labels carry the titles.

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

## Requirements

- Claude Code, with subagents available for an independent review.
- The [Figma MCP server](https://developers.figma.com/docs/figma-mcp-server/) with write access (`use_figma`).
- Figma's skills, from the Figma plugin or served by the MCP server.
- A paid Figma plan and a Full seat for writing outside drafts and for creating annotations. Viewing annotations needs a Full or Dev seat.

Capture tools are optional, since they vary by client.

## Use

```text
/figma-handoff:handoff <figma file link> <prototype path, URL or feature> [notes]
```

```text
/figma-handoff:handoff https://www.figma.com/design/abc/Checkout src/app/checkout Prototype for review on Friday
```

It only runs when you call it, because it writes to shared files. It will ask whether the prototype is a **Reference**, a **Spec** or a **Candidate for production**. It works on a new file, adds to an existing one, or updates documentation after the code changes.

## What it won't do

- Mark anything Ready for dev. That's your approval to give, and Figma's tools don't allow it. It tells you which sections are ready.
- Move, rename or delete work it didn't create.
- Commit to your repo.
- Promise that a prototype is secure or accessible. Annotation doesn't replace testing with assistive technology and disabled people.

## Limits

- `use_figma` is in beta, so expect some manual cleanup.
- Native annotations don't reach people on View seats, and plain canvas text may not reach coding agents. The inventory covers both gaps.
- Instances don't inherit annotations from their main component, so component specs are found on the component, not on each screen.
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
