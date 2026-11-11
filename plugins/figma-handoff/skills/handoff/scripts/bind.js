// Binding sweep for a use_figma call. Finds raw colours, spacing, radius, stroke widths and text
// that match a design system token exactly, and binds them. Dry run by default: it reports what it
// would bind, what is ambiguous and what is close but not equal. Set APPLY = true to write.
//
// Run it after each builder unit and before the audit. Bind only exact matches. A near miss is a
// drift finding for the join table, never a silent rounding.

const SCOPE_IDS = []; // Sections or screens to sweep. Empty means the current page.
const APPLY = false;

// Which variables to consider for each kind of value, matched against "<collection>/<variable name>".
// Keep these narrow: importing a whole library can exceed a call's time limit.
const SOURCES = {
  spacing: /(^|\/)(spacing|space|gap|padding)(\/|-|$)/i,
  radius: /(radius|rounded)/i,
  stroke: /(border-width|stroke-width|border\/width)/i,
  color: /(^|\/)(base|semantic|theme|mode|colou?rs?)\//i,
};
// Variables matched here are never candidates. Raw palettes such as tailwind colors are primitives:
// a semantic token should win, and if none matches the value is drift, not a binding.
const EXCLUDE = /(tailwind colors|primitive|palette|alpha-(light|dark))/i;

// Ties between tokens with the same value. Copy these from the join table in design-system.md.
// Key: "<kind>:<value>", value: the token name the code uses. Example: 'fill:#D1D4D9': 'base/muted'.
const HINTS = {};

// Library text styles can't be listed from a plugin, so give their keys here (from
// search_design_system or design-system.md). Styles already used on the page are added automatically.
const TEXT_STYLE_KEYS = [];

const SKIP_ZERO = true; // A zero gap or padding is not worth a binding.

// --- helpers ---------------------------------------------------------------

function isDoc(node) {
  for (let n = node; n && n.type !== 'PAGE'; n = n.parent) {
    if (n.name && n.name.startsWith('Doc/')) return true;
    if (n.name && n.name.startsWith('Flow: ')) return true;
    if (n.getSharedPluginData('handoff', 'kind') === 'doc') return true;
    if (n.name === 'Brief' && n.parent && n.parent.type === 'PAGE') return true; // Briefs from before the kind marker.
  }
  return false;
}

function insideInstance(node) {
  for (let p = node.parent; p && p.type !== 'PAGE'; p = p.parent) if (p.type === 'INSTANCE') return true;
  return false;
}

const hex = ({ r, g, b }) => '#' + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const same = (a, b) => Math.abs(a - b) < 0.01;

function scopeOk(variable, scope) {
  const s = variable.scopes || [];
  if (s.length === 0 || s.includes('ALL_SCOPES') || s.includes(scope)) return true;
  if (s.includes('ALL_FILLS') && /_FILL$/.test(scope)) return true;
  return false;
}

// --- candidate pool --------------------------------------------------------

const roots = SCOPE_IDS.length
  ? (await Promise.all(SCOPE_IDS.map((id) => figma.getNodeByIdAsync(id)))).filter(Boolean)
  : [figma.currentPage];
let page = roots[0];
while (page && page.type !== 'PAGE') page = page.parent;
if (page && page !== figma.currentPage) await figma.setCurrentPageAsync(page);
const probe = roots[0].type === 'PAGE' ? roots[0].children.find((n) => 'boundVariables' in n) || roots[0] : roots[0];

const pool = { spacing: [], radius: [], stroke: [], color: [] };
const seen = new Set();

async function addVariable(variable, collectionName) {
  if (!variable || seen.has(variable.id)) return;
  seen.add(variable.id);
  const path = `${collectionName}/${variable.name}`;
  if (EXCLUDE.test(path)) return;
  let value;
  try { value = variable.resolveForConsumer(probe).value; } catch (e) { return; }
  const firstMode = Object.values(variable.valuesByMode)[0];
  const semantic = !!(firstMode && firstMode.type === 'VARIABLE_ALIAS');
  const entry = { variable, name: variable.name, path, value, semantic };
  if (variable.resolvedType === 'COLOR' && SOURCES.color.test(path)) pool.color.push(entry);
  if (variable.resolvedType === 'FLOAT') {
    for (const kind of ['spacing', 'radius', 'stroke']) if (SOURCES[kind].test(path)) pool[kind].push(entry);
  }
}

