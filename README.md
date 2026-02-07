# ledger-aoiro

[ledger CLI](https://github.com/ledger/ledger) を使って青色申告するためのテンプレート。

## このリポジトリについて

このリポジトリは**テンプレート**です。以下の流れで使用します：

1. **このテンプレートをクローン**して自分のリポジトリとして初期化
2. **あなた自身のプライベートリポジトリ**で帳簿を管理
3. **日々の取引を記帳**し、月次・年次の集計を行う
4. **年度ごとに継続**して使用

**重要：** 帳簿データには個人情報が含まれるため、必ず**プライベートリポジトリ**として管理してください。

## 特徴

- 複式簿記による記帳（青色申告65万円控除対応）
- Docker環境で ledger CLI を簡単に使える
- 勘定科目の定義を一元管理
- 未定義の勘定科目の使用を検証スクリプトでチェック
- 月次・年次の集計を自動生成
- **テンプレートとして利用**：このリポジトリをベースに自分専用の帳簿リポジトリを作成
- **ledgerとmemoの責務分担**：会計の事実（ledger）と判断の理由（memo）を分離管理

### 設計思想：なぜledgerとmemoを分けるのか

このプロジェクトの重要な設計思想：

- **ledger = 「会計の事実」** - 取引の客観的な記録
- **memo = 「判断の理由」** - なぜその勘定科目を選んだか、按分比率の根拠など
- **税務 = 結果＋理由のセット** - 税務調査では両方が必要

**例：** 自宅兼事務所の電気代を50%按分した場合
- **ledgerファイル** → 「5000円を経費計上した」という事実
- **memoファイル** → 「なぜ50%なのか（面積比の計算根拠）」を記録

この分離により、将来の税務調査や自分自身の振り返りで「なぜこう判断したのか」を説明できます。

## ディレクトリ構成

```
ledger-aoiro/
├── ledger/              # 帳簿ファイル
│   ├── accounts.ledger  # 勘定科目定義（必ず最初に編集）
│   ├── opening_balance.ledger  # 期首残高
│   ├── closing.ledger   # 期末整理仕訳
│   └── 2026/            # 年別ディレクトリ
│       ├── 01.ledger    # 1月の取引
│       ├── 02.ledger    # 2月の取引
│       └── ...          # 各月の取引ファイル
├── scripts/             # Node.jsスクリプト
│   ├── check-balance.mjs       # 貸借一致チェック
│   ├── validate-accounts.mjs   # 勘定科目検証
│   ├── monthly-summary.mjs     # 月次集計
│   ├── yearly-summary.mjs      # 年次集計
│   └── export-csv.mjs          # CSV出力
├── templates/           # テンプレート
├── docs/               # ドキュメント
└── docker-compose.yml  # Docker設定
```

## セットアップ

### 方法1：GitHub テンプレート機能を使う（推奨）

1. このリポジトリの [GitHub ページ](https://github.com/yosiopp/ledger-aoiro) で **「Use this template」** ボタンをクリック
2. 新しいリポジトリ名を入力（例：`my-ledger`）
3. **「Private」を選択**（帳簿データなので必須）
4. 作成されたリポジトリをクローン

```bash
git clone https://github.com/YOUR_USERNAME/my-ledger.git
cd my-ledger
docker compose build
```

### 方法2：ZIP をダウンロード

```bash
# 1. GitHubから「Code」→「Download ZIP」でダウンロード
# 2. 解凍して任意の場所に配置
cd my-ledger

# 3. Gitリポジトリとして初期化
git init
git add .
git commit -m "Initial commit from ledger-aoiro template"

# 4. プライベートリポジトリにプッシュ（GitHubなどで作成後）
git remote add origin https://github.com/YOUR_USERNAME/my-ledger.git
git push -u origin main

# 5. Dockerイメージをビルド
docker compose build
```

詳しいセットアップ手順は [docs/setup.md](docs/setup.md) を参照してください。

## ショートカットコマンド

Docker コマンドを毎回入力するのは手間なので、ショートカットコマンドを用意しています。

### Mac / Linux / WSL / Git Bash の場合

`Makefile` を使用します：

```bash
# ヘルプを表示
make help

# 貸借チェック
make check

# 勘定科目の検証
make validate

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

## 基本的な使い方

### 1. 勘定科目の追加

**重要：** 新しい勘定科目を使いたい場合は、必ず最初に `ledger/accounts.ledger` を編集してください。

```bash
# ledger/accounts.ledger に追加
account Expenses:NewCategory
```

スクリプトで未定義の勘定科目が使われていたらエラーになります。

### 2. 月次取引の記帳

年別ディレクトリ `ledger/2026/` を作成し、その下に月次ファイル `01.ledger` を作成して取引を記録：

```bash
# ディレクトリ作成
mkdir -p ledger/2026

# 月次ファイル作成
# ledger/2026/01.ledger
```

```ledger
2026/01/15 * 事務用品購入
    Expenses:Supplies           3000 JPY
    Assets:Bank:Business
```

### 3. 集計の実行

ショートカットコマンドを使用（推奨）：

```bash
# Mac / Linux / WSL / Git Bash
make monthly MONTH=2026-01  # 月次集計
make yearly                 # 年次集計
make check                  # 貸借チェック

# Windows (PowerShell)
.\ledger.ps1 monthly 2026-01  # 月次集計
.\ledger.ps1 yearly           # 年次集計
.\ledger.ps1 check            # 貸借チェック
```

または、直接 Docker コマンドを実行：

```bash
# 月次集計
docker compose run --rm ledger node scripts/monthly-summary.mjs --month 2026-01

# 年次集計
docker compose run --rm ledger node scripts/yearly-summary.mjs

# 貸借チェック
docker compose run --rm ledger node scripts/check-balance.mjs
```

## 年度切替

年度をまたぐときの処理：

- **利益** → `Equity:RetainedEarnings`
- **残高** → `Equity:OpeningBalances`

旧年度の仕訳は `closing.ledger`、新年度の仕訳は `opening_balance.ledger` に記載します。

## 直接 Docker コマンドを実行する場合

ショートカットを使わず、直接 Docker コマンドを実行することもできます：

```bash
# 貸借チェック
docker compose run --rm ledger node scripts/check-balance.mjs

# 勘定科目の検証
docker compose run --rm ledger node scripts/validate-accounts.mjs

# 月次集計
docker compose run --rm ledger node scripts/monthly-summary.mjs --month 2026-01

# 年次集計
docker compose run --rm ledger node scripts/yearly-summary.mjs

# CSV エクスポート
docker compose run --rm ledger node scripts/export-csv.mjs

# ledger CLI を直接実行
docker compose run --rm ledger ledger -f ledger/accounts.ledger balance
```

## 開発・テスト（オプション）

このテンプレートには開発用のテストコードが含まれています。**テンプレート利用者は不要であれば削除可能**です。

```bash
# テストの実行（開発者向け）
npm install  # 初回のみ（vitest をインストール）
npm test     # テスト実行
npm run test:watch      # ウォッチモード
npm run test:coverage   # カバレッジレポート生成
```

### テンプレート利用時の削除対象（オプション）

帳簿管理のみを行う場合、以下のファイルは削除しても問題ありません：

- `scripts/lib/__tests__/` - テストファイル
- `vitest.config.mjs` - テスト設定
- `package.json` の `devDependencies` セクション
- `package.json` の `test` 関連スクリプト

## ドキュメント

- **[セットアップガイド](docs/setup.md)** - テンプレートの初期設定と使い始め方
- [勘定科目と青色申告決算書の対応](docs/accounts.md)
- [ワークフロー](docs/workflow.md) - 日常的な記帳フロー
- [開発ガイド（Claude Code用）](CLAUDE.md)

## ライセンス

ISC