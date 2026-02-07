#!/usr/bin/env node

/**
 * 年次ディレクトリと12ヶ月分の月次ファイルを一括作成するスクリプト
 *
 * 使用例:
 *   node scripts/init-year.mjs
 *   node scripts/init-year.mjs --year 2027
 */

import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// コマンドライン引数から年度を取得（デフォルトは現在の年）
function parseArgs() {
  const args = process.argv.slice(2);
  const yearArg = args.find(arg => arg.startsWith('--year='));

  if (yearArg) {
    return parseInt(yearArg.split('=')[1], 10);
  }

  // 引数なしの場合は現在の年を使用
  return new Date().getFullYear();
}

// ファイルが存在するかチェック
async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// テンプレートを読み込んで年月を置換
async function loadTemplate(year, month) {
  const templatePath = join(ROOT_DIR, 'templates/monthly.ledger.tpl');

  try {
    let content = await readFile(templatePath, 'utf-8');

    // YYYY/MM プレースホルダーを実際の年月に置換
    const monthStr = month.toString().padStart(2, '0');
    content = content.replace(/YYYY/g, year.toString());
    content = content.replace(/MM/g, monthStr);

    return content;
  } catch (error) {
    // テンプレートが見つからない場合は空のコメントを返す
    console.warn(`⚠️  テンプレートが見つかりません: ${templatePath}`);
    const monthStr = month.toString().padStart(2, '0');
    return `; ledger/${year}/${monthStr}.ledger\n\n`;
  }
}

// opening.ledger または closing.ledger テンプレートを読み込んで年を置換
async function loadYearTemplate(year, templateName) {
  const templatePath = join(ROOT_DIR, `templates/${templateName}.tpl`);

  try {
    let content = await readFile(templatePath, 'utf-8');

    // YYYY プレースホルダーを実際の年に置換
    content = content.replace(/YYYY/g, year.toString());

    return content;
  } catch (error) {
    console.warn(`⚠️  テンプレートが見つかりません: ${templatePath}`);
    return `; ledger/${year}/${templateName}\n\n`;
  }
}

async function main() {
  const year = parseArgs();

  console.log(`📅 ${year}年度の年次ディレクトリを初期化します...\n`);

  // 年次ディレクトリのパス
  const yearDir = join(ROOT_DIR, 'ledger', year.toString());

  // ディレクトリを作成（既に存在する場合はスキップ）
  try {
    await mkdir(yearDir, { recursive: true });
    console.log(`✅ ディレクトリを作成: ledger/${year}/`);
  } catch (error) {
    console.error(`❌ ディレクトリの作成に失敗: ${error.message}`);
    process.exit(1);
  }

  // ファイル作成のカウンター
  let createdCount = 0;
  let skippedCount = 0;

  // opening.ledger と closing.ledger を作成
  console.log('');
  const specialFiles = ['opening.ledger', 'closing.ledger'];
  for (const fileName of specialFiles) {
    const filePath = join(yearDir, fileName);
    const templateName = fileName; // opening.ledger, closing.ledger

    if (await fileExists(filePath)) {
      console.log(`⏭️  スキップ（既存）: ${fileName}`);
      skippedCount++;
      continue;
    }

    try {
      const content = await loadYearTemplate(year, templateName);
      await writeFile(filePath, content, 'utf-8');
      console.log(`✅ 作成: ${fileName}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ ファイル作成失敗 (${fileName}): ${error.message}`);
    }
  }

  // 12ヶ月分のファイルを作成
  console.log('');

  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0');
    const filePath = join(yearDir, `${monthStr}.ledger`);

    // 既存ファイルは上書きしない
    if (await fileExists(filePath)) {
      console.log(`⏭️  スキップ（既存）: ${monthStr}.ledger`);
      skippedCount++;
      continue;
    }

    // テンプレートからファイルを作成
    try {
      const content = await loadTemplate(year, month);
      await writeFile(filePath, content, 'utf-8');
      console.log(`✅ 作成: ${monthStr}.ledger`);
      createdCount++;
    } catch (error) {
      console.error(`❌ ファイル作成失敗 (${monthStr}.ledger): ${error.message}`);
    }
  }

  console.log(`\n🎉 完了！`);
  console.log(`   作成: ${createdCount}ファイル`);
  if (skippedCount > 0) {
    console.log(`   スキップ: ${skippedCount}ファイル（既存）`);
  }
  console.log(`\n次のステップ:`);
  console.log(`   1. ledger/${year}/opening.ledger - 期首残高を記入`);
  console.log(`   2. ledger/${year}/MM.ledger - 各月の取引を記帳`);
  console.log(`   3. ledger/${year}/closing.ledger - 期末に整理仕訳を記入`);
}

main().catch(error => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
