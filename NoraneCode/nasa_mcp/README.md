# @noranekob/nasa-mcp-server

NASA APIにアクセスして宇宙画像、火星探査機の写真、動画、地球近傍天体データをダウンロードするModel Context Protocol (MCP) サーバーです。

## 機能

- **APOD (今日の天体写真)**: 今日または過去のランダム宇宙画像をダウンロード
- **火星探査機の写真**: Curiosity、Perseverance、Opportunity、Spirit探査機の写真にアクセス
- **NASA メディアライブラリ**: NASAの豊富なコレクションから画像・動画を検索・ダウンロード
- **地球近傍天体**: 地球近くの小惑星や彗星のデータを取得

## インストール

### npxを使用 (推奨)

```bash
# インストール不要、設定して実行するだけ
npx @noranekob/nasa-mcp-server
```

### グローバルインストール

```bash
npm install -g @noranekob/nasa-mcp-server
```

## セットアップ

### 1. NASA APIキーを取得

1. [NASA APIポータル](https://api.nasa.gov/) にアクセス
2. 無料のAPIキーにサインアップ
3. APIキーを保存

### 2. Claude Codeの設定

Claude Codeの設定ファイル (`~/.claude/settings.json`) に以下を追加:

```json
{
  "mcpServers": {
    "nasa-mcp-server": {
      "command": "npx",
      "args": ["@noranekob/nasa-mcp-server"],
      "env": {
        "NASA_API_KEY": "あなたのnasa-api-key"
      }
    }
  }
}
```

`あなたのnasa-api-key` を実際のNASA APIキーに置き換えてください。

## 利用可能なツール

### 1. `download_apod`

今日の天体写真をダウンロードします。

**パラメータ:**
- `count` (数値、オプション): ダウンロード枚数 (1-100、デフォルト: 1)
- `order` (文字列、オプション): 画像選択順序 - "random", "latest", "oldest" (デフォルト: "random")

**使用例:**
```
APODをランダムで5枚ダウンロード
```

### 2. `download_mars_photos`

火星探査機の写真をダウンロードします。

**パラメータ:**
- `rover` (文字列、必須): 探査機名 - "curiosity", "perseverance", "opportunity", "spirit"
- `sol` (数値、オプション): 火星日番号
- `earth_date` (文字列、オプション): 地球日付 (YYYY-MM-DD形式)
- `count` (数値、オプション): 写真枚数 (1-100、デフォルト: 5)
- `random` (真偽値、オプション): ランダムなソル日を選択 (デフォルト: false)

**使用例:**
```
Curiosity探査機の写真をランダムな日から10枚ダウンロード
```

### 3. `download_nasa_media`

NASA画像ライブラリから検索・ダウンロードします。

**パラメータ:**
- `query` (文字列、必須): 検索キーワード (例: "apollo", "mars", "nebula")
- `media_type` (文字列、オプション): "image", "video", "both" (デフォルト: "image")
- `count` (数値、オプション): アイテム数 (1-50、デフォルト: 5)
- `order` (文字列、オプション): "latest", "random", "oldest" (デフォルト: "latest")

**人気の検索ワード:**
- **画像**: mission, launch, crew, spacecraft, astronaut, orbit, shuttle, rocket
- **動画**: mission, launch, earth, crew, spacecraft, astronaut, moon, exploration

**使用例:**
```
"apollo"で動画を検索して3つダウンロード
```

### 4. `get_neo_data`

地球近傍天体データを取得します。

**パラメータ:**
- `start_date` (文字列、オプション): 開始日 (YYYY-MM-DD形式、デフォルト: 今日)
- `days` (数値、オプション): クエリ日数 (1-7、デフォルト: 7)

**使用例:**
```
今後7日間のNEOデータを取得
```

## 出力

ダウンロードしたファイルは、現在の作業ディレクトリにタイムスタンプ付きディレクトリに保存されます:
- `nasa_downloads_YYYY-MM-DD_HH-mm-ss/`

ディレクトリには以下が含まれます:
- ダウンロードした画像・動画
- 詳細情報を含むJSONメタデータファイル

## 必要環境

- Node.js 18.0.0 以上
- 有効なNASA APIキー ([api.nasa.gov](https://api.nasa.gov/) で無料取得)

### プラットフォーム対応

- **Windows**: 完全対応
- **Mac/Linux**: 完全対応

Pure JavaScriptで実装されているため、すべてのプラットフォームで動作します。

## レート制限

NASA APIには以下のレート制限があります:
- 時間制限: 1時間あたり1,000リクエスト
- 日制限: 需要に応じて変動

## トラブルシューティング

### "NASA_API_KEY not found in environment variables" エラー

セットアップセクションで示されているように、Claude Codeの設定にNASA APIキーを追加していることを確認してください。

### "No results found" エラー

異なる検索用語を試してください。最良の結果を得るには:
- "mission", "launch", "spacecraft" などの一般的な用語を使用
- 上記の人気検索ワードを確認
- 火星写真の場合、異なるソル番号を試すかランダムモードを使用

### ダウンロードの問題

ダウンロードに失敗する場合:
- インターネット接続を確認
- APIキーが有効であることを確認
- レート制限を超えていないことを確認

## ライセンス

MIT

## 作者

noranekob

## リンク

- [GitHubリポジトリ](https://github.com/noranekob/nasa-mcp-server)
- [問題を報告](https://github.com/noranekob/nasa-mcp-server/issues)
- [NASA API ドキュメント](https://api.nasa.gov/)
- [NASA 画像・動画ライブラリ](https://images.nasa.gov/)