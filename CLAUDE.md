# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Resonance Lab** - A bilingual (English/Chinese) AI mentorship platform inspired by Steve Jobs' philosophy. Users engage in conversational interactions with an AI mentor that embodies Jobs' thinking and communication style.

## Development Commands

### Running the Application
```bash
npm run dev        # Start development server on http://localhost:3000
npm run build      # Build for production (includes Prisma client generation)
npm start          # Start production server
npm run lint       # Run ESLint
```

### Database Operations
```bash
npx prisma generate              # Generate Prisma client
npx prisma db push               # Push schema changes to database
npx prisma studio                # Open Prisma Studio GUI
```

Note: Prisma client generation runs automatically on `npm install` (postinstall) and before builds.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth (email-based)
- **Storage**: Supabase Storage (user avatars)
- **AI**: OpenRouter API (configurable model, defaults to Gemini 3 Pro)

### Key Architecture Patterns

**Authentication Flow**:
- Middleware in `middleware.ts` handles session refresh and route protection
- All non-auth routes require authentication
- Supabase client utilities:
  - `lib/supabase/client.ts` - Browser client for client components
  - `lib/supabase/server.ts` - Server client for server components and API routes
  - Both use `@supabase/ssr` for proper cookie handling

**Database Architecture**:
- **User Management**: Dual system using Supabase Auth + Prisma User model
  - Supabase Auth: Authentication and session management
  - Prisma User table: Application data (conversations, relationships)
  - User IDs synchronized between systems (Supabase UUID = Prisma User.id)
- **Profile Management**: Separate `profiles` table in Supabase for user metadata
  - Stores `display_name` and `avatar_url`
  - Accessed via `useProfile` hook which provides event-driven updates
  - Custom event system (`profileUpdated`) for real-time UI synchronization
- **Conversations**: Prisma manages conversation history with cascade deletes
- User upsert pattern in API routes ensures Prisma User exists when needed

**AI Chat Architecture**:
- **System Prompt**: Bilingual Steve Jobs persona defined in `constants.ts`
  - Single unified prompt handles both English and Chinese responses
  - Strict conversational tone requirements (no numbered lists, natural flow)
  - Full context in `lib/steveJobsContext.ts`
- **Streaming**: Server-Sent Events for real-time AI responses
  - Client service (`services/geminiService.ts`) manages conversation history
  - API route (`app/api/chat/route.ts`) proxies to OpenRouter with streaming
  - SSE format: `data: {content}` followed by `data: [DONE]`
- **Title Generation**: AI-powered conversation titles
  - API route (`app/api/generate-title/route.ts`) generates concise 10-char titles
  - Uses Gemini 2.0 Flash (google/gemini-2.0-flash-001) by default - stable production model
  - Fallback to keyword extraction if API fails
  - Configurable via `OPENROUTER_TITLE_MODEL` environment variable
- **Language Detection**: Auto-detects output language from user input

**State Management**:
- React state for UI (themes, conversations, messages)
- Custom hooks for shared logic (`lib/hooks/useProfile.ts`)
- Event-driven updates for cross-component communication

### Directory Structure

```
app/
├── api/                    # API routes
│   ├── chat/              # AI chat endpoint (OpenRouter proxy)
│   ├── generate-title/    # AI-powered title generation (Claude Haiku)
│   ├── conversations/     # CRUD for conversations
│   ├── messages/          # Message management
│   └── user/              # User profile and avatar endpoints
├── auth/                  # Authentication pages
│   ├── signin/
│   ├── callback/          # OAuth callback handler
│   └── auth-code-error/
├── page.tsx               # Main chat interface (client component)
└── layout.tsx             # Root layout with theme support

components/
├── Header.tsx             # App header with settings modal trigger
├── ConversationList.tsx   # Sidebar conversation history
├── MessageBubble.tsx      # Chat message display
├── InputArea.tsx          # Message input with send button
├── ExportDialog.tsx       # Export conversation feature
├── UserSettingsModal.tsx  # User profile and settings management
├── ResonanceWave.tsx      # Loading animation
└── ui/                    # Shadcn UI components

lib/
├── supabase/              # Supabase client utilities
│   ├── client.ts          # Browser client
│   └── server.ts          # Server client
├── hooks/                 # Custom React hooks
│   └── useProfile.ts      # Profile data management with event listeners
├── steveJobsContext.ts    # Complete AI persona context (~60KB)
├── languageDetection.ts   # Detects output language from user input
├── prisma.ts              # Prisma client singleton
└── utils.ts               # Utility functions (cn for classnames)

services/
└── geminiService.ts       # Client-side AI service wrapper

prisma/
└── schema.prisma          # Database schema (User, Conversation, Message)
```

### Environment Variables

Required in `.env.local`:
```bash
# Supabase (Database + Auth + Storage)
NEXT_PUBLIC_SUPABASE_URL=        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Anonymous key
DATABASE_URL=                     # PostgreSQL connection string (use pooler URL)

# OpenRouter API (AI)
OPENROUTER_API_KEY=              # API key for main chat
OPENROUTER_MODEL=                # Model ID for main chat (default: google/gemini-3-pro-preview)
OPENROUTER_BASE_URL=             # API base URL (default: https://openrouter.ai/api/v1)
OPENROUTER_TITLE_MODEL=          # (Optional) Model for title generation (default: google/gemini-2.0-flash-001)
OPENROUTER_TITLE_API_KEY=        # (Optional) API key for title generation (if different from main key)
```

See `docs/setup/SUPABASE_SETUP.md` and `docs/setup/VERCEL_SETUP.md` for detailed configuration guides.

## Important Development Notes

### Supabase Storage Setup
- Avatar storage bucket must be created manually in Supabase dashboard
- RLS policies required for upload/download access
- See `docs/setup/STORAGE_SETUP_INSTRUCTIONS.md` for detailed setup
- Test scripts available in `scripts/` directory

### Profile Management
- Profiles table separate from auth.users (Supabase Auth)
- Setup guide available at `docs/setup/PROFILES_SETUP_GUIDE.md`
- Use `useProfile` hook to access profile data - it handles event-driven updates
- Profile updates should dispatch `profileUpdated` custom event for UI synchronization

### AI Prompt Engineering
- System prompt is bilingual and strictly enforced
- Never modify conversational tone requirements without understanding full context
- Language mixing (code-switching) is intentional and part of the Steve Jobs persona
- The prompt explicitly prohibits certain formatting (numbered lists, section markers)
- Full context documentation at `docs/context/STEVE_JOBS_CONTEXT.md`

### Path Aliases
- Use `@/*` for imports (maps to project root)
- Examples: `@/lib/utils`, `@/components/Header`

### Prisma Client Generation
- Automatically generated on install and build
- Build script uses placeholder DATABASE_URL if not set (for CI/CD)
- See `scripts/generate-prisma.sh` for the logic

### Middleware Behavior
- All routes require authentication except `/auth/*`
- Session refresh happens on every request
- Auth errors redirect to `/auth/signin`
