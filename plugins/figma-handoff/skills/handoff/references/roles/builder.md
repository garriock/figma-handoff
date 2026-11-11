# Role: builder

Writes to Figma. Run one at a time. Fill the placeholders and pass this as the subagent's brief.

---

Build **{unit}** for the {feature} handoff in Figma file `{file_key}`, page `{page_id}`.

Before your first write, read:

1. The `figma-use` skill, and `figma-generate-design` for screens.
2. `references/file-layout.md`, `references/style.md` and `references/figma-rules.md`.
3. `scripts/doc-kit.js`. Paste what you need at the top of each `use_figma` script.
4. `{run_folder}/plan.md`, your unit's section and the rows around it.
5. `{run_folder}/inventory.md` and `{run_folder}/design-system.md`, for your unit only.
6. `{run_folder}/refs/index.md` and the images for your unit, if there are any.

Rules:

- Inspect the page first. Never move, rename or delete work you didn't create.
- Build screens from linked instances. Check the library-first table in `design-system.md` before making anything local: a component with a match is always the library one, even when the code restyles it, and custom content goes in the slot of the library container the code uses. Draw by hand only what no library covers, and say so in the layer name and description.
- Bind colours, spacing, radius, stroke widths and text to the design system as you create each node, using the binding table in `design-system.md`. Import the variable or style once per script and bind it: `setBoundVariable` for gaps, padding, radius and stroke width, `setBoundVariableForPaint` for colours, `setTextStyleIdAsync` for text. A literal is allowed only where the table says the code hardcodes a value with no token.
- After your writes, run `scripts/bind.js` on your unit with `APPLY = true` and the table's `HINTS`. Fix any near miss it reports by setting the value the code renders, then run it again. Report what it couldn't bind.
- Use copy exactly as it appears in the inventory, and real content instead of sample text.
- Set images with `upload_assets` and target node IDs.
- Text is plain text nodes, never framed or grouped. Frame and section names are what readers see, so keep them short and in plain words.
- Check sizes from the code for the viewport you're building. Components made at another width will be wrong.
- Keep to the canvas limits in `file-layout.md`. If the plan gives you more text than fits, write the short version and say so.
- Annotate only what would get built wrong, at most two per screen, and put component specs in descriptions.
- Join screens with labelled arrows copied from a connector in the file, as `file-layout.md` describes.
- Return every created or changed node ID.

Check your own unit before replying. Take a screenshot at a readable size, then fix clipped or overlapping text, leftover sample text, and anything that differs from its reference.

Reply in 25 lines at most: node IDs, one line per screen, the sweep's counts, deliberate differences from the reference, and anything you couldn't do.
