# Supabase 数据库配置指南

## 为什么选择 Supabase？

✅ **完美适配**: Supabase 基于 PostgreSQL，与我们的 Prisma schema 100% 兼容
✅ **免费额度**: 提供慷慨的免费计划，适合开发和小规模应用
✅ **简单易用**: 提供直观的管理界面和自动备份
✅ **实时功能**: 内置实时订阅功能（未来可扩展）

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/)
2. 点击 "Start your project" 或 "New Project"
3. 创建新项目：
   - **Name**: `mentor-os-jobs` （或你喜欢的名称）
   - **Database Password**: 设置一个强密码（**务必保存！**）
   - **Region**: 选择离你最近的区域（中国用户建议选择 Singapore）
   - 点击 "Create new project"

### 2. 获取数据库连接字符串

项目创建完成后（大约 2 分钟）：

1. 进入项目 Dashboard
2. 点击左侧菜单 "Project Settings" (设置图标)
3. 选择 "Database"
4. 在 "Connection string" 部分，选择 **"URI"** 选项卡
5. 复制 "Connection pooling" 下的连接字符串，看起来像这样：

```
postgresql://postgres.xxxxx:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 3. 配置环境变量

将连接字符串粘贴到项目的 `.env.local` 文件中：

```bash
# 在 .env.local 文件中更新这一行
DATABASE_URL="你的Supabase连接字符串"
```

**重要提示**:
- 将连接字符串中的 `YOUR-PASSWORD` 替换为你在步骤1中设置的数据库密码
- 确保使用 **Connection pooling** 的连接字符串（端口 6543）而不是 Direct connection（端口 5432）

### 4. 运行数据库迁移

在项目根目录执行以下命令：

```bash
# 生成 Prisma Client
npx prisma generate

# 创建并应用数据库迁移
npx prisma migrate dev --name init

# 如果上面命令失败，可以尝试直接推送 schema（不创建迁移文件）
npx prisma db push
```

### 5. 验证数据库

在 Supabase Dashboard 中验证表已创建：

1. 进入项目 Dashboard
2. 点击左侧菜单 "Table Editor"
3. 你应该能看到以下表：
   - `User` - 用户表
   - `Account` - OAuth 账户表
   - `Session` - 会话表
   - `VerificationToken` - 验证令牌表
   - `Conversation` - 对话记录表
   - `Message` - 消息表

## 数据库结构

### 用户认证相关表

**User**: 存储用户基本信息
- id, name, email, password (加密)
- emailVerified, image
- 关联: accounts, sessions, conversations

**Account**: OAuth 账户信息（Google/GitHub）
**Session**: 用户会话管理
**VerificationToken**: 邮箱验证令牌

### 对话记录相关表

**Conversation**: 对话会话
- userId (关联到用户)
- title (对话标题，可选)
- language (对话语言: zh/en)
- createdAt, updatedAt

**Message**: 对话消息
- conversationId (关联到对话)
- role (USER/MODEL)
- content (消息内容)
- createdAt

## 功能说明

### 自动保存对话

✅ 每次用户发送消息时，会自动：
1. 创建新对话（如果是第一次）
2. 保存用户消息到数据库
3. 保存 AI 回复到数据库

### 数据安全

✅ 所有对话记录都与用户账户关联
✅ 只有登录用户才能访问自己的对话
✅ 密码使用 bcrypt 加密存储
✅ API 路由受 NextAuth 保护

## Supabase 管理

### 查看数据

1. 进入 Supabase Dashboard
2. 点击 "Table Editor"
3. 选择要查看的表
4. 可以直接在界面中查看、编辑、删除数据

### 备份数据

Supabase 提供自动备份功能（付费计划）。免费计划可以：

1. 使用 SQL Editor 导出数据：
   ```sql
   -- 导出所有对话
   SELECT * FROM "Conversation";

   -- 导出所有消息
   SELECT * FROM "Message";
   ```

2. 使用 Prisma Studio 查看数据：
   ```bash
   npx prisma studio
   ```
   浏览器会打开 `http://localhost:5555`，可以可视化查看和管理数据

## 常见问题

### Q: 迁移失败怎么办？

如果 `prisma migrate dev` 失败，尝试：
```bash
npx prisma db push
```

### Q: 如何重置数据库？

```bash
# 方法1: 使用 Prisma
npx prisma migrate reset

# 方法2: 在 Supabase Dashboard 中删除所有表后重新迁移
npx prisma db push
```

### Q: 如何查看当前数据？

```bash
npx prisma studio
```

### Q: 连接失败？

1. 检查 `.env.local` 中的 `DATABASE_URL` 是否正确
2. 确认密码已正确替换
3. 确认使用的是 Connection pooling 连接字符串（端口 6543）
4. 重启开发服务器：`npm run dev`

## 下一步

配置完 Supabase 后，你可以：

1. 设置 Google 和 GitHub OAuth（参考主 README）
2. 开始使用应用并测试对话保存功能
3. 在 Supabase Dashboard 中查看保存的对话记录

---

**需要帮助？**
- [Supabase 文档](https://supabase.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
