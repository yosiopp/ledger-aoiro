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
    Write-Host "  .\ledger.ps1 monthly 2026-01 - 月次集計を実行"
    Write-Host "  .\ledger.ps1 yearly         - 年次集計を実行"
    Write-Host "  .\ledger.ps1 export         - CSV形式でエクスポート"
    Write-Host ""
    Write-Host "開発用コマンド:"
    Write-Host "  .\ledger.ps1 ledger [args]  - ledger CLIを直接実行"
    Write-Host "  .\ledger.ps1 shell          - Dockerコンテナ内のシェルに入る"
    Write-Host "  .\ledger.ps1 build          - Dockerイメージをビルド"
    Write-Host ""
    Write-Host "使用例:"
    Write-Host "  .\ledger.ps1 monthly 2026-01"
    Write-Host "  .\ledger.ps1 ledger -f ledger/accounts.ledger balance"
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
    "ledger" {
        $ledgerArgs = $Args -join " "
        if ($ledgerArgs -eq "") {
            Invoke-DockerCompose "ledger --version"
        } else {
            Invoke-DockerCompose "ledger $ledgerArgs"
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
