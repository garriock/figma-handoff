// Documentation kit for use_figma scripts.
// Nothing persists between use_figma calls, so paste the parts you need at the top of each script.
// Colours use Figma's 0-1 range. The canvas is dark and the brief and components are white cards. Text and shapes use a Doc/ prefix. Frames that show a label on the
// canvas use plain names, and text is never wrapped in a frame directly under a section.

const INK = { r: 0.09, g: 0.09, b: 0.09 };
const MUTED = { r: 0.4, g: 0.4, b: 0.4 };
const SURFACE = { r: 1, g: 1, b: 1 };
const ACCENT = { r: 0, g: 0.44, b: 0.97 };
const PAGE_BG = { r: 0.118, g: 0.118, b: 0.118 }; // #1E1E1E
const ROW_BG = { r: 0.267, g: 0.267, b: 0.267 }; // #444444
const ON_DARK = { r: 1, g: 1, b: 1 };
const SPACE = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, section: 48, major: 64 };
const CANVAS = { pad: 160, gap: 400, gapMobile: 240, rowGap: 450, briefGap: 500, componentsGap: 640, card: 96, radius: 24 };
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

function setDark(page) {
  page.backgrounds = solid(PAGE_BG);
}

// Plain text under a screen. The screen frame's name is the caption's title.
async function caption(parent, body, screen, font) {
  const node = await docText(body, font, { name: 'Doc/Caption', color: ON_DARK, width: screen.width });
  return place(parent, node, screen.x, screen.y + screen.height + SPACE.lg);
}

async function marginNote(parent, text, x, y, width, font) {
  const node = await docText(text, font, { name: 'Doc/Note', color: ON_DARK, width });
  node.fills = [{ type: 'SOLID', color: ON_DARK, opacity: 0.64 }];
  return place(parent, node, x, y);
}

// Figma's tools can't create connectors in a design file, so copy one that exists.
// Returns null when the file has none: ask the user to place one FigJam arrow.
// Pages load one at a time, so this looks on the current page only.
function findSeedConnector() {
  return figma.currentPage.findOne((n) => n.type === 'CONNECTOR');
}

// A labelled arrow from the right edge of one screen to the left edge of the next.
// Keep the seed: deleting the last connector leaves nothing to copy.
async function flowArrow(seed, section, from, to, label) {
  const arrow = seed.clone();
  section.appendChild(arrow);
  arrow.name = `Flow: ${label}`;
  arrow.connectorLineType = 'STRAIGHT';
  arrow.connectorStart = { endpointNodeId: from.id, magnet: 'RIGHT' };
  arrow.connectorEnd = { endpointNodeId: to.id, magnet: 'LEFT' };
  await figma.loadFontAsync(arrow.text.fontName);
  arrow.text.characters = label;
  arrow.text.fills = [{ type: 'SOLID', color: ON_DARK, opacity: 0.9 }];
  return arrow;
}

// Without a connector to copy, a plain line in the gap is the fallback.
function flowLine(parent, x, y, length) {
  const line = figma.createLine();
  line.name = 'Doc/Flow';
  line.resize(length, 0);
  line.strokes = [{ type: 'SOLID', color: ON_DARK, opacity: 0.5 }];
  line.strokeWeight = 2;
  return place(parent, line, x, y);
}

// Annotations read back with both label and labelMarkdown, and writing both fails.
function cleanAnnotation(a) {
  const out = {};
  if (a.labelMarkdown) out.labelMarkdown = a.labelMarkdown;
  else if (a.label) out.label = a.label;
  if (a.properties && a.properties.length) out.properties = a.properties;
  if (a.categoryId) out.categoryId = a.categoryId;
  return out;
}

// description reads back HTML-escaped, so unescape before writing it again.
function unescapeHtml(text) {
  let prev;
  do {
    prev = text;
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  } while (text !== prev);
  return text;
}

// Writes the Specs list into a component or component set's description, keeping any text above it.
function setSpecs(component, lines) {
  const head = unescapeHtml(component.description || '').split(/\n*Specs\n/)[0].trim();
  const specs = lines.length ? `Specs\n${lines.map((line) => `- ${line}`).join('\n')}` : '';
  component.description = [head, specs].filter(Boolean).join('\n\n');
  return component;
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
  group.appendChild(await docText(heading, sans, { name: 'Doc/Heading', size: 24, lineHeight: 32, weight: 'Semi Bold', tracking: -1 }));
  for (const row of rows) group.appendChild(await renderRow(row, width));
  return group;
}

