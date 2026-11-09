// Read-only snapshot for a use_figma call. Set PAGE_ID, paste the file and run it.
// Save the result to <run folder>/figma-snapshot.json at the end of every run.
// On the next run, take a fresh snapshot and compare the two with figma_diff.py,
// so changes a designer made in Figma get documented, not just changes in the code.

const PAGE_ID = ''; // The handoff page.

const page = PAGE_ID ? await figma.getNodeByIdAsync(PAGE_ID) : figma.currentPage;
await figma.setCurrentPageAsync(page);

const text = (a) => a.label || a.labelMarkdown || '';

// The first instance on the way down from a screen, so nested parts of one control aren't listed twice.
function topInstances(screen) {
  return screen.findAll((n) => {
    if (n.type !== 'INSTANCE') return false;
    for (let p = n.parent; p && p !== screen; p = p.parent) if (p.type === 'INSTANCE') return false;
    return true;
  });
}

async function describeMain(instance) {
  const main = await instance.getMainComponentAsync();
  if (!main) return null;
  const set = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : null;
  return { key: main.key, name: set ? `${set.name} / ${main.name}` : main.name, remote: main.remote };
}

async function controlsOf(node) {
  const controls = {};
  for (const inst of topInstances(node)) controls[inst.id] = { name: inst.name, main: await describeMain(inst) };
  return controls;
}

// Screens and components are both checked for swaps, because a designer may change a part
// inside a component that every screen uses, and the screens then look unchanged here.
const screens = {};
const components = {};
for (const section of page.children.filter((n) => n.type === 'SECTION')) {
  for (const top of section.children) {
    if (top.type === 'COMPONENT' || top.type === 'COMPONENT_SET') {
      const variants = top.type === 'COMPONENT_SET' ? top.children : [top];
      const uses = {};
      const controls = {};
      for (const v of variants) {
        uses[v.name] = (await v.getInstancesAsync()).length;
        Object.assign(controls, await controlsOf(v));
      }
      components[top.id] = { name: top.name, section: section.name, description: top.description, uses, controls };
      continue;
    }
    if (!('findAll' in top) || top.type === 'TEXT') continue;
    const controls = await controlsOf(top);
    const annotated = {};
    for (const n of [top, ...top.findAll((x) => 'annotations' in x && x.annotations.length > 0)]) {
      if ('annotations' in n && n.annotations.length) annotated[n.id] = { name: n.name, labels: n.annotations.map(text) };
    }
    screens[top.id] = { name: top.name, section: section.name, controls, annotated };
  }
}

return { page: page.name, takenAt: new Date().toISOString(), screens, components };
