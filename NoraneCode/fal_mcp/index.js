#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FALMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'fal-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'upload_image_to_fal',
            description: '画像ファイルをfal.aiにアップロードしてリモートURLを取得する',
            inputSchema: {
              type: 'object',
              properties: {
                image_path: {
                  type: 'string',
                  description: 'アップロードする画像ファイルのパス'
                }
              },
              required: ['image_path']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'upload_image_to_fal') {
          return await this.uploadImageToFal(args.image_path);
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

  async uploadImageToFal(imagePath) {
    return new Promise((resolve, reject) => {
      // Pythonスクリプトのパス
      const pythonScript = path.join(__dirname, 'upload_to_fal.py');
      
      // ファイルの存在確認
      if (!fs.existsSync(imagePath)) {
        reject(new Error(`画像ファイルが見つかりません: ${imagePath}`));
        return;
      }

      if (!fs.existsSync(pythonScript)) {
        reject(new Error(`Pythonスクリプトが見つかりません: ${pythonScript}`));
        return;
      }

      // Pythonスクリプトを実行
      const pythonProcess = spawn('python3', [pythonScript, imagePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // 成功時はURLを抽出
          const urlMatch = stdout.match(/Remote URL: (https?:\/\/[^\s]+)/);
          const url = urlMatch ? urlMatch[1] : null;
          
          if (url) {
            resolve({
              content: [
                {
                  type: 'text',
                  text: `✅ 画像のアップロードに成功しました！\n\n**ファイル**: ${path.basename(imagePath)}\n**リモートURL**: ${url}\n\n詳細ログ:\n${stdout}`
                }
              ]
            });
          } else {
            reject(new Error(`URLの抽出に失敗しました。出力: ${stdout}`));
          }
        } else {
          reject(new Error(`Pythonスクリプトの実行に失敗しました (終了コード: ${code})。エラー: ${stderr}\n出力: ${stdout}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Pythonプロセスの起動に失敗しました: ${error.message}`));
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FAL MCP server running on stdio');
  }
}

const server = new FALMCPServer();
server.run().catch(console.error);