// Builds the brief as a white card. Place it CANVAS.briefGap to the left of the rows, top-aligned.
// b = { x, y, title, lede, role, reality, does: [], decide: [[question, default]], source, changes: [] }
async function briefPage(b, sans) {
  const width = 1440 - CANVAS.card * 2;
  const page = stack('Brief', 'VERTICAL', SPACE.section);
  page.setSharedPluginData('handoff', 'owner', 'skill');
  page.fills = solid(SURFACE);
  page.paddingTop = page.paddingBottom = page.paddingLeft = page.paddingRight = CANVAS.card;
  page.cornerRadius = CANVAS.radius;

  const head = stack('Doc/Brief: Head', 'VERTICAL', SPACE.base);
  head.appendChild(await docText(b.title, sans, { name: 'Doc/Heading', size: 64, lineHeight: 72, weight: 'Semi Bold', tracking: -3, width }));
  head.appendChild(await docText(b.lede, sans, { name: 'Doc/Lede', size: 24, lineHeight: 32, color: MUTED, width }));
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

// One scenario section. The name is the row title, so no heading goes inside it.
function scenarioRow(title, status, x, y, width, height) {
  const section = figma.createSection();
  section.name = `${title} · ${status}`;
  section.x = x;
  section.y = y;
  section.resizeWithoutConstraints(width, height);
  section.fills = solid(ROW_BG);
  section.setSharedPluginData('handoff', 'owner', 'skill');
  return section;
}

// A white section on the right of the rows for key components and screen parts.
function componentsSection(name, x, y) {
  const section = figma.createSection();
  section.name = name;
  section.x = x;
  section.y = y;
  section.fills = solid(SURFACE);
  section.setSharedPluginData('handoff', 'owner', 'skill');
  section.setSharedPluginData('handoff', 'kind', 'components');
  return section;
}

// Lays out a row: screens top-aligned left to right, then each screen's caption and notes under it.
// Text is matched to the screen it sat under before the move.
function layoutRow(section) {
  const screens = section.children
    .filter((n) => ['FRAME', 'INSTANCE', 'COMPONENT'].includes(n.type))
    .sort((a, b) => a.x - b.x);
  const texts = section.children.filter((n) => n.type === 'TEXT');
  const owner = new Map(texts.map((t) => [t, screens.filter((s) => s.x <= t.x + 1).pop() || screens[0]]));
  let x = CANVAS.pad;
  for (const screen of screens) {
    screen.x = x;
    screen.y = CANVAS.pad;
    x += screen.width + (screen.width < 500 ? CANVAS.gapMobile : CANVAS.gap);
  }
  for (const screen of screens) {
    let y = screen.y + screen.height + SPACE.lg;
    const mine = texts.filter((t) => owner.get(t) === screen)
      .sort((a, b) => (a.name === 'Doc/Caption' ? 0 : 1) - (b.name === 'Doc/Caption' ? 0 : 1));
    for (const t of mine) {
      t.x = screen.x;
      t.y = y;
      y += t.height + SPACE.sm;
    }
  }
  return fitSection(section);
}

// Sets a section to fit its children and returns it.
function fitSection(section, padding = CANVAS.pad) {
  const kids = section.children.filter((n) => n.type !== 'CONNECTOR');
  if (!kids.length) return section;
  const right = Math.max(...kids.map((n) => n.x + n.width));
  const bottom = Math.max(...kids.map((n) => n.y + n.height));
  section.resizeWithoutConstraints(right + padding, bottom + padding);
  return section;
}

// Stacks sections down one left edge, after their sizes settle.
// Give every row the widest row's width first, so the left edge reads as a contents list.
function matchWidths(sections) {
  const width = Math.max(...sections.map((s) => s.width));
  for (const section of sections) section.resizeWithoutConstraints(width, section.height);
  return width;
}

function restack(sections, x, y, gap = CANVAS.rowGap) {
  let top = y;
  for (const section of sections) {
    section.x = x;
    section.y = top;
    top += section.height + gap;
  }
  return top;
}

if (typeof module !== 'undefined') {
  module.exports = { resolveFont, pickStyle, fitSection, restack, unescapeHtml, setSpecs, cleanAnnotation, CANVAS, SANS_ORDER, MONO_ORDER };
}
