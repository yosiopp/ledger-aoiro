@echo off
REM ledger-aoiro Windows バッチラッパー
REM PowerShell スクリプトを呼び出す

REM スクリプトのディレクトリを取得
set SCRIPT_DIR=%~dp0

REM ledger.ps1 を実行（すべての引数を渡す）
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%ledger.ps1" %*
