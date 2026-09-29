param(
  [Parameter(Mandatory=$true)][string]$Site,
  [Parameter(Mandatory=$true)][string]$Domain
)

$src = Join-Path $PSScriptRoot $Site
if (-not (Test-Path -LiteralPath $src)) {
  Write-Error "Site folder not found: $src"
  exit 1
}

# 除外対象ファイルおよびフォルダ
$excludeNames = @('README.md', 'CLAUDE.md', 'AGENTS.md', '.git', '.gitignore')

# 一時作業フォルダを作成
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("deploy_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
  Get-ChildItem -LiteralPath $src -Recurse -Force | ForEach-Object {
    $item = $_
    $relPath = $item.FullName.Substring($src.Length).TrimStart('\', '/')
    $parts = $relPath.Split([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)

    $shouldExclude = $false
    foreach ($part in $parts) {
      foreach ($ex in $excludeNames) {
        if ($part -ieq $ex) {
          $shouldExclude = $true
          break
        }
      }
      if ($shouldExclude) { break }
    }

    if (-not $shouldExclude) {
      $destPath = Join-Path $tempDir $relPath
      if ($item.PSIsContainer) {
        if (-not (Test-Path -LiteralPath $destPath)) {
          New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
      } else {
        $destParent = Split-Path -Parent $destPath
        if (-not (Test-Path -LiteralPath $destParent)) {
          New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item -LiteralPath $item.FullName -Destination $destPath -Force
      }
    }
  }

  $itemsToUpload = Get-ChildItem -LiteralPath $tempDir
  if ($itemsToUpload.Count -eq 0) {
    Write-Warning "転送対象のファイルがありません: $src"
    exit 0
  }

  $uploadPaths = @($itemsToUpload | ForEach-Object { $_.FullName })
  scp -i D:\ssh\mjflash.key -P 10022 -r $uploadPaths "mjflash@sv810.xserver.jp:~/$Domain/public_html/"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "scp failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
  }
}
finally {
  if (Test-Path -LiteralPath $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
