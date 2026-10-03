/**
 * Table-of-contents model — pure logic, no DOM and no framework.
 *
 * Kept out of the component so it can be unit-tested in plain Node
 * (tests/table-of-contents.test.mjs) and reused by any view layer.
 */

const DEFAULT_OFFSET = 96; // sticky header (60px) + breathing room

/** Headings without an id get a deterministic one so links work and are shareable. */
export function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics: "Métricas" -> "Metricas"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Keeps a generated id unique against the ids already on the page. */
export function uniqueId(desired, taken, fallbackIndex = 1) {
  const base = desired || `section-${fallbackIndex}`;
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * Nest a flat heading list into at most one level of children, so h3s hang off the
 * preceding h2. A heading that jumps a level (h3 with no parent) stays top-level.
 */
export function buildTree(headings) {
  const tree = [];
  const stack = [];

  for (const heading of headings) {
    const node = { ...heading, children: [] };
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();

    if (stack.length) stack[stack.length - 1].children.push(node);
    else tree.push(node);

    stack.push(node);
  }
  return tree;
}

/**
 * The id of the section currently being read: the last heading whose top has
 * passed the offset. Before the first heading, the first section is current.
 */
export function activeIdFor(positions, offset = DEFAULT_OFFSET) {
  if (!positions.length) return "";
  let current = positions[0].id;
  for (const { id, top } of positions) {
    if (top <= offset) current = id;
    else break;
  }
  return current;
}

/** Flatten the tree back to document order. */
export function flatten(tree) {
  return tree.flatMap((node) => [node, ...node.children]);
}

export { DEFAULT_OFFSET };
