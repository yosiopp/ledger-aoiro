# Makefile for ledger-aoiro
# Mac/Linux/WSL/Git Bash で使用可能

.PHONY: help check validate monthly yearly export init-year add web ledger shell build

# デフォルトターゲット: ヘルプを表示
help:
	@echo "ledger-aoiro コマンド一覧"
	@echo ""
	@echo "基本コマンド:"
	@echo "  make check          - 貸借一致チェックを実行"
	@echo "  make validate       - 勘定科目の定義チェック"
	@echo "  make init-year      - 年次ディレクトリと12ヶ月分のファイルを作成（YEAR=2027 で年を指定）"
	@echo "  make monthly        - 月次集計（MONTH=2026-01 で月を指定）"
	@echo "  make yearly         - 年次集計を実行"
	@echo "  make export         - CSV形式でエクスポート"
	@echo ""
	@echo "仕訳入力コマンド:"
	@echo "  make add            - 対話的に仕訳を追加（MONTH=2026-01 で月を指定）"
	@echo "  make web            - ブラウザで帳簿を閲覧（http://localhost:5000）"
	@echo ""
	@echo "開発用コマンド:"
	@echo "  make ledger         - hledger を直接実行（ARGS で引数を渡す）"
	@echo "  make shell          - Dockerコンテナ内のシェルに入る"
	@echo "  make build          - Dockerイメージをビルド"
	@echo ""
	@echo "使用例:"
	@echo "  make init-year YEAR=2027"
	@echo "  make monthly MONTH=2026-01"
	@echo "  make add MONTH=2026-01"
	@echo "  make ledger ARGS='-f ledger/accounts.ledger balance'"

# 貸借チェック
check:
	docker compose run --rm ledger node scripts/check-balance.mjs

# 勘定科目検証
validate:
	docker compose run --rm ledger node scripts/validate-accounts.mjs

# 年次ディレクトリ初期化（YEAR変数で年を指定、デフォルトは現在の年）
init-year:
ifdef YEAR
	docker compose run --rm ledger node scripts/init-year.mjs --year=$(YEAR)
else
	docker compose run --rm ledger node scripts/init-year.mjs
endif

# 月次集計（MONTH変数で月を指定）
monthly:
ifdef MONTH
	docker compose run --rm ledger node scripts/monthly-summary.mjs --month $(MONTH)
else
	@echo "エラー: MONTH を指定してください"
	@echo "使用例: make monthly MONTH=2026-01"
	@exit 1
endif

# 年次集計
yearly:
	docker compose run --rm ledger node scripts/yearly-summary.mjs

# CSV エクスポート
export:
	docker compose run --rm ledger node scripts/export-csv.mjs

# 対話的に仕訳を追加（MONTH変数で月を指定）
add:
ifdef MONTH
	@echo "📝 仕訳を追加: $(MONTH)"
	@echo "💡 Ctrl+D または Ctrl+C で終了します"
	@echo ""
	docker compose run --rm ledger hledger add -f ledger/accounts.ledger -f ledger/$(shell echo $(MONTH) | cut -d'-' -f1)/$(shell echo $(MONTH) | cut -d'-' -f2).ledger
else
	@echo "エラー: MONTH を指定してください"
	@echo "使用例: make add MONTH=2026-01"
	@exit 1
endif

# ブラウザで帳簿を閲覧（hledger-web）
web:
	@echo "🌐 hledger-web を起動中..."
	@echo "📖 ブラウザで http://localhost:5000 を開いてください"
	@echo "💡 Ctrl+C で終了します"
	@echo ""
	docker compose run --rm --service-ports ledger hledger-web -f ledger/accounts.ledger --serve --host=0.0.0.0 --port=5000

# hledger を直接実行（ARGS で引数を渡す）
ledger:
ifdef ARGS
	docker compose run --rm ledger hledger $(ARGS)
else
	docker compose run --rm ledger hledger --version
endif

# コンテナ内のシェルに入る
shell:
	docker compose run --rm ledger sh

# Dockerイメージをビルド
build:
	docker compose build
