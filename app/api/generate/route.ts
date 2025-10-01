import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { mkdir } from 'fs/promises';
import { pipeline as pipelineCallback } from 'stream';
import { promisify } from 'util';

export const runtime = 'nodejs';

// Types for request payload
interface GenerateRequest {
  text: string;
  avatarId: string;
}

// Types for Hugging Face API response
interface HuggingFaceResponse {
  data: string[] | { url: string }[];
}

const pipeline = promisify(pipelineCallback);

const HUGGING_FACE_API = process.env.HUGGING_FACE_API?.trim() || 'https://hf.space/embed/vinthony/SadTalker/+/api/predict';
const CACHE_DIR = (process.env.GENERATE_CACHE_DIR?.trim() || path.join(process.cwd(), 'public', 'generated_cache'));
const MAX_TEXT_LENGTH = Number(process.env.GENERATE_MAX_TEXT_LENGTH || 1000);
const REQUEST_TIMEOUT_MS = Number(process.env.GENERATE_REQUEST_TIMEOUT_MS || 15000);
const MAX_RETRIES = Number(process.env.GENERATE_MAX_RETRIES || 1);

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    if ((error as { code?: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

// Generate cache key from input parameters
function generateCacheKey(avatarId: string, text: string): string {
  const hash = createHash('sha256');
  hash.update(`${avatarId}:${text}`);
  return hash.digest('hex');
}

// Download and save video from URL (streaming)
async function downloadVideo(url: string, filePath: string): Promise<void> {
  const response = await fetchWithRetry(url, { method: 'GET' }, { timeoutMs: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });
  const body = response.body as unknown as NodeJS.ReadableStream | null;
  if (!body) throw new Error('No response body while downloading video');
  await pipeline(body, fs.createWriteStream(filePath));
}

// Save base64 video data to file
function saveBase64Video(base64Data: string, filePath: string): void {
  const buffer = Buffer.from(base64Data.replace(/^data:video\/\w+;base64,/, ''), 'base64');
  fs.writeFileSync(filePath, buffer);
}

export async function POST(request: Request) {
  try {
    // Ensure cache directory exists
    await ensureCacheDir();

    // Parse request body
    const body = await request.json() as GenerateRequest;
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const avatarId = typeof body?.avatarId === 'string' ? body.avatarId.trim() : '';

    if (!text || !avatarId) {
      return NextResponse.json(
        { error: 'Missing required fields: text and avatarId' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long. Max length is ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Generate cache key and check cache
    const cacheKey = generateCacheKey(avatarId, text);
    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.mp4`);
    const publicPath = `/generated_cache/${cacheKey}.mp4`;

    // Check if cached version exists
    if (fs.existsSync(cacheFilePath)) {
      return NextResponse.json({
        videoUrl: publicPath,
        cached: true
      });
    }

    // Call Hugging Face API with timeout and limited retries
    const response = await fetchWithRetry(HUGGING_FACE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [text, avatarId]
      })
    }, { timeoutMs: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });

    const result = await response.json() as HuggingFaceResponse;

    // Handle response data
    if (Array.isArray(result.data) && result.data.length > 0) {
      const videoData = result.data[0];

      if (typeof videoData === 'string' && videoData.startsWith('data:')) {
        // Handle base64 data
        saveBase64Video(videoData, cacheFilePath);
      } else if (typeof videoData === 'object' && 'url' in videoData) {
        // Handle URL response via streaming
        await downloadVideo(videoData.url, cacheFilePath);
      } else {
        return NextResponse.json({ error: 'Unexpected response format from upstream' }, { status: 502 });
      }

      return NextResponse.json({
        videoUrl: publicPath,
        cached: false
      });
    }

    throw new Error('No video data in response');

  } catch (error) {
    const message = (error as Error)?.message || 'Unknown error';
    console.error('Video generation error:', error);
    const status = message.includes('timeout') ? 504 : 502;
    return NextResponse.json(
      { error: 'Failed to generate video', detail: message },
      { status }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

async function fetchWithRetry(url: string, init: RequestInit, opts: { timeoutMs: number; maxRetries: number }) {
  let attempt = 0;
  let lastError: unknown = null;
  while (attempt <= opts.maxRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await safeReadText(res);
        throw new Error(`Upstream ${res.status}: ${res.statusText}${text ? ` - ${text}` : ''}`);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt === opts.maxRetries) break;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      attempt++;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown upstream error');
}

async function safeReadText(res: Response): Promise<string | null> {
  try {
    return await res.text();
  } catch {
    return null;
  }
}