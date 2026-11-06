# Role: inventory

Read-only. Fill the placeholders and pass this as the subagent's brief.

---

Build a cited inventory of **{feature}** at commit `{commit}` in `{repo}`, so it can be documented in Figma. Don't change any project files. Fetching git refs is fine, because the checkout may be behind or on another branch, and if so read from the commit rather than the working tree. If the prototype isn't in git, pin it as `references/inventory.md` describes. You may run the prototype locally to confirm behaviour, and read connected tools for product context, but don't send data to any external service or post anything. Leave prototype chrome out of accessibility checks.

Start from: {entry_points}. Follow imports into shared components, hooks, providers, routes, flags and tests. Tests are good evidence of intended behaviour.

Read `references/inventory.md` for the format and labels, and `references/accessibility.md` for that section. Write the inventory to `docs/handoff/<feature-slug>/inventory.md` in the repo, or `{run_folder}/inventory.md` if the user doesn't want it in the repo, and the scenario plan to `{run_folder}/scenarios.md`. Every fact needs a citation.

Pay particular attention to:

- **What is real.** Trace each data source and handler to where it ends. A button with a handler that only sets local state is Stubbed, however finished it looks.
- **Every state,** including those with no route to them in the prototype.
- **Exact copy.** Resolve translation keys.
- **Components.** Record the component, its source and its props, and read defaults from the source.
- **Tokens.** Note values that bypass tokens.
- **Claims in the copy.** Check each product promise against what the prototype does, and against the project's decision records if it has them.
- **Behaviour that looks wrong,** such as content clipped by a fixed height, nested scrollers or hidden state.

Treat any brief or ticket as a list to verify: {brief}

Reply in 40 lines at most: the output paths, the screens and states found, reality counts, each disagreement between the brief and the code, and the accessibility findings that matter most. The full accessibility report goes in the inventory.
