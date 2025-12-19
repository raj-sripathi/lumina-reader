import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { extractUrlContent, savePdfFile } from '@/lib/content-processor';

export async function GET() {
  try {
    const items = await dbOperations.getAllItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle PDF upload
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = await savePdfFile(buffer, file.name);

      const itemId = await dbOperations.addItem({
        type: 'pdf',
        title: file.name.replace('.pdf', ''),
        file_path: filePath,
        file_name: file.name,
        date_added: Date.now(),
        is_read: false
      });

      const item = await dbOperations.getItemById(itemId);
      return NextResponse.json({ item });
    } else {
      // Handle URL
      const body = await request.json();
      const { url } = body;

      if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      }

      const metadata = await extractUrlContent(url);

      const itemId = await dbOperations.addItem({
        type: 'url',
        title: metadata.title,
        url: metadata.url,
        date_added: Date.now(),
        is_read: false,
        metadata: JSON.stringify({ content: metadata.content })
      });

      const item = await dbOperations.getItemById(itemId);
      return NextResponse.json({ item });
    }
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
