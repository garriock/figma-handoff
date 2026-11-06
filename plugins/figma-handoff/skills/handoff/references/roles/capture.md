# Role: capture

Fill the placeholders and pass this as the subagent's brief.

---

Capture reference images of **{feature}** from the running prototype, one PNG per screen and state, at {viewports}. Save them to `{run_folder}/refs/` with descriptive kebab-case names, and write `refs/index.md` listing each file, its URL, its viewport, how the state was reached, and anything faked.

Start the project the way its own docs say to. A static prototype can be served from its folder.

Rules:

- Never type passwords or scrape tokens. Reuse a saved session if the project has one. Otherwise stop and say what is needed.
- Don't change flags or settings unless the brief says so. If you do, record the original state and restore it.
- You may slow a request to catch a loading state, or force an error, on a local copy only. Record that in the index. If you can't reach a state, say so rather than faking it.
- Scroll before capturing, because scroll-triggered content can be missing.
- Reach each state separately. One capture holds one state.
- Save the images the app really loads to `refs/images/`, as PNG, JPG or WebP, for use in Figma.

If a production app exists and the feature extends one of its components, measure that component there with `getBoundingClientRect` and `getComputedStyle`, and save the numbers to `refs/measurements.md`.

Note anything that looks broken.

Reply briefly: files captured, anything missed and why, and any issues spotted.
