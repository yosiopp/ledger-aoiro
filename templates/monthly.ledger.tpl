; ============================================================
; ledger/YYYY/MM.ledger
;
; 月次仕訳ファイル（年別ディレクトリ構造）
;
; ルール:
; 1. 日付順に記載する
; 2. 1取引 = 1トランザクション
; 3. 可能な限り receipt ファイル名をコメントに残す
; 4. 勘定科目は accounts.ledger に定義されたもののみ使用
; ============================================================


; ------------------------------------------------------------
; 売上（Income）
; ------------------------------------------------------------

; YYYY-MM-DD * 売上の内容
;   Assets:Bank:Business     XXX JPY
;   Income:Sales

; 例:
; 2026-01-05 * Web制作 売上
;   ; receipt: 2026-01-05-invoice-001.pdf
;   Assets:Bank:Business     330,000 JPY
;   Income:Sales


; ------------------------------------------------------------
; 経費（Expenses）
; ------------------------------------------------------------

; YYYY-MM-DD * 支出内容
;   Expenses:XXXX            XXX JPY
;   Assets:Cash|Bank|CreditCard

; 例:
; 2026-01-10 * クラウドサーバー利用料
;   ; receipt: 2026-01-10-cloud-server.pdf
;   Expenses:Communication   1,100 JPY
;   Assets:Bank:Business


; ------------------------------------------------------------
; クレジットカード利用
; ------------------------------------------------------------

; 使用時（未払計上）
; 2026-01-15 * 書籍購入
;   ; receipt: 2026-01-15-book.pdf
;   Expenses:Supplies        3,300 JPY
;   Liabilities:CreditCard

; 引落時
; 2026-02-10 * クレジットカード引落
;   Assets:Bank:Business     -3,300 JPY
;   Liabilities:CreditCard


; ------------------------------------------------------------
; 事業主貸・事業主借
; ------------------------------------------------------------

; 個人資金で立替
; 2026-01-20 * 立替経費（個人立替）
;   ; receipt: 2026-01-20-stationery.pdf
;   Expenses:Supplies        1,200 JPY
;   Equity:Owner:Contributions

; 事業資金を私用で使用
; 2026-01-25 * 私用引出
;   Assets:Cash             -10,000 JPY
;   Equity:Owner:Drawings
