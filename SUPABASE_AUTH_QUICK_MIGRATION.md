# Supabase Auth 快速迁移指南（无用户数据版）

## ⚡ 真实时间评估

由于项目**没有用户数据**，迁移时间大幅缩短：

| 步骤 | 时间 | 说明 |
|------|------|------|
| 1. 安装依赖 | **2 分钟** | npm install |
| 2. 配置环境变量 | **3 分钟** | 从 Supabase 复制 |
| 3. 创建 Supabase client | **5 分钟** | 2个文件 |
| 4. 更新认证页面 | **15 分钟** | 修改登录/注册逻辑 |
| 5. 替换中间件 | **5 分钟** | 1个文件 |
| 6. 删除 NextAuth 代码 | **3 分钟** | 删除3-4个文件 |
| 7. 更新 Prisma Schema | **5 分钟** | 简化用户表 |
| 8. 运行迁移 | **2 分钟** | prisma migrate |
| 9. 测试 | **10 分钟** | 测试登录/注册 |

**总计**: **约 50 分钟** ⏱️

---

## 🎯 快速迁移步骤

### 前提条件（你需要做的）

1. **启用 Supabase Authentication**
   - 访问: https://supabase.com/dashboard/project/geyuwlowtwivtxrpqnwh/auth/providers
   - 启用 **Email/Password**
   - （可选）启用 **Google OAuth**
   - （可选）启用 **GitHub OAuth**

2. **获取配置信息**
   - 访问: https://supabase.com/dashboard/project/geyuwlowtwivtxrpqnwh/settings/api
   - 复制:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 步骤 1: 安装依赖（2分钟）

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

### 步骤 2: 配置环境变量（3分钟）

添加到 `.env.local`:
```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://geyuwlowtwivtxrpqnwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的-anon-key
```

---

### 步骤 3: 创建 Supabase Client（5分钟）

**客户端**: `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**服务端**: `lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

### 步骤 4: 更新登录页面（15分钟）

修改 `app/auth/signin/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignIn() {
  const router = useRouter();
  const supabase = createClient();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      // 注册
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      // 登录
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push('/');
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  // ... 保持 UI 不变
}
```

---

### 步骤 5: 创建 OAuth 回调（3分钟）

创建 `app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/', request.url))
}
```

---

### 步骤 6: 替换中间件（5分钟）

替换 `middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

### 步骤 7: 删除 NextAuth 代码（3分钟）

删除以下文件:
```bash
rm -rf app/api/auth/[...nextauth]
rm -rf app/api/auth/register
rm lib/auth.ts
```

卸载依赖:
```bash
npm uninstall next-auth @next-auth/prisma-adapter bcryptjs @types/bcryptjs
```

---

### 步骤 8: 简化 Prisma Schema（5分钟）

修改 `prisma/schema.prisma`:
```prisma
model User {
  id            String         @id // Supabase Auth UUID
  email         String?        @unique
  name          String?
  conversations Conversation[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

// 删除这些模型（Supabase 管理）
// model Account { ... }
// model Session { ... }
// model VerificationToken { ... }

// 保留业务模型
model Conversation {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?
  language  String    @default("en")
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId, createdAt])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String
  content        String       @db.Text
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}
```

运行迁移:
```bash
npx prisma migrate dev --name remove_nextauth
```

---

### 步骤 9: 测试（10分钟）

1. ✅ 邮箱注册
2. ✅ 邮箱登录
3. ✅ Google OAuth（如果配置）
4. ✅ GitHub OAuth（如果配置）
5. ✅ 退出登录
6. ✅ 创建对话
7. ✅ 发送消息

---

## 📋 完整检查清单

**准备阶段**（你做）:
- [ ] 在 Supabase Dashboard 启用 Authentication
- [ ] 获取 `NEXT_PUBLIC_SUPABASE_URL`
- [ ] 获取 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**代码修改**（我做）:
- [ ] 安装 Supabase 依赖
- [ ] 创建 Supabase client 文件
- [ ] 更新登录/注册页面
- [ ] 创建 OAuth 回调路由
- [ ] 替换中间件
- [ ] 删除 NextAuth 相关代码
- [ ] 简化 Prisma Schema
- [ ] 运行数据库迁移
- [ ] 测试所有功能

---

## 🚀 现在就开始？

**如果你准备好了**:
1. 提供 Supabase 配置:
   - `NEXT_PUBLIC_SUPABASE_URL` (应该是 `https://geyuwlowtwivtxrpqnwh.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (需要你从 Dashboard 获取)

2. 我立即开始迁移，**预计 50 分钟完成**！

**如果还在犹豫**:
- 继续使用当前的 NextAuth 配置
- 完全没问题，很多大项目都这样用
- 随时可以迁移

**你决定了吗？** 🤔
