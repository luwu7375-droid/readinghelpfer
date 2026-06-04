# 部署说明

> **不适合的平台**
> - **Vercel**：Serverless 环境，本地文件系统不可持久化，数据库和书籍文件均会丢失。
> - **Render 免费层**：不提供 Persistent Disk，重启后 `data/` 全部丢失。

---

## 方案一：Railway（推荐）

`railway.json` 已配置，直接支持 `npm start`。

### 操作步骤

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → 选本仓库
2. 部署完成后，进入服务页面 → **Volumes** → **Add Volume**
   - Mount Path：`/app/data`
   - Size：按需（1 GB 起步）
3. 设置环境变量（Settings → Variables）：

| 变量 | 值 |
|------|----|
| `DATABASE_URL` | `/app/data/app.db` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 随机长字符串（可用 `openssl rand -hex 32` 生成） |
| `INVITE_CODE` | 你的邀请码 |

4. 挂载 Volume 后点 **Redeploy**
5. Settings → Networking → **Generate Domain** 获取公网地址

---

## 方案二：Render 付费 Web Service

`render.yaml` 已配置，含 Persistent Disk。

### 操作步骤

1. [render.com](https://render.com) → New → Web Service → 连接 GitHub 仓库
2. 配置：
   - **Build Command**：`npm install`
   - **Start Command**：`npm start`
   - **Instance Type**：Starter（$7/月）或以上（免费层无持久盘）
3. Advanced → **Add Disk**：
   - Name：`data`
   - Mount Path：`/opt/render/project/src/data`
   - Size：1 GB
4. 设置环境变量：

| 变量 | 值 |
|------|----|
| `DATABASE_URL` | `/opt/render/project/src/data/app.db` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 随机长字符串 |
| `INVITE_CODE` | 你的邀请码 |

5. 点 **Create Web Service**，Render 自动分配 `*.onrender.com` 域名

---

## 环境变量说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | `3000` | Railway/Render 会自动注入，无需手动设置 |
| `JWT_SECRET` | **生产必填** | — | 未设置时生产环境启动报错退出 |
| `DATABASE_URL` | 生产必填 | `data/app.db` | 必须指向持久盘路径 |
| `INVITE_CODE` | 否 | — | 设置后注册必须提供邀请码；留空则不校验 |

## 安全提示

- API Key 仅存于用户浏览器 `localStorage`，不进入数据库
- 生产环境使用平台自带 HTTPS，无需额外配置
