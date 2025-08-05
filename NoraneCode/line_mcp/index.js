#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

class LineMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'line-notify',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 環境変数から設定を読み込む
    this.LINE_API_URL = 'https://api.line.me/v2/bot/message/push';
    this.CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    this.USER_ID = process.env.LINE_USER_ID;

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_line',
            description: 'LINE Messaging APIを使ってメッセージを送信する',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: '送信するメッセージ'
                },
                userId: {
                  type: 'string',
                  description: '送信先のUser ID（省略時は設定されたデフォルトユーザー）'
                }
              },
              required: ['message']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'send_line') {
          return await this.sendLineMessage(args.message, args.userId);
        }
        
        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async sendLineMessage(message, userId) {
    // 認証情報の確認
    if (!this.CHANNEL_ACCESS_TOKEN || !this.USER_ID) {
      throw new Error('LINE API認証情報が設定されていません。LINE_CHANNEL_ACCESS_TOKENとLINE_USER_IDを環境変数に設定してください。');
    }

    const targetUserId = userId || this.USER_ID;

    try {
      const response = await axios.post(
        this.LINE_API_URL,
        {
          to: targetUserId,
          messages: [{
            type: 'text',
            text: message
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.CHANNEL_ACCESS_TOKEN}`
          }
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `✓ LINEメッセージを送信したよ\n\n**宛先**: ${targetUserId}\n**メッセージ**: ${message}\n**時刻**: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.status || 'N/A';
      
      throw new Error(`LINE送信エラー (HTTP ${statusCode}): ${errorMessage}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LINE Notify MCP server running on stdio');
  }
}

const server = new LineMCPServer();
server.run().catch(console.error);