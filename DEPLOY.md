# Railway 部署指南

## 快速部署步骤

### 方法 1: 通过 GitHub 部署（推荐）

1. **创建 GitHub 仓库**
   - 访问 https://github.com/new
   - 仓库名: `ai-reading-system`
   - 设为 Public
   - 不要添加 README、.gitignore 或 license（我们已经有了）
   - 点击 "Create repository"

2. **推送代码到 GitHub**

   在终端运行：
   ```bash
   git remote add origin https://github.com/你的用户名/ai-reading-system.git
   git branch -M main
   git push -u origin main
   ```

3. **部署到 Railway**
   - 访问 https://railway.app
   - 用 GitHub 账号登录
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `ai-reading-system` 仓库
   - Railway 会自动检测并部署

4. **设置环境变量**

   在 Railway 项目设置中添加：
   ```
   CHEAP_API_KEY=你的API密钥
   CHEAP_BASE_URL=https://api.example.com
   MAIN_API_KEY=你的API密钥
   MAIN_BASE_URL=https://api.example.com
   CHEAP_MODEL=gpt-3.5-turbo
   MAIN_MODEL=gpt-4
   OBSIDIAN_VAULT_PATH=/tmp/obsidian
   ```

5. **获取部署地址**
   - 部署完成后，点击 "Settings" → "Networking"
   - 点击 "Generate Domain"
   - 会得到一个公开地址，如: `https://your-app.railway.app`

### 方法 2: 通过 Railway CLI 部署

在终端运行：
```bash
# 登录（会打开浏览器）
railway login

# 初始化项目
railway init

# 部署
railway up

# 获取部署地址
railway domain
```

## 部署后

访问生成的公开地址即可使用，可以在任何设备上访问！

## 注意事项

- 免费版有 500 小时/月的限制
- 上传的书籍会在服务重启后丢失（存储在 /tmp 目录）
- 如需持久化存储，需要添加 Volume 存储卷
