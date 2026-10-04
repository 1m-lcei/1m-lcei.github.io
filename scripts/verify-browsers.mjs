import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPreviewFixture } from "./preview-content.mjs";

assert(process.versions.bun, "Run browser checks with Bun");
const root = fileURLToPath(new URL("../", import.meta.url));
const qa = path.join(root, ".cache", "qa");
const requested = process.argv.slice(2);
const channels = requested.length
  ? requested
  : process.env.TEST_BROWSER_CHANNELS?.split(",") ||
    (process.env.TEST_BROWSER_CHANNEL
      ? [process.env.TEST_BROWSER_CHANNEL]
      : [process.platform === "win32" ? "msedge" : "chromium", "firefox"]);
assert(channels.length && new Set(channels).size === channels.length);
assert(
  channels.every((channel) =>
    ["msedge", "chromium", "firefox"].includes(channel),
  ),
);
await mkdir(qa, { recursive: true });
// Build test content once, then reuse the isolated HTML for every browser.
const content = await createPreviewFixture(root, path.join(qa, "content-"));
const metadata = await createPreviewFixture(root, path.join(qa, "metadata-"), {
  preview: false,
});
const results = [];
for (const channel of channels) {
  console.log(`Checking ${channel}...`);
  const run = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "browser-check.mjs")],
    {
      cwd: root,
      env: {
        ...process.env,
        TEST_BROWSER_CHANNEL: channel,
        TEST_CONTENT_FIXTURE: content,
        TEST_METADATA_FIXTURE: metadata,
      },
      stdio: "inherit",
    },
  );
  const result =
    run.status === 0
      ? JSON.parse(
          await readFile(path.join(qa, channel, "results.json"), "utf8"),
        )
      : { channel, error: run.error?.message || `Exit ${run.status}` };
  results.push(result);
}
await writeFile(
  path.join(qa, "results.json"),
  `${JSON.stringify({ browsers: results }, null, 2)}\n`,
);
assert(
  results.every((result) => !result.error),
  "A browser verification failed; see the per-browser output",
);
console.log(`All browser checks passed: ${channels.join(", ")}`);
