import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import fs from 'fs/promises';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Get item to clean up files
    const item = dbOperations.getItemById(itemId);

    if (item) {
      // Delete associated files
      if (item.file_path) {
        try {
          await fs.unlink(item.file_path);
        } catch (error) {
          console.error('Error deleting PDF file:', error);
        }
      }

    }

    dbOperations.deleteItem(itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    dbOperations.updateItem(itemId, body);

    const updatedItem = dbOperations.getItemById(itemId);
    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
