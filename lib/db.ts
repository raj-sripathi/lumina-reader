import { sql } from '@vercel/postgres';
import path from 'path';

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

const dbPath = path.join(process.cwd(), 'lumina.db');
const usePostgres = Boolean(process.env.VERCEL || process.env.POSTGRES_URL);
let sqliteDb: import('better-sqlite3').Database | undefined;
let schemaReady: Promise<void> | null = null;

function getSqliteDb(): import('better-sqlite3').Database {
  if (!sqliteDb) {
    const Database = require('better-sqlite3');
    sqliteDb = new Database(dbPath);
  }
  return sqliteDb;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    if (usePostgres) {
      schemaReady = sql`
        CREATE TABLE IF NOT EXISTS reading_items (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('url', 'pdf')),
          title TEXT NOT NULL,
          url TEXT,
          file_path TEXT,
          file_name TEXT,
          digest TEXT,
          digest_prompt TEXT,
          date_added BIGINT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          metadata TEXT
        )
      `.then(() => undefined);
    } else {
      const db = getSqliteDb();
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
      schemaReady = Promise.resolve();
    }
  }
  return schemaReady;
}

function normalizeIsRead(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return false;
}

function normalizeReadingItem(row: ReadingItem): ReadingItem {
  return {
    ...row,
    is_read: normalizeIsRead((row as { is_read: unknown }).is_read)
  };
}

export const dbOperations = {
  // Get all reading items
  getAllItems: async () => {
    await ensureSchema();
    if (usePostgres) {
      const { rows } = await sql<ReadingItem>`
        SELECT
          id,
          type,
          title,
          url,
          file_path,
          file_name,
          digest,
          digest_prompt,
          date_added,
          is_read,
          metadata
        FROM reading_items
        ORDER BY date_added DESC
      `;
      return rows.map(normalizeReadingItem);
    }

    const db = getSqliteDb();
    const stmt = db.prepare('SELECT * FROM reading_items ORDER BY date_added DESC');
    const rows = stmt.all() as ReadingItem[];
    return rows.map(normalizeReadingItem);
  },

  // Get single item by ID
  getItemById: async (id: number) => {
    await ensureSchema();
    if (usePostgres) {
      const { rows } = await sql<ReadingItem>`
        SELECT
          id,
          type,
          title,
          url,
          file_path,
          file_name,
          digest,
          digest_prompt,
          date_added,
          is_read,
          metadata
        FROM reading_items
        WHERE id = ${id}
      `;
      return rows[0] ? normalizeReadingItem(rows[0]) : undefined;
    }

    const db = getSqliteDb();
    const stmt = db.prepare('SELECT * FROM reading_items WHERE id = ?');
    const row = stmt.get(id) as ReadingItem | undefined;
    return row ? normalizeReadingItem(row) : undefined;
  },

  // Add new item
  addItem: async (item: Omit<ReadingItem, 'id'>) => {
    await ensureSchema();
    if (usePostgres) {
      const { rows } = await sql<{ id: number }>`
        INSERT INTO reading_items (
          type,
          title,
          url,
          file_path,
          file_name,
          digest,
          digest_prompt,
          date_added,
          is_read,
          metadata
        )
        VALUES (
          ${item.type},
          ${item.title},
          ${item.url || null},
          ${item.file_path || null},
          ${item.file_name || null},
          ${item.digest || null},
          ${item.digest_prompt || null},
          ${item.date_added},
          ${item.is_read},
          ${item.metadata || null}
        )
        RETURNING id
      `;
      return rows[0].id;
    }

    const db = getSqliteDb();
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
  updateItem: async (id: number, updates: Partial<ReadingItem>) => {
    await ensureSchema();
    const entries = Object.entries(updates).filter(([key, value]) => key !== 'id' && value !== undefined);
    if (entries.length === 0) {
      return;
    }
    const fields = entries.map(([key]) => key);
    const values = entries.map(([key, value]) =>
      key === 'is_read' ? normalizeIsRead(value) : value
    );

    if (usePostgres) {
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      await sql.query(
        `UPDATE reading_items SET ${setClause} WHERE id = $${fields.length + 1}`,
        [...values, id]
      );
      return;
    }

    const db = getSqliteDb();
    const sqliteValues = values.map((value, index) =>
      fields[index] === 'is_read' ? (value ? 1 : 0) : value
    );
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE reading_items SET ${setClause} WHERE id = ?`);
    stmt.run(...sqliteValues, id);
  },

  // Delete item
  deleteItem: async (id: number) => {
    await ensureSchema();
    if (usePostgres) {
      await sql`DELETE FROM reading_items WHERE id = ${id}`;
      return;
    }

    const db = getSqliteDb();
    const stmt = db.prepare('DELETE FROM reading_items WHERE id = ?');
    stmt.run(id);
  },

  // Mark as read
  markAsRead: async (id: number, isRead: boolean) => {
    await ensureSchema();
    if (usePostgres) {
      await sql`UPDATE reading_items SET is_read = ${isRead} WHERE id = ${id}`;
      return;
    }

    const db = getSqliteDb();
    const stmt = db.prepare('UPDATE reading_items SET is_read = ? WHERE id = ?');
    stmt.run(isRead ? 1 : 0, id);
  },

  // Update digest
  updateDigest: async (id: number, digest: string, prompt?: string) => {
    await ensureSchema();
    if (usePostgres) {
      await sql`
        UPDATE reading_items
        SET digest = ${digest}, digest_prompt = ${prompt || null}
        WHERE id = ${id}
      `;
      return;
    }

    const db = getSqliteDb();
    const stmt = db.prepare('UPDATE reading_items SET digest = ?, digest_prompt = ? WHERE id = ?');
    stmt.run(digest, prompt || null, id);
  }
};
