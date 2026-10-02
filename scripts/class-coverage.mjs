#!/usr/bin/env node
/**
 * class-coverage — prove that every class a template asks for actually has CSS.
 *
 * Why this exists
 * ---------------
 * Tailwind only emits CSS for class names it recognises. When a utility is
 * renamed or removed (v3 `flex-grow` -> v4 `grow`, `shadow-sm` -> `shadow-xs`,
 * `outline-none` -> `outline-hidden`) the build still succeeds, the class is
 * still in the markup, and the rule is simply ... absent. The page silently
 * loses styling. There is no compiler error to catch it.
 *
 * So: extract every class token from the theme's templates (and the handful of
 * classes its JavaScript adds at runtime), and require each one to be present
 * in the built CSS corpus. Anything unresolved is either a real regression or a
 * class that legitimately has no rule — and the second group is enumerated
 * below, with a reason, on purpose.
 *
 * Usage
 * -----
 *   node scripts/class-coverage.mjs [--root DIR] [--css DIR_OR_FILE] [--json]
 *
 *   --root  repository root to scan            (default: process.cwd())
 *   --css   built CSS directory or single file (default: <root>/assets/built)
 *   --json  print a machine-readable summary instead of the human report
 *
 * `--css` may be repeated to join several corpora: after the v4 migration the
 * page loads CSS from more than one directory (the Vite bundle plus the vendor
 * stylesheets still linked from partials/head.hbs). A single `--css` behaves
 * exactly as documented above and remains the common case.
 *
 * Exit codes
 * ----------
 *   0  every non-allowlisted class resolves
 *   1  at least one class does not
 *   2  bad usage, or the scan/corpus inputs are missing (nothing to check)
 *
 * Zero dependencies, ESM, Node >= 20.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Allowlist — classes that legitimately have no CSS rule of their own.
//
// Keep this list honest. Every entry is a claim that "no rule here is correct",
// and a wrong claim turns the guard silent. Only add an entry you can attribute
// to a non-Tailwind source, and say which one in the comment.
// ---------------------------------------------------------------------------

/** Exact class names that must never be reported as missing. */
export const ALLOWLIST_EXACT = [
  // JS-only hooks — the theme's scripts query them, they carry no styling.
  "js-toc",
  "js-toc-content",
  "js-reframe",

  // Tech debt, NOT correct: dead classes with no rule in the v3 build either.
  // They are kept here only so the migration is not blocked by them; delete
  // them from the templates and then delete these two lines.
  "sticky-top", // dead — partials/sidebar.hbs
  "feature-image-wrapper", // dead — partials/feature-image.hbs

  // Unstyled semantic wrapper on author.hbs. Also matched by /^author-/ below
  // (that pattern exists for Ghost's runtime `author-<slug>` body class), so
  // it is listed explicitly to keep the intent greppable.
  "author-box",
];

/** Patterns for whole families that legitimately have no CSS rule. */
export const ALLOWLIST_PATTERNS = [
  /^js-/, // JS-only hooks: scripts select them, nothing styles them.
  /^kg-/, // Ghost-injected: Koenig editor output (kg-card, kg-image, ...) is rendered at request time.
  /^gh-/, // Ghost-injected: core markup such as gh-content / gh-comments.
  /^is-/, // Ghost-injected: state classes added to <html>/<body> at render time.
  /^post-template$/, // Ghost-injected: context class on <body>.
  /^page-template$/, // Ghost-injected: context class on <body>.
  /^home-template$/, // Ghost-injected: context class on <body>.
  /^tag-/, // Ghost-injected: tag context class, e.g. tag-news.
  /^author-/, // Ghost-injected: author context class, e.g. author-jane.
  /^nav-/, // Dynamic Handlebars output: link_class builds `nav-<slug>` from a runtime slug.
  /^page-/, // Dynamic Handlebars output: pagination/label classes built from runtime values.
  // External stylesheet: Font Awesome 6 is loaded from cdnjs in
  // partials/head.hbs, so its icon classes are absent from the Tailwind build
  // by design. No Tailwind utility starts with `fa-`, so this cannot mask one.
  /^fa-/,
  /^(?:fas|far|fab|fal|fat|fad)$/, // External stylesheet: legacy Font Awesome style shorthands.
  // Vendor: generated at runtime by the bundled Prism.js (assets/js/prism.js).
  // The Prism plugins own their own styling, and `toolbar{display:none}` in
  // prism-window.css intentionally leaves the toolbar markup unstyled.
  /^(?:code-toolbar|toolbar-item|line-numbers-sizer|copy-to-clipboard-button)$/,
];

