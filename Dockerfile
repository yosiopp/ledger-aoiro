FROM node:20-bookworm-slim

# hledger と hledger-web のインストール、ロケール設定
RUN apt-get update \
  && apt-get install -y --no-install-recommends hledger hledger-web ca-certificates locales \
  && echo "ja_JP.UTF-8 UTF-8" > /etc/locale.gen \
  && echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen \
  && locale-gen \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# UTF-8 ロケールを設定
ENV LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

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
