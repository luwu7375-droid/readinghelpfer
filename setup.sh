#!/usr/bin/env bash
set -e

echo "🚀 AI Reading System 初始化向导"
echo ""

# 检查依赖
if ! command -v docker &> /dev/null; then
  echo "❌ Docker 未安装，请先安装 Docker Desktop"
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安装，请先安装 Node.js 20+"
  exit 1
fi

# 创建书籍目录
mkdir -p books kavita-config

# 复制 .env 文件
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ 已创建 .env 文件，请填写配置"
else
  echo "ℹ️  .env 文件已存在"
fi

# 安装 Node.js 依赖
echo ""
echo "📦 安装依赖..."
npm install

# 启动 Kavita
echo ""
echo "🐋 启动 Kavita..."
docker compose up -d

echo ""
echo "⏳ 等待 Kavita 启动..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200"; then
  echo "✅ Kavita 已启动：http://localhost:5000"
else
  echo "⚠️  Kavita 可能还在启动中，请稍候访问：http://localhost:5000"
fi

echo ""
echo "📋 下一步："
echo "  1. 访问 http://localhost:5000 完成 Kavita 初始化"
echo "  2. 在 Kavita 设置中获取 API Key"
echo "  3. 将书籍放入 ./books 目录"
echo "  4. 编辑 .env 填写配置"
echo "  5. npm run dev 启动 AI 阅读流程"
