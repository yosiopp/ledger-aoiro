# PowerShell script for ledger-aoiro (Windows用)
# 使い方: lgr <command> [options]

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
    Write-Host "  lgr check          - 貸借一致チェックを実行"
    Write-Host "  lgr validate       - 勘定科目の定義チェック"
    Write-Host "  lgr begin [year]   - 年次ディレクトリと12ヶ月分のファイルを作成"
    Write-Host "  lgr monthly 2026-01 - 月次集計を実行"
    Write-Host "  lgr yearly [year]  - 年次集計を実行（年指定なしは現在の年）"
    Write-Host "  lgr export         - CSV形式でエクスポート"
    Write-Host ""
    Write-Host "仕訳入力コマンド:"
    Write-Host "  lgr add 2026-01    - 対話的に仕訳を追加"
    Write-Host "  lgr add 2026-01 2026/01/15 `"説明`" `"勘定科目1`" `"金額1`" `"勘定科目2`" [金額2]"
    Write-Host "                     - 非対話モードで仕訳を追加"
    Write-Host "  lgr web [MONTH]    - ブラウザで帳簿を閲覧（http://localhost:5000）"
    Write-Host "                       月指定: その月のファイルに追加"
    Write-Host "                       月未指定: 現在の年の全月を表示、現在の月に追加"
    Write-Host "  lgr web --view     - 閲覧専用モード（追加不可）"
    Write-Host ""
    Write-Host "高度な使い方:"
    Write-Host "  lgr exec [args]    - hledger コマンドを直接実行"
    Write-Host "                       例: lgr exec balance A:現金"
    Write-Host "                       例: lgr exec -f ledger/accounts.ledger balance"
    Write-Host ""
    Write-Host "開発用コマンド:"
    Write-Host "  lgr shell          - Dockerコンテナ内のシェルに入る"
    Write-Host "  lgr build          - Dockerイメージをビルド"
    Write-Host ""
    Write-Host "使用例:"
    Write-Host "  lgr begin 2027"
    Write-Host "  lgr monthly 2026-01"
    Write-Host "  lgr yearly 2026"
    Write-Host "  lgr add 2026-01"
    Write-Host "  lgr add 2026-01 2026/01/15 `"事務用品購入`" `"X:消耗品費`" `"3000 JPY`" `"A:銀行:事業用`""
    Write-Host "  lgr web 2026-01"
    Write-Host "  lgr web"
    Write-Host "  lgr web --view"
    Write-Host "  lgr exec -f ledger/accounts.ledger balance"
}

function Invoke-DockerCompose {
    param([string]$CommandLine)
    $cmd = "docker compose run --rm ledger-aoiro $CommandLine"
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
    "begin" {
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
            Write-Host "使用例: lgr monthly 2026-01"
            exit 1
        }
        $month = $Args[0]
        Invoke-DockerCompose "node scripts/monthly-summary.mjs --month $month"
    }
    "yearly" {
        if ($Args.Count -eq 0) {
            Invoke-DockerCompose "node scripts/yearly-summary.mjs"
        } else {
            $year = $Args[0]
            Invoke-DockerCompose "node scripts/yearly-summary.mjs --year $year"
        }
    }
    "export" {
        Invoke-DockerCompose "node scripts/export-csv.mjs"
    }
    "add" {
        if ($Args.Count -eq 0) {
            Write-Host "エラー: 月を指定してください（例: 2026-01）" -ForegroundColor Red
            Write-Host "使用例（対話モード）: lgr add 2026-01"
            Write-Host "使用例（非対話モード）: lgr add 2026-01 2026/01/15 `"説明`" `"勘定科目1`" `"金額1`" `"勘定科目2`" [金額2]"
            exit 1
        }
        $month = $Args[0]
        $yearMonth = $month.Split('-')
        $year = $yearMonth[0]
        $monthNum = $yearMonth[1]
        $ledgerFile = "ledger/$year/$monthNum.ledger"

        # 非対話モード：引数が6個以上ある場合
        if ($Args.Count -ge 6) {
            $date = $Args[1]
            $description = $Args[2]
            $account1 = $Args[3]
            $amount1 = $Args[4]
            $account2 = $Args[5]
            $amount2 = if ($Args.Count -ge 7) { $Args[6] } else { "" }

            Write-Host "📝 仕訳を追加（非対話モード）: $ledgerFile" -ForegroundColor Green
            Write-Host ""

            # 仕訳を作成
            $entry = "$date * $description`n    $account1    $amount1`n    $account2"
            if ($amount2 -ne "") {
                $entry += "    $amount2"
            }

            # ファイルに追記
            Add-Content -Path $ledgerFile -Value "`n$entry"

            Write-Host "✅ 仕訳を追加しました：" -ForegroundColor Green
            Write-Host ""
            Write-Host $entry
            Write-Host ""

            # 検証を実行
            Write-Host "🔍 勘定科目を検証中..." -ForegroundColor Cyan
            & .\lgr validate
            if ($LASTEXITCODE -ne 0) { exit 1 }
            Write-Host ""
            Write-Host "⚖️  貸借バランスを確認中..." -ForegroundColor Cyan
            & .\lgr check
            if ($LASTEXITCODE -ne 0) { exit 1 }

        } else {
            # 対話モード
            Write-Host "📝 仕訳を追加: $month" -ForegroundColor Green
            Write-Host "💡 Ctrl+D または Ctrl+C で終了します" -ForegroundColor Yellow
            Write-Host ""
            Invoke-DockerCompose "hledger add -f ledger/accounts.ledger -f ledger/$year/$monthNum.ledger"
        }
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

            docker compose run --rm --service-ports ledger-aoiro hledger-web $files --capabilities=view --serve --host=0.0.0.0 --port=5000

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

            docker compose run --rm --service-ports ledger-aoiro hledger-web -f "ledger/$year/$monthNum.ledger" -f ledger/accounts.ledger --serve --host=0.0.0.0 --port=5000

        } else {
            # 月指定なし - 現在の年の全ファイルを読み込み、現在の月に追加
            Write-Host "🌐 hledger-web を起動中（追加先: ledger/$currentYear/$currentMonth.ledger）..." -ForegroundColor Green
            Write-Host "📖 ${currentYear}年の全ての月を表示します" -ForegroundColor Cyan
            Write-Host "📝 閲覧専用にするには: lgr web --view" -ForegroundColor Yellow
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

            docker compose run --rm --service-ports ledger-aoiro hledger-web $files --serve --host=0.0.0.0 --port=5000
        }
    }
    "exec" {
        $ledgerArgs = $Args -join " "
        if ($ledgerArgs -eq "") {
            Write-Host "エラー: hledger コマンドの引数を指定してください" -ForegroundColor Red
            Write-Host "使用例: lgr exec balance A:現金"
            Write-Host "使用例: lgr exec -f ledger/accounts.ledger balance"
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
            Write-Host "使用例: lgr exec balance A:現金"
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
