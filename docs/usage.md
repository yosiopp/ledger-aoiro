# コマンド使用方法

このドキュメントでは、ledger-aoiro の各種コマンドの使い方を説明します。

## ショートカットコマンド

Docker コマンドを毎回入力するのは手間なので、プラットフォーム別にショートカットコマンドを用意しています。

### Mac / Linux / WSL / Git Bash の場合

`Makefile` を使用します：

```bash
# ヘルプを表示
make help

# 貸借チェック
make check

# 勘定科目の検証
make validate

# 年次ディレクトリの初期化（現在の年）
make init-year

# 年次ディレクトリの初期化（年を指定）
make init-year YEAR=2027

# 月次集計（月を指定）
make monthly MONTH=2026-01

# 年次集計
make yearly

# CSV エクスポート
make export

# ledger CLI を直接実行
make ledger ARGS="-f ledger/accounts.ledger balance"

# コンテナ内のシェルに入る
make shell
```

### Windows (PowerShell) の場合

`ledger.ps1` スクリプトを使用します：

```powershell
# ヘルプを表示
.\ledger.ps1 help

# 貸借チェック
.\ledger.ps1 check

# 勘定科目の検証
.\ledger.ps1 validate

# 年次ディレクトリの初期化（現在の年）
.\ledger.ps1 init-year

# 年次ディレクトリの初期化（年を指定）
.\ledger.ps1 init-year 2027

# 月次集計（月を指定）
.\ledger.ps1 monthly 2026-01

# 年次集計
.\ledger.ps1 yearly

# CSV エクスポート
.\ledger.ps1 export

# ledger CLI を直接実行
.\ledger.ps1 ledger -f ledger/accounts.ledger balance

# コンテナ内のシェルに入る
.\ledger.ps1 shell
```

## 基本的な操作

### 1. 勘定科目の追加

**重要：** 新しい勘定科目を使いたい場合は、必ず最初に [ledger/accounts.ledger](../ledger/accounts.ledger) を編集してください。

```bash
# ledger/accounts.ledger に追加
account Expenses:NewCategory
```

スクリプトで未定義の勘定科目が使われていたらエラーになります。

**例：書籍費を追加する場合**

```ledger
; ledger/accounts.ledger に追加
account Expenses:Books
    note 業務関連の書籍購入費
```

### 2. 年次ディレクトリの作成

年度が変わったら、まず年次ディレクトリと12ヶ月分のファイルを一括作成します。

**Mac / Linux / WSL / Git Bash：**

```bash
# 現在の年度のディレクトリを作成
make init-year

# 特定の年度を指定
make init-year YEAR=2027
```

**Windows (PowerShell)：**

```powershell
# 現在の年度のディレクトリを作成
.\ledger.ps1 init-year

# 特定の年度を指定
.\ledger.ps1 init-year 2027
```

このコマンドで以下が自動的に作成されます：
- `ledger/YYYY/` ディレクトリ
- `01.ledger` から `12.ledger` までの12個のファイル（テンプレート適用済み）
- 既存のファイルは上書きされません（安全）

### 3. 月次取引の記帳

作成された月次ファイル（例：`ledger/2026/01.ledger`）に取引を記録します。

**取引の記帳例：**

```ledger
2026/01/15 * 事務用品購入
    Expenses:Supplies           3000 JPY
    Assets:Bank:Business

2026/01/20 * クライアントA 売上
    Assets:Bank:Business       100000 JPY
    Income:Sales

2026/01/25 * 自宅兼事務所の電気代（按分50%）
    Expenses:Utilities          5000 JPY
    Assets:Bank:Business
```

詳しい記帳方法は [workflow.md](workflow.md) を参照してください。

### 4. 集計の実行

#### ショートカットコマンドを使用（推奨）

**Mac / Linux / WSL / Git Bash：**

```bash
make monthly MONTH=2026-01  # 月次集計
make yearly                 # 年次集計
make check                  # 貸借チェック
make validate               # 勘定科目の検証
```

**Windows (PowerShell)：**

