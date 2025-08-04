#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NASA API Key from environment variable
const NASA_API_KEY = process.env.NASA_API_KEY;

if (!NASA_API_KEY) {
  console.error('Error: NASA_API_KEY not found in environment variables');
  console.error('Please set NASA_API_KEY environment variable with your NASA API key');
  console.error('Get your free API key at: https://api.nasa.gov/');
  process.exit(1);
}

class NASAMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nasa-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 火星探査機の着陸日（地球時間）
    this.roverLandingDates = {
      curiosity: new Date('2012-08-06T05:17:57Z'),     // 2012年8月6日
      perseverance: new Date('2021-02-18T20:55:00Z'),  // 2021年2月18日
      opportunity: new Date('2004-01-25T05:05:00Z'),   // 2004年1月25日
      spirit: new Date('2004-01-04T04:35:00Z'),        // 2004年1月4日
    };

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'download_apod',
            description: 'Astronomy Picture of the Day - Download today\'s or random space images',
            inputSchema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                  description: 'Number of images to download (1-100)',
                  default: 1,
                  minimum: 1,
                  maximum: 100,
                },
                order: {
                  type: 'string',
                  description: 'Image selection order',
                  enum: ['random', 'latest', 'oldest'],
                  default: 'random',
                },
              },
              required: [],
            },
          },
          {
            name: 'download_mars_photos',
            description: 'Download photos from Mars rovers (Curiosity, Perseverance, Opportunity, Spirit)',
            inputSchema: {
              type: 'object',
              properties: {
                rover: {
                  type: 'string',
                  description: 'Mars rover name',
                  enum: ['curiosity', 'perseverance', 'opportunity', 'spirit'],
                  default: 'curiosity',
                },
                sol: {
                  type: 'number',
                  description: 'Martian sol (day) number. Leave empty for latest photos',
                  minimum: 1,
                },
                earth_date: {
                  type: 'string',
                  description: 'Earth date (YYYY-MM-DD) to convert to Sol. Takes precedence over sol parameter',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                },
                count: {
                  type: 'number',
                  description: 'Number of photos to download (1-100)',
                  default: 5,
                  minimum: 1,
                  maximum: 100,
                },
                random: {
                  type: 'boolean',
                  description: 'Select random sol day for more diverse photos',
                  default: false,
                },
              },
              required: ['rover'],
            },
          },
          {
            name: 'download_nasa_media',
            description: 'Search and download images/videos from NASA Image Library. Top video keywords (3000+ videos): mission, launch, earth, crew, spacecraft, astronaut, moon, exploration. High-success video keywords (1000+ videos): orbit, orbiter, science, artemis, test, mars, engineer, rocket, research, solar, laboratory. Top image keywords (40000+ images): mission, launch, photo, crew, spacecraft, astronaut, orbit, orbiter, shuttle, rocket, test, earth, exploration. Popular terms: apollo, ISS, satellite, discovery, pilot, surface, telescope, rover, spacewalk, deep space, sun, crater, atmosphere, docking, weather, eva, commander, specialist, engineer, scientist, landing, laboratory, research, experiment, data, observation, demonstration, simulation, video, image, animation, timelapse.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search keyword (e.g., "apollo", "mars", "nebula", "saturn")',
                },
                media_type: {
                  type: 'string',
                  description: 'Type of media to download',
                  enum: ['image', 'video', 'both'],
                  default: 'image',
                },
                count: {
                  type: 'number',
                  description: 'Number of items to download (1-50)',
                  default: 5,
                  minimum: 1,
                  maximum: 50,
                },
                order: {
                  type: 'string',
                  description: 'Search result order',
                  enum: ['latest', 'random', 'oldest'],
                  default: 'latest',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_neo_data',
            description: 'Get Near Earth Objects data for specified date range',
            inputSchema: {
              type: 'object',
              properties: {
                start_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD). Default is today',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                },
                days: {
                  type: 'number',
                  description: 'Number of days to query (1-7)',
                  default: 7,
                  minimum: 1,
                  maximum: 7,
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'download_apod':
            return await this.downloadAPOD(request.params.arguments);
          case 'download_mars_photos':
            return await this.downloadMarsPhotos(request.params.arguments);
          case 'download_nasa_media':
            return await this.downloadNASAMedia(request.params.arguments);
          case 'get_neo_data':
            return await this.getNEOData(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  // 共通のユーティリティ関数
  createDownloadDir() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dirName = `nasa_downloads_${timestamp}`;
    const downloadDir = path.join(process.cwd(), dirName);
    fs.ensureDirSync(downloadDir);
    return downloadDir;
  }

  async downloadFile(url, filePath, progressCallback = null) {
    const filename = path.basename(filePath);
    console.log(`🚀 Starting download: ${filename}`);
    console.log(`📥 From: ${url}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 300000, // 動画ダウンロードのためタイムアウトを5分に延長
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const writer = fs.createWriteStream(filePath);
    let downloadedBytes = 0;
    const totalBytes = parseInt(response.headers['content-length'] || '0');
    let lastProgressTime = Date.now();
    let lastProgressBytes = 0;
    let pollingInterval = 10000; // 初期ポーリング間隔: 10秒
    const maxPollingInterval = 60000; // 最大ポーリング間隔: 60秒
    let noProgressCount = 0;
    
    console.log(`📊 File size: ${this.formatBytes(totalBytes)}`);

    // ポーリング処理：進捗が止まっているかチェック
    const startPolling = () => {
      const pollingTimer = setInterval(() => {
        const now = Date.now();
        const currentBytes = downloadedBytes;
        
        // 進捗がない場合（バイト数が変わっていない）
        if (currentBytes === lastProgressBytes) {
          noProgressCount++;
          console.log(`⏳ ダウンロード停滞中... ${noProgressCount}回目 (${pollingInterval/1000}秒待機)`);
          
          // ポーリング間隔を段階的に増やす（最大60秒まで）
          if (pollingInterval < maxPollingInterval) {
            pollingInterval += 5000; // 5秒ずつ増加
            console.log(`🔄 ポーリング間隔を${pollingInterval/1000}秒に延長`);
          }
        } else {
          // 進捗があった場合はカウンタとポーリング間隔をリセット
          if (noProgressCount > 0) {
            console.log(`🎯 ダウンロード再開！ポーリング間隔を10秒にリセット`);
            noProgressCount = 0;
            pollingInterval = 10000;
          }
        }
        
        lastProgressBytes = currentBytes;
        
        // ダウンロード完了時はポーリング停止
        if (totalBytes > 0 && currentBytes >= totalBytes) {
          clearInterval(pollingTimer);
        }
      }, pollingInterval);
      
      return pollingTimer;
    };

    const pollingTimer = startPolling();

    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const now = Date.now();
      
      // 500ms毎、または10%毎、または完了時に進捗を表示
      if (totalBytes > 0 && (now - lastProgressTime > 500 || downloadedBytes === totalBytes)) {
        const progress = Math.round((downloadedBytes / totalBytes) * 100);
        const progressBar = this.createProgressBar(progress);
        const downloadedFormatted = this.formatBytes(downloadedBytes);
        const totalFormatted = this.formatBytes(totalBytes);
        const speed = this.calculateSpeed(downloadedBytes, now - lastProgressTime);
        
        console.log(`📥 ${filename}: ${progressBar} ${progress}% (${downloadedFormatted}/${totalFormatted}) ${speed}`);
        lastProgressTime = now;
        
        if (progressCallback) {
          progressCallback(progress, downloadedBytes, totalBytes);
        }
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        clearInterval(pollingTimer); // ポーリング停止
        console.log(`✅ Download completed: ${filename} (${this.formatBytes(downloadedBytes)})`);
        if (noProgressCount > 0) {
          console.log(`📊 停滞回数: ${noProgressCount}回, 最終ポーリング間隔: ${pollingInterval/1000}秒`);
        }
        resolve();
      });
      writer.on('error', (error) => {
        clearInterval(pollingTimer); // ポーリング停止
        console.error(`❌ Write error for ${filename}: ${error.message}`);
        reject(error);
      });
      response.data.on('error', (error) => {
        clearInterval(pollingTimer); // ポーリング停止
        console.error(`❌ Stream error for ${filename}: ${error.message}`);
        reject(error);
      });
    });
  }

  // 進捗バーを作成する関数
  createProgressBar(progress, width = 20) {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  // バイト数を人間が読みやすい形式に変換
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ダウンロード速度を計算
  calculateSpeed(bytes, timeMs) {
    if (timeMs === 0) return '';
    const bytesPerSec = (bytes / timeMs) * 1000;
    return `(${this.formatBytes(bytesPerSec)}/s)`;
  }

  // 重複ファイル名を避ける
  getUniqueFilename(downloadDir, originalFilename) {
    let filename = originalFilename;
    let counter = 1;
    
    while (fs.existsSync(path.join(downloadDir, filename))) {
      const ext = path.extname(originalFilename);
      const nameWithoutExt = path.basename(originalFilename, ext);
      filename = `${nameWithoutExt}_${counter}${ext}`;
      counter++;
    }
    
    return filename;
  }

  // 火星日（Sol）から地球日付への変換
  solToEarthDate(sol, rover) {
    const landingDate = this.roverLandingDates[rover.toLowerCase()];
    if (!landingDate) {
      console.error(`Unknown rover: ${rover}`);
      return null;
    }
    
    // 火星日の長さ: 24時間39分35.244秒 = 88775.244秒
    const marsSOLInSeconds = 88775.244;
    const earthDayInSeconds = 86400;
    
    // Sol日数分の秒数を計算
    const totalMarsSeconds = sol * marsSOLInSeconds;
    
    // 地球時間での経過ミリ秒
    const elapsedMilliseconds = (totalMarsSeconds / earthDayInSeconds) * 24 * 60 * 60 * 1000;
    
    // 着陸日からの経過時間を加算
    const earthDate = new Date(landingDate.getTime() + elapsedMilliseconds);
    
    return earthDate;
  }

  // 地球日付から火星日（Sol）への変換
  earthDateToSol(earthDate, rover) {
    const landingDate = this.roverLandingDates[rover.toLowerCase()];
    if (!landingDate) {
      console.error(`Unknown rover: ${rover}`);
      return null;
    }
    
    // 入力日付をDateオブジェクトに変換
    const targetDate = new Date(earthDate);
    if (isNaN(targetDate.getTime())) {
      console.error(`Invalid date: ${earthDate}`);
      return null;
    }
    
    // 着陸日からの経過ミリ秒
    const elapsedMilliseconds = targetDate.getTime() - landingDate.getTime();
    
    // 負の値の場合（着陸前）
    if (elapsedMilliseconds < 0) {
      console.error(`Date ${earthDate} is before ${rover} landing date`);
      return null;
    }
    
    // 火星日の長さ: 24時間39分35.244秒 = 88775.244秒
    const marsSOLInSeconds = 88775.244;
    const earthDayInSeconds = 86400;
    
    // 地球時間での経過秒数
    const elapsedSeconds = elapsedMilliseconds / 1000;
    
    // 火星日に変換
    const sol = Math.floor((elapsedSeconds / marsSOLInSeconds));
    
    return sol;
  }

  // 日付を日本語形式でフォーマット
  formatDateJP(date) {
    if (!date) return '不明';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }

  getFileHash(filePath) {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(data).digest('hex');
  }

  checkDuplicate(filePath, existingHashes) {
    const hash = this.getFileHash(filePath);
    const stats = fs.statSync(filePath);
    const size = stats.size;

    for (const existing of existingHashes) {
      if (existing.hash === hash || Math.abs(existing.size - size) < 1024) {
        return true;
      }
    }

    existingHashes.push({ hash, size });
    return false;
  }

  // APOD (Astronomy Picture of the Day) のダウンロード
  async downloadAPOD(args = {}) {
    const { count = 1, order = 'random' } = args;
    const downloadDir = this.createDownloadDir();
    
    let url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&hd=true`;
    
    if (count === 1) {
      // 今日の画像
      url += '';
    } else {
      switch (order) {
        case 'latest':
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - (count - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          url += `&start_date=${startDate}&end_date=${endDate}`;
          break;
        case 'oldest':
          url += `&start_date=1995-06-16&end_date=1995-06-${16 + count - 1}`;
          break;
        default: // random
          url += `&count=${count}`;
      }
    }

    const response = await axios.get(url);
    const data = response.data;

    // JSONデータを保存
    fs.writeFileSync(path.join(downloadDir, 'apod_data.json'), JSON.stringify(data, null, 2));

    const downloadedFiles = [];
    const images = Array.isArray(data) ? data : [data];

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      if (item.hdurl || item.url) {
        const imageUrl = item.hdurl || item.url;
        let filename = path.basename(imageUrl);
        
        // URLパラメータを除去
        filename = filename.split('?')[0];
        
        // 空の場合は日付ベースのファイル名を生成
        if (!filename || filename === '/') {
          const extension = path.extname(imageUrl) || '.jpg';
          filename = `apod_${item.date || new Date().toISOString().split('T')[0]}${extension}`;
        }
        
        // 重複ファイル名をチェック
        filename = this.getUniqueFilename(downloadDir, filename);
        const filePath = path.join(downloadDir, filename);

        try {
          await this.downloadFile(imageUrl, filePath);
          downloadedFiles.push({
            filename,
            title: item.title,
            date: item.date,
            size: fs.statSync(filePath).size,
          });
        } catch (error) {
          console.error(`Failed to download ${filename}: ${error.message}`);
        }
      }
    }

    // APOD順序の説明
    let apodOrderExplanation = '';
    if (count === 1) {
      apodOrderExplanation = `📅 今日のAPOD: ${new Date().toLocaleDateString('ja-JP')}`;
    } else {
      switch (apod_order) {
        case '2':
          apodOrderExplanation = `📅 最新順: 今日から過去${count}日分を時系列順`;
          break;
        case '3':
          apodOrderExplanation = `📚 最初から: APOD開始日(1995/6/16)から${count}日分を順番`;
          break;
        default:
          apodOrderExplanation = `🎲 ランダム: 全期間からランダムに${count}枚選択`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `APOD ダウンロード完了！\n\n` +
                `取得順序: ${apodOrderExplanation}\n` +
                `保存先: ${downloadDir}\n` +
                `ダウンロード済み: ${downloadedFiles.length}件\n\n` +
                `📋 ダウンロードした順序:\n` +
                downloadedFiles.map((f, index) => `${index + 1}. ${f.filename} - ${f.title} (${Math.round(f.size / 1024)}KB)`).join('\n'),
        },
      ],
    };
  }

  // Mars Rover 写真のダウンロード
  async downloadMarsPhotos(args = {}) {
    const { rover = 'curiosity', sol, earth_date, count = 5, random = false } = args;
    const downloadDir = this.createDownloadDir();

    let url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}`;
    let usedSol = sol;
    
    // 地球日付が指定された場合、Solに変換
    if (earth_date && !sol) {
      usedSol = this.earthDateToSol(earth_date, rover);
      if (usedSol !== null) {
        console.log(`📅 Earth date ${earth_date} converted to Sol ${usedSol}`);
      } else {
        console.error(`Failed to convert earth date: ${earth_date}`);
        return {
          content: [
            {
              type: 'text',
              text: `❌ エラー: 日付 ${earth_date} は ${rover} の着陸日より前か、無効な日付です。\n` +
                    `${rover} の着陸日: ${this.formatDateJP(this.roverLandingDates[rover.toLowerCase()])}`,
            },
          ],
        };
      }
    }
    
    // ランダム機能: solが指定されてなくて、randomがtrueの場合
    if (!usedSol && random) {
      // 探査機別の活動期間でランダムなSolを生成
      let maxSol;
      switch (rover.toLowerCase()) {
        case 'curiosity':
          maxSol = 4600; // 2012年着陸〜現在も活動中
          break;
        case 'perseverance':
          maxSol = 1300; // 2021年着陸〜現在も活動中
          break;
        case 'opportunity':
          maxSol = 5111; // 2004-2018年
          break;
        case 'spirit':
          maxSol = 2208; // 2004-2010年
          break;
        default:
          maxSol = 1000;
      }
      
      usedSol = Math.floor(Math.random() * maxSol) + 1;
      console.log(`🎲 Random Sol selected: ${usedSol} (max: ${maxSol})`);
    }
    
    if (usedSol) {
      url += `/photos?sol=${usedSol}&api_key=${NASA_API_KEY}`;
    } else {
      url += `/latest_photos?api_key=${NASA_API_KEY}`;
    }

    const response = await axios.get(url);
    const data = response.data;

    // JSONデータを保存
    fs.writeFileSync(path.join(downloadDir, 'mars_photos_data.json'), JSON.stringify(data, null, 2));

    const photos = data.photos || data.latest_photos || [];
    
    if (photos.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `指定された条件では写真が見つかりませんでした。\n別のsol値を試してください。`,
          },
        ],
      };
    }

    const downloadedFiles = [];
    const existingHashes = [];
    let processedCount = 0;

    for (const photo of photos.slice(0, count * 2)) { // 重複を考慮して多めに処理
      if (downloadedFiles.length >= count) break;

      const imageUrl = photo.img_src;
      let filename = path.basename(imageUrl);
      
      // URLパラメータを除去
      filename = filename.split('?')[0];
      
      // 空の場合はMars用ファイル名を生成
      if (!filename || filename === '/') {
        const extension = path.extname(imageUrl) || '.jpg';
        filename = `${rover}_sol${photo.sol}_${photo.camera.name}_${downloadedFiles.length + 1}${extension}`;
      }
      
      // 重複ファイル名をチェック
      filename = this.getUniqueFilename(downloadDir, filename);
      const filePath = path.join(downloadDir, filename);

      try {
        await this.downloadFile(imageUrl, filePath);
        
        // 重複チェック
        if (this.checkDuplicate(filePath, existingHashes)) {
          fs.unlinkSync(filePath);
          continue;
        }

        downloadedFiles.push({
          filename,
          rover: photo.rover.name,
          camera: photo.camera.full_name,
          sol: photo.sol,
          earth_date: photo.earth_date,
          size: fs.statSync(filePath).size,
        });
        
        processedCount++;
      } catch (error) {
        console.error(`Failed to download ${filename}: ${error.message}`);
      }
    }

    // Mars Rover順序の説明
    let marsOrderExplanation = '';
    let earthDateInfo = '';
    
    if (usedSol) {
      const earthDate = this.solToEarthDate(usedSol, rover);
      earthDateInfo = earthDate ? ` (地球日付: ${this.formatDateJP(earthDate)})` : '';
      
      if (random && !sol) {
        marsOrderExplanation = `🎲 ランダム火星日Sol ${usedSol}${earthDateInfo}: ${rover}探査機のランダム選択日データを時系列順`;
      } else {
        marsOrderExplanation = `🔴 火星日Sol ${usedSol}${earthDateInfo}: ${rover}探査機の指定日データを時系列順`;
      }
    } else {
      marsOrderExplanation = `🔴 最新写真: ${rover}探査機の最新データを時系列順`;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Mars Rover 写真ダウンロード完了！\n\n` +
                `探査機: ${rover}\n` +
                `取得順序: ${marsOrderExplanation}\n` +
                `保存先: ${downloadDir}\n` +
                `ダウンロード済み: ${downloadedFiles.length}件\n\n` +
                `📋 ダウンロードした順序:\n` +
                downloadedFiles.map((f, index) => {
                  const earthDate = this.solToEarthDate(f.sol, rover);
                  const dateStr = earthDate ? ` [${this.formatDateJP(earthDate)}]` : '';
                  return `${index + 1}. ${f.filename} - ${f.camera} Sol:${f.sol}${dateStr} (${Math.round(f.size / 1024)}KB)`;
                }).join('\n'),
        },
      ],
    };
  }

  // NASA Image Library からの画像・動画ダウンロード
  async downloadNASAMedia(args = {}) {
    const { query, media_type = 'image', count = 5, order = 'latest' } = args;
    const downloadDir = this.createDownloadDir();

    console.log(`🔍 Searching for: "${query}" (${media_type})`);
    
    // 動画検索のヒント
    if (media_type === 'video' || media_type === 'both') {
      console.log(`💡 Video search tip: GUARANTEED SUCCESS (3000+ videos): mission, launch, earth, crew, spacecraft, astronaut, moon, exploration`);
      console.log(`💡 Video search tip: HIGH SUCCESS (1000+ videos): orbit, orbiter, science, artemis, test, mars, engineer, rocket, research, solar, laboratory`);
      console.log(`💡 Video search tip: GOOD SUCCESS (500+ videos): ISS, experiment, discovery, pilot, satellite, demonstration, weather, scientist, apollo, atmosphere, surface, telescope, rover, spacewalk, deep space, sun`);
    }
    
    // 画像検索のヒント
    if (media_type === 'image' || media_type === 'both') {
      console.log(`💡 Image search tip: MASSIVE COLLECTION (40k+ images): mission, launch, photo, crew, spacecraft, astronaut, orbit, orbiter, shuttle, rocket`);
      console.log(`💡 Image search tip: HUGE COLLECTION (20k+ images): test, earth, exploration, engineer, science, image, mars, commander, landing, laboratory`);
      console.log(`💡 Image search tip: LARGE COLLECTION (10k+ images): research, specialist, moon, ISS, solar, experiment, discovery, pilot, surface, cosmonaut, satellite, artemis, data, observation, demonstration`);
    }

    // メディアタイプの変換
    const mediaTypes = {
      'image': 'image',
      'video': 'video',
      'both': 'image,video'
    };
    const searchMediaType = mediaTypes[media_type] || 'image';

    // ページ番号の設定
    let pageParam = '';
    switch (order) {
      case 'random':
        // より広い範囲からランダムページを選択
        const randomPage = Math.floor(Math.random() * 100) + 1;
        pageParam = `&page=${randomPage}`;
        console.log(`🎲 Random page selected: ${randomPage}`);
        break;
      case 'oldest':
        pageParam = '&page=50';
        break;
      default: // latest
        pageParam = '';
    }

    const searchUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=${searchMediaType}&page_size=${count * 3}${pageParam}`;
    
    console.log(`🌐 Fetching search results...`);
    const response = await axios.get(searchUrl);
    const data = response.data;

    // JSONデータを保存
    fs.writeFileSync(path.join(downloadDir, 'nasa_media_data.json'), JSON.stringify(data, null, 2));

    const items = data.collection?.items || [];
    
    if (items.length === 0) {
      const suggestions = media_type === 'video' 
        ? 'mission, launch, earth, crew, spacecraft, astronaut, moon, exploration, orbit, orbiter, science, artemis, test, mars, engineer, rocket, research, solar, laboratory, ISS, experiment, discovery, pilot, satellite, demonstration, weather, scientist, apollo, atmosphere, surface, telescope, rover, spacewalk, deep space, sun'
        : 'mission, launch, photo, crew, spacecraft, astronaut, orbit, orbiter, shuttle, rocket, test, earth, exploration, engineer, science, image, mars, commander, landing, laboratory, research, specialist, moon, ISS, solar, experiment, discovery, pilot, surface, cosmonaut, satellite, artemis, data, observation, demonstration, atmosphere, simulation, docking, telescope, measurement, scientist, rover, weather, spacewalk, deep space, star, sun, crater, apollo, eva';
      
      return {
        content: [
          {
            type: 'text',
            text: `検索結果が見つかりませんでした。\n別のキーワード（例: ${suggestions}）を試してください。`,
          },
        ],
      };
    }

    console.log(`📋 Found ${items.length} items, downloading ${Math.min(count, items.length)}...`);
    
    const downloadedFiles = [];
    const existingHashes = [];
    let currentIndex = 0;
    
    // ランダム順序でアイテムを処理
    let itemsToProcess;
    if (order === 'random') {
      // Fisher-Yates shuffleでランダムに並び替え
      itemsToProcess = [...items];
      for (let i = itemsToProcess.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [itemsToProcess[i], itemsToProcess[j]] = [itemsToProcess[j], itemsToProcess[i]];
      }
      console.log(`🎲 Items shuffled randomly for true randomization`);
    } else {
      itemsToProcess = items;
    }

    for (const item of itemsToProcess.slice(0, count * 2)) {
      if (downloadedFiles.length >= count) break;

      currentIndex++;
      const mediaType = item.data[0]?.media_type;
      const title = item.data[0]?.title || 'Unknown';
      
      console.log(`\n📦 [${currentIndex}/${Math.min(count, items.length)}] Processing: ${title.substring(0, 50)}...`);
      
      if (mediaType === 'image') {
        await this.downloadNASAImage(item, downloadDir, downloadedFiles, existingHashes);
      } else if (mediaType === 'video' && (media_type === 'video' || media_type === 'both')) {
        await this.downloadNASAVideo(item, downloadDir, downloadedFiles);
      }
    }

    console.log(`\n🎉 All downloads completed! Total: ${downloadedFiles.length} files`);
    
    // ダウンロード順序の説明を生成
    let orderExplanation = '';
    switch (order) {
      case 'random':
        orderExplanation = `🎲 ランダム順序: ページ${pageParam.replace('&page=', '')}から取得後、Fisher-Yatesアルゴリズムでシャッフル`;
        break;
      case 'oldest':
        orderExplanation = `📚 古い順: ページ50から古い順に取得`;
        break;
      default:
        orderExplanation = `📅 最新順: 最新の結果から順番に取得`;
    }

    return {
      content: [
        {
          type: 'text',
          text: `NASA Media ダウンロード完了！\n\n` +
                `検索キーワード: ${query}\n` +
                `メディアタイプ: ${media_type}\n` +
                `取得順序: ${orderExplanation}\n` +
                `保存先: ${downloadDir}\n` +
                `ダウンロード済み: ${downloadedFiles.length}件\n\n` +
                `📋 ダウンロードした順序:\n` +
                downloadedFiles.map((f, index) => `${index + 1}. ${f.filename} - ${f.title.substring(0, 40)}... (${Math.round(f.size / 1024)}KB)`).join('\n'),
        },
      ],
    };
  }

  async downloadNASAImage(item, downloadDir, downloadedFiles, existingHashes) {
    const links = item.links || [];
    const imageLink = links.find(link => link.render === 'image');
    
    if (!imageLink) return;

    // 高品質版を探す
    const baseUrl = imageLink.href.replace(/~(small|medium|large|orig)\.jpg$/, '');
    const qualities = ['~orig.jpg', '~large.jpg', '~medium.jpg', '~small.jpg'];
    
    let imageUrl = null;
    for (const quality of qualities) {
      try {
        const testUrl = baseUrl + quality;
        await axios.head(testUrl);
        imageUrl = testUrl;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!imageUrl) {
      imageUrl = imageLink.href;
    }

    let filename = path.basename(imageUrl);
    
    // URLパラメータを除去
    filename = filename.split('?')[0];
    
    // 空の場合はNASA用ファイル名を生成
    if (!filename || filename === '/' || !filename.includes('.')) {
      filename = `nasa_image_${downloadedFiles.length + 1}.jpg`;
    }
    
    // 重複ファイル名をチェック
    filename = this.getUniqueFilename(downloadDir, filename);
    const filePath = path.join(downloadDir, filename);

    try {
      await this.downloadFile(imageUrl, filePath);
      
      // 重複チェック
      if (this.checkDuplicate(filePath, existingHashes)) {
        fs.unlinkSync(filePath);
        return;
      }

      downloadedFiles.push({
        filename,
        title: item.data[0]?.title || 'Unknown',
        type: 'image',
        size: fs.statSync(filePath).size,
      });
    } catch (error) {
      console.error(`Failed to download image ${filename}: ${error.message}`);
    }
  }

  async downloadNASAVideo(item, downloadDir, downloadedFiles) {
    // NASA APIではitem.hrefに直接collection.jsonのURLがある
    const collectionUrl = item.href;
    
    if (!collectionUrl || !collectionUrl.includes('collection.json')) {
      console.error('Collection URL not found for video:', item.data[0]?.title);
      console.error('Item href:', collectionUrl);
      return;
    }

    try {
      console.log(`📥 Fetching collection data from: ${collectionUrl}`);
      
      // collection.jsonを取得
      const collectionResponse = await axios.get(collectionUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const collectionData = collectionResponse.data;
      console.log(`Collection response status: ${collectionResponse.status}`);
      console.log(`Collection data type: ${typeof collectionData}, is array: ${Array.isArray(collectionData)}`);
      
      if (Array.isArray(collectionData)) {
        console.log(`Collection array length: ${collectionData.length}`);
        console.log(`First 3 items:`, collectionData.slice(0, 3));
      }
      
      // collection.jsonから動画URLを抽出
      // NASAのcollection.jsonは配列形式で、動画ファイルのURLが直接含まれている
      let videoUrl = null;
      const videoExtensions = ['.mp4', '.mov', '.m4v', '.webm', '.avi'];
      
      if (Array.isArray(collectionData)) {
        console.log(`Collection array length: ${collectionData.length}`);
        
        // 優先順位: medium.mp4 > small.mp4 > mobile.mp4 > preview.mp4 > orig.mov
        const preferredFormats = ['~medium.mp4', '~small.mp4', '~mobile.mp4', '~preview.mp4', '~orig.mov'];
        
        // まず優先形式を探す
        for (const format of preferredFormats) {
          videoUrl = collectionData.find(url => typeof url === 'string' && url.includes(format));
          if (videoUrl) {
            console.log(`✅ Found preferred video format: ${format}`);
            console.log(`✅ Video URL: ${videoUrl}`);
            break;
          }
        }
        
        // 優先形式が見つからない場合は、任意の動画ファイルを探す
        if (!videoUrl) {
          for (const ext of videoExtensions) {
            videoUrl = collectionData.find(url => typeof url === 'string' && url.toLowerCase().includes(ext));
            if (videoUrl) {
              console.log(`✅ Found video URL with extension ${ext}: ${videoUrl}`);
              break;
            }
          }
        }
        
        // まだ見つからない場合はHTTPのURLをすべて確認
        if (!videoUrl) {
          const httpUrls = collectionData.filter(url => typeof url === 'string' && url.startsWith('http'));
          console.log(`🔍 All HTTP URLs in collection (${httpUrls.length}):`);
          httpUrls.forEach((url, index) => {
            console.log(`  ${index + 1}: ${url}`);
          });
          
          // 最初のhttpURLを使用（通常最も大きなファイル）
          if (httpUrls.length > 0) {
            videoUrl = httpUrls[0];
            console.log(`🎯 Using first available URL as video: ${videoUrl}`);
          }
        }
      } else if (typeof collectionData === 'object') {
        // オブジェクトの場合は値を再帰的に探す
        console.log(`Collection object keys:`, Object.keys(collectionData));
        const searchInObject = (obj) => {
          for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'string') {
              for (const ext of videoExtensions) {
                if (value.toLowerCase().includes(ext)) {
                  return value;
                }
              }
            } else if (typeof value === 'object' && value !== null) {
              const result = searchInObject(value);
              if (result) return result;
            }
          }
          return null;
        };
        
        videoUrl = searchInObject(collectionData);
        if (videoUrl) {
          console.log(`✅ Found video URL in object: ${videoUrl}`);
        }
      }
      
      if (!videoUrl) {
        console.error(`❌ No video file found in collection for: ${item.data[0]?.title}`);
        console.error('Collection data:', JSON.stringify(collectionData, null, 2));
        return;
      }

      console.log(`🎬 Downloading video from: ${videoUrl}`);

      let filename = path.basename(videoUrl);
      
      // URLパラメータを除去
      filename = filename.split('?')[0];
      
      // 空の場合は動画用ファイル名を生成
      if (!filename || filename === '/' || !filename.includes('.')) {
        const urlExtension = path.extname(videoUrl) || '.mp4';
        filename = `nasa_video_${downloadedFiles.length + 1}${urlExtension}`;
      }
      
      // 重複ファイル名をチェック
      filename = this.getUniqueFilename(downloadDir, filename);
      const filePath = path.join(downloadDir, filename);

      await this.downloadFile(videoUrl, filePath);
      
      // ファイルサイズをチェック
      const stats = fs.statSync(filePath);
      if (stats.size < 1000) {
        console.error(`❌ Downloaded file too small: ${filename} (${stats.size} bytes)`);
        fs.unlinkSync(filePath);
        return;
      }

      downloadedFiles.push({
        filename,
        title: item.data[0]?.title || 'Unknown',
        type: 'video',
        size: stats.size,
      });
      
      console.log(`✅ Successfully downloaded video: ${filename} (${this.formatBytes(stats.size)})`);
    } catch (error) {
      console.error(`❌ Failed to download video for ${item.data[0]?.title}: ${error.message}`);
      if (error.response) {
        console.error(`HTTP Status: ${error.response.status}`);
        console.error(`Response URL: ${error.response.config?.url}`);
        if (error.response.data) {
          console.error(`Response data (first 200 chars):`, JSON.stringify(error.response.data).substring(0, 200));
        }
      }
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
    }
  }

  // 地球近傍天体データの取得
  async getNEOData(args = {}) {
    const { start_date, days = 7 } = args;
    
    const startDate = start_date || new Date().toISOString().split('T')[0];
    const endDate = new Date(new Date(startDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`;
    
    const response = await axios.get(url);
    const data = response.data;

    const downloadDir = this.createDownloadDir();
    
    // JSONデータを保存
    fs.writeFileSync(path.join(downloadDir, 'neo_data.json'), JSON.stringify(data, null, 2));

    const objectCount = data.element_count || 0;
    const nearEarthObjects = data.near_earth_objects || {};
    
    // 統計情報を作成
    let totalObjects = 0;
    let hazardousObjects = 0;
    const dates = Object.keys(nearEarthObjects);
    
    dates.forEach(date => {
      const objects = nearEarthObjects[date] || [];
      totalObjects += objects.length;
      hazardousObjects += objects.filter(obj => obj.is_potentially_hazardous_asteroid).length;
    });

    return {
      content: [
        {
          type: 'text',
          text: `地球近傍天体データ取得完了！\n\n` +
                `期間: ${startDate} ～ ${endDate}\n` +
                `総天体数: ${objectCount}個\n` +
                `潜在的に危険な天体: ${hazardousObjects}個\n` +
                `保存先: ${downloadDir}/neo_data.json\n\n` +
                `対象日数: ${dates.length}日間\n` +
                dates.map(date => `• ${date}: ${nearEarthObjects[date].length}個`).join('\n'),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('NASA MCP Server started');
  }
}

const server = new NASAMCPServer();
server.run().catch(console.error);