const collectionNames = new Map();
async function collectionName(variable) {
  if (!collectionNames.has(variable.variableCollectionId)) {
    const c = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    collectionNames.set(variable.variableCollectionId, c ? c.name : '');
  }
  return collectionNames.get(variable.variableCollectionId);
}

for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
  for (const id of c.variableIds) await addVariable(await figma.variables.getVariableByIdAsync(id), c.name);
}
let libraryNote = null;
try {
  for (const c of await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()) {
    const wanted = (await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key)).filter((v) => {
      const path = `${c.name}/${v.name}`;
      if (EXCLUDE.test(path)) return false;
      if (v.resolvedType === 'COLOR') return SOURCES.color.test(path);
      if (v.resolvedType === 'FLOAT') return SOURCES.spacing.test(path) || SOURCES.radius.test(path) || SOURCES.stroke.test(path);
      return false;
    });
    // Import in parallel: one at a time takes about a minute for a few hundred variables.
    const imported = await Promise.all(wanted.map((v) => figma.variables.importVariableByKeyAsync(v.key).catch(() => null)));
    for (const v of imported.filter(Boolean)) await addVariable(v, await collectionName(v));
  }
} catch (e) {
  libraryNote = `Library variables unavailable: ${e.message}`;
}

// Text styles: local, given by key, and any already used on the page (library components carry them).
const textStyles = new Map();
for (const s of await figma.getLocalTextStylesAsync()) textStyles.set(s.id, s);
for (const key of TEXT_STYLE_KEYS) {
  try { const s = await figma.importStyleByKeyAsync(key); textStyles.set(s.id, s); } catch (e) { /* unpublished */ }
}
const allNodes = [];
// How often each variable collection is already bound on the page, instances included.
const usage = new Map();
const usageIds = new Set();
for (const n of page.findAll((x) => 'boundVariables' in x && x.boundVariables)) {
  for (const v of Object.values(n.boundVariables)) for (const a of [].concat(v)) if (a && a.id) usageIds.add(a.id);
  if ('fills' in n && Array.isArray(n.fills)) for (const f of n.fills) if (f.boundVariables && f.boundVariables.color) usageIds.add(f.boundVariables.color.id);
}
for (const id of usageIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) usage.set(v.variableCollectionId, (usage.get(v.variableCollectionId) || 0) + 1);
}
for (const r of roots) allNodes.push(...(r.type === 'PAGE' ? r.findAll() : [r, ...('findAll' in r ? r.findAll() : [])]));
for (const n of page.findAllWithCriteria({ types: ['TEXT'] })) {
  if (typeof n.textStyleId === 'string' && n.textStyleId && !textStyles.has(n.textStyleId)) {
    const s = await figma.getStyleByIdAsync(n.textStyleId);
    if (s) textStyles.set(s.id, s);
  }
}

// --- matching --------------------------------------------------------------

const report = { bound: [], ambiguous: [], near: [], unmatched: [], textBound: [], textNear: [] };

function choose(kind, key, candidates) {
  if (candidates.length === 0) return { pick: null };
  const hinted = HINTS[key] && candidates.find((c) => c.name === HINTS[key] || c.path.endsWith(HINTS[key]));
  if (hinted) return { pick: hinted };
  const semantic = candidates.filter((c) => c.semantic);
  let pickFrom = semantic.length ? semantic : candidates;
  // Then prefer the collection the page already binds most, as library components show the convention.
  const top = Math.max(...pickFrom.map((c) => usage.get(c.variable.variableCollectionId) || 0));
  if (top > 0) pickFrom = pickFrom.filter((c) => (usage.get(c.variable.variableCollectionId) || 0) === top);
  if (pickFrom.length === 1) return { pick: pickFrom[0] };
  return { pick: null, tie: pickFrom.map((c) => c.name) };
}

