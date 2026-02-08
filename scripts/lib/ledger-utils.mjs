// hledger 操作の共通ユーティリティ

import { execSync } from 'child_process';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 定数（テスト用に上書き可能）
export let LEDGER_DIR = 'ledger';
export let ACCOUNTS_FILE = join(LEDGER_DIR, 'accounts.ledger');

/**
 * テスト用: LEDGER_DIR を変更する
 * @param {string} dir - 新しい ledger ディレクトリパス
 */
export function __setLedgerDir(dir) {
  LEDGER_DIR = dir;
  ACCOUNTS_FILE = join(dir, 'accounts.ledger');
}

/**
 * テスト用: LEDGER_DIR をリセットする
 */
export function __resetLedgerDir() {
  LEDGER_DIR = 'ledger';
  ACCOUNTS_FILE = join(LEDGER_DIR, 'accounts.ledger');
}

/**
 * すべての ledger ファイルを取得（年別ディレクトリ構造に対応）
 * @returns {string[]} ledger ファイルのパスの配列
 */
export function getAllLedgerFiles() {
  const files = [];

  // ルートディレクトリの ledger ファイル（accounts.ledger など）
  const rootFiles = readdirSync(LEDGER_DIR)
    .filter(f => f.endsWith('.ledger'))
    .map(f => join(LEDGER_DIR, f));
  files.push(...rootFiles);

  // 年別ディレクトリの ledger ファイル（ledger/YYYY/*.ledger）
  const entries = readdirSync(LEDGER_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) {
      const yearDir = join(LEDGER_DIR, entry.name);
      const yearFiles = readdirSync(yearDir)
        .filter(f => f.endsWith('.ledger'))
        .map(f => join(yearDir, f));
      files.push(...yearFiles);
    }
  }

  return files;
}

/**
 * 指定年度の ledger ファイルを取得（年別ディレクトリ構造：ledger/YYYY/*.ledger）
 * @param {string} year - 年度 (例: "2026")
 * @returns {string[]} ledger ファイルのパスの配列
 */
export function getYearLedgerFiles(year) {
  const files = [];

  // accounts.ledger は常に含める
  if (existsSync(ACCOUNTS_FILE)) {
    files.push(ACCOUNTS_FILE);
  }

  // 指定年度ディレクトリの全ファイル（ledger/YYYY/*.ledger）
  // ※ opening.ledger, closing.ledger, 月次ファイルをすべて含む
  const yearDir = join(LEDGER_DIR, year);
  if (existsSync(yearDir)) {
    const yearFiles = readdirSync(yearDir)
      .filter(f => f.endsWith('.ledger'))
      .map(f => join(yearDir, f))
      .sort();
    files.push(...yearFiles);
  }

  return files;
}

/**
 * 指定月に関連する ledger ファイルを取得（年別ディレクトリ構造：ledger/YYYY/MM.ledger）
 * @param {string} month - 月 (例: "2026-01")
 * @returns {string[]} ledger ファイルのパスの配列
 */
export function getMonthLedgerFiles(month) {
  const files = [];

  // accounts.ledger は常に含める
  if (existsSync(ACCOUNTS_FILE)) {
    files.push(ACCOUNTS_FILE);
  }

  // 年と月を分解
  const [year, mon] = month.split('-');

  // 指定年度の opening.ledger（期首残高）
  const openingFile = join(LEDGER_DIR, year, 'opening.ledger');
  if (existsSync(openingFile)) {
    files.push(openingFile);
  }

  // 指定月のファイル（ledger/YYYY/MM.ledger）
  const monthFile = join(LEDGER_DIR, year, `${mon}.ledger`);
  if (existsSync(monthFile)) {
    files.push(monthFile);
  }

  // 指定月より前の月次ファイルも含める（累計を見るため）
  const [targetYear, targetMonth] = month.split('-').map(Number);

  // 年別ディレクトリを探索
  const entries = readdirSync(LEDGER_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) {
      const yearNum = parseInt(entry.name, 10);
      const yearDir = join(LEDGER_DIR, entry.name);

      // 対象年より前の年、または対象年の場合は対象月より前の月
      if (yearNum <= targetYear) {
        const monthFiles = readdirSync(yearDir)
          .filter(f => /^\d{2}\.ledger$/.test(f))
          .map(f => join(yearDir, f));

        for (const file of monthFiles) {
          const filename = file.split('/').pop();
          const monthNum = parseInt(filename.replace('.ledger', ''), 10);

          // 過去のファイルのみ追加（重複チェック）
          if (yearNum < targetYear || (yearNum === targetYear && monthNum < targetMonth)) {
            if (!files.includes(file)) {
              files.push(file);
            }
          }
        }
      }
    }
  }

  return files;
}

/**
 * 年度または月を指定して ledger ファイルを取得（年別ディレクトリ構造に対応）
 * @param {Object} options - オプション
 * @param {string} [options.year] - 年度
 * @param {string} [options.month] - 月（YYYY-MM 形式）
 * @returns {string[]} ledger ファイルのパスの配列
 */
