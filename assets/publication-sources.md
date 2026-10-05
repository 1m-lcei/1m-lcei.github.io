# 成果物の公開日時

2026-10-04に公式の公開ページとGitHub APIを読み取り確認した。各ツールの `github-pages` deploymentはページネーションを含め全件確認し、最初の記録に対応する成功時刻を採用した。リポジトリ作成日時・初コミット日時・最終更新日時は代用していない。確認できた初回Pages公開の記録を示すもので、別サービスや別URLでの過去の公開があった場合は本人の情報で補正する。

| 成果物 | publishedAt | 精度と根拠 |
| --- | --- | --- |
| kuto-measure | `2026-09-26T11:06:47Z` | UTC・秒。[初回Pages deployment成功ステータス](https://api.github.com/repos/1m-lcei/kuto-measure/deployments/6678046805/statuses)の `created_at` |
| image-rect-picker | `2026-09-23T15:05:57Z` | UTC・秒。[初回Pages deployment成功ステータス](https://api.github.com/repos/1m-lcei/image-rect-picker/deployments/6617276739/statuses)の `created_at` |
| kuto-nanidasu | `2025-10-10T10:39:51Z` | UTC・秒。最初のdeploymentは現在inactiveのみが残るため、同じSHAの[初回Pages deployジョブ](https://github.com/1m-lcei/kuto-nanidasu/actions/runs/18404077506/job/52439846694)の成功と `completed_at` で確認 |
| kuto-ladder | `2025-10-02T11:26:07Z` | UTC・秒。同じく、最初のdeploymentと同じSHAの[初回Pages deployジョブ](https://github.com/1m-lcei/kuto-ladder/actions/runs/18191601970/job/51787718394)の成功と `completed_at` で確認 |
| ブルーアーカイブ ダメージ計算の仕組み | `2025-05-11T19:14:04.139+09:00` | JST・ミリ秒。[Zennの元ページ](https://zenn.dev/1m_lcei/books/b380b976c908d9)の `book.publishedAt`。画面の公開日は2025/05/11 |
| 戦術対抗戦トーク 用語・概念集 | `2024-11-09T09:33:49Z` | UTC・秒。[公式Gist API](https://api.github.com/gists/651ba5bca28fe41011424302b476c770)の作成日時を、2026-10-04のユーザー承認により公開日時として採用（JST 18:33:49）。初期の公開・非公開状態や切り替え履歴まで独立に確認できたとは主張しない |

`publishedAt` はタイムゾーンを含むISO 8601文字列、または明示的な `null`。`publicationSource` は根拠URL、精度、根拠の種別を記録する。並び替えは時刻として比較し、等しい時刻と不明日時同士は入力順を保つ。入力データを変更しない。初期表示は新しい順で、紙札から古い順へ切り替えられる。タグ絞込と併用し、解除後も選んだ順を保つ。記事2件だけカード左下にAsia/Tokyoで生成した公開年月日を表示し、`time` の `datetime` には元の正確な日時を保持する。ツール4件と更新日時は今回の表示対象に含めない。
