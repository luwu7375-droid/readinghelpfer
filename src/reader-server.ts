import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { AIClient } from './ai.js';
import { ReadingPipeline } from './reading.js';
import { BookParser } from './book-parser.js';
import * as fs from 'fs/promises';
import multer from 'multer';
import * as path from 'path';
import * as db from './db.js';
import { hashPassword, verifyPassword, generateJWT, authMiddleware } from './auth.js';
import { registerLimiter, loginLimiter, aiLimiter } from './rate-limit.js';
import { validateFileUpload, checkBookLimit } from './file-limit.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({ dest: '/tmp/' });

await db.initDB();

app.post('/api/auth/register', registerLimiter, async (req, res) => {
  const { email, password, inviteCode } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (process.env.INVITE_CODE && inviteCode !== process.env.INVITE_CODE) {
    return res.status(403).json({ error: '邀请码错误' });
  }
  if (db.getUserByEmail(email)) return res.status(400).json({ error: 'Email already exists' });
  const userId = await db.createUser(email, await hashPassword(password));
  res.json({ token: generateJWT(userId), userId });
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: generateJWT(user.id as number), userId: user.id });
});

app.get('/api/user/profile', authMiddleware, async (req, res) => {
  const user = db.getUserById((req as any).userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ email: user.email, userId: user.id });
});

app.put('/api/user/profile', authMiddleware, async (req, res) => {
  res.json({ success: true });
});

app.get('/api/books', authMiddleware, async (req, res) => {
  res.json(db.getBooksByUser((req as any).userId));
});

app.post('/api/books/upload', authMiddleware, upload.single('file'), validateFileUpload, checkBookLimit, async (req, res) => {
  const userId = (req as any).userId;
  const file = (req as any).file;
  const rawName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const originalName = path.basename(rawName).replace(/[/\\]/g, '');
  if (!originalName || originalName.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const userBooksDir = path.join(process.cwd(), 'data', 'books', String(userId));
  await fs.mkdir(userBooksDir, { recursive: true });
  await fs.rename(file.path, path.join(userBooksDir, originalName));
  await db.createBook(userId, originalName, originalName, file.size);
  res.json({ success: true });
});

function sanitizeFilename(rawParam: string): string | null {
  // 拒绝任何包含路径分隔符或 .. 的参数（解码前后都检查）
  if (/[/\\]|\.\./.test(rawParam)) return null;
  const decoded = decodeURIComponent(rawParam);
  if (/[/\\]|\.\./.test(decoded)) return null;
  const base = path.basename(decoded);
  if (!base) return null;
  return base;
}

app.get('/api/books/:filename/chapters', authMiddleware, async (req, res) => {
  const filename = sanitizeFilename(req.params.filename);
  if (!filename) return res.status(400).json({ error: 'Invalid filename' });
  const bookPath = path.join(process.cwd(), 'data', 'books', String((req as any).userId), filename);
  const chapters = await BookParser.parse(bookPath);
  res.json(chapters.filter(ch => ch.text.length > 2000));
});

app.delete('/api/books/:filename', authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const filename = sanitizeFilename(req.params.filename);
  if (!filename) return res.status(400).json({ error: 'Invalid filename' });
  await fs.unlink(path.join(process.cwd(), 'data', 'books', String(userId), filename));
  await db.deleteBook(userId, filename);
  res.json({ success: true });
});

app.post('/api/progress', authMiddleware, async (req, res) => {
  await db.saveUserData((req as any).userId, req.body);
  res.json({ success: true });
});

app.get('/api/progress', authMiddleware, async (req, res) => {
  res.json(db.getUserData((req as any).userId));
});

app.post('/api/ai/test', authMiddleware, aiLimiter, async (req, res) => {
  const { apiKey, baseUrl, model } = req.body;
  if (!apiKey) return res.status(400).json({ error: '缺少 API Key' });
  try {
    const testAI = new AIClient(apiKey, baseUrl, apiKey, baseUrl);
    const testPipeline = new ReadingPipeline(testAI, model, model);
    await testPipeline.generateComment({
      bookOutline: 'Test', chapterSummary: 'Test',
      highlightedText: 'Hello', surroundingText: 'Hello world',
      previousInsights: []
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'API 调用失败' });
  }
});

app.post('/api/ai/comment', authMiddleware, aiLimiter, async (req, res) => {
  const { bookTitle, chapterTitle, highlightedText, surroundingText, previousInsights, conversationHistory, userApiConfig } = req.body;

  if (!userApiConfig) return res.status(400).json({ error: 'Please configure API key' });
  const cheapConfig = userApiConfig.cheap;
  const mainConfig = userApiConfig.main?.apiKey ? userApiConfig.main : cheapConfig;

  if (!cheapConfig?.apiKey && !mainConfig?.apiKey) {
    return res.status(400).json({ error: 'Please configure API key' });
  }

  try {
    const userAI = new AIClient(
      cheapConfig.apiKey,
      cheapConfig.baseUrl || 'https://api.openai.com/v1',
      mainConfig.apiKey,
      mainConfig.baseUrl || 'https://api.openai.com/v1'
    );
    let comment: string;
    if (conversationHistory?.length > 0) {
      comment = await userAI.complete(mainConfig.model || 'gpt-4', `基于之前的对话，回答：\n\n${conversationHistory[conversationHistory.length - 1].content}`, true);
    } else {
      const pipeline = new ReadingPipeline(userAI, cheapConfig.model || 'gpt-3.5-turbo', mainConfig.model || 'gpt-4');
      comment = await pipeline.generateComment({ bookOutline: bookTitle, chapterSummary: chapterTitle, highlightedText, surroundingText, previousInsights: previousInsights || [] });
    }
    res.json({ comment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI failed' });
  }
});

app.post('/api/notes/export', authMiddleware, async (req, res) => {
  const { bookTitle, notes } = req.body;
  let content = `# ${bookTitle}\n\n> 最后更新：${new Date().toLocaleString('zh-CN')}\n\n`;
  for (const note of notes) {
    content += `## ${note.chapterTitle}\n\n> ${note.highlightedText}\n\n`;
    const msgs: Array<{role: string, content: string}> = note.messages || [];
    if (msgs.length > 0) {
      content += msgs.map((m: {role: string, content: string}) => (m.role === 'user' ? '我：' : 'AI：') + m.content).join('\n\n') + '\n\n';
    }
    content += `*${note.timestamp}*\n\n---\n\n`;
  }
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${bookTitle}.md"`);
  res.send(content);
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`🚀 Server: http://localhost:${process.env.PORT || 3000}`));
