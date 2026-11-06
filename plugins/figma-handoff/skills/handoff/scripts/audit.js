// Read-only audit for a use_figma call. Set PAGE_IDS, paste the file and run it.
// It reports numbers rather than pass or fail. No source gives reliable thresholds yet.

const PAGE_IDS = []; // Empty means the current page.
const PRODUCT_FONT = null; // The project's font family, if it has one.
const PLACEHOLDERS = /^(title|body|button|label|text|lorem|placeholder|heading|description|item title|brand name)\b/i;
const DEFAULT_NAME = /^(frame|group|rectangle|ellipse|vector|line|text|component|instance|section|polygon)\s*\d*$/i;

function isDoc(node) {
  for (let n = node; n && n.type !== 'PAGE'; n = n.parent) {
    if (n.name && n.name.startsWith('Doc/')) return true;
    if (n.type !== 'SECTION' && n.getSharedPluginData('handoff', 'owner') === 'skill') return true;
  }
  return false;
}

// Frames directly under a section or page show a label, so their names must read as plain words.
function labelNoise(page) {
  const holders = [page, ...page.children.filter((n) => n.type === 'SECTION')];
  const noisy = [];
  for (const holder of holders) {
    for (const n of holder.children) {
      if (n.type === 'TEXT' || n.type === 'LINE' || n.type === 'VECTOR' || n.type === 'SECTION') continue;
      if (/Doc\/|[\/_]|^(frame|group)\b/i.test(n.name)) noisy.push(n.id);
    }
  }
  return noisy;
}

function auditNodes(nodes) {
  const r = {
    nodes: 0, leafs: 0, inInstances: 0,
    paints: 0, boundPaints: 0,
    text: 0, styledText: 0,
    defaultNames: [], placeholderText: [], overflowingText: [], imageFrames: [], offFontText: [],
  };

  for (const n of nodes) {
    if (isDoc(n)) continue;
    r.nodes += 1;
    const leaf = !('children' in n) || n.children.length === 0;
    if (leaf) {
      r.leafs += 1;
      for (let p = n.parent; p && p.type !== 'PAGE'; p = p.parent) {
        if (p.type === 'INSTANCE') { r.inInstances += 1; break; }
      }
    }
    if (DEFAULT_NAME.test(n.name)) r.defaultNames.push(n.id);

    if ('fills' in n && Array.isArray(n.fills)) {
      const bound = (n.boundVariables && n.boundVariables.fills) || [];
      n.fills.forEach((paint, i) => {
        if (paint.visible === false) return;
        if (paint.type === 'SOLID') {
          r.paints += 1;
          if (bound[i] || n.fillStyleId) r.boundPaints += 1;
        }
        if (paint.type === 'IMAGE' && n.parent && n.parent.width > 0) {
          const cover = (n.width * n.height) / (n.parent.width * n.parent.height);
          if (cover > 0.8) r.imageFrames.push(n.id);
        }
      });
    }

    if (n.type === 'TEXT') {
      r.text += 1;
      if (n.textStyleId) r.styledText += 1;
      if (PLACEHOLDERS.test(n.characters.trim())) r.placeholderText.push(n.id);
      if (PRODUCT_FONT && n.fontName !== figma.mixed && n.fontName.family !== PRODUCT_FONT) r.offFontText.push(n.id);
      const box = n.parent && n.parent.absoluteBoundingBox;
      const own = n.absoluteBoundingBox;
      if (box && own && own.x + own.width > box.x + box.width + 1) r.overflowingText.push(n.id);
    }
  }
  return r;
}

function overlaps(page) {
  const sections = page.children.filter((n) => n.type === 'SECTION');
  const found = [];
  sections.forEach((a, i) => {
    for (const b of sections.slice(i + 1)) {
      const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      if (!apart) found.push([a.id, b.id]);
    }
  });
  return found;
}

function leftEdges(page) {
  return [...new Set(page.children.filter((n) => n.type === 'SECTION').map((n) => Math.round(n.x)))];
}

const share = (part, whole) => (whole ? Math.round((part / whole) * 100) : null);

const pages = PAGE_IDS.length
  ? await Promise.all(PAGE_IDS.map((id) => figma.getNodeByIdAsync(id)))
  : [figma.currentPage];

const results = [];
for (const page of pages) {
  await page.loadAsync();
  const r = auditNodes(page.findAll());
  results.push({
    page: page.name,
    designNodes: r.nodes,
    leafLayersInInstancesPct: share(r.inInstances, r.leafs),
    fillsBoundPct: share(r.boundPaints, r.paints),
    textWithStylePct: share(r.styledText, r.text),
    defaultNames: r.defaultNames.slice(0, 50),
    placeholderText: r.placeholderText.slice(0, 50),
    overflowingText: r.overflowingText.slice(0, 50),
    possibleScreenshots: r.imageFrames.slice(0, 50),
    offFontText: r.offFontText.slice(0, 50),
    labelNoise: labelNoise(page).slice(0, 50),
    overlappingSections: overlaps(page),
    sectionLeftEdges: leftEdges(page),
  });
}
return results;
