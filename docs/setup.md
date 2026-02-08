# セットアップガイド

このドキュメントでは、ledger-aoiro テンプレートを使って自分専用の帳簿管理リポジトリを作成する手順を説明します。

## 前提条件

- Dockerがインストールされていること
- Gitがインストールされていること
- GitHubなどのGitホスティングサービスのアカウント（推奨）

## 1. テンプレートの取得

### 方法A：GitHubのテンプレート機能を使う（推奨・最も簡単）

1. GitHubで [ledger-aoiro リポジトリ](https://github.com/yosiopp/ledger-aoiro)にアクセス
2. 右上の **「Use this template」** ボタンをクリック
3. 新しいリポジトリ名を入力（例：`my-ledger`）
4. **「Private」を必ず選択**（帳簿データなので必須）
5. 「Create repository」をクリック
6. 作成されたリポジトリをクローン

```bash
git clone https://github.com/YOUR_USERNAME/my-ledger.git
cd my-ledger
```

これだけで完了！Git履歴の削除などは不要です。

### 方法B：ZIPファイルをダウンロード（GitHubアカウント不要）

1. [ledger-aoiro リポジトリ](https://github.com/yosiopp/ledger-aoiro)にアクセス
2. 「Code」→「Download ZIP」をクリック
3. ダウンロードしたZIPを解凍
4. フォルダ名を変更（例：`my-ledger`）

```bash
cd my-ledger

# Gitリポジトリとして初期化
git init
git add .
git commit -m "Initial commit from ledger-aoiro template"
```

## 2. リモートリポジトリの設定

### プライベートリポジトリを作成（強く推奨）

**重要：** 帳簿データには個人情報や機密情報が含まれるため、必ずプライベートリポジトリにしてください。

1. GitHub/GitLabなどで新しいプライベートリポジトリを作成
2. リモートリポジトリを設定

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/my-ledger.git

# プッシュ
git push -u origin main
```

## 3. Docker環境のセットアップ

```bash
# Dockerイメージをビルド
docker compose build

# 動作確認（ヘルプが表示されればOK）
docker compose run --rm ledger ledger --version
```

## 4. 初期設定

### 4.1 勘定科目のカスタマイズ

`ledger/accounts.ledger` を確認し、必要に応じて勘定科目を追加・削除します。

```bash
# accounts.ledger を編集
vi ledger/accounts.ledger
```

**例：** 特定の経費科目を追加する場合

```ledger
; 書籍費を追加
account Expenses:Books
```

### 4.2 期首残高の設定

事業開始時または年度始めの残高を `ledger/opening_balance.ledger` に記録します。

```ledger
; 期首残高

2026/01/01 * 期首残高
    Assets:Cash                     50000 JPY
    Assets:Bank:Business           500000 JPY
    Equity:OpeningBalances
```

### 4.3 package.jsonのカスタマイズ（任意）

必要に応じて、プロジェクト名やリポジトリURLを変更します。

```json
{
  "name": "my-ledger",
  "description": "私の青色申告帳簿",
  "homepage": "https://github.com/YOUR_USERNAME/my-ledger",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_USERNAME/my-ledger.git"
  }
}
```

## 5. 動作確認

### 簡単な取引を記録してテスト

```bash
# 年別ディレクトリを作成
mkdir -p ledger/2026

# 2026年1月の取引ファイルを作成
cat > ledger/2026/01.ledger << 'EOF'
; 2026年1月の取引

2026/01/05 * 事務用品購入
    Expenses:Supplies           3000 JPY
    Assets:Cash

2026/01/10 * 売上入金
    Assets:Bank:Business       50000 JPY
    Income:Sales
EOF

# 残高確認
docker compose run --rm ledger ledger \
  -f ledger/accounts.ledger \
  -f ledger/opening_balance.ledger \
  -f ledger/2026/01.ledger \
  balance

# 貸借チェック（バランスが取れているか確認）
docker compose run --rm ledger npm run check
```

## 6. 日常的な運用を開始

これで準備完了です！以下のワークフローで日々の記帳を進めていきます：

1. **年別ディレクトリの作成** - `mkdir -p ledger/YYYY`
2. **月次ファイルの作成** - `ledger/YYYY/MM.ledger` を作成
3. **取引の記録** - 日々の取引を記帳
4. **検証** - `npm run check` で貸借が一致しているか確認
5. **コミット＆プッシュ** - 変更をGitで管理

詳しくは [workflow.md](workflow.md) を参照してください。

## セキュリティに関する注意事項

### 必ずプライベートリポジトリを使用

- 帳簿データには取引先名、金額、個人情報が含まれます
- **絶対にパブリックリポジトリにしないでください**

### .gitignoreの確認

機密情報を含むファイルがコミットされないよう、`.gitignore` を適切に設定してください。

```gitignore
# 例：一時ファイルやバックアップを除外
*.bak
*.tmp
.DS_Store
```

### リモートリポジトリのバックアップ

- 定期的にリモートリポジトリにプッシュしてバックアップ
- 可能であれば、複数のリモート（GitHub + GitLab など）を設定

## トラブルシューティング

### Docker が起動しない

```bash
# Dockerのステータス確認
docker info

# Dockerが起動していない場合は起動
# macOS: Docker Desktop を起動
# Linux: sudo systemctl start docker
```

### ledgerコマンドが見つからない

```bash
# Dockerイメージを再ビルド
docker compose build --no-cache
```

### 勘定科目のエラーが出る

未定義の勘定科目を使っている可能性があります。

```bash
# 勘定科目の検証スクリプトを実行（実装後）
docker compose run --rm ledger node scripts/validate-accounts.mjs
```

エラーメッセージで指摘された勘定科目を `ledger/accounts.ledger` に追加してください。

## 次のステップ

- [workflow.md](workflow.md) - 日常的な記帳フロー
- [accounts.md](accounts.md) - 勘定科目と青色申告決算書の対応
- [tax-filing.md](tax-filing.md) - 確定申告時の作業

## サポート

問題が発生した場合：

1. [hledger 公式ドキュメント](https://hledger.org/)
2. テンプレートの [Issues](https://github.com/yosiopp/ledger-aoiro/issues)
