# Cloudflare Pages 公開設定

このアプリは「Workers & Pages」の **Pages** として公開します。

リポジトリ内の構成:

```text
DB-WEB/
├── 002.消費カロリー/
│   ├── package.json
│   ├── data/
│   ├── locales/
│   ├── scripts/
│   └── dist/       # Cloudflareでビルド時に生成
└── その他のサイト/
```

## ダッシュボード設定

Gitリポジトリを接続して、次の値を指定します。

| 項目 | 値 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `002.消費カロリー` |
| Build command | `npm run build && npm test` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |
| 本番の Environment variable | `SITE_URL` = `https://<プロジェクト名>.pages.dev` または独自ドメイン |

- `dist` は Root directory からの相対パスです。`002.消費カロリー/dist` と二重指定しません。
- Root directory の区切りはドット `.` です（`002-消費カロリー` ではありません）。
- 公開URLのパスにディレクトリ名は入りません。トップは `/ja/`、`/en/`、`/th/` になります。
- Workers用のDeploy commandやWorkerコードは不要です。
- 他のサイトの変更でビルドしたくない場合、Build watch pathsのIncludeを `002.消費カロリー/**` に設定します（リポジトリルート基準）。
- 本番ブランチをmain以外にする場合、`PRODUCTION_BRANCH` もそのブランチ名に設定します。

## URL・SEO

本番Pagesビルドは `SITE_URL` 未設定ならエラーで停止します。localhostのcanonicalのまま本番公開するのを防ぐためです。`SITE_URL` は末尾パスなしのHTTPS URLです。

Previewブランチではnoindexとrobots Disallowを出力します。`SITE_URL` が設定されていてもPreviewは検索対象にしません。未設定のPreviewではCloudflareの `CF_PAGES_URL` を参照します。

ローカルは `npm run build` → `npm start` → http://localhost:4173/ja/。

## 現在の未接続項目

ローカルのディレクトリ改名とビルド準備は完了しています。GitHubリポジトリURLとPagesプロジェクトは未確定です。Cloudflareダッシュボードはログインが必要な状態です。リモートへのpush、Pages作成、実公開はまだ実施していません。

## 公式ドキュメント

- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/configuration/monorepos/
- https://developers.cloudflare.com/pages/configuration/build-watch-paths/
