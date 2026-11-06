// Documentation kit for use_figma scripts.
// Nothing persists between use_figma calls, so paste the parts you need at the top of each script.
// Colours use Figma's 0-1 range. Text and shapes use a Doc/ prefix. Frames that show a label on the
// canvas use plain names, and text is never wrapped in a frame directly under a section.

const INK = { r: 0.09, g: 0.09, b: 0.09 };
const MUTED = { r: 0.4, g: 0.4, b: 0.4 };
const LINE = { r: 0.9, g: 0.9, b: 0.9 };
const SURFACE = { r: 1, g: 1, b: 1 };
const ACCENT = { r: 0, g: 0.44, b: 0.97 };
const SPACE = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, section: 48, major: 64 };
const SANS_ORDER = ['Inter', 'Geist'];
const MONO_ORDER = ['JetBrains Mono', 'Geist Mono'];
const SANS_HINT = /grotesk|grotesque|helvetica|arial|sans/i;
const MONO_HINT = /mono|code|consolas|courier/i;

const solid = (color) => [{ type: 'SOLID', color }];

// Returns the family and its available styles for a role.
// project: the project's font family, if it has one.
async function resolveFont(role, project) {
  const fonts = await figma.listAvailableFontsAsync();
  const families = new Map();
  for (const { fontName } of fonts) {
    if (!families.has(fontName.family)) families.set(fontName.family, new Set());
    families.get(fontName.family).add(fontName.style);
  }
  const order = role === 'mono' ? MONO_ORDER : SANS_ORDER;
  const hint = role === 'mono' ? MONO_HINT : SANS_HINT;
  const choices = [project, ...order].filter(Boolean);
  const family = choices.find((name) => families.has(name))
    || [...families.keys()].find((name) => hint.test(name));
  if (!family) throw new Error(`No ${role} font is available in this file`);
  return { family, styles: families.get(family) };
}

function pickStyle(font, wanted) {
  const options = wanted === 'Semi Bold'
    ? ['Semi Bold', 'SemiBold', 'Semibold', 'Medium', 'Bold', 'Regular']
    : ['Regular', 'Book', 'Roman', 'Medium'];
  const style = options.find((name) => font.styles.has(name)) || [...font.styles][0];
  return { family: font.family, style };
}

// Creates a text node. width sets wrapping; omit it for a single line.
async function docText(characters, font, opts = {}) {
  const { name = 'Doc/Text', size = 14, lineHeight = 20, weight = 'Regular', color = INK, width, tracking = 0 } = opts;
  const fontName = pickStyle(font, weight);
  await figma.loadFontAsync(fontName);
  const node = figma.createText();
  node.name = name;
  node.fontName = fontName;
  node.fontSize = size;
  node.lineHeight = { unit: 'PIXELS', value: lineHeight };
  if (tracking) node.letterSpacing = { unit: 'PERCENT', value: tracking };
  node.fills = solid(color);
  node.characters = characters;
  if (width) {
    node.resize(width, node.height);
    node.textAutoResize = 'HEIGHT';
  }
  return node;
}

function stack(name, direction, gap) {
  const frame = figma.createAutoLayout(direction);
  frame.name = name;
  frame.fills = [];
  frame.itemSpacing = gap;
  return frame;
}

