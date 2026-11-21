/**
 * CodeBlocks — syntax highlighting and code affordances for post/page content.
 *
 * A behaviour island (`enhance`), declared on the content container itself:
 *
 *   <div class="gh-content" data-island="CodeBlocks"> … {{{content}}} … </div>
 *
 * Why an island: the highlighter weighs far more than the rest of the theme's JS,
 * and most pages have no code at all. The island's own chunk is tiny; Prism lives
 * in a separate chunk that is only fetched when a `<pre><code class="language-…">`
 * actually exists, and only on the contexts whose template declares the island.
 *
 * This replaces assets/vendor/prism.js — a 61 kB bundle of 13 languages and 6
 * plugins, loaded as a separate classic script on every post.
 *
 * Line numbers are deliberately not enabled: Prism's line-numbers plugin needs a
 * second gutter and a sizer next to every block, and the window chrome already
 * carries the toolbar. All code-block behaviour lives here so it disappears with
 * the island.
 */
export function enhance(element) {
  const blocks = element.querySelectorAll("pre > code[class*='language-']");
  if (!blocks.length) return; // no code on this page: never fetch Prism

  // Dynamic so Prism is not part of any chunk a page without code would download.
  import("./prism-setup.js")
    .then(({ default: Prism }) => Prism.highlightAllUnder(element))
    .catch((err) => {
      // Highlighting is an enhancement: the code is readable without it.
      console.warn("[islands] CodeBlocks: highlighter failed to load", err?.message ?? err);
    });
}
