import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Text extraction is the one place the pipeline and the browser path must agree, so the
 * cases here are the article shapes that actually broke the old DOM reader:
 * list items fusing into one word, tables and code read aloud, a caption repeated from
 * the excerpt, and entities reaching the model as `&amp;`.
 *
 * The browser side is pinned by tests/tts.test.mjs in the theme; the shared rules are
 * the sentence regex and the block boundary.
 */
const { articleSentences, chunkSentences, decodeEntities, dedupeCaption, htmlToText, normalise, sentences, terminate } =
  await import("../src/text.mjs");

test("list items stay separate words", () => {
  const text = htmlToText("<ul><li>uno</li><li>dos</li></ul>");
  assert.equal(text, "uno dos");
});

test("block elements become boundaries, inline elements do not", () => {
  assert.equal(htmlToText("<p>hola <em>mundo</em></p>"), "hola mundo");
  // Inline tags between words must not add or remove a space beyond the source's own.
  assert.equal(htmlToText("<p>Kubernetes<strong>.</strong></p>"), "Kubernetes.");
  assert.equal(htmlToText("<p>a<br>b</p>"), "a b");
});

test("code, tables, scripts and navigation are dropped with their content", () => {
  const html = `
    <p>Antes.</p>
    <pre><code>kubectl get pods</code></pre>
    <table><tr><td>celda</td></tr></table>
    <script>alert("no")</script>
    <nav>Menú</nav>
    <p>Después.</p>`;
  const text = htmlToText(html);
  assert.equal(text, "Antes. Después.");
  assert.ok(!text.includes("kubectl"));
  assert.ok(!text.includes("celda"));
});

test("entities are decoded, including accented numeric references", () => {
  assert.equal(decodeEntities("A &amp; B&nbsp;&lt;x&gt;"), "A & B <x>");
  assert.equal(decodeEntities("caf&#233; &#x2014; lista"), "café — lista");
  // An unknown entity is left alone rather than swallowed.
  assert.equal(decodeEntities("&bogus;"), "&bogus;");
  // Out-of-range code points cannot throw.
  assert.equal(decodeEntities("&#xD800;"), "");
});

test("typographic quotes and soft hyphens are normalised for the model", () => {
  assert.equal(normalise("“hola” ‘mundo’"), '"hola" \'mundo\'');
  assert.equal(normalise("kuber\u00adnetes"), "kubernetes");
  assert.equal(normalise("  many   \n spaces  "), "many spaces");
});

test("the audio marker and HTML comments never reach the spoken text", () => {
  const html =
    `<p>Texto real.</p><!-- ghost comment -->` +
    `<meta name="sredevops:tts" content='{"v":1,"hash":"abcd","file":"https://audio.sredevops.org/a.mp3"}'>`;
  assert.equal(htmlToText(html), "Texto real.");
});

test("sentences are split on the same boundaries as the theme", () => {
  assert.deepEqual(sentences("Una. Dos! ¿Tres?"), ["Una.", "Dos!", "¿Tres?"]);
  // A decimal point does not split, because it is not followed by whitespace.
  assert.deepEqual(sentences("La versión 6.70 sale."), ["La versión 6.70 sale."]);
});

test("every spoken fragment is terminated, so chunks cannot fuse", () => {
  assert.equal(terminate("sin punto"), "sin punto.");
  assert.equal(terminate("con punto."), "con punto.");
  assert.equal(terminate("  "), "");
});

test("articleSentences drops runs that have no letters", () => {
  const list = articleSentences("<p>Hola.</p><p>— — —</p><p>42</p>");
  assert.deepEqual(list, ["Hola."]);
});

test("chunkSentences packs whole sentences under the character budget", () => {
  const list = ["a".repeat(200) + ".", "b".repeat(200) + ".", "c.".repeat(10)];
  const chunks = chunkSentences(list, 350);
  assert.ok(chunks.every((chunk) => chunk.length <= 350 + 2), "every chunk respects the budget");
  // No sentence is split across chunks: joining them back reproduces the input order.
  assert.equal(chunks.join(" ").replace(/\s+/g, " ").trim(), list.join(" ").trim());
});

test("a caption that repeats the opening of the article is not said twice", () => {
  const body = "Kubernetes es el orquestador de referencia para este tipo de cargas. Sigue aquí.";
  assert.equal(dedupeCaption("Kubernetes es el orquestador de referencia", body), "");
  assert.equal(dedupeCaption("Una foto distinta del evento de la semana pasada", body), "Una foto distinta del evento de la semana pasada");
  assert.equal(dedupeCaption("", body), "");
});

test("a heading is its own sentence, even without a full stop", () => {
  // Without this boundary, `<h2>Qué es X</h2><p>Lorem…</p>` is spoken as one sentence and
  // the model stresses the wrong word. Measured against a real Spanish article.
  assert.deepEqual(articleSentences("<h1>Uno</h1><p>Dos.</p>"), ["Uno.", "Dos."]);
  assert.deepEqual(articleSentences("<h3>Tres</h3><p>Cuatro.</p>"), ["Tres.", "Cuatro."]);
  // A heading that already ends in punctuation must not gain a second full stop.
  assert.deepEqual(articleSentences("<h2>¿Qué es?</h2><p>Sigue.</p>"), ["¿Qué es?", "Sigue."]);
});
