# Kei's Pinboard

4つのWebツールと2つの外部記事を同じカード一覧に置く静的ポータル。Markdown記事の基盤も保持する。Astro・TypeScript・素のCSS・Bunを使用する。表札は `@1m_lcei`、プロジェクト名とbaseは `kei-pinboard`。予定公開URLは `https://1m-lcei.github.io/kei-pinboard/`。

## 開発・検証

Bunは `package.json` の1.4.2、依存は `bun.lock` に固定する。

```sh
bun install --frozen-lockfile
bun run dev       # http://127.0.0.1:4321/kei-pinboard/
bun run verify    # 型・Biome・本番ビルド・ブラウザ/HTML検証
bun run preview   # ビルドしたdistを確認
bun run demo      # 4322: 隔離した仮記事のプレビュー
```

`verify` はWindowsでEdgeとFirefox、LinuxでChromiumとFirefoxを使う。本番ビルドと隔離した検証用HTMLを各ブラウザで再利用する。ビルド後に `bun run test firefox` または `bun run test msedge chromium firefox` でブラウザを指定できる。結果・画像は `.cache/qa/<ブラウザ>/`。共有Playwrightブラウザがない場合だけ `bun node_modules/playwright/cli.js install chromium firefox` で取得する。OSの環境設定は変更しない。

TypeScriptは6.0.3を保持する。正式な `typescript` 7.0.2は存在するが、最新の [`@astrojs/check` 0.9.10](https://github.com/withastro/astro/blob/main/packages/language-tools/astro-check/package.json) のpeer条件は5または6で、7への更新はその対応後に行う。

## 編集する場所

| 場所 | 用途 |
| --- | --- |
| `src/data/works.ts` | 成果物の名前・文面・公開日時と出典・リンク・タグ・画像の表示範囲 |
| `src/styles/global.css` | 配色・フォント・レイアウト |
| `src/layouts/SiteLayout.astro` | 共通表示とHTMLメタデータ |
| `src/lib/site.ts` / `astro.config.mjs` | サイト名・説明・公開先・base |
| `src/content/posts/` / `templates/article.md` | 記事とひな形 |
| `public/tools/` / `public/tools/screenshots/` | ツールアイコン・PNG/AVIF（外部記事は `public/articles/`） |
| `src/assets/textures/` / `assets/` | 紙・コルクの素材と出典 |
| `scripts/` | ブラウザ検証と隔離プレビュー |

成果物は確認済みの公開日時の新しい順で初期表示し、一覧上のテープ留め紙札で古い順と切り替えられる。同時刻は定義順、不明日時は `null` として末尾を保つ。タグで絞り込んだ状態でも順を切り替えられ、解除後も選んだ順序を保つ。DOM順も表示と一致し、キーボードや読み上げはその順に従う。並び順は永続保存しない。根拠・精度と確認待ちは [公開日時の記録](assets/publication-sources.md) を参照。

タグ絞込・解除と並び順切替の際に、ピンを固定したまま紙だけが小さく揺れて約0.6秒で収まる。初期表示では動かさず、連続操作は最後の状態に集約する。動きを減らす設定では再生しない。CSS keyframesと既存の少量JSだけで実装し、新しい依存は追加していない。

記事の必須項目は `title`、`description`、`date`。公開するものだけ `draft: false` にし、`tags` は任意。下書きと仮記事は本番に含めない。記事は `/kei-pinboard/articles/` に並び、トップはツールと外部記事を同じ一覧に表示する。既存4ツールのリポジトリは変更しない。

メタデータはページ別title/description・canonical・OGP・画像なしのX summary。記事は `article` と公開日、404と仮記事プレビューは `noindex` とし、公開URLのcanonicalを付けない。OGP画像は用意しない。

## CI/CD

`.github/workflows/pages.yml` はPRと `main` pushで固定依存のインストール、型/整形/lint、ビルド、Chromium・Firefox検証を行う。PRは検証のみ。`main` pushの検証成功後だけ、同じ `dist/` をPages artifactとして公開する。検証用のコピー・画像・ソースは公開しない。

GitHub側で必要な設定（本作業では未実施）:

1. `1m-lcei/kei-pinboard` の `main` に本設定を置く。
2. **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする。
3. `github-pages` 環境でブランチ制限を設定する場合は `main` を許可する。

リポジトリ作成・設定変更・commit・push・初回公開は別途行う。[GitHub Pages公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)を参照。CI実行と公開URLでの確認は初回push後に行う。