function nearest(list, value) {
  let best = null;
  for (const c of list) if (typeof c.value === 'number' && (!best || Math.abs(c.value - value) < Math.abs(best.value - value))) best = c;
  return best && Math.abs(best.value - value) <= Math.max(4, value * 0.25) ? best : null;
}

function floatFields(n) {
  const out = [];
  if ('layoutMode' in n && n.layoutMode !== 'NONE' && n.layoutMode !== 'GRID') {
    if (n.primaryAxisAlignItems !== 'SPACE_BETWEEN') out.push(['itemSpacing', 'spacing', 'GAP']);
    if (n.layoutWrap === 'WRAP' && n.counterAxisSpacing != null) out.push(['counterAxisSpacing', 'spacing', 'GAP']);
    for (const f of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom']) out.push([f, 'spacing', 'GAP']);
  }
  if ('cornerRadius' in n && n.type !== 'TEXT' && n.type !== 'COMPONENT_SET') {
    if (n.cornerRadius === figma.mixed) for (const f of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) out.push([f, 'radius', 'CORNER_RADIUS']);
    else out.push(['cornerRadius', 'radius', 'CORNER_RADIUS']);
  }
  if ('strokeWeight' in n && n.strokes && n.strokes.length && n.strokeWeight !== figma.mixed) out.push(['strokeWeight', 'stroke', 'STROKE_FLOAT']);
  return out;
}

const bv = (n, f) => n.boundVariables && n.boundVariables[f];

async function sweepFloats(n) {
  for (const [field, kind, scope] of floatFields(n)) {
    const value = n[field];
    if (typeof value !== 'number' || bv(n, field)) continue;
    if (field === 'cornerRadius' && (bv(n, 'topLeftRadius') || value === 0)) continue;
    if (field === 'strokeWeight' && (bv(n, 'strokeTopWeight') || bv(n, 'strokeLeftWeight'))) continue;
    if (SKIP_ZERO && value === 0) continue;
    const list = pool[kind].filter((c) => scopeOk(c.variable, scope));
    const key = `${kind}:${value}`;
    const { pick, tie } = choose(kind, key, list.filter((c) => same(c.value, value)));
    if (pick) {
      if (APPLY) n.setBoundVariable(field, pick.variable);
      report.bound.push(`${n.id} ${field} ${value} → ${pick.name}`);
    } else if (tie) report.ambiguous.push(`${n.id} ${field} ${value} → one of ${tie.join(', ')}. Add a HINTS entry for '${key}'`);
    else {
      const near = nearest(list, value);
      (near ? report.near : report.unmatched).push(`${n.id} ${field} ${value}${near ? ` (closest ${near.name} = ${near.value})` : ''}`);
    }
  }
}

function colorScope(n, prop) {
  if (prop === 'strokes') return 'STROKE_COLOR';
  if (n.type === 'TEXT') return 'TEXT_FILL';
  return ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'SECTION'].includes(n.type) ? 'FRAME_FILL' : 'SHAPE_FILL';
}

async function sweepPaints(n, prop) {
  if (!(prop in n) || !Array.isArray(n[prop]) || n[prop].length === 0) return;
  if (prop === 'fills' && n.fillStyleId) return;
  if (prop === 'strokes' && n.strokeStyleId) return;
  const scope = colorScope(n, prop);
  let changed = false;
  const paints = n[prop].map((paint) => {
    if (paint.type !== 'SOLID' || paint.visible === false || (paint.boundVariables && paint.boundVariables.color)) return paint;
    const alpha = paint.opacity == null ? 1 : paint.opacity;
    const value = `${hex(paint.color)}${alpha < 1 ? `@${Math.round(alpha * 100)}` : ''}`;
    const key = `${prop === 'strokes' ? 'stroke' : scope === 'TEXT_FILL' ? 'text' : 'fill'}:${value}`;
    const list = pool.color.filter((c) => scopeOk(c.variable, scope));
    const matches = list.filter((c) => hex(c.value) === hex(paint.color) && same(c.value.a == null ? 1 : c.value.a, alpha));
    const { pick, tie } = choose('color', key, matches);
    if (pick) {
      report.bound.push(`${n.id} ${prop} ${value} → ${pick.name}`);
      if (APPLY) { changed = true; return figma.variables.setBoundVariableForPaint(paint, 'color', pick.variable); }
    } else if (tie) report.ambiguous.push(`${n.id} ${prop} ${value} → one of ${tie.join(', ')}. Add a HINTS entry for '${key}'`);
    else report.unmatched.push(`${n.id} ${prop} ${value}`);
    return paint;
  });
  if (changed) n[prop] = paints;
}

