# PowerShell script for ledger-aoiro (Windows用)
# 使い方: .\ledger.ps1 <command> [options]

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

function Show-Help {
    Write-Host "ledger-aoiro コマンド一覧" -ForegroundColor Green
    Write-Host ""
    Write-Host "基本コマンド:"
    Write-Host "  .\ledger.ps1 check          - 貸借一致チェックを実行"
    Write-Host "  .\ledger.ps1 validate       - 勘定科目の定義チェック"
    Write-Host "  .\ledger.ps1 init-year [year] - 年次ディレクトリと12ヶ月分のファイルを作成"
    Write-Host "  .\ledger.ps1 monthly 2026-01 - 月次集計を実行"
    Write-Host "  .\ledger.ps1 yearly         - 年次集計を実行"
    Write-Host "  .\ledger.ps1 export         - CSV形式でエクスポート"
    Write-Host ""
    Write-Host "仕訳入力コマンド:"
    Write-Host "  .\ledger.ps1 add 2026-01    - 対話的に仕訳を追加"
    Write-Host "  .\ledger.ps1 web [MONTH]    - ブラウザで帳簿を閲覧（http://localhost:5000）"
    Write-Host "                                月指定: その月のファイルに追加"
    Write-Host "                                月未指定: 現在の年の全月を表示、現在の月に追加"
    Write-Host "  .\ledger.ps1 web --view     - 閲覧専用モード（追加不可）"
    Write-Host ""
    Write-Host "高度な使い方:"
    Write-Host "  .\ledger.ps1 exec [args]    - hledger コマンドを直接実行"
    Write-Host "                                例: .\ledger.ps1 exec balance A:現金"
    Write-Host "                                例: .\ledger.ps1 exec -f ledger/accounts.ledger balance"
    Write-Host ""
    Write-Host "開発用コマンド:"
    Write-Host "  .\ledger.ps1 shell          - Dockerコンテナ内のシェルに入る"
    Write-Host "  .\ledger.ps1 build          - Dockerイメージをビルド"
    Write-Host ""
    Write-Host "使用例:"
    Write-Host "  .\ledger.ps1 init-year 2027"
    Write-Host "  .\ledger.ps1 monthly 2026-01"
    Write-Host "  .\ledger.ps1 add 2026-01"
    Write-Host "  .\ledger.ps1 web 2026-01"
    Write-Host "  .\ledger.ps1 web"
    Write-Host "  .\ledger.ps1 web --view"
    Write-Host "  .\ledger.ps1 exec -f ledger/accounts.ledger balance"
}

function Invoke-DockerCompose {
    param([string]$CommandLine)
    $cmd = "docker compose run --rm ledger $CommandLine"
    Write-Host "実行中: $cmd" -ForegroundColor Cyan
    Invoke-Expression $cmd
}

