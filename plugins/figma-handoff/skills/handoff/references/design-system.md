# Discover and join the design system

Detect. Never assume a framework, library or token format. Everything below is a list of places to look.

## In code

If `docs/handoff/design-system.md` exists, a previous run already joined this repo to its library. Start from it: library keys, the scale rules, the binding table and its hints. Check it against the current code and library rather than rebuilding it, and update it at the end of the run.

Read the repo's own documentation first: `DESIGN.md`, `AGENTS.md`, `CLAUDE.md`, `README`, and any design system docs. Stated rules beat anything you infer.

| Look for | Where |
|---|---|
| Design tokens | `*.tokens.json` or DTCG files, Style Dictionary configs, token packages |
| CSS variables | Global stylesheets, `:root` blocks, theme files |
| Tailwind | `@theme` blocks in CSS for v4, and config files for earlier versions. A config-only check misses v4 |
| Component library | `components.json`, `package.json` dependencies, `components/ui` style folders |
| Component docs | Storybook stories and manifests |
| Code Connect | `*.figma.ts`, `*.figma.tsx`, `*.figma.js`, and `figma.config.json` |
| Fonts | Font imports, `@font-face`, font utilities, CSS variables |
| Native platforms | Asset catalogs, SwiftUI colour and type extensions, Compose themes, `colors.xml` |

Read the prototype's own imports, because a monorepo may hold several systems and the prototype may use only one. Note the package version it pins, since the local checkout may be a different one.

## In Figma

1. `get_libraries` lists what the file uses and what the organization offers. A new file may not have the project's library added, so check `libraries_available_to_add` too. Stated library file keys in the repo are the most direct route: read `figma/*.figma.*`, `figma.config.json` and any Figma conventions docs first.
2. `search_design_system` finds components, variables and styles. If it is limited, read the library file directly with a read-only `use_figma` call.
3. Read local variables, including `codeSyntax`, modes and scopes.
4. Read text and effect styles.
5. `get_code_connect_map` shows confirmed component mappings.
6. Look at existing screens. They show how the system is really used.

## Join

For each token the prototype uses:

1. **Propose** a match by Figma code syntax, then by normalised name. Many libraries leave code syntax empty, so expect to fall through to names. For example, `--color-text-primary` normalises to `color/text/primary`.
2. **Confirm** by resolved value in every mode.
3. **Record** the method and confidence: `code-connect`, `code-syntax`, `name+value`, `value-only`, `unmatched`.

A name proposes and a value confirms. The same name can hold different values in code and Figma, and bind by what the code renders. Value alone is weak when several tokens share a value, because semantic and primitive layers must stay distinct. Prefer the semantic token.

For components, Code Connect is the strongest evidence. Without it, compare names and props, and flag the match as unconfirmed.

## Library first

Every element on a screen is a library instance unless no library component fits. Make the check explicit, because a prototype's custom styling makes library components look custom:

1. **List what the code imports** from the design system package: every component, including containers such as Dialog, Drawer, Card and DropdownMenu. This is the checklist.
2. **Search the Figma library for each one** with `search_design_system`, by the code's own name, scoped to the file's libraries. Batch the queries. Record the library key, or "none", for each in `design-system.md`.
3. **A component with a custom className is still that component.** `<Button variant="ghost" className="h-11 rounded-full">` is the library Ghost button with overrides. Use the library component, set its props and variants, and record the className difference in the inventory. Don't build a local lookalike.
4. **Build custom parts on library containers.** If the code wraps custom content in a design system Dialog, Drawer, Card or Menu, use that container and put the custom content in its slot. Slots take content directly, and swap slots take a small local content component.
5. **Small controls too.** Close, dismiss and icon buttons are library buttons, not frames with an icon in them.
6. **A local component is a last resort.** Make one only when the search found nothing, and say what was searched for in its description.

When the library's version looks different from the prototype, such as a different close button, use the library's and list the difference as a decision. Don't copy the prototype's styling onto a library component.

Read a component's defaults from its source, not just the props passed at the call site. A wrong variant is easy to miss.

## Binding table

The join maps tokens. The builder also needs the reverse: for each value the prototype renders, the token to bind. Write it from the code, not from values, because values tie. In one real library, white was `base/background`, `base/card`, `base/popover` and `base/sidebar`, and only the code's `bg-card` said which.

| Code | Renders | Bind to | Where |
|---|---|---|---|
| `bg-card` | `#FFFFFF` | `base/card` | Dialog surface |
| `gap-3` | 12 | `spacing/3` | Option list |
| `text-sm` | Inter 14/20 | Paragraph Small text style | Option labels |

Map the code's utility scale to the library's naming once, such as `gap-3` to `spacing/3` and `rounded-md` to `border-radius/rounded-md`, and record the rule rather than every row. Text styles are often missing from code; match them by family, weight, size, line height and letter spacing, and record the style key, because a plugin can't list library styles.

Turn each tie into a `HINTS` entry for `scripts/bind.js`, such as `'fill:#FFFFFF': 'base/card'`. A hint is file-wide, so when one value needs different tokens in different places, bind those by hand at build time and let the sweep handle the rest.

Library components carry the system's real usage. Instances already on the page show which collection the file binds, and the sweep prefers it.

## Report drift

Group drift into four classes:

| Class | Example | Default action |
|---|---|---|
| Code only | A token with no Figma variable | Report, and offer to add it |
| Figma only | A variable nothing in code uses | Report |
| Same name, different value | `radius/lg` differs between code and Figma | Bind what the code renders, and report it |
| Raw values | A hex colour or pixel value that bypasses tokens | Report it as a possible mistake |

Never promote a raw prototype value to a token automatically. It may be an error rather than a decision. Code wins for existing tokens by default.

If a production app exists alongside the prototype, its measured numbers record what exists and win over the prototype's numbers. If production is flawed, put the flaw on the to-decide list with its evidence.

## Output

Save `design-system.md` in the run folder with the sources found, the system state from the skill's table, the join table, the binding table and the drift report. Put a one-line summary in the inventory.

The library keys, scale rules, binding table and hints hold for every feature in the repo, so also save them to `docs/handoff/design-system.md`, and leave committing to the user. Drift and run details stay in the run folder.