function textKey(t) {
  const lh = t.lineHeight.unit === 'AUTO' ? 'auto' : `${t.lineHeight.value}${t.lineHeight.unit === 'PERCENT' ? '%' : ''}`;
  const ls = t.letterSpacing.value ? `${Math.round(t.letterSpacing.value * 100) / 100}${t.letterSpacing.unit === 'PERCENT' ? '%' : ''}` : '0';
  return `${t.fontName.family} ${t.fontName.style} ${t.fontSize}/${lh} ls${ls}`;
}

const styleByKey = new Map();
for (const s of textStyles.values()) {
  const k = textKey(s);
  if (!styleByKey.has(k)) styleByKey.set(k, []);
  styleByKey.get(k).push(s);
}

async function sweepText(n) {
  if (n.type !== 'TEXT' || n.textStyleId) return; // A mixed or set style is left alone.
  if (n.fontName === figma.mixed || n.fontSize === figma.mixed || n.lineHeight === figma.mixed || n.letterSpacing === figma.mixed) {
    report.unmatched.push(`${n.id} text has mixed styling`);
    return;
  }
  const k = textKey(n);
  const matches = styleByKey.get(k) || [];
  if (matches.length >= 1) {
    const hinted = HINTS[`text:${k}`] && matches.find((s) => s.name === HINTS[`text:${k}`]);
    const pick = hinted || (matches.length === 1 ? matches[0] : null);
    if (pick) {
      if (APPLY) { await figma.loadFontAsync(n.fontName); await n.setTextStyleIdAsync(pick.id); }
      report.textBound.push(`${n.id} ${k} → ${pick.name}`);
    } else report.ambiguous.push(`${n.id} ${k} → one of ${matches.map((s) => s.name).join(', ')}`);
    return;
  }
  const close = [...textStyles.values()].filter((s) => s.fontName.family === n.fontName.family && Math.abs(s.fontSize - n.fontSize) <= 2)
    .sort((a, b) => Math.abs(a.fontSize - n.fontSize) - Math.abs(b.fontSize - n.fontSize))[0];
  report.textNear.push(`${n.id} ${k}${close ? ` (closest ${close.name}: ${textKey(close)})` : ''}`);
}

// Screens are often instances of local components, so their raw values live in the masters.
// Sweep each local master the scope uses, wherever it sits.
const inScope = new Set(allNodes.map((n) => n.id));
const masters = new Set();
for (const n of allNodes) {
  if (n.type !== 'INSTANCE') continue;
  const main = await n.getMainComponentAsync();
  if (!main || main.remote || inScope.has(main.id)) continue;
  const owner = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main;
  if (!masters.has(owner.id)) {
    masters.add(owner.id);
    for (const m of [owner, ...owner.findAll()]) if (!inScope.has(m.id)) { inScope.add(m.id); allNodes.push(m); }
  }
}

for (const n of allNodes) {
  if (n.type === 'PAGE' || n.type === 'SECTION' || isDoc(n) || insideInstance(n)) continue;
  if (n.type === 'INSTANCE') { await sweepPaints(n, 'fills'); continue; } // Only the instance's own top-level overrides.
  await sweepFloats(n);
  await sweepPaints(n, 'fills');
  await sweepPaints(n, 'strokes');
  await sweepText(n);
}

const cap = (list) => ({ count: list.length, items: list.slice(0, 40) });
return {
  applied: APPLY,
  pool: { spacing: pool.spacing.length, radius: pool.radius.length, stroke: pool.stroke.length, color: pool.color.length, textStyles: textStyles.size },
  libraryNote,
  bound: cap(report.bound),
  textBound: cap(report.textBound),
  ambiguous: cap(report.ambiguous),
  near: cap(report.near),
  textNear: cap(report.textNear),
  unmatched: cap(report.unmatched),
};
