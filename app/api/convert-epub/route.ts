import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { convertPdfToEpub } from '@/lib/epub-converter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const item = dbOperations.getItemById(itemId);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.type !== 'pdf' || !item.file_path) {
      return NextResponse.json({ error: 'Item must be a PDF with a file path' }, { status: 400 });
    }

    // Convert PDF to EPUB
    const epubPath = await convertPdfToEpub(item.file_path, item.title);

    // Update item with epub path
    dbOperations.updateEpubPath(itemId, epubPath);

    return NextResponse.json({ epubPath, success: true });
  } catch (error) {
    console.error('Error converting to EPUB:', error);
    return NextResponse.json({ error: 'Failed to convert to EPUB' }, { status: 500 });
  }
}
