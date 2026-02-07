// ledger-utils.mjs のユニットテスト

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import * as ledgerUtils from '../ledger-utils.mjs';

// テスト用の一時ディレクトリ
const TEST_DIR = 'ledger-test-temp';

describe('ledger-utils', () => {
  beforeAll(() => {
    // テスト用のディレクトリ構造を作成（年別ディレクトリ構造）
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    // テスト用の accounts.ledger を作成
    const accountsContent = `; Test accounts
account Assets
account Assets:Bank
account Assets:Cash
account Liabilities
account Liabilities:CreditCard
account Equity
account Equity:OpeningBalances
account Income
account Income:Sales
account Expenses
account Expenses:Rent
`;
    writeFileSync(join(TEST_DIR, 'accounts.ledger'), accountsContent);

    // テスト用の取引ファイルを作成（年別ディレクトリ構造）
    writeFileSync(join(TEST_DIR, 'opening_balance.ledger'), '; Opening balance\n');
    writeFileSync(join(TEST_DIR, 'closing.ledger'), '; Closing entries\n');

    // 年別ディレクトリを作成
    mkdirSync(join(TEST_DIR, '2026'), { recursive: true });
    mkdirSync(join(TEST_DIR, '2025'), { recursive: true });

    // 月次ファイルを年別ディレクトリに作成
    writeFileSync(join(TEST_DIR, '2026', '01.ledger'), '; January transactions\n');
    writeFileSync(join(TEST_DIR, '2026', '02.ledger'), '; February transactions\n');
    writeFileSync(join(TEST_DIR, '2025', '12.ledger'), '; December 2025 transactions\n');
  });

  afterAll(() => {
    // テスト用ディレクトリをクリーンアップ
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // 各テストの前に TEST_DIR を設定
    ledgerUtils.__setLedgerDir(TEST_DIR);
  });

  afterEach(() => {
    // 各テストの後に元に戻す
    ledgerUtils.__resetLedgerDir();
  });

  describe('getAllLedgerFiles', () => {
    it('すべての .ledger ファイルを取得できる', () => {
      const files = ledgerUtils.getAllLedgerFiles();

      // accounts, opening_balance, closing, 2026/01, 2026/02, 2025/12 = 6ファイル
      expect(files).toHaveLength(6);
      expect(files.some(f => f.endsWith('accounts.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2026') && f.endsWith('01.ledger'))).toBe(true);
      expect(files.some(f => f.endsWith('opening_balance.ledger'))).toBe(true);
      expect(files.some(f => f.endsWith('closing.ledger'))).toBe(true);
    });
  });

  describe('extractDefinedAccounts', () => {
    it('accounts.ledger から勘定科目を抽出できる', () => {
      const accounts = ledgerUtils.extractDefinedAccounts();

      expect(accounts.has('Assets')).toBe(true);
      expect(accounts.has('Assets:Bank')).toBe(true);
      expect(accounts.has('Income:Sales')).toBe(true);
      expect(accounts.has('Expenses:Rent')).toBe(true);
      expect(accounts.size).toBeGreaterThan(5);
    });

    it('コメント行は無視される', () => {
      const accounts = ledgerUtils.extractDefinedAccounts();

      // コメント行が勘定科目として抽出されていないことを確認
      const accountsList = Array.from(accounts);
      const hasComment = accountsList.some(acc => acc.includes(';') || acc.includes('Test'));
      expect(hasComment).toBe(false);
    });
  });

  describe('getYearLedgerFiles', () => {
    it('指定年度のファイルを取得できる', () => {
      const files = ledgerUtils.getYearLedgerFiles('2026');

      // accounts.ledger, opening_balance.ledger, 2026/01.ledger, 2026/02.ledger
      expect(files.length).toBeGreaterThanOrEqual(3);
      expect(files.some(f => f.endsWith('accounts.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2026') && f.endsWith('01.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2026') && f.endsWith('02.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2025') && f.endsWith('12.ledger'))).toBe(false);
    });
  });

  describe('getMonthLedgerFiles', () => {
    it('指定月のファイルを取得できる', () => {
      const files = ledgerUtils.getMonthLedgerFiles('2026-02');

      expect(files.some(f => f.endsWith('accounts.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2026') && f.endsWith('02.ledger'))).toBe(true);
      // 2026/01.ledger も含まれる（累計のため）
      expect(files.some(f => f.includes('2026') && f.endsWith('01.ledger'))).toBe(true);
    });

    it('指定月より後の月のファイルは含まれない', () => {
      const files = ledgerUtils.getMonthLedgerFiles('2026-01');

      expect(files.some(f => f.includes('2026') && f.endsWith('02.ledger'))).toBe(false);
    });
  });

  describe('getLedgerFiles', () => {
    it('月を指定すると指定月のファイルが返される', () => {
      const files = ledgerUtils.getLedgerFiles({ month: '2026-01' });

      expect(files.some(f => f.includes('2026') && f.endsWith('01.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2026') && f.endsWith('02.ledger'))).toBe(false);
    });

    it('年を指定すると指定年度のファイルが返される', () => {
      const files = ledgerUtils.getLedgerFiles({ year: '2026' });

      expect(files.some(f => f.includes('2026') && f.endsWith('01.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2026') && f.endsWith('02.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2025') && f.endsWith('12.ledger'))).toBe(false);
    });

    it('指定なしだとすべての月次ファイルが返される', () => {
      const files = ledgerUtils.getLedgerFiles({});

      expect(files.some(f => f.includes('2026') && f.endsWith('01.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2026') && f.endsWith('02.ledger'))).toBe(true);
      expect(files.some(f => f.includes('2025') && f.endsWith('12.ledger'))).toBe(true);
    });
  });

  describe('getTransactionFiles', () => {
    it('accounts.ledger 以外のファイルを取得できる', () => {
      const files = ledgerUtils.getTransactionFiles();

      expect(files.some(f => f.endsWith('accounts.ledger'))).toBe(false);
      expect(files.some(f => f.includes('2026') && f.endsWith('01.ledger'))).toBe(true);
      expect(files.some(f => f.endsWith('opening_balance.ledger'))).toBe(true);
    });
  });

  describe('getTargetYear', () => {
    it('--year 引数から年度を取得できる', () => {
      const year = ledgerUtils.getTargetYear(['--year', '2025', '--other', 'value']);
      expect(year).toBe('2025');
    });

    it('引数がない場合は今年が返される', () => {
      const year = ledgerUtils.getTargetYear([]);
      const currentYear = new Date().getFullYear().toString();
      expect(year).toBe(currentYear);
    });
  });

  describe('getTargetMonth', () => {
    it('--month 引数から月を取得できる', () => {
      const month = ledgerUtils.getTargetMonth(['--month', '2026-03', '--other', 'value']);
      expect(month).toBe('2026-03');
    });

    it('引数がない場合は今月が返される', () => {
      const month = ledgerUtils.getTargetMonth([]);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      expect(month).toBe(currentMonth);
    });
  });

  describe('printFileList', () => {
    it('ファイルリストを出力できる', () => {
      // console.log をモック
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      const files = ['file1.ledger', 'file2.ledger', 'file3.ledger'];
      ledgerUtils.printFileList(files);

      expect(logs[0]).toContain('📁 対象ファイル: 3個');
      expect(logs[1]).toContain('- file1.ledger');
      expect(logs[2]).toContain('- file2.ledger');
      expect(logs[3]).toContain('- file3.ledger');

      // console.log を元に戻す
      console.log = originalLog;
    });
  });

  describe('getNextMonthFirstDay', () => {
    it('通常の月の次の月の1日を取得できる', () => {
      expect(ledgerUtils.getNextMonthFirstDay('2026-01')).toBe('2026-02-01');
      expect(ledgerUtils.getNextMonthFirstDay('2026-06')).toBe('2026-07-01');
      expect(ledgerUtils.getNextMonthFirstDay('2026-11')).toBe('2026-12-01');
    });

    it('12月の次の月は翌年の1月1日になる', () => {
      expect(ledgerUtils.getNextMonthFirstDay('2026-12')).toBe('2027-01-01');
      expect(ledgerUtils.getNextMonthFirstDay('2025-12')).toBe('2026-01-01');
    });

    it('2月の次の月は3月1日になる', () => {
      expect(ledgerUtils.getNextMonthFirstDay('2026-02')).toBe('2026-03-01');
      expect(ledgerUtils.getNextMonthFirstDay('2024-02')).toBe('2024-03-01'); // うるう年
    });

    it('1桁の月でも正しく処理される', () => {
      expect(ledgerUtils.getNextMonthFirstDay('2026-09')).toBe('2026-10-01');
    });
  });

  describe('getNextYearFirstDay', () => {
    it('次の年の1月1日を取得できる', () => {
      expect(ledgerUtils.getNextYearFirstDay('2026')).toBe('2027-01-01');
      expect(ledgerUtils.getNextYearFirstDay('2025')).toBe('2026-01-01');
      expect(ledgerUtils.getNextYearFirstDay('2099')).toBe('2100-01-01');
    });

    it('文字列の年を正しくパースできる', () => {
      expect(ledgerUtils.getNextYearFirstDay('2020')).toBe('2021-01-01');
    });
  });
});