export function getLedgerFiles(options = {}) {
  const { year, month } = options;

  const files = [];

  // accounts.ledger は常に含める
  if (existsSync(ACCOUNTS_FILE)) {
    files.push(ACCOUNTS_FILE);
  }

  if (month) {
    // 年と月を分解
    const [y, m] = month.split('-');

    // 該当年度の opening.ledger を含める
    const openingFile = join(LEDGER_DIR, y, 'opening.ledger');
    if (existsSync(openingFile)) {
      files.push(openingFile);
    }

    // 特定月のみ（ledger/YYYY/MM.ledger）
    const monthFile = join(LEDGER_DIR, y, `${m}.ledger`);
    if (existsSync(monthFile)) {
      files.push(monthFile);
    }
  } else if (year) {
    // 年度全体（ledger/YYYY/*.ledger）
    const yearDir = join(LEDGER_DIR, year);
    if (existsSync(yearDir)) {
      const yearFiles = readdirSync(yearDir)
        .filter(f => f.endsWith('.ledger'))
        .map(f => join(yearDir, f))
        .sort();
      files.push(...yearFiles);
    }
  } else {
    // すべて（年別ディレクトリから探索）
    const entries = readdirSync(LEDGER_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) {
        const yearDir = join(LEDGER_DIR, entry.name);
        const yearFiles = readdirSync(yearDir)
          .filter(f => f.endsWith('.ledger'))
          .map(f => join(yearDir, f))
          .sort();
        files.push(...yearFiles);
      }
    }
  }

  return files;
}

/**
 * 取引ファイル（accounts.ledger 以外）を取得（年別ディレクトリ構造に対応）
 * @returns {string[]} ledger ファイルのパスの配列
 */
export function getTransactionFiles() {
  const files = [];

  // ルートディレクトリの取引ファイル（accounts.ledger 以外）
  const rootFiles = readdirSync(LEDGER_DIR)
    .filter(f => f.endsWith('.ledger') && f !== 'accounts.ledger')
    .map(f => join(LEDGER_DIR, f));
  files.push(...rootFiles);

  // 年別ディレクトリの取引ファイル（ledger/YYYY/*.ledger）
  const entries = readdirSync(LEDGER_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && /^\d{4}$/.test(entry.name)) {
      const yearDir = join(LEDGER_DIR, entry.name);
      const yearFiles = readdirSync(yearDir)
        .filter(f => f.endsWith('.ledger'))
        .map(f => join(yearDir, f));
      files.push(...yearFiles);
    }
  }

  return files;
}

/**
 * accounts.ledger から定義されている勘定科目を抽出
 * @returns {Set<string>} 定義されている勘定科目のセット
 */
export function extractDefinedAccounts() {
  const content = readFileSync(ACCOUNTS_FILE, 'utf-8');
  const accounts = new Set();

  // "account " で始まる行を抽出（コメント行を除く）
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('account ') && !trimmed.startsWith(';')) {
      // "account " の後の勘定科目名を抽出（コメント ; 以降を除く）
      const account = trimmed
        .replace(/^account\s+/, '')
        .split(';')[0]  // ; 以降のコメントを除去
        .trim();
      accounts.add(account);
    }
  }

  return accounts;
}

/**
 * ledger コマンドを実行
 * @param {string[]} files - ledger ファイルのパス配列
 * @param {string} command - ledger サブコマンド（balance, register など）
 * @param {Object} options - オプション
 * @param {string} [options.begin] - 開始日
 * @param {string} [options.end] - 終了日
 * @param {number} [options.depth] - 深さ
 * @param {string[]} [options.accounts] - 対象勘定科目
 * @param {string[]} [options.flags] - 追加フラグ
 * @returns {string} コマンド実行結果
 */
export function runLedgerCommand(files, command, options = {}) {
  const { begin, end, depth, accounts = [], flags = [] } = options;

  const fileArgs = files.map(f => `-f ${f}`).join(' ');
  const accountArgs = accounts.join(' ');

  let cmd = `ledger ${fileArgs} ${command} ${accountArgs}`;

  if (begin) {
    cmd += ` --begin ${begin}`;
  }

  if (end) {
    cmd += ` --end ${end}`;
  }

  if (depth) {
    cmd += ` --depth ${depth}`;
  }

  if (flags.length > 0) {
    cmd += ` ${flags.join(' ')}`;
  }

  return execSync(cmd.trim(), { encoding: 'utf-8' });
}

/**
 * コマンドライン引数から年度を取得
 * @param {string[]} args - プロセス引数
 * @returns {string} 年度（指定がなければ今年）
 */
export function getTargetYear(args = process.argv.slice(2)) {
  const yearIndex = args.indexOf('--year');

  if (yearIndex >= 0 && args[yearIndex + 1]) {
    return args[yearIndex + 1];
  }

  // 指定がなければ今年
  return new Date().getFullYear().toString();
}

/**
 * コマンドライン引数から月を取得
 * @param {string[]} args - プロセス引数
 * @returns {string} 月（YYYY-MM 形式、指定がなければ今月）
 */
export function getTargetMonth(args = process.argv.slice(2)) {
  const monthIndex = args.indexOf('--month');

  if (monthIndex >= 0 && args[monthIndex + 1]) {
    return args[monthIndex + 1];
  }

  // 指定がなければ今月
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * ファイルリストを表示
 * @param {string[]} files - ファイルパスの配列
 */
export function printFileList(files) {
  console.log(`📁 対象ファイル: ${files.length}個`);
  files.forEach(f => console.log(`   - ${f}`));
  console.log();
}

/**
 * 指定月の次の月の1日を取得（ledger の --end オプション用）
 * @param {string} month - 月（YYYY-MM 形式）
 * @returns {string} 次の月の1日（YYYY-MM-DD 形式）
 */
export function getNextMonthFirstDay(month) {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon, 1); // mon is 0-indexed, so this gives us the next month
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}-01`;
}

/**
 * 指定年の次の年の1月1日を取得（ledger の --end オプション用）
 * @param {string} year - 年（YYYY 形式）
 * @returns {string} 次の年の1月1日（YYYY-MM-DD 形式）
 */
export function getNextYearFirstDay(year) {
  const nextYear = parseInt(year, 10) + 1;
  return `${nextYear}-01-01`;
}
