# プロジェクト構成とサイト管理ルール

このリポジトリ（`DB-WEB`）では、ディレクトリ単位で各Webサイトを管理しています。
公開形態はサイトによって異なり、GitHub Pages、Cloudflare連携、独自ドメイン（Xサーバー公開）など複数存在します。

---

## 独自ドメインサイト（Xサーバー公開対象）の運用ルール

### 1. フォルダ命名規則と配置
- **フォルダ名**: `[3桁番号]-[ドメイン名（ドットをハイフンに置換）]`
  - 例: `005-spn90-com`（対象ドメイン: `spn90.com`）
- **ファイル構成**:
  - サイトフォルダ直下に `index.html` を配置する。
  - フォルダ配下の構成（HTML、画像、CSS、JS等）がそのままサーバーの公開ディレクトリ（`~/ドメイン名/public_html/`）へアップロードされる前提で構築する。

---

## デプロイのルール（Xサーバー）

- Xサーバーへの公開は、必ず `D:\GitHub\DB-WEB\deploy.ps1` を使う
- 実行コマンド:
  ```powershell
  powershell -ExecutionPolicy Bypass -File D:\GitHub\DB-WEB\deploy.ps1 -Site フォルダ名 -Domain ドメイン名
  ```
  - 例: `powershell -ExecutionPolicy Bypass -File D:\GitHub\DB-WEB\deploy.ps1 -Site 005-spn90-com -Domain spn90.com`
- `scp` や `ssh` を自分で組み立てない。必ず `deploy.ps1` だけを使う
- 秘密鍵 `D:\ssh\mjflash.key` は、読まない・表示しない・コピーしない

### デプロイ仕様
- 指定したサイトフォルダ配下の全ファイルおよびサブフォルダを転送する
- ただし、以下の管理ファイル・フォルダは除外され転送されない:
  - `README.md`
  - `CLAUDE.md`
  - `AGENTS.md`
  - `.git`
  - `.gitignore`

### 公開先・ドメイン対応表
- `005-spn90-com` → `spn90.com`
