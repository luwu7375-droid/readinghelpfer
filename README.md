# Reading Helper

一个本地运行的轻量阅读助手。

它不是完整书库系统，也不是 Kavita 外挂。当前版本更接近一个“本地网页阅读器 + 划线笔记 + AI 评论 + Obsidian/文件导出”的小工具。

## 现在能做什么

- 上传书籍并按章节阅读
- 在正文里划线，生成笔记
- 给划线内容添加自己的想法
- 调用自带 API 配置生成 AI 评论
- 对一条笔记继续追问、继续讨论
- 添加书签并保存阅读进度
- 导出笔记为 Markdown / HTML / TXT
- 将当前书籍笔记保存到 Obsidian Vault
- 切换浅色/深色主题
- 切换字体与阅读方式：向下滚动 / 点击翻页

## 技术栈

- Node.js + TypeScript
- Express 本地服务
- 原生 HTML / CSS / JavaScript 前端
- OpenAI-compatible Chat Completions API
- 本地文件存储
- Obsidian Markdown 同步

## 当前运行方式

```bash
npm install
npm run start
```

启动后访问：

```text
http://localhost:3000
```

手机和电脑在同一个局域网时，也可以用电脑局域网 IP 访问：

```text
http://<你的电脑IP>:3000
```

服务会把上传的书和阅读进度暂存在：

```text
/tmp/reading-books
```

这适合本地自用，不适合作为长期稳定存储。后面如果要认真使用，建议改成项目目录下的 `data/` 或用户自定义路径。

## 环境变量

新建 `.env`：

```bash
cp .env.example .env
```

当前后端会读取这些字段：

```env
CHEAP_API_KEY=你的便宜模型 API Key
CHEAP_BASE_URL=https://api.openai.com/v1

MAIN_API_KEY=你的主模型 API Key
MAIN_BASE_URL=https://api.openai.com/v1

CHEAP_MODEL=gpt-4o-mini
MAIN_MODEL=gpt-4o

OBSIDIAN_VAULT_PATH=/Users/你的用户名/Documents/Obsidian/你的库名
```

前端也有一个“API 设置”入口，可以在浏览器里配置 API Key / Base URL / Model。这个配置会保存在浏览器 localStorage，并在生成评论时发送给本地服务。

不要把这个服务直接暴露到公网。它目前没有登录、权限和 API Key 保护。

## 支持的书籍格式

当前后端识别：

```text
epub / txt / mobi / azw3
```

但实际状态是：

- EPUB：主要支持格式
- TXT：后端支持章节解析，但前端上传入口目前主要面向 EPUB
- MOBI / AZW3：暂未真正解析，会提示用 Calibre 转成 EPUB 或 TXT
- PDF：当前不支持

## 主要功能路径

### 阅读

上传书籍后，后端解析章节，前端展示章节列表。点击章节后，正文会渲染到阅读区。

阅读模式现在有两种：

- 向下滚动
- 点击翻页

点击翻页目前基于 CSS 多栏布局和 `scrollLeft` 实现，效果更像横向分页滑动，还不是 Apple Books 那种 3D 纸页翻动。

### 划线和笔记

选中正文后会出现操作菜单：

- 自己写
- AI 评论
- 与 AI 讨论
- 仅标记
- 添加书签

笔记会保留：

- 所在章节
- 划线原文
- 上下文
- AI 评论或自己的批注
- 创建时间

### AI 评论

评论接口走 OpenAI-compatible Chat Completions 格式。

生成评论时会传入：

- 书名
- 当前章节名
- 划线文字
- 划线前后约 300 字上下文
- 已有对话历史
- 用户在前端设置的 API 配置

当前评论 prompt 还比较轻，主要目标是“基于上下文写 1-2 段自然评论”。如果要做更可靠的文学分析、OOC 检查、情绪递进检查，需要继续单独打磨 prompt。

### 导出

当前支持浏览器端导出：

- Markdown `.md`
- HTML `.html`
- 纯文本 `.txt`

可以选择是否包含上下文。

### Obsidian 同步

点击“保存”会把当前书籍笔记写入：

```text
<OBSIDIAN_VAULT_PATH>/Reading Notes/<书名>.md
```

## API 概览

```text
GET    /api/books
POST   /api/books/upload
GET    /api/books/:filename/chapters
DELETE /api/books/:filename

GET    /api/progress
POST   /api/progress

POST   /api/ai/test
POST   /api/ai/comment

POST   /api/notes/save
```

## 项目结构

```text
readinghelpfer/
├── public/
│   └── index.html          # 前端页面、阅读器、导出、设置、笔记交互
├── src/
│   ├── reader-server.ts    # Express 服务入口
│   ├── ai.ts               # OpenAI-compatible API 调用
│   ├── reading.ts          # AI 评论与阅读上下文逻辑
│   ├── book-parser.ts      # 书籍格式分发与 TXT 解析
│   └── obsidian.ts         # Obsidian Markdown 写入
├── package.json
├── .env.example
└── README.md
```

## 已知限制

- 目前不是多用户产品，只适合本地自用
- 没有账号、鉴权、权限隔离
- 上传文件和阅读进度暂存在 `/tmp/reading-books`
- 前端是单文件实现，后续功能变多后会越来越难维护
- MOBI / AZW3 还没有真正解析
- PDF 暂不支持
- AI 评论质量依赖 prompt 和模型，需要单独测试
- 导出质量主要取决于笔记数据结构和导出模板，不完全是 prompt 问题

## 下一步可以做

- 把存储路径从 `/tmp` 改成可配置目录
- 修正 `.env.example`，移除旧的 Kavita 字段
- 给导出和评论分别加测试样例
- 新增第三种阅读方式：3D page curl / Apple Books 风格翻页
- 拆分 `public/index.html`，把阅读器、笔记、导出、设置分模块
- 强化 AI 评论 prompt，避免空泛评论和乱扩写

## 当前定位

这个项目的重点不是“自动帮你读完整本书”。

更准确地说，它是一个私人阅读现场：你划线、你停下来、你让 AI 接住这一小段文本，然后把这些瞬间保存下来。