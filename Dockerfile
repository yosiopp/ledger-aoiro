FROM node:20-bookworm-slim

# ledger インストール
RUN apt-get update \
  && apt-get install -y --no-install-recommends ledger ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリ
WORKDIR /app

# Node.js 依存関係（将来拡張用）
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# スクリプト類
COPY scripts ./scripts

# ledger テンプレート（任意）
COPY ledger ./ledger
COPY templates ./templates

ENV NODE_ENV=production

# デフォルトはヘルプ表示
CMD ["node", "scripts/yearly-summary.mjs", "--help"]
