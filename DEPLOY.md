# 部署说明

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `PORT` | 否 | 监听端口，默认 `3000` |
| `JWT_SECRET` | **生产必填** | JWT 签名密钥，必须是强随机值。未设置时生产环境启动会报错退出 |
| `DATABASE_URL` | 否 | SQLite 文件路径，默认 `data/app.db` |
| `INVITE_CODE` | 否 | 注册邀请码。设置后注册必须提供匹配的邀请码。留空则不校验（本地开发） |

## 持久化目录

云端部署必须将以下路径挂载为持久化卷，否则重启后数据丢失：

```
data/app.db        # SQLite 数据库（用户、书单、阅读进度、笔记）
data/books/        # 用户上传的 epub 文件
```

## 启动

```bash
npm install
npm start
```

## 安全提示

- 生产环境务必设置 `JWT_SECRET`（随机长字符串）
- API Key 仅存于用户浏览器的 `localStorage`，不进入数据库
- 建议在反向代理层（nginx / Caddy）配置 HTTPS
