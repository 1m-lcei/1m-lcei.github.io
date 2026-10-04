import assert from "node:assert/strict";
import { readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPreviewFixture } from "./preview-content.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
assert(process.versions.bun, "Run with Bun: bun run demo");
const fixture = await createPreviewFixture(
  root,
  path.join(root, ".cache", "demo", "site-"),
);
const directory = path.join(fixture, "dist");
const base = "/kei-pinboard/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".avif": "image/avif",
  ".js": "text/javascript",
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    assert(pathname.startsWith(base));
    let filename = path.resolve(
      directory,
      pathname.slice(base.length) || "index.html",
    );
    const relative = path.relative(directory, filename);
    assert(!relative.startsWith("..") && !path.isAbsolute(relative));
    if ((await stat(filename)).isDirectory())
      filename = path.join(filename, "index.html");
    response.writeHead(200, {
      "Content-Type":
        types[path.extname(filename)] || "application/octet-stream",
    });
    response.end(await readFile(filename));
  } catch {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(await readFile(path.join(directory, "404.html")));
  }
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(4322, "127.0.0.1", resolve);
});
const url = `http://127.0.0.1:4322${base}`;
await writeFile(
  path.join(root, ".cache", "demo", "active.json"),
  JSON.stringify({ pid: process.pid, url, fixture }, null, 2),
);
console.log(`Preview only (sample posts): ${url}`);
