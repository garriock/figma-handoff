# Discover and join the design system

Detect. Never assume a framework, library or token format. Everything below is a list of places to look.

## In code

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

Read a component's defaults from its source, not just the props passed at the call site. A wrong variant is easy to miss.

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

Save `design-system.md` in the run folder with the sources found, the system state from the skill's table, the join table and the drift report. Put a one-line summary in the inventory.
