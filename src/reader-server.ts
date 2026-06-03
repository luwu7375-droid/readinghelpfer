import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { AIClient } from './ai.js';
import { ReadingPipeline } from './reading.js';
import { ObsidianSync } from './obsidian.js';
import { BookParser } from './book-parser.js';
import * as fs from 'fs/promises';
import multer from 'multer';
import * as path from 'path';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({ dest: '/tmp/' });

const ai = new AIClient(
  process.env.CHEAP_API_KEY!,
  process.env.CHEAP_BASE_URL!,
  process.env.MAIN_API_KEY!,
  process.env.MAIN_BASE_URL!
);

const pipeline = new ReadingPipeline(
  ai,
  process.env.CHEAP_MODEL!,
  process.env.MAIN_MODEL!
);

const obsidian = new ObsidianSync(process.env.OBSIDIAN_VAULT_PATH!);

const booksDir = '/tmp/reading-books';
await fs.mkdir(booksDir, { recursive: true });

// 获取所有已上传的书籍
app.get('/api/books', async (req, res) => {
  const files = await fs.readdir(booksDir);
  const books = await Promise.all(
    files
      .filter(f => /\.(epub|txt|mobi|azw3)$/i.test(f))
      .map(async (f, i) => {
        const filePath = path.join(booksDir, f);
        const stats = await fs.stat(filePath);
        return {
          id: i,
          name: path.basename(f, path.extname(f)),
          filename: f,
          size: stats.size
        };
      })
  );
  res.json(books);
});

// 上传新书
app.post('/api/books/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const dest = path.join(booksDir, originalName);
  await fs.rename(req.file.path, dest);
  res.json({ success: true });
});

// 获取书籍章节
app.get('/api/books/:filename/chapters', async (req, res) => {
  const bookPath = path.join(booksDir, req.params.filename);
  const chapters = await BookParser.parse(bookPath);
  res.json(chapters.filter(ch => ch.text.length > 2000));
});

// 删除书籍
app.delete('/api/books/:filename', async (req, res) => {
  const bookPath = path.join(booksDir, req.params.filename);
  await fs.unlink(bookPath);
  res.json({ success: true });
});

// 保存/获取阅读进度
app.post('/api/progress', async (req, res) => {
  const progressFile = path.join(booksDir, 'progress.json');
  await fs.writeFile(progressFile, JSON.stringify(req.body));
  res.json({ success: true });
});

app.get('/api/progress', async (req, res) => {
  const progressFile = path.join(booksDir, 'progress.json');
  try {
    const data = await fs.readFile(progressFile, 'utf8');
    res.json(JSON.parse(data));
  } catch {
    res.json({});
  }
});

// AI 生成评论
app.post('/api/ai/comment', async (req, res) => {
  const { bookTitle, chapterTitle, highlightedText, surroundingText, previousInsights } = req.body;

  const comment = await pipeline.generateComment({
    bookOutline: bookTitle,
    chapterSummary: chapterTitle,
    highlightedText,
    surroundingText,
    previousInsights: previousInsights || []
  });

  res.json({ comment });
});

// 保存笔记
app.post('/api/notes/save', async (req, res) => {
  const { bookTitle, notes } = req.body;
  await obsidian.syncBook(bookTitle, notes);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 阅读服务器启动: http://localhost:${PORT}`);
  console.log('📱 手机访问请使用: http://<你的电脑IP>:' + PORT);
});
