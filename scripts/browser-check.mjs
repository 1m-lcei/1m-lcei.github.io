import assert from "node:assert/strict";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { sortWorksByPublishedAt, works } from "../src/data/works.ts";
import { brandName, siteDescription, siteName } from "../src/lib/site.ts";
import { createPreviewFixture } from "./preview-content.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
assert(process.versions.bun, "Run this verification with Bun: bun run test");
const runtime = {
  name: "Bun",
  version: process.versions.bun,
  executable: process.execPath,
};
const channel =
  process.env.TEST_BROWSER_CHANNEL ||
  (process.platform === "win32" ? "msedge" : "chromium");
const qaRoot = path.join(root, ".cache", "qa");
const qa = path.join(qaRoot, channel);
const base = "/kei-pinboard/";
const expectedWorks = [
  "kuto-measure",
  "image-rect-picker",
  "kuto-nanidasu",
  "kuto-ladder",
  "blue-archive-damage",
  "kuto-glossary",
];
const expectedPublishedAt = {
  "kuto-measure": "2026-09-26T11:06:47Z",
  "image-rect-picker": "2026-09-23T15:05:57Z",
  "kuto-nanidasu": "2025-10-10T10:39:51Z",
  "kuto-ladder": "2025-10-02T11:26:07Z",
  "blue-archive-damage": "2025-05-11T19:14:04.139+09:00",
  "kuto-glossary": "2024-11-09T09:33:49Z",
};
const expectedWorkTags = {
  "kuto-measure": ["ツール", "ブルーアーカイブ", "戦術対抗戦"],
  "image-rect-picker": ["ツール", "画像"],
  "kuto-nanidasu": ["診断", "ブルーアーカイブ", "戦術対抗戦"],
  "kuto-ladder": ["ツール", "ブルーアーカイブ", "戦術対抗戦"],
  "blue-archive-damage": ["記事", "ブルーアーカイブ", "ダメージ計算"],
  "kuto-glossary": ["記事", "ブルーアーカイブ", "戦術対抗戦"],
};
const expectedDestinations = {
  "kuto-measure": "https://1m-lcei.github.io/kuto-measure/",
  "image-rect-picker": "https://1m-lcei.github.io/image-rect-picker/",
  "kuto-ladder": "https://1m-lcei.github.io/kuto-ladder/",
  "kuto-nanidasu": "https://1m-lcei.github.io/kuto-nanidasu/",
  "blue-archive-damage": "https://zenn.dev/1m_lcei/books/b380b976c908d9",
  "kuto-glossary":
    "https://gist.github.com/1m-lcei/651ba5bca28fe41011424302b476c770",
};
const expectedTagMatches = {
  ツール: ["kuto-measure", "image-rect-picker", "kuto-ladder"],
  診断: ["kuto-nanidasu"],
  画像: ["image-rect-picker"],
  戦術対抗戦: ["kuto-measure", "kuto-nanidasu", "kuto-ladder", "kuto-glossary"],
  ブルーアーカイブ: [
    "kuto-measure",
    "kuto-nanidasu",
    "kuto-ladder",
    "blue-archive-damage",
    "kuto-glossary",
  ],
  記事: ["blue-archive-damage", "kuto-glossary"],
  ダメージ計算: ["blue-archive-damage"],
};
const checks = [];
for (const work of works) {
  assert(Object.hasOwn(work, "publishedAt"));
  assert.equal(work.publishedAt, expectedPublishedAt[work.id]);
  assert.deepEqual(work.tags, expectedWorkTags[work.id]);
  if (work.publishedAt === null) {
    assert.equal(work.publicationSource, null);
  } else {
    assert.match(
      work.publishedAt,
      /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/,
    );
    assert(new URL(work.publicationSource.url).protocol === "https:");
    assert(
      ["second", "millisecond"].includes(work.publicationSource.precision),
    );
  }
}
assert.deepEqual(
  sortWorksByPublishedAt(works).map((work) => work.id),
  expectedWorks,
);
const stableFixture = Object.freeze([
  { id: "unknown-first", publishedAt: null },
  { id: "equal-jst-first", publishedAt: "2025-05-11T09:00:00+09:00" },
  { id: "same-day-newer", publishedAt: "2025-05-11T12:00:00Z" },
  { id: "equal-utc-second", publishedAt: "2025-05-11T00:00:00Z" },
  { id: "older", publishedAt: "2024-11-09T09:33:49Z" },
  { id: "unknown-second", publishedAt: null },
]);
const stableBefore = structuredClone(stableFixture);
assert.deepEqual(
  sortWorksByPublishedAt(stableFixture).map((work) => work.id),
  [
    "same-day-newer",
    "equal-jst-first",
    "equal-utc-second",
    "older",
    "unknown-first",
    "unknown-second",
  ],
);
assert.deepEqual(
  stableFixture,
  stableBefore,
  "Sorting must not mutate the input",
);
assert.throws(
  () => sortWorksByPublishedAt([{ publishedAt: "invalid" }]),
  TypeError,
);
checks.push(
  "Publication timestamps and sources are explicit; newer instants sort first, equal instants across time zones and unknown dates keep their input order",
);
await mkdir(qa, { recursive: true });
const browserTemp = path.join(qa, "browser-temp");
await mkdir(browserTemp, { recursive: true });
process.env.TEMP = browserTemp;
process.env.TMP = browserTemp;
process.env.TMPDIR = browserTemp;
await stat(path.join(root, "dist", "index.html"));

