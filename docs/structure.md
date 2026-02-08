# ディレクトリ構成

このドキュメントでは、ledger-aoiro プロジェクトのディレクトリ構成とファイルの役割を詳しく説明します。

## プロジェクト全体の構成

```
ledger-aoiro/
├── ledger/                         # 帳簿ファイル（会計データ）
│   ├── accounts.ledger            # 勘定科目定義
│   └── 2026/                      # 年別ディレクトリ
│       ├── opening.ledger         # 2026年度 期首残高
│       ├── closing.ledger         # 2026年度 期末整理仕訳
│       ├── 01.ledger              # 1月の取引
│       ├── 02.ledger              # 2月の取引
│       └── ...                    # 3月以降の取引
├── memo/                           # 判断の理由や根拠（任意）
│   └── 2026/                      # 年別ディレクトリ
│       └── 01/                    # 月別ディレクトリ
│           └── receipt-001.md
├── scripts/                        # Node.js スクリプト
│   ├── lib/
│   │   ├── ledger-utils.mjs      # 共通ユーティリティ
│   │   └── __tests__/            # テストコード
│   ├── check-balance.mjs          # 貸借一致チェック
│   ├── validate-accounts.mjs      # 勘定科目検証
│   ├── monthly-summary.mjs        # 月次集計
│   ├── yearly-summary.mjs         # 年次集計
│   └── export-csv.mjs             # CSV 出力
├── templates/                      # テンプレートファイル
│   ├── monthly.ledger.template    # 月次ファイルのテンプレート
│   └── memo.md.template           # メモファイルのテンプレート
├── docs/                           # ドキュメント
│   ├── setup.md                   # セットアップガイド
│   ├── usage.md                   # コマンド使用方法
│   ├── workflow.md                # 記帳ワークフロー
│   ├── accounts.md                # 勘定科目の詳細
│   ├── structure.md               # このファイル
│   ├── development.md             # 開発ガイド
│   └── tax-filing.md              # 確定申告ガイド
├── docker-compose.yml              # Docker 設定
├── Dockerfile                      # Docker イメージ定義
├── lgr                             # Mac/Linux 用コマンド（POSIX Shell）
├── lgr.bat                         # Windows 用コマンド
├── ledger.ps1                      # PowerShell実装（lgr.batから呼ばれる）
├── package.json                    # Node.js プロジェクト設定
├── vitest.config.mjs               # テスト設定
├── CLAUDE.md                       # Claude Code 用開発ガイド
└── README.md                       # プロジェクト概要
```

## 各ディレクトリの詳細

### ledger/ - 帳簿ファイル

会計データを記録するディレクトリです。**最も重要なディレクトリ**で、日常的に編集します。

#### accounts.ledger

**すべての勘定科目を定義するファイル**。新しい勘定科目を使う前に、必ずここに追加する必要があります。

```ledger
; 資産
account Assets:Cash
    note 手元現金

account Assets:Bank:Business
    note 事業用銀行口座

; 費用
account Expenses:Supplies
    note 消耗品費
```

**重要：** 検証スクリプトがこのファイルを参照し、未定義の勘定科目が使われているとエラーを出します。

#### YYYY/opening.ledger

各年度の期首（年度始めや事業開始時）の残高を記録するファイル。年別ディレクトリ内に配置します。

```ledger
; ledger/2026/opening.ledger
2026/01/01 * 期首残高
    Assets:Cash                     50000 JPY
    Assets:Bank:Business           500000 JPY
    Equity:OpeningBalances
```

年度が変わったら、前年度の closing.ledger で確定した残高をここに記載します。

#### YYYY/closing.ledger

各年度の期末（年度末）の整理仕訳を記録するファイル。年別ディレクトリ内に配置します。

```ledger
; ledger/2026/closing.ledger
2026/12/31 * 決算整理：損益の確定
    Income:Sales               -1200000 JPY  ; 売上の相殺
    Expenses:Supplies            150000 JPY  ; 経費の相殺
    ; ...
    Equity:RetainedEarnings              JPY  ; 差額が利益
```

#### YYYY/ - 年別ディレクトリ

各年ごとにディレクトリを作成し、その下に月次ファイルを配置します。

**ファイル命名規則：**
- `01.ledger` - 1月の取引
- `02.ledger` - 2月の取引
- ...
- `12.ledger` - 12月の取引

**例：ledger/2026/01.ledger**

```ledger
; 2026年1月の取引

2026/01/05 * 事務用品購入
    Expenses:Supplies           3000 JPY
    Assets:Cash

2026/01/10 * クライアントA 売上
    Assets:Bank:Business       100000 JPY
    Income:Sales
```

### memo/ - 判断の理由や根拠（任意）

会計記録の判断根拠や背景情報を記録するディレクトリです。**ledger ファイルとの責務分担**が重要です。

- **ledger** = 会計の事実（What happened）
- **memo** = 判断の理由（Why we recorded it this way）

**例：memo/2026/01/receipt-001.md**

```markdown
# 自宅兼事務所の電気代

- 日付：2026/01/15
- 金額：10,000円
- 事業按分：50%（5,000円を経費計上）

## 按分比率の根拠

- 自宅総面積：100㎡
- 事務所専用スペース：50㎡
- 按分比率：50㎡ / 100㎡ = 50%

## 参考

- 国税庁タックスアンサー No.1805「家事関連費」
```