/**
 * Characters Tailwind escapes with a preceding backslash when it writes a class
 * name into a selector. Tailwind escapes every character outside
 * `[A-Za-z0-9_-]`; this is the set that is actually reachable from a class
 * token in this theme (`: . [ ] / #` today, plus the rest of the common
 * arbitrary-value and variant punctuation for safety).
 *
 * Empirically, `aspect-[16/9]` -> `.aspect-\[16\/9\]`,
 * `bg-[#0d0e11]/80` -> `.bg-\[\#0d0e11\]\/80`,
 * `group-hover:scale-105` -> `.group-hover\:scale-105`,
 * `md:grid-cols-2` -> `.md\:grid-cols-2`.
 */
const SELECTOR_ESCAPE_CHARS = "[ ] / : # . % ( ) , ! & > + ~ * ' \" = @";

/**
 * The matcher actually used, derived from the set above so the documented set
 * and the working one cannot drift apart. (A literal space is a member: it can
 * never arrive from a template, because tokens are split on whitespace, but
 * escaping it keeps `escapeSelector` correct for any caller.)
 */
const SELECTOR_ESCAPE_RE = new RegExp(
  `[${SELECTOR_ESCAPE_CHARS.replace(/[\\^\]-]/g, "\\$&")}]`,
  "g",
);

/** Placeholder that marks "a Handlebars expression stood here". */
const EXPR_SENTINEL = "\u0000";

/** Pruned from every walk: never template sources. */
const PRUNE_DIRS = new Set(["node_modules", ".git"]);

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * `class` as a standalone HTML attribute name, capturing its opening quote.
 * The lookbehind/lookahead keep `className`, `classList` and `data-class` out.
 */
