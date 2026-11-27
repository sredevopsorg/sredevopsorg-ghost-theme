import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The entrypoint wiring, pinned.
 *
 * Both bugs this file exists for were only visible by starting the real image: `--serve`
 * called `serve()` with no config, so `config.port` was undefined and the receiver died
 * on boot (the Deployment would have crash-looped), and the process exited through a
 * path that swallowed the error until it reached the logs.
 */
const source = readFileSync(new URL("../src/index.mjs", import.meta.url), "utf8");

test("--serve builds its config from the environment and validates it", () => {
  // A receiver with no config accepts deliveries and then cannot queue anything, which
  // is worse than refusing to start.
  assert.match(source, /const \{ serve \} = await import\("\.\/receiver\.mjs"\)/);
  assert.match(source, /serve\(\{ config: receiverConfig\(\), log \}\)/);
  assert.match(source, /import \{[^}]*receiverConfig[^}]*\} from "\.\/config\.mjs"/);
});

test("every entrypoint reads the config it needs", () => {
  assert.match(source, /if \(arg === "--serve"\)/);
  assert.match(source, /if \(arg === "--backfill"\)/);
  assert.match(source, /jobConfig\(\)/);
});