```powershell
.\ledger.ps1 monthly 2026-01  # 月次集計
.\ledger.ps1 yearly           # 年次集計
.\ledger.ps1 check            # 貸借チェック
.\ledger.ps1 validate         # 勘定科目の検証
```

### 5. 残高の確認

特定の勘定科目の残高を確認する：

```bash
# Mac / Linux / WSL / Git Bash
make ledger ARGS="balance Assets:Cash"

# Windows (PowerShell)
.\ledger.ps1 ledger balance Assets:Cash
```

### 6. 出納帳の表示

特定の勘定科目の取引履歴を表示：

```bash
# Mac / Linux / WSL / Git Bash
make ledger ARGS="register Assets:Bank:Business"

# Windows (PowerShell)
.\ledger.ps1 ledger register Assets:Bank:Business
```

## 直接 Docker コマンドを実行する場合

ショートカットを使わず、直接 Docker Compose コマンドを実行することもできます。

### 基本的なコマンド

```bash
# 貸借チェック
docker compose run --rm ledger node scripts/check-balance.mjs

# 勘定科目の検証
docker compose run --rm ledger node scripts/validate-accounts.mjs

# 月次集計（月を指定）
docker compose run --rm ledger node scripts/monthly-summary.mjs --month 2026-01

# 年次集計
docker compose run --rm ledger node scripts/yearly-summary.mjs

# CSV エクスポート
docker compose run --rm ledger node scripts/export-csv.mjs
```

### ledger CLI を直接実行

```bash
# 残高レポート
docker compose run --rm ledger ledger -f ledger/accounts.ledger balance

# 特定勘定科目の出納帳
docker compose run --rm ledger ledger \
  -f ledger/accounts.ledger \
  -f ledger/opening_balance.ledger \
  -f ledger/2026/01.ledger \
  register Assets:Bank:Business

# 複数ファイルを読み込んで残高表示
docker compose run --rm ledger ledger \
  -f ledger/accounts.ledger \
  -f ledger/opening_balance.ledger \
  -f ledger/2026/01.ledger \
  -f ledger/2026/02.ledger \
  balance
```

### コンテナ内のシェルに入る

```bash
docker compose run --rm ledger /bin/bash

# シェル内で ledger コマンドを自由に実行
ledger -f ledger/accounts.ledger balance
ledger -f ledger/accounts.ledger -f ledger/2026/01.ledger register
```

## よく使うコマンド例

### 月次の流れ

```bash
# 1. 取引を記帳（エディタで ledger/2026/01.ledger を編集）

# 2. 勘定科目の検証
make validate

# 3. 貸借チェック
make check

# 4. 月次集計の確認
make monthly MONTH=2026-01

# 5. Git にコミット
git add ledger/2026/01.ledger
git commit -m "2026-01: 取引を記帳"
git push
```

### 年次の流れ

```bash
# 1. 年間の集計を確認
make yearly

# 2. 決算処理（closing.ledger の編集）

# 3. 翌年度の期首残高設定（opening_balance.ledger の編集）

# 4. 確定申告の準備
make export  # CSV エクスポート
```

## トラブルシューティング

### コマンドが見つからない

**make コマンドが使えない場合（Windows）：**
- PowerShell スクリプト `ledger.ps1` を使用してください
- または直接 Docker コマンドを実行してください

**Docker が起動していない場合：**
```bash
# Docker のステータス確認
docker info

# Docker Desktop を起動してください（macOS/Windows）
# または Docker サービスを起動（Linux）
sudo systemctl start docker
```

### 権限エラー

**PowerShell でスクリプトが実行できない場合：**
```powershell
# 実行ポリシーを確認
Get-ExecutionPolicy

# 必要に応じて実行ポリシーを変更（管理者権限が必要）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 関連ドキュメント

- [workflow.md](workflow.md) - 日常的な記帳フロー
- [setup.md](setup.md) - 初期セットアップ
- [accounts.md](accounts.md) - 勘定科目の詳細
- [structure.md](structure.md) - ディレクトリ構成の詳細
