# Accessibility

Branch on platform first, because web semantics don't transfer to native apps. Resolve each item or mark it N/A, so that absence is a decision rather than an omission.

## Ten items

| # | Web | Native | From code or the prototype | Needs a person |
|---|---|---|---|---|
| 1 | Page title and language | Screen title | `<title>`, route, `lang` | Final wording, parts in other languages |
| 2 | Heading outline | Title, sparse headings | `h1` to `h6`, with type scale as a hint | Level where it differs from visual size |
| 3 | Landmarks and region names | Grouping | Landmark elements and roles | Region names, what forms a group |
| 4 | Controls: name, role, state | Label, Value, Role, Hint | Element type, visible text, ARIA, props | Names for icon-only controls, link or button intent |
| 5 | Images | Same | Presence, existing alt | Informative or decorative, and the description |
| 6 | Forms | Same | Labels, input type, required, autocomplete | Instructions, error wording, validation timing |
| 7 | Focus and reading order, exceptions only | Swipe order | Tab walk, DOM order against visual order | Intended order, initial focus, focus return |
| 8 | Keyboard behaviour for custom widgets | Gestures and actions | Component type matched to a known pattern | Shortcuts, non-standard behaviour |
| 9 | Dynamic feedback and announcements | Announcements | Toasts, status components, `aria-live` | What is announced, when, how urgently |
| 10 | Reflow, zoom and target size | Dynamic Type, 44pt or 48dp targets | Layout at 320px, bounding boxes | What moves, hides or stacks |

**Add only when present:** data tables, media alternatives, drag or gesture alternatives, timeouts and timed toasts, hover content, authentication and multi-step data entry.

## Use the running prototype

Where a prototype runs, separate three levels of evidence:

- **Report:** missing names, title, language, contrast on solid backgrounds, target size. Use automated checks such as axe-core when the project has them. They cover only part of WCAG.
- **Collect for review:** tab walks, reflow at 320px, hover and Esc behaviour.
- **Decide with a person:** everything about intent.

## How to write them

- Use the inventory's confidence labels: Extracted, Inferred or Needs decision. Never present a guess about intent as settled.
- Annotate exceptions only. Skip default tab order, visible names and unchanged UI.
- Put the outcome first and the semantics as a suggestion: "Users can skip to results. Suggest a skip link." Prefer native elements over ARIA, and never suggest `tabindex` above 0.
- For design system components, cite the component and add only what this instance must add. Coverage varies by component, so don't treat them as automatically accessible.
- Link complex widgets to the matching ARIA Authoring Practices pattern rather than inventing a spec.

## Where they go

- The inventory holds all ten.
- Native annotations in the Accessibility category hold the exceptions, starting with `A11Y:`.
- Focus order, only when it needs explaining, gets a separate overlay: a duplicate frame with `Doc/Focus` markers outside the design's own layers, placed outside the scenario rows. Keep one or two annotation types per overlay.

People on View seats can't see native annotations, so point them to the inventory.

## Closing report

In your reply, group what you found under color, hierarchy, content, images, interactivity, forms, layout and keyboard. Label items that go beyond WCAG as recommendations rather than failures.

State plainly that annotation doesn't replace testing with assistive technology and with disabled people.
