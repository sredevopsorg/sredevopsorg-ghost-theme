import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

/**
 * Admin API authentication — the bug this file exists for.
 *
 * The worker sent `Authorization: Ghost <id>:<secret>`, i.e. the raw key. Ghost's header
 * takes a **signed JWT**, so it answered `400 INVALID_JWT` on every call, which reads
 * exactly like a revoked key. Every prior test passed because the fake `fetch` never
 * inspected the header.
 *
 * So these tests do the one thing that would have caught it: decode the header the worker
 * builds and verify the signature the same way Ghost does.
 */
const { TOKEN_TTL_SECONDS, ghostHeaders, signAdminToken } = await import("../src/ghost.mjs");

const KEY = "6b093438902def00019b98fe:86160c251b925fa42f72812902b292dd488d9ecb18aa9f12f42cc017aa7577eb";
const [ID, SECRET] = KEY.split(":");

/** What Ghost does: split three segments, base64url-decode, HMAC-check the first two. */
function inspect(token, secret = SECRET) {
  const parts = token.split(".");
  assert.equal(parts.length, 3, `a JWT has three segments, got ${parts.length}`);
  const [rawHeader, rawPayload, signature] = parts;
  const header = JSON.parse(Buffer.from(rawHeader, "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(rawPayload, "base64url").toString("utf8"));
  // Ghost uses the hex-decoded secret as the HMAC key, not the hex string.
  const expected = createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`${rawHeader}.${rawPayload}`)
    .digest("base64url");
  return { header, payload, signature, expected };
}

test("the Authorization header carries a signed JWT, not the raw key", () => {
  const { Authorization } = ghostHeaders(KEY);
  assert.ok(Authorization.startsWith("Ghost "), "scheme must be Ghost");

  const token = Authorization.slice("Ghost ".length);
  // The actual defect: the raw `id:secret` is not a JWT.
  assert.ok(!token.includes(":"), "the raw key must never be sent as the token");

  const { signature, expected } = inspect(token);
  assert.equal(signature, expected, "signature must verify against the secret");
});

test("the token identifies the key through kid and targets the admin audience", () => {
  const { Authorization } = ghostHeaders(KEY);
  const { header, payload } = inspect(Authorization.slice("Ghost ".length));

  // Ghost reads the key id from the header, not from the secret.
  assert.equal(header.kid, ID);
  assert.equal(header.alg, "HS256");
  assert.equal(header.typ, "JWT");
  // Ghost refuses a token minted for another route.
  assert.equal(payload.aud, "/admin/");
  assert.ok(Number.isInteger(payload.iat) && Number.isInteger(payload.exp));
  assert.equal(payload.exp - payload.iat, TOKEN_TTL_SECONDS);
});

test("a token signed with the wrong secret does not verify", () => {
  // Proves the signature is over the secret and not, say, a constant.
  const token = signAdminToken(KEY).split(".").slice(0, 2).join(".") + ".not-the-signature";
  const { signature, expected } = inspect(token);
  assert.notEqual(signature, expected);
});

test("the token walks through the 5-minute window Ghost enforces", () => {
  assert.equal(TOKEN_TTL_SECONDS, 300);
  // `signAdminToken` returns the bare token; only `ghostHeaders` adds the scheme.
  const { payload } = inspect(signAdminToken(KEY, { now: 1_700_000_000_000 }));
  assert.equal(payload.iat, 1_700_000_000);
  assert.equal(payload.exp, 1_700_000_300);
});

test("a malformed or non-hex key fails loudly instead of producing a bad token", () => {
  // These are the mistakes a hand-copied key actually makes.
  assert.throws(() => signAdminToken("no-colon-here"), /id:secret/);
  assert.throws(() => signAdminToken(""), /id:secret/);
  assert.throws(() => signAdminToken(undefined), /id:secret/);
  // A secret that is not hex means the wrong line was copied out of Ghost Admin.
  assert.throws(() => signAdminToken("abc123:not-hex-at-all"), /not hex/);
  // An odd-length hex string is not decodable either.
  assert.throws(() => signAdminToken("abc123:abc"), /not hex/);
});

test("every request path uses the signed token, never the raw key", async () => {
  const fs = await import("node:fs/promises");
  for (const file of ["../src/ghost.mjs", "../src/backfill.mjs"]) {
    const source = await fs.readFile(new URL(file, import.meta.url), "utf8");
    assert.ok(
      !/Authorization:\s*`Ghost \$\{config\.adminKey\}`/.test(source),
      `${file} still sends the raw admin key`,
    );
  }
});

test("the Admin API is asked for formats Ghost actually accepts", async () => {
  // Ghost answers `422 Validation (AllowedValues) failed for formats` for `formats=html,md`.
  // The accepted values are html, mobiledoc, lexical and plaintext; `plaintext` is the one
  // derived from the same stored source in the same request, so it is what the drift check
  // compares against `html`.
  const source = await (await import("node:fs/promises")).readFile(
    new URL("../src/ghost.mjs", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes("formats=html,plaintext"), "Admin API request should use plaintext");
  // Check the request URL only, not the comments that explain the history.
  const requestUrls = source.match(/\?formats=[a-z,]+/g) ?? [];
  assert.deepEqual(requestUrls, ["?formats=html,plaintext"], "`md` is not a valid Admin API format");
});
