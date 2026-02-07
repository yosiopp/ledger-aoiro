// 勘定科目チェック
// 取引ファイルで使用されている勘定科目が accounts.ledger で定義されているかを検証

import { execSync } from 'child_process';
import { extractDefinedAccounts, getTransactionFiles } from './lib/ledger-utils.mjs';

/**
 * すべての ledger ファイルから使用されている勘定科目を抽出
 */
function extractUsedAccounts() {
  const files = getTransactionFiles();

  if (files.length === 0) {
    return new Set();
  }

  const accounts = new Set();

  try {
    // ledger accounts コマンドを使用して使用されている勘定科目を取得
    const fileArgs = files.map(f => `-f ${f}`).join(' ');
    const command = `ledger ${fileArgs} accounts`;
    const output = execSync(command, { encoding: 'utf-8' });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      const account = line.trim();
      if (account) {
        accounts.add(account);
      }
    }
  } catch (error) {
    // エラーがあってもパース可能なら続行
    if (error.stdout) {
      const lines = error.stdout.trim().split('\n');
      for (const line of lines) {
        const account = line.trim();
        if (account) {
          accounts.add(account);
        }
      }
    }
  }

  return accounts;
}

/**
 * 使用されている勘定科目が定義されているか検証
 */
function validateAccounts() {
  console.log('📋 勘定科目の検証を開始します...\n');

  const defined = extractDefinedAccounts();
  console.log(`✅ 定義されている勘定科目: ${defined.size}個`);

  const used = extractUsedAccounts();
  console.log(`📝 使用されている勘定科目: ${used.size}個\n`);

  if (used.size === 0) {
    console.log('ℹ️  取引ファイルが見つかりませんでした');
    return true;
  }

  // 未定義の勘定科目をチェック
  const undefined = [];

  for (const account of used) {
    let isDefined = false;

    // 完全一致または親勘定科目が定義されているかチェック
    for (const def of defined) {
      if (account === def || account.startsWith(def + ':')) {
        isDefined = true;
        break;
      }
    }

    if (!isDefined) {
      undefined.push(account);
    }
  }

  if (undefined.length > 0) {
    console.error('❌ 未定義の勘定科目が見つかりました:\n');
    for (const account of undefined.sort()) {
      console.error(`   - ${account}`);
    }
    console.error('\n💡 これらの勘定科目を ledger/accounts.ledger に追加してください');
    return false;
  }

  console.log('✅ すべての勘定科目が正しく定義されています！');
  return true;
}

// 実行
const isValid = validateAccounts();
process.exit(isValid ? 0 : 1);
