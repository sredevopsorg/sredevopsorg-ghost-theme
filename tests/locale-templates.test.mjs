import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Locale template wrappers.
 *
 * A layout cannot see the post context, so the document language is chosen by which
 * shell a template extends, and the content locale is passed explicitly. These tests
 * pin the pairs that are easy to get wrong when adding a locale: the inheritance line,
 * the document language (BCP-47), and the content-locale key (en/es/br).
 */
const customEs = readFileSync("custom-es.hbs", "utf8");
const customBr = readFileSync("custom-br.hbs", "utf8");
const defaultBr = readFileSync("default-br.hbs", "utf8");
const homeBr = readFileSync("home-br.hbs", "utf8");

test("Spanish posts extend the Spanish shell and pass the es locale", () => {
  assert.match(customEs, /^\{\{!< default-es\}\}/m);
  assert.match(customEs, /\{\{#post\}\}\{\{> "post-layout" locale="es"\}\}\{\{\/post\}\}/);
});

test("Portuguese posts extend the Portuguese shell and pass the br locale", () => {
  assert.match(customBr, /^\{\{!< default-br\}\}/m);
  assert.match(customBr, /\{\{#post\}\}\{\{> "post-layout" locale="br"\}\}\{\{\/post\}\}/);
});

test("the Portuguese shell separates the document language from the content key", () => {
  assert.match(defaultBr, /documentLang="pt"/);
  assert.match(defaultBr, /locale="br"/);
});

test("the Portuguese collection uses the Portuguese shell and collection layout", () => {
  assert.match(homeBr, /^\{\{!< default-br\}\}/m);
  assert.match(homeBr, /collection-layout.*locale="br"/);
});
