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
 */
import Prism from "prismjs";

// Prerequisite grammars, in dependency order.
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";

// Languages the content actually uses (the previous bundle's set, minus css-extras
// which nothing here needs).
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-shell-session";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-log";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-json";

// Plugins: line numbers, and the toolbar that carries the language label and the
// copy button. `line-highlight` and `command-line` are deliberately absent — they
// need markup Ghost's code card does not emit, and the theme never styled them.
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/plugins/toolbar/prism-toolbar";
import "prismjs/plugins/show-language/prism-show-language";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard";

export default Prism;
