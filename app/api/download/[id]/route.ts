import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id);
    const item = dbOperations.getItemById(itemId);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (!item.epub_path) {
      return NextResponse.json({ error: 'EPUB not found for this item' }, { status: 404 });
    }

    // Read the EPUB file
    const fileBuffer = await fs.readFile(item.epub_path);
    const filename = path.basename(item.epub_path);

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading EPUB:', error);
    return NextResponse.json({ error: 'Failed to download EPUB' }, { status: 500 });
  }
}
