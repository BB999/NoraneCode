# NoraneCode MCP サーバー

Claude Code用のModel Context Protocol (MCP) サーバーのコレクションです。

## 🎨 FAL MCP Server

画像をfal.aiにアップロードしてリモートURLを取得できるMCPサーバーです。

### インストール

```bash
npx @noranekob/fal-mcp-server
```

### セットアップ

1. [fal.ai](https://fal.ai) でAPIキーを取得
2. Python環境に fal-client をインストール: `pip install fal-client`
3. `~/.claude/settings.json` に設定を追加:

```json
{
  "mcpServers": {
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

### 機能

- **画像アップロード**: ローカル画像をfal.aiクラウドに保存
- **リモートURL取得**: AI処理で使える共有URLを生成
- **複数フォーマット対応**: JPG、PNG、GIF、WebP、BMP

### 使用例

```
この画像をfalにアップロードしてリモートURL教えて
```

```
/Users/username/image.jpg をfalにアップロード
```

[詳細なドキュメント →](./NoraneCode/fal_mcp/README.md)

---

## 🚀 NASA MCP Server

宇宙画像や火星探査機の写真をダウンロードできるMCPサーバーです。

### インストール

```bash
npx @noranekob/nasa-mcp-server
```

### セットアップ

1. [NASA API](https://api.nasa.gov/) で無料のAPIキーを取得
2. `~/.claude/settings.json` に設定を追加:

```json
{
  "mcpServers": {
    "nasa-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/nasa-mcp-server"],
      "env": {
        "NASA_API_KEY": "あなたのNASA APIキー"
      }
    }
  }
}
```

### 機能

- **APOD (今日の天体写真)**: 宇宙の美しい画像をダウンロード
- **火星探査機の写真**: Curiosity、Perseveranceなどの写真
- **NASA メディア検索**: 宇宙関連の画像・動画を検索
- **地球近傍天体データ**: 小惑星情報を取得

### 使用例

```
火星の写真を5枚ランダムでダウンロード
```

```
"apollo"で動画を検索して3つダウンロード
```

```
今日のAPODをダウンロード
```

[詳細なドキュメント →](./NoraneCode/nasa_mcp/README.md)

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