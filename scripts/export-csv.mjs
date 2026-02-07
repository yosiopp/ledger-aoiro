// 会計ソフト/Excel用
// 取引データを CSV 形式でエクスポート

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { getLedgerFiles, printFileList, getNextMonthFirstDay, getNextYearFirstDay } from './lib/ledger-utils.mjs';

/**
 * コマンドライン引数を解析
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    year: null,
    month: null,
    output: 'transactions.csv',
    format: 'csv' // csv または register
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year' && args[i + 1]) {
      options.year = args[i + 1];
      i++;
    } else if (args[i] === '--month' && args[i + 1]) {
      options.month = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      options.format = args[i + 1];
      i++;
    }
  }

  // デフォルトは今年
  if (!options.year && !options.month) {
    options.year = new Date().getFullYear().toString();
  }

  return options;
}

/**
 * hledger の register コマンドを CSV 形式に変換
 */
function convertToCsv(registerOutput) {
  const lines = registerOutput.trim().split('\n');
  const csvLines = [];

  // ヘッダー
  csvLines.push('日付,勘定科目,説明,金額,累計');

  for (const line of lines) {
    if (!line.trim()) continue;

    // hledger register の出力形式をパース
    // 例: 2024/01/15 開業資金        Assets:Bank:Business      100,000 JPY  100,000 JPY
    const match = line.match(/^(\S+)\s+(.+?)\s{2,}(\S+(?::\S+)*)\s+(-?[\d,]+\s+\S+)\s+(-?[\d,]+\s+\S+)$/);

    if (match) {
      const [, date, description, account, amount, total] = match;

      // CSV エスケープ（説明にカンマや引用符が含まれる可能性）
      const escapeCsv = (str) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      csvLines.push([
        date.replace(/\//g, '-'),
        escapeCsv(account),
        escapeCsv(description.trim()),
        amount.trim(),
        total.trim()
      ].join(','));
    }
  }

  return csvLines.join('\n');
}

/**
 * CSV エクスポートを実行
 */
function exportCsv(options) {
  const { year, month, output, format } = options;

  console.log('📤 CSV エクスポートを開始します...\n');

  const files = getLedgerFiles({ year, month });

  if (files.length === 0) {
    console.log('ℹ️  ledger ファイルが見つかりませんでした');
    return;
  }

  printFileList(files);

  const fileArgs = files.map(f => `-f ${f}`).join(' ');

  try {
    // hledger register コマンドで全取引を取得
    let beginArg = '';
    let endArg = '';

    if (month) {
      beginArg = `--begin ${month}-01`;
      endArg = `--end ${getNextMonthFirstDay(month)}`;
    } else if (year) {
      beginArg = `--begin ${year}-01-01`;
      endArg = `--end ${getNextYearFirstDay(year)}`;
    }

    const command = `hledger ${fileArgs} register ${beginArg} ${endArg}`.trim();

    console.log(`🔍 実行コマンド: ${command}\n`);

    const output_data = execSync(command, { encoding: 'utf-8' });

    if (!output_data.trim()) {
      console.log('ℹ️  取引データがありません');
      return;
    }

    if (format === 'register') {
      // register 形式のまま出力
      writeFileSync(output, output_data);
      console.log(`✅ エクスポート完了: ${output}`);
      console.log(`   形式: hledger register 形式`);
    } else {
      // CSV 形式に変換
      const csv = convertToCsv(output_data);
      writeFileSync(output, csv);
      console.log(`✅ エクスポート完了: ${output}`);
      console.log(`   形式: CSV`);

      const lineCount = csv.split('\n').length - 1;
      console.log(`   取引件数: ${lineCount}件`);
    }

    console.log(`\n💡 Excel や Google スプレッドシートで開けます`);

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    process.exit(1);
  }
}

// 実行
console.log('📊 hledger CSV エクスポートツール\n');

const options = parseArgs();

if (options.month) {
  console.log(`📅 対象期間: ${options.month}`);
} else if (options.year) {
  console.log(`📅 対象期間: ${options.year}年度`);
} else {
  console.log(`📅 対象期間: すべて`);
}

console.log(`💾 出力ファイル: ${options.output}`);
console.log();

exportCsv(options);
