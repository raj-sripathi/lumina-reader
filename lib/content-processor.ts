import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

export interface UrlMetadata {
  title: string;
  content: string;
  url: string;
}

export async function extractUrlContent(url: string): Promise<UrlMetadata> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LuminaReader/1.0)'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Remove script and style elements
    $('script, style, nav, header, footer, aside').remove();

    // Try to get title from various sources
    const title = $('title').text() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('h1').first().text() ||
                  'Untitled';

    // Try to extract main content
    let content = '';

    // Try common content containers
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.content',
      'body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        if (content.trim().length > 100) {
          break;
        }
      }
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();

    return {
      title: title.trim(),
      content,
      url
    };
  } catch (error) {
    console.error('Error extracting URL content:', error);
    throw new Error('Failed to extract content from URL');
  }
}

export async function extractPdfText(filePath: string): Promise<string> {
  try {
    // Lazy load pdf-parse-fork only when needed
    // @ts-ignore - pdf-parse-fork doesn't have proper ESM types
    const pdfParse = require('pdf-parse-fork');

    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function savePdfFile(file: Buffer, fileName: string): Promise<string> {
  const os = require('os');

  // Use /tmp for Vercel/serverless environments, otherwise use local directory
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  const baseDir = isServerless ? os.tmpdir() : path.join(process.cwd(), 'uploads');

  const uploadsDir = path.join(baseDir, 'pdfs');
  await fs.mkdir(uploadsDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = path.join(uploadsDir, `${timestamp}_${safeName}`);

  await fs.writeFile(filePath, file);
  return filePath;
}
