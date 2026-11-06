# Documentation style

Screens use the project's design system. Documentation chrome uses these rules, so it stays quiet and clearly separate from the design. Never name a style source in generated documentation.

Placement does more for a clean look than any palette. Get that right first.

## Rules

| Area | Rule |
|---|---|
| Canvas | Light and neutral by default. Match the file if it has its own convention |
| Placement | Documentation sits outside the frame, never on the UI |
| Labels | Figma's frame and section labels carry the titles. Other text is plain text nodes with no frame or group |
| Type | One neutral sans and one matching mono. Section headings semibold with slight negative tracking. Everything else regular, 12 to 14px at 100% zoom |
| Sizes | Notes 14/20, labels 13/16. Enlarge headings as far as needed to stay readable at the zoom the page is read at |
| Hierarchy | Size and weight only. Sentence case. No all-caps labels or eyebrows |
| Mono | Only for token names, values, paths, layer names and identifiers, about one size below adjacent sans. Never whole sentences or tables |
| Numbers | Tabular figures where the font has them. Dates, counts and percentages stay in sans |
| Colour | Neutral grays, each with one job: near-black text, mid-gray secondary text, light gray borders, white or near-white surfaces |
| Accent | One colour, for cursors, focus order markers and links |
| Status | Status colours appear only on status badges, always with a text label |
| Spacing | 4px base: 4, 8, 12, 16, 24, 32, 48, 64. Use 8 to 16 inside a group, 24 to 32 between groups, 48 between sections, 64 for a major break |
| Lines | 1px light gray, drawn once, never doubled. Prefer space to a line, and a line to a box |
| Surfaces | Flat. No shadows, gradients or nested cards. Radius 6 to 8px. Notes and tables sit directly on the page |
| Redlines | None. Use native measurements and annotations |

Restraint isn't just thin rules and empty space. Give the file one deliberate anchor, usually the cover or the first row.

## Font order

Resolve a role, not a name, and check availability before loading:

- **Sans:** project font, then Inter, then Geist, then any neutral sans.
- **Mono:** project mono font, then JetBrains Mono, then Geist Mono, then any monospace.

`resolveFont()` in `doc-kit.js` handles this. The font is the only style choice that names a family, and it never appears in documentation copy.

## Kit

Keep the kit small, and generate it inside the target file with role-based names. Never add documentation parts to a product library.

| Layer name | Use |
|---|---|
| `Doc/Heading` | Page heading on the brief or cover, not in rows |
| `Doc/Caption` | One caption body per screen, plain text |
| `Doc/Note` | Margin note |
| `Doc/Flow` | Plain flow line where a row branches |
| `Doc/Cursor` | Marker on a click target |
| `Doc/Focus` | Focus order marker, overlay frames only |

The `Doc/` prefix goes only on nodes that show no label on the canvas, such as text, lines and shapes. Frames directly under a section or the page need plain names, because readers see them. The prefix, the Cover and Brief names and `setSharedPluginData('handoff', 'owner', 'skill')` tell update runs and the audit which nodes this skill owns.

## Avoid

- Long text on the canvas.
- Several category colours.
- All annotation types on one frame.
- Redlines on flow screens.
- Decorative section numbers.
- Boxes around every group.