async function serve(directory) {
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
      const relative = pathname.startsWith(base)
        ? pathname.slice(base.length)
        : "../invalid";
      let filename = path.resolve(directory, relative || "index.html");
      const safe = path.relative(directory, filename);
      if (safe.startsWith("..") || path.isAbsolute(safe))
        throw new Error("Outside site root");
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
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function testFixture(variable, prefix, options) {
  const existing = process.env[variable];
  if (!existing)
    return createPreviewFixture(root, path.join(qa, prefix), options);
  const relative = path.relative(qaRoot, path.resolve(existing));
  assert(
    !relative.startsWith("..") && !path.isAbsolute(relative),
    "Fixture must stay in the QA cache",
  );
  await stat(path.join(existing, "dist", "index.html"));
  return existing;
}
const fixture = await testFixture("TEST_CONTENT_FIXTURE", "content-");
const metadataFixture = await testFixture(
  "TEST_METADATA_FIXTURE",
  "metadata-",
  {
    preview: false,
  },
);
checks.push("Markdown articles build in an isolated copy");

const sites = await Promise.all([
  serve(path.join(root, "dist")),
  serve(path.join(fixture, "dist")),
]);
let browser;
const externalRequests = [];
const errors = [];
try {
  const browserType = channel === "firefox" ? firefox : chromium;
  browser = await browserType.launch(
    ["chromium", "firefox"].includes(channel) ? {} : { channel },
  );
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    locale: "ja-JP",
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !sites.some((site) => url.origin === site.origin)
    ) {
      externalRequests.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const main = `${sites[0].origin}${base}`;
  const contentSite = `${sites[1].origin}${base}`;

  const metadataPage = await browser.newPage();
  await metadataPage.route("**/*", (route) => route.abort());
  async function checkMetadata(file, expected) {
    await metadataPage.setContent(await readFile(file, "utf8"), {
      waitUntil: "domcontentloaded",
    });
    const state = await metadataPage.evaluate(() => {
      const metas = Array.from(document.querySelectorAll("head meta"));
      const keys = metas.map(
        (node) =>
          node.getAttribute("name") ||
          node.getAttribute("property") ||
          "charset",
      );
      return {
        lang: document.documentElement.lang,
        title: document.title,
        titles: document.querySelectorAll("head title").length,
        keys,
        meta: Object.fromEntries(
          metas.map((node, index) => [
            keys[index],
            node.getAttribute("content") || node.getAttribute("charset"),
          ]),
        ),
        canonical: Array.from(
          document.querySelectorAll('link[rel="canonical"]'),
          (node) => node.getAttribute("href"),
        ),
        images: document.querySelectorAll(
          'meta[property^="og:image"], meta[name^="twitter:image"]',
        ).length,
      };
    });
    assert.equal(state.lang, "ja");
    assert.equal(state.meta.charset.toLowerCase(), "utf-8");
    assert.equal(state.meta.viewport, "width=device-width, initial-scale=1");
    assert.equal(state.titles, 1);
    assert.equal(
      new Set(state.keys).size,
      state.keys.length,
      "Metadata keys must not be duplicated",
    );
    assert.equal(state.title, expected.title);
    assert.equal(state.meta.description, expected.description);
    assert.equal(state.meta["og:title"], expected.title);
    assert.equal(state.meta["og:description"], expected.description);
    assert.equal(state.meta["og:type"], expected.type || "website");
    assert.equal(state.meta["og:site_name"], siteName);
    assert.equal(state.meta["og:locale"], "ja_JP");
    assert.equal(state.meta["twitter:card"], "summary");
    assert.equal(state.meta["twitter:site"], brandName);
    assert.equal(state.meta["twitter:title"], expected.title);
    assert.equal(state.meta["twitter:description"], expected.description);
    assert.equal(state.images, 0, "No social image was requested");
    assert.deepEqual(state.canonical, expected.url ? [expected.url] : []);
    assert.equal(state.meta["og:url"], expected.url);
    assert.equal(state.meta.robots, expected.noindex ? "noindex" : undefined);
    assert.equal(state.meta["article:published_time"], expected.publishedTime);
  }
  const homepageMeta = {
    title: siteName,
    description: siteDescription,
    url: "https://1m-lcei.github.io/kei-pinboard/",
  };
  await checkMetadata(path.join(root, "dist", "index.html"), homepageMeta);
  await checkMetadata(path.join(root, "dist", "articles", "index.html"), {
    title: `読みもの | ${siteName}`,
    description: `${siteName} の読みもの一覧。`,
    url: "https://1m-lcei.github.io/kei-pinboard/articles/",
  });
  checks.push(
    "Built homepage and article-list metadata is unique, uses the Pages canonical and has no social image",
  );
  await checkMetadata(path.join(root, "dist", "404.html"), {
    title: `ページが見つかりません | ${siteName}`,
    description:
      "ページが移動したか、URLが違っているようです。入口のボードから、もう一度どうぞ。",
    noindex: true,
  });
  await checkMetadata(path.join(fixture, "dist", "index.html"), {
    ...homepageMeta,
    url: undefined,
    noindex: true,
  });
  checks.push("404 and preview HTML is noindex and omits canonical and og:url");
  for (const [id, date] of [
    ["qa-newer", "2026-10-03"],
    ["qa-older", "2026-10-01"],
  ]) {
    const file = path.join(
      metadataFixture,
      "dist",
      "articles",
      id,
      "index.html",
    );
    await metadataPage.setContent(await readFile(file, "utf8"), {
      waitUntil: "domcontentloaded",
    });
    const title =
      (await metadataPage.locator(".article-header h1").textContent()) +
      ` | ${siteName}`;
    const description = await metadataPage
      .locator(".article-introduction")
      .textContent();
    const articleMeta = {
      title,
      description,
      type: "article",
      publishedTime: `${date}T00:00:00.000Z`,
    };
    await checkMetadata(file, {
      ...articleMeta,
      url: `https://1m-lcei.github.io/kei-pinboard/articles/${id}/`,
    });
    await checkMetadata(
      path.join(fixture, "dist", "articles", id, "index.html"),
      {
        ...articleMeta,
        noindex: true,
      },
    );
  }
  await metadataPage.close();
  checks.push(
    "Isolated published and preview article HTML preserves escaped titles/descriptions and correct article metadata",
  );

  async function noOverflow(label) {
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    assert(
      sizes.scroll <= sizes.client + 1,
      `${label}: horizontal page overflow ${JSON.stringify(sizes)}`,
    );
  }

  async function audit(label, target = page) {
    const result = await new AxeBuilder({ page: target })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      })),
      [],
      `${label}: accessibility violations`,
    );
    checks.push(`${label}: axe passed`);
  }

  async function loadPreviewImages(target = page) {
    for (const img of await target
      .locator('img[loading="lazy"]:visible')
      .all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((node) => node.decode());
    }
    await target.evaluate(() => window.scrollTo(0, 0));
  }

  async function localLinksAndAssets() {
    await loadPreviewImages();
    const urls = await page
      .locator(
        "a[href], img[src], source[srcset], use[href], link[rel='stylesheet'], link[rel='icon']",
      )
      .evaluateAll((nodes) =>
        nodes.map(
          (node) =>
            node.getAttribute("href") ||
            node.getAttribute("src") ||
            node.getAttribute("srcset"),
        ),
      );
    for (const value of new Set(urls)) {
      const url = new URL(value, page.url());
      if (!sites.some((site) => url.origin === site.origin)) continue;
      assert(url.pathname.startsWith(base), `URL lost Pages base: ${url}`);
      if (url.hash && url.pathname === new URL(page.url()).pathname) {
        assert(
          await page.evaluate(
            (id) => document.getElementById(id) !== null,
            decodeURIComponent(url.hash.slice(1)),
          ),
          `Missing anchor: ${url.hash}`,
        );
        continue;
      }
      const response = await context.request.get(url.href);
      assert.equal(
        response.status(),
        200,
        `Missing local link or asset: ${url}`,
      );
    }
    const images = await page
      .locator("img")
      .evaluateAll((nodes) =>
        nodes.every((node) => node.complete && node.naturalWidth > 0),
      );
    assert(images, "An image did not render");
    assert.equal(await page.locator("main h1").count(), 1);
    assert.equal(await page.locator("html").getAttribute("lang"), "ja");
  }

  await page.goto(main);
  assert.equal(await page.locator(".preview-notice").count(), 0);
  assert.equal(await page.locator("[data-article-filter]").count(), 0);
  const textureUrls = await page.evaluate(() => {
    const styles = [
      getComputedStyle(document.documentElement),
      getComputedStyle(document.querySelector(".paper"), "::before"),
    ];
    return styles.flatMap((style) =>
      Array.from(
        style.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g),
        (match) => match[1],
      ),
    );
  });
  assert.equal(
    new Set(textureUrls).size,
    2,
    "Both material textures must be present",
  );
  for (const url of textureUrls) {
    const parsed = new URL(url, page.url());
    assert(
      parsed.pathname.startsWith(base),
      `Texture URL lost Pages base: ${url}`,
    );
    const response = await context.request.get(url);
    assert.equal(response.status(), 200, `Missing texture: ${url}`);
    assert.match(response.headers()["content-type"], /image\/webp/);
    assert((await response.body()).length > 0);
  }
  checks.push(
    "Cork and paper textures load as local WebP assets under the Pages base",
  );
  assert.equal(await page.locator("a[data-work]").count(), 6);
  assert.deepEqual(
    await page
      .locator("a[data-work]")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.work)),
    expectedWorks,
  );
  for (const [id, publishedAt] of Object.entries(expectedPublishedAt)) {
    assert.equal(
      await page
        .locator(`[data-work-card="${id}"]`)
        .locator("..")
        .getAttribute("data-work-published-at"),
      publishedAt,
    );
  }
  checks.push(
    "Built HTML renders all six works in verified publication order with the oldest Gist last",
  );
  for (const id of expectedWorks) {
    assert.equal(
      await page.locator(`[data-work='${id}']`).getAttribute("href"),
      expectedDestinations[id],
    );
  }
  assert.equal(await page.locator("[data-article-list] a").count(), 0);
  assert.equal(await page.locator("[data-empty-articles]").count(), 0);
  assert.equal(
    await page
      .locator(".site-header nav, .hero, .notes-section, .section-count")
      .count(),
    0,
  );
  assert.equal(await page.locator("main h1").textContent(), "成果物一覧");
  assert.equal(await page.locator(".brand-wordmark").textContent(), "@1m_lcei");
  assert.equal(await page.title(), "Kei's Pinboard");
  assert.equal(
    await page.locator('meta[property="og:site_name"]').getAttribute("content"),
    "Kei's Pinboard",
  );
  assert.equal(
    await page.locator('meta[name="application-name"]').getAttribute("content"),
    "Kei's Pinboard",
  );
  assert.equal(
    await page
      .locator(
        ".section-label, .toolbox-label, .subtitle, .badge, .card-top, .footer-strip",
      )
      .count(),
    0,
  );
  assert.equal(await page.locator("a button").count(), 0);
  assert(!(await page.locator("body").innerText()).includes("ツールをひらく"));
  for (const work of works) {
    const card = page.locator(`[data-work-card="${work.id}"]`);
    assert.equal(
      await card.getByRole("link", { name: work.name, exact: true }).count(),
      1,
    );
    assert.deepEqual(
      await card.locator("[data-work-tag]").allTextContents(),
      expectedWorkTags[work.id],
    );
    assert.equal(await card.locator(".card-bottom svg").count(), 1);
    assert(
      (await card.locator(".work-tags").boundingBox()).y >=
        (await card.locator(".work-heading").boundingBox()).y +
          (await card.locator(".work-heading").boundingBox()).height -
          1,
    );
  }
  assert.equal(
    await page.locator("script").count(),
    1,
    "The homepage ships only the lightweight work tag filter",
  );
  assert.equal(
    await page.locator("script[data-work-filter-script]").count(),
    1,
  );
  assert.equal(
    await page.locator("[data-theme-switch], [data-theme-choice]").count(),
    0,
  );
  assert.equal(
    await page
      .locator(".tape")
      .evaluateAll((nodes) =>
        nodes.every(
          (node) => getComputedStyle(node).backgroundImage === "none",
        ),
      ),
    true,
    "Tape should have no highlight gradients",
  );
  await localLinksAndAssets();
  const brandSpriteResponse = await context.request.get(
    new URL(`${base}article-icons.svg`, page.url()).href,
  );
  assert.equal(brandSpriteResponse.status(), 200);
  assert.match(
    brandSpriteResponse.headers()["content-type"],
    /image\/svg\+xml/,
  );
  const brandSprite = await brandSpriteResponse.text();
  const zennSource = await readFile(
    path.join(root, "assets/brand-sources/zenn.svg.txt"),
    "utf8",
  );
  const gistSource = await readFile(
    path.join(root, "assets/brand-sources/gist.svg.txt"),
    "utf8",
  );
  const normalizeMarkup = (value) =>
    value.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
  assert(
    normalizeMarkup(brandSprite).includes(
      normalizeMarkup(zennSource.match(/<g fill="#3EA8FF">[\s\S]*?<\/g>/)[0]),
    ),
  );
  assert(
    normalizeMarkup(brandSprite).includes(
      normalizeMarkup(gistSource.match(/<path[\s\S]*?\/>/)[0]),
    ),
  );
  for (const [id, symbol] of [
    ["blue-archive-damage", "zenn"],
    ["kuto-glossary", "gist"],
  ]) {
    const icon = page.locator(`[data-work-card="${id}"] .work-icon svg`);
    assert.equal(await icon.count(), 1);
    assert.equal(await icon.getAttribute("aria-hidden"), "true");
    const use = icon.locator("use");
    assert.equal(
      await use.getAttribute("href"),
      `${base}article-icons.svg#${symbol}`,
    );
    const bounds = await use.evaluate((node) => {
      const box = node.getBBox();
      return { width: box.width, height: box.height };
    });
    assert(
      bounds.width > 0 && bounds.height > 0,
      "Official service symbol must render",
    );
  }
  checks.push(
    "Article icons use local SVG symbols with the unchanged blue Zenn logo and black Octicons code paths",
  );
  const frameMetrics = [];
  async function verifyImageFrames(label, target = page) {
    const metrics = await target
      .locator("[data-work-preview-frame]")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const frame = getComputedStyle(node);
          const picture = node.querySelector("picture");
          const viewport = getComputedStyle(picture);
          const image = getComputedStyle(picture.querySelector("img"));
          return {
            id: node.dataset.workPreviewFrame,
            frameWidth: Number.parseFloat(frame.width),
            frameHeight: Number.parseFloat(frame.height),
            viewportWidth: Number.parseFloat(viewport.width),
            viewportHeight: Number.parseFloat(viewport.height),
            imageWidth: Number.parseFloat(image.width),
            imageHeight: Number.parseFloat(image.height),
            left: Number.parseFloat(image.left),
            top: Number.parseFloat(image.top),
          };
        }),
      );
    assert.equal(metrics.length, 6);
    const heights = metrics.map((metric) => metric.frameHeight);
    assert(
      Math.max(...heights) - Math.min(...heights) < 0.1,
      `All six image frames must have equal CSS heights at ${label}`,
    );
    for (const metric of metrics) {
      const preview = works.find((work) => work.id === metric.id).preview;
      assert(Math.abs(metric.frameWidth / metric.frameHeight - 2) < 0.001);
      assert(metric.viewportWidth <= metric.frameWidth + 0.1);
      assert(metric.viewportHeight <= metric.frameHeight + 0.1);
      assert(
        Math.abs(
          metric.viewportWidth / metric.viewportHeight -
            preview.crop.width / preview.crop.height,
        ) < 0.01,
      );
      assert(
        Math.abs(
          metric.imageWidth / metric.imageHeight -
            preview.width / preview.height,
        ) < 0.01,
      );
      assert(
        Math.abs(
          (-metric.left / metric.imageWidth) * preview.width - preview.crop.x,
        ) < 1,
      );
      assert(
        Math.abs(
          (-metric.top / metric.imageHeight) * preview.height - preview.crop.y,
        ) < 1,
      );
      assert(
        Math.abs(
          (metric.viewportWidth / metric.imageWidth) * preview.width -
            preview.crop.width,
        ) < 1,
      );
      assert(
        Math.abs(
          (metric.viewportHeight / metric.imageHeight) * preview.height -
            preview.crop.height,
        ) < 1,
      );
    }
    frameMetrics.push({ label, metrics });
  }
  assert.deepEqual(
    works.find((work) => work.id === "blue-archive-damage").preview.crop,
    { x: 0, y: 360, width: 500, height: 340 },
  );
  await verifyImageFrames("desktop");
  checks.push(
    "All six image frames have equal heights, preserve proportional source crops, and retain the complete book title panel",
  );
  const imageMetrics = [];
  for (const work of works) {
    const picture = page.locator(`[data-work-preview="${work.id}"]`);
    const img = picture.locator("img");
    const state = await picture.evaluate((node) => ({
      firstChild: node.firstElementChild.tagName,
      type: node.firstElementChild.type,
      src: node.querySelector("img").currentSrc,
      width: node.querySelector("img").naturalWidth,
      height: node.querySelector("img").naturalHeight,
      displayedImageWidth: parseFloat(
        getComputedStyle(node.querySelector("img")).width,
      ),
    }));
    assert.equal(state.firstChild, "SOURCE");
    assert.equal(state.type, "image/avif");
    assert(new URL(state.src).pathname.endsWith(work.preview.avif));
    assert.equal(state.width, work.preview.width);
    assert.equal(state.height, work.preview.height);
    assert(
      state.displayedImageWidth <= state.width + 1,
      "Crop display must not enlarge beyond source pixels",
    );
    assert.equal(await img.getAttribute("width"), String(work.preview.width));
    assert.equal(await img.getAttribute("height"), String(work.preview.height));
    assert.equal(await img.getAttribute("alt"), work.preview.alt);
    assert.equal(await img.getAttribute("loading"), "lazy");
    const sourceResponse = await context.request.get(state.src);
    assert.match(sourceResponse.headers()["content-type"], /image\/avif/);
    const formats = {};
    for (const format of ["png", "avif"]) {
      const relative = work.preview[format];
      const sourceBytes = await readFile(path.join(root, "public", relative));
      const builtBytes = await readFile(path.join(root, "dist", relative));
      assert(
        sourceBytes.equals(builtBytes),
        "Build must retain the exact requested image formats",
      );
      formats[format] = sourceBytes.length;
    }
    imageMetrics.push({
      id: work.id,
      width: state.width,
      height: state.height,
      crop: work.preview.crop,
      bytes: formats,
      selected: "avif",
    });
    await picture.screenshot({
      path: path.join(qa, `work-preview-${work.id}-desktop.png`),
    });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await writeFile(
    path.join(qa, "work-image-results.json"),
    JSON.stringify(imageMetrics, null, 2),
  );
  checks.push(
    "All six pictures select AVIF, reserve dimensions, retain exact PNG/AVIF bytes and avoid source-pixel enlargement",
  );
  await noOverflow("Desktop");
  await audit("Desktop homepage");
  await page.screenshot({
    path: path.join(qa, "home-desktop.png"),
    fullPage: true,
  });
  await page.screenshot({
    path: path.join(qa, "review-works-desktop.png"),
    fullPage: true,
  });

  const fallbackContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const fallbackRequests = [];
  fallbackContext.on("request", (request) =>
    fallbackRequests.push(request.url()),
  );
  await fallbackContext.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== sites[0].origin) return route.abort();
    if (route.request().resourceType() === "document") {
      const response = await route.fetch();
      const html = await response.text();
      return route.fulfill({
        response,
        body: html.replaceAll(
          'type="image/avif"',
          'type="image/x-unsupported"',
        ),
      });
    }
    return route.continue();
  });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.goto(main);
  await loadPreviewImages(fallbackPage);
  for (const work of works) {
    const img = fallbackPage.locator(`[data-work-preview="${work.id}"] img`);
    const state = await img.evaluate((node) => ({
      src: node.currentSrc,
      width: node.naturalWidth,
      height: node.naturalHeight,
    }));
    assert(new URL(state.src).pathname.endsWith(work.preview.png));
    assert.equal(state.width, work.preview.width);
    assert.equal(state.height, work.preview.height);
    assert.match(
      (await fallbackContext.request.get(state.src)).headers()["content-type"],
      /image\/png/,
    );
  }
  assert(
    !fallbackRequests.some((url) => new URL(url).pathname.endsWith(".avif")),
    "Unsupported AVIF source must fall back without requesting AVIF",
  );
  await fallbackPage.screenshot({
    path: path.join(qa, "tools-png-fallback-desktop.png"),
    fullPage: true,
  });
  await fallbackContext.close();
  checks.push(
    "All six native picture fallbacks select and decode PNG when AVIF MIME support is unavailable",
  );
  const firstCard = await page.locator(".work-card").first().boundingBox();
  await page.screenshot({
    path: path.join(qa, "paper-flat-pin-detail.png"),
    clip: {
      x: firstCard.x - 12,
      y: firstCard.y - 18,
      width: firstCard.width + 24,
      height: firstCard.height + 36,
    },
  });

  await page.keyboard.press("Tab");
  assert(
    await page
      .locator(".skip-link")
      .evaluate((node) => node === document.activeElement),
  );
  await page.keyboard.press("Enter");
  assert(
    await page
      .locator("main")
      .evaluate((node) => node === document.activeElement),
  );
  await page.keyboard.press("Tab");
  const initialSort = page.getByRole("button", {
    name: "公開日を古い順に並べる（新しい順と切り替え）",
    exact: true,
  });
  assert(await initialSort.evaluate((node) => node === document.activeElement));
  assert.equal(await initialSort.getAttribute("aria-pressed"), "false");
  assert.equal(
    await initialSort.locator("[data-work-sort-label]").textContent(),
    "新しい順",
  );
  assert.notEqual(
    await initialSort.evaluate((node) => getComputedStyle(node).outlineStyle),
    "none",
  );
  assert((await initialSort.boundingBox()).height >= 44);
  for (const id of expectedWorks) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => ({
      id: document.activeElement?.getAttribute("data-work"),
      outline: getComputedStyle(document.activeElement, "::after").outlineStyle,
    }));
    assert.equal(focus.id, id, "Work cards must follow visual keyboard order");
    assert.notEqual(focus.outline, "none");
    for (const tag of works.find((work) => work.id === id).tags) {
      await page.keyboard.press("Tab");
      const tagFocus = await page.evaluate(() => ({
        tag: document.activeElement?.getAttribute("data-work-tag"),
        outline: getComputedStyle(document.activeElement).outlineStyle,
      }));
      assert.equal(
        tagFocus.tag,
        tag,
        "Tags follow their own card link in keyboard order",
      );
      assert.notEqual(tagFocus.outline, "none");
    }
  }
  checks.push(
    "Skip link, card links, classification tags, keyboard order and visible focus passed",
  );

  async function visibleWorkIds(target = page) {
    return target
      .locator(".work-card:visible")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.workCard));
  }
  const toolTag = page.locator('[data-work-tag="ツール"]').first();
  const beforeTagInteractionUrl = page.url();
  await toolTag.focus();
  await page.keyboard.press("Space");
  assert.deepEqual(await visibleWorkIds(), [
    "kuto-measure",
    "image-rect-picker",
    "kuto-ladder",
  ]);
  assert.equal(
    await page.locator('[data-work-tag][aria-pressed="true"]').count(),
    3,
  );
  assert(
    (await page.locator("[data-work-announcement]").textContent()).includes(
      "3件",
    ),
  );
  assert.equal(
    page.url(),
    beforeTagInteractionUrl,
    "A tag must preserve the exact URL, including the skip-link fragment",
  );
  await page
    .locator('[data-work-card="kuto-measure"] [data-work-tag="戦術対抗戦"]')
    .click();
  assert.deepEqual(await visibleWorkIds(), [
    "kuto-measure",
    "kuto-nanidasu",
    "kuto-ladder",
    "kuto-glossary",
  ]);
  assert.equal(
    await page.locator('[data-work-tag="ツール"][aria-pressed="true"]').count(),
    0,
  );
  await audit("Work category selection");
  const diagnosisTag = page.locator('[data-work-tag="診断"]');
  await diagnosisTag.focus();
  await page.keyboard.press("Enter");
  assert.deepEqual(await visibleWorkIds(), ["kuto-nanidasu"]);
  assert.equal(page.url(), beforeTagInteractionUrl);
  await page.locator("[data-clear-work-filter]").click();
  assert.deepEqual(await visibleWorkIds(), expectedWorks);
  assert(
    await diagnosisTag.evaluate((node) => node === document.activeElement),
  );
  assert.equal(
    await page.locator('[data-work-tag][aria-pressed="true"]').count(),
    0,
  );
  assert(!(await page.locator("[data-work-filter-status]").isVisible()));
  const imageTag = page.locator('[data-work-tag="画像"]');
  await imageTag.click();
  assert.deepEqual(await visibleWorkIds(), ["image-rect-picker"]);
  await imageTag.click();
  assert.deepEqual(await visibleWorkIds(), expectedWorks);
  for (const [tag, ids] of Object.entries(expectedTagMatches)) {
    const button = page
      .locator("[data-work-tag]")
      .filter({ hasText: tag })
      .first();
    await button.focus();
    await page.keyboard.press("Enter");
    assert.deepEqual(
      await visibleWorkIds(),
      ids,
      `Unexpected matches for ${tag}`,
    );
    assert.equal(
      await page.locator('[data-work-tag][aria-pressed="true"]').count(),
      ids.length,
    );
    assert.equal(page.url(), beforeTagInteractionUrl);
    if (tag === "記事") await audit("External article category selection");
    await button.click();
    assert.deepEqual(await visibleWorkIds(), expectedWorks);
    assert(!(await page.locator("[data-work-filter-status]").isVisible()));
  }
  checks.push(
    "All seven classifications filter six works, toggle, clear and restore focus without navigation",
  );

  const sortButton = page.getByRole("button", {
    name: "公開日を古い順に並べる（新しい順と切り替え）",
    exact: true,
  });
  const oldestWorks = [...expectedWorks].reverse();
  const domWorkIds = (target) =>
    target
      .locator("[data-work-card]")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.workCard));
  await sortButton.focus();
  await page.keyboard.press("Space");
  assert.equal(await sortButton.getAttribute("aria-pressed"), "true");
  assert.equal(
    await sortButton.locator("[data-work-sort-label]").textContent(),
    "古い順",
  );
  assert.deepEqual(await domWorkIds(page), oldestWorks);
  assert.deepEqual(await visibleWorkIds(), oldestWorks);
  assert.match(
    await page.locator("[data-work-announcement]").textContent(),
    /古い順/,
  );
  assert.equal(page.url(), beforeTagInteractionUrl);
  for (const id of oldestWorks) {
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.getAttribute("data-work"),
      ),
      id,
    );
    for (const tag of works.find((work) => work.id === id).tags) {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.getAttribute("data-work-tag"),
        ),
        tag,
      );
    }
  }
  await sortButton.focus();
  await page.keyboard.press("Enter");
  assert.deepEqual(await domWorkIds(page), expectedWorks);
  assert.equal(await sortButton.getAttribute("aria-pressed"), "false");
  await sortButton.click();
  await loadPreviewImages();
  await page.screenshot({
    path: path.join(qa, "review-works-oldest-desktop.png"),
    fullPage: true,
  });
  await audit("Oldest-first work order");
  checks.push(
    "Paper sort button exposes a stable accessible name and toggle state; Space/Enter reorder the DOM and keyboard links follow the new visual order",
  );

  for (const [tag, ids] of Object.entries(expectedTagMatches)) {
    const button = page
      .locator("[data-work-tag]")
      .filter({ hasText: tag })
      .first();
    await button.click();
    assert.deepEqual(await visibleWorkIds(), [...ids].reverse());
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    if (tag === "記事") {
      await loadPreviewImages();
      await page.screenshot({
        path: path.join(qa, "review-works-oldest-articles-desktop.png"),
        fullPage: true,
      });
    }
    await sortButton.click();
    assert.deepEqual(await visibleWorkIds(), ids);
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    await sortButton.click();
    assert.deepEqual(await visibleWorkIds(), [...ids].reverse());
    await page.locator("[data-clear-work-filter]").click();
    assert.deepEqual(await visibleWorkIds(), oldestWorks);
    assert.equal(await sortButton.getAttribute("aria-pressed"), "true");
  }
  await page.reload();
  assert.deepEqual(await visibleWorkIds(), expectedWorks);
  assert.equal(await sortButton.getAttribute("aria-pressed"), "false");
  checks.push(
    "All seven tags retain their selected filter across both sort directions; clearing preserves the chosen order and reloading restores newest first",
  );

  const sortFixture = stableFixture.map((work, index) => ({
    ...work,
    id: expectedWorks[index],
  }));
  const fixturePage = await context.newPage();
  fixturePage.on("pageerror", (error) => errors.push(error.message));
  await fixturePage.route(main, async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    const fragments = new Map(
      Array.from(
        html.matchAll(/<li data-work-item[\s\S]*?<\/li>/g),
        (match) => {
          const id = match[0].match(/data-work-card="([^"]+)"/)[1];
          const timestamp = sortFixture.find(
            (work) => work.id === id,
          ).publishedAt;
          return [
            id,
            match[0].replace(
              / data-work-published-at="[^"]*"/,
              timestamp === null
                ? ""
                : ` data-work-published-at="${timestamp}"`,
            ),
          ];
        },
      ),
    );
    assert.equal(fragments.size, 6);
    const ordered = sortWorksByPublishedAt(sortFixture).map((work) =>
      fragments.get(work.id),
    );
    let index = 0;
    await route.fulfill({
      response,
      body: html.replace(
        /<li data-work-item[\s\S]*?<\/li>/g,
        () => ordered[index++],
      ),
    });
  });
  await fixturePage.goto(main);
  const fixtureNewest = [
    "kuto-nanidasu",
    "image-rect-picker",
    "kuto-ladder",
    "blue-archive-damage",
    "kuto-measure",
    "kuto-glossary",
  ];
  const fixtureOldest = [
    "blue-archive-damage",
    "image-rect-picker",
    "kuto-ladder",
    "kuto-nanidasu",
    "kuto-measure",
    "kuto-glossary",
  ];
  assert.deepEqual(await domWorkIds(fixturePage), fixtureNewest);
  await fixturePage.locator("[data-work-sort]").click();
  assert.deepEqual(await domWorkIds(fixturePage), fixtureOldest);
  await fixturePage.locator("[data-work-sort]").click();
  assert.deepEqual(await domWorkIds(fixturePage), fixtureNewest);
  await fixturePage.close();
  checks.push(
    "Client sorting compares full timestamps, preserves equal instants across time zones and keeps unknown dates last in stable order for both directions",
  );

  const socials = page.locator(".social-links a");
  assert.equal(await socials.count(), 2);
  assert.deepEqual(
    await socials.evaluateAll((nodes) => nodes.map((node) => node.href)),
    ["https://x.com/1m_lcei", "https://github.com/1m-lcei"],
  );
  assert.equal(
    await page
      .getByRole("link", { name: "X（@1m_lcei）", exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page
      .getByRole("link", { name: "GitHub（1m-lcei）", exact: true })
      .count(),
    1,
  );
  for (const [index, id] of ["x", "github"].entries()) {
    assert.equal(
      await socials.nth(index).locator("svg use").getAttribute("href"),
      `${base}social-icons.svg#${id}`,
    );
    assert((await socials.nth(index).boundingBox()).height >= 44);
  }
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".social-link use")).every(
      (node) => node.getBBox().width > 0,
    ),
  );
  assert.equal(await page.locator(".site-footer p").count(), 0);
  checks.push(
    "Verified X/GitHub profile destinations and accessible icon links render through local SVG symbols and use",
  );

  const navigationContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await navigationContext.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (sites.some((site) => url.origin === site.origin))
      return route.continue();
    const work = works.find((item) => item.href === url.href);
    if (work && request.isNavigationRequest())
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<h1 data-test-destination>${work.id}</h1>`,
      });
    externalRequests.push(url.href);
    return route.abort();
  });
  const navigationPage = await navigationContext.newPage();
  for (const work of works) {
    await navigationPage.goto(main);
    await navigationPage
      .locator(`[data-work-card="${work.id}"] .work-preview`)
      .scrollIntoViewIfNeeded();
    const preview = await navigationPage
      .locator(`[data-work-card="${work.id}"] .work-preview`)
      .boundingBox();
    await navigationPage.mouse.click(
      preview.x + preview.width / 2,
      preview.y + preview.height / 2,
    );
    await navigationPage.waitForURL(work.href);
    assert.equal(
      await navigationPage.locator("[data-test-destination]").textContent(),
      work.id,
    );
    await navigationPage.goto(main);
    await navigationPage.locator(`[data-work="${work.id}"]`).focus();
    await navigationPage.keyboard.press("Enter");
    await navigationPage.waitForURL(work.href);
  }
  await navigationContext.close();
  checks.push(
    "The entire card and keyboard Enter navigate to each unchanged work URL using mocked destinations; no public work is fetched",
  );

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(main);
    await noOverflow(`Mobile ${width}`);
    await verifyImageFrames(`mobile ${width}`);
    const mobileSort = page.locator("[data-work-sort]");
    assert((await mobileSort.boundingBox()).height >= 44);
    await mobileSort.click();
    assert.deepEqual(await visibleWorkIds(), [...expectedWorks].reverse());
    await noOverflow(`Oldest mobile ${width}`);
    await loadPreviewImages();
    await page.screenshot({
      path: path.join(qa, `review-works-oldest-mobile-${width}.png`),
      fullPage: true,
    });
    await page.locator('[data-work-tag="記事"]').first().click();
    assert.deepEqual(await visibleWorkIds(), [
      "kuto-glossary",
      "blue-archive-damage",
    ]);
    if (width === 390) {
      await audit("Oldest article filter on mobile");
      await page.screenshot({
        path: path.join(qa, "review-works-oldest-articles-mobile.png"),
        fullPage: true,
      });
    }
    await mobileSort.click();
    assert.deepEqual(await visibleWorkIds(), [
      "blue-archive-damage",
      "kuto-glossary",
    ]);
    await page.locator("[data-clear-work-filter]").click();
    assert.deepEqual(await visibleWorkIds(), expectedWorks);
    const cards = await page.locator(".work-card").all();
    const positions = await Promise.all(
      cards.map((card) => card.boundingBox()),
    );
    assert(
      positions.every((box) => Math.abs(box.x - positions[0].x) < 1),
      "Mobile cards should form one column",
    );
    await page.goto(`${main}articles/`);
    assert(new URL(page.url()).pathname.endsWith("/articles/"));
    assert(await page.locator("[data-empty-articles]").isVisible());
    await localLinksAndAssets();
    await page.goto(main);
    await loadPreviewImages();
    await page.screenshot({
      path: path.join(qa, `review-works-mobile-${width}.png`),
      fullPage: true,
    });
    if (width === 390) {
      await audit("Mobile homepage");
      await page.screenshot({
        path: path.join(qa, "home-mobile.png"),
        fullPage: true,
      });
      await page.screenshot({
        path: path.join(qa, "review-works-mobile.png"),
        fullPage: true,
      });
      for (const work of works) {
        await page.locator(`[data-work-preview="${work.id}"]`).screenshot({
          path: path.join(qa, `work-preview-${work.id}-mobile.png`),
        });
      }
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  }
  await writeFile(
    path.join(qa, "work-frame-results.json"),
    JSON.stringify(frameMetrics, null, 2),
  );
  checks.push("320px and 390px layout and navigation passed");

  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await noOverflow("200% text");
  for (const card of await page.locator("a[data-work]").all())
    assert(await card.isVisible());
  checks.push("200% text resizing passed");
  await page.screenshot({
    path: path.join(qa, "home-text-200.png"),
    fullPage: true,
  });
  await page.goto(main);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await audit("Light homepage on dark OS");
  await page.screenshot({
    path: path.join(qa, "home-light-dark-os.png"),
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light", forcedColors: "active" });
  await noOverflow("Forced colors");
  checks.push(
    "Fixed light display on dark OS, reduced motion and forced colors checked",
  );
  await page.emulateMedia({ forcedColors: "none" });

  for (const route of ["articles/"]) {
    await page.goto(`${main}${route}`);
    await localLinksAndAssets();
    await audit(route);
  }

  await page.goto(`${contentSite}articles/`);
  const articlePaths = await page
    .locator("[data-article-list] a")
    .evaluateAll((nodes) => nodes.map((node) => new URL(node.href).pathname));
  assert.deepEqual(
    articlePaths.filter((value) => value.includes("/qa-")),
    [
      `${base}articles/qa-newer/`,
      `${base}articles/qa-older/`,
      `${base}articles/qa-tools/`,
      `${base}articles/qa-archive/`,
    ],
  );
  assert(!(await page.content()).includes("DRAFT_SENTINEL"));
  await page.goto(contentSite);
  await loadPreviewImages();
  const recentPaths = await page
    .locator("[data-article-list] a")
    .evaluateAll((nodes) => nodes.map((node) => new URL(node.href).pathname));
  assert.deepEqual(recentPaths, []);
  assert.equal(
    await page.locator("[data-article-filter], [data-empty-articles]").count(),
    0,
  );
  checks.push(
    "The homepage has no articles even in the preview; the retained article list orders published posts and excludes drafts",
  );

  async function visibleArticlePaths() {
    return page
      .locator("[data-article-list] a:visible")
      .evaluateAll((nodes) => nodes.map((node) => new URL(node.href).pathname));
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${contentSite}articles/`);
  await loadPreviewImages();
  assert(await page.locator(".preview-notice").isVisible());
  assert.equal(
    await page.locator("[data-article-tag]").count(),
    4,
    "Duplicate Markdown tags must become one option",
  );
  assert.equal(
    (await visibleArticlePaths()).length,
    4,
    "The retained article list initially shows all published articles",
  );
  assert.equal(
    await page.locator("script[data-article-filter-script]").count(),
    1,
  );
  await noOverflow("Preview desktop");
  await audit("Preview article list with tag controls");
  await page.screenshot({
    path: path.join(qa, "review-preview-desktop.png"),
    fullPage: true,
  });
  const notesTag = page.locator('[data-article-tag="制作ノート"]');
  await notesTag.focus();
  assert.notEqual(
    await notesTag.evaluate((node) => getComputedStyle(node).outlineStyle),
    "none",
  );
  await page.keyboard.press("Space");
  assert.deepEqual(await visibleArticlePaths(), [
    `${base}articles/qa-newer/`,
    `${base}articles/qa-archive/`,
  ]);
  assert.equal(
    await page.locator('[data-article-tag][aria-pressed="true"]').count(),
    1,
  );
  assert.equal(await notesTag.getAttribute("aria-pressed"), "true");
  assert.equal(new URL(page.url()).searchParams.get("tag"), "制作ノート");
  await page.locator('[data-article-tag="道具のメモ"]').click();
  assert.deepEqual(await visibleArticlePaths(), [
    `${base}articles/qa-newer/`,
    `${base}articles/qa-tools/`,
  ]);
  await page.locator('[data-article-tag=""]').focus();
  await page.keyboard.press("Enter");
  assert.equal((await visibleArticlePaths()).length, 4);
  assert.equal(new URL(page.url()).searchParams.has("tag"), false);
  checks.push(
    "Markdown tag deduplication, single selection, keyboard Space/Enter, older matches and reset passed on the retained article list",
  );
  await page.goto(
    `${contentSite}articles/?tag=${encodeURIComponent("見つからないタグ")}`,
  );
  assert.equal((await visibleArticlePaths()).length, 0);
  assert(await page.locator("[data-filter-empty]").isVisible());
  assert.match(await page.locator("[data-filter-status]").textContent(), /0件/);
  await audit("Zero matching articles");
  await page.locator("[data-clear-filter]").click();
  assert.equal((await visibleArticlePaths()).length, 4);
  assert.equal(
    await page.locator('[data-article-tag=""]').getAttribute("aria-pressed"),
    "true",
  );
  checks.push(
    "Unknown tag URL shows a clear zero-result state; reset restores all articles",
  );
  await page.goto(
    `${contentSite}articles/?tag=${encodeURIComponent("制作ノート")}`,
  );
  assert.deepEqual(await visibleArticlePaths(), [
    `${base}articles/qa-newer/`,
    `${base}articles/qa-archive/`,
  ]);
  await page.reload();
  assert.equal((await visibleArticlePaths()).length, 2);
  await page.locator('[data-article-tag=""]').click();
  assert.equal((await visibleArticlePaths()).length, 4);
  await audit("Article list tag controls");
  checks.push(
    "Article list filters all articles and restores four on reset; selected URL survives reload",
  );
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${contentSite}articles/`);
    await noOverflow(`Preview mobile ${width}`);
    for (const button of await page.locator("[data-article-tag]").all()) {
      assert((await button.boundingBox()).height >= 44);
    }
    if (width === 390) {
      await audit("Preview mobile with tags");
      await page.screenshot({
        path: path.join(qa, "review-preview-mobile.png"),
        fullPage: true,
      });
    }
  }
  checks.push("390px and 320px preview layout and 44px tag targets passed");
  const productionPreviewResponse = await page.goto(
    `${main}articles/qa-newer/`,
  );
  assert.equal(productionPreviewResponse.status(), 404);
  assert.equal(await page.locator(".preview-notice").count(), 0);
  checks.push("Preview posts and banner are absent from the production build");

  await page.goto(`${contentSite}articles/qa-newer/`);
  assert.equal(await page.locator(".prose h2").count(), 2);
  assert.equal(await page.locator(".prose pre").count(), 1);
  assert.equal(await page.locator(".prose table").count(), 1);
  await localLinksAndAssets();
  await noOverflow("Article desktop");
  await audit("Markdown article");
  await page.screenshot({
    path: path.join(qa, "article-fixture-desktop.png"),
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await audit("Light Markdown article on dark OS");
  await page.screenshot({
    path: path.join(qa, "article-fixture-light-dark-os.png"),
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow("Article mobile");
  await page.screenshot({
    path: path.join(qa, "article-fixture-mobile.png"),
    fullPage: true,
  });
  await page.locator(".prose a").click();
  assert(new URL(page.url()).pathname.endsWith("/qa-older/"));
  assert((await page.locator("main h1").textContent()).includes("< と &"));
  await page.locator(".article-navigation a").click();
  assert(new URL(page.url()).pathname.endsWith("/articles/"));
  checks.push(
    "Markdown headings, code, table, escaping and article navigation passed",
  );

  for (const slug of [
    "draft-example",
    "qa-hidden",
    "qa-default-draft",
    "missing-article",
  ]) {
    const response = await page.goto(`${contentSite}articles/${slug}/`);
    assert.equal(
      response.status(),
      404,
      `Unpublished or missing article should be 404: ${slug}`,
    );
    assert.equal(
      await page.locator("meta[name='robots']").getAttribute("content"),
      "noindex",
    );
    assert(!(await page.content()).includes("HIDDEN_BODY_SENTINEL"));
    await localLinksAndAssets();
  }
  await audit("404 page");
  await page.screenshot({
    path: path.join(qa, "404-mobile.png"),
    fullPage: true,
  });
  checks.push(
    "Explicit drafts, default drafts and missing articles return the custom 404",
  );

  async function assertFixedLight(target, label) {
    await target.waitForLoadState("load");
    const state = await target.evaluate(() => ({
      scheme: getComputedStyle(document.documentElement).colorScheme,
      board: getComputedStyle(document.documentElement)
        .getPropertyValue("--board")
        .trim(),
      paper: getComputedStyle(
        document.querySelector(
          ".work-card, .article-page, .article-card, .empty-note",
        ),
        "::before",
      ).backgroundColor,
      theme: document.documentElement.getAttribute("data-theme"),
      meta: Array.from(
        document.querySelectorAll('meta[name="theme-color"]'),
      ).map((meta) => ({
        content: meta.content,
        media: meta.getAttribute("media"),
      })),
      colorScheme: document.querySelector('meta[name="color-scheme"]').content,
    }));
    assert.equal(state.scheme, "light", label);
    assert.equal(state.board, "#ead8bd", label);
    assert(
      ["rgb(255, 252, 244)", "rgb(248, 240, 222)"].includes(state.paper),
      label,
    );
    assert.equal(state.theme, null, label);
    assert.equal(state.colorScheme, "light", label);
    assert.deepEqual(state.meta, [{ content: "#ead8bd", media: null }], label);
    assert.equal(
      await target
        .locator(
          "[data-theme-switch], [data-theme-choice], script[data-theme-script]",
        )
        .count(),
      0,
      label,
    );
  }

  async function seedSavedTheme(context, origin) {
    await context.addInitScript((siteOrigin) => {
      if (window.location.origin === siteOrigin) {
        window.localStorage.setItem("kei-pinboard:theme", "dark");
      }
    }, origin);
  }

  for (const systemTheme of ["dark", "light"]) {
    for (const savedTheme of [null, "dark"]) {
      const lightContext = await browser.newContext({
        colorScheme: systemTheme,
        viewport: { width: 1440, height: 1000 },
        locale: "ja-JP",
      });
      if (savedTheme) await seedSavedTheme(lightContext, sites[1].origin);
      const lightPage = await lightContext.newPage();
      lightPage.on("pageerror", (error) => errors.push(error.message));
      const label = `Light display on ${systemTheme} OS with ${savedTheme || "no"} saved choice`;
      await lightPage.goto(contentSite);
      await assertFixedLight(lightPage, label);
      if (savedTheme) {
        assert.equal(
          await lightPage.evaluate(() =>
            localStorage.getItem("kei-pinboard:theme"),
          ),
          "dark",
          "The old choice remains stored but has no effect",
        );
      }
      await lightPage.reload();
      await assertFixedLight(lightPage, "Reload keeps light display");
      await lightPage.emulateMedia({
        colorScheme: systemTheme === "dark" ? "light" : "dark",
      });
      await assertFixedLight(lightPage, "OS changes keep light display");
      await lightPage.emulateMedia({ colorScheme: systemTheme });
      if (systemTheme === "dark" && savedTheme === "dark") {
        await loadPreviewImages(lightPage);
        await audit(
          "Light homepage with saved dark choice on dark OS",
          lightPage,
        );
        await lightPage.screenshot({
          path: path.join(qa, "home-light-saved-dark-desktop.png"),
          fullPage: true,
        });
      }
      await lightPage.goto(`${contentSite}articles/`);
      await lightPage.locator("[data-article-list] a").first().click();
      await assertFixedLight(lightPage, "Article stays light");
      assert.equal(
        await lightPage
          .locator(".astro-code")
          .evaluate((code) => getComputedStyle(code).backgroundColor),
        "rgb(255, 255, 255)",
        "Code highlighting stays light",
      );
      await lightPage.reload();
      await assertFixedLight(lightPage, "Article reload stays light");
      await lightPage.locator(".article-navigation a").click();
      await assertFixedLight(lightPage, "Article list stays light");
      await lightPage.locator(".brand").click();
      await assertFixedLight(
        lightPage,
        "Brand link returns to the light homepage",
      );
      await lightPage.setViewportSize({ width: 390, height: 844 });
      await lightPage.goto(contentSite);
      await assertFixedLight(lightPage, "Mobile stays light");
      const width = await lightPage.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      assert(width.scroll <= width.client + 1);
      if (systemTheme === "dark" && savedTheme === "dark") {
        await lightPage.screenshot({
          path: path.join(qa, "home-light-saved-dark-mobile.png"),
          fullPage: true,
        });
      }
      checks.push(
        `${label}: reload, OS changes, article/code, navigation and mobile passed`,
      );
      await lightContext.close();
    }
  }

  const touchContext = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 390, height: 844 },
    isMobile: channel !== "firefox",
    hasTouch: true,
  });
  await seedSavedTheme(touchContext, sites[0].origin);
  const touchPage = await touchContext.newPage();
  await touchPage.goto(main);
  assert.equal(
    await touchPage.evaluate(() => localStorage.getItem("kei-pinboard:theme")),
    "dark",
  );
  assert.deepEqual(await visibleWorkIds(touchPage), expectedWorks);
  await touchPage.locator('[data-work-tag="画像"]').tap();
  assert.deepEqual(await visibleWorkIds(touchPage), ["image-rect-picker"]);
  await touchPage.locator("[data-clear-work-filter]").tap();
  assert.deepEqual(await visibleWorkIds(touchPage), expectedWorks);
  for (const [tag, ids] of Object.entries(expectedTagMatches)) {
    await touchPage
      .locator("[data-work-tag]")
      .filter({ hasText: tag })
      .first()
      .tap();
    assert.deepEqual(await visibleWorkIds(touchPage), ids);
    await touchPage.locator("[data-clear-work-filter]").tap();
    assert.deepEqual(await visibleWorkIds(touchPage), expectedWorks);
  }
  checks.push("All seven work tags and clear work on a touch device");
  const touchSort = touchPage.locator("[data-work-sort]");
  await touchSort.tap();
  assert.deepEqual(
    await visibleWorkIds(touchPage),
    [...expectedWorks].reverse(),
  );
  assert.equal(await touchSort.getAttribute("aria-pressed"), "true");
  await touchPage.locator('[data-work-tag="記事"]').first().tap();
  assert.deepEqual(await visibleWorkIds(touchPage), [
    "kuto-glossary",
    "blue-archive-damage",
  ]);
  await touchSort.tap();
  assert.deepEqual(await visibleWorkIds(touchPage), [
    "blue-archive-damage",
    "kuto-glossary",
  ]);
  await touchSort.tap();
  await touchPage.locator("[data-clear-work-filter]").tap();
  assert.deepEqual(
    await visibleWorkIds(touchPage),
    [...expectedWorks].reverse(),
  );
  await touchSort.tap();
  assert.deepEqual(await visibleWorkIds(touchPage), expectedWorks);
  checks.push(
    "Mobile taps toggle both directions, preserve the article filter and keep oldest order when the filter is cleared",
  );
  await assertFixedLight(
    touchPage,
    "Touch device with saved dark choice stays light",
  );
  await touchPage.goto(`${main}articles/`);
  await assertFixedLight(touchPage, "Touch article navigation stays light");
  await touchPage.goto(`${contentSite}articles/`);
  await touchPage.locator('[data-article-tag="制作ノート"]').tap();
  assert.equal(
    await touchPage.locator("[data-article-list] a:visible").count(),
    2,
  );
  await touchPage.locator('[data-article-tag=""]').tap();
  assert.equal(
    await touchPage.locator("[data-article-list] a:visible").count(),
    4,
  );
  await assertFixedLight(touchPage, "Tag taps keep the light palette");
  await touchPage.locator(".brand").tap();
  await touchPage.waitForURL(contentSite);
  assert.equal(await touchPage.locator("a[data-work]").count(), 6);
  await touchContext.close();
  checks.push(
    "Touch navigation stays light on dark OS with a saved dark choice",
  );

  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "dark",
    viewport: { width: 390, height: 844 },
    isMobile: channel !== "firefox",
    hasTouch: true,
  });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(main);
  assert.equal(
    await noJsPage
      .locator("[data-theme-switch], script[data-theme-script]")
      .count(),
    0,
  );
  assert.equal(
    await noJsPage.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
    "light",
  );
  assert.equal(
    await noJsPage.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--board")
        .trim(),
    ),
    "#ead8bd",
  );
  assert.equal(await noJsPage.locator("a[data-work]").count(), 6);
  assert.deepEqual(await visibleWorkIds(noJsPage), expectedWorks);
  assert(!(await noJsPage.locator("[data-work-controls]").isVisible()));
  assert.equal(
    await noJsPage.locator("[data-work-sort]").getAttribute("disabled"),
    "",
  );
  assert.equal(await noJsPage.locator("[data-work-tag]:disabled").count(), 17);
  assert(!(await noJsPage.locator("[data-work-filter-status]").isVisible()));
  await noJsPage.goto(`${main}articles/`);
  await noJsPage.locator("[data-empty-articles]").waitFor({ state: "visible" });
  assert(await noJsPage.locator("[data-empty-articles]").isVisible());
  await noJsPage.goto(`${contentSite}articles/`);
  assert(!(await noJsPage.locator("[data-article-filters]").isVisible()));
  assert.equal(
    await noJsPage.locator("[data-article-list] a:visible").count(),
    4,
  );
  await noJsPage.goto(contentSite);
  assert.equal(
    await noJsPage.locator("[data-article-list] a:visible").count(),
    0,
  );
  checks.push(
    "Without JavaScript, filter controls stay hidden and article links remain usable",
  );
  await noJs.close();
  checks.push(
    "Light display on dark OS, touch navigation and content work with JavaScript disabled",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  await writeFile(
    path.join(qa, "results.json"),
    `${JSON.stringify({ runtime, channel, checks, externalRequests, errors, fixture: path.relative(root, fixture) }, null, 2)}\n`,
  );
  console.log(
    `${checks.length} browser/content checks passed (Bun ${runtime.version}, ${channel}). Screenshots: .cache/qa/`,
  );
} finally {
  await browser?.close();
  await Promise.all(sites.map((site) => site.close()));
}