function place(parent, node, x, y) {
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

// Plain text under a screen. The screen frame's name is the caption's title.
async function caption(parent, body, screen, font) {
  const node = await docText(body, font, { name: 'Doc/Caption', color: MUTED, width: screen.width });
  return place(parent, node, screen.x, screen.y + screen.height + SPACE.base);
}

async function marginNote(parent, text, x, y, width, font) {
  const node = await docText(text, font, { name: 'Doc/Note', color: MUTED, width });
  return place(parent, node, x, y);
}

function flowLine(parent, x, y, length) {
  const line = figma.createLine();
  line.name = 'Doc/Flow';
  line.resize(length, 0);
  line.strokes = solid(MUTED);
  line.strokeWeight = 1;
  return place(parent, line, x, y);
}

// Place a pointer inside the screen frame so it gets no label on the canvas.
// component: the project's cursor component, if it has one.
function cursor(screen, x, y, component) {
  let node;
  if (component) {
    node = component.createInstance();
  } else {
    node = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 3l6.5 17 2.6-7.1L21 10.2z" fill="#171717" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>');
  }
  node.name = 'Doc/Cursor';
  screen.appendChild(node);
  if (screen.layoutMode && screen.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE';
  node.x = x;
  node.y = y;
  return node;
}

async function focusMarker(parent, order, x, y, font) {
  const frame = figma.createAutoLayout('HORIZONTAL');
  frame.name = `Doc/Focus ${order}`;
  frame.resize(24, 24);
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.cornerRadius = 12;
  frame.fills = solid(ACCENT);
  frame.appendChild(await docText(String(order), font, { name: 'Doc/Focus number', size: 12, lineHeight: 16, color: SURFACE }));
  parent.appendChild(frame);
  if (parent.layoutMode && parent.layoutMode !== 'NONE') frame.layoutPositioning = 'ABSOLUTE';
  frame.x = x;
  frame.y = y;
  return frame;
}

async function briefSection(heading, rows, width, sans, renderRow) {
  const group = stack(`Doc/Brief: ${heading}`, 'VERTICAL', SPACE.md);
  group.appendChild(await docText(heading, sans, { name: 'Doc/Heading', size: 20, lineHeight: 28, weight: 'Semi Bold', tracking: -1 }));
  for (const row of rows) group.appendChild(await renderRow(row, width));
  return group;
}

// Builds the one-page brief on the current page.
// b = { x, y, title, lede, role, reality, does: [], decide: [[question, default]], source, changes: [] }
async function briefPage(b, sans) {
  const width = 960;
  const page = stack('Brief', 'VERTICAL', SPACE.section);
  page.setSharedPluginData('handoff', 'owner', 'skill');
  page.fills = solid(SURFACE);
  page.paddingTop = page.paddingBottom = page.paddingLeft = page.paddingRight = SPACE.major;
  page.strokes = solid(LINE);
  page.strokeWeight = 1;
  page.cornerRadius = 8;

  const head = stack('Doc/Brief: Head', 'VERTICAL', SPACE.base);
  head.appendChild(await docText(b.title, sans, { name: 'Doc/Heading', size: 48, lineHeight: 56, weight: 'Semi Bold', tracking: -3, width }));
  head.appendChild(await docText(b.lede, sans, { name: 'Doc/Lede', size: 20, lineHeight: 28, color: MUTED, width }));
  page.appendChild(head);

  const status = stack('Doc/Brief: Status', 'VERTICAL', SPACE.sm);
  status.appendChild(await docText(b.role, sans, { name: 'Doc/Role', width }));
  status.appendChild(await docText(b.reality, sans, { name: 'Doc/Reality', weight: 'Semi Bold', width }));
  page.appendChild(status);

  if (b.does?.length) {
    page.appendChild(await briefSection('What it does', b.does.slice(0, 6), width, sans, async (text, w) => {
      const row = stack('Doc/Bullet', 'HORIZONTAL', SPACE.sm);
      row.appendChild(await docText('•', sans, { name: 'Doc/Bullet mark', color: MUTED }));
      row.appendChild(await docText(text, sans, { name: 'Doc/Bullet text', width: w - SPACE.base }));
      return row;
    }));
  }

  if (b.decide?.length) {
    page.appendChild(await briefSection('To decide', b.decide.slice(0, 7), width, sans, async ([question, fallback], w) => {
      const row = stack('Doc/Decision', 'HORIZONTAL', SPACE.lg);
      row.appendChild(await docText(question, sans, { name: 'Doc/Question', weight: 'Semi Bold', width: (w - SPACE.lg) / 2 }));
      row.appendChild(await docText(fallback, sans, { name: 'Doc/Default', color: MUTED, width: (w - SPACE.lg) / 2 }));
      return row;
    }));
  }

  page.appendChild(await docText(b.source, sans, { name: 'Doc/Source', size: 13, lineHeight: 16, color: MUTED, width }));

  if (b.changes?.length) {
    page.appendChild(await briefSection('Change log', b.changes, width, sans, (text, w) =>
      docText(text, sans, { name: 'Doc/Change', color: MUTED, width: w })));
  }

  figma.currentPage.appendChild(page);
  page.x = b.x;
  page.y = b.y;
  return page;
}

// Name, owner, status and date only.
async function coverFrame(c, sans) {
  const frame = stack('Cover', 'VERTICAL', SPACE.base);
  frame.setSharedPluginData('handoff', 'owner', 'skill');
  frame.fills = solid(SURFACE);
  frame.paddingTop = frame.paddingBottom = frame.paddingLeft = frame.paddingRight = SPACE.major;
  frame.strokes = solid(LINE);
  frame.strokeWeight = 1;
  frame.cornerRadius = 8;
  frame.appendChild(await docText(c.name, sans, { name: 'Doc/Heading', size: 48, lineHeight: 56, weight: 'Semi Bold', tracking: -3 }));
  frame.appendChild(await docText(`Owner: ${c.owner} · Status: ${c.status} · ${c.date}`, sans, { name: 'Doc/Cover meta', color: MUTED }));
  figma.currentPage.appendChild(frame);
  frame.x = c.x;
  frame.y = c.y;
  return frame;
}

// One scenario section. The name is the row title, so no heading goes inside it.
function scenarioRow(title, status, x, y, width, height) {
  const section = figma.createSection();
  section.name = `${title} · ${status}`;
  section.x = x;
  section.y = y;
  section.resizeWithoutConstraints(width, height);
  section.fills = solid(SURFACE);
  section.setSharedPluginData('handoff', 'owner', 'skill');
  return section;
}

// Sets a section to fit its children and returns it.
function fitSection(section, padding = SPACE.section) {
  const kids = section.children;
  if (!kids.length) return section;
  const right = Math.max(...kids.map((n) => n.x + n.width));
  const bottom = Math.max(...kids.map((n) => n.y + n.height));
  section.resizeWithoutConstraints(right + padding, bottom + padding);
  return section;
}

// Stacks sections down one left edge, after their sizes settle.
function restack(sections, x, y, gap = SPACE.major * 2) {
  let top = y;
  for (const section of sections) {
    section.x = x;
    section.y = top;
    top += section.height + gap;
  }
  return top;
}

if (typeof module !== 'undefined') {
  module.exports = { resolveFont, pickStyle, fitSection, restack, SANS_ORDER, MONO_ORDER };
}