switch ($Command.ToLower()) {
    "help" {
        Show-Help
    }
    "check" {
        Invoke-DockerCompose "node scripts/check-balance.mjs"
    }
    "validate" {
        Invoke-DockerCompose "node scripts/validate-accounts.mjs"
    }
    "init-year" {
        if ($Args.Count -eq 0) {
            Invoke-DockerCompose "node scripts/init-year.mjs"
        } else {
            $year = $Args[0]
            Invoke-DockerCompose "node scripts/init-year.mjs --year=$year"
        }
    }
    "monthly" {
        if ($Args.Count -eq 0) {
            Write-Host "エラー: 月を指定してください（例: 2026-01）" -ForegroundColor Red
            Write-Host "使用例: .\ledger.ps1 monthly 2026-01"
            exit 1
        }
        $month = $Args[0]
        Invoke-DockerCompose "node scripts/monthly-summary.mjs --month $month"
    }
    "yearly" {
        Invoke-DockerCompose "node scripts/yearly-summary.mjs"
    }
    "export" {
        Invoke-DockerCompose "node scripts/export-csv.mjs"
    }
    "add" {
        if ($Args.Count -eq 0) {
            Write-Host "エラー: 月を指定してください（例: 2026-01）" -ForegroundColor Red
            Write-Host "使用例: .\ledger.ps1 add 2026-01"
            exit 1
        }
        $month = $Args[0]
        $yearMonth = $month.Split('-')
        $year = $yearMonth[0]
        $monthNum = $yearMonth[1]
        Write-Host "📝 仕訳を追加: $month" -ForegroundColor Green
        Write-Host "💡 Ctrl+D または Ctrl+C で終了します" -ForegroundColor Yellow
        Write-Host ""
        Invoke-DockerCompose "hledger add -f ledger/accounts.ledger -f ledger/$year/$monthNum.ledger"
    }
    "web" {
        $currentYear = Get-Date -Format yyyy
        $currentMonth = Get-Date -Format MM

        # 引数解析
        if ($Args.Count -gt 0 -and ($Args[0] -eq "--view" -or $Args[0] -eq "-v")) {
            # 閲覧専用モード
            Write-Host "🌐 hledger-web を起動中（閲覧専用モード - ${currentYear}年）..." -ForegroundColor Green
            Write-Host "📖 ブラウザで http://localhost:5000 を開いてください" -ForegroundColor Cyan
            Write-Host "💡 Ctrl+C で終了します" -ForegroundColor Yellow
            Write-Host ""

            # 全ての月次ファイルを読み込む
            $files = "-f ledger/accounts.ledger"
            Get-ChildItem "ledger/$currentYear/*.ledger" -ErrorAction SilentlyContinue | ForEach-Object {
                $files += " -f $($_.FullName)"
            }

            docker compose run --rm --service-ports ledger hledger-web $files --capabilities=view --serve --host=0.0.0.0 --port=5000

        } elseif ($Args.Count -gt 0) {
            # 月が指定された場合
            $month = $Args[0]
            $yearMonth = $month.Split('-')
            $year = $yearMonth[0]
            $monthNum = $yearMonth[1]
            Write-Host "🌐 hledger-web を起動中（追加先: ledger/$year/$monthNum.ledger）..." -ForegroundColor Green
            Write-Host "📖 ブラウザで http://localhost:5000 を開いてください" -ForegroundColor Cyan
            Write-Host "💡 Ctrl+C で終了します" -ForegroundColor Yellow
            Write-Host ""

            docker compose run --rm --service-ports ledger hledger-web -f "ledger/$year/$monthNum.ledger" -f ledger/accounts.ledger --serve --host=0.0.0.0 --port=5000

        } else {
            # 月指定なし - 現在の年の全ファイルを読み込み、現在の月に追加
            Write-Host "🌐 hledger-web を起動中（追加先: ledger/$currentYear/$currentMonth.ledger）..." -ForegroundColor Green
            Write-Host "📖 ${currentYear}年の全ての月を表示します" -ForegroundColor Cyan
            Write-Host "📝 閲覧専用にするには: .\ledger.ps1 web --view" -ForegroundColor Yellow
            Write-Host "💡 Ctrl+C で終了します" -ForegroundColor Yellow
            Write-Host ""

            # 現在の月のファイルを最初に指定（追加先になる）
            $files = "-f ledger/$currentYear/$currentMonth.ledger"

            # 他の月のファイルを追加
            Get-ChildItem "ledger/$currentYear/*.ledger" -ErrorAction SilentlyContinue | Where-Object {
                $_.Name -ne "$currentMonth.ledger"
            } | ForEach-Object {
                $files += " -f $($_.FullName)"
            }

            # accounts.ledger を最後に追加
            $files += " -f ledger/accounts.ledger"

            docker compose run --rm --service-ports ledger hledger-web $files --serve --host=0.0.0.0 --port=5000
        }
    }
    "exec" {
        $ledgerArgs = $Args -join " "
        if ($ledgerArgs -eq "") {
            Write-Host "エラー: hledger コマンドの引数を指定してください" -ForegroundColor Red
            Write-Host "使用例: .\ledger.ps1 exec balance A:現金"
            Write-Host "使用例: .\ledger.ps1 exec -f ledger/accounts.ledger balance"
            exit 1
        } else {
            Invoke-DockerCompose "hledger $ledgerArgs"
        }
    }
    "ledger" {
        # 互換性のために残す（exec へのエイリアス）
        $ledgerArgs = $Args -join " "
        if ($ledgerArgs -eq "") {
            Write-Host "エラー: hledger コマンドの引数を指定してください" -ForegroundColor Red
            Write-Host "使用例: .\ledger.ps1 exec balance A:現金"
            Write-Host "ヒント: 'ledger' コマンドは非推奨です。代わりに 'exec' を使用してください。"
            exit 1
        } else {
            Write-Host "ヒント: 'ledger' コマンドは非推奨です。代わりに 'exec' を使用してください。" -ForegroundColor Yellow
            Invoke-DockerCompose "hledger $ledgerArgs"
        }
    }
    "shell" {
        Invoke-DockerCompose "sh"
    }
    "build" {
        Write-Host "Dockerイメージをビルド中..." -ForegroundColor Cyan
        docker compose build
    }
    default {
        Write-Host "エラー: 不明なコマンド '$Command'" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}
