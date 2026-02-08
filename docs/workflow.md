# 日常的な記帳ワークフロー

このドキュメントでは、日々の帳簿記入から月次・年次の処理まで、実際の運用フローを説明します。

## 基本的な記帳サイクル

```
日次/週次: 取引の記録
    ↓
週次/月次: 貸借チェック
    ↓
月次: 月次集計の確認
    ↓
年次: 決算処理 → 確定申告
```

## 1. 日常的な取引の記録

### 年次ディレクトリの作成

年度が変わったら、まず年次ディレクトリと12ヶ月分のファイルを一括作成します。

```bash
# 現在の年度のディレクトリを作成
./lgr init-year

# 特定の年度を指定
./lgr init-year 2027
```

> **Note**: Windows PowerShell/Command Prompt では `./` を省略して `lgr` と実行してください。

このコマンドで以下が自動的に作成されます：
- `ledger/YYYY/` ディレクトリ
- `01.ledger` から `12.ledger` までの12個のファイル（テンプレート適用済み）
- 既存のファイルは上書きされません（安全）

### 取引の記帳

取引が発生したら、月次ファイルに記録します。

**例1：現金で経費を支払った場合**

```ledger
2026/01/05 * 事務用品購入
    Expenses:消耗品費           3000 JPY
    Assets:現金
```

**例2：売上が銀行口座に入金された場合**

```ledger
2026/01/10 * クライアントA 請求書#001
    Assets:銀行:事業用       100000 JPY
    Income:売上
```

**例3：クレジットカードで経費を支払った場合**

```ledger
2026/01/15 * サーバー代（AWS）
    Expenses:通信費      5000 JPY
    Liabilities:クレジットカード

; 後日、クレジットカードの引き落とし
2026/02/01 * クレジットカード引き落とし
    Liabilities:クレジットカード      5000 JPY
    Assets:銀行:事業用
```

**例4：按分が必要な経費（家賃など）**

```ledger
2026/01/25 * 家賃（事業利用30%）
    Expenses:地代家賃              30000 JPY  ; 按分後
    Equity:事業主:引出      70000 JPY  ; 個人利用分
    Assets:銀行:事業用
```

### 記帳のポイント

- **日付順に記録**：取引日順に並べると後で見やすい
- **説明を明確に**：取引相手や内容を具体的に書く
- **レシート番号**：`; Receipt #123` のようにコメントで記録
- **こまめに記帳**：週1回程度は最低でも記帳する習慣を

## 2. 検証とチェック

### 貸借が一致しているか確認

```bash
# 貸借チェック
docker compose run --rm ledger npm run check
```

エラーが出た場合は、記帳ミスがある可能性があります。

### 残高の確認

```bash
# すべての勘定科目の残高を表示
docker compose run --rm ledger ledger \
  -f ledger/accounts.ledger \
  -f ledger/opening_balance.ledger \
  -f ledger/2026/01.ledger \
  balance

# 現金の残高のみ表示
docker compose run --rm ledger ledger \
  -f ledger/accounts.ledger \
  -f ledger/opening_balance.ledger \
  -f ledger/2026/01.ledger \
  balance Assets:現金
```

実際の現金残高や銀行残高と照合してください。

## 3. 変更の保存（Git）

記帳が終わったら、変更をGitで保存します。

```bash
# 変更を確認
git status
git diff

# 変更をステージング
git add ledger/2026/01.ledger

# または年別ディレクトリごと
# git add ledger/2026/

# コミット（わかりやすいメッセージを書く）
git commit -m "2026-01: 1/5-1/10の取引を記帳"

# リモートにプッシュ（バックアップ）
git push
```

### コミットメッセージの例

- `"2026-01: 1月前半の取引を記帳"`
- `"2026-01: AWS請求書を追加"`
- `"accounts: 書籍費の勘定科目を追加"`

## 4. 月次処理

### 月次集計の確認

```bash
# 1月の集計を表示
docker compose run --rm ledger node scripts/monthly-summary.mjs --month 2026-01
```

### 月末のチェックリスト

- [ ] すべての取引を記帳済み
- [ ] 銀行口座の残高を照合
- [ ] クレジットカードの明細と照合
- [ ] 売掛金・買掛金の確認
- [ ] 貸借チェックがパス
- [ ] Gitにコミット＆プッシュ

## 5. 年次処理

### 年次集計

```bash
# 年間の集計を表示
docker compose run --rm ledger node scripts/yearly-summary.mjs
```

### 決算処理（12月31日または期末）

1. **損益の確定**

すべての収益・費用を集計し、利益を計算します。

```ledger
; 決算整理仕訳（closing.ledger に記載）

2026/12/31 * 決算整理：損益の確定
    Income:売上               -1200000 JPY  ; 売上の相殺
    Expenses:消耗品費            150000 JPY  ; 経費の相殺
    Expenses:通信費        60000 JPY
    Expenses:地代家賃                360000 JPY
    ; ... 他の経費も同様に
    Equity:繰越利益              JPY  ; 差額が利益
```

2. **翌年度の期首残高**

翌年の opening_balance.ledger に、すべての資産・負債・純資産の残高を記録します。

```ledger
; 期首残高（opening_balance.ledger に記載）

2027/01/01 * 期首残高
    Assets:現金                     47000 JPY
    Assets:銀行:事業用           680000 JPY
    Assets:備品               100000 JPY
    Liabilities:クレジットカード          50000 JPY
    Equity:期首残高
    Equity:繰越利益        630000 JPY  ; 前年の利益
```

詳しくは [tax-filing.md](tax-filing.md) を参照してください。

## よくある作業パターン

### 売掛金の処理

```ledger
; 請求書を発行した時点
2026/01/20 * クライアントB 請求書#002
    Assets:売掛金   80000 JPY
    Income:売上

; 入金された時点
2026/02/05 * クライアントB 入金
    Assets:銀行:事業用        80000 JPY
    Assets:売掛金
```

### 前払費用の処理

```ledger
; 年払いのサーバー代を支払った
2026/01/01 * サーバー年間契約
    Assets:前払費用      60000 JPY
    Assets:銀行:事業用

; 毎月、費用として計上
2026/01/31 * サーバー代（1月分）
    Expenses:通信費       5000 JPY
    Assets:前払費用
```

### 固定資産の減価償却

```ledger
; 備品を購入（10万円以上）
2026/04/01 * ノートPC購入
    Assets:備品           150000 JPY
    Assets:銀行:事業用

; 年末に減価償却（定額法、耐用年数4年の場合）
2026/12/31 * 減価償却（PC 9ヶ月分）
    Expenses:減価償却費       28125 JPY  ; 150000 / 4年 * 9/12
    Assets:備品
```

## トラブルシューティング

### 残高が合わない

1. 銀行の明細を最初から照合
2. 未記帳の取引がないか確認
3. 勘定科目の間違いがないか確認
4. 金額の桁を間違えていないか確認

### 勘定科目エラー

```bash
# 使用されている勘定科目をチェック
docker compose run --rm ledger node scripts/validate-accounts.mjs
```

エラーが出た勘定科目を `ledger/accounts.ledger` に追加します。

## まとめ

1. **こまめに記帳**：週1回は記帳する習慣をつける
2. **照合を欠かさない**：銀行口座、現金の残高を定期的に照合
3. **Gitで履歴管理**：記帳したらコミット＆プッシュ
4. **月次・年次で確認**：集計スクリプトで数字を確認

次のステップ：
- [tax-filing.md](tax-filing.md) - 確定申告の準備
- [accounts.md](accounts.md) - 勘定科目の詳細
