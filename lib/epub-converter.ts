import { extractPdfText } from './content-processor';
import path from 'path';
import fs from 'fs/promises';

export interface EpubOptions {
  title: string;
  author?: string;
  content: string;
}

export async function convertPdfToEpub(pdfPath: string, title: string): Promise<string> {
  try {
    // Lazy load epub-gen-memory only when needed
    const epub = require('epub-gen-memory').default;
    const os = require('os');

    // Extract text from PDF
    const pdfText = await extractPdfText(pdfPath);

    // Use /tmp for Vercel/serverless environments, otherwise use local directory
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const baseDir = isServerless ? os.tmpdir() : path.join(process.cwd(), 'uploads');

    const epubDir = path.join(baseDir, 'epubs');
    await fs.mkdir(epubDir, { recursive: true });

    // Generate EPUB filename
    const timestamp = Date.now();
    const safeName = title.replace(/[^a-zA-Z0-9.-]/g, '_');
    const epubPath = path.join(epubDir, `${timestamp}_${safeName}.epub`);

    // Convert text to chapters (split by page or section)
    const chapters = splitIntoChapters(pdfText);

    console.log('Chapters generated:', chapters.length);
    console.log('First chapter:', chapters[0]);

    const options = {
      title: title,
      author: 'Unknown',
      content: chapters,
    };

    // Generate EPUB in memory using function approach
    const epubBuffer = await epub(options);

    // Save to file
    await fs.writeFile(epubPath, epubBuffer);

    return epubPath;
  } catch (error) {
    console.error('Error converting PDF to EPUB:', error);
    throw new Error('Failed to convert PDF to EPUB');
  }
}

function splitIntoChapters(text: string): Array<{ title: string; content: string }> {
  // Split text into chunks of approximately 5000 characters
  const chunkSize = 5000;
  const chunks: Array<{ title: string; content: string }> = [];

  let currentPos = 0;
  let chapterNum = 1;

  while (currentPos < text.length) {
    let endPos = Math.min(currentPos + chunkSize, text.length);

    // Try to break at a paragraph
    if (endPos < text.length) {
      const nextParagraph = text.indexOf('\n\n', endPos);
      if (nextParagraph !== -1 && nextParagraph - endPos < 500) {
        endPos = nextParagraph;
      }
    }

    const chunk = text.slice(currentPos, endPos).trim();

    if (chunk) {
      chunks.push({
        title: `Chapter ${chapterNum}`,
        content: chunk.replace(/\n/g, '<br/>')
      });
      chapterNum++;
    }

    currentPos = endPos;
  }

  return chunks.length > 0 ? chunks : [{
    title: 'Content',
    content: text.replace(/\n/g, '<br/>')
  }];
}
