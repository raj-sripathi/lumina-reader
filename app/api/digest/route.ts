import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { generateDigest } from '@/lib/gemini';
import { extractPdfText } from '@/lib/content-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, customPrompt } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const item = await dbOperations.getItemById(itemId);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    let content = '';

    if (item.type === 'url' && item.metadata) {
      const metadata = JSON.parse(item.metadata);
      content = metadata.content;
    } else if (item.type === 'pdf' && item.file_path) {
      content = await extractPdfText(item.file_path);
    } else {
      return NextResponse.json({ error: 'No content available' }, { status: 400 });
    }

    // Generate digest using Gemini
    const digest = await generateDigest(content, customPrompt);

    // Update item with digest
    await dbOperations.updateDigest(itemId, digest, customPrompt);

    return NextResponse.json({ digest });
  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
  }
}
