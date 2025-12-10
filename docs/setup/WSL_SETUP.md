# WSL 开发环境配置指南

本项目在 **Windows + WSL:Ubuntu-22.04** 环境下开发。

## 环境要求

- Windows 10/11 with WSL2
- Ubuntu 22.04 (WSL)
- Node.js 20.x (通过 nvm 管理)

## 首次设置

### 1. 安装 Node.js (使用 nvm)

如果还没有安装 nvm 和 Node.js，请运行：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc

# 安装 Node.js 20
nvm install 20
nvm use 20

# 设置默认版本
nvm alias default 20

# 验证安装
node --version  # 应该显示 v20.x.x
npm --version   # 应该显示 10.x.x
```

### 2. 安装项目依赖

```bash
cd /home/xiaoqing/code/mentor-os_-jobs

# 使用 --ignore-scripts 跳过可能出错的安装脚本
npm install --ignore-scripts

# 手动生成 Prisma Client
npx prisma generate
```

## 日常开发

### 启动开发服务器

**方法 1: 使用快捷脚本（推荐）**

```bash
./dev.sh
```

**方法 2: 手动命令**

```bash
source ~/.nvm/nvm.sh
nvm use 20
npm run dev
```

开发服务器将在以下地址运行：
- 本地: http://localhost:3000
- 网络: http://10.255.255.254:3000

### 其他常用命令

```bash
# 所有命令都需要先加载 nvm
source ~/.nvm/nvm.sh && nvm use 20

# 构建生产版本
npm run build

# 运行生产服务器
npm start

# 运行 linter
npm run lint

# Prisma 相关
npx prisma generate      # 生成 Prisma Client
npx prisma migrate dev   # 运行数据库迁移
npx prisma studio        # 打开 Prisma Studio
```

## 常见问题

### Q: 为什么需要每次都运行 `source ~/.nvm/nvm.sh`？

**A**: WSL 的每个新 shell 会话都需要重新加载 nvm。可以通过以下方式自动加载：

编辑 `~/.bashrc` 或 `~/.zshrc`，确保包含以下内容：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

然后运行 `source ~/.bashrc` 重新加载配置。

### Q: 为什么 Prisma 是 6.x 而不是最新的 7.x？

**A**: Prisma 7.x 要求 Node.js 20.19+ 或 22.12+。由于 WSL 和 Windows 路径兼容性问题，我们使用 Prisma 6.x 以确保稳定运行。

### Q: `npm install` 失败怎么办？

**A**: 如果遇到权限或路径问题，使用：

```bash
npm install --ignore-scripts
npx prisma generate
```

### Q: 如何在 Windows 访问 WSL 中的文件？

**A**: 在 Windows 文件资源管理器地址栏输入：

```
\\wsl$\Ubuntu-22.04\home\xiaoqing\code\mentor-os_-jobs
```

### Q: 如何在 VSCode 中打开 WSL 项目？

**A**:

1. 安装 "Remote - WSL" 扩展
2. 在 WSL 终端中，进入项目目录
3. 运行 `code .`

或者在 VSCode 中：
1. 按 `F1` 打开命令面板
2. 选择 "Remote-WSL: Open Folder in WSL"
3. 导航到项目目录

## 项目结构

```
mentor-os_-jobs/
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
├── lib/                    # 工具函数和配置
├── prisma/                 # Prisma 数据库配置
│   └── schema.prisma      # 数据库模型定义
├── public/                 # 静态资源
├── scripts/                # 构建和工具脚本
├── .env.local             # 环境变量（不提交到 git）
├── dev.sh                 # 开发服务器启动脚本
├── middleware.ts          # Next.js 中间件
├── next.config.ts         # Next.js 配置
├── package.json           # 项目依赖
├── tailwind.config.ts     # Tailwind CSS 配置
└── tsconfig.json          # TypeScript 配置
```

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **样式**: TailwindCSS v4
- **UI组件**: shadcn/ui
- **认证**: NextAuth.js v4
- **数据库**: Prisma ORM + Supabase PostgreSQL
- **AI**: OpenRouter API (Gemini 3 Pro)
- **运行时**: React 19

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并填写：

```env
# OpenRouter API (AI 功能)
OPENROUTER_API_KEY=your-api-key
CHAT_MODEL_ID=google/gemini-3-pro-preview
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Supabase 数据库
DATABASE_URL=your-supabase-connection-string

# NextAuth 认证
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth（可选）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth（可选）
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

## 部署

查看以下文档了解部署步骤：
- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Vercel 部署配置
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 数据库配置

---

**需要帮助？**
- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [WSL 文档](https://docs.microsoft.com/en-us/windows/wsl/)
