# metdays — MET消費カロリー計算

`002.消費カロリー/` 内で完結する静的サイトです。Node.js 20以上。外部npm依存はありません。

## 起動

```powershell
cd D:\GitHub\DB-WEB\002.消費カロリー
npm run build
npm start
```

http://localhost:4173/ja/ を開きます。生成物は `dist/`。開発サーバーはローカル専用、ソース変更後は再ビルドしてブラウザを再読み込みしてください。

## 実装済み

- 20活動・6カテゴリー、日本語／英語／タイ語。84ページを自動生成。
- 体重と時間による即時計算、時間プリセット、不正入力の検証。
- 時間別・体重別早見表、他活動の比較バー、食品の代表例との比較。
- 任意の目標カロリーから必要時間を逆算、体脂肪1kgのエネルギー参考換算。
- 活動名・説明・カテゴリーの検索、カテゴリー絞り込み、関連活動。
- ページを保った言語切替、canonical、相互hreflang、OGP、sitemap、robots、404。
- レスポンシブ表示、キーボード操作、入力ラベル、計算結果のライブ通知。

## データと拡張

- `data/activities.json`: 活動ID・slug・カテゴリー・MET・公式コード・出典URL・版・確認日。
- `data/categories.json`: カテゴリーIDとアイコン。
- `data/foods.json`: 食品の例示エネルギー。栄養成分データベース由来の厳密値ではありません。
- `locales/*.json`: UI・カテゴリー・活動名と説明・食品名。既存localeをコピーして翻訳し、`lang`を設定すればプログラム変更なしで追加できます。
- `templates/base.html`: 共通HTML外枠。ページ構成は `scripts/build.js`。
- `src/calculator.js`: 共通計算式。活動ごとの数値はHTMLに手入力しません。

METは [2024 Adult Compendium](https://pacompendium.com/adult-compendium/) の公式カテゴリー表を2026-09-22に確認しています。掃除機（05043）は2024年版の3.0 METを採用し、仕様書の例示3.3 METと区別しています。速度別URLは生成せず、活動ページに採用条件を記載しています。初期版では活動ごとに代表的な条件を1つ採用しています。

式は `MET × 3.5 × kg ÷ 200 × 分`。安静時を含む総エネルギーの推定値です。結果は四捨五入、逆算時間は分単位で切り上げます。7,700 kcalは体脂肪1kgのエネルギー量を考えるための参考仮定で、減量予測や連続運動の推奨ではありません。

## 確認

```powershell
npm run validate
npm run build
npm test
```

計算の既知値・逆算・境界値、生成ページの内部リンク・言語間リンク・SEOメタデータ・sitemapを検証します。

## GitHub / Cloudflare Pages

現在の親フォルダーはGitリポジトリではなく、リモートURLとCloudflareプロジェクトも未指定です。公開・push・アカウント連携は実施していません。

1. この `002.消費カロリー/` の内容をGitHubリポジトリに登録する（本番ブランチ `main`）。
2. Cloudflare PagesでそのリポジトリとGit連携する。
3. Framework preset: None、Build command: `npm run build && npm test`、Build output directory: `dist`、Node.js: 22。
4. 親リポジトリに `002.消費カロリー/` を含める構成なら Root directory: `002.消費カロリー`。このフォルダー単体をリポジトリにするならルート指定は不要。
5. 本番環境に `SITE_URL=https://実際の独自ドメイン` を設定する。ローカル確認中は未指定にする。
6. 本番 `main` のpushで自動公開。他のブランチはPreview deploymentを使用する。

ローカルで `SITE_URL` 未指定時はlocalhostのcanonicalとnoindexを生成します。Pages本番では `SITE_URL` 必須です。Previewは常にnoindexになります。詳しい設定は [DEPLOY.md](DEPLOY.md) を参照してください。

公式手順: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ および https://developers.cloudflare.com/pages/configuration/git-integration/

Google Fontsを利用します。取得できない場合は端末フォントにフォールバックし、計算と検索はそのまま動きます。体重などの入力値をサーバーへ送信する処理はありません。


