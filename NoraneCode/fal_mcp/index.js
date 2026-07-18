#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// 拡張子→MIME typeの対応表（該当なしは application/octet-stream）
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
};

function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// fal storage REST API (initiate → PUT) で直接アップロードする。
// 署名付きupload_urlはエラーメッセージに含めない。
async function uploadToFal(filePath) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error('FAL_KEY not found in environment variables');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }

  const { size } = fs.statSync(filePath);
  if (size > MAX_FILE_SIZE) {
    throw new Error(`ファイルが大きすぎます (${size} bytes)。最大 ${MAX_FILE_SIZE / (1024 * 1024)}MB まで対応しています。`);
  }

  const contentType = guessMimeType(filePath);
  const fileName = path.basename(filePath);

  const initiateRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content_type: contentType, file_name: fileName }),
  });
  if (!initiateRes.ok) {
    throw new Error(`アップロードの開始に失敗しました: HTTP ${initiateRes.status}`);
  }

  const { upload_url: uploadUrl, file_url: fileUrl } = await initiateRes.json();
  if (!uploadUrl || !fileUrl) {
    throw new Error('アップロードの開始に失敗しました: レスポンスにURLが含まれていません');
  }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: fs.readFileSync(filePath),
  });
  if (!putRes.ok) {
    throw new Error(`アップロードに失敗しました: HTTP ${putRes.status}`);
  }

  return { fileUrl, fileName, size, contentType };
}

class FALMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'fal-mcp-server',
        version: '1.1.0',
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
            name: 'upload_file_to_fal',
            description: '任意のファイル（画像、動画、音声、テキストなど）をfal.aiにアップロードしてリモートURLを取得する',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'アップロードするファイルのパス'
                }
              },
              required: ['file_path']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'upload_file_to_fal') {
          const { fileUrl, fileName, size, contentType } = await uploadToFal(args.file_path);
          return {
            content: [
              {
                type: 'text',
                text: `✅ ファイルのアップロードに成功しました！\n\n**ファイル**: ${fileName} (${size} bytes, ${contentType})\n**リモートURL**: ${fileUrl}`
              }
            ]
          };
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FAL MCP server running on stdio');
  }
}

const server = new FALMCPServer();
server.run().catch(console.error);
