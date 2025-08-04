# NoraneCode MCP サーバー

Claude Code用のModel Context Protocol (MCP) サーバーのコレクションです。

## 利用可能なサーバー

### 1. 🚀 NASA MCP Server
NASA APIにアクセスして宇宙画像、火星探査機の写真、動画、地球近傍天体データをダウンロードできます。

**NPMパッケージ:** [@noranekob/nasa-mcp-server](https://www.npmjs.com/package/@noranekob/nasa-mcp-server)

```bash
npx @noranekob/nasa-mcp-server
```

**機能:**
- APOD (今日の天体写真)
- 火星探査機の写真 (Curiosity、Perseveranceなど)
- NASA メディアライブラリ検索
- 地球近傍天体データ

[詳細を見る](./NoraneCode/nasa_mcp/README.md)

### 2. 🎨 FAL MCP Server
画像をfal.aiにアップロードして、AI処理用のリモートURLを取得できます。

**NPMパッケージ:** [@noranekob/fal-mcp-server](https://www.npmjs.com/package/@noranekob/fal-mcp-server)

```bash
npx @noranekob/fal-mcp-server
```

**機能:**
- 画像をfal.aiクラウドストレージにアップロード
- 共有可能なリモートURLを取得
- 一般的な画像形式をサポート

[詳細を見る](./NoraneCode/fal_mcp/README.md)

## インストールと使い方

### 1. APIキーを取得

- **NASA API**: [api.nasa.gov](https://api.nasa.gov/) で無料取得
- **FAL API**: [fal.ai](https://fal.ai) でサインアップ

### 2. Claude Codeの設定

`~/.claude/settings.json` に以下を追加:

```json
{
  "mcpServers": {
    "nasa-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/nasa-mcp-server"],
      "env": {
        "NASA_API_KEY": "あなたのNASA APIキー"
      }
    },
    "fal-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/fal-mcp-server"],
      "env": {
        "FAL_KEY": "あなたのFAL APIキー"
      }
    }
  }
}
```

### 3. 使用方法

設定完了後、Claude Codeで以下のようにお願いするだけ：

```
火星の写真を5枚ランダムでダウンロードして
```

```
この画像をfalにアップロードしてリモートURL教えて
```

```
"apollo"で動画を検索して3つダウンロード
```

## Development

### Local Development

```bash
# Clone repository
git clone https://github.com/noranekob/NoraneCode.git
cd NoraneCode

# NASA MCP Server
cd NoraneCode/nasa_mcp
npm install
npm start

# FAL MCP Server
cd NoraneCode/fal_mcp
npm install
npm start
```

### Publishing Updates

```bash
# From each server directory
npm version patch
npm publish --access public
```

## Requirements

- Node.js 18.0.0 or higher
- Python 3.x (for FAL MCP Server)
- Valid API keys for each service

## License

MIT

## Author

noranekob

## Links

- [GitHub Repository](https://github.com/noranekob/NoraneCode)
- [Report Issues](https://github.com/noranekob/NoraneCode/issues)