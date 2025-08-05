# NoraneCode

Claude Code用のModel Context Protocol (MCP) サーバーコレクションです。

## 📦 パッケージ一覧

### [@noranekob/fal-mcp-server](./NoraneCode/fal_mcp)
ローカルのファイルをfal.aiにアップロードしてリモートURLを取得

```bash
npx @noranekob/fal-mcp-server
```

### [@noranekob/nasa-mcp-server](./NoraneCode/nasa_mcp)
NASA APIで宇宙画像や火星探査機の写真をダウンロード

```bash
npx @noranekob/nasa-mcp-server
```

### [mcp-line-notify](./NoraneCode/line-mcp)
ClaudeからLINEメッセージを送信

```bash
npx mcp-line-notify
```

## 🚀 クイックスタート

### 1. Claude Codeの設定

`~/.claude/settings.json` に追加:

```json
{
  "mcpServers": {
    "fal-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/fal-mcp-server"],
      "env": {
        "FAL_KEY": "your-fal-api-key"
      }
    },
    "nasa-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/nasa-mcp-server"],
      "env": {
        "NASA_API_KEY": "your-nasa-api-key"
      }
    },
    "line-notify": {
      "command": "npx",
      "args": ["mcp-line-notify"],
      "env": {
        "LINE_CHANNEL_ACCESS_TOKEN": "your-line-channel-access-token",
        "LINE_USER_ID": "your-line-user-id"
      }
    }
  }
}
```

### 2. APIキーの取得

- **FAL API**: [fal.ai](https://fal.ai) でサインアップ
- **NASA API**: [api.nasa.gov](https://api.nasa.gov/) で無料取得
- **LINE API**: [LINE Developers Console](https://developers.line.biz/console/) でMessaging API設定

## 📖 詳細ドキュメント

各MCPサーバーの詳細は個別のREADMEを参照してください:

- [FAL MCP Server ドキュメント](./NoraneCode/fal_mcp/README.md)
- [NASA MCP Server ドキュメント](./NoraneCode/nasa_mcp/README.md)
- [LINE MCP Server ドキュメント](./NoraneCode/line-mcp/README.md)

## 🖥️ プラットフォーム対応

- ✅ Windows
- ✅ macOS
- ✅ Linux

## 📋 必要環境

- Node.js 18.0.0+
- Python 3.x (FAL MCP Serverのみ)

## 📄 ライセンス

MIT

## 👤 作者

のらねこび(noranekob)

## 🔗 リンク

- [GitHub](https://github.com/noranekob/NoraneCode)
- [Issues](https://github.com/noranekob/NoraneCode/issues)