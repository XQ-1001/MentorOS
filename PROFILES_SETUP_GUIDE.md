# Profiles 表设置指南

## 问题诊断

如果你遇到以下问题：
- ✅ 可以修改用户名和头像
- ✅ 修改后立即显示正确
- ❌ **但登出重登后显示回原来的用户名和头像**

**根本原因**：`profiles` 表在 Supabase 数据库中不存在或未正确设置。

## 解决方案

按照以下步骤在 Supabase 中设置 profiles 表：

### 第 1 步：打开 Supabase SQL Editor

1. 访问你的 Supabase 项目: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. 点击左侧菜单的 **SQL Editor**
3. 点击 **New query** 创建新查询

### 第 2 步：运行 SQL 脚本

复制 `supabase-setup-profiles.sql` 文件的全部内容，粘贴到 SQL Editor 中，然后点击 **Run** 按钮。

这个脚本会：
- ✅ 创建 `public.profiles` 表
- ✅ 设置 Row Level Security (RLS) 策略
- ✅ 创建自动触发器（新用户注册时自动创建 profile）
- ✅ 为现有用户补充 profile 记录

### 第 3 步：验证设置

在 SQL Editor 中运行以下查询来验证：

```sql
-- 查看所有 profiles 记录
SELECT * FROM public.profiles;

-- 查看触发器是否存在
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 查看 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**预期结果**：
- `profiles` 表应该为每个用户都有一条记录
- 触发器 `on_auth_user_created` 应该存在
- 应该有 3 个 RLS 策略（SELECT、UPDATE、INSERT）

### 第 4 步：测试应用

1. 在你的应用中登录
2. 打开用户设置，修改用户名和头像
3. 保存更改
4. **登出**
5. **重新登录**
6. 现在应该能看到你修改的用户名和头像了！✅

## Profiles 表结构

```sql
public.profiles
├── id (UUID, PRIMARY KEY) - 对应 auth.users.id
├── display_name (TEXT) - 用户自定义名字
├── avatar_url (TEXT) - 用户头像 URL
├── created_at (TIMESTAMPTZ) - 创建时间
└── updated_at (TIMESTAMPTZ) - 更新时间
```

## 工作原理

### 数据流

```
用户注册
    ↓
auth.users 表插入新记录
    ↓
触发器 handle_new_user() 自动执行
    ↓
public.profiles 表自动创建对应记录
    ↓
前端通过 useProfile hook 读取 profiles 表
    ↓
显示用户自定义的名字和头像 ✅
```

### 更新流程

```
用户修改设置
    ↓
API: PUT /api/user/profile
    ↓
更新 public.profiles 表
    ↓
触发 profileUpdated 事件
    ↓
useProfile hook 重新获取数据
    ↓
所有组件自动更新 ✅
```

## 常见问题

### Q: 为什么不直接用 auth.users 表？
A: auth.users 是 Supabase 的内部表，不建议直接修改。而且 OAuth 登录会覆盖 user_metadata。使用独立的 profiles 表更安全、更灵活。

### Q: 如果新用户注册，会自动创建 profile 吗？
A: 是的！触发器 `on_auth_user_created` 会在新用户注册时自动创建对应的 profile 记录。

### Q: 现有用户怎么办？
A: SQL 脚本中的 Step 6 会为所有现有用户补充 profile 记录，使用他们原来的 OAuth 信息作为初始值。

### Q: RLS 策略是什么？
A: Row Level Security - 确保用户只能查看和修改自己的 profile，不能访问其他用户的数据。

## 故障排除

如果设置后仍然有问题：

1. **检查 profiles 表是否有数据**
   ```sql
   SELECT COUNT(*) FROM public.profiles;
   ```

2. **检查你的用户 ID 是否有对应 profile**
   ```sql
   SELECT * FROM public.profiles
   WHERE id = 'YOUR_USER_ID';
   ```

3. **检查浏览器控制台错误信息**
   - 打开浏览器开发者工具 (F12)
   - 查看 Console 标签页
   - 尝试修改和保存用户设置
   - 看是否有错误信息

4. **检查 API 日志**
   - 查看终端运行 `npm run dev` 的输出
   - 保存用户设置时应该看到类似：
     ```
     [API] Profile update request received
     [API] Authenticated user: xxx-xxx-xxx
     [API] Update successful: [...]
     ```

## 完成！

设置完成后，你的用户资料系统就完全正常工作了：
- ✅ 登出重登后正确显示修改的用户名和头像
- ✅ 数据持久化保存在数据库中
- ✅ 新用户自动创建 profile
- ✅ 安全的 RLS 策略保护用户数据