memoディレクトリは任意ですが、税務調査時に「なぜその判断をしたか」を説明できると有利です。

### scripts/ - Node.js スクリプト

hledger をラップして各種処理を実行するスクリプト群です。

#### scripts/lib/ledger-utils.mjs

共通ユーティリティ関数を集めたモジュール：
- ファイル検索・取得
- 勘定科目のパース
- hledger コマンドの実行ラッパー
- コマンドライン引数の解析

#### 各スクリプトの役割

- **check-balance.mjs** - 貸借が一致しているかチェック
- **validate-accounts.mjs** - 未定義の勘定科目が使われていないか検証
- **init-year.mjs** - 年次ディレクトリと12ヶ月分の月次ファイルを一括作成
- **monthly-summary.mjs** - 指定月の収支を集計
- **yearly-summary.mjs** - 年間の収支を集計
- **export-csv.mjs** - 会計データを CSV 形式でエクスポート

### templates/ - テンプレートファイル

新しいファイルを作成する際の雛形です。

- **monthly.ledger.tpl** - 月次ファイルのテンプレート
- **opening.ledger.tpl** - 期首残高ファイルのテンプレート
- **closing.ledger.tpl** - 期末整理仕訳ファイルのテンプレート
- **receipt.memo.tpl** - メモファイルのテンプレート

`init-year` コマンドでこれらのテンプレートが自動適用されます。

### docs/ - ドキュメント

各種ドキュメントを格納しています。

- **[setup.md](setup.md)** - 初期セットアップの手順
- **[usage.md](usage.md)** - コマンドの使い方
- **[workflow.md](workflow.md)** - 日常的な記帳フロー
- **[accounts.md](accounts.md)** - 勘定科目と青色申告決算書の対応表
- **[structure.md](structure.md)** - このファイル
- **[development.md](development.md)** - テンプレート開発者向けガイド
- **[tax-filing.md](tax-filing.md)** - 確定申告時の作業ガイド

## ルートディレクトリのファイル

### docker-compose.yml

Docker Compose の設定ファイル。hledger を含む Docker コンテナを定義しています。

```bash
# コンテナを使ってコマンドを実行
docker compose run --rm ledger node scripts/check-balance.mjs
```

### Dockerfile

hledger をインストールした Docker イメージの定義ファイル。

### lgr / lgr.bat

プロジェクトの統一コマンド。環境に応じて自動的に適切なスクリプトを実行します。

```bash
./lgr check           # 貸借チェック
./lgr monthly 2026-01 # 月次集計
```

> **Note**: Windows PowerShell/Command Prompt では `./` を省略して `lgr` と実行してください。

### ledger.ps1

PowerShell実装スクリプト。`lgr.bat` から呼び出されます。直接実行も可能ですが、`lgr` コマンドの使用を推奨します。

### package.json

Node.js プロジェクトの設定ファイル。スクリプトの依存関係や実行コマンドを定義しています。

```json
{
  "name": "ledger-aoiro",
  "type": "module",
  "scripts": {
    "check": "node scripts/check-balance.mjs",
    "validate": "node scripts/validate-accounts.mjs"
  }
}
```

### vitest.config.mjs

テストフレームワーク Vitest の設定ファイル。テンプレート開発者向けです。

**テンプレート利用者は削除可能です。**

### CLAUDE.md

Claude Code（AI 開発支援ツール）用のプロジェクトガイド。プロジェクト構造や設計思想を記載しています。

### README.md

プロジェクトの概要説明ファイル。このテンプレートを使い始める際の最初のエントリーポイントです。

## ファイルの編集頻度

### 日常的に編集するファイル

- `ledger/YYYY/MM.ledger` - 毎日〜毎週
- `memo/YYYY/MM/*.md` - 必要に応じて

### 定期的に編集するファイル

- `ledger/accounts.ledger` - 新しい勘定科目が必要になったとき
- `ledger/YYYY/opening.ledger` - 年度始めに1回
- `ledger/YYYY/closing.ledger` - 年度末に1回

### ほとんど編集しないファイル

- `docker-compose.yml`, `Dockerfile` - 環境の変更時のみ
- `scripts/*.mjs` - スクリプトのカスタマイズ時のみ
- `docs/*.md` - ドキュメントの更新時のみ

## テンプレート利用時の削除対象（オプション）

帳簿管理のみを行う場合、以下のファイル・ディレクトリは削除しても問題ありません：

- `scripts/lib/__tests__/` - テストコード
- `vitest.config.mjs` - テスト設定
- `package.json` の `devDependencies` セクション
- `package.json` の `test` 関連スクリプト

## まとめ

- **ledger/** = 会計データ（最重要）
- **memo/** = 判断の理由（任意だが推奨）
- **scripts/** = 自動化スクリプト
- **docs/** = 説明書
- その他 = 環境設定やツール

基本的には **ledger/ ディレクトリ内のファイルだけを編集**すれば日常の記帳ができます。

## 関連ドキュメント

- [setup.md](setup.md) - 初期セットアップ
- [workflow.md](workflow.md) - 日常的な記帳フロー
- [usage.md](usage.md) - コマンドの使い方
