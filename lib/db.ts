import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'lumina.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS reading_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('url', 'pdf')),
    title TEXT NOT NULL,
    url TEXT,
    file_path TEXT,
    file_name TEXT,
    digest TEXT,
    digest_prompt TEXT,
    date_added INTEGER NOT NULL,
    is_read INTEGER DEFAULT 0,
    metadata TEXT
  )
`);

export interface ReadingItem {
  id?: number;
  type: 'url' | 'pdf';
  title: string;
  url?: string;
  file_path?: string;
  file_name?: string;
  digest?: string;
  digest_prompt?: string;
  date_added: number;
  is_read: boolean;
  metadata?: string;
}

// Database operations
export const dbOperations = {
  // Get all reading items
  getAllItems: () => {
    const stmt = db.prepare('SELECT * FROM reading_items ORDER BY date_added DESC');
    return stmt.all() as ReadingItem[];
  },

  // Get single item by ID
  getItemById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM reading_items WHERE id = ?');
    return stmt.get(id) as ReadingItem | undefined;
  },

  // Add new item
  addItem: (item: Omit<ReadingItem, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO reading_items (type, title, url, file_path, file_name, digest, digest_prompt, date_added, is_read, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      item.type,
      item.title,
      item.url || null,
      item.file_path || null,
      item.file_name || null,
      item.digest || null,
      item.digest_prompt || null,
      item.date_added,
      item.is_read ? 1 : 0,
      item.metadata || null
    );

    return result.lastInsertRowid as number;
  },

  // Update item
  updateItem: (id: number, updates: Partial<ReadingItem>) => {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => updates[k as keyof ReadingItem]);

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE reading_items SET ${setClause} WHERE id = ?`);

    return stmt.run(...values, id);
  },

  // Delete item
  deleteItem: (id: number) => {
    const stmt = db.prepare('DELETE FROM reading_items WHERE id = ?');
    return stmt.run(id);
  },

  // Mark as read
  markAsRead: (id: number, isRead: boolean) => {
    const stmt = db.prepare('UPDATE reading_items SET is_read = ? WHERE id = ?');
    return stmt.run(isRead ? 1 : 0, id);
  },

  // Update digest
  updateDigest: (id: number, digest: string, prompt?: string) => {
    const stmt = db.prepare('UPDATE reading_items SET digest = ?, digest_prompt = ? WHERE id = ?');
    return stmt.run(digest, prompt || null, id);
  },

};

export default db;
