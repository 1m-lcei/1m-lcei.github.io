import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export const fixtures = {
  "qa-newer.md": `---
title: "プレビュー：記事表示のサンプル"
description: "これは検証用コピーだけに存在する記事です。"
date: 2026-10-03
tags: ["制作ノート", "道具のメモ", "道具のメモ"]
draft: false
---

この本文は表示を確認するためのサンプルです。作者の体験や意見を表す記事ではありません。

## 見出しと文章

**強調**や、[前の記事](../qa-older/)へのリンクを確認します。

- 一つ目の項目
- 二つ目の項目

> 引用の表示を確認する文章です。

## コードと表

\`\`\`text
${"long-code-line-".repeat(30)}
\`\`\`

| 名前 | 内容 |
| --- | --- |
| 表示確認 | 長い文章でも読みやすく表示されることを確認します。 |
`,
  "qa-older.md": `---
title: "プレビュー：タイトルの < と & の表示確認"
description: "記号を含む概要 < & >"
date: 2026-10-01
tags: ["ひとこと"]
draft: false
---

## 前の記事

検証用の本文です。
`,
  "qa-hidden.md": `---
title: "EXPLICIT_DRAFT_SENTINEL"
description: "Draft must not be published."
date: 2026-10-04
draft: true
---

HIDDEN_BODY_SENTINEL
`,
  "qa-default-draft.md": `---
title: "DEFAULT_DRAFT_SENTINEL"
description: "Omitting draft must keep the article private."
date: 2026-10-04
---

DEFAULT_HIDDEN_BODY_SENTINEL
`,
  "qa-tools.md": `---
title: "プレビュー：道具のメモ"
description: "タグと紙札の見た目を確認するための仮記事です。"
date: 2026-09-30
tags: ["道具のメモ"]
draft: false
---

この文章はローカルプレビュー専用です。作者の体験や意見を表す投稿ではありません。
`,
  "qa-archive.md": `---
title: "プレビュー：前の制作ノート"
description: "最新3件より前の記事もタグで見つかることを確認します。"
date: 2026-09-20
tags: ["制作ノート"]
draft: false
---

この文章はローカルプレビュー専用です。公開サイトには含まれません。
`,
};

export async function createPreviewFixture(
  root,
  prefix,
  { preview = true } = {},
) {
  assert(process.versions.bun, "Run previews with Bun");
  await mkdir(path.dirname(prefix), { recursive: true });
  const fixture = await mkdtemp(prefix);
  for (const entry of await readdir(root)) {
    if (["node_modules", ".cache", ".astro", "dist", ".git"].includes(entry))
      continue;
    await cp(path.join(root, entry), path.join(fixture, entry), {
      recursive: true,
    });
  }
  await symlink(
    path.join(root, "node_modules"),
    path.join(fixture, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  for (const [filename, content] of Object.entries(fixtures)) {
    await writeFile(
      path.join(fixture, "src", "content", "posts", filename),
      content,
      { flag: "wx" },
    );
  }
  if (preview) {
    const layoutPath = path.join(fixture, "src", "layouts", "SiteLayout.astro");
    const layout = await readFile(layoutPath, "utf8");
    assert(layout.includes("<body>") && layout.includes("<head>"));
    assert(layout.includes("noindex = false"));
    await writeFile(
      layoutPath,
      layout
        .replace("noindex = false", "noindex = true")
        .replace(
          '<div class="site-shell">',
          '<div class="site-shell"><aside class="preview-notice">プレビュー専用：仮の記事とタグです。公開サイトには含まれません。</aside>',
        ),
    );
  }
  const astroPackage = JSON.parse(
    await readFile(
      path.join(root, "node_modules", "astro", "package.json"),
      "utf8",
    ),
  );
  const build = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules", "astro", astroPackage.bin.astro),
      "build",
      "--root",
      fixture,
    ],
    {
      cwd: fixture,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
      encoding: "utf8",
    },
  );
  assert.equal(
    build.status,
    0,
    `Preview build failed:\n${build.stdout}\n${build.stderr}`,
  );
  return fixture;
}
