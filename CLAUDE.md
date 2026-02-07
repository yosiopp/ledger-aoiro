# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

[hledger](https://hledger.org/) を使った青色申告（個人事業主向け）の**テンプレートプロジェクト**です。複式簿記による記帳で65万円控除を目指します。

**重要：** このプロジェクトはテンプレートです。利用者はGitHub の "Use this template" 機能や ZIP ダウンロードでテンプレートを取得し、自分専用のプライベートリポジトリで帳簿を管理します。

## アーキテクチャ

### 設計思想：hledgerとmemoの責務分担

このプロジェクトは、会計記録と判断根拠を明確に分離する設計を採用しています：

- **hledger = 「会計の事実」** - 客観的な取引の記録（What happened）
- **memo = 「判断の理由」** - なぜそのように記帳したかの根拠（Why we recorded it this way）
- **税務 = 結果＋理由のセット** - 税務調査では両方が重要

**なぜこの分離が重要か：**

1. **監査証跡の完全性** - hledgerファイルは機械可読な形式で客観的事実を記録し、memoファイルは人間可読な形式で判断の背景を記録
2. **説明責任** - 将来の自分や税理士、税務署に対して「なぜこの勘定科目を選んだのか」「なぜこの金額で按分したのか」を説明できる
3. **再現可能性** - 年度をまたいでも同じ判断基準を適用できるよう、判断ロジックを文書化

**実践例：**

```ledger
; ledger/2026/01.ledger（会計の事実）
2026/01/15 * 自宅兼事務所の電気代
    Expenses:Utilities              5000 JPY  ; 事業按分50%
    Assets:Bank:Business
```

```
# memo/2026-01/receipt-001.md（判断の理由）
- 按分比率50%の根拠：自宅総面積100㎡のうち事務所専用スペース50㎡
- 参考：国税庁タックスアンサーNo.1805「家事関連費」
```

### hledgerファイル構成

モジュール化されたhledgerファイル構成を採用しています：

- **[ledger/accounts.ledger](ledger/accounts.ledger)** - 勘定科目の正規定義ファイル。すべての有効な勘定科目の権威ソース。新しい勘定科目を使う前に必ずここに定義する必要があります。
- **ledger/YYYY/opening.ledger** - 年度ごとの期首残高（例：ledger/2026/opening.ledger）
- **ledger/YYYY/closing.ledger** - 年度ごとの期末整理仕訳（例：ledger/2026/closing.ledger）
- **ledger/YYYY/MM.ledger** - 年別ディレクトリの下に月次の取引ファイルを配置（例：ledger/2026/01.ledger）

**ファイル配置の規則：**
- 年ごとにディレクトリを作成（例：`ledger/2026/`）
- 各月のファイルは `MM.ledger` 形式（例：`01.ledger`, `02.ledger`）
- この階層構造により、長期間の帳簿管理が整理しやすくなります

### 勘定科目の階層構造

青色申告決算書に対応した標準的な会計構造：

- **Assets**（資産） - 現金、銀行預金、売掛金、前払費用、備品
- **Liabilities**（負債） - 買掛金、クレジットカード、借入金
- **Equity**（純資産） - 事業主借入・事業主貸、期首残高、繰越利益
- **Income**（収益） - 売上、雑収入
- **Expenses**（費用） - 事業経費（広告宣伝費、消耗品費、通信費、水道光熱費、地代家賃、旅費交通費、会議費、外注費、租税公課、減価償却費）

青色申告決算書とhledger勘定科目の対応表は [docs/accounts.md](docs/accounts.md) を参照してください。

### スクリプト構成

Node.js スクリプト（ES modules）がhledgerコマンドをラップして各種処理を実行します：

- **scripts/validate-accounts.mjs** - 使用されている勘定科目がすべてaccounts.ledgerで定義されているか検証（未定義の勘定科目があればエラー）
- **scripts/check-balance.mjs** - 貸借一致チェック
- **scripts/init-year.mjs** - 年次ディレクトリと12ヶ月分の月次ファイルを一括作成
- **scripts/monthly-summary.mjs** - 月次集計の生成
- **scripts/yearly-summary.mjs** - 年次集計の生成
- **scripts/export-csv.mjs** - CSV形式でのエクスポート

スクリプトはchild_processでhledgerコマンドを実行し、出力をパースします。

## 開発コマンド

### ショートカットコマンド（推奨）

**Mac / Linux / WSL / Git Bash:**

```bash
# Makefile を使用
make check                  # 貸借チェック
make validate              # 勘定科目の検証
make monthly MONTH=2026-01 # 月次集計
make yearly                # 年次集計
make export                # CSV エクスポート
make shell                 # コンテナ内のシェルに入る
make help                  # ヘルプを表示
```

**Windows (PowerShell):**

```powershell
# PowerShell スクリプトを使用
.\ledger.ps1 check         # 貸借チェック
.\ledger.ps1 validate      # 勘定科目の検証
.\ledger.ps1 monthly 2026-01 # 月次集計
.\ledger.ps1 yearly        # 年次集計
.\ledger.ps1 export        # CSV エクスポート
.\ledger.ps1 shell         # コンテナ内のシェルに入る
.\ledger.ps1 help          # ヘルプを表示
```

### 直接 Docker コマンドを実行

ショートカットを使わない場合は、直接 Docker コマンドを実行できます：

```bash
# 特定月の月次集計を実行
docker compose run --rm ledger node scripts/monthly-summary.mjs --month 2026-01

# 年次集計を実行
docker compose run --rm ledger node scripts/yearly-summary.mjs

# 貸借チェックを実行
docker compose run --rm ledger node scripts/check-balance.mjs

# 勘定科目の検証
docker compose run --rm ledger node scripts/validate-accounts.mjs
```

## 重要なワークフロールール

### 新しい勘定科目の追加

**取引ファイルで新しい勘定科目を使う前に、必ず [ledger/accounts.ledger](ledger/accounts.ledger) を先に編集してください。** 検証スクリプトが未定義の勘定科目を検出してエラーにします。

### 年度切替（期末処理）

年度をまたぐときの処理：

1. 利益を繰越利益に振替：
   ```
   利益 → Equity:RetainedEarnings
   ```

2. 残高を期首残高に振替：
   ```
   残高 → Equity:OpeningBalances
   ```

旧年度の仕訳は `ledger/YYYY/closing.ledger` に、新年度の仕訳は `ledger/YYYY/opening.ledger` に記載します（例：2026年度なら `ledger/2026/closing.ledger` と `ledger/2027/opening.ledger`）。

## ファイル構成

- 月次の取引ファイルは年別ディレクトリ `ledger/YYYY/` の下に `MM.ledger` という命名規則で配置
  - 例：`ledger/2026/01.ledger`, `ledger/2026/02.ledger`
- 一貫したフォーマットのため templates/ ディレクトリのテンプレートを使用
- すべてのスクリプトはES modules形式（package.jsonで "type": "module"）

## hledger との連携

スクリプトはDockerコンテナ内のhledgerツールと連携します。よく使うhledgerコマンド：

```bash
# 残高レポート
hledger -f ledger/accounts.ledger balance

# 特定勘定科目の出納帳
hledger -f ledger/accounts.ledger register Assets:Bank

# 複数ファイルの読み込み
hledger -f ledger/accounts.ledger -f ledger/2026-01.ledger balance

# 対話的に仕訳を追加（hledger 独自機能）
hledger add -f ledger/accounts.ledger -f ledger/2026/01.ledger

# ブラウザで帳簿を閲覧（hledger-web）
hledger-web -f ledger/accounts.ledger --serve
```

### 便利なショートカットコマンド

Makefileで以下のコマンドが利用可能です：

```bash
# 対話的に仕訳を追加
make add MONTH=2026-01

# ブラウザで帳簿を閲覧（http://localhost:5000）
make web
```
