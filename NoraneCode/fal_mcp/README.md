# @noranekob/fal-mcp-server

画像をfal.aiにアップロードしてリモートURLを取得するModel Context Protocol (MCP) サーバーです。

## 機能

- 画像をfal.aiクラウドストレージにアップロード
- アップロードした画像の共有可能なリモートURLを取得
- 一般的な画像形式をサポート (JPG、PNG、GIF、WebP、BMP)
- ファイルサイズ検証 (最大100MB)

## インストール

### npxを使用 (推奨)

```bash
# インストール不要、下記のClaude Code設定ファイルに記述するだけで使用可能（下記設定ファイルでは記述済み）
npx @noranekob/fal-mcp-server
```

### グローバルインストール

```bash
npm install -g @noranekob/fal-mcp-server
```

## セットアップ

### 1. fal.ai APIキーを取得

1. [fal.ai](https://fal.ai) でサインアップ
2. ダッシュボードでAPIキーを作成
3. APIキーをコピー

### 2. Claude Codeの設定

Claude Codeの設定ファイル (`~/.claude/settings.json`) に以下を追加:

```json
{
  "mcpServers": {
    "fal-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/fal-mcp-server"],
      "env": {
        "FAL_KEY": "あなたのfal-api-key"
      }
    }
  }
}
```

`あなたのfal-api-key` を実際のfal.ai APIキーに置き換えてください。

## 使用方法

設定完了後、Claude Codeで以下のツールを使用できます:

### `upload_image_to_fal`

画像をfal.aiにアップロードしてリモートURLを取得します。

**パラメータ:**
- `image_path` (文字列、必須): アップロードする画像ファイルのパス

**使用例:**
```
/path/to/image.jpg の画像をfalにアップロード
```

## 必要環境

- Node.js 18.0.0 以上
- Python 3.x (`fal-client` パッケージがインストールされている)
- 有効なfal.ai APIキー

### Python依存関係のインストール

```bash
pip install fal-client
```

### プラットフォーム対応

- **Mac/Linux**: Python 3.xが`python3`コマンドで利用可能
- **Windows**: Python 3.xが`python`コマンドで利用可能（自動判別対応済み）

## サポートされる画像形式

- JPEG/JPG
- PNG
- GIF
- WebP
- BMP

## 制限事項

- 最大ファイルサイズ: 100MB
- 画像ファイルのみサポート

## トラブルシューティング

### "FAL_KEY not found in environment variables" エラー

セットアップセクションで示されているように、Claude Codeの設定にfal.ai APIキーを追加していることを確認してください。

### "Python not found" または "ModuleNotFoundError: No module named 'fal_client'" エラー

必要なPythonパッケージをインストールしてください:
```bash
pip install fal-client
```

**Windows環境の場合:**
- Python 3.xがインストールされ、`python`コマンドでアクセス可能であることを確認してください
- Pythonのインストール時に「Add Python to PATH」オプションを選択してください
- ※Windows環境では絵文字表示エラーが発生する場合がありますが、アップロード自体は正常に完了します

## ライセンス

MIT

## 作者

noranekob

## リンク

- [GitHubリポジトリ](https://github.com/noranekob/fal-mcp-server)
- [問題を報告](https://github.com/noranekob/fal-mcp-server/issues)
- [fal.ai ドキュメント](https://fal.ai/docs)