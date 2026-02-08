# ledger-aoiro

[hledger](https://hledger.org/) を使って青色申告するためのテンプレート。

## このリポジトリについて

このリポジトリは**テンプレート**です。以下の流れで使用します：

1. **このテンプレートをクローン**して自分のリポジトリとして初期化
2. **あなた自身のプライベートリポジトリ**で帳簿を管理
3. **日々の取引を記帳**し、月次・年次の集計を行う
4. **年度ごとに継続**して使用

**重要：** 帳簿データには個人情報が含まれるため、必ず**プライベートリポジトリ**として管理してください。

## 特徴

- 複式簿記による記帳（青色申告65万円控除対応）
- Docker環境で hledger を簡単に使える
- **Claude Code Skills による自動化**：日々の仕訳入力、月次チェック、確定申告準備を AI がサポート
- **対話的な仕訳入力**：`hledger add` コマンドでガイド付き入力
- **ブラウザUI**：`hledger-web` でブラウザから帳簿を閲覧・編集
- 勘定科目の定義を一元管理し、未定義の使用を検証
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

## クイックスタート

### 1. テンプレートの取得

**GitHub テンプレート機能を使う（推奨）：**

1. このリポジトリの [GitHub ページ](https://github.com/yosiopp/ledger-aoiro) で **「Use this template」** をクリック
2. 新しいリポジトリ名を入力（例：`my-ledger`）
3. **「Private」を選択**（帳簿データなので必須）
4. 作成されたリポジトリをクローン

```bash
git clone https://github.com/YOUR_USERNAME/my-ledger.git
cd my-ledger
```

**または ZIP ダウンロード：**

1. 「Code」→「Download ZIP」でダウンロード
2. 解凍してGitリポジトリとして初期化

```bash
cd my-ledger
git init
git add .
git commit -m "Initial commit from ledger-aoiro template"
```

詳しいセットアップ手順は **[docs/setup.md](docs/setup.md)** を参照してください。

### 2. Docker 環境のセットアップ

```bash
# Dockerイメージをビルド
docker compose build

# 動作確認
docker compose run --rm ledger hledger --version
```

### 3. 年次ディレクトリの作成

```bash
# 現在の年度のディレクトリを作成
./lgr init-year

# 特定の年度を指定
./lgr init-year 2027
```

> **Note**: Windows PowerShell/Command Prompt では `./` を省略して `lgr` と実行してください。

これで `ledger/YYYY/` ディレクトリと `01.ledger` から `12.ledger` までの12個の月次ファイルが自動作成されます。

### 5. 仕訳を入力する

**Claude Code で入力（最も簡単・推奨）：**

VSCode で Claude Code 拡張機能を使っている場合：
```
/ledger-add
```
AI が対話形式で取引内容を聞き取り、自動的に適切な勘定科目を選択して記帳します。

**対話的に入力（hledger add）：**

```bash
./lgr add 2026-01
```

ガイド付きプロンプトで以下を入力：
- 日付（例：2026/01/15）
- 説明（例：事務用品購入）
- 勘定科目（補完機能付き）
- 金額（自動計算）

**または、ファイルを直接編集：**

```ledger
# ledger/2026/01.ledger
2026/01/15 * 事務用品購入
    X:消耗品費           3000 JPY
    A:銀行:事業用
```

> **Note**: このプロジェクトでは、勘定科目の大分類にhledgerのタイプコードと一致する**大文字1文字**（A, L, E, R, X）を使用しています。詳しくは [勘定科目ガイド](docs/accounts.md) を参照してください。

### 6. 集計を実行

```bash
./lgr check           # 貸借チェック
./lgr monthly 2026-01 # 月次集計
./lgr web             # ブラウザで閲覧
```

## ドキュメント

### はじめに

- **[セットアップガイド](docs/setup.md)** - テンプレートの初期設定と使い始め方
- **[ディレクトリ構成](docs/structure.md)** - プロジェクトの構造とファイルの役割
- **[コマンド使用方法](docs/usage.md)** - ショートカットコマンドと各種操作（Claude Code Skills の使い方）

### 日常的な使い方

- **[ワークフロー](docs/workflow.md)** - 日常的な記帳フローと月次・年次処理
- **[勘定科目](docs/accounts.md)** - 勘定科目と青色申告決算書の対応

### 確定申告

- **[確定申告ガイド](docs/tax-filing.md)** - 確定申告時の作業

### 開発者向け

- **[開発ガイド](docs/development.md)** - テンプレート自体の開発・テスト（利用者は不要）
- **[Claude Codeガイド](CLAUDE.md)** - AI開発支援ツール用のプロジェクト情報

## サポート

問題が発生した場合：

1. [hledger 公式ドキュメント](https://hledger.org/)
2. テンプレートの [Issues](https://github.com/yosiopp/ledger-aoiro/issues)

## ライセンス

ISC
