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
- Build screens from linked instances. Draw by hand only what no library covers, and say so in the layer name.
- Bind colours, spacing, radius and text to the design system. Follow the join table, and don't guess at a token.
- Use copy exactly as it appears in the inventory, and real content instead of sample text.
- Set images with `upload_assets` and target node IDs.
- Text is plain text nodes, never framed or grouped. Frame and section names are what readers see, so keep them short and in plain words.
- Check sizes from the code for the viewport you're building. Components made at another width will be wrong.
- Keep to the canvas limits in `file-layout.md`. If the plan gives you more text than fits, write the short version and say so.
- Return every created or changed node ID.

Check your own unit before replying. Take a screenshot at a readable size, then fix clipped or overlapping text, leftover sample text, and anything that differs from its reference.

Reply in 25 lines at most: node IDs, one line per screen, deliberate differences from the reference, and anything you couldn't do.
