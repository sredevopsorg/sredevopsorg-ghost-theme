/**
 * Prism setup — the syntax highlighter and the languages/plugins this theme uses.
 *
 * Imported dynamically by the CodeBlocks island (assets/js/islands/CodeBlocks.js)
 * so that Prism is only fetched where a code block exists, and only on post/page
 * contexts. Everything a bundler can drop is dropped: the previous vendored bundle
 * carried 13 languages and 6 plugins for a theme that styles four of them.
 *
 * Import order matters: Prism's component files extend the global, and they do not
 * import their own dependencies, so the base grammars come first.
 *
 * Every component and plugin specifier is explicit about its .js extension. Vite's
 * resolver accepts both forms, but Node's ESM resolver does not guess extensions.
 * tests/code-blocks.test.mjs pins the specifier form; Prism's component files still
 * expect browser globals, so this does not make the highlighter run headless.
 */
import Prism from "prismjs";

// Prerequisite grammars, in dependency order.
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-clike.js";

// Languages the content actually uses (the previous bundle's set, minus css-extras
// which nothing here needs).
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-shell-session.js";
import "prismjs/components/prism-docker.js";
import "prismjs/components/prism-log.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-sql.js";
import "prismjs/components/prism-yaml.js";
import "prismjs/components/prism-json.js";

// Plugins: line numbers, and the toolbar that carries the language label and the
// copy button. `line-highlight` and `command-line` are deliberately absent — they
// need markup Ghost's code card does not emit, and the theme never styled them.
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/toolbar/prism-toolbar.js";
import "prismjs/plugins/show-language/prism-show-language.js";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.js";

export default Prism;
