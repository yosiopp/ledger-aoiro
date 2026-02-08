// 月次集計
// 指定月の収支を集計して表示

import { execSync } from 'child_process';
import { getTargetMonth, getMonthLedgerFiles, printFileList, getNextMonthFirstDay } from './lib/ledger-utils.mjs';

/**
 * 月次集計を実行
 */
function monthlySummary(month) {
  console.log(`📊 月次集計: ${month}\n`);

  const files = getMonthLedgerFiles(month);

  if (files.length === 0) {
    console.log('ℹ️  ledger ファイルが見つかりませんでした');
    return;
  }

  printFileList(files);

  const fileArgs = files.map(f => `-f ${f}`).join(' ');
  const endDate = getNextMonthFirstDay(month);

  try {
    // 収益
    console.log('💰 収益 (Revenue)');
    console.log('─'.repeat(60));
    const incomeCmd = `hledger ${fileArgs} balance R: --begin ${month}-01 --end ${endDate} --depth 2`;
    try {
      const income = execSync(incomeCmd, { encoding: 'utf-8' });
      console.log(income || '   (なし)');
    } catch (e) {
      console.log('   (なし)');
    }

    // 費用
    console.log('\n💸 費用 (Expenses)');
    console.log('─'.repeat(60));
    const expensesCmd = `hledger ${fileArgs} balance X: --begin ${month}-01 --end ${endDate} --depth 2`;
    try {
      const expenses = execSync(expensesCmd, { encoding: 'utf-8' });
      console.log(expenses || '   (なし)');
    } catch (e) {
      console.log('   (なし)');
    }

    // 資産
    console.log('\n🏦 資産 (Assets)');
    console.log('─'.repeat(60));
    const assetsCmd = `hledger ${fileArgs} balance A: --depth 2`;
    try {
      const assets = execSync(assetsCmd, { encoding: 'utf-8' });
      console.log(assets || '   (なし)');
    } catch (e) {
      console.log('   (なし)');
    }

    // 負債
    console.log('\n💳 負債 (Liabilities)');
    console.log('─'.repeat(60));
    const liabilitiesCmd = `hledger ${fileArgs} balance L: --depth 2`;
    try {
      const liabilities = execSync(liabilitiesCmd, { encoding: 'utf-8' });
      console.log(liabilities || '   (なし)');
    } catch (e) {
      console.log('   (なし)');
    }

    // 月次の損益
    console.log('\n📈 月次損益');
    console.log('─'.repeat(60));
    const plCmd = `hledger ${fileArgs} balance R: X: --begin ${month}-01 --end ${endDate}`;
    try {
      const pl = execSync(plCmd, { encoding: 'utf-8' });
      console.log(pl);
    } catch (e) {
      console.log('   (計算できません)');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    process.exit(1);
  }
}

// 実行
const month = getTargetMonth();
monthlySummary(month);
