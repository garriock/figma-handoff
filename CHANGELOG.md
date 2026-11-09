# Changelog

## 0.3.0, 9 November 2026

### Added

- Update runs compare the Figma file with a snapshot from the last run, so a designer's changes get documented. `snapshot.js` records each screen's and component's controls and annotations, and `figma_diff.py` reports swapped controls, lost annotations and variants that became unused.

### Fixed

- A swapped instance silently lost its annotations, and the swap went undocumented when it happened inside a shared component.

## 0.2.1, 9 November 2026

### Changed

- Key components and Screen parts are compact panels. They use the row fill, group parts into columns, and fit their section to the contents.

## 0.2.0, 9 November 2026

### Changed

- The whole feature sits on one dark page: the brief on the left, scenario rows in the middle, and components on the right. The separate cover and brief pages are gone.
- Rows have more space: 160 of padding, 400 between desktop screens, 240 between mobile screens and 450 between rows.
- Annotations on flow screens cover only what would get built wrong (`MOCK:`, `STUB:`, `HARDCODED:`, `NOT BUILT:`), with at most two per screen. Behaviour goes in captions, content questions in the brief, and accessibility gaps in one annotation on the focus order row.
- Component specs move from annotations to component descriptions, which show in Dev Mode on every instance.

### Added

- Labelled flow arrows between screens, copied from a FigJam arrow in the file.
- The audit reports annotation load, arrow count and row widths.
- Field rules for writing annotations back and for escaped component descriptions.

## 0.1.0, 6 November 2026

### Added

- First release: inventory with reality and confidence labels, a gated nine-stage pipeline, role briefs for subagents, the documentation kit and the audit.
