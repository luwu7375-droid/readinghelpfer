# AI Reading System

> AI 辅助阅读：上传书籍、3D 翻页、AI 划线评论 → Obsidian

## 系统架构

```
书籍文件 (epub/txt/mobi/azw3)
    ↓ 上传
Web 阅读器 (3D 翻页)
    ↓ 选中文字
AI 模型层
  ├── 便宜模型   → 快速响应
  └── 主模型    → 深度评论
    ↓
Obsidian Vault (本地 Markdown)
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 .env

```bash
cp .env.example .env
```

编辑 `.env`：

```
BOOKS_DIR=                          # 可选，默认 data/books
APP_PASSWORD=                       # 可选，访问密码

CHEAP_API_KEY=your_api_key
CHEAP_BASE_URL=https://api.openai.com/v1
MAIN_API_KEY=your_api_key
MAIN_BASE_URL=https://api.openai.com/v1

CHEAP_MODEL=gpt-3.5-turbo
MAIN_MODEL=gpt-4

OBSIDIAN_VAULT_PATH=/Users/你的用户名/Documents/Obsidian/你的库名
```

### 3. 运行

```bash
npm start
```

访问 http://localhost:3000

---

## 文件结构

```
ai-reading-system/
├── src/
│   ├── reader-server.ts  # 主服务器
│   ├── ai.ts            # AI 模型调用
│   ├── reading.ts       # 阅读管道：划线 + 评论逻辑
│   ├── obsidian.ts      # Obsidian Markdown 同步
│   └── book-parser.ts   # 书籍解析
├── public/
│   └── index.html       # Web 阅读器（3D 翻页）
├── data/
│   └── books/           # 上传的书籍
├── legacy/              # 已废弃的 Kavita 相关文件
└── .env                 # 环境变量（不提交 git）
```

---

## AI 评论上下文

每条评论调用主模型时传入：

| 上下文项 | 说明 |
|---------|------|
| 全书大纲 | 书籍简介/大纲 |
| 当前章节摘要 | 便宜模型先生成 |
| AI 之前感悟 | 本章已生成的评论（累积） |
| 划线前后 300 字 | 原文上下文窗口 |
| 划线文字 | 被标注的原句 |
| 我的批注 | 若有，一并带入 |

---

## Obsidian 笔记格式

```markdown
# 书名

> 最后更新：2025-06-01

## 第一章 章节标题

> 划线句子原文

AI 的评论内容...

**我的批注**：我的批注内容

*2025-06-01 14:30:00*

---
```

---

## 功能特性

- 📚 支持 EPUB/TXT/MOBI/AZW3 格式
- 📖 3D 翻页效果
- ✏️ 选中文字即可生成 AI 评论
- 💬 多轮对话追问
- 📝 自动同步到 Obsidian
- 🔐 可选访问密码保护
