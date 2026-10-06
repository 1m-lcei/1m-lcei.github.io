import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { works } from "../src/data/works.ts";

assert(process.versions.bun, "Run with Bun: bun run social-image");
const root = fileURLToPath(new URL("../", import.meta.url));
const dataUrl = async (relative, type) =>
  `data:${type};base64,${(await readFile(path.join(root, relative))).toString("base64")}`;
const shots = [];
for (const [id, className] of [
  ["image-rect-picker", "picker"],
  ["kuto-ladder", "ladder"],
  ["kuto-measure", "measure"],
]) {
  const { preview } = works.find((work) => work.id === id);
  const { crop } = preview;
  assert(crop.x + crop.width <= preview.width);
  assert(crop.y + crop.height <= preview.height);
  const style = [
    `--ratio:${crop.width}/${crop.height}`,
    `--width:${(preview.width / crop.width) * 100}%`,
    `--left:${(-crop.x / crop.width) * 100}%`,
    `--top:${(-crop.y / crop.height) * 100}%`,
  ].join(";");
  const source = await dataUrl(`public/${preview.png}`, "image/png");
  shots.push(
    `<figure class="shot ${className}" data-source="${preview.png}"><span class="pin"></span><div class="screen" style="${style}"><img src="${source}" alt=""></div></figure>`,
  );
}
let html = await readFile(
  path.join(root, "assets/social-preview/board.html"),
  "utf8",
);
html = html
  .replace(
    "{{CORK}}",
    await dataUrl("src/assets/textures/cork.webp", "image/webp"),
  )
  .replace(
    "{{PAPER}}",
    await dataUrl("src/assets/textures/paper.webp", "image/webp"),
  )
  .replace("{{SHOTS}}", shots.join(""));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.route("**/*", (route) => route.abort());
  await page.setContent(html, { waitUntil: "load" });
  await page
    .locator("img")
    .evaluateAll((nodes) => Promise.all(nodes.map((node) => node.decode())));
  assert.equal(await page.locator("body").innerText(), "");
  assert.equal(await page.locator(".shot").count(), 3);
  const directory = path.join(root, "public/og");
  await mkdir(directory, { recursive: true });
  const output = path.join(directory, "works-board.png");
  await page.screenshot({ path: output, animations: "disabled" });
  console.log(
    `Rendered 1200×630 share image from three unchanged screenshots: ${output}`,
  );
} finally {
  await browser.close();
}
