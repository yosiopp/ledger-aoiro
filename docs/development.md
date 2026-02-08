# 開発ガイド

このドキュメントは、ledger-aoiro テンプレート自体の開発・改善を行う開発者向けのガイドです。

## 対象読者

このドキュメントは、**ledger-aoiro テンプレート自体**の開発・改善を行う開発者向けのガイドです。

**テンプレート利用者（帳簿管理のみを行う方）は、このドキュメントの内容を実施する必要はありません。**

## 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yosiopp/ledger-aoiro.git
cd ledger-aoiro

# 依存関係をインストール
npm install

# Docker イメージをビルド
docker compose build
```

## テストの実行

### ユニットテスト

```bash
# すべてのテストを実行
npm test

# ウォッチモードで実行（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

テストファイルの場所：

- `scripts/lib/__tests__/ledger-utils.test.mjs` - ユーティリティ関数のテスト

### テストの書き方

新しいユーティリティ関数を追加した場合は、対応するテストも追加してください：

```javascript
import { describe, it, expect } from "vitest";
import { yourFunction } from "../ledger-utils.mjs";

describe("yourFunction", () => {
  it("正常系のテスト", () => {
    const result = yourFunction("input");
    expect(result).toBe("expected");
  });

  it("異常系のテスト", () => {
    expect(() => yourFunction(null)).toThrow();
  });
});
```

## コード構成

### scripts/lib/ledger-utils.mjs

共通ユーティリティ関数をまとめたモジュール。以下の機能を提供：

- **ファイル取得**: ledger ファイルの検索・取得
- **勘定科目**: accounts.ledger のパース
- **コマンド実行**: hledger のラッパー
- **引数解析**: コマンドライン引数の処理

新しいユーティリティ関数を追加する場合は、このファイルに追加してください。

### スクリプト

各スクリプトは独立して実行可能で、`scripts/lib/ledger-utils.mjs` を利用します：

- `validate-accounts.mjs` - 勘定科目の検証
- `check-balance.mjs` - 貸借一致チェック
- `monthly-summary.mjs` - 月次集計
- `yearly-summary.mjs` - 年次集計
- `export-csv.mjs` - CSV エクスポート

## リリースプロセス

### テンプレートとしてのリリース

1. すべてのテストが通ることを確認

   ```bash
   npm test
   ```

2. 動作確認（Docker 環境で実行）

   ```bash
   docker compose run --rm ledger npm run check
   docker compose run --rm ledger node scripts/monthly-summary.mjs
   ```

3. ドキュメントの更新

4. バージョンアップ

   ```bash
   npm version patch  # または minor, major
   ```

5. GitHub にプッシュ

   ```bash
   git push origin main --tags
   ```

6. GitHub で Release を作成

## テンプレート利用者への配慮

### 削除可能なファイルの明示

テンプレート利用者が不要なファイルを削除しやすいように：

- README.md に削除対象を明記
- `.gitattributes` で開発用ファイルをマーク
- ドキュメントで説明

### テンプレート利用時の削除対象

帳簿管理のみを行う場合、以下のファイルは削除しても問題ありません：

**削除可能なファイル・ディレクトリ：**

- `scripts/lib/__tests__/` - テストファイル
- `vitest.config.mjs` - テスト設定
- `package.json` の `devDependencies` セクション
- `package.json` の `test` 関連スクリプト

**削除の手順：**

```bash
# テストコードを削除
rm -rf scripts/lib/__tests__/
rm vitest.config.mjs

# package.json を編集して devDependencies と test スクリプトを削除
```

**注意：** 削除後も、スクリプト本体（`scripts/*.mjs`）は動作します。テストコードはテンプレート開発者向けの機能です。

### テンプレート機能との互換性

GitHub テンプレート機能は、以下を除くすべてのファイルをコピーします：

- `.git/` ディレクトリ（履歴はコピーされない）
- GitHub Actions ワークフロー（オプションで含めることも可能）

特定のファイルをテンプレートから除外する標準的な方法はありませんが、以下の方法で対応：

1. `.gitattributes` で開発用ファイルをマーク（linguist-documentation）
2. README で削除可能なファイルを明記
3. ディレクトリ構造で分離（`__tests__/` など）

## Claude Code との連携

このプロジェクトは Claude Code での開発を想定しています：

- `CLAUDE.md` にプロジェクト構造とルールを記載
- AI がコードを理解・修正しやすい構造
- 明確なコメントと型情報

## コーディング規約

### JavaScript/Node.js

- ES Modules を使用（`import`/`export`）
- JSDoc コメントで関数を説明
- 関数は単一責任の原則に従う
- エラーハンドリングを適切に行う

### Ledger ファイル

- 日付フォーマット: `YYYY/MM/DD`
- 金額は必ず通貨単位を明記（`JPY`）
- インデントはスペース4個
- コメントはセミコロン（`;`）で開始

## トラブルシューティング

### テストが失敗する場合

```bash
# キャッシュをクリア
rm -rf node_modules coverage
npm install
npm test
```

### Docker 環境で動作しない場合

```bash
# イメージを再ビルド
docker compose down
docker compose build --no-cache
docker compose up
```

## 参考資料

- [Ledger CLI 公式ドキュメント](https://ledger-cli.org/docs.html)
- [Vitest ドキュメント](https://vitest.dev/)
- [GitHub テンプレートリポジトリ](https://docs.github.com/ja/repositories/creating-and-managing-repositories/creating-a-template-repository)
