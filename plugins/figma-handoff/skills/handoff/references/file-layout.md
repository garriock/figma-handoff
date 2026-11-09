# File layout

If the file has a structure, fit into it. Create this default only where none exists.

## One page

Put the whole feature on one page, so a reader can find everything by zooming out:

1. **Brief** on the left, as a white card.
2. **Scenario rows** in the middle, stacked down one left edge.
3. **Key components** on the right, as a white section, with any screen parts below it.

Add a page only for a second milestone or platform, or an Archive when there is something to archive. Exploration stays with the designer. If a capture has to sit on the canvas, use a temporary `Reference` page and delete it before handover.

Readers ask which part is latest and whether it is approved before they ask for detail. Make those two answers impossible to miss.

## Brief

A white card with a radius of 24 and 96 of padding, 1440 wide, 500 to the left of the rows and top-aligned with them. It takes under a minute to read, about 250 words at most.

1. **Title.**
2. **Lede:** one sentence on who this is for and what it does for them.
3. **Role line:** "Code is the record of behaviour. This file is the record of visual intent. Prototype status: Reference."
4. **Reality line:** "Nothing is in the product yet. Real here means in the prototype: search, filters. Mocked: product data. Not built: checkout errors." Use the inventory's labels exactly, and open with whether the feature exists in the product.
5. **What it does:** at most six short bullets, in the proposed tense if the feature isn't built.
6. **To decide:** at most seven rows of question and default. A default is what happens if nobody answers. For shipped code, use a short tested QA list instead.
7. **Source line:** commit or hash, a real link to the prototype, and where the inventory lives.
8. **Change log:** dated Added, Changed and Fixed entries.

Keep the reality line even when it seems unflattering. It is the one piece of the inventory that every reader must see. Write it from the inventory's labels, not the prototype's appearance: "Real" means behaviour that works, not screens that look finished, and "Not built" names the missing states rather than saying everything.

## Scenario rows

- **One scenario per row, and one section per row.** All rows share a left edge and width, so scrolling down the left edge reads like a contents list.
- **Title rows by the user's situation:** "Member filters results", not "Filter panel". The section's name is the title, with the status after it: "Member filters results · Reference". Don't repeat it as text inside the section.
- **Left to right is sequence.** Top to bottom lists scenarios. A significant variant becomes its own row or an edge case.
- **Space generously.** 160 of padding inside each row, 400 between desktop screens, 240 between mobile screens and 450 between rows. Screens are top-aligned. Space does the work that boxes and dividers would otherwise do.
- **End with edge cases:** loading, empty, error and permission.
- **Each screen frame sits directly under its section,** which status marking requires. Don't wrap screens in a spec frame.
- **Use real content and imagery** from the prototype, never library sample text.
- **Show a mobile frame only where the structure differs.** Otherwise write one sentence on what changes, naming what is fixed and fluid.
- **Components carry their own interactive states.** Screens show only screen-level states.

## Flow arrows

Join each screen to the one its action leads to with a labelled connector, the same arrow FigJam draws.

- Run it from the right edge of one screen to the left edge of the next, as a straight line in the gap. Don't start it on the UI, because a line across the screen hides it.
- Label it with the action in four words or fewer: "Clicks the row", "Dismisses the card". The pointer cursor inside the screen shows exactly where the click lands.
- Draw one only where one screen leads to the next. Alternative outcomes side by side in a row don't need one.
- Prefer arrows within a row. Cross-row arrows tangle quickly.

Figma's tools can't create a connector in a design file, but they can copy one. Look for a connector in the file first. If there isn't one, ask the user to place one arrow from FigJam anywhere on the page, and copy every flow arrow from it. If they would rather not, draw plain lines instead and say so. [figma-rules.md](figma-rules.md) has the details.

## On the canvas

Figma shows a label for every frame, instance and component that sits directly under a section or the page. Those labels scale with zoom, so use them as the descriptions, and name these nodes in plain words. Framed text adds a second label that collides with everything around it at 100%, so any other text must be a plain text node, never framed or grouped.

- One caption per screen. Its title is the screen frame's name, such as "Results, filtered", in six words or fewer. Its body, if it needs one, is at most one sentence in a plain text node 24 below the screen.
- At most three margin notes per row, under the caption of the screen they belong to.
- A pointer cursor on the click target of each screen that leads to the next, including dismiss and close actions. Use the project's cursor component if it has one, placed inside the screen frame so it gets no label. Cursors are the one thing that sits on the UI, and they must look like cursors rather than badges.
- No other documentation sits on top of the UI.
- No pixel values, code paths, or question marks on flow screens.
- If a to-decide item could remove a screen, say so in that screen's caption. For example, "Later phase if the simpler option wins."
- Mark simulations as simulated in the caption. Don't leave that to an annotation.

Move everything else to the inventory.

## Native annotations

Annotations are for one thing on flow screens: **what would get built wrong if someone copied the prototype.** A developer who learns that every annotation matters will read them all. One who meets fifty will skim them.

| Prefix | Where it goes |
|---|---|
| `MOCK:` `STUB:` `HARDCODED:` `NOT BUILT:` | An annotation on the control it describes, in the flow rows |
| `BEHAVIOUR:` | The screen's caption. Timings and edge rules go in the inventory |
| `CONTENT:` | The brief's to-decide list, once |
| `A11Y:` | One annotation on the focus order frame, listing the gaps to fix |
| `SPEC:` | The component's description |

- Aim for one annotation per screen, and never more than two. Merge duplicates: when two buttons share one stub, annotate the first.
- Don't annotate the whole frame with something the brief's reality line already says.
- Don't add annotations that only pin properties. Dev Mode already shows those values when someone inspects a layer.
- Keep each one short, and put the meaning in plain `label` text, because category data and Markdown may not reach every reader. Use Figma's default categories (Development, Interaction, Accessibility, Content) where they exist.

## Custom components

A library component gets a link. A component no library covers goes in the Key components section, named so it can move into the system later. Keep these key components apart from layout scaffolding such as app shells:

- The variants laid out.
- A **description** on the component or component set: what it is in code, then a `Specs` list with one line per part, such as "Close: No fill. Sits right-3, top-3." Descriptions show in Dev Mode on every instance and reach coding agents, while annotations stay on the main component.
- Native measurements for the two or three spacing values that matter.

Don't draw anatomy diagrams, numbered markers or spec tables, and don't annotate component parts. A drawn spec is a second copy that drifts. The same values also go in the inventory, for people on View seats.

The focus order overlay is the only numbered drawing in the file.

## Status

Leave Ready for dev to a person. Figma's Changed state doesn't fire for library instance changes or attached variable changes, so a well-linked file reports less than you would expect. That is why the visible change log matters.
