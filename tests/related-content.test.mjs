import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Tests for the "Related content" block in partials/post-layout.hbs.
 *
 * The block's three locale branches build an NQL filter with the `concat` helper. The bug
 * this file guards against is subtle and was live in production: the primary tag slug was
 * written *inside* the string argument —
 *
 *     (concat "id:-" id "+tags:[{{primary_tag.slug}}]")
 *
 * `concat` joins its arguments as strings and Handlebars does not re-render a literal, so
 * NQL received the token `{{primary_tag.slug}}`, which matches nothing. The Spanish branch
 * still looked populated because `tags:[es, …]` is an OR and matched every `es` post; the
 * English branch has no locale tag in the bracket, so it rendered an empty section.
 *
 * The slug must therefore be its own argument. A live Ghost run is the end-to-end proof
 * (see the PR notes); these assertions are the fast, offline half.
 */
const source = readFileSync("partials/post-layout.hbs", "utf8");

// Comments are documentation, not markup: a comment may name the old bug without failing
// the test. (Ghost scans comments for some of its own rules, so keep them honest anyway.)
const code = source.replace(/\{\{!--[\s\S]*?--\}\}/g, "");

const filters = [...code.matchAll(/\(concat[^)]*\)/g)].map((m) => m[0]);

test("the related-content block builds exactly three filters (es, br, default)", () => {
  assert.equal(filters.length, 3, `expected three concat filters, found ${filters.length}`);
});

test("no Handlebars expression is left inside a concat string literal", () => {
  // The regression: a `{{…}}` inside the quotes is passed through verbatim, never rendered.
  assert.doesNotMatch(code, /\{\{primary_tag\.slug\}\}/, "the slug is inside a string literal again");
  for (const expr of filters) {
    assert.doesNotMatch(expr, /"[^"]*\{\{/, `expression is not interpolated: ${expr}`);
    assert.doesNotMatch(expr, /\}\}/, `expression still contains a raw handlebars block: ${expr}`);
  }
});

test("each filter interpolates the primary tag slug as its own argument", () => {
  for (const expr of filters) {
    assert.match(expr, /"id:-"\s+id/, `filter must exclude the current post: ${expr}`);
    assert.match(expr, /primary_tag\.slug/, `filter must use the primary tag: ${expr}`);
    assert.match(expr, /"\s+primary_tag\.slug\s+"/, `slug must be an unquoted argument: ${expr}`);
  }
});

test("the three branches scope the filter to es, br, and the default locale", () => {
  assert.match(code, /concat\s+"id:-"\s+id\s+"\+tags:\["\s+primary_tag\.slug\s+"\]"/, "default branch");
  assert.match(code, /concat\s+"id:-"\s+id\s+"\+tags:\[es,"\s+primary_tag\.slug\s+"\]"/, "Spanish branch");
  assert.match(code, /concat\s+"id:-"\s+id\s+"\+tags:\[br,"\s+primary_tag\.slug\s+"\]"/, "Portuguese branch");
});