const CLASS_ATTR_RE = /(?<![A-Za-z0-9_-])class(?![A-Za-z0-9_-])\s*=\s*(["'])/g;

/**
 * Classes added by JavaScript, so a class used only from JS is not mistaken for
 * dead code. Deliberately a small heuristic, not a parser:
 *   - `classList.add("x")` / `classList.toggle("x")` only when the argument is
 *     entirely a literal, so `classList.add("language-" + lang)` is not read as
 *     a class named `language-`;
 *   - `x.className = "a b"` assignments (the whole value is the class list).
 * `remove`/`contains` are ignored: they take classes away rather than add them.
 */
const JS_CLASS_PATTERNS = [
  /(?<![A-Za-z0-9_$])classList\s*\.\s*(?:add|toggle)\s*\(\s*(["'])([^"']*)\1\s*[,)]/g,
  /(?<![A-Za-z0-9_$])className\s*=\s*(["'])([^"']*)\1/g,
];

/** Line number lookups for a source string (1-based, precomputed). */
function lineIndexer(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

/**
 * Blank out Handlebars comments while preserving offsets, so a `class=` inside
 * commented-out markup is not treated as a live requirement.
 */
function stripHandlebarsComments(src) {
  return src
    .replace(/\{\{!--[\s\S]*?--\}\}/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\{\{![\s\S]*?\}\}/g, (m) => m.replace(/[^\n]/g, " "));
}

/**
 * Yield `{ token, line }` for every class token in a template.
 *
 * Only `class="..."` / `class='...'` attribute values are read; arbitrary text
 * is never scanned. The value is walked with Handlebars-aware brace tracking so
 * that a quote inside a subexpression (navigation.hbs builds `nav-<slug>` via
 * `class=(concat "nav-" slug)`) does not terminate the attribute early. Each
 * `{{ ... }}` region collapses to one sentinel, so no fragment of an expression
 * can be mistaken for a class name.
 */
function* templateClassTokens(src) {
  const lineAt = lineIndexer(src);
  for (const match of src.matchAll(CLASS_ATTR_RE)) {
    const quote = match[1];
    let i = match.index + match[0].length;
    let value = "";
    let closed = false;
    while (i < src.length) {
      if (src.startsWith("{{", i)) {
        i += 2;
        let depth = 1;
        while (i < src.length && depth > 0) {
          if (src.startsWith("{{", i)) {
            depth++;
            i += 2;
          } else if (src.startsWith("}}", i)) {
            depth--;
            i += 2;
          } else {
            i++;
          }
        }
        value += EXPR_SENTINEL;
        continue;
      }
      if (src[i] === quote) {
        closed = true;
        break;
      }
      value += src[i];
      i++;
    }
    if (!closed) continue;
    const line = lineAt(match.index);
    for (const token of value.split(/\s+/)) {
      if (!token) continue; // empty token
      if (token.includes(EXPR_SENTINEL)) continue; // touched a Handlebars expression
      if (token.includes("{{") || token.includes("}}")) continue; // belt and braces
      yield { token, line };
    }
  }
}

/** Yield `{ token, line }` for classes the JavaScript adds at runtime. */
function* scriptClassTokens(src) {
  const lineAt = lineIndexer(src);
  for (const pattern of JS_CLASS_PATTERNS) {
    for (const match of src.matchAll(new RegExp(pattern.source, "g"))) {
      const line = lineAt(match.index);
      for (const token of match[2].split(/\s+/)) {
        if (token) yield { token, line };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/** Escape one class token the way Tailwind escapes it in a selector. */
export function escapeSelector(token) {
  return token.replace(SELECTOR_ESCAPE_RE, (char) => "\\" + char);
}

/** Return the matching allowlist entry rendered as text, or `null`. */
export function allowlistRuleFor(token) {
  if (ALLOWLIST_EXACT.includes(token)) return `exact:${token}`;
  for (const pattern of ALLOWLIST_PATTERNS) {
    if (pattern.test(token)) return String(pattern);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Filesystem
// ---------------------------------------------------------------------------

/** Every file under `dir` (recursively) for which `accept` holds. */
function walkFiles(dir, accept) {
  const found = [];
  const visit = (current) => {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return; // unreadable or missing: nothing to scan here
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (PRUNE_DIRS.has(entry.name)) continue;
        visit(join(current, entry.name));
      } else if (accept(join(current, entry.name))) {
        found.push(join(current, entry.name));
      }
    }
  };
  visit(dir);
  found.sort();
  return found;
}

/**
 * Resolve the `--css` inputs into the lookup corpus: one concatenated CSS text
 * plus the files it came from. Each input is either a directory, which
 * contributes the `*.css` files directly inside it, or a `.css` file.
 *
 * Directory scans are deliberately NOT recursive: widening the corpus widens
 * what counts as "resolved", and a corpus that quietly swallowed unrelated CSS
 * would hide the very regressions this script exists to catch. Pointing `--css`
 * at the wrong directory therefore fails loudly (exit 2), and joining genuinely
 * separate corpora is explicit (`--css a --css b`) rather than accidental.
 *
 * Returns `null` if any input is missing or contributes no CSS.
 */
function loadCorpus(cssPaths) {
  const files = [];
  for (const cssPath of cssPaths) {
    let stats;
    try {
      stats = statSync(cssPath);
    } catch {
      return null;
    }
    if (stats.isDirectory()) {
      let entries;
      try {
        entries = readdirSync(cssPath, { withFileTypes: true });
      } catch {
        return null;
      }
      const found = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
        .map((entry) => join(cssPath, entry.name))
        .sort();
      if (found.length === 0) return null;
      files.push(...found);
    } else if (cssPath.endsWith(".css")) {
      files.push(cssPath);
    } else {
      return null;
    }
  }
  if (files.length === 0) return null;
  // Read each file once, even when the same corpus is named twice.
  const unique = [...new Set(files)].sort();
  const text = unique.map((file) => readFileSync(file, "utf8")).join("\n");
  return { paths: [...cssPaths], files: unique, text };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

class UsageError extends Error {}

const USAGE = `usage: node scripts/class-coverage.mjs [--root DIR] [--css DIR_OR_FILE] [--json]

  --root DIR            repository root to scan             (default: cwd)
  --css  DIR_OR_FILE    built CSS dir or single .css file   (default: <root>/assets/built)
                        repeatable, to join several corpora
  --json                print a machine-readable summary instead of the human report

exit codes: 0 all classes resolve, 1 missing classes, 2 bad usage or missing corpus`;

function parseArgs(argv) {
  const options = { root: process.cwd(), css: [], json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") options.json = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--root") {
      if (argv[i + 1] === undefined) throw new UsageError("--root needs a directory");
      options.root = argv[++i];
    } else if (arg.startsWith("--root=")) options.root = arg.slice("--root=".length);
    else if (arg === "--css") {
      if (argv[i + 1] === undefined) throw new UsageError("--css needs a directory or a .css file");
      options.css.push(argv[++i]);
    } else if (arg.startsWith("--css=")) options.css.push(arg.slice("--css=".length));
    else throw new UsageError(`unknown argument: ${arg}`);
  }
  return options;
}

/** Run the check. Returns the process exit code. */
export function run(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(USAGE + "\n");
    return 0;
  }

  const root = resolve(options.root);
  try {
    if (!statSync(root).isDirectory()) throw new Error();
  } catch {
    process.stderr.write(`class-coverage: --root is not a readable directory: ${root}\n`);
    return 2;
  }

  const cssPaths = (options.css.length > 0 ? options.css : [join(root, "assets", "built")]).map(
    (entry) => resolve(entry),
  );
  const corpus = loadCorpus(cssPaths);
  if (corpus === null) {
    process.stderr.write(
      `class-coverage: no CSS corpus at ${cssPaths.join(", ")}\n` +
        "  expected a .css file, or a directory holding at least one .css file directly\n" +
        "  (subdirectories are not searched, so pass the exact output directory)\n",
    );
    return 2;
  }

  const templates = walkFiles(root, (file) => file.endsWith(".hbs"));
  if (templates.length === 0) {
    process.stderr.write(`class-coverage: no *.hbs templates under ${root}; nothing to check\n`);
    return 2;
  }
  const scripts = walkFiles(join(root, "assets", "js"), (file) => file.endsWith(".js"));

  /** token -> { token, locations: Set<"file:line"> } */
  const usage = new Map();
  const record = (token, location) => {
    let entry = usage.get(token);
    if (!entry) usage.set(token, (entry = { token, locations: new Set() }));
    entry.locations.add(location);
  };
  for (const file of templates) {
    const shown = relative(root, file);
    for (const { token, line } of templateClassTokens(stripHandlebarsComments(readFileSync(file, "utf8")))) {
      record(token, `${shown}:${line}`);
    }
  }
  for (const file of scripts) {
    const shown = relative(root, file);
    for (const { token, line } of scriptClassTokens(readFileSync(file, "utf8"))) {
      record(token, `${shown}:${line}`);
    }
  }

  const missing = [];
  const allowlisted = [];
  let resolved = 0;
  for (const entry of usage.values()) {
    const rule = allowlistRuleFor(entry.token);
    // Resolved wins over allowlisted: an allowlist entry that also has a real
    // rule is stale, and we would rather see it counted than hidden.
    if (corpus.text.includes("." + escapeSelector(entry.token))) resolved++;
    else if (rule !== null) allowlisted.push({ ...entry, rule });
    else missing.push(entry);
  }

  // Most-used first; ties broken by name so the report is stable.
  const byUse = (a, b) => b.locations.size - a.locations.size || a.token.localeCompare(b.token);
  missing.sort(byUse);
  allowlisted.sort(byUse);

  const summary = {
    root,
    corpus: { paths: corpus.paths, files: corpus.files, bytes: corpus.text.length },
    scanned: { templates: templates.length, scripts: scripts.length },
    total: usage.size,
    resolved,
    allowlisted: allowlisted.length,
    missing: missing.length,
    passed: missing.length === 0,
    missingClasses: missing.map((entry) => ({
      token: entry.token,
      count: entry.locations.size,
      locations: [...entry.locations].sort(),
    })),
    allowlistedClasses: allowlisted.map((entry) => ({
      token: entry.token,
      count: entry.locations.size,
      rule: entry.rule,
    })),
  };

  if (options.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
    return summary.passed ? 0 : 1;
  }

  const out = [];
  out.push(
    `class-coverage: ${summary.total} classes scanned (${resolved} resolved, ${allowlisted.length} allowlisted, ${missing.length} missing)`,
  );
  for (const entry of missing) {
    out.push(`  MISSING: ${entry.token}   <- ${[...entry.locations].sort().join(", ")}`);
  }
  if (summary.passed) {
    out.push(`class-coverage: PASSED - every one of ${summary.total} classes resolves in the built CSS.`);
  } else {
    out.push(
      `class-coverage: FAILED - ${missing.length} of ${summary.total} classes have no rule in the CSS corpus.`,
    );
    out.push("  A missing class means Tailwind emitted no CSS for it: it was renamed, removed or");
    out.push("  mistyped. Fix the class, or - only if it genuinely needs no CSS - add it to");
    out.push("  ALLOWLIST_EXACT / ALLOWLIST_PATTERNS in scripts/class-coverage.mjs with a reason.");
    out.push(`  Corpus searched: ${corpus.files.map((file) => relative(root, file) || file).join(", ")}`);
  }
  process.stdout.write(out.join("\n") + "\n");
  return summary.passed ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (error) {
    if (error instanceof UsageError) {
      process.stderr.write(`class-coverage: ${error.message}\n\n${USAGE}\n`);
      process.exit(2);
    }
    throw error;
  }
}
