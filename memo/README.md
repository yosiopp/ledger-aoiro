# memo/ ディレクトリについて

このディレクトリは、会計記録の判断根拠や背景情報を記録するためのものです。

## ledgerとmemoの責務分担

- **ledger/** = 会計の事実（What happened）
- **memo/** = 判断の理由（Why we recorded it this way）

## ファイル構成例

```
memo/
└── 2026/               # 年別ディレクトリ
    ├── 01/             # 月別ディレクトリ
    │   ├── receipt-001.md
    │   └── receipt-002.md
    └── 02/
        └── receipt-003.md
```

## テンプレート

新しいメモファイルを作成する際は、[../templates/receipt.memo.tpl](../templates/receipt.memo.tpl) をコピーして使用できます。

## 注意事項

このディレクトリは任意ですが、税務調査時に「なぜその判断をしたか」を説明できると有利です。
