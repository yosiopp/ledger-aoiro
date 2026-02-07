// 貸借一致チェック
// ledger の balance コマンドで貸借が一致しているか確認

import { execSync } from 'child_process';
import { getAllLedgerFiles, printFileList } from './lib/ledger-utils.mjs';

/**
 * 貸借バランスをチェック
 */
function checkBalance() {
  console.log('⚖️  貸借バランスのチェックを開始します...\n');

  const files = getAllLedgerFiles();

  if (files.length === 0) {
    console.log('ℹ️  ledger ファイルが見つかりませんでした');
    return true;
  }

  printFileList(files);

  try {
    // ledger balance コマンドで全体のバランスを確認
    const fileArgs = files.map(f => `-f ${f}`).join(' ');
    const command = `ledger ${fileArgs} balance --no-total`;

    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 出力があれば表示
    if (output.trim()) {
      console.log('💰 勘定科目別残高:\n');
      console.log(output);
    }

    console.log('✅ 貸借が一致しています！');
    return true;

  } catch (error) {
    console.error('❌ エラーが発生しました:\n');

    if (error.stderr) {
      console.error(error.stderr);
    }

    if (error.stdout) {
      console.error(error.stdout);
    }

    console.error('\n💡 取引の貸借が一致していない可能性があります');
    console.error('   各取引で借方と貸方の金額が等しいか確認してください');

    return false;
  }
}

// 実行
const isBalanced = checkBalance();
process.exit(isBalanced ? 0 : 1);
