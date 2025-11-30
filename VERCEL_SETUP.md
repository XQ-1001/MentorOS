# Vercel 部署配置指南

## 部署修复说明

### 问题解决

✅ **已修复**: DATABASE_URL 缺失导致的构建失败问题
- 创建了自动处理脚本 `scripts/generate-prisma.sh`
- 构建时如果缺少 DATABASE_URL，会自动使用占位符
- 这样可以让 Prisma Client 正常生成，不影响构建过程

### 下一步：配置环境变量

虽然现在可以成功构建，但要让应用正常运行，你仍需要在 Vercel 配置以下环境变量：

## 必需的环境变量

在 Vercel Dashboard 中配置这些环境变量（不包括敏感信息，请根据你的实际情况填写）：

### 1. OpenRouter API（AI 功能）
```
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=google/gemini-3-pro-preview
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### 2. Supabase 数据库
```
DATABASE_URL=你的Supabase连接字符串
```
**重要**: 必须使用你在 Supabase 中获取的真实连接字符串（参考 SUPABASE_SETUP.md）

### 3. NextAuth 认证
```
NEXTAUTH_URL=https://你的vercel域名.vercel.app
NEXTAUTH_SECRET=生成一个随机密钥
```

**生成 NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 4. Google OAuth（可选，如果要使用 Google 登录）
```
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
```

### 5. GitHub OAuth（可选，如果要使用 GitHub 登录）
```
GITHUB_ID=你的GitHub客户端ID
GITHUB_SECRET=你的GitHub客户端密钥
```

## 如何在 Vercel 配置环境变量

### 方法 1: 在 Vercel Dashboard 中配置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** 标签
4. 点击左侧菜单的 **Environment Variables**
5. 逐个添加上述环境变量：
   - **Key**: 变量名（如 `DATABASE_URL`）
   - **Value**: 变量值
   - **Environments**: 选择 `Production`, `Preview`, `Development`（建议全选）
6. 点击 **Save**

### 方法 2: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
# ... 添加其他变量
```

## 重新部署

配置完环境变量后，需要重新部署：

### 选项 1: 推送代码触发自动部署
```bash
git push origin main
```

### 选项 2: 在 Vercel Dashboard 手动触发
1. 进入项目的 **Deployments** 标签
2. 点击最新部署旁边的 **⋯** 菜单
3. 选择 **Redeploy**

## 验证部署

部署成功后：

1. **访问你的应用**: `https://你的项目名.vercel.app`
2. **测试登录功能**:
   - 邮箱密码登录
   - Google OAuth（如果配置了）
   - GitHub OAuth（如果配置了）
3. **测试对话功能**:
   - 发送消息
   - 检查是否正常保存到 Supabase
4. **检查主题切换**: 确保夜间模式正常工作

## 常见问题

### Q: 部署后显示 500 错误？
**A**: 检查环境变量是否正确配置，特别是 `DATABASE_URL` 和 `NEXTAUTH_SECRET`

### Q: 登录后跳转失败？
**A**: 确保 `NEXTAUTH_URL` 设置为你的实际 Vercel 域名（包括 `https://`）

### Q: Google/GitHub 登录失败？
**A**:
1. 检查 OAuth 应用的回调 URL 是否正确配置为：
   - Google: `https://你的域名.vercel.app/api/auth/callback/google`
   - GitHub: `https://你的域名.vercel.app/api/auth/callback/github`
2. 确保在 Vercel 中正确配置了 `GOOGLE_CLIENT_ID`/`GITHUB_ID` 等变量

### Q: 数据库连接失败？
**A**:
1. 确认 Supabase 连接字符串正确
2. 确认使用的是 **Connection pooling** URL（端口 6543）
3. 在 Supabase 中运行过数据库迁移（参考 SUPABASE_SETUP.md）

### Q: 如何查看部署日志？
**A**:
1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击 **Deployments** 标签
4. 点击具体的部署查看详细日志

## 安全提示

⚠️ **重要安全建议**:

1. **不要**在代码中硬编码任何密钥或敏感信息
2. **不要**将 `.env.local` 提交到 Git（已在 .gitignore 中）
3. **务必**使用强密码作为 `NEXTAUTH_SECRET`
4. **定期**更新 OAuth 密钥和 API 密钥
5. **使用**不同的密钥用于开发和生产环境

## 下一步

部署成功后，你可以：

1. 配置自定义域名（在 Vercel 项目设置中）
2. 设置自动部署（GitHub/GitLab 集成）
3. 监控应用性能（Vercel Analytics）
4. 查看访问日志和错误报告

---

**需要帮助？**
- [Vercel 文档](https://vercel.com/docs)
- [Vercel 环境变量文档](https://vercel.com/docs/environment-variables)
