# Kei's Pinboard

Webツールと外部記事を共通カード一覧に置く静的ポータル。Markdown記事の基盤も保持する。Astro・TypeScript・素のCSS・Bunを使用し、表札は `@1m_lcei`、ローカル名は `kei-pinboard`。

リポジトリは [1m-lcei/1m-lcei.github.io](https://github.com/1m-lcei/1m-lcei.github.io)、公開先は [https://1m-lcei.github.io/](https://1m-lcei.github.io/)（base `/`）。

## 開発・検証

Bun・依存は `package.json` / `bun.lock` に合わせる。TypeScriptは `@astrojs/check` のpeer条件に対応する6系を維持する。

```sh
bun install --frozen-lockfile
bun run dev          # http://127.0.0.1:4321/
bun run verify       # 型・Biome・ビルド・ブラウザ/HTML検証
bun run preview      # ビルドしたdistを確認
bun run demo         # 4322: 隔離した仮記事のプレビュー
bun run social-image # 構図を変更したときにOGPを再生成
```

`verify` はWindowsでEdge/Firefox、LinuxでChromium/Firefoxを使い、仮記事は隔離コピーで検証する。ビルド後は `bun run test firefox` または `bun run test msedge chromium firefox` で指定できる。結果・画像は `.cache/qa/<ブラウザ>/`。Playwrightブラウザがない場合だけ `bun node_modules/playwright/cli.js install chromium firefox` で取得する。

## 編集

| 場所 | 用途 |
| --- | --- |
| `src/data/works.ts` | 名前・説明・任意の注記 `note`・リンク・タグ・公開日時と出典・画像範囲 |
| `src/styles/global.css` / `src/layouts/SiteLayout.astro` | 見た目・共通表示・メタデータ |
| `src/lib/site.ts` / `astro.config.mjs` | サイト名・説明・公開先・base |
| `src/content/posts/` / `templates/article.md` | Markdown記事とひな形 |
| `public/tools/` / `public/articles/` / `src/assets/textures/` | アイコン・PNG/AVIF・紙とコルク（出典は `assets/`） |
| `assets/social-preview/board.html` / `public/og/works-board.png` | OGP構図と1200×630の共有画像 |

作品は公開日時の新しい順を初期表示し、古い順への切替と単一タグ絞込を併用できる。同時刻は定義順、不明日時は末尾。注記は説明文の下に表示する。[公開日時の出典](assets/publication-sources.md)を参照。

記事は `title`・`description`・`date` が必須、`tags` は任意。公開するものだけ `draft: false` にし、`/articles/` に掲載する。下書きと仮記事は本番に含めない。

OGPは実画面3枚の作品ボードで、サイト名やコピーを画像に入れない。共有画像をOGPに指定し、Xは `summary_large_image` を使う。404と仮記事プレビューは `noindex` とし、canonicalと共有画像を付けない。

## CI/CD

`.github/workflows/pages.yml` はPRと `main` pushで固定依存・型・Biome・ビルド・Chromium/Firefox検証を実行する。PRは検証のみ、`main` は成功した同じ `dist/` を公開する。検証用コピー・画像・ソースは公開しない。

`origin` は `https://github.com/1m-lcei/1m-lcei.github.io.git`。PagesのSourceは **GitHub Actions**、`github-pages` 環境にブランチ制限がある場合は `main` を許可する。旧 `/kei-pinboard/` への互換ページは置かない。

公開操作には対象作業への明示的な許可が必要。push後は同一コミットのCI成功と公開HTML・画像・リンクを確認する。[GitHub Pages公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)を参照。
