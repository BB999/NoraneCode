# mcp-line-notify

ClaudeからLINEメッセージを送信できるModel Context Protocol (MCP) サーバーです。

## 機能

- Claude CodeからLINEメッセージの送信
- 指定したUser IDへのメッセージ配信
- LINE Messaging APIとの連携
- 日本時間での送信時刻表示
- エラーハンドリングと詳細なステータス表示

## インストール

### npxを使用 (推奨)

```bash
# インストール不要、下記のClaude Code設定ファイルに記述するだけで使用可能
npx mcp-line-notify
```

### グローバルインストール

```bash
npm install -g mcp-line-notify
```

## セットアップ

### 1. LINE Bot認証情報の取得

#### Channel Access Tokenの取得
1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. LINE Business IDでログイン（2025年から二要素認証必須）
3. 既存のMessaging APIチャネルを選択、または新規作成
4. **「Messaging API」タブ**をクリック
5. **一番下までスクロール**
6. **「Channel access token」セクション**で**「Issue」ボタン**をクリック
7. 表示された長い文字列をコピー

#### User ID（自分のID）の取得
1. **同じチャネル内で操作**
2. **「チャネル基本設定」タブ**をクリック
3. **「あなたのユーザーID」**を確認
4. 「U」で始まる32文字の文字列をコピー

### 2. Claude Codeの設定

Claude Codeの設定ファイル (`~/.claude/settings.json`) に以下を追加:

```json
{
  "mcpServers": {
    "line-notify": {
      "command": "npx",
      "args": ["mcp-line-notify"],
      "env": {
        "LINE_CHANNEL_ACCESS_TOKEN": "あなたのchannel-access-token",
        "LINE_USER_ID": "あなたのuser-id"
      }
    }
  }
}
```

`あなたのchannel-access-token` と `あなたのuser-id` を実際の認証情報に置き換えてください。

## 使用方法

設定完了後、Claude Codeで以下のツールを使用できます:

### `send_line`

LINE Messaging APIを使ってメッセージを送信します。

**パラメータ:**
- `message` (文字列、必須): 送信するメッセージテキスト
- `userId` (文字列、任意): 送信先のユーザーID（省略時は設定されたUSER_IDを使用）

**使用例:**
```
LINEで「こんにちは！」とメッセージを送って
このタスクが完了したらLINEで通知して
ユーザーID xxxに「会議が5分後に始まります」とLINEメッセージを送信して
```

## 必要環境

- Node.js 16.0.0 以上
- 有効なLINE Channel Access Token
- 送信先のLINE User ID

## トラブルシューティング

### "LINE API認証情報が設定されていません" エラー

セットアップセクションで示されているように、Claude Codeの設定にLINE API認証情報を追加していることを確認してください。

### "LINE送信エラー" が発生する場合

1. Channel Access Tokenが正しく設定されているか確認
2. User IDが正しく設定されているか確認
3. LINE Botが有効化されているか確認
4. Messaging APIの利用制限に達していないか確認

## ライセンス

MIT

## 作者

noranekob

## リンク

- [GitHubリポジトリ](https://github.com/noranekob/NoraneCode)
- [問題を報告](https://github.com/noranekob/NoraneCode/issues)
- [LINE Developers ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)