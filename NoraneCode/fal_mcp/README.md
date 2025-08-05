# @noranekob/fal-mcp-server

任意のファイル（画像、動画、音声、テキストなど）をfal.aiにアップロードしてリモートURLを取得するModel Context Protocol (MCP) サーバーです。

## 機能

- 任意のファイルをfal.aiクラウドストレージにアップロード
- アップロードしたファイルの共有可能なリモートURLを取得
- 幅広いファイル形式をサポート
  - **画像**: JPG、PNG、GIF、WebP、BMP
  - **動画**: MP4、MOV、AVI、WebM
  - **音声**: MP3、WAV、AAC、OGG
  - **テキスト**: TXT、JSON、CSV、XML
  - **その他**: PDF、ZIP、バイナリファイルなど
- ファイルサイズ検証 (最大500MB)
- MIME typeの自動判定

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

### Python依存関係のインストール

```bash
pip install fal-client
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

### `upload_file_to_fal`

任意のファイルをfal.aiにアップロードしてリモートURLを取得します。

**パラメータ:**
- `file_path` (文字列、必須): アップロードするファイルのパス

**使用例:**
```
/path/to/image.jpg の画像をfalにアップロード
/path/to/video.mp4 の動画をfalにアップロード
/path/to/audio.mp3 の音声をfalにアップロード
/path/to/document.pdf のPDFをfalにアップロード
/path/to/document.pdf のPDFをfalにアップロードして動画を生成して
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

## サポートされるファイル形式

### 画像
- JPEG/JPG、PNG、GIF、WebP、BMP

### 動画
- MP4、MOV、AVI、WebM、MKV

### 音声
- MP3、WAV、AAC、OGG、FLAC

### テキスト・ドキュメント
- TXT、JSON、CSV、XML、PDF

### アーカイブ
- ZIP、TAR、GZ

### その他
- 任意のバイナリファイル

## 制限事項

- 最大ファイルサイズ: 500MB
- ファイル形式の制限なし（fal.aiがサポートする全形式に対応）

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