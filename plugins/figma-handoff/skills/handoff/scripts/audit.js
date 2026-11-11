// Read-only audit for a use_figma call. Set PAGE_IDS, paste the file and run it.
// It reports numbers rather than pass or fail. No source gives reliable thresholds yet.

const PAGE_IDS = []; // Empty means the current page.
const PRODUCT_FONT = null; // The project's font family, if it has one.
const PLACEHOLDERS = /^(title|body|button|label|text|lorem|placeholder|heading|description|item title|brand name)\b/i;
const DEFAULT_NAME = /^(frame|group|rectangle|ellipse|vector|line|text|component|instance|section|polygon)\s*\d*$/i;

function isDoc(node) {
  for (let n = node; n && n.type !== 'PAGE'; n = n.parent) {
    if (n.name && n.name.startsWith('Doc/')) return true;
    if (n.name && n.name.startsWith('Flow: ')) return true;
    if (n.getSharedPluginData('handoff', 'kind') === 'doc') return true;
    if (n.name === 'Brief' && n.parent && n.parent.type === 'PAGE') return true; // Briefs from before the kind marker.
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
    paints: 0, boundPaints: 0, strokePaints: 0, boundStrokePaints: 0,
    dims: 0, boundDims: 0,
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

    // Inside an instance the library owns the values, so count only what this file controls.
    let inInstance = false;
    for (let p = n.parent; p && p.type !== 'PAGE'; p = p.parent) if (p.type === 'INSTANCE') { inInstance = true; break; }
    // Sections are canvas chrome and instances take their values from the library, so neither counts.
    if (!inInstance && n.type !== 'SECTION' && n.type !== 'INSTANCE') {
      const bound = n.boundVariables || {};
      const dims = [];
      if ('layoutMode' in n && n.layoutMode !== 'NONE' && n.layoutMode !== 'GRID') {
        if (n.primaryAxisAlignItems !== 'SPACE_BETWEEN') dims.push('itemSpacing');
        dims.push('paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom');
      }
      if ('cornerRadius' in n && n.type !== 'TEXT' && n.type !== 'COMPONENT_SET') {
        if (n.cornerRadius === figma.mixed) dims.push('topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius');
        else dims.push(bound.topLeftRadius ? 'topLeftRadius' : 'cornerRadius');
      }
      if ('strokeWeight' in n && Array.isArray(n.strokes) && n.strokes.length && n.strokeWeight !== figma.mixed) dims.push('strokeWeight');
      for (const f of dims) {
        if (typeof n[f] !== 'number' || n[f] === 0) continue;
        r.dims += 1;
        if (bound[f] || (f === 'strokeWeight' && (bound.strokeTopWeight || bound.strokeLeftWeight))) r.boundDims += 1;
      }
      if ('strokes' in n && Array.isArray(n.strokes)) for (const paint of n.strokes) {
        if (paint.type !== 'SOLID' || paint.visible === false) continue;
        r.strokePaints += 1;
        if ((paint.boundVariables && paint.boundVariables.color) || n.strokeStyleId) r.boundStrokePaints += 1;
      }
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

// Annotations per screen in scenario rows, and on components. Rows should carry only exceptions.
function annotationLoad(page) {
  const perScreen = [];
  let onComponents = 0;
  let total = 0;
  for (const holder of page.children.filter((n) => n.type === 'SECTION')) {
    for (const top of holder.children) {
      if (!('findAll' in top)) continue;
      const nodes = [top, ...top.findAll((n) => 'annotations' in n && n.annotations.length > 0)];
      const count = nodes.reduce((sum, n) => sum + (('annotations' in n && n.annotations) ? n.annotations.length : 0), 0);
      total += count;
      if (top.type === 'COMPONENT' || top.type === 'COMPONENT_SET') onComponents += count;
      else if (count > 0) perScreen.push([top.id, count]);
    }
  }
  return { total, onComponents, maxPerScreen: Math.max(0, ...perScreen.map(([, c]) => c)), screensOverTwo: perScreen.filter(([, c]) => c > 2).map(([id]) => id) };
}

// Frames named like controls or containers that aren't library instances. These are candidates,
// not failures: a tab panel or a justified custom part will show up too. Check each one against
// the library-first table in design-system.md.
const CONTROL_NAME = /\b(button|close|dismiss|menu|dropdown|dialog|modal|sheet|drawer|card|toast|badge|input|tab|tooltip|popover|select|checkbox|switch|avatar)\b/i;
function handBuiltControls(page) {
  const found = [];
  for (const n of page.findAll((x) => x.type === 'FRAME' && CONTROL_NAME.test(x.name))) {
    let insideInstance = false;
    for (let p = n.parent; p && p.type !== 'PAGE'; p = p.parent) if (p.type === 'INSTANCE') { insideInstance = true; break; }
    if (insideInstance || isDoc(n)) continue;
    if (n.parent && n.parent.type === 'SECTION') continue; // Screens and cards on the canvas, not controls.
    found.push(`${n.id} ${n.name}`);
  }
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
    strokesBoundPct: share(r.boundStrokePaints, r.strokePaints),
    spacingRadiusBoundPct: share(r.boundDims, r.dims), // Gaps, padding, radius and stroke widths outside instances.
    textWithStylePct: share(r.styledText, r.text),
    defaultNames: r.defaultNames.slice(0, 50),
    placeholderText: r.placeholderText.slice(0, 50),
    overflowingText: r.overflowingText.slice(0, 50),
    possibleScreenshots: r.imageFrames.slice(0, 50),
    offFontText: r.offFontText.slice(0, 50),
    labelNoise: labelNoise(page).slice(0, 50),
    overlappingSections: overlaps(page),
    sectionLeftEdges: leftEdges(page),
    sectionWidths: [...new Set(page.children.filter((n) => n.type === 'SECTION' && n.getSharedPluginData('handoff', 'kind') !== 'components').map((n) => Math.round(n.width)))],
    annotations: annotationLoad(page),
    flowConnectors: page.findAll((n) => n.type === 'CONNECTOR').length,
    handBuiltControls: handBuiltControls(page).slice(0, 50),
  });
}
return results;
