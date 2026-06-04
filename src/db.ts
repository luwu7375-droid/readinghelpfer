import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs/promises';
import * as path from 'path';

let db: Database;

export async function initDB(dbPath: string = 'data/app.db') {
  const SQL = await initSqlJs();

  try {
    const buffer = await fs.readFile(dbPath);
    db = new SQL.Database(buffer);
  } catch {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE reading_progress (
        user_id INTEGER NOT NULL,
        book_filename TEXT NOT NULL,
        chapter_index INTEGER DEFAULT 0,
        scroll_position INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, book_filename),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        chapter_title TEXT NOT NULL,
        highlighted_text TEXT NOT NULL,
        ai_comment TEXT,
        user_annotation TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (book_id) REFERENCES books(id)
      );
      CREATE TABLE user_data (
        user_id INTEGER PRIMARY KEY,
        data TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
  }

  await saveDB(dbPath);
  return db;
}

async function saveDB(dbPath: string) {
  const data = db.export();
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, data);
}

export async function createUser(email: string, passwordHash: string) {
  db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, passwordHash]);
  await saveDB('data/app.db');
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
}

export function getUserByEmail(email: string) {
  const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
  if (result.length === 0) return null;
  const row = result[0];
  return {
    id: row.values[0][0],
    email: row.values[0][1],
    password_hash: row.values[0][2]
  };
}

export function getUserById(id: number) {
  const result = db.exec('SELECT * FROM users WHERE id = ?', [id]);
  if (result.length === 0) return null;
  const row = result[0];
  return {
    id: row.values[0][0],
    email: row.values[0][1]
  };
}

export function getBooksByUser(userId: number) {
  const result = db.exec('SELECT * FROM books WHERE user_id = ?', [userId]);
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0],
    user_id: row[1],
    filename: row[2],
    name: row[3].replace(/\.[^.]+$/, ''),
    size: row[4],
    uploaded_at: row[5]
  }));
}

export async function createBook(userId: number, filename: string, originalName: string, size: number) {
  const exists = db.exec('SELECT id FROM books WHERE user_id = ? AND filename = ?', [userId, filename]);
  if (exists.length > 0) return;
  db.run('INSERT INTO books (user_id, filename, original_name, size) VALUES (?, ?, ?, ?)',
    [userId, filename, originalName, size]);
  await saveDB('data/app.db');
}

export async function deleteBook(userId: number, filename: string) {
  db.run('DELETE FROM books WHERE user_id = ? AND filename = ?', [userId, filename]);
  await saveDB('data/app.db');
}

export function getProgress(userId: number, bookFilename: string) {
  const result = db.exec('SELECT * FROM reading_progress WHERE user_id = ? AND book_filename = ?',
    [userId, bookFilename]);
  if (result.length === 0) return null;
  return {
    chapter_index: result[0].values[0][2],
    scroll_position: result[0].values[0][3]
  };
}

export async function saveProgress(userId: number, bookFilename: string, chapterIndex: number, scrollPosition: number) {
  db.run(`INSERT OR REPLACE INTO reading_progress (user_id, book_filename, chapter_index, scroll_position, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`, [userId, bookFilename, chapterIndex, scrollPosition]);
  await saveDB('data/app.db');
}

export function getUserData(userId: number): any {
  const result = db.exec('SELECT data FROM user_data WHERE user_id = ?', [userId]);
  if (result.length === 0) return {};
  try { return JSON.parse(result[0].values[0][0] as string); } catch { return {}; }
}

export async function saveUserData(userId: number, data: any) {
  db.run('INSERT OR REPLACE INTO user_data (user_id, data) VALUES (?, ?)', [userId, JSON.stringify(data)]);
  await saveDB('data/app.db');
}
