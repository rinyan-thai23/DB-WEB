# デプロイのルール

- Xサーバーへの公開は、必ず D:\GitHub\DB-WEB\deploy.ps1 を使う
- 実行コマンド:
  powershell -ExecutionPolicy Bypass -File D:\GitHub\DB-WEB\deploy.ps1 -Site フォルダ名 -Domain ドメイン名
- 例: -Site 005-spn90-com -Domain spn90.com
- scp や ssh を自分で組み立てない。deploy.ps1 だけを使う
- 秘密鍵 D:\ssh\mjflash.key は、読まない・表示しない・コピーしない

## デプロイ仕様
- 指定したサイトフォルダ配下の全ファイルおよびサブフォルダを転送する
- ただし、以下の管理ファイル・フォルダは除外され転送されない:
  - README.md
  - CLAUDE.md
  - AGENTS.md
  - .git
  - .gitignore

## 公開先の対応表
- 005-spn90-com → spn90.com
