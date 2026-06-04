import { Request, Response, NextFunction } from 'express';
import { getBooksByUser } from './db.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_BOOKS_PER_USER = 100;
const ALLOWED_EXTENSIONS = ['.epub', '.txt', '.mobi', '.azw3'];

export function validateFileUpload(req: Request, res: Response, next: NextFunction) {
  const file = (req as any).file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File too large (max 50MB)' });
  }

  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  next();
}

export async function checkBookLimit(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  const books = getBooksByUser(userId);

  if (books.length >= MAX_BOOKS_PER_USER) {
    return res.status(400).json({ error: 'Book limit reached (max 100 books)' });
  }

  next();
}
