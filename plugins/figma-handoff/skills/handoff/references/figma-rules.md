# Figma working rules

Figma's `figma-use` skill is the authority on the Plugin API, so read it first. These rules cover what this skill's work adds. Those marked *field* come from real runs, not from Figma's documentation, so treat them as working rules and report any that prove wrong.

## Choosing a route

| Route | Output | Use |
|---|---|---|
| `use_figma` | Real components, variants, variables and auto layout | The main route |
| A capture tool such as `generate_figma_design` | Flat layers with no library connection | Visual target and image source, then delete |
| `html_to_figma` | Plain layers | Fallback reference only |
| `send_code_to_figma` | A code layer, not design layers | Optional live reference |

Tool availability varies by client, so detect it at run time. A screenshot or flattened capture never counts as a screen.

## Call budget

Figma limits MCP calls by seat, and a limit error stops the whole run. A Full seat on an Organization plan allows 15 read calls a minute and 200 a day, and `use_figma` calls can hit the same limit. View and Collab seats get far fewer. Every agent in the run, and any other session on the account, draws on one budget.

- Batch reads into one `use_figma` call rather than many small ones.
- Save component keys, token keys and node IDs to the run folder, and never look them up twice.
- Don't run parallel Figma calls during discovery.
- Prefer one screenshot per row to one per screen.
- A 14-screen build took about 30 calls, so a full run fits a daily budget, as long as nothing retries in a loop.
- If a limit error appears, stop, tell the user, save state and resume later. Don't retry in a loop.

## Building

- **One writer at a time.** Concurrent writers race on positions and IDs.
- **Keep calls small.** Build about one section per call and return every node ID. Output is limited, and large responses get cut off.
- **Check before retrying.** A failed `use_figma` script rolls back, but confirm that before repeating it, and make retries safe to repeat.
- **Bind everything the system covers:** fills, strokes, spacing, radius and text. Allow a literal only where the code hardcodes a value with no token, and name the layer after it.
- **Replace all sample copy** in library components with exact strings from the inventory.
- **Keep key components on the page they document.** Instances of masters on another page can't be understood or fixed from here. Clone them across and swap the instances.
- **Avoid quote marks in annotation labels.** `label` stores straight quotes as `&quot;`, which reaches agents and readers as literal text. Reword, or use `labelMarkdown`.
- **Name screen layers** like routes and states, not `Frame 12`.

## Field rules

| Area | Rule |
|---|---|
| Cloning | Clone from the original frame, never from a clone. Clones of clones can re-lay-out nested instances |
| Call boundaries | Create in one call and traverse in the next. `findAll` straight after `clone` may return nothing |
| Cloned auto layout | Appended nodes join the flow. Set `layoutPositioning = 'ABSOLUTE'` before setting `x` and `y` |
| Deletion | Delete one or two heavy pages per call, because large deletions can drop the connection. Re-read the page list before retrying |
| Sections | Sections don't auto-layout. Position children by hand, resize, and restack sections at the end |
| Sizing | `resize()` resets sizing modes, so call it before setting hug or fill |
| Overrides | Instance children can't be moved. Add or swap a variant instead of fighting the override |
| Swaps | `swapComponent` can reset text. Capture strings first and write them back. Read the nested tree in the next call, because it stays stale until then. Nested variant overrides can stay on the old master, so swap nested instances directly |
| Text in instances | Text can keep a stale height. Re-set the text to force a reflow |
| Wrapping titles | Stack title and body in one vertical auto layout frame, so a two-line title can't collide with its caption |
| Images | `use_figma` can't fetch images. Build the frame, then call `upload_assets` with those node IDs. Omitting them drops loose frames on the page |
| Reusing images | Upload once, read `imageHash` from the fill, and reuse it on other nodes |
| Versions | Named versions can't be saved through the API. Use the change log and ask the user to save one |
| Flow lines | `createConnector` doesn't exist in design files, so draw lines |
| Feature checks | Reading a missing `figma` property throws, even with `typeof`. Wrap each check in `try` so one gap doesn't stop the script |
| Library search | `search_design_system` can be limited, at about 20 queries a call. Fall back to reading the library file directly |
| Library lists | `get_libraries` can miss libraries that still import by key |
| Tokens | The same name can resolve to different values, so bind by resolved value |

## Fonts

Call `listAvailableFontsAsync()` before `loadFontAsync()`, and check for missing fonts afterwards. Text style changes need loaded fonts too.

## Status and annotations

Tested through `use_figma` on a Full seat on an Organization plan:

- **Annotations work** on frames and child layers, and they reach coding agents. `get_design_context` returns them as `data-annotations`, or `data-development-annotations` for the Development category, including on children of the node requested. Put the meaning in `label`, and set the matching category.
- **Use `properties` for specs.** Pinned properties show live values and tokens, so prefer them to typing numbers into a label.
- **Annotations stay on the node they're set on.** Layers inside instances can hold their own, but instances don't inherit a master's. Put specs on the master, and put notes about one screen on that screen's instance.
- **Measurements work** through `addMeasurement` in the design editor, on layers and inside instances.
- **Get categories** from `figma.annotations.getAnnotationCategoriesAsync()`. Don't assume IDs across files.
- **`devStatus` can't be written.** The API refuses it, so a person has to mark Ready for dev. Don't offer to do it.
- **Dev resources can't be written.** Put links in the inventory and the brief's source line.
- **`setSharedPluginData` works,** while `setPluginData` doesn't. Layer names with the `Doc/` prefix are still the simpler way to find owned nodes.
