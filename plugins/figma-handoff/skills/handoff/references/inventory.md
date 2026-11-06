# Inventory format

The inventory is the master record. It lives at `docs/handoff/<feature-slug>/inventory.md`, pinned to one commit. If the prototype isn't in git, pin it by hashing its source files and any published build, and record their modified dates. If a published version exists, confirm it matches the source and say whether it does. Measure one reference, say which, and note any differences, since a host page can change rendering even when the files match.

Every fact needs a citation. Use `path:line` for code, and a stated form for anything else, such as `run: name` for behaviour seen in a running prototype, or the channel and time for a message. List the forms you use at the top.

The prototype and the product's context may live in different places: another repo, chat, tickets or meeting notes. Record each source, and read product docs from the default branch rather than whatever the checkout is on. Search connected tools only if they are available and the user's request covers them, and say which sources you could not reach.

## Two labels

An item is one row in Claims, States, Behaviour, or Data and logic. Each gets one label from each axis, and the summary counts those rows. Keep the axes separate, because "Extracted, Mocked" is a confident statement about a fake.

**Reality: what the prototype does**

| Label | Meaning |
|---|---|
| Real | Works as it would in the product, including logic that belongs on the client, such as counts or validation |
| Mocked | Uses fake data that looks real, or a stand-in for a third-party service |
| Stubbed | The control exists, but does nothing, or implies an effect beyond the prototype that never happens. Saving to local storage is Stubbed when the product would save to a server |
| Hardcoded | A fixed rule or setting that should come from data or config. Sample content is Mocked |
| Not built | Implied by the design but missing |

**Confidence: how this document knows it**

| Label | Meaning |
|---|---|
| Extracted | Read directly from code or a running app |
| Inferred | Reasoned from the evidence. Say what from |
| Needs decision | A person must decide. Give a default where you can |

If a row is both known and undecided, such as code that is clear but a rule that isn't, label what the row states and add the question to Decisions.

**Triage** says how much design a state needs: must-design gets a screen, annotation-only gets a note, and deferred goes on the decisions list.

Routes, components, props, tokens, conditions, handlers, DOM order, headings and ARIA can usually be extracted. Which states matter, and why something exists, are usually inferred. Unbuilt states, final copy and product rules that the prototype only fakes need a person.

## Sections

Use this template. Write "None found" rather than dropping a section, so absence is visibly a finding.

```markdown
# <Feature> inventory

- Commit: <sha>
- Prototype status: Reference | Spec | Candidate for production
- Prototype URL:
- Figma file:
- Date:
- Design system: <state, plus one-line summary>

Prototype status comes from the user: Reference, Spec or Candidate for production.

## Summary
Real: <n> · Mocked: <n> · Stubbed: <n> · Hardcoded: <n> · Not built: <n>
Needs decision: <n>

## Sources
Where the prototype, product docs and decision records came from, with the branch and date.

## Claims
| Claim in the copy | Where | True in the prototype? | Reality | Confidence |

Product promises in the copy are often the most important fakes, so give each its own row. Flag claims that contradict each other.

## Variants
Each test arm, option or variant the prototype has, and which screens show it. Leave out prototype chrome such as variant pickers and test panels, and say so.

## Entry points
How users reach this, including flags and conditions.

## Scenarios
One per user situation. Each lists its screens, states and viewports.

## States
| Screen | State | Trigger | What shows | Copy | Triage | Reality | Confidence |

Triage is must-design, annotation-only or deferred. Check loading, empty, error, partial failure, permission, not found, offline, long content and first use.

## Behaviour
| Element | Trigger | Result | On failure | Reality | Confidence |

## Data and logic
| Source or call | Used by | Owner | Reality | Confidence |

Name logic with no clear owner.

## Looks wrong
Behaviour that seems flawed, with evidence, and tokens or values that bypass the design system.

## Takeover audit
Report what you find. This is not a security review, so never imply the prototype is safe.
- Auth and data access rules
- Secrets and client-exposed keys
- Mock data and stubbed APIs
- Hardcoded values
- Missing states
- Tests
- External call failures
- Unowned logic

## Components
| Element | Component | Source | Figma match | Method | Confidence |

The inventory may run before code and Figma are joined. If so, use the project's Code Connect files where they exist, otherwise component names, mark matches Inferred, and update the table after the join.

For custom components, split props into Figma only, both and code only. Mark prototype-only props, so nobody treats them as agreed API.

## Specs
Breakpoints, including what is fixed and what is fluid. Motion durations and easings.

## Accessibility
The items from accessibility.md, each resolved or marked N/A.

## Decisions
| Question | Default | Owner | Prototype says | Product docs say |

Include every conflict with a stated decision or open question in the project. Don't resolve them here.

## Annotated nodes
Links to annotated Figma nodes, so that coding agents can fetch them one by one.

## Change log
Dated Added, Changed and Fixed entries.
```

## Writing rules

- Quote copy exactly, and resolve translation keys to their real strings.
- Show the arithmetic for any threshold derived from code.
- If the brief or ticket disagrees with the code, record both and cite the code. A ticket is a list to verify, not the truth.
- List behaviour that looks wrong, with its evidence, so the plan can decide what to do about it.

## Scenario plan

Also write `scenarios.md` in the run folder, for the builder. List rows named by the user's situation, each with its screens, in order. For each screen, give the state, viewport, component names, exact copy, and the sample data to show. Use data that shows the design at its most typical, and realistic worst-case data on edge case screens. Keep to the smallest set of screens that covers the scenarios. If a screen cap forces a choice, keep the states that change what gets built, and put the rest in the inventory as annotation-only.
