# AI Reading System

> Kavita + Hermes + AI 自动阅读、标注、评论 → Obsidian

## 系统架构

```
书籍文件 (epub/pdf)
    ↓
Kavita (Docker, :5000)  ←──── Cloudflare Tunnel → 公网多端访问
    ↓ REST API
ai-reading-system (本地 TS 服务)
    ↓
AI 模型层
  ├── 便宜模型 (DeepSeek)   → 阅读 + 划线 + 初步感悟
  └── 主模型 (Claude 3.5)  → 深度评论
    ↓
Obsidian Vault (本地 Markdown)
```

## 快速开始

### 1. 初始化

```bash
git clone <this-repo> ai-reading-system
cd ai-reading-system
./setup.sh
```

### 2. 配置 Kavita

1. 访问 http://localhost:5000
2. 完成初始化设置（创建管理员账号）
3. 进入「Settings → API Keys」，生成 API Key
4. 把书籍放入 `./books/` 目录
5. 在 Kavita 里添加书库，扫描书籍

### 3. 配置 .env

```bash
cp .env.example .env
```

编辑 `.env`：

```
KAVITA_URL=http://localhost:5000
KAVITA_API_KEY=你的 Kavita API Key

OPENROUTER_API_KEY=你的 OpenRouter API Key

CHEAP_MODEL=deepseek/deepseek-chat          # 阅读 + 划线
MAIN_MODEL=anthropic/claude-3.5-sonnet      # 深度评论

OBSIDIAN_VAULT_PATH=/Users/你的用户名/Documents/Obsidian/你的库名
```

### 4. 运行

```bash
npm run dev
```

---

## Cloudflare Tunnel（多端同步）

```bash
# 安装 cloudflared
brew install cloudflared

# 登录（需要 Cloudflare 账号 + 域名）
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create kavita-reading

# 路由到你的域名
cloudflared tunnel route dns kavita-reading kavita.yourdomain.com

# 填写 cloudflare-tunnel.yml 后启动
cloudflared tunnel run kavita-reading
```

---

## 文件结构

```
ai-reading-system/
├── src/
│   ├── index.ts        # 主入口，阅读流程编排
│   ├── kavita.ts       # Kavita API 客户端
│   ├── ai.ts           # AI 模型调用（OpenRouter）
│   ├── reading.ts      # 阅读管道：划线 + 评论逻辑
│   └── obsidian.ts     # Obsidian Markdown 同步
├── books/              # 放书籍（epub/pdf/cbz）
├── kavita-config/      # Kavita 配置持久化（Docker volume）
├── docker-compose.yml  # Kavita 容器配置
├── cloudflare-tunnel.yml
├── setup.sh            # 一键初始化脚本
└── .env                # 环境变量（不提交 git）
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

## 成本参考

| 模型 | 用途 | 价格（约） |
|------|------|-----------|
| DeepSeek Chat | 阅读 + 划线 | $0.07/M tokens |
| Claude 3.5 Sonnet | 深度评论 | $3/M tokens |

一本 10 万字的书，大约产生 5-10 次主模型调用，费用 < $0.1。
