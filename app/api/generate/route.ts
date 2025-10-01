import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { mkdir } from 'fs/promises';

// Types for request payload
interface GenerateRequest {
  text: string;
  avatarId: string;
}

// Types for Hugging Face API response
interface HuggingFaceResponse {
  data: string[] | { url: string }[];
}

const CACHE_DIR = path.join(process.cwd(), 'public', 'generated_cache');
const HUGGING_FACE_API = 'https://hf.space/embed/vinthony/SadTalker/+/api/predict';

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

// Download and save video from URL
async function downloadVideo(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
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
    const { text, avatarId } = body;

    if (!text || !avatarId) {
      return NextResponse.json(
        { error: 'Missing required fields: text and avatarId' },
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

    // Call Hugging Face API
    const response = await fetch(HUGGING_FACE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [text, avatarId]
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result = await response.json() as HuggingFaceResponse;

    // Handle response data
    if (Array.isArray(result.data) && result.data.length > 0) {
      const videoData = result.data[0];

      if (typeof videoData === 'string' && videoData.startsWith('data:')) {
        // Handle base64 data
        saveBase64Video(videoData, cacheFilePath);
      } else if (typeof videoData === 'object' && 'url' in videoData) {
        // Handle URL response
        await downloadVideo(videoData.url, cacheFilePath);
      } else {
        throw new Error('Unexpected response format from Hugging Face API');
      }

      return NextResponse.json({
        videoUrl: publicPath,
        cached: false
      });
    }

    throw new Error('No video data in response');

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}