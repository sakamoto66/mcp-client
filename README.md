[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# mcp-client

---

## 概要

`mcp-client` は Model Context Protocol (MCP) に対応したクライアントです。複数のAIプロバイダーやツールと連携し、MCPサーバーを通じてさまざまなAI機能を利用できます。

---

## 主な機能

- 複数のAIプロバイダー（例: OpenAI, Anthropic など）や外部ツールの利用
- MCPサーバーとの安全な通信
- コマンドラインからの簡単な操作

---

## インストール方法

Node.js (16以上) が必要です。

```sh
npm install
dependencies
```

---

## 使い方

1. 設定ファイル（`config.js` など）でMCPサーバーや利用したいツール・プロバイダーを設定します。
2. 必要な環境変数（APIキー等）を設定します。
3. 以下のコマンドでビルド・起動します。

```sh
npm run build
npm start
```

---

## 環境変数例

- `GITHUB_PERSONAL_ACCESS_TOKEN` : GitHub連携を利用する場合に必要
- 各AIプロバイダーやMCPサーバーに応じたAPIキーやエンドポイント

---

## よくある質問

- 設定や利用方法の詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) もご参照ください。
- 開発・コントリビュート方法は [CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

---

## ライセンス

MIT
