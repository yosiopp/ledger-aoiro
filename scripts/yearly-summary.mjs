// 年次集計（申告用）
// 青色申告決算書に対応した年次の損益計算書・貸借対照表を生成

import { execSync } from 'child_process';
import { getTargetYear, getYearLedgerFiles, printFileList, getNextYearFirstDay } from './lib/ledger-utils.mjs';

/**
 * 年次集計を実行
 */
function yearlySummary(year) {
  console.log('═'.repeat(70));
  console.log(`  青色申告決算書（簡易版） - ${year}年度`);
  console.log('═'.repeat(70));
  console.log();

  const files = getYearLedgerFiles(year);

  if (files.length === 0) {
    console.log('ℹ️  ledger ファイルが見つかりませんでした');
    return;
  }

  printFileList(files);

  const fileArgs = files.map(f => `-f ${f}`).join(' ');
  const beginDate = `${year}-01-01`;
  const endDate = getNextYearFirstDay(year);

  try {
    // ========================================
    // 損益計算書
    // ========================================
    console.log('═'.repeat(70));
    console.log('  損益計算書 (Profit & Loss Statement)');
    console.log('═'.repeat(70));
    console.log();

    // 収益の部
    console.log('【収益の部】');
    console.log('─'.repeat(70));

    console.log('\n💰 売上高');
    const salesCmd = `ledger ${fileArgs} balance Income:Sales --begin ${beginDate} --end ${endDate} --depth 3`;
    try {
      const sales = execSync(salesCmd, { encoding: 'utf-8' });
      console.log(sales || '   0 JPY');
    } catch (e) {
      console.log('   0 JPY');
    }

    console.log('\n💵 その他の収益');
    const otherIncomeCmd = `ledger ${fileArgs} balance Income --begin ${beginDate} --end ${endDate} --depth 3`;
    try {
      const otherIncome = execSync(otherIncomeCmd, { encoding: 'utf-8' });
      console.log(otherIncome || '   0 JPY');
    } catch (e) {
      console.log('   0 JPY');
    }

    // 費用の部
    console.log('\n【費用の部】');
    console.log('─'.repeat(70));

    const expenseCategories = [
      { name: '広告宣伝費', account: 'Expenses:Advertising' },
      { name: '消耗品費', account: 'Expenses:Supplies' },
      { name: '通信費', account: 'Expenses:Communication' },
      { name: '水道光熱費', account: 'Expenses:Utilities' },
      { name: '地代家賃', account: 'Expenses:Rent' },
      { name: '旅費交通費', account: 'Expenses:Travel' },
      { name: '会議費・交際費', account: 'Expenses:Meals' },
      { name: '外注費', account: 'Expenses:Outsourcing' },
      { name: '租税公課', account: 'Expenses:Taxes' },
      { name: '減価償却費', account: 'Expenses:Depreciation' },
    ];

    for (const { name, account } of expenseCategories) {
      console.log(`\n💸 ${name}`);
      const cmd = `ledger ${fileArgs} balance ${account} --begin ${beginDate} --end ${endDate}`;
      try {
        const result = execSync(cmd, { encoding: 'utf-8' });
        console.log(result || '   0 JPY');
      } catch (e) {
        console.log('   0 JPY');
      }
    }

    // 損益
    console.log('\n【当期純損益】');
    console.log('─'.repeat(70));
    const plCmd = `ledger ${fileArgs} balance Income Expenses --begin ${beginDate} --end ${endDate}`;
    try {
      const pl = execSync(plCmd, { encoding: 'utf-8' });
      console.log(pl);
      console.log();
    } catch (e) {
      console.log('   (計算できません)\n');
    }

    // ========================================
    // 貸借対照表
    // ========================================
    console.log('═'.repeat(70));
    console.log('  貸借対照表 (Balance Sheet)');
    console.log('═'.repeat(70));
    console.log();

    // 資産の部
    console.log('【資産の部】');
    console.log('─'.repeat(70));
    const assetsCmd = `ledger ${fileArgs} balance Assets --depth 3`;
    try {
      const assets = execSync(assetsCmd, { encoding: 'utf-8' });
      console.log(assets || '   0 JPY');
    } catch (e) {
      console.log('   0 JPY');
    }

    // 負債の部
    console.log('\n【負債の部】');
    console.log('─'.repeat(70));
    const liabilitiesCmd = `ledger ${fileArgs} balance Liabilities --depth 3`;
    try {
      const liabilities = execSync(liabilitiesCmd, { encoding: 'utf-8' });
      console.log(liabilities || '   0 JPY');
    } catch (e) {
      console.log('   0 JPY');
    }

    // 純資産の部
    console.log('\n【純資産の部】');
    console.log('─'.repeat(70));
    const equityCmd = `ledger ${fileArgs} balance Equity --depth 3`;
    try {
      const equity = execSync(equityCmd, { encoding: 'utf-8' });
      console.log(equity || '   0 JPY');
    } catch (e) {
      console.log('   0 JPY');
    }

    console.log('\n' + '═'.repeat(70));
    console.log('  集計完了');
    console.log('═'.repeat(70));
    console.log();
    console.log('💡 この集計結果をもとに青色申告決算書を作成できます');
    console.log();

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    process.exit(1);
  }
}

// 実行
const year = getTargetYear();
yearlySummary(year);
