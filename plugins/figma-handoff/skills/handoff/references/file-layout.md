# File layout

If the file has a structure, fit into it. Create this default only where none exists.

## Pages

1. **Cover:** name, owner, status and date. Nothing else.
2. **Brief:** the one page everyone reads.
3. **Ready for dev:** one page per milestone or platform, holding the scenario rows.

Add an Archive page only when there is something to archive. Exploration stays with the designer. If a capture has to sit on the canvas, use a temporary `Reference` page and delete it before handover.

Readers ask which page is latest and whether it is approved, ahead of asking for more detail. Make those two answers impossible to miss.

## Brief

One frame that takes under a minute to read, about 250 words at most.

1. **Title.**
2. **Lede:** one sentence on who this is for and what it does for them.
3. **Role line:** "Code is the record of behaviour. This file is the record of visual intent. Prototype status: Reference."
4. **Reality line:** "Nothing is in the product yet. Real here means in the prototype: search, filters. Mocked: product data. Not built: checkout errors." Use the inventory's labels exactly, and open with whether the feature exists in the product.
5. **What it does:** at most six short bullets, in the proposed tense if the feature isn't built, beside an instance of the real component where there is one.
6. **To decide:** at most seven rows of question and default. A default is what happens if nobody answers. For shipped code, use a short tested QA list instead.
7. **Source line:** commit or hash, a real link to the prototype, and where the inventory lives.
8. **Change log:** dated Added, Changed and Fixed entries.

Keep the reality line even when it seems unflattering. It is the one piece of the inventory that every reader must see. Write it from the inventory's labels, not the prototype's appearance: "Real" means behaviour that works, not screens that look finished, and "Not built" names the missing states rather than saying everything.

## Scenario rows

- **One scenario per row, and one section per row.** All rows share a left edge and width, so scrolling down the left edge reads like a contents list.
- **Title rows by the user's situation:** "Member filters results", not "Filter panel". The section's name is the title, with the status after it: "Member filters results · Reference". Don't repeat it as text inside the section.
- **Left to right is sequence.** Top to bottom lists scenarios. A significant variant becomes its own row or an edge case.
- **End with edge cases:** loading, empty, error and permission.
- **Each screen frame sits directly under its section,** which status marking requires. Don't wrap screens in a spec frame.
- **Use real content and imagery** from the prototype, never library sample text.
- **Show a mobile frame only where the structure differs.** Otherwise write one sentence on what changes, naming what is fixed and fluid.
- **Components carry their own interactive states.** Screens show only screen-level states.
- **Draw flow lines only where a row branches.** Use plain lines.

Use a step-by-path matrix instead of rows when the feature branches heavily by condition: steps as columns, conditions as rows, and an empty cell where a path skips a step.

## On the canvas

Figma shows a label for every frame, instance and component that sits directly under a section or the page. Those labels scale with zoom, so use them as the descriptions, and name these nodes in plain words. Framed text adds a second label that collides with everything around it at 100%, so any other text must be a plain text node, never framed or grouped.

- One caption per screen. Its title is the screen frame's name, such as "Results, filtered", in six words or fewer. Its body, if it needs one, is at most one sentence in a plain text node 16 below the screen.
- At most three margin notes per row. Needing more usually means a screen isn't doing its job.
- A pointer cursor on the click target of each screen that leads to the next, including dismiss and close actions. Use the project's cursor component if it has one, placed inside the screen frame so it gets no label. Cursors are the one thing that sits on the UI, and they must look like cursors rather than badges.
- No other documentation sits on top of the UI.
- No pixel values, code paths, or question marks on flow screens.
- If a to-decide item could remove a screen, say so in that screen's caption. For example, "Later phase if the simpler option wins."
- Mark simulations as simulated in the caption. Don't leave that to an annotation.

Move everything else to the inventory.

## Custom components

A library component gets a link. A component no library covers gets its own row on the same page, named so it can move into the system later. Keep these key components apart from layout scaffolding such as app shells:

- The variants laid out.
- Native annotations on the master's default variant, one per part, with pinned properties so Figma shows the real values and tokens. Add a short `SPEC:` label only for what properties can't show, such as hover behaviour or a missing token.
- Native measurements for the two or three spacing values that matter.

Don't draw anatomy diagrams, numbered markers or spec tables. Annotations stay attached to the layer, stay current and reach coding agents, while a drawn spec is a second copy that can drift. The same values also go in the inventory, for people on View seats.

The focus order overlay is the only numbered drawing in the file.

## Native annotations

Keep them short, and put the meaning in plain `label` text, because category data and Markdown may not reach every reader. Start each with a fixed prefix so it stays useful when flattened to one string:

`MOCK:` · `STUB:` · `HARDCODED:` · `NOT BUILT:` · `A11Y:` · `BEHAVIOUR:` · `CONTENT:` · `SPEC:`

Annotate exceptions only, on the control they describe rather than the whole screen, so they travel with the instance. Use Figma's default categories (Development, Interaction, Accessibility, Content) where they exist.

## Status

Leave Ready for dev to a person. Figma's Changed state doesn't fire for library instance changes or attached variable changes, so a well-linked file reports less than you would expect. That is why the visible change log matters.
