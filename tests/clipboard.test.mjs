import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for the clipboard helper (assets/js/lib/clipboard.js).
 *
 * The interesting behaviour is the fallback: the async Clipboard API needs a
 * secure context and can reject, and the copy button must still do something
 * useful on plain http. Both navigator and document are injectable, so this runs
 * without a browser and without mocking globals.
 */
const { copyText } = await import("../assets/js/lib/clipboard.js");

function fakeDocument({ execCommandResult = true } = {}) {
  const calls = { appended: 0, removed: 0, selected: 0, execCommand: 0 };
  const textarea = {
    value: "",
    style: {},
    setAttribute() {},
    select() {
      calls.selected++;
    },
  };
  return {
    calls,
    textarea,
    createElement: () => textarea,
    body: {
      appendChild() {
        calls.appended++;
      },
      removeChild() {
        calls.removed++;
      },
    },
    execCommand: (command) => {
      calls.execCommand++;
      assert.equal(command, "copy");
      return execCommandResult;
    },
  };
}

test("uses the async Clipboard API when it is available", async () => {
  let written = "";
  const document = fakeDocument();
  const ok = await copyText("https://example.com/post/", {
    navigator: { clipboard: { writeText: async (text) => void (written = text) } },
    document,
  });

  assert.equal(ok, true);
  assert.equal(written, "https://example.com/post/");
  assert.equal(document.calls.execCommand, 0, "the legacy path must not run");
});

test("falls back to execCommand when the Clipboard API rejects", async () => {
  const document = fakeDocument();
  const ok = await copyText("https://example.com/post/", {
    navigator: {
      clipboard: {
        writeText: async () => {
          throw new Error("NotAllowedError");
        },
      },
    },
    document,
  });

  assert.equal(ok, true);
  assert.equal(document.calls.execCommand, 1);
  assert.equal(document.calls.appended, 1);
  assert.equal(document.calls.removed, 1, "the temporary textarea must be cleaned up");
});

test("falls back when the Clipboard API is missing entirely (insecure context)", async () => {
  const document = fakeDocument();
  const ok = await copyText("text", { navigator: {}, document });

  assert.equal(ok, true);
  assert.equal(document.calls.execCommand, 1);
});

test("reports failure when both paths are unavailable", async () => {
  const ok = await copyText("text", { navigator: {}, document: {} });
  assert.equal(ok, false);
});

test("reports failure when execCommand says no", async () => {
  const ok = await copyText("text", { navigator: {}, document: fakeDocument({ execCommandResult: false }) });
  assert.equal(ok, false);
});

test("refuses empty input instead of clearing the clipboard", async () => {
  let called = false;
  const ok = await copyText("", {
    navigator: { clipboard: { writeText: async () => void (called = true) } },
    document: fakeDocument(),
  });

  assert.equal(ok, false);
  assert.equal(called, false);
